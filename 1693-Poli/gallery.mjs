const tabs = Array.from(document.querySelectorAll('.gallery-tab'));
const photoCount = document.querySelector('#gallery-count');
const gallery = document.querySelector('.gallery');
const galleryStatus = document.querySelector('#gallery-status');
let activeStage = 'before';

function stagePhotos(stage = activeStage) {
  return Array.from(document.querySelectorAll(`#${stage}-panel .gallery-photo`));
}

function updateGallery() {
  const photos = stagePhotos();
  photoCount.textContent = `${photos.length} ${photos.length === 1 ? 'photo' : 'photos'}`;
  photoCount.hidden = photos.length === 0;
  document.querySelector('#after-panel .gallery-empty').hidden = stagePhotos('after').length > 0;
  for (const stage of ['before', 'after']) {
    const cards = stagePhotos(stage);
    cards.forEach((card, index) => {
      card.setAttribute('aria-label', `Open ${stage} photo ${index + 1} of ${cards.length}`);
    });
  }
}

function selectTab(selected, focus = false) {
  tabs.forEach(tab => {
    const active = tab === selected;
    tab.setAttribute('aria-selected', String(active));
    tab.tabIndex = active ? 0 : -1;
    document.getElementById(tab.getAttribute('aria-controls')).hidden = !active;
  });
  activeStage = selected.id === 'before-tab' ? 'before' : 'after';
  updateGallery();
  if (focus) selected.focus();
}

tabs.forEach((tab, index) => {
  tab.addEventListener('click', () => selectTab(tab));
  tab.addEventListener('keydown', event => {
    let next;
    if (event.key === 'ArrowRight') next = (index + 1) % tabs.length;
    if (event.key === 'ArrowLeft') next = (index - 1 + tabs.length) % tabs.length;
    if (event.key === 'Home') next = 0;
    if (event.key === 'End') next = tabs.length - 1;
    if (next !== undefined) {
      event.preventDefault();
      selectTab(tabs[next], true);
    }
  });
});

const dialog = document.querySelector('.photo-dialog');
const image = document.querySelector('#expanded-photo');
const caption = document.querySelector('#photo-caption');
let current = 0;
let currentPhotos = [];
let viewingStage = 'before';

function showPhoto(index) {
  current = (index + currentPhotos.length) % currentPhotos.length;
  const photo = currentPhotos[current];
  image.src = photo.href;
  image.alt = photo.querySelector('img').alt;
  const label = viewingStage === 'before' ? 'Before' : 'After';
  caption.textContent = `${label} · Photo ${current + 1} of ${currentPhotos.length}`;
  dialog.setAttribute('aria-label', `${label} photo viewer`);
}

gallery.addEventListener('click', event => {
    const photo = event.target.closest('.gallery-photo');
    if (!photo) return;
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    viewingStage = photo.closest('.gallery-panel').id === 'before-panel' ? 'before' : 'after';
    currentPhotos = stagePhotos(viewingStage);
    showPhoto(currentPhotos.indexOf(photo));
    dialog.showModal();
    document.body.classList.add('photo-viewer-open');
});

document.querySelector('.photo-close').addEventListener('click', () => dialog.close());
document.querySelector('.photo-previous').addEventListener('click', () => showPhoto(current - 1));
document.querySelector('.photo-next').addEventListener('click', () => showPhoto(current + 1));
dialog.addEventListener('click', event => {
  if (event.target === dialog) dialog.close();
});
dialog.addEventListener('close', () => document.body.classList.remove('photo-viewer-open'));
dialog.addEventListener('keydown', event => {
  if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
    event.preventDefault();
    showPhoto(current + (event.key === 'ArrowRight' ? 1 : -1));
  }
});

const addDialog = document.querySelector('.add-photo-dialog');
const uploadStatus = document.querySelector('#upload-status');
const cameraInput = document.querySelector('#camera-input');
const photosInput = document.querySelector('#photos-input');
const sourceButtons = Array.from(document.querySelectorAll('.photo-source-options button'));
let uploadStage = 'before';
let uploading = false;
const knownPhotos = new Set();

const settingsPromise = fetch('./gallery-config.json', { cache: 'no-store' })
  .then(response => {
    if (!response.ok) throw new Error('Shared gallery is unavailable. Please try again shortly.');
    return response.json();
  })
  .then(settings => new URL(settings.apiBase.replace(/\/$/, ''), location.href).href);

function appendPhoto(photo) {
  if (!['before', 'after'].includes(photo.stage) || knownPhotos.has(photo.id)) return;
  const card = document.createElement('a');
  card.className = 'gallery-photo';
  card.href = photo.url;
  card.dataset.photoId = photo.id;
  const thumbnail = document.createElement('img');
  thumbnail.src = photo.thumbnailUrl;
  thumbnail.alt = `${photo.stage === 'before' ? 'Before' : 'After'} project photo`;
  thumbnail.width = photo.width;
  thumbnail.height = photo.height;
  thumbnail.loading = 'lazy';
  thumbnail.decoding = 'async';
  const number = document.createElement('span');
  number.setAttribute('aria-hidden', 'true');
  number.textContent = String(stagePhotos(photo.stage).length + 1).padStart(2, '0');
  card.append(thumbnail, number);
  document.querySelector(`#${photo.stage}-panel .photo-grid`).append(card);
  knownPhotos.add(photo.id);
}

