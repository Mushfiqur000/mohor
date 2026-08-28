// ==========================================================================
// MOHOR CLOTHINGS — auth.js
// Firebase Auth (compat) + customer profile / order history.
// ==========================================================================

window.currentUser = null;

const db = window.db;
const auth = firebase.auth();

function notify(message, type) {
    if (typeof window.showToast === 'function') window.showToast(message, type);
    else alert(message);
}
function tr(key) { return (typeof window.t === 'function') ? window.t(key) : key; }

function setBtnLoading(evtOrBtn, isLoading) {
    let btn = null;
    if (evtOrBtn) {
        if (evtOrBtn.tagName || evtOrBtn.nodeType) {
            btn = evtOrBtn;
        } else if (evtOrBtn.currentTarget) {
            btn = evtOrBtn.currentTarget;
        } else if (evtOrBtn.target && typeof evtOrBtn.target.closest === 'function') {
            btn = evtOrBtn.target.closest('button, input[type="submit"]');
        }
    }
    if (!btn) return;
    btn.classList.toggle('is-loading', isLoading);
    btn.disabled = isLoading;
}

// --- Account sidebar open/close ---
const accountOverlay = document.getElementById('accountOverlay');
const accountSidebar = document.getElementById('accountSidebar');
const openAccountBtn = document.getElementById('openAccountBtn');
const closeAccountBtn = document.getElementById('closeAccountBtn');

window.closeAccountSidebar = function() {
    if (accountSidebar) accountSidebar.classList.remove('active');
    if (accountOverlay) accountOverlay.classList.remove('active');
};
window.openAccountSidebar = function() {
    if (accountSidebar) accountSidebar.classList.add('active');
    if (accountOverlay) accountOverlay.classList.add('active');
};

// Global click delegation so any #openAccountBtn on any page triggers the sidebar
document.addEventListener('click', (e) => {
    const btn = e.target.closest('#openAccountBtn, .open-account-btn');
    if (btn) {
        e.preventDefault();
        window.openAccountSidebar();
    }
});

if (closeAccountBtn) closeAccountBtn.addEventListener('click', window.closeAccountSidebar);
if (accountOverlay) accountOverlay.addEventListener('click', window.closeAccountSidebar);

// --- Auth view switching (Login / Signup / Forgot Password) ---
window.showAuthView = function(viewName) {
    const loginCont = document.getElementById('loginFormContainer');
    const signupCont = document.getElementById('signupFormContainer');
    const forgotCont = document.getElementById('forgotPasswordContainer');

    if (loginCont) loginCont.style.display = (viewName === 'login') ? 'block' : 'none';
    if (signupCont) signupCont.style.display = (viewName === 'signup') ? 'block' : 'none';
    if (forgotCont) forgotCont.style.display = (viewName === 'forgot') ? 'block' : 'none';
};

// --- Toggle between Login / Signup views inside the Account sidebar ---
window.toggleAuthMode = function() {
    const loginCont = document.getElementById('loginFormContainer');
    const signupCont = document.getElementById('signupFormContainer');
    if (!loginCont || !signupCont) return;
    const showingLogin = loginCont.style.display !== 'none';
    window.showAuthView(showingLogin ? 'signup' : 'login');
};

// --- One canonical place to push saved profile data into every form on the
// site that can use it (Account > Profile tab, and any checkout fields that
// are still empty). Consolidates what used to be four separate, slightly
// inconsistent copies of this logic scattered across pages. ---
function applyUserDataToForms(data) {
    if (!data) return;
    const name = data.customerName || data.name || data.fullName || (window.currentUser && window.currentUser.displayName) || '';
    const phone = data.phone || data.customerPhone || data.phoneNumber || data.mobile || '';
    const address = data.address || data.deliveryAddress || data.fullAddress || '';

    const setVal = (id, val) => { const el = document.getElementById(id); if (el && val) el.value = val; };
    const fillIfEmpty = (id, val) => { const el = document.getElementById(id); if (el && val && !el.value) el.value = val; };

    // Profile tab always mirrors the saved profile.
    setVal('profileName', name);
    setVal('profilePhone', phone);
    setVal('profileAddress', address);

    // Checkout convenience fields: only prefill if the visitor hasn't typed
    // something already, so we never clobber an in-progress edit.
    fillIfEmpty('custName', name); fillIfEmpty('checkoutName', name);
    fillIfEmpty('custPhone', phone); fillIfEmpty('checkoutPhone', phone);
    fillIfEmpty('deliveryAddress', address); fillIfEmpty('checkoutAddress', address);
}
window.applyUserDataToForms = applyUserDataToForms;

