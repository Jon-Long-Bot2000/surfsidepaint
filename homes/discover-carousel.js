(() => {
  const carousel = document.querySelector('.homes-todo-carousel');
  if (!carousel) return;
  const track = carousel.querySelector('.homes-todo-track');
  const slides = [...track.children];
  if (!slides.length) return;
  const previous = carousel.querySelector('[data-carousel-prev]');
  const next = carousel.querySelector('[data-carousel-next]');
  const controls = carousel.querySelector('.homes-carousel-controls');
  const featuredIndex = slides.findIndex(slide => slide.querySelector('h3')?.textContent === 'Schedule an Annual Home Inspection');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  // A copy on each side lets native touch scrolling continue past either end.
  // Only the original set participates in keyboard and screen-reader navigation.
  function copySlides() {
    const fragment = document.createDocumentFragment();
    slides.forEach(slide => {
      const copy = slide.cloneNode(true);
      copy.setAttribute('aria-hidden', 'true');
      copy.inert = true;
      copy.removeAttribute('aria-label');
      fragment.append(copy);
    });
    return fragment;
  }
  track.prepend(copySlides());
  track.append(copySlides());
  controls.hidden = false;
  previous.disabled = next.disabled = false;
  let step = 0;
  let cycle = 0;
  let frame;
  let settleTimer;
  const modulo = (value, length) => ((value % length) + length) % length;

  function jump(left) {
    // Disable snap during an invisible jump to an identical copy.
    track.style.scrollSnapType = 'none';
    track.scrollTo({ left, behavior: 'instant' });
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(() => track.style.removeProperty('scroll-snap-type'));
  }
  function measure() {
    const oldStep = step;
    const position = oldStep ? modulo(track.scrollLeft / oldStep, slides.length) : 0;
    step = slides[0].getBoundingClientRect().width + parseFloat(getComputedStyle(track).columnGap);
    cycle = step * slides.length;
    const initialOffset = Math.max(0, featuredIndex) * step - (track.clientWidth - slides[0].getBoundingClientRect().width) / 2;
    jump(cycle + (oldStep ? position * step : initialOffset));
  }
  function recenter() {
    if (!cycle) return;
    if (track.scrollLeft < cycle || track.scrollLeft >= cycle * 2) {
      jump(cycle + modulo(track.scrollLeft, cycle));
    }
  }
  function move(direction) {
    track.scrollBy({ left: direction * step, behavior: reducedMotion.matches ? 'instant' : 'smooth' });
  }
  previous.addEventListener('click', () => move(-1));
  next.addEventListener('click', () => move(1));
  carousel.querySelector('[data-mobile-carousel-prev]')?.addEventListener('click', () => move(-1));
  carousel.querySelector('[data-mobile-carousel-next]')?.addEventListener('click', () => move(1));
  track.addEventListener('keydown', event => {
    if (event.target !== track) return;
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault();
      move(event.key === 'ArrowLeft' ? -1 : 1);
    } else if (event.key === 'Home' || event.key === 'End') {
      event.preventDefault();
      track.scrollTo({ left: cycle + (event.key === 'Home' ? 0 : (slides.length - 1) * step), behavior: reducedMotion.matches ? 'instant' : 'smooth' });
    }
  });
  track.addEventListener('scroll', () => {
    // Keep a large buffer on either side even during a very long swipe.
    if (cycle && (track.scrollLeft < cycle * .25 || track.scrollLeft > cycle * 2.75)) recenter();
    clearTimeout(settleTimer);
    settleTimer = setTimeout(recenter, 180);
  }, { passive: true });
  track.addEventListener('scrollend', recenter);
  new ResizeObserver(measure).observe(track);
  measure();
})();
