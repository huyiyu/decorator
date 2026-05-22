(function () {
  'use strict';

  const IMAGE_SELECTOR = '#content img, .docs-content img';
  const NAV_CLASS = 'gallery-nav';
  const BTN_CLASS = 'gallery-nav-btn';
  const PREV_CLASS = 'gallery-nav-prev';
  const NEXT_CLASS = 'gallery-nav-next';
  const COUNTER_CLASS = 'gallery-nav-counter';
  const DISABLED_CLASS = 'is-disabled';
  const TRANSITION_LOCK_DURATION = 300; // ms

  let zoom = null;
  let images = [];
  let currentIndex = -1;
  let isTransitioning = false;
  let navEl = null;
  let touchStartX = 0;
  let touchEndX = 0;
  const SWIPE_THRESHOLD = 50; // px

  function collectImages() {
    images = Array.from(document.querySelectorAll(IMAGE_SELECTOR)).filter(img => {
      // 排除包裹在链接中的图片（点击会跳转而非放大）
      return img.closest('a') === null;
    });
  }

  function createNavUI() {
    const el = document.createElement('div');
    el.className = NAV_CLASS;
    el.innerHTML = `
      <button class="${BTN_CLASS} ${PREV_CLASS}" aria-label="上一张" type="button">‹</button>
      <button class="${BTN_CLASS} ${NEXT_CLASS}" aria-label="下一张" type="button">›</button>
      <div class="${COUNTER_CLASS}" aria-live="polite"></div>
    `;

    el.querySelector(`.${PREV_CLASS}`).addEventListener('click', () => navigate(-1));
    el.querySelector(`.${NEXT_CLASS}`).addEventListener('click', () => navigate(1));

    document.body.appendChild(el);
    return el;
  }

  function updateNavUI() {
    if (!navEl) return;
    const prevBtn = navEl.querySelector(`.${PREV_CLASS}`);
    const nextBtn = navEl.querySelector(`.${NEXT_CLASS}`);
    const counter = navEl.querySelector(`.${COUNTER_CLASS}`);

    prevBtn.classList.toggle(DISABLED_CLASS, currentIndex <= 0);
    nextBtn.classList.toggle(DISABLED_CLASS, currentIndex >= images.length - 1);
    counter.textContent = `${currentIndex + 1} / ${images.length}`;
  }

  function removeNavUI() {
    if (navEl) {
      navEl.remove();
      navEl = null;
    }
  }

  function navigate(direction) {
    if (isTransitioning) return;
    const targetIndex = currentIndex + direction;
    if (targetIndex < 0 || targetIndex >= images.length) return;

    isTransitioning = true;

    // 快速关闭当前，打开目标
    zoom.close();

    setTimeout(() => {
      zoom.show({ target: images[targetIndex] });
      // currentIndex 会在 'shown' 事件中更新
      setTimeout(() => {
        isTransitioning = false;
      }, TRANSITION_LOCK_DURATION);
    }, 50);
  }

  function onKeyDown(e) {
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      navigate(-1);
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      navigate(1);
    } else if (e.key === 'Escape') {
      zoom.close();
    }
  }

  function onTouchStart(e) {
    touchStartX = e.changedTouches[0].screenX;
  }

  function onTouchEnd(e) {
    touchEndX = e.changedTouches[0].screenX;
    handleSwipe();
  }

  function handleSwipe() {
    const diff = touchStartX - touchEndX;
    if (Math.abs(diff) < SWIPE_THRESHOLD) return;
    if (diff > 0) {
      navigate(1); // 左滑 → 下一张
    } else {
      navigate(-1); // 右滑 → 上一张
    }
  }

  function bindEvents() {
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('touchstart', onTouchStart, { passive: true });
    document.addEventListener('touchend', onTouchEnd, { passive: true });
  }

  function unbindEvents() {
    document.removeEventListener('keydown', onKeyDown);
    document.removeEventListener('touchstart', onTouchStart);
    document.removeEventListener('touchend', onTouchEnd);
  }

  function init() {
    if (typeof mediumZoom === 'undefined') {
      console.warn('[gallery-zoom] mediumZoom not found');
      return;
    }

    collectImages();

    zoom = mediumZoom(IMAGE_SELECTOR, {
      background: 'rgba(0, 0, 0, 0.85)',
      margin: 24,
    });

    zoom.on('open', (event) => {
      currentIndex = images.indexOf(event.target);
      if (images.length > 1) {
        navEl = createNavUI();
        updateNavUI();
        bindEvents();
      }
    });

    zoom.on('shown', (event) => {
      currentIndex = images.indexOf(event.target);
      updateNavUI();
    });

    zoom.on('close', () => {
      removeNavUI();
      unbindEvents();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
