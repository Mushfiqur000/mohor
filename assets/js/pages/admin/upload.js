import { api } from '/assets/js/core/api.js';

/** Converts common image files to a compact WebP/JPEG upload around 100–150 KB. */
export async function resizeImage(file, max = 1600, quality = 0.82) {
  let source;
  try { source = await createImageBitmap(file); } catch {
    source = await new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
      img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Could not read this image.')); };
      img.src = url;
    });
  }
  const width = source.width, height = source.height;
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d', { alpha: true });
  if (!context) throw new Error('Your browser cannot prepare this image.');
  const toBlob = (type, q) => new Promise(resolve => canvas.toBlob(resolve, type, q));
  const sizes = [max, 1400, 1200, 1000, 800];
  const qualities = [quality, 0.74, 0.66, 0.58, 0.5];
  let best = null;
  for (const limit of sizes) {
    const scale = Math.min(1, limit / Math.max(width, height));
    canvas.width = Math.max(1, Math.round(width * scale));
    canvas.height = Math.max(1, Math.round(height * scale));
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.drawImage(source, 0, 0, canvas.width, canvas.height);
    for (const q of qualities) {
      const blob = await toBlob('image/webp', q);
      if (!blob || blob.type !== 'image/webp') continue;
      if (!best || blob.size < best.size) best = blob;
      if (blob.size <= 150 * 1024) {
        source.close?.();
        return blob;
      }
    }
  }
  source.close?.();
  if (best) return best;
  throw new Error('This browser could not convert the image to WebP.');
}

/** Uploads one file; returns the public URL. */
export async function uploadImage(file, name = 'image') {
  const blob = await resizeImage(file);
  const res = await api(`/api/admin/upload?name=${encodeURIComponent(name.slice(0, 60))}`, { method: 'POST', raw: blob, headers: { 'Content-Type': blob.type } });
  return res.url;
}
