import { api } from '/assets/js/core/api.js';

/** Resizes an image file to max 1600px and encodes WebP (JPEG fallback). */
export async function resizeImage(file, max = 1600, quality = 0.85) {
  if (file.type === 'image/gif') return file;
  let source;
  try { source = await createImageBitmap(file); } catch {
    source = await new Promise((resolve, reject) => {
      const img = new Image(); img.onload = () => resolve(img); img.onerror = reject; img.src = URL.createObjectURL(file);
    });
  }
  const w = source.width, h = source.height;
  const scale = Math.min(1, max / Math.max(w, h));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(w * scale); canvas.height = Math.round(h * scale);
  canvas.getContext('2d').drawImage(source, 0, 0, canvas.width, canvas.height);
  source.close?.();
  const toBlob = type => new Promise(r => canvas.toBlob(r, type, quality));
  let blob = await toBlob('image/webp');
  if (!blob || blob.type !== 'image/webp') blob = await toBlob('image/jpeg');
  return blob;
}

/** Uploads one file; returns the public URL. */
export async function uploadImage(file, name = 'image') {
  const blob = await resizeImage(file);
  const res = await api(`/api/admin/upload?name=${encodeURIComponent(name.slice(0, 60))}`, { method: 'POST', raw: blob, headers: { 'Content-Type': blob.type } });
  return res.url;
}
