const MAX_BODY = 8 * 1024 * 1024;
const PHOTO_PATH = /^\/api\/gallery\/photos\/([a-f0-9]{32}(?:-thumb)?\.jpg)$/;

function jpegDimensions(bytes, maximum) {
  if (bytes.length < 4 || bytes[0] !== 255 || bytes[1] !== 216) throw new Error('Please choose a valid photo.');
  let offset = 2;
  while (offset + 8 < bytes.length) {
    if (bytes[offset++] !== 255) throw new Error('Please choose a valid photo.');
    while (bytes[offset] === 255) offset++;
    const marker = bytes[offset++];
    if (marker === 217 || marker === 218) break;
    const length = bytes[offset] * 256 + bytes[offset + 1];
    if (length < 2 || offset + length > bytes.length) break;
    if ([192, 193, 194].includes(marker)) {
      const height = bytes[offset + 3] * 256 + bytes[offset + 4];
      const width = bytes[offset + 5] * 256 + bytes[offset + 6];
      if (Math.min(width, height) < 1 || Math.max(width, height) > maximum) break;
      return { width, height };
    }
    offset += length;
  }
  throw new Error('Please choose a valid photo.');
}

async function boundedBody(request) {
  if (Number(request.headers.get('Content-Length')) > MAX_BODY) throw new Error('Photo is too large.');
  const reader = request.body?.getReader();
  if (!reader) throw new Error('Please choose a photo.');
  const chunks = [];
  let size = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.length;
    if (size > MAX_BODY) { await reader.cancel(); throw new Error('Photo is too large.'); }
    chunks.push(value);
  }
  const body = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) { body.set(chunk, offset); offset += chunk.length; }
  return body;
}

function photoRecord(object, origin) {
  const id = object.key.slice(7, -4);
  return {
    id, stage: object.customMetadata.stage,
    createdAt: object.customMetadata.createdAt,
    width: Number(object.customMetadata.width), height: Number(object.customMetadata.height),
    url: `${origin}/api/gallery/photos/${id}.jpg`,
    thumbnailUrl: `${origin}/api/gallery/photos/${id}-thumb.jpg`,
  };
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const origin = request.headers.get('Origin');
    const allowed = (env.ALLOWED_ORIGINS || '').split(',').map(value => value.trim()).filter(Boolean);
    const cors = origin && allowed.includes(origin) ? { 'Access-Control-Allow-Origin': origin, 'Vary': 'Origin' } : {};
    const json = (data, status = 200) => Response.json(data, { status, headers: { ...cors, 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' } });
    if (origin && !allowed.includes(origin)) return json({ error: 'Upload from the project page.' }, 403);
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: { ...cors, 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type', 'Access-Control-Max-Age': '86400' } });
    if (!env.PHOTOS) return json({ error: 'Shared gallery storage is not connected.' }, 503);
    if (request.method === 'GET' && PHOTO_PATH.test(url.pathname)) {
      const object = await env.PHOTOS.get('photos/'+url.pathname.split('/').pop());
      if (!object) return json({ error: 'Photo not found.' }, 404);
      return new Response(object.body, { headers: { ...cors, 'Content-Type': 'image/jpeg', 'Cache-Control': 'public, max-age=31536000, immutable', 'X-Content-Type-Options': 'nosniff' } });
    }
    if (url.pathname !== '/api/gallery') return json({ error: 'Not found.' }, 404);
    if (request.method === 'GET') {
      const result = await env.PHOTOS.list({ prefix: 'photos/', limit: 200, include: ['customMetadata'], cursor: url.searchParams.get('cursor') || undefined });
      const photos = result.objects.filter(object => object.customMetadata?.stage).map(object => photoRecord(object, url.origin));
      photos.sort((a, b) => a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id));
      return json({ photos, nextCursor: result.truncated ? result.cursor : null });
    }
    if (request.method !== 'POST') return json({ error: 'Method not allowed.' }, 405);
    if (!origin) return json({ error: 'Upload from the project page.' }, 403);
    let validated = false;
    try {
      const bytes = await boundedBody(request);
      const form = await new Response(bytes, { headers: { 'Content-Type': request.headers.get('Content-Type') || '' } }).formData();
      const stage = form.get('stage');
      if (!['before', 'after'].includes(stage)) return json({ error: 'Choose Before or After.' }, 400);
      const photo = form.get('photo');
      const thumbnail = form.get('thumbnail');
      if (!(photo instanceof Blob) || !(thumbnail instanceof Blob)) return json({ error: 'Please choose a photo.' }, 400);
      const fullBytes = new Uint8Array(await photo.arrayBuffer());
      const thumbBytes = new Uint8Array(await thumbnail.arrayBuffer());
      const dimensions = jpegDimensions(fullBytes, 1800);
      jpegDimensions(thumbBytes, 640);
      validated = true;
      const id = crypto.randomUUID().replaceAll('-', '');
      const createdAt = new Date().toISOString();
      await env.PHOTOS.put(`photos/${id}-thumb.jpg`, thumbBytes, { httpMetadata: { contentType: 'image/jpeg' } });
      const object = await env.PHOTOS.put(`photos/${id}.jpg`, fullBytes, { httpMetadata: { contentType: 'image/jpeg' }, customMetadata: { stage, createdAt, width: String(dimensions.width), height: String(dimensions.height) } });
      return json({ photo: photoRecord(object, url.origin) }, 201);
    } catch (error) {
      if (validated) return json({ error: 'This photo could not be saved. Please try again.' }, 503);
      const large = error.message === 'Photo is too large.';
      return json({ error: large ? error.message : 'This photo could not be saved. Please choose a JPG, PNG, or WebP image.' }, large ? 413 : 400);
    }
  },
};
