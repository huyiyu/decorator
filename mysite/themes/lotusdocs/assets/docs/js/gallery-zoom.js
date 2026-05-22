(function () {
  'use strict';

  const IMAGE_SELECTOR = '#content img, .docs-content img';
  const ACTIVE_CLASS = 'gallery-lightbox--active';
  const DISABLED_CLASS = 'is-disabled';

  let images = [];
  let currentIndex = -1;
  let lightbox = null;
  let isTransitioning = false;
  let isOpen = false;
  let openScrollY = 0;
  let touchStartX = 0;
  let touchStartY = 0;
  let touchCurrentX = 0;
  let isSwiping = false;
  const SWIPE_THRESHOLD = 50;
  const SCROLL_CLOSE_THRESHOLD = 40;

  function collectImages() {
    images = Array.from(document.querySelectorAll(IMAGE_SELECTOR)).filter(img => {
      return img.closest('a') === null && !img.closest('.gallery-lightbox');
    });
  }

  function createLightbox() {
    const el = document.createElement('div');
    el.className = 'gallery-lightbox';
    el.setAttribute('role', 'dialog');
    el.setAttribute('aria-modal', 'true');
    el.innerHTML = `
      <div class="gallery-lightbox__backdrop"></div>
      <div class="gallery-lightbox__container">
        <img class="gallery-lightbox__img" src="" alt="" />
      </div>
      <button class="gallery-lightbox__btn gallery-lightbox__prev" aria-label="上一张" type="button">‹</button>
      <button class="gallery-lightbox__btn gallery-lightbox__next" aria-label="下一张" type="button">›</button>
      <div class="gallery-lightbox__counter"></div>
    `;

    el.querySelector('.gallery-lightbox__backdrop').addEventListener('click', close);
    el.querySelector('.gallery-lightbox__img').addEventListener('click', close);
    el.querySelector('.gallery-lightbox__prev').addEventListener('click', (e) => { e.stopPropagation(); navigate(-1); });
    el.querySelector('.gallery-lightbox__next').addEventListener('click', (e) => { e.stopPropagation(); navigate(1); });

    document.body.appendChild(el);
    return el;
  }

  function open(index) {
    if (isTransitioning || isOpen) return;
    if (index < 0 || index >= images.length) return;

    currentIndex = index;
    if (!lightbox) lightbox = createLightbox();

    const img = lightbox.querySelector('.gallery-lightbox__img');
    const original = images[index];
    img.src = original.currentSrc || original.src;
    img.alt = original.alt || '';
    img.style.transition = '';
    img.style.transform = '';
    img.style.visibility = '';

    lightbox.classList.add(ACTIVE_CLASS);
    isOpen = true;
    updateUI();
    preloadAdjacent();
    bindEvents();
    openScrollY = window.scrollY || window.pageYOffset || 0;
  }

  function close() {
    if (!lightbox || !isOpen) return;
    lightbox.classList.remove(ACTIVE_CLASS);
    isOpen = false;
    isTransitioning = false;
    unbindEvents();
    currentIndex = -1;
  }

  function navigate(direction) {
    if (isTransitioning) return;
    const target = currentIndex + direction;
    if (target < 0 || target >= images.length) return;

    isTransitioning = true;
    const img = lightbox.querySelector('.gallery-lightbox__img');

    // 1. 当前图片滑出
    const exitX = direction > 0 ? '-100%' : '100%';
    img.style.transition = 'transform 150ms cubic-bezier(0.4, 0, 0.2, 1)';
    img.style.transform = `translateX(${exitX})`;

    const cleanupExit = () => {
      img.removeEventListener('transitionend', onExitEnd);
      clearTimeout(exitTimeout);
    };

    const onExitEnd = () => {
      cleanupExit();

      currentIndex = target;
      const newSrc = images[currentIndex].currentSrc || images[currentIndex].src;
      const newAlt = images[currentIndex].alt || '';

      // 2. 隐藏并瞬间 reposition 到另一侧
      img.style.visibility = 'hidden';
      img.style.transition = 'none';
      const enterX = direction > 0 ? '100%' : '-100%';
      img.style.transform = `translateX(${enterX})`;

      if (img.src !== newSrc) {
        img.src = newSrc;
        img.alt = newAlt;
      }

      img.offsetHeight; // force reflow

      // 3. 显示并开始滑入
      img.style.visibility = 'visible';
      img.style.transition = 'transform 150ms cubic-bezier(0.4, 0, 0.2, 1)';
      requestAnimationFrame(() => {
        img.style.transform = 'translateX(0)';
      });

      const cleanupEnter = () => {
        img.removeEventListener('transitionend', onEnterEnd);
        clearTimeout(enterTimeout);
      };

      const onEnterEnd = () => {
        cleanupEnter();
        img.style.transition = '';
        img.style.transform = '';
        updateUI();
        preloadAdjacent();
        isTransitioning = false;
      };

      img.addEventListener('transitionend', onEnterEnd);
      const enterTimeout = setTimeout(() => {
        cleanupEnter();
        img.style.transition = '';
        img.style.transform = '';
        updateUI();
        preloadAdjacent();
        isTransitioning = false;
      }, 200);
    };

    img.addEventListener('transitionend', onExitEnd);
    const exitTimeout = setTimeout(() => {
      cleanupExit();
      onExitEnd();
    }, 200);
  }

  function updateUI() {
    if (!lightbox) return;
    const prevBtn = lightbox.querySelector('.gallery-lightbox__prev');
    const nextBtn = lightbox.querySelector('.gallery-lightbox__next');
    const counter = lightbox.querySelector('.gallery-lightbox__counter');

    prevBtn.classList.toggle(DISABLED_CLASS, currentIndex <= 0);
    nextBtn.classList.toggle(DISABLED_CLASS, currentIndex >= images.length - 1);
    counter.textContent = `${currentIndex + 1} / ${images.length}`;
  }

  function preloadAdjacent() {
    if (currentIndex < 0) return;
    const preload = (idx) => {
      if (idx < 0 || idx >= images.length) return;
      const src = images[idx].currentSrc || images[idx].src;
      const img = new Image();
      img.src = src;
    };
    preload(currentIndex - 1);
    preload(currentIndex + 1);
  }

  function onKeyDown(e) {
    if (!isOpen) return;
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      navigate(-1);
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      navigate(1);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      close();
    }
  }

  function onTouchStart(e) {
    if (!isOpen) return;
    touchStartX = e.changedTouches[0].screenX;
    touchStartY = e.changedTouches[0].screenY;
    touchCurrentX = touchStartX;
    isSwiping = false;
  }

  function onTouchMove(e) {
    if (!isOpen) return;
    touchCurrentX = e.changedTouches[0].screenX;
    const diffX = Math.abs(touchCurrentX - touchStartX);
    const diffY = Math.abs(e.changedTouches[0].screenY - touchStartY);

    if (diffX > diffY && diffX > 10) {
      isSwiping = true;
    }
  }

  function onTouchEnd(e) {
    if (!isOpen || !isSwiping) return;
    const diff = touchStartX - touchCurrentX;
    if (Math.abs(diff) < SWIPE_THRESHOLD) {
      isSwiping = false;
      return;
    }
    if (diff > 0) {
      navigate(1);
    } else {
      navigate(-1);
    }
    isSwiping = false;
  }

  function onScroll() {
    if (!isOpen) return;
    const currentY = window.scrollY || window.pageYOffset || 0;
    if (Math.abs(currentY - openScrollY) > SCROLL_CLOSE_THRESHOLD) {
      close();
    }
  }

  function bindEvents() {
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('touchstart', onTouchStart, { passive: true });
    document.addEventListener('touchmove', onTouchMove, { passive: true });
    document.addEventListener('touchend', onTouchEnd, { passive: true });
    document.addEventListener('scroll', onScroll, { passive: true });
  }

  function unbindEvents() {
    document.removeEventListener('keydown', onKeyDown);
    document.removeEventListener('touchstart', onTouchStart);
    document.removeEventListener('touchmove', onTouchMove);
    document.removeEventListener('touchend', onTouchEnd);
    document.removeEventListener('scroll', onScroll);
  }

  function bindImageClicks() {
    images.forEach((img, i) => {
      if (img._galleryBound) return;
      img._galleryBound = true;
      img.addEventListener('click', (e) => {
        e.preventDefault();
        open(i);
      });
      img.style.cursor = 'zoom-in';
    });
  }

  function init() {
    collectImages();
    bindImageClicks();

    const observer = new MutationObserver(() => {
      const before = images.length;
      collectImages();
      if (images.length !== before) {
        bindImageClicks();
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