async function loadUserData(uid) {
    try {
        const userDoc = await db.collection('users').doc(uid).get();
        if (userDoc.exists) applyUserDataToForms(userDoc.data());
    } catch (e) { console.error('Error loading user profile data:', e); }
}

async function loadUserOrders(uid) {
    const container = document.getElementById('userOrderHistoryContainer');
    if (!container) return;
    container.innerHTML = `<p class="order-history-loading">${tr('accLoadingOrders') || 'Loading orders…'}</p>`;

    // Resolve current user info if available
    const current = window.currentUser || (firebase && firebase.auth && firebase.auth().currentUser) || null;
    const email = current && current.email ? current.email : null;

    try {
        let querySnapshot = null;

        // 1) Prefer querying by userId (if clients saved it)
        if (uid) {
            try {
                querySnapshot = await db.collection('orders').where('userId', '==', uid).orderBy('orderDate', 'desc').get();
            } catch (indexErr) {
                // fallback without index
                querySnapshot = await db.collection('orders').where('userId', '==', uid).get();
            }
        }

        // 2) If no results, try matching by user email (many orders are created by guests with email)
        if ((!querySnapshot || querySnapshot.empty) && email) {
            try {
                querySnapshot = await db.collection('orders').where('userEmail', '==', email).orderBy('orderDate', 'desc').get();
            } catch (indexErr) {
                querySnapshot = await db.collection('orders').where('userEmail', '==', email).get();
            }
        }

        // 3) If still empty, try phone stored on profile (best-effort)
        if ((!querySnapshot || querySnapshot.empty) && current) {
            const userDoc = await db.collection('users').doc(current.uid).get();
            const phone = userDoc.exists ? (userDoc.data().phone || userDoc.data().customerPhone || null) : null;
            if (phone) {
                try {
                    querySnapshot = await db.collection('orders').where('customerPhone', '==', phone).orderBy('orderDate', 'desc').get();
                } catch (indexErr) {
                    querySnapshot = await db.collection('orders').where('customerPhone', '==', phone).get();
                }
            }
        }

        if (!querySnapshot || querySnapshot.empty) {
            container.innerHTML = `<p class="order-history-empty" style="color:var(--ink-muted, #888); font-size:0.9rem;">${tr('accNoOrders') || 'No past orders found.'}</p>`;
            return;
        }

        const rows = [];
        querySnapshot.forEach((doc) => {
            const order = doc.data();
            // Handle Firestore Timestamp or ISO string
            let orderDate = order.orderDate || order.createdAt || null;
            let actualDate = null;
            if (orderDate && typeof orderDate.toDate === 'function') actualDate = orderDate.toDate();
            else if (orderDate) actualDate = new Date(orderDate);
            else actualDate = new Date();

            const formattedDate = actualDate.toLocaleDateString();
            const formattedTime = actualDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            const status = order.status ? String(order.status) : 'Pending';
            
            const custName = order.customerName || order.custName || order.name || '';
            const custPhone = order.customerPhone || order.custPhone || order.phone || '';
            const address = order.deliveryAddress || order.address || '';

            rows.push({
                id: doc.id,
                total: Number(order.totalAmount) || 0,
                status,
                date: formattedDate,
                time: formattedTime,
                items: order.items || [],
                raw: actualDate.getTime(),
                customerName: custName,
                customerPhone: custPhone,
                deliveryAddress: address
            });
        });
        rows.sort((a, b) => (a.raw < b.raw ? 1 : -1));

        const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
        
        container.innerHTML = rows.map(r => {
            const statusClass = 'status-' + r.status.toLowerCase().replace(/\s+/g, '');
            return `
            <div class="order-history-item" style="background:#141414; border:1px solid #282828; border-radius:8px; padding:18px; margin-bottom:16px;">
                <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:12px; flex-wrap:wrap;">
                    <div>
                        <div style="font-weight:700; font-size:0.95rem;">Order ID: <a href="order.html?id=${esc(r.id)}" style="color:#C9A14A; text-decoration:underline;">${esc(r.id)}</a></div>
                        <div style="color:var(--ink-muted, #888); font-size:0.85rem; margin-top:4px;">${esc(r.date)} • ${esc(r.time)}</div>
                        ${r.customerName ? `<div style="font-size:0.85rem; color:#aaa; margin-top:4px;"><strong>Customer:</strong> ${esc(r.customerName)}</div>` : ''}
                        ${r.deliveryAddress ? `<div style="font-size:0.85rem; color:#888; margin-top:2px;"><strong>Address:</strong> ${esc(r.deliveryAddress)}</div>` : ''}
                    </div>
                    <div style="text-align:right">
                        <div class="oh-total" style="font-weight:700; font-size:1.1rem; color:#C9A14A;">৳${r.total}</div>
                        <div class="oh-status status-pill ${statusClass}" style="margin-top:6px; display:inline-block; padding:3px 10px; border-radius:12px; font-size:11px; font-weight:700; text-transform:uppercase;">${esc(r.status)}</div>
                    </div>
                </div>

                <div style="margin-top:14px; display:flex; gap:8px; flex-wrap:wrap;">
                    <a class="btn btn-outline btn-sm" href="order.html?id=${esc(r.id)}" style="text-decoration:none; padding:6px 14px; font-size:12px;">View Details</a>
                    <button type="button" class="btn btn-ghost btn-sm" style="padding:6px 14px; font-size:12px;" onclick="(function(btn){ const items=btn.closest('.order-history-item').querySelector('.order-items'); if(items) items.style.display = (items.style.display === 'none' || !items.style.display) ? 'block' : 'none'; })(this)">Toggle items</button>
                </div>

                <div class="order-items" style="display:none; margin-top:12px; border-top:1px solid #282828; padding-top:10px;">
                    ${r.items.map(it => `<div style="padding:8px 10px; border:1px solid #282828; margin-bottom:6px; border-radius:6px; font-size:0.85rem; display:flex; justify-content:space-between; align-items:center; background:#181818;"><div><strong>${esc(it.name || it.title || 'Item')}</strong> ${it.size || it.variant ? `<span style="color:#888;">(${esc(it.size || it.variant)})</span>` : ''}</div><div>qty: ${esc(it.qty || it.quantity || 1)} — ৳${esc((it.qty || it.quantity || 1) * (it.price || it.unitPrice || 0))}</div></div>`).join('')}
                </div>
            </div>`;
        }).join('');
    } catch (e) {
        console.error('Error loading order history:', e);
        container.innerHTML = `<p class="order-history-empty" style="color:#e06650; font-size:0.9rem;">Could not load past orders.</p>`;
    }
}
window.loadUserOrders = loadUserOrders;

