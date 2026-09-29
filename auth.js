// MOHOR CLOTHINGS — API authentication and customer account UI.

const AUTH_TOKEN_KEY = 'authToken';
const AUTH_USER_KEY = 'authUser';
window.currentUser = null;

function notify(message, type) {
    if (typeof window.showToast === 'function') window.showToast(message, type);
    else alert(message);
}
function tr(key) { return typeof window.t === 'function' ? window.t(key) : key; }
function setBtnLoading(evtOrBtn, loading) {
    const btn = evtOrBtn && (evtOrBtn.tagName ? evtOrBtn : evtOrBtn.currentTarget || evtOrBtn.target?.closest?.('button'));
    if (btn) { btn.classList.toggle('is-loading', loading); btn.disabled = loading; }
}
function getAuthToken() { return localStorage.getItem(AUTH_TOKEN_KEY); }
function getAuthUser() {
    try { return JSON.parse(localStorage.getItem(AUTH_USER_KEY) || 'null'); } catch (_) { return null; }
}
function isLoggedIn() { return !!getAuthToken(); }
function setAuth(token, user) {
    if (token) localStorage.setItem(AUTH_TOKEN_KEY, token);
    if (user) localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
    window.currentUser = user || null;
}
function logout() {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(AUTH_USER_KEY);
    window.currentUser = null;
    updateAuthUI(null);
}
window.getAuthToken = getAuthToken;
window.getAuthUser = getAuthUser;
window.isLoggedIn = isLoggedIn;
window.logout = logout;

async function api(path, options = {}) {
    const headers = { ...(options.body ? { 'Content-Type': 'application/json' } : {}), ...(options.headers || {}) };
    const token = getAuthToken();
    if (token) headers.Authorization = `Bearer ${token}`;
    const response = await fetch(path, { ...options, headers });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || `Request failed (${response.status})`);
    return data;
}
function applyUserDataToForms(data) {
    if (!data) return;
    const name = data.customerName || data.name || data.fullName || window.currentUser?.displayName || '';
    const phone = data.phone || data.customerPhone || data.phoneNumber || data.mobile || '';
    const address = data.address || data.deliveryAddress || data.delivery_address || data.fullAddress || '';
    const set = (id, value, onlyEmpty) => {
        const el = document.getElementById(id);
        if (el && value && (!onlyEmpty || !el.value)) el.value = value;
    };
    set('profileName', name, false); set('profilePhone', phone, false); set('profileAddress', address, false);
    ['custName', 'checkoutName'].forEach(id => set(id, name, true));
    ['custPhone', 'checkoutPhone'].forEach(id => set(id, phone, true));
    ['deliveryAddress', 'checkoutAddress'].forEach(id => set(id, address, true));
}
window.applyUserDataToForms = applyUserDataToForms;

async function loadUserOrders() {
    const container = document.getElementById('userOrderHistoryContainer');
    if (!container || !isLoggedIn()) return;
    container.innerHTML = `<p class="order-history-loading">${tr('accLoadingOrders') || 'Loading orders…'}</p>`;
    try {
        const data = await api('/api/orders');
        const rows = (Array.isArray(data) ? data : data.orders || []).map(order => {
            const date = new Date(order.orderDate || order.createdAt || Date.now());
            const items = Array.isArray(order.items) ? order.items : [];
            const savings = Number(order.totalSavings) || items.reduce((sum, item) =>
                sum + Math.max(0, Number(item.regularPrice || item.price) - Number(item.price || 0)) * Number(item.qty || 1), 0);
            return { ...order, date: date.toLocaleDateString(), time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), items, savings };
        });
        if (!rows.length) { container.innerHTML = `<p class="order-history-empty">${tr('accNoOrders') || 'No past orders found.'}</p>`; return; }
        const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
        container.innerHTML = rows.map(r => `<div class="order-history-item">
            <div class="oh-header"><div><div class="oh-id">Order ID: <a href="/order/?id=${esc(r.id)}">${esc(r.id)}</a></div>
            <div class="oh-date">${esc(r.date)} &bull; ${esc(r.time)}</div><div class="oh-address">${esc(r.deliveryAddress || r.delivery_address || '')}</div></div>
            <div class="oh-right"><div class="oh-total">\u09F3${Number(r.totalAmount || 0)}</div><div class="oh-status status-pill">${esc(r.status || 'Pending')}</div></div></div>
            ${r.savings > 0 ? `<div class="oh-savings">🎉 You saved \u09F3${r.savings} on this order!</div>` : ''}
            <div class="oh-actions"><a class="btn btn-outline btn-sm" href="/order/?id=${esc(r.id)}">View Details</a></div>
        </div>`).join('');
    } catch (error) {
        console.error('Unable to load past orders:', error);
        container.innerHTML = `<p class="order-history-empty">${tr('accNoOrders') || 'We could not load your orders right now. Please try again.'}</p>`;
    }
}
window.loadUserOrders = loadUserOrders;