async function refreshSharedPhotos() {
  const base = await settingsPromise;
  let cursor = '';
  const records = [];
  do {
    const url = new URL(base);
    if (cursor) url.searchParams.set('cursor', cursor);
    const response = await fetch(url, { cache: 'no-store' });
    if (!response.ok) throw new Error('Shared gallery is unavailable. Please try again shortly.');
    const data = await response.json();
    records.push(...data.photos);
    cursor = data.nextCursor || '';
  } while (cursor);
  records.sort((a, b) => a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id));
  records.forEach(appendPhoto);
  updateGallery();
}

document.querySelector('.new-photo-button').addEventListener('click', () => {
  uploadStage = activeStage;
  document.querySelector('#add-photo-title').textContent = `Add photo to ${uploadStage === 'before' ? 'Before' : 'After'}`;
  uploadStatus.textContent = '';
  addDialog.showModal();
  document.body.classList.add('photo-viewer-open');
});
document.querySelector('.add-photo-close').addEventListener('click', () => addDialog.close());
addDialog.addEventListener('close', () => document.body.classList.remove('photo-viewer-open'));
addDialog.addEventListener('click', event => { if (event.target === addDialog && !uploading) addDialog.close(); });
addDialog.addEventListener('cancel', event => { if (uploading) event.preventDefault(); });
document.querySelector('#take-photo').addEventListener('click', () => cameraInput.click());
document.querySelector('#upload-photos').addEventListener('click', () => photosInput.click());

function jpegBlob(canvas, quality) {
  return new Promise((resolve, reject) => canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('This photo could not be prepared.')), 'image/jpeg', quality));
}

async function preparePhoto(file) {
  if (file.size > 30 * 1024 * 1024) throw new Error('Choose photos smaller than 30 MB.');
  const source = URL.createObjectURL(file);
  try {
    const original = new Image();
    original.src = source;
    try { await original.decode(); }
    catch { throw new Error('This photo cannot be opened on this device. Please choose a JPG, PNG, or WebP image.'); }
    const scale = Math.min(1, 1800 / Math.max(original.naturalWidth, original.naturalHeight));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(original.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(original.naturalHeight * scale));
    const context = canvas.getContext('2d');
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(original, 0, 0, canvas.width, canvas.height);
    const photo = await jpegBlob(canvas, .86);
    const thumb = document.createElement('canvas');
    const thumbScale = Math.min(1, 640 / Math.max(canvas.width, canvas.height));
    thumb.width = Math.max(1, Math.round(canvas.width * thumbScale));
    thumb.height = Math.max(1, Math.round(canvas.height * thumbScale));
    thumb.getContext('2d').drawImage(canvas, 0, 0, thumb.width, thumb.height);
    return { photo, thumbnail: await jpegBlob(thumb, .78) };
  } finally { URL.revokeObjectURL(source); }
}

async function uploadFiles(event) {
  const files = Array.from(event.target.files || []);
  event.target.value = '';
  if (!files.length || uploading) return;
  const targetStage = uploadStage;
  uploading = true;
  document.querySelector('.new-photo-button').disabled = true;
  sourceButtons.forEach(button => button.disabled = true);
  document.querySelector('.add-photo-close').disabled = true;
  let added = 0;
  let lastError = '';
  try {
    const base = await settingsPromise;
    for (const [index, file] of files.entries()) {
      uploadStatus.textContent = `Adding photo ${index + 1} of ${files.length}…`;
      try {
        const prepared = await preparePhoto(file);
        const form = new FormData();
        form.append('stage', targetStage);
        form.append('photo', prepared.photo, 'photo.jpg');
        form.append('thumbnail', prepared.thumbnail, 'thumbnail.jpg');
        const response = await fetch(base, { method: 'POST', body: form });
        const result = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(result.error || 'The photo could not be saved. Please try again.');
        appendPhoto(result.photo);
        added++;
        updateGallery();
      } catch (error) { lastError = error.message; }
    }
  } catch (error) { lastError = error.message; }
  finally {
    uploading = false;
    document.querySelector('.new-photo-button').disabled = false;
    sourceButtons.forEach(button => button.disabled = false);
    document.querySelector('.add-photo-close').disabled = false;
  }
  if (added) {
    galleryStatus.textContent = `${added} ${added === 1 ? 'photo added' : 'photos added'} to ${targetStage === 'before' ? 'Before' : 'After'}.`;
    galleryStatus.hidden = false;
  }
  if (lastError) uploadStatus.textContent = `${added ? `${added} added. ` : ''}${lastError}`;
  else addDialog.close();
}

cameraInput.addEventListener('change', uploadFiles);
photosInput.addEventListener('change', uploadFiles);
refreshSharedPhotos().catch(() => {});
setInterval(() => {
  if (!document.hidden && !uploading) refreshSharedPhotos().catch(() => {});
}, 15000);