auth.onAuthStateChanged(async (user) => {
    window.currentUser = user;
    const authView = document.getElementById('authView');
    const profileView = document.getElementById('profileView');

    if (user) {
        if (authView) authView.style.display = 'none';
        if (profileView) profileView.style.display = 'block';
        const emailDisplay = document.getElementById('userProfileEmail');
        if (emailDisplay) emailDisplay.innerText = user.email;
        const avatarInitial = document.getElementById('profileAvatarInitial');
        if (avatarInitial) avatarInitial.innerText = (user.displayName || user.email || '?').trim().charAt(0).toUpperCase();

        await loadUserData(user.uid);
        await loadUserOrders(user.uid);
    } else {
        if (authView) authView.style.display = 'block';
        if (profileView) profileView.style.display = 'none';
    }
});

window.handleSignup = async function(evt) {
    const btnTarget = evt ? (evt.currentTarget || (evt.target && evt.target.closest ? evt.target.closest('button') : null)) : null;
    const nameInput = document.getElementById('signupName');
    const emailInput = document.getElementById('signupEmail');
    const passInput = document.getElementById('signupPassword');

    const name = nameInput ? nameInput.value.trim() : '';
    const email = emailInput ? emailInput.value.trim() : '';
    const password = passInput ? passInput.value.trim() : '';

    if (!email || !password) { notify(window.currentLang === 'en' ? 'Please enter email and password.' : 'অনুগ্রহ করে ইমেইল ও পাসওয়ার্ড দিন।', 'error'); return; }

    setBtnLoading(btnTarget, true);
    try {
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        if (name) await userCredential.user.updateProfile({ displayName: name });

        await db.collection('users').doc(userCredential.user.uid).set({
            name: name, customerName: name, email: email, createdAt: new Date().toISOString()
        });

        notify(window.currentLang === 'en' ? 'Account created successfully!' : 'অ্যাকাউন্ট সফলভাবে তৈরি হয়েছে!', 'success');
    } catch (error) {
        notify((window.currentLang === 'en' ? 'Signup failed: ' : 'সাইন আপ ব্যর্থ হয়েছে: ') + error.message, 'error');
    } finally {
        setBtnLoading(btnTarget, false);
    }
};

