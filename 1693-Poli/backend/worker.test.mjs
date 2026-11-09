import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import worker from './worker.mjs';

const jpeg = await readFile(new URL('./fixtures/test-photo.jpg', import.meta.url));
const origin = 'https://www.surfsidepaint.com';
const api = 'https://gallery.example/api/gallery';

class Bucket {
  objects = new Map();
  fail = false;
  async put(key, body, options = {}) {
    if (this.fail) throw new Error('Storage unavailable');
    const object = { key, body, customMetadata: options.customMetadata || {}, httpMetadata: options.httpMetadata || {} };
    this.objects.set(key, object);
    return object;
  }
  async get(key) { return this.objects.get(key) || null; }
  async list({ prefix, cursor }) {
    const all = [...this.objects.values()].filter(value => value.key.startsWith(prefix)).sort((a, b) => a.key.localeCompare(b.key));
    const start = Number(cursor || 0);
    const objects = all.slice(start, start + 2);
    const truncated = start + 2 < all.length;
    return { objects, truncated, cursor: truncated ? String(start + 2) : undefined };
  }
}

function environment(bucket = new Bucket()) { return { PHOTOS: bucket, ALLOWED_ORIGINS: origin }; }
function upload(stage, bytes = jpeg, requestOrigin = origin) {
  const form = new FormData();
  form.append('stage', stage);
  form.append('photo', new Blob([bytes], { type: 'image/jpeg' }), 'photo.jpg');
  form.append('thumbnail', new Blob([jpeg], { type: 'image/jpeg' }), 'thumbnail.jpg');
  return new Request(api, { method: 'POST', headers: { Origin: requestOrigin }, body: form });
}

test('uploads persist separately by stage, retain dimensions and serve images', async () => {
  const env = environment();
  const before = await worker.fetch(upload('before'), env);
  const after = await worker.fetch(upload('after'), env);
  assert.equal(before.status, 201);
  assert.equal(after.status, 201);
  const a = (await before.json()).photo;
  const b = (await after.json()).photo;
  assert.notEqual(a.id, b.id);
  assert.equal(a.stage, 'before');
  assert.equal(b.stage, 'after');
  assert.deepEqual([a.width, a.height], [320, 240]);
  const downloaded = await worker.fetch(new Request(a.url), env);
  assert.equal(downloaded.headers.get('Content-Type'), 'image/jpeg');
  assert.deepEqual(Buffer.from(await downloaded.arrayBuffer()), jpeg);
});

test('lists include all uploads through pagination, but exclude thumbnail objects', async () => {
  const env = environment();
  await Promise.all(['before', 'after', 'after'].map(stage => worker.fetch(upload(stage), env)));
  const records = [];
  let cursor = '';
  do {
    const result = await worker.fetch(new Request(api + (cursor ? '?cursor='+cursor : '')), env);
    const data = await result.json();
    records.push(...data.photos);
    cursor = data.nextCursor;
  } while (cursor);
  assert.equal(records.length, 3);
  assert.equal(new Set(records.map(value => value.id)).size, 3);
});

test('invalid stages and invalid image data cannot create gallery objects', async () => {
  const env = environment();
  assert.equal((await worker.fetch(upload('../private'), env)).status, 400);
  assert.equal((await worker.fetch(upload('after', Buffer.from('<svg></svg>')), env)).status, 400);
  assert.equal(env.PHOTOS.objects.size, 0);
});

test('oversized requests are rejected before storage', async () => {
  const request = upload('before');
  request.headers.set('Content-Length', String(8 * 1024 * 1024 + 1));
  const env = environment();
  assert.equal((await worker.fetch(request, env)).status, 413);
  assert.equal(env.PHOTOS.objects.size, 0);
});

test('uploads require an approved page origin; CORS preflights allow that origin', async () => {
  const env = environment();
  assert.equal((await worker.fetch(upload('before', jpeg, 'https://other.example'), env)).status, 403);
  const preflight = await worker.fetch(new Request(api, { method: 'OPTIONS', headers: { Origin: origin } }), env);
  assert.equal(preflight.status, 204);
  assert.equal(preflight.headers.get('Access-Control-Allow-Origin'), origin);
});

test('missing storage and failed writes report service errors', async () => {
  assert.equal((await worker.fetch(new Request(api), { ALLOWED_ORIGINS: origin })).status, 503);
  const bucket = new Bucket();
  bucket.fail = true;
  assert.equal((await worker.fetch(upload('after'), environment(bucket))).status, 503);
});

test('no public delete or overwrite endpoint is available', async () => {
  const env = environment();
  for (const method of ['DELETE', 'PUT', 'PATCH']) {
    assert.equal((await worker.fetch(new Request(api, { method }), env)).status, 405);
  }
  assert.equal((await worker.fetch(new Request(api+'/photos/../../private'), env)).status, 404);
});