function updateAuthUI(user) {
    window.currentUser = user;
    const authView = document.getElementById('authView'), profileView = document.getElementById('profileView');
    if (authView) authView.style.display = user ? 'none' : 'block';
    if (profileView) profileView.style.display = user ? 'block' : 'none';
    if (user) {
        const email = document.getElementById('userProfileEmail'); if (email) email.innerText = user.email || '';
        const avatar = document.getElementById('profileAvatarInitial'); if (avatar) avatar.innerText = (user.displayName || user.email || '?')[0].toUpperCase();
        applyUserDataToForms(user); loadUserOrders();
    }
}
window.showAuthView = function(view) {
    ['login', 'signup', 'forgot'].forEach(name => { const el = document.getElementById(name + (name === 'login' ? 'FormContainer' : name === 'signup' ? 'FormContainer' : 'PasswordContainer')); if (el) el.style.display = name === view ? 'block' : 'none'; });
};
window.toggleAuthMode = function() { window.showAuthView(document.getElementById('loginFormContainer')?.style.display !== 'none' ? 'signup' : 'login'); };
window.closeAccountSidebar = function() {
    document.getElementById('accountSidebar')?.classList.remove('active');
    document.getElementById('accountOverlay')?.classList.remove('active');
    document.body.classList.remove('drawer-open');
};
window.openAccountSidebar = function() {
    document.getElementById('accountSidebar')?.classList.add('active');
    document.getElementById('accountOverlay')?.classList.add('active');
    document.body.classList.add('drawer-open');
};
document.addEventListener('click', e => {
    if (e.target.closest('#openAccountBtn, .open-account-btn')) {
        e.preventDefault();
        window.openAccountSidebar();
    } else if (e.target.closest('#closeAccountBtn, #accountOverlay')) {
        e.preventDefault();
        window.closeAccountSidebar();
    }
});

window.handleSignup = async function(evt) {
    const name = document.getElementById('signupName')?.value.trim() || '', email = document.getElementById('signupEmail')?.value.trim() || '', password = document.getElementById('signupPassword')?.value.trim() || '';
    if (!email || !password) return notify('Please enter email and password.', 'error');
    setBtnLoading(evt, true);
    try { const data = await api('/api/auth/register', { method: 'POST', body: JSON.stringify({ name, email, password }) }); setAuth(data.token, data.user); updateAuthUI(data.user); notify('Account created successfully!', 'success'); }
    catch (e) { notify('Signup failed: ' + e.message, 'error'); } finally { setBtnLoading(evt, false); }
};
window.handleLogin = async function(evt) {
    const email = document.getElementById('loginEmail')?.value.trim() || '', password = document.getElementById('loginPassword')?.value.trim() || '';
    if (!email || !password) return notify('Please enter email and password.', 'error');
    setBtnLoading(evt, true);
    try { const data = await api('/api/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }); setAuth(data.token, data.user); updateAuthUI(data.user); notify('Logged in successfully!', 'success'); }
    catch (e) { notify('Login failed: ' + e.message, 'error'); } finally { setBtnLoading(evt, false); }
};
window.handleLogout = function(evt) { setBtnLoading(evt, true); logout(); notify('Logged out successfully.', 'success'); setBtnLoading(evt, false); };
window.saveUserProfile = async function(evt) {
    if (!isLoggedIn()) return notify('You must be logged in to save an address.', 'error');
    const payload = { name: document.getElementById('profileName')?.value.trim() || '', phone: document.getElementById('profilePhone')?.value.trim() || '', address: document.getElementById('profileAddress')?.value.trim() || '' };
    setBtnLoading(evt, true);
    try {
        const response = await api('/api/auth/me', { method: 'PUT', body: JSON.stringify(payload) });
        const user = response.user || response;
        setAuth(getAuthToken(), user);
        applyUserDataToForms(user);
        notify('Profile saved successfully!', 'success');
    }
    catch (e) { notify('Error saving profile: ' + e.message, 'error'); } finally { setBtnLoading(evt, false); }
};
window.togglePasswordVisibility = function(id, btn) { const input = document.getElementById(id); if (input) { input.type = input.type === 'password' ? 'text' : 'password'; if (btn) btn.textContent = input.type === 'password' ? '👁️' : '🙈'; } };
window.handleForgotPassword = function() { notify('Password reset is not available yet. Please contact support.', 'error'); };

(async function initAuth() {
    const token = getAuthToken();
    if (!token) return updateAuthUI(null);
    try {
        const response = await api('/api/auth/me');
        const user = response.user || response;
        setAuth(token, user);
        updateAuthUI(user);
    }
    catch (_) { logout(); }
})();