window.handleLogin = async function(evt) {
    const btnTarget = evt ? (evt.currentTarget || (evt.target && evt.target.closest ? evt.target.closest('button') : null)) : null;
    const emailInput = document.getElementById('loginEmail');
    const passInput = document.getElementById('loginPassword');
    const email = emailInput ? emailInput.value.trim() : '';
    const password = passInput ? passInput.value.trim() : '';

    if (!email || !password) { notify(window.currentLang === 'en' ? 'Please enter email and password.' : 'অনুগ্রহ করে ইমেইল ও পাসওয়ার্ড দিন।', 'error'); return; }

    setBtnLoading(btnTarget, true);
    try {
        await auth.signInWithEmailAndPassword(email, password);
        notify(window.currentLang === 'en' ? 'Logged in successfully!' : 'সফলভাবে লগইন হয়েছে!', 'success');
    } catch (error) {
        notify((window.currentLang === 'en' ? 'Login failed: ' : 'লগইন ব্যর্থ হয়েছে: ') + error.message, 'error');
    } finally {
        setBtnLoading(btnTarget, false);
    }
};

window.handleLogout = async function(evt) {
    const btnTarget = evt ? (evt.currentTarget || (evt.target && evt.target.closest ? evt.target.closest('button') : null)) : null;
    setBtnLoading(btnTarget, true);
    try {
        await auth.signOut();
        notify(window.currentLang === 'en' ? 'Logged out successfully.' : 'সফলভাবে লগ আউট হয়েছে।', 'success');
    } catch (error) {
        notify((window.currentLang === 'en' ? 'Logout error: ' : 'লগ আউট এরর: ') + error.message, 'error');
    } finally {
        setBtnLoading(btnTarget, false);
    }
};

window.saveUserProfile = async function(evt) {
    const btnTarget = evt ? (evt.currentTarget || (evt.target && evt.target.closest ? evt.target.closest('button') : null)) : null;
    if (!window.currentUser) { notify(window.currentLang === 'en' ? 'You must be logged in to save an address.' : 'ঠিকানা সেভ করতে অবশ্যই লগইন থাকতে হবে।', 'error'); return; }

    const nameInput = document.getElementById('profileName');
    const phoneInput = document.getElementById('profilePhone');
    const addressInput = document.getElementById('profileAddress');

    const nameToSave = nameInput ? nameInput.value.trim() : '';
    const phone = phoneInput ? phoneInput.value.trim() : '';
    const address = addressInput ? addressInput.value.trim() : '';

    setBtnLoading(btnTarget, true);
    try {
        let updatePayload = { phone, address };
        if (nameToSave) { updatePayload.name = nameToSave; updatePayload.customerName = nameToSave; }

        await db.collection('users').doc(window.currentUser.uid).set(updatePayload, { merge: true });
        notify(window.currentLang === 'en' ? 'Profile saved successfully!' : 'প্রোফাইল সফলভাবে সেভ হয়েছে!', 'success');
    } catch (error) {
        notify((window.currentLang === 'en' ? 'Error saving profile: ' : 'প্রোফাইল সেভ করতে সমস্যা: ') + error.message, 'error');
    } finally {
        setBtnLoading(btnTarget, false);
    }
};

