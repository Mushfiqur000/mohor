export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,HEAD,POST,PUT,DELETE,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    };
    const applySecurityHeaders = response => {
      const secured = new Response(response.body, response);
      secured.headers.set('X-Frame-Options', 'DENY');
      secured.headers.set('X-Content-Type-Options', 'nosniff');
      secured.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
      secured.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
      secured.headers.set('Cross-Origin-Opener-Policy', 'same-origin');
      return secured;
    };
    const json = (body, init = {}) => {
      const headers = new Headers(init.headers || {});
      Object.entries(corsHeaders).forEach(([name, value]) => headers.set(name, value));
      return applySecurityHeaders(Response.json(body, { ...init, headers }));
    };

    if (request.method === 'OPTIONS' && url.pathname.startsWith('/api/')) {
      return applySecurityHeaders(new Response(null, { status: 204, headers: corsHeaders }));
    }

    if (['/shipping', '/shipping/', '/terms', '/terms/'].includes(url.pathname)) {
      return applySecurityHeaders(Response.redirect(url.origin + '/policy/', 302));
    }

    // ==========================================
    // HELPER FUNCTIONS
    // ==========================================

    // Parse stringified JSON fields from D1 into native objects/arrays
    function parseJsonFields(obj) {
      if (!obj) return obj;
      const parsed = { ...obj };
      for (const key in parsed) {
        if (typeof parsed[key] === 'string') {
          const trimmed = parsed[key].trim();
          if (
            (trimmed.startsWith('{') && trimmed.endsWith('}')) ||
            (trimmed.startsWith('[') && trimmed.endsWith(']'))
          ) {
            try {
              parsed[key] = JSON.parse(trimmed);
            } catch (e) {
              // keep as string if parse fails
            }
          }
        }
      }
      return parsed;
    }

    // Convert object or array to JSON string for D1 insertion
    function stringifyForDb(val) {
      if (typeof val === 'object' && val !== null) {
        return JSON.stringify(val);
      }
      return val ?? '';
    }

    // Web Crypto API - Password Hashing (SHA-256)
    async function hashPassword(password) {
      const msgBuffer = new TextEncoder().encode(password);
      const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
    }

    // JWT Helpers
    function base64UrlEncode(str) {
      return btoa(str).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
    }

    function base64UrlDecode(str) {
      let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
      while (base64.length % 4) base64 += '=';
      return atob(base64);
    }

    async function createJWT(payload, secret) {
      const header = { alg: 'HS256', typ: 'JWT' };
      const encodedHeader = base64UrlEncode(JSON.stringify(header));
      const encodedPayload = base64UrlEncode(JSON.stringify(payload));
      const data = `${encodedHeader}.${encodedPayload}`;

      const key = await crypto.subtle.importKey(
        'raw',
        new TextEncoder().encode(secret || 'mohor-default-secret'),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
      );

      const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(data));
      const encodedSignature = base64UrlEncode(String.fromCharCode(...new Uint8Array(signature)));
      return `${data}.${encodedSignature}`;
    }

    async function verifyJWT(token, secret) {
      try {
        const parts = token.split('.');
        if (parts.length !== 3) return null;

        const [encodedHeader, encodedPayload, encodedSignature] = parts;
        const data = `${encodedHeader}.${encodedPayload}`;

        const key = await crypto.subtle.importKey(
          'raw',
          new TextEncoder().encode(secret || 'mohor-default-secret'),
          { name: 'HMAC', hash: 'SHA-256' },
          false,
          ['verify']
        );

        const sigString = base64UrlDecode(encodedSignature);
        const sigBuf = new Uint8Array(sigString.length);
        for (let i = 0; i < sigString.length; i++) {
          sigBuf[i] = sigString.charCodeAt(i);
        }

        const isValid = await crypto.subtle.verify('HMAC', key, sigBuf, new TextEncoder().encode(data));
        if (!isValid) return null;

        return JSON.parse(base64UrlDecode(encodedPayload));
      } catch (e) {
        return null;
      }
    }

    // Get current authenticated user from request Authorization header
    async function getAuthUser(req) {
      const authHeader = req.headers.get('Authorization') || req.headers.get('authorization');
      if (!authHeader || !authHeader.startsWith('Bearer ')) return null;

      const token = authHeader.split(' ')[1];
      const payload = await verifyJWT(token, env.JWT_SECRET);
      if (!payload) return null;

      // Force super admin email to always have admin role
      if (payload.email === 'mushfiqurrahman2222@gmail.com') {
        payload.role = 'admin';
      }

      const profile = await getUserProfile(payload.id);
      if (!profile || String(profile.status || '').toLowerCase() === 'deleted') return null;
      return payload;
    }

    async function getUserProfile(userId) {
      return env.DB.prepare('SELECT * FROM users WHERE id = ? LIMIT 1').bind(userId).first();
    }

    async function getTableColumns(tableName) {
      const { results } = await env.DB.prepare(`PRAGMA table_info("${tableName}")`).all();
      return new Set((results || []).map(column => column.name));
    }

    async function ensureNotificationsTable() {
      await env.DB.prepare(`CREATE TABLE IF NOT EXISTS notifications (
        id TEXT PRIMARY KEY, user_id TEXT NOT NULL, title TEXT NOT NULL,
        message TEXT NOT NULL, type TEXT DEFAULT 'system', link TEXT DEFAULT '',
        is_read INTEGER DEFAULT 0, created_at TEXT DEFAULT CURRENT_TIMESTAMP
      )`).run();
    }

    async function createNotification({ userId, title, message, type = 'system', link = '' }) {
      await ensureNotificationsTable();
      await env.DB.prepare(
        'INSERT INTO notifications (id, user_id, title, message, type, link, is_read) VALUES (?, ?, ?, ?, ?, ?, 0)'
      ).bind('ntf_' + crypto.randomUUID(), userId, title, message, type, link).run();
    }

    function smsPhone(value) {
      const digits = String(value || '').replace(/[^\d+]/g, '');
      if (digits.startsWith('+')) return digits;
      if (digits.startsWith('880')) return `+${digits}`;
      if (digits.startsWith('0')) return `+88${digits}`;
      return digits;
    }

    async function sendCustomerSms(phone, message) {
      const to = smsPhone(phone);
      if (!to || to.length < 10) return;
      // Configure a provider through SMS_API_URL and SMS_API_KEY. The provider
      // receives the same small JSON contract regardless of gateway vendor.
      if (!env.SMS_API_URL) {
        console.warn('SMS_API_URL is not configured; customer SMS skipped');
        return;
      }
      try {
        const response = await fetch(env.SMS_API_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(env.SMS_API_KEY ? { Authorization: `Bearer ${env.SMS_API_KEY}` } : {}),
          },
          body: JSON.stringify({ to, message, sender: env.SMS_SENDER || 'MOHOR' }),
        });
        if (!response.ok) console.error('Customer SMS provider rejected the message:', response.status);
      } catch (error) {
        console.error('Customer SMS delivery error:', error);
      }
    }

    function orderStatusMessage(status, orderId) {
      const id = orderId || 'unknown';
      const normalizedStatus = String(status || '').trim().toLowerCase();
      const messages = {
        pending: `Your MOHOR order #${id} has been received and is currently under review.`,
        confirmed: `Thank you! Your MOHOR order #${id} is confirmed and is currently being prepared for delivery.`,
        shipped: `Great news! Your MOHOR order #${id} has been handed over to the courier and is on its way to you.`,
        completed: `Your MOHOR order #${id} has been successfully delivered—thank you for choosing MOHOR!`,
        cancelled: `Your MOHOR order #${id} has been cancelled; please reach out to our support team if you have any questions.`,
      };
      return messages[normalizedStatus] || `Your MOHOR order #${id} status is now ${status}.`;
    }

    function publicUser(profile, fallback = {}) {
      return {
        id: profile?.id || fallback.id,
        name: profile?.name || profile?.customerName || '',
        email: profile?.email || fallback.email || '',
        phone: profile?.phone || '',
        gender: profile?.gender || '',
        dob: profile?.dob || '',
        address: profile?.address || profile?.delivery_address || '',
      };
    }

    function normalizeOrder(row) {
      const parsed = parseJsonFields(row);
      return {
        ...parsed,
        customerName: parsed.customerName ?? parsed.customer_name ?? '',
        customerPhone: parsed.customerPhone ?? parsed.customer_phone ?? '',
        deliveryAddress: parsed.deliveryAddress ?? parsed.delivery_address ?? '',
        totalAmount: parsed.totalAmount ?? parsed.total_amount ?? 0,
        orderDate: parsed.orderDate ?? parsed.order_date ?? parsed.created_at ?? null,
        items: Array.isArray(parsed.items) ? parsed.items : [],
      };
    }

    function sortOrders(rows) {
      return rows.sort((a, b) => {
        const left = Date.parse(a.orderDate || a.created_at || a.order_date || '') || 0;
        const right = Date.parse(b.orderDate || b.created_at || b.order_date || '') || 0;
        return right - left;
      });
    }

    // Send Telegram Order Alert
    async function notifyTelegram(order) {
      if (!env.TELEGRAM_BOT_TOKEN || !env.TELEGRAM_CHAT_ID) return;

      const message = `🛍️ *New Order Placed on MOHOR!*
*Order ID:* \`${order.id}\`
*Customer:* ${order.customer_name} (${order.customer_phone})
*Address:* ${order.delivery_address}
*Total Amount:* \u09F3${order.total_amount}
*Status:* ${order.status}`;

      try {
        await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: env.TELEGRAM_CHAT_ID,
            text: message,
            parse_mode: 'Markdown',
          }),
        });
      } catch (e) {
        console.error('Telegram alert error:', e);
      }
    }

    // ==========================================
    // API ROUTES
    // ==========================================

    // --- AUTHENTICATION ROUTES ---
    if (url.pathname === '/api/auth/register' && request.method === 'POST') {
      try {
        const { email, password, name, phone } = await request.json();
        if (!email || !password) {
          return json({ error: 'Email and password required' }, { status: 400 });
        }

        const existing = await env.DB.prepare('SELECT id FROM users WHERE email = ?').bind(email).first();
        if (existing) {
          return json({ error: 'Email already registered' }, { status: 400 });
        }

        const userId = 'usr_' + crypto.randomUUID();
        const passwordHash = await hashPassword(password);
        const role = email === 'mushfiqurrahman2222@gmail.com' ? 'admin' : 'customer';

        await env.DB.prepare(
          'INSERT INTO users (id, email, password_hash, name, phone, role) VALUES (?, ?, ?, ?, ?, ?)'
        )
          .bind(userId, email, passwordHash, name || '', phone || '', role)
          .run();

        const userObj = { id: userId, email, name: name || '', phone: phone || '', role };
        const token = await createJWT(userObj, env.JWT_SECRET);

        return json({ token, user: userObj });
      } catch (e) {
        return json({ error: e.message }, { status: 500 });
      }
    }

    if (url.pathname === '/api/auth/login' && request.method === 'POST') {
      try {
        const { email, password } = await request.json();
        if (!email || !password) {
          return json({ error: 'Email and password required' }, { status: 400 });
        }

        const user = await env.DB.prepare('SELECT * FROM users WHERE email = ?').bind(email).first();
        if (!user) {
          return json({ error: 'Invalid email or password' }, { status: 401 });
        }

        const hashedInput = await hashPassword(password);
        // Allow placeholder bypass for initial seeded super admin setup
        const isPasswordValid =
          user.password_hash === 'admin_placeholder_hash' || user.password_hash === hashedInput;

        if (!isPasswordValid) {
          return json({ error: 'Invalid email or password' }, { status: 401 });
        }

        const role = email === 'mushfiqurrahman2222@gmail.com' ? 'admin' : user.role || 'customer';

        // Update password hash if it was placeholder
        if (user.password_hash === 'admin_placeholder_hash') {
          await env.DB.prepare('UPDATE users SET password_hash = ?, role = ? WHERE id = ?')
            .bind(hashedInput, role, user.id)
            .run();
        }

        const userObj = { id: user.id, email: user.email, name: user.name, phone: user.phone, role };
        const token = await createJWT(userObj, env.JWT_SECRET);

        return json({ token, user: userObj });
      } catch (e) {
        return json({ error: e.message }, { status: 500 });
      }
    }

    if (url.pathname === '/api/auth/me' && request.method === 'GET') {
      const user = await getAuthUser(request);
      if (!user) return json({ error: 'Unauthorized' }, { status: 401 });
      const profile = await getUserProfile(user.id);
      if (!profile) return json({ error: 'Unauthorized' }, { status: 401 });
      return json({ user: publicUser(profile, user) });
    }

    if (url.pathname === '/api/auth/me' && request.method === 'PUT') {
      const user = await getAuthUser(request);
      if (!user) return json({ error: 'Unauthorized' }, { status: 401 });
      try {
        const body = await request.json();
        const name = typeof body.name === 'string' ? body.name.trim() : '';
        const phone = typeof body.phone === 'string' ? body.phone.trim() : '';
        const gender = typeof body.gender === 'string' ? body.gender.trim() : '';
        const dob = typeof body.dob === 'string' ? body.dob.trim() : '';
        const address = typeof body.address === 'string' ? body.address.trim() : '';
        if (!name || name.length > 100) return json({ error: 'A valid name is required' }, { status: 400 });
        if (phone.length > 30 || (gender && !['Female', 'Male', 'Other'].includes(gender))) {
          return json({ error: 'Please check the profile details' }, { status: 400 });
        }
        if (dob && (!/^\d{4}-\d{2}-\d{2}$/.test(dob) || Number.isNaN(Date.parse(dob)))) {
          return json({ error: 'Please enter a valid date of birth' }, { status: 400 });
        }
        if (address.length > 1000) return json({ error: 'Address is too long' }, { status: 400 });
        const available = await getTableColumns('users');
        for (const [column, type] of [['gender', 'TEXT'], ['dob', 'TEXT'], ['address', 'TEXT']]) {
          if (!available.has(column)) {
            await env.DB.prepare(`ALTER TABLE users ADD COLUMN ${column} ${type}`).run();
            available.add(column);
          }
        }
        const updates = [];
        const values = [];
        if (available.has('name')) { updates.push('name = ?'); values.push(name || ''); }
        if (available.has('customerName')) { updates.push('customerName = ?'); values.push(name || ''); }
        if (available.has('phone')) { updates.push('phone = ?'); values.push(phone || ''); }
        if (available.has('gender')) { updates.push('gender = ?'); values.push(gender); }
        if (available.has('dob')) { updates.push('dob = ?'); values.push(dob); }
        const addressColumn = available.has('address') ? 'address' : available.has('delivery_address') ? 'delivery_address' : null;
        if (addressColumn) { updates.push(`${addressColumn} = ?`); values.push(address || ''); }
        if (updates.length) await env.DB.prepare(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`).bind(...values, user.id).run();
        const updated = await getUserProfile(user.id);
        return json({ user: publicUser(updated || { ...user, name, phone, gender, dob, address }, user) });
      } catch (e) {
        return json({ error: e.message }, { status: 500 });
      }
    }

    if (url.pathname === '/api/auth/change-password' && request.method === 'POST') {
      const user = await getAuthUser(request);
      if (!user) return json({ error: 'Unauthorized' }, { status: 401 });
      try {
        const { currentPassword, newPassword } = await request.json();
        if (typeof currentPassword !== 'string' || typeof newPassword !== 'string' || newPassword.length < 8) {
          return json({ error: 'New password must be at least 8 characters' }, { status: 400 });
        }
        const profile = await getUserProfile(user.id);
        const currentHash = await hashPassword(currentPassword);
        if (!profile || profile.password_hash !== currentHash) {
          return json({ error: 'Current password is incorrect' }, { status: 400 });
        }
        await env.DB.prepare('UPDATE users SET password_hash = ? WHERE id = ?')
          .bind(await hashPassword(newPassword), user.id).run();
        return json({ success: true });
      } catch (e) {
        return json({ error: e.message }, { status: 500 });
      }
    }


    if (url.pathname === '/api/auth/delete-account' && request.method === 'DELETE') {
      const user = await getAuthUser(request);
      if (!user) return json({ error: 'Unauthorized' }, { status: 401 });
      try {
        const available = await getTableColumns('users');
        if (available.has('status')) {
          await env.DB.prepare('UPDATE users SET status = ? WHERE id = ?').bind('deleted', user.id).run();
        } else {
          await env.DB.prepare('DELETE FROM users WHERE id = ?').bind(user.id).run();
        }
        return json({ success: true, logout: true });
      } catch (e) {
        return json({ error: e.message }, { status: 500 });
      }
    }

    if (url.pathname === '/api/notifications' && request.method === 'GET') {
      const user = await getAuthUser(request);
      if (!user) return json({ error: 'Unauthorized' }, { status: 401 });
      try {
        await ensureNotificationsTable();
        const { results = [] } = await env.DB.prepare(
          'SELECT * FROM notifications WHERE user_id = ? OR user_id = ? ORDER BY created_at DESC'
        ).bind(user.id, 'ALL').all();
        return json({ notifications: Array.isArray(results) ? results : [] }, { status: 200 });
      } catch (e) {
        return json({ notifications: [] }, { status: 200 });
      }
    }

    if (url.pathname === '/api/notifications/mark-read' && request.method === 'POST') {
      const user = await getAuthUser(request);
      if (!user) return json({ error: 'Unauthorized' }, { status: 401 });
      try {
        await ensureNotificationsTable();
        const body = await request.json();
        if (body.markAll) {
          await env.DB.prepare('UPDATE notifications SET is_read = 1 WHERE user_id = ? OR user_id = ?')
            .bind(user.id, 'ALL').run();
        } else if (body.notificationId) {
          await env.DB.prepare('UPDATE notifications SET is_read = 1 WHERE id = ? AND (user_id = ? OR user_id = ?)')
            .bind(body.notificationId, user.id, 'ALL').run();
        } else {
          return json({ error: 'notificationId or markAll is required' }, { status: 400 });
        }
        return json({ success: true });
      } catch (e) {
        return json({ error: e.message }, { status: 500 });
      }
    }

    if (url.pathname === '/api/admin/notifications') {
      const admin = await getAuthUser(request);
      if (!admin || admin.role !== 'admin') return json({ error: 'Forbidden' }, { status: 403 });
      try {
        await ensureNotificationsTable();
        if (request.method === 'GET') {
          const { results } = await env.DB.prepare('SELECT * FROM notifications ORDER BY created_at DESC LIMIT 200').all();
          return json({ notifications: results || [] });
        }
        if (request.method === 'POST') {
          const body = await request.json();
          const title = typeof body.title === 'string' ? body.title.trim() : '';
          const message = typeof body.message === 'string' ? body.message.trim() : '';
          if (!title || !message) return json({ error: 'Title and message are required' }, { status: 400 });
          let target = body.targetUserId || 'ALL';
          if (target !== 'ALL' && typeof target === 'string' && target.includes('@')) {
            const recipient = await env.DB.prepare('SELECT id FROM users WHERE email = ? LIMIT 1').bind(target).first();
            if (!recipient) return json({ error: 'Customer email was not found' }, { status: 404 });
            target = recipient.id;
          }
          await createNotification({ userId: target, title, message, type: body.type, link: body.link });
          return json({ success: true });
        }
        return json({ error: 'Method not allowed' }, { status: 405 });
      } catch (e) {
        return json({ error: e.message }, { status: 500 });
      }
    }

    // --- CART SYNCHRONIZATION ROUTES ---
    if (url.pathname === '/api/cart') {
      const user = await getAuthUser(request);
      if (!user) return json({ error: 'Unauthorized' }, { status: 401 });

      if (request.method === 'GET') {
        try {
          const row = await env.DB.prepare('SELECT cart_data FROM user_carts WHERE user_id = ?')
            .bind(user.id)
            .first();
          const cart = row ? JSON.parse(row.cart_data) : [];
          return json({ cart, items: cart });
        } catch (e) {
          return json({ cart: [], items: [] });
        }
      }

      if (request.method === 'POST') {
        try {
          const body = await request.json();
          const cart = Array.isArray(body.cart) ? body.cart : body.items;
          const cartStr = JSON.stringify(cart || []);

          await env.DB.prepare(
            `INSERT INTO user_carts (user_id, cart_data, updated_at) 
             VALUES (?, ?, CURRENT_TIMESTAMP)
             ON CONFLICT(user_id) DO UPDATE SET cart_data = excluded.cart_data, updated_at = CURRENT_TIMESTAMP`
          )
            .bind(user.id, cartStr)
            .run();

          return json({ success: true });
        } catch (e) {
          return json({ error: e.message }, { status: 500 });
        }
      }
    }

    // --- PRODUCTS ROUTES ---
    if (url.pathname === '/api/products') {
      if (request.method === 'GET') {
        try {
          const id = url.searchParams.get('id');
          if (id) {
            const product = await env.DB.prepare('SELECT * FROM products WHERE id = ? LIMIT 1')
              .bind(id)
              .first();
            if (!product) return json({ error: 'Product not found' }, { status: 404 });
            return json(parseJsonFields(product));
          }
          const { results } = await env.DB.prepare('SELECT * FROM products ORDER BY displayOrder ASC').all();
          return json((results || []).map(parseJsonFields));
        } catch (e) {
          return json({ error: e.message }, { status: 500 });
        }
      }

      // Admin CRUD Operations
      const user = await getAuthUser(request);
      if (!user || user.role !== 'admin') {
        return json({ error: 'Forbidden: Admin access required' }, { status: 403 });
      }

      if (request.method === 'POST') {
        try {
          const data = await request.json();
          const prodId = data.id || 'prod_' + crypto.randomUUID();

          await env.DB.prepare(
            `INSERT INTO products (id, title, description, price, category, images, sizes, colors, displayOrder)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
          )
            .bind(
              prodId,
              stringifyForDb(data.title),
              stringifyForDb(data.description),
              Number(data.price) || 0,
              data.category || '',
              stringifyForDb(data.images),
              stringifyForDb(data.sizes),
              stringifyForDb(data.colors),
              Number(data.displayOrder) || 0
            )
            .run();

          return json({ success: true, id: prodId });
        } catch (e) {
          return json({ error: e.message }, { status: 500 });
        }
      }

      if (request.method === 'PUT') {
        try {
          const data = await request.json();
          data.id = data.id || url.searchParams.get('id');
          if (!data.id) return json({ error: 'Product ID required' }, { status: 400 });
          const allowed = ['title', 'description', 'price', 'category', 'images', 'sizes', 'colors', 'displayOrder', 'thumbnail', 'originalPrice', 'quantity', 'regularPrice', 'salePrice'];
          const columns = allowed.filter(column => Object.prototype.hasOwnProperty.call(data, column));
          if (!columns.length) return json({ success: true });
          const values = columns.map(column => ['title', 'description', 'images', 'sizes', 'colors'].includes(column)
            ? stringifyForDb(data[column])
            : data[column]);
          await env.DB.prepare(
            `UPDATE products SET ${columns.map(column => `"${column}" = ?`).join(', ')} WHERE id = ?`
          ).bind(...values, data.id).run();

          return json({ success: true });
        } catch (e) {
          return json({ error: e.message }, { status: 500 });
        }
      }

      if (request.method === 'DELETE') {
        try {
          const id = url.searchParams.get('id') || (await request.json()).id;
          await env.DB.prepare('DELETE FROM products WHERE id = ?').bind(id).run();
          return json({ success: true });
        } catch (e) {
          return json({ error: e.message }, { status: 500 });
        }
      }
    }

    // --- BANNERS ROUTES ---
    if (url.pathname === '/api/banners') {
      if (request.method === 'PUT') {
        try {
          const data = await request.json();
          if (!data.id) return json({ error: 'Banner ID required' }, { status: 400 });
          const columns = ['title', 'subtitle', 'imageUrl', 'link', 'buttonText', 'order', 'objectPosition', 'active']
            .filter(column => Object.prototype.hasOwnProperty.call(data, column));
          if (columns.length) {
            await env.DB.prepare(
              `UPDATE banners SET ${columns.map(column => `"${column}" = ?`).join(', ')} WHERE id = ?`
            ).bind(...columns.map(column => data[column]), data.id).run();
          }
          return json({ success: true });
        } catch (e) {
          return json({ error: e.message }, { status: 500 });
        }
      }

      if (request.method === 'GET') {
        try {
          const { results } = await env.DB.prepare('SELECT * FROM banners').all();
          return json((results || []).map(parseJsonFields));
        } catch (e) {
          return json({ error: e.message }, { status: 500 });
        }
      }

      const user = await getAuthUser(request);
      if (!user || user.role !== 'admin') {
        return json({ error: 'Forbidden: Admin access required' }, { status: 403 });
      }

      if (request.method === 'POST') {
        try {
          const data = await request.json();
          const banId = data.id || 'ban_' + crypto.randomUUID();

          await env.DB.prepare('INSERT INTO banners (id, title, imageUrl, link, active) VALUES (?, ?, ?, ?, ?)')
            .bind(banId, data.title || '', data.imageUrl || '', data.link || '', data.active ?? 1)
            .run();

          return json({ success: true, id: banId });
        } catch (e) {
          return json({ error: e.message }, { status: 500 });
        }

      }

      if (request.method === 'DELETE') {
        try {
          const id = url.searchParams.get('id') || (await request.json()).id;
          await env.DB.prepare('DELETE FROM banners WHERE id = ?').bind(id).run();
          return json({ success: true });
        } catch (e) {
          return json({ error: e.message }, { status: 500 });
        }
      }
    }

    // --- SETTINGS ROUTES ---
    if (url.pathname === '/api/settings') {
      if (request.method === 'GET') {
        try {
          const { results } = await env.DB.prepare('SELECT * FROM settings').all();
          return json(parseJsonFields(results[0] || {}));
        } catch (e) {
          return json({ error: e.message }, { status: 500 });
        }
      }

      if (request.method === 'POST' || request.method === 'PUT') {
        const user = await getAuthUser(request);
        if (!user || user.role !== 'admin') {
          return json({ error: 'Forbidden: Admin access required' }, { status: 403 });
        }

        try {
          const body = await request.json();
          const columnsInfo = await env.DB.prepare('PRAGMA table_info(settings)').all();
          const available = new Set((columnsInfo.results || []).map(column => column.name));
          const id = body.id || url.searchParams.get('id') || 'storefront';
          const updates = Object.keys(body).filter(column => column !== 'id' && available.has(column));
          if (available.has('data') && !updates.length) {
            updates.push('data');
            body.data = body;
          }
          if (available.has('id')) {
            if (updates.length) {
              const values = updates.map(column => stringifyForDb(body[column]));
              await env.DB.prepare(
                `INSERT INTO settings (id, ${updates.map(column => `"${column}"`).join(', ')})
                 VALUES (?, ${updates.map(() => '?').join(', ')})
                 ON CONFLICT(id) DO UPDATE SET ${updates.map(column => `"${column}" = excluded."${column}"`).join(', ')}`
              ).bind(id, ...values).run();
            }
          }

          return json({ success: true });
        } catch (e) {
          return json({ error: e.message }, { status: 500 });
        }
      }
    }

    // --- ORDERS ROUTES ---
    if (url.pathname === '/api/orders' || url.pathname === '/api/admin/orders') {
      if (request.method === 'GET') {
        const authUser = await getAuthUser(request);
        if (!authUser) return json({ error: 'Unauthorized' }, { status: 401 });
        try {
          const available = await getTableColumns('orders');
          if (authUser.role === 'admin') {
            const { results } = await env.DB.prepare('SELECT * FROM orders').all();
            return json({ orders: sortOrders((results || []).map(normalizeOrder)) });
          }
          const filters = [];
          const values = [];
          if (available.has('user_id')) { filters.push('user_id = ?'); values.push(authUser.id); }
          else if (available.has('userId')) { filters.push('userId = ?'); values.push(authUser.id); }
          if (available.has('user_email')) { filters.push('user_email = ?'); values.push(authUser.email); }
          else if (available.has('userEmail')) { filters.push('userEmail = ?'); values.push(authUser.email); }
          if (!filters.length) return json({ orders: [] });
          const { results } = await env.DB.prepare(
            `SELECT * FROM orders WHERE ${filters.join(' OR ')}`
          ).bind(...values).all();
          return json({ orders: sortOrders((results || []).map(normalizeOrder)) });
        } catch (e) {
          return json({ error: e.message }, { status: 500 });
        }
      }
      if (request.method === 'POST') {
        try {
          const data = await request.json();
          const authUser = await getAuthUser(request);
          const available = await getTableColumns('orders');

          const orderId = 'ORD-' + Date.now();
          const userId = authUser ? authUser.id : data.userId || null;
          const userEmail = authUser ? authUser.email : data.userEmail || null;

          const newOrder = {
            id: orderId,
            user_id: userId,
            user_email: userEmail,
            customer_name: data.customerName || data.customer_name || 'Guest',
            customer_phone: data.customerPhone || data.customer_phone || '',
            delivery_address: data.deliveryAddress || data.delivery_address || '',
            items: stringifyForDb(data.items || []),
            subtotal: Number(data.subtotal) || 0,
            total_amount: Number(data.totalAmount || data.total_amount) || 0,
            status: 'Pending',
          };

          const fields = [
            [['id', 'order_id'], newOrder.id],
            [['user_id', 'userId'], newOrder.user_id],
            [['user_email', 'userEmail'], newOrder.user_email],
            [['customer_name', 'customerName', 'name'], newOrder.customer_name],
            [['customer_phone', 'customerPhone', 'phone'], newOrder.customer_phone],
            [['delivery_address', 'deliveryAddress', 'address'], newOrder.delivery_address],
            [['items', 'order_items'], newOrder.items],
            [['subtotal'], newOrder.subtotal],
            [['total_amount', 'totalAmount', 'total'], newOrder.total_amount],
            [['status', 'order_status'], newOrder.status],
          ];
          const selected = fields
            .map(([candidates, value]) => [candidates.find(column => available.has(column)), value])
            .filter(([column]) => column);
          const columns = selected.map(([column]) => column);
          if (!columns.length) throw new Error('The orders table has no writable columns');
          const placeholders = columns.map(() => '?').join(', ');
          await env.DB.prepare(
            `INSERT INTO orders (${columns.map(column => `"${column}"`).join(', ')}) VALUES (${placeholders})`
          ).bind(...selected.map(([, value]) => value)).run();

          // Fire Telegram Order Notification
          await notifyTelegram(newOrder);
          await sendCustomerSms(newOrder.customer_phone, orderStatusMessage('Pending', newOrder.id));

          return json({ success: true, id: newOrder.id, orderId: newOrder.id });
        } catch (e) {
          return json({ error: e.message }, { status: 500 });
        }
      }

      // Admin Order Actions (Status update / Delete)
      const user = await getAuthUser(request);
      if (!user || user.role !== 'admin') {
        return json({ error: 'Forbidden: Admin access required' }, { status: 403 });
      }

      if (request.method === 'PUT') {
        try {
          const { id, status } = await request.json();
          const order = await env.DB.prepare('SELECT * FROM orders WHERE id = ? OR order_id = ? LIMIT 1').bind(id, id).first();
          await env.DB.prepare('UPDATE orders SET status = ? WHERE id = ?').bind(status, id).run();
          if (order && (order.user_id || order.user_email)) {
            const recipient = order.user_id || order.user_email;
            const labels = { Confirmed: ['Order Confirmed', 'Your order is being prepared.'], Shipped: ['Order Shipped', 'Your order is on its way.'], Completed: ['Order Delivered', 'Your order has been delivered.'], Cancelled: ['Order Cancelled', 'Your order has been cancelled.'] };
            const notice = labels[status] || ['Order Status Updated', `Your order status is now ${status}.`];
            await createNotification({ userId: recipient, title: notice[0], message: `${notice[1]} (${id})`, type: 'order', link: `/order/?id=${encodeURIComponent(id)}` });
          }
          if (order) await sendCustomerSms(order.customer_phone || order.customerPhone || order.phone, orderStatusMessage(status, order.id || order.order_id || id));
          return json({ success: true });
        } catch (e) {
          return json({ error: e.message }, { status: 500 });
        }
      }

      if (request.method === 'DELETE') {
        try {
          const id = url.searchParams.get('id') || (await request.json()).id;
          await env.DB.prepare('DELETE FROM orders WHERE id = ?').bind(id).run();
          return json({ success: true });
        } catch (e) {
          return json({ error: e.message }, { status: 500 });
        }
      }
    }

    if (url.pathname === '/favicon.ico') {
      return applySecurityHeaders(Response.redirect(`${url.origin}/assets/favicon-32.png`, 302));
    }

    // --- STATIC ASSET FALLBACK ---
    return applySecurityHeaders(await env.ASSETS.fetch(request));
  },
};
