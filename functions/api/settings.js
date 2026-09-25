export async function onRequestGet({ env }) {
  const { results } = await env.DB.prepare('SELECT * FROM settings').all();
  return Response.json(results);
}