// --- Password Visibility Toggle Handler ---
window.togglePasswordVisibility = function(inputId, btn) {
    const passwordInput = document.getElementById(inputId);
    if (!passwordInput) return;

    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        btn.textContent = '🙈';
    } else {
        passwordInput.type = 'password';
        btn.textContent = '👁️';
    }
};

// --- Password Reset Handler ---
window.handleForgotPassword = async function(evt) {
    if (evt) evt.preventDefault();

    const btnTarget = evt ? (evt.currentTarget || (evt.target && evt.target.closest ? evt.target.closest('button') : null)) : null;
    const resetEmailInput = document.getElementById('resetEmail');
    const loginEmailInput = document.getElementById('loginEmail');
    const email = (resetEmailInput && resetEmailInput.value.trim()) || (loginEmailInput && loginEmailInput.value.trim()) || '';
    const isBengali = (window.currentLang === 'bn');

    if (!email) {
        notify(isBengali ? 'অনুগ্রহ করে ইমেইল এড্রেসটি দিন।' : 'Please enter your email address.', 'error');
        return;
    }

    setBtnLoading(btnTarget, true);
    try {
        await auth.sendPasswordResetEmail(email);
        notify(isBengali ? 'পাসওয়ার্ড রিসেট লিঙ্ক সফলভাবে পাঠানো হয়েছে!' : 'Password reset link sent successfully!', 'success');

        const resetBtn = btnTarget || document.querySelector('#forgotPasswordContainer .btn');
        if (resetBtn) {
            const label = resetBtn.querySelector('.btn-label');
            if (label) label.textContent = isBengali ? 'লিঙ্ক সফলভাবে পাঠানো হয়েছে!' : 'Link Sent Successfully!';
        }

        const successNotice = document.getElementById('forgotSuccessNotice');
        if (successNotice) {
            successNotice.style.display = 'block';
            successNotice.innerHTML = `
                <strong style="color:#C9A14A; display:block; margin-bottom:6px;">
                    📧 ${isBengali ? 'ইমেইল পাঠানো হয়েছে:' : 'Reset Link Sent to'} ${email}
                </strong>
                <p style="margin:0 0 8px 0; font-size:0.82rem;">
                    ${isBengali ? 'নতুন পাসওয়ার্ড তৈরি করতে ইমেলের ভেতরের লিঙ্কে ক্লিক বা কপি করুন।' : 'Check your email inbox and click or copy the reset link inside.'}
                </p>
                <div style="background:rgba(0,0,0,0.3); padding:10px 12px; border-radius:6px; font-size:0.78rem; line-height:1.5;">
                    <strong style="color:#e06650; display:block; margin-bottom:4px;">
                        ⚠️ ${isBengali ? 'ইমেইল পাচ্ছেন না? স্প্যাম ফোল্ডার চেক করুন:' : 'Can\'t find the email? Check Spam Folder:'}
                    </strong>
                    <ul style="margin:4px 0 0 16px; padding:0; color:#ccc;">
                        <li>${isBengali ? 'গুগল মেইল (Gmail) এর <strong>Spam / Junk</strong> অথবা <strong>Promotions</strong> ট্যাব চেক করুন।' : 'Check your Gmail <strong>Spam / Junk</strong> or <strong>Promotions</strong> tab.'}</li>
                        <li>${isBengali ? 'প্রেরকের ইমেইল থাকবে: <code>noreply@mohor-app.firebaseapp.com</code>' : 'Sender address: <code>noreply@mohor-app.firebaseapp.com</code>'}</li>
                        <li>${isBengali ? 'ভবিষ্যতে মেসেজ সরাসরি ইনবক্সে পেতে ইমেইলটি খুলে <strong>"Report as Not Spam"</strong> এ ক্লিক করুন।' : 'Click <strong>"Report as Not Spam"</strong> so future emails land in your main inbox.'}</li>
                        <li>${isBengali ? 'এরপর লিঙ্কে ক্লিক করে নতুন পাসওয়ার্ড সেট করুন।' : 'Copy or click the reset link to create your new password.'}</li>
                    </ul>
                </div>
            `;
        }
    } catch (error) {
        notify((isBengali ? 'রিসেট ব্যর্থ হয়েছে: ' : 'Reset failed: ') + error.message, 'error');
    } finally {
        setBtnLoading(btnTarget, false);
    }
};
