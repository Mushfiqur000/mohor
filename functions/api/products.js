export async function onRequestGet({ request, env }) {
  const id = new URL(request.url).searchParams.get('id');

  if (id) {
    const result = await env.DB.prepare('SELECT * FROM products WHERE id = ? LIMIT 1')
      .bind(id)
      .first();
    if (!result) {
      return Response.json({ error: 'Product not found' }, { status: 404 });
    }
    return Response.json(result);
  }

  const { results } = await env.DB.prepare(
    'SELECT * FROM products ORDER BY displayOrder ASC'
  ).all();
  return Response.json(results);
}
