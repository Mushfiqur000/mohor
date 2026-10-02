(() => {
  const token = localStorage.getItem('authToken');
  if (!token) { window.location.replace('/login.html'); return; }
  const $ = id => document.getElementById(id);
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
  const headers = () => ({ Authorization: `Bearer ${localStorage.getItem('authToken')}` });
  const applyTheme = value => {
    const theme = ['light', 'dark', 'system'].includes(value) ? value : 'system';
    if (typeof window.setTheme === 'function') window.setTheme(theme);
    else {
      localStorage.setItem('theme', theme);
      localStorage.setItem('mohor_theme', theme);
      const dark = theme === 'dark' || (theme === 'system' && matchMedia('(prefers-color-scheme: dark)').matches);
      document.documentElement.classList.toggle('dark', dark);
      document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
    }
  };
  const applyLanguage = value => {
    const lang = value === 'bn' ? 'bn' : 'en';
    if (typeof window.setLanguage === 'function') window.setLanguage(lang);
    else {
      window.currentLang = lang;
      localStorage.setItem('lang', lang);
      localStorage.setItem('mohor_lang', lang);
      document.documentElement.lang = lang;
      if (window.i18n && typeof window.i18n.updatePage === 'function') window.i18n.updatePage();
      if (typeof window.updateUIText === 'function') window.updateUIText();
    }
    const text = lang === 'bn'
      ? ['প্রোফাইল তথ্য', 'ঠিকানা বই', 'আমার অর্ডার', 'বার্তা', 'পছন্দ ও নিরাপত্তা', 'সহায়তা ও নীতিমালা']
      : ['Profile Information', 'Address Book', 'My Orders', 'Messages', 'Preferences & Settings', 'Help & Policies'];
    document.querySelectorAll('.tabs button').forEach((button, index) => {
      const badge = button.querySelector('#notificationBadge');
      button.textContent = text[index] || button.textContent;
      if (badge) button.appendChild(badge);
    });
    const title = document.querySelector('#notificationsPanel h2');
    if (title) title.textContent = lang === 'bn' ? 'বার্তা ও নোটিফিকেশন' : 'Messages & Notifications';
  };
  const api = async (path, options = {}) => {
    const response = await fetch(path, { ...options, headers: { ...headers(), ...(options.body ? { 'Content-Type': 'application/json' } : {}) } });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || 'Request failed');
    return data;
  };
  let profile = {};
  let orders = [];
  let notifications = [];

  function message(text, error = false) {
    $('accountMessage').textContent = text;
    $('accountMessage').className = error ? 'message error' : 'message success';
  }
  function setProfile(user) {
    profile = user || {};
    $('name').value = profile.name || '';
    $('email').value = profile.email || '';
    $('gender').value = profile.gender || '';
    $('phone').value = profile.phone || '';
    $('dob').value = profile.dob || '';
    $('address').value = profile.address || '';
    $('addressCopy').value = profile.address || '';
    $('profileHeading').textContent = profile.name || 'My Account';
    $('avatar').textContent = (profile.name || profile.email || 'M').charAt(0).toUpperCase();
    localStorage.setItem('authUser', JSON.stringify(profile));
  }
  function orderItems(order) {
    return Array.isArray(order.items) ? order.items : [];
  }
  function renderOrders() {
    $('orders').innerHTML = orders.length ? orders.map((order, index) => {
      const items = orderItems(order);
      const date = order.orderDate || order.created_at || order.order_date;
      const total = Number(order.totalAmount || order.total_amount || 0).toLocaleString('en-BD');
      const status = String(order.status || 'Pending');
      return `<article class="order-card"><div><strong>${esc(order.id || order.order_id)}</strong><span class="status ${esc(status.toLowerCase())}">${esc(status)}</span></div><small>${esc(date ? new Date(date).toLocaleDateString() : '')} · ${items.reduce((sum, item) => sum + Number(item.qty || item.quantity || 1), 0)} item(s)</small><b>৳${esc(total)}</b><button class="btn btn-outline details" data-order="${index}">View Details</button></article>`;
    }).join('') : '<p>No orders yet.</p>';
  }
  function renderModal(order) {
    const items = orderItems(order);
    $('modalContent').innerHTML = `<h2>Order ${esc(order.id || order.order_id)}</h2><p><strong>Status:</strong> ${esc(order.status || 'Pending')}</p><ul>${items.map(item => `<li>${esc(item.name || item.title || 'Item')} × ${esc(item.qty || item.quantity || 1)}${item.size ? ` · Size ${esc(item.size)}` : ''}${item.color ? ` · ${esc(item.color)}` : ''}</li>`).join('')}</ul><p><strong>Shipping address:</strong><br>${esc(order.deliveryAddress || order.delivery_address || '')}</p><p><strong>Total:</strong> ৳${esc(Number(order.totalAmount || order.total_amount || 0).toLocaleString('en-BD'))}</p>`;
    $('orderModal').hidden = false;
  }
  function renderNotifications() {
    const unread = notifications.filter(item => !Number(item.is_read)).length;
    const badge = $('notificationBadge');
    if (badge) { badge.textContent = unread; badge.hidden = unread === 0; }
    $('notifications').innerHTML = notifications.length ? notifications.map(item => `<article class="notification-card ${Number(item.is_read) ? '' : 'unread'}"><span class="notification-icon">${item.type === 'order' ? '📦' : item.type === 'promo' ? '✦' : '◌'}</span><div><strong>${esc(item.title)}</strong><p>${esc(item.message)}</p><small>${esc(new Date(item.created_at).toLocaleString())}</small></div>${item.link ? `<a class="btn btn-outline" href="${esc(item.link)}">View</a>` : ''}</article>`).join('') : '<p>No messages yet.</p>';
  }
  async function loadNotifications() {
    try { const data = await api('/api/notifications'); notifications = data.notifications || []; renderNotifications(); }
    catch (error) { $('notifications').innerHTML = `<p class="error">${esc(error.message)}</p>`; }
  }
  async function load() {
    try {
      const [me, orderData] = await Promise.all([api('/api/auth/me'), api('/api/orders')]);
      setProfile(me.user || me);
      orders = Array.isArray(orderData) ? orderData : orderData.orders || [];
      renderOrders();
      await loadNotifications();
    } catch (error) { message(error.message, true); }
  }
  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('[data-tab]').forEach(button => button.addEventListener('click', () => {
      document.querySelectorAll('[data-tab], .account-hub .panel').forEach(el => el.classList.remove('active'));
      button.classList.add('active');
      const panel = document.querySelector(button.dataset.tab);
      if (panel) panel.classList.add('active');
    }));
    $('profileForm').addEventListener('submit', async event => {
      event.preventDefault();
      try {
        const data = await api('/api/auth/me', { method:'PUT', body: JSON.stringify({ name:$('name').value.trim(), phone:$('phone').value.trim(), gender:$('gender').value, dob:$('dob').value, address:$('address').value.trim() }) });
        setProfile(data.user || data); message('Profile saved successfully.');
      } catch (error) { message(error.message, true); }
    });
    $('passwordForm').addEventListener('submit', async event => {
      event.preventDefault();
      if ($('newPassword').value !== $('confirmPassword').value) return message('Passwords do not match.', true);
      try { await api('/api/auth/change-password', { method:'POST', body:JSON.stringify({ currentPassword:$('currentPassword').value, newPassword:$('newPassword').value }) }); event.target.reset(); message('Password changed successfully.'); }
      catch (error) { message(error.message, true); }
    });
    $('deleteAccount').addEventListener('click', async () => {
      if (!window.confirm('Delete your account and sign out? This cannot be undone.')) return;
      try { await api('/api/auth/delete-account', { method:'DELETE' }); localStorage.removeItem('authToken'); localStorage.removeItem('authUser'); window.location.href='/login.html'; }
      catch (error) { message(error.message, true); }
    });
    $('logout').addEventListener('click', () => { localStorage.removeItem('authToken'); localStorage.removeItem('authUser'); window.location.href='/login.html'; });
    $('orders').addEventListener('click', event => { const button = event.target.closest('.details'); if (button) renderModal(orders[button.dataset.order]); });
    $('closeModal').addEventListener('click', () => { $('orderModal').hidden = true; });
    const theme = localStorage.getItem('mohorTheme') || 'system';
    $('theme').value = theme;
    $('theme').addEventListener('change', event => applyTheme(event.target.value));
    const language = localStorage.getItem('lang') || localStorage.getItem('mohor_lang') || 'en';
    if ($('language')) $('language').value = language;
    if ($('language')) $('language').addEventListener('change', event => applyLanguage(event.target.value));
    applyTheme(theme);
    applyLanguage(language);
    $('markAllNotifications').addEventListener('click', async () => {
      await api('/api/notifications/mark-read', { method:'POST', body:JSON.stringify({ markAll:true }) });
      notifications.forEach(item => { item.is_read = 1; }); renderNotifications();
    });
    load();
  });
})();
