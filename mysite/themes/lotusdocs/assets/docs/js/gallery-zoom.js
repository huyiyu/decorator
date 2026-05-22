(function () {
  'use strict';

  const IMAGE_SELECTOR = '#content img, .docs-content img';
  const NAV_CLASS = 'gallery-nav';
  const BTN_CLASS = 'gallery-nav-btn';
  const PREV_CLASS = 'gallery-nav-prev';
  const NEXT_CLASS = 'gallery-nav-next';
  const COUNTER_CLASS = 'gallery-nav-counter';
  const DISABLED_CLASS = 'is-disabled';

  let zoom = null;
  let images = [];
  let currentIndex = -1;
  let isTransitioning = false;
  let navEl = null;
  let touchStartX = 0;
  let touchStartY = 0;
  let touchCurrentX = 0;
  let isSwiping = false;
  const SWIPE_THRESHOLD = 50;

  function collectImages() {
    images = Array.from(document.querySelectorAll(IMAGE_SELECTOR)).filter(img => {
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

    el.querySelector(`.${PREV_CLASS}`).addEventListener('click', (e) => { e.stopPropagation(); navigate(-1); });
    el.querySelector(`.${NEXT_CLASS}`).addEventListener('click', (e) => { e.stopPropagation(); navigate(1); });

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

  function computeZoomedStyle(img) {
    const margin = 24;
    const viewportW = window.innerWidth - margin * 2;
    const viewportH = window.innerHeight - margin * 2;
    const scale = Math.min(viewportW / img.naturalWidth, viewportH / img.naturalHeight, 1);
    const width = img.naturalWidth * scale;
    const height = img.naturalHeight * scale;
    return {
      left: (window.innerWidth - width) / 2,
      top: (window.innerHeight - height) / 2,
      width,
      height,
    };
  }

  // 完全自定义关闭，不依赖 medium-zoom 的 close()（避免其内部状态混乱）
  function customClose() {
    const overlay = document.querySelector('.medium-zoom-overlay');
    const allZoomed = document.querySelectorAll('.medium-zoom-image--opened, .gallery-slide-image');

    if (overlay) {
      overlay.style.transition = 'opacity 200ms ease';
      overlay.style.opacity = '0';
    }
    allZoomed.forEach(el => {
      el.style.transition = 'opacity 200ms ease, transform 200ms ease';
      el.style.opacity = '0';
      el.style.transform = 'scale(0.95)';
    });

    setTimeout(() => {
      if (overlay) overlay.remove();
      allZoomed.forEach(el => el.remove());
      removeNavUI();
      unbindEvents();
      // 恢复 body class
      document.body.classList.remove('medium-zoom--opened');
    }, 200);
  }

  function finishNavigation(targetIndex) {
    currentIndex = targetIndex;
    updateNavUI();
    isTransitioning = false;
  }

  function navigate(direction) {
    if (isTransitioning) return;
    const targetIndex = currentIndex + direction;
    if (targetIndex < 0 || targetIndex >= images.length) return;

    isTransitioning = true;

    const currentZoomed = document.querySelector('.medium-zoom-image--opened');
    const nextOriginal = images[targetIndex];

    const preload = new Image();
    preload.src = nextOriginal.currentSrc || nextOriginal.src;

    const timeout = setTimeout(() => {
      isTransitioning = false;
    }, 5000);

    preload.onload = () => {
      clearTimeout(timeout);
      const style = computeZoomedStyle(preload);

      const newZoomed = document.createElement('img');
      newZoomed.className = 'gallery-slide-image medium-zoom-image--opened';
      newZoomed.src = preload.src;
      newZoomed.style.cssText = `
        position: fixed;
        z-index: 1002;
        top: ${style.top}px;
        left: ${style.left}px;
        width: ${style.width}px;
        height: ${style.height}px;
        transition: transform 300ms cubic-bezier(0.4, 0, 0.2, 1);
        cursor: pointer;
      `;

      const enterX = direction > 0 ? window.innerWidth : -window.innerWidth;
      newZoomed.style.transform = `translateX(${enterX}px)`;
      document.body.appendChild(newZoomed);

      if (currentZoomed) {
        currentZoomed.style.transition = 'transform 300ms cubic-bezier(0.4, 0, 0.2, 1)';
        const leaveX = direction > 0 ? -window.innerWidth : window.innerWidth;
        currentZoomed.style.transform = `translateX(${leaveX}px)`;
      }

      newZoomed.offsetHeight;
      requestAnimationFrame(() => {
        newZoomed.style.transform = 'translateX(0)';
      });

      setTimeout(() => {
        if (currentZoomed) currentZoomed.remove();

        newZoomed.addEventListener('click', customClose);

        finishNavigation(targetIndex);
      }, 300);
    };

    preload.onerror = () => {
      clearTimeout(timeout);
      isTransitioning = false;
    };
  }

  function onKeyDown(e) {
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      navigate(-1);
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      navigate(1);
    } else if (e.key === 'Escape') {
      customClose();
    }
  }

  function onTouchStart(e) {
    touchStartX = e.changedTouches[0].screenX;
    touchStartY = e.changedTouches[0].screenY;
    touchCurrentX = touchStartX;
    isSwiping = false;
  }

  function onTouchMove(e) {
    touchCurrentX = e.changedTouches[0].screenX;
    const diffX = Math.abs(touchCurrentX - touchStartX);
    const diffY = Math.abs(e.changedTouches[0].screenY - touchStartY);

    if (diffX > diffY && diffX > 10) {
      isSwiping = true;
      e.preventDefault();
    }
  }

  function onTouchEnd(e) {
    if (!isSwiping) return;
    const diff = touchStartX - touchCurrentX;
    if (Math.abs(diff) < SWIPE_THRESHOLD) return;
    if (diff > 0) {
      navigate(1);
    } else {
      navigate(-1);
    }
    isSwiping = false;
  }

  function bindEvents() {
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('touchstart', onTouchStart, { passive: true });
    document.addEventListener('touchmove', onTouchMove, { passive: false });
    document.addEventListener('touchend', onTouchEnd, { passive: true });
  }

  function unbindEvents() {
    document.removeEventListener('keydown', onKeyDown);
    document.removeEventListener('touchstart', onTouchStart);
    document.removeEventListener('touchmove', onTouchMove);
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

    // medium-zoom 的 close 只处理其自己打开的图片
    zoom.on('close', () => {
      removeNavUI();
      unbindEvents();
    });

    // 拦截 overlay 点击：如果当前是我们创建的图片，用自定义关闭
    document.addEventListener('click', (e) => {
      const overlay = document.querySelector('.medium-zoom-overlay');
      const slideImage = document.querySelector('.gallery-slide-image');
      if (overlay && slideImage && e.target === overlay) {
        e.stopPropagation();
        e.preventDefault();
        customClose();
      }
    }, true);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
