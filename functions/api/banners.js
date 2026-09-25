export async function onRequestGet({ env }) {
  const { results } = await env.DB.prepare('SELECT * FROM banners').all();
  return Response.json(results);
}
