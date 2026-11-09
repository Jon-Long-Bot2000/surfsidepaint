const photos = Array.from(document.querySelectorAll('.gallery-photo'));
const dialog = document.querySelector('.photo-dialog');
const image = document.querySelector('#expanded-photo');
const caption = document.querySelector('#photo-caption');
let current = 0;

function showPhoto(index) {
  current = (index + photos.length) % photos.length;
  const photo = photos[current];
  image.src = photo.href;
  image.alt = photo.querySelector('img').alt;
  caption.textContent = `Before · Photo ${current + 1} of ${photos.length}`;
}

photos.forEach((photo, index) => {
  photo.addEventListener('click', event => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    showPhoto(index);
    dialog.showModal();
    document.body.classList.add('photo-viewer-open');
  });
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
