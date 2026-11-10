const tabs = Array.from(document.querySelectorAll('.gallery-tab'));
const photoCount = document.querySelector('#gallery-count');
const gallery = document.querySelector('.gallery');
let activeStage = 'before';

function stagePhotos(stage = activeStage) {
  return Array.from(document.querySelectorAll(`#${stage}-panel .gallery-photo`));
}

function updateGallery() {
  const photos = stagePhotos();
  photoCount.textContent = `${photos.length} ${photos.length === 1 ? 'photo' : 'photos'}`;
  photoCount.hidden = photos.length === 0;
  for (const stage of ['before', 'after']) {
    const cards = stagePhotos(stage);
    document.querySelector(`#${stage}-panel .gallery-empty`).hidden = cards.length > 0;
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

updateGallery();
