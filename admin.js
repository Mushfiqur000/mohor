(() => {
  const token = () => localStorage.getItem('authToken');
  const api = async (path, options = {}) => {
    const response = await fetch(path, {
      ...options,
      headers: { ...(options.body ? { 'Content-Type': 'application/json' } : {}), ...(token() ? { Authorization: 'Bearer ' + token() } : {}) }
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || `Request failed (${response.status})`);
    return data;
  };
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
  const date = value => {
    const parsed = new Date(value || 0);
    return Number.isNaN(parsed.getTime()) ? '' : parsed.toLocaleString();
  };

  window.loadAdminNotifications = async () => {
    const body = document.getElementById('notifications-table-body');
    if (!body) return;
    const data = await api('/api/admin/notifications');
    const rows = data.notifications || [];
    body.innerHTML = rows.map(item => `<tr><td>${esc(item.user_id === 'ALL' ? 'All Customers' : item.user_id)}</td><td>${esc(item.title)}</td><td>${esc(item.type)}</td><td>${esc(date(item.created_at))}</td></tr>`).join('') || '<tr><td colspan="4">No notifications sent yet.</td></tr>';
  };

  document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('notification-form');
    if (!form) return;
    const target = document.getElementById('notification-target');
    const email = document.getElementById('notification-email');
    const status = document.getElementById('notification-status');
    target.addEventListener('change', () => {
      const individual = target.value === 'CUSTOMER';
      email.hidden = !individual;
      email.required = individual;
    });
    form.addEventListener('submit', async event => {
      event.preventDefault();
      try {
        await api('/api/admin/notifications', {
          method: 'POST',
          body: JSON.stringify({
            targetUserId: target.value === 'ALL' ? 'ALL' : email.value.trim(),
            title: document.getElementById('notification-title').value.trim(),
            message: document.getElementById('notification-message').value.trim(),
            type: document.getElementById('notification-type').value,
            link: document.getElementById('notification-link').value.trim()
          })
        });
        form.reset();
        email.hidden = true;
        email.required = false;
        status.textContent = 'Notification sent.';
        await window.loadAdminNotifications();
      } catch (error) {
        status.textContent = error.message;
      }
    });
  });
})();
