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

function setBtnLoading(evt, isLoading) {
    const btn = evt && evt.currentTarget;
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

if (openAccountBtn) openAccountBtn.addEventListener('click', () => window.openAccountSidebar());
if (closeAccountBtn) closeAccountBtn.addEventListener('click', window.closeAccountSidebar);
if (accountOverlay) accountOverlay.addEventListener('click', window.closeAccountSidebar);

// --- Toggle between Login / Signup views inside the Account sidebar ---
window.toggleAuthMode = function() {
    const loginCont = document.getElementById('loginFormContainer');
    const signupCont = document.getElementById('signupFormContainer');
    if (!loginCont || !signupCont) return;
    const showingLogin = loginCont.style.display !== 'none';
    loginCont.style.display = showingLogin ? 'none' : 'block';
    signupCont.style.display = showingLogin ? 'block' : 'none';
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
    container.innerHTML = `<p class="order-history-loading">${tr('accLoadingOrders')}</p>`;

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
            container.innerHTML = `<p class="order-history-empty">${tr('accNoOrders')}</p>`;
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
            const status = order.status ? String(order.status) : 'New';
            rows.push({ id: doc.id, total: Number(order.totalAmount) || 0, status, date: formattedDate, time: formattedTime, items: order.items || [], raw: actualDate.getTime() });
        });
        rows.sort((a, b) => (a.raw < b.raw ? 1 : -1));

        const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
        container.innerHTML = rows.map(r => `
            <div class="order-history-item">
                <div style="display:flex; justify-content:space-between; align-items:center; gap:12px;">
                    <div>
                        <div style="font-weight:700;">Order ID: <a href="admin.html?order=${r.id}" target="_blank">${esc(r.id)}</a></div>
                        <div style="color:var(--ink-muted); font-size:0.9rem; margin-top:6px;">${esc(r.date)} • ${esc(r.time)}</div>
                    </div>
                    <div style="text-align:right">
                        <div class="oh-total">৳${r.total}</div>
                        <div class="oh-status" style="margin-top:6px;">${esc(r.status)}</div>
                    </div>
                </div>

                <div style="margin-top:12px; display:flex; gap:8px;">
                    <a class="btn btn-outline" href="order.html?id=${r.id}">View</a>
                    <button type="button" class="btn btn-ghost" onclick="(function(btn){ const items=btn.closest('.order-history-item').querySelector('.order-items'); if(items) items.style.display = (items.style.display === 'none' || !items.style.display) ? 'block' : 'none'; })(this)">Toggle items</button>
                </div>

                <div class="order-items" style="display:none; margin-top:10px;">
                    ${rows.length ? '' : ''}
                    ${r.items.map(it => `<div style=\"padding:8px 10px; border:1px solid var(--border); margin-bottom:6px; border-radius:6px;\"><strong>${esc(it.name || it.title || 'Item')}</strong> — qty: ${esc(it.qty || it.quantity || 1)} — ৳${esc(it.price || it.unitPrice || 0)}</div>`).join('')}
                </div>
            </div>`).join('');
    } catch (e) {
        console.error('Error loading order history:', e);
        container.innerHTML = `<p class="order-history-empty">Could not load past orders.</p>`;
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
    const nameInput = document.getElementById('signupName');
    const emailInput = document.getElementById('signupEmail');
    const passInput = document.getElementById('signupPassword');

    const name = nameInput ? nameInput.value.trim() : '';
    const email = emailInput ? emailInput.value.trim() : '';
    const password = passInput ? passInput.value.trim() : '';

    if (!email || !password) { notify(window.currentLang === 'en' ? 'Please enter email and password.' : 'অনুগ্রহ করে ইমেইল ও পাসওয়ার্ড দিন।', 'error'); return; }

    setBtnLoading(evt, true);
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
        setBtnLoading(evt, false);
    }
};

window.handleLogin = async function(evt) {
    const emailInput = document.getElementById('loginEmail');
    const passInput = document.getElementById('loginPassword');
    const email = emailInput ? emailInput.value.trim() : '';
    const password = passInput ? passInput.value.trim() : '';

    if (!email || !password) { notify(window.currentLang === 'en' ? 'Please enter email and password.' : 'অনুগ্রহ করে ইমেইল ও পাসওয়ার্ড দিন।', 'error'); return; }

    setBtnLoading(evt, true);
    try {
        await auth.signInWithEmailAndPassword(email, password);
        notify(window.currentLang === 'en' ? 'Logged in successfully!' : 'সফলভাবে লগইন হয়েছে!', 'success');
    } catch (error) {
        notify((window.currentLang === 'en' ? 'Login failed: ' : 'লগইন ব্যর্থ হয়েছে: ') + error.message, 'error');
    } finally {
        setBtnLoading(evt, false);
    }
};

window.handleLogout = async function(evt) {
    setBtnLoading(evt, true);
    try {
        await auth.signOut();
        notify(window.currentLang === 'en' ? 'Logged out successfully.' : 'সফলভাবে লগ আউট হয়েছে।', 'success');
    } catch (error) {
        notify((window.currentLang === 'en' ? 'Logout error: ' : 'লগ আউট এরর: ') + error.message, 'error');
    } finally {
        setBtnLoading(evt, false);
    }
};

window.saveUserProfile = async function(evt) {
    if (!window.currentUser) { notify(window.currentLang === 'en' ? 'You must be logged in to save an address.' : 'ঠিকানা সেভ করতে অবশ্যই লগইন থাকতে হবে।', 'error'); return; }

    const nameInput = document.getElementById('profileName');
    const phoneInput = document.getElementById('profilePhone');
    const addressInput = document.getElementById('profileAddress');

    const nameToSave = nameInput ? nameInput.value.trim() : '';
    const phone = phoneInput ? phoneInput.value.trim() : '';
    const address = addressInput ? addressInput.value.trim() : '';

    setBtnLoading(evt, true);
    try {
        let updatePayload = { phone, address };
        if (nameToSave) { updatePayload.name = nameToSave; updatePayload.customerName = nameToSave; }

        await db.collection('users').doc(window.currentUser.uid).set(updatePayload, { merge: true });
        notify(window.currentLang === 'en' ? 'Profile saved successfully!' : 'প্রোফাইল সফলভাবে সেভ হয়েছে!', 'success');
    } catch (error) {
        notify((window.currentLang === 'en' ? 'Error saving profile: ' : 'প্রোফাইল সেভ করতে সমস্যা: ') + error.message, 'error');
    } finally {
        setBtnLoading(evt, false);
    }
};
