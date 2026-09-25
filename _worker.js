export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === '/api/products') {
      try {
        const id = url.searchParams.get('id');
        if (id) {
          const product = await env.DB.prepare(
            'SELECT * FROM products WHERE id = ? LIMIT 1'
          ).bind(id).first();
          if (!product) {
            return Response.json({ error: 'Product not found' }, { status: 404 });
          }
          return Response.json(product);
        }

        const { results } = await env.DB.prepare(
          'SELECT * FROM products ORDER BY displayOrder ASC'
        ).all();
        return Response.json(results);
      } catch (e) {
        return Response.json({ error: e.message }, { status: 500 });
      }
    }

    if (url.pathname === '/api/settings') {
      try {
        const { results } = await env.DB.prepare('SELECT * FROM settings').all();
        return Response.json(results[0] || {});
      } catch (e) {
        return Response.json({ error: e.message }, { status: 500 });
      }
    }

    if (url.pathname === '/api/banners') {
      try {
        const { results } = await env.DB.prepare('SELECT * FROM banners').all();
        return Response.json(results);
      } catch (e) {
        return Response.json({ error: e.message }, { status: 500 });
      }
    }

    return env.ASSETS.fetch(request);
  }
};
