export default {
  async fetch(request, env) {
    const url = new URL(request.url);

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

      return payload;
    }

    // Send Telegram Order Alert
    async function notifyTelegram(order) {
      if (!env.TELEGRAM_BOT_TOKEN || !env.TELEGRAM_CHAT_ID) return;

      const message = `🛍️ *New Order Placed on MOHOR!*
*Order ID:* \`${order.id}\`
*Customer:* ${order.customer_name} (${order.customer_phone})
*Address:* ${order.delivery_address}
*Total Amount:* ৳${order.total_amount}
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
          return Response.json({ error: 'Email and password required' }, { status: 400 });
        }

        const existing = await env.DB.prepare('SELECT id FROM users WHERE email = ?').bind(email).first();
        if (existing) {
          return Response.json({ error: 'Email already registered' }, { status: 400 });
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

        return Response.json({ token, user: userObj });
      } catch (e) {
        return Response.json({ error: e.message }, { status: 500 });
      }
    }

    if (url.pathname === '/api/auth/login' && request.method === 'POST') {
      try {
        const { email, password } = await request.json();
        if (!email || !password) {
          return Response.json({ error: 'Email and password required' }, { status: 400 });
        }

        const user = await env.DB.prepare('SELECT * FROM users WHERE email = ?').bind(email).first();
        if (!user) {
          return Response.json({ error: 'Invalid email or password' }, { status: 401 });
        }

        const hashedInput = await hashPassword(password);
        // Allow placeholder bypass for initial seeded super admin setup
        const isPasswordValid =
          user.password_hash === 'admin_placeholder_hash' || user.password_hash === hashedInput;

        if (!isPasswordValid) {
          return Response.json({ error: 'Invalid email or password' }, { status: 401 });
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

        return Response.json({ token, user: userObj });
      } catch (e) {
        return Response.json({ error: e.message }, { status: 500 });
      }
    }

    if (url.pathname === '/api/auth/me' && request.method === 'GET') {
      const user = await getAuthUser(request);
      if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
      return Response.json({ user });
    }

    // --- CART SYNCHRONIZATION ROUTES ---
    if (url.pathname === '/api/cart') {
      const user = await getAuthUser(request);
      if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

      if (request.method === 'GET') {
        try {
          const row = await env.DB.prepare('SELECT cart_data FROM user_carts WHERE user_id = ?')
            .bind(user.id)
            .first();
          const cart = row ? JSON.parse(row.cart_data) : [];
          return Response.json({ cart });
        } catch (e) {
          return Response.json({ cart: [] });
        }
      }

      if (request.method === 'POST') {
        try {
          const { cart } = await request.json();
          const cartStr = JSON.stringify(cart || []);

          await env.DB.prepare(
            `INSERT INTO user_carts (user_id, cart_data, updated_at) 
             VALUES (?, ?, CURRENT_TIMESTAMP)
             ON CONFLICT(user_id) DO UPDATE SET cart_data = excluded.cart_data, updated_at = CURRENT_TIMESTAMP`
          )
            .bind(user.id, cartStr)
            .run();

          return Response.json({ success: true });
        } catch (e) {
          return Response.json({ error: e.message }, { status: 500 });
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
            if (!product) return Response.json({ error: 'Product not found' }, { status: 404 });
            return Response.json(parseJsonFields(product));
          }
          const { results } = await env.DB.prepare('SELECT * FROM products ORDER BY displayOrder ASC').all();
          return Response.json((results || []).map(parseJsonFields));
        } catch (e) {
          return Response.json({ error: e.message }, { status: 500 });
        }
      }

      // Admin CRUD Operations
      const user = await getAuthUser(request);
      if (!user || user.role !== 'admin') {
        return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
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

          return Response.json({ success: true, id: prodId });
        } catch (e) {
          return Response.json({ error: e.message }, { status: 500 });
        }
      }

      if (request.method === 'PUT') {
        try {
          const data = await request.json();
          if (!data.id) return Response.json({ error: 'Product ID required' }, { status: 400 });

          await env.DB.prepare(
            `UPDATE products SET title = ?, description = ?, price = ?, category = ?, images = ?, sizes = ?, colors = ?, displayOrder = ? WHERE id = ?`
          )
            .bind(
              stringifyForDb(data.title),
              stringifyForDb(data.description),
              Number(data.price) || 0,
              data.category || '',
              stringifyForDb(data.images),
              stringifyForDb(data.sizes),
              stringifyForDb(data.colors),
              Number(data.displayOrder) || 0,
              data.id
            )
            .run();

          return Response.json({ success: true });
        } catch (e) {
          return Response.json({ error: e.message }, { status: 500 });
        }
      }

      if (request.method === 'DELETE') {
        try {
          const id = url.searchParams.get('id') || (await request.json()).id;
          await env.DB.prepare('DELETE FROM products WHERE id = ?').bind(id).run();
          return Response.json({ success: true });
        } catch (e) {
          return Response.json({ error: e.message }, { status: 500 });
        }
      }
    }

    // --- BANNERS ROUTES ---
    if (url.pathname === '/api/banners') {
      if (request.method === 'GET') {
        try {
          const { results } = await env.DB.prepare('SELECT * FROM banners').all();
          return Response.json((results || []).map(parseJsonFields));
        } catch (e) {
          return Response.json({ error: e.message }, { status: 500 });
        }
      }

      const user = await getAuthUser(request);
      if (!user || user.role !== 'admin') {
        return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
      }

      if (request.method === 'POST') {
        try {
          const data = await request.json();
          const banId = data.id || 'ban_' + crypto.randomUUID();

          await env.DB.prepare('INSERT INTO banners (id, title, imageUrl, link, active) VALUES (?, ?, ?, ?, ?)')
            .bind(banId, data.title || '', data.imageUrl || '', data.link || '', data.active ?? 1)
            .run();

          return Response.json({ success: true, id: banId });
        } catch (e) {
          return Response.json({ error: e.message }, { status: 500 });
        }
      }

      if (request.method === 'DELETE') {
        try {
          const id = url.searchParams.get('id') || (await request.json()).id;
          await env.DB.prepare('DELETE FROM banners WHERE id = ?').bind(id).run();
          return Response.json({ success: true });
        } catch (e) {
          return Response.json({ error: e.message }, { status: 500 });
        }
      }
    }

    // --- SETTINGS ROUTES ---
    if (url.pathname === '/api/settings') {
      if (request.method === 'GET') {
        try {
          const { results } = await env.DB.prepare('SELECT * FROM settings').all();
          return Response.json(parseJsonFields(results[0] || {}));
        } catch (e) {
          return Response.json({ error: e.message }, { status: 500 });
        }
      }

      if (request.method === 'POST') {
        const user = await getAuthUser(request);
        if (!user || user.role !== 'admin') {
          return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
        }

        try {
          const body = await request.json();
          const dataStr = stringifyForDb(body);

          await env.DB.prepare(
            `INSERT INTO settings (id, data, updated_at) VALUES ('store_settings', ?, CURRENT_TIMESTAMP)
             ON CONFLICT(id) DO UPDATE SET data = excluded.data, updated_at = CURRENT_TIMESTAMP`
          )
            .bind(dataStr)
            .run();

          return Response.json({ success: true });
        } catch (e) {
          return Response.json({ error: e.message }, { status: 500 });
        }
      }
    }

    // --- ORDERS ROUTES ---
    if (url.pathname === '/api/orders') {
      if (request.method === 'POST') {
        try {
          const data = await request.json();
          const authUser = await getAuthUser(request);

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

          await env.DB.prepare(
            `INSERT INTO orders (id, user_id, user_email, customer_name, customer_phone, delivery_address, items, subtotal, total_amount, status)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
          )
            .bind(
              newOrder.id,
              newOrder.user_id,
              newOrder.user_email,
              newOrder.customer_name,
              newOrder.customer_phone,
              newOrder.delivery_address,
              newOrder.items,
              newOrder.subtotal,
              newOrder.total_amount,
              newOrder.status
            )
            .run();

          // Fire Telegram Order Notification
          await notifyTelegram(newOrder);

          return Response.json({ success: true, orderId: newOrder.id });
        } catch (e) {
          return Response.json({ error: e.message }, { status: 500 });
        }
      }

      // Read Order History
      if (request.method === 'GET') {
        const user = await getAuthUser(request);
        if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

        try {
          if (user.role === 'admin') {
            const { results } = await env.DB.prepare('SELECT * FROM orders ORDER BY created_at DESC').all();
            return Response.json((results || []).map(parseJsonFields));
          } else {
            const { results } = await env.DB.prepare(
              'SELECT * FROM orders WHERE user_id = ? OR user_email = ? ORDER BY created_at DESC'
            )
              .bind(user.id, user.email)
              .all();
            return Response.json((results || []).map(parseJsonFields));
          }
        } catch (e) {
          return Response.json({ error: e.message }, { status: 500 });
        }
      }

      // Admin Order Actions (Status update / Delete)
      const user = await getAuthUser(request);
      if (!user || user.role !== 'admin') {
        return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
      }

      if (request.method === 'PUT') {
        try {
          const { id, status } = await request.json();
          await env.DB.prepare('UPDATE orders SET status = ? WHERE id = ?').bind(status, id).run();
          return Response.json({ success: true });
        } catch (e) {
          return Response.json({ error: e.message }, { status: 500 });
        }
      }

      if (request.method === 'DELETE') {
        try {
          const id = url.searchParams.get('id') || (await request.json()).id;
          await env.DB.prepare('DELETE FROM orders WHERE id = ?').bind(id).run();
          return Response.json({ success: true });
        } catch (e) {
          return Response.json({ error: e.message }, { status: 500 });
        }
      }
    }

    // --- STATIC ASSET FALLBACK ---
    return env.ASSETS.fetch(request);
  },
};
