# 图片放大导航 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在保留 medium-zoom 的基础上，为放大后的图片增加前后切换能力（桌面端按钮+键盘、移动端滑动手势）。

**Architecture:** 保留 CDN 引入的 medium-zoom 负责单张图片放大动画。新建 `gallery-zoom.js` 作为 Gallery Navigation 层，收集页面图片、监听 zoom 事件、注入导航 UI（按钮+计数器）、处理键盘和触摸输入。样式通过扩展现有的 `_medium-zoom.scss` 实现。

**Tech Stack:** Hugo v0.160.1, medium-zoom 1.1.0 (CDN), vanilla JS, SCSS

---

## File Structure

| File | Action | Purpose |
|------|--------|---------|
| `mysite/themes/lotusdocs/assets/docs/js/gallery-zoom.js` | Create | Gallery Navigation 核心逻辑 |
| `mysite/themes/lotusdocs/layouts/docs/baseof.html` | Modify | 替换内联 medium-zoom 初始化，引入 gallery-zoom.js |
| `mysite/themes/lotusdocs/assets/docs/scss/custom/plugins/medium-zoom/_medium-zoom.scss` | Modify | 添加导航按钮、计数器、手势样式 |

---

## Task 1: 创建 gallery-zoom.js 核心模块

**Files:**
- Create: `mysite/themes/lotusdocs/assets/docs/js/gallery-zoom.js`

### 说明

此模块在 `mediumZoom` 全局可用的前提下运行。页面加载时收集所有正文图片，初始化 medium-zoom，并在 zoom 打开/关闭时注入/移除导航 UI。

### 核心逻辑要点

- `imageSelector`: `'#content img, .docs-content img'`（与现有 medium-zoom 保持一致）
- `images[]`: 收集到的图片元素数组
- `currentIndex`: 当前放大图片在数组中的索引
- `isTransitioning`: 切换动画锁，防止快速连续触发
- `touchStartX` / `touchEndX`: 触摸滑动起点/终点

### NavUI 结构

```html
<div class="gallery-nav">
  <button class="gallery-nav-btn gallery-nav-prev" aria-label="上一张">‹</button>
  <button class="gallery-nav-btn gallery-nav-next" aria-label="下一张">›</button>
  <div class="gallery-nav-counter" aria-live="polite">1 / 5</div>
</div>
```

### 切换实现

medium-zoom 没有原生 gallery 切换 API。采用「快速关闭→打开」策略：

1. 调用 `zoom.close()` 关闭当前图片
2. 短暂延迟（50ms）后调用 `zoom.show(images[targetIndex])` 打开目标图片
3. 通过 CSS 覆盖 `.medium-zoom-image` 的 `transition-duration` 为 `150ms`，让切换视觉上更连贯

### 边界检查

- `targetIndex < 0`: 禁止切换，禁用 prev 按钮
- `targetIndex >= images.length`: 禁止切换，禁用 next 按钮
- `images.length <= 1`: 不注入 NavUI

- [ ] **Step 1: 编写 gallery-zoom.js**

创建 `mysite/themes/lotusdocs/assets/docs/js/gallery-zoom.js`，内容如下：

```javascript
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
      // 排除已内联的 SVG、尺寸为 0 的占位图
      return img.naturalWidth > 0 && img.closest('a') === null;
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
      zoom.show(images[targetIndex]);
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
```

- [ ] **Step 2: 验证文件创建**

Run:
```bash
cat mysite/themes/lotusdocs/assets/docs/js/gallery-zoom.js | head -5
```

Expected: 文件存在，内容以 `(function () {` 开头。

- [ ] **Step 3: Commit**

```bash
git add mysite/themes/lotusdocs/assets/docs/js/gallery-zoom.js
git commit -m "feat: add gallery-zoom.js core module

Collects page images, wraps medium-zoom with prev/next
navigation, keyboard arrows, and touch swipe support.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

## Task 2: 修改 baseof.html 引入 gallery-zoom.js

**Files:**
- Modify: `mysite/themes/lotusdocs/layouts/docs/baseof.html:104-115`

### 说明

替换原有的内联 medium-zoom 初始化代码，改用 Hugo `js.Build` 打包引入 `gallery-zoom.js`。保留 medium-zoom CDN 引入（因为 gallery-zoom.js 依赖全局 `mediumZoom`）。

注意：该主题中 JS 资源的路径格式为 `resources.Get (printf "/%s/%s" ($.Scratch.Get "pathName") "js/filename.js")`。`pathName` 默认值为 `"docs"`。

- [ ] **Step 1: 替换 baseof.html 中的 medium-zoom 初始化块**

将 `mysite/themes/lotusdocs/layouts/docs/baseof.html` 第 104-115 行：

```html
        <!-- Medium Zoom for images -->
        <script src="https://cdn.jsdelivr.net/npm/medium-zoom@1.1.0/dist/medium-zoom.min.js" defer></script>
        <script>
            document.addEventListener('DOMContentLoaded', function() {
                if (typeof mediumZoom !== 'undefined') {
                    mediumZoom('#content img, .docs-content img', {
                        background: 'rgba(0, 0, 0, 0.85)',
                        margin: 24
                    });
                }
            });
        </script>
```

替换为：

```html
        <!-- Medium Zoom for images -->
        <script src="https://cdn.jsdelivr.net/npm/medium-zoom@1.1.0/dist/medium-zoom.min.js" defer></script>
        {{- $galleryZoom := resources.Get (printf "/%s/%s" ($.Scratch.Get "pathName") "js/gallery-zoom.js") | js.Build | minify -}}
        <script src="{{ $galleryZoom.RelPermalink }}" defer></script>
```

- [ ] **Step 2: Hugo 构建测试**

Run:
```bash
cd mysite && hugo --gc --minify
```

Expected: 构建成功，无错误输出。检查 `public/` 中是否生成了 gallery-zoom 的打包 JS 文件（文件名包含 hash，如 `gallery-zoom.*.js`）。

Run:
```bash
ls mysite/public/docs/js/gallery-zoom* 2>/dev/null || ls mysite/public/js/gallery-zoom* 2>/dev/null
```

Expected: 至少一个 `.js` 文件被列出。

- [ ] **Step 3: Commit**

```bash
git add mysite/themes/lotusdocs/layouts/docs/baseof.html
git commit -m "feat: wire up gallery-zoom.js in baseof layout

Replace inline medium-zoom init with js.Build pipeline.
Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

## Task 3: 添加导航按钮和计数器样式

**Files:**
- Modify: `mysite/themes/lotusdocs/assets/docs/scss/custom/plugins/medium-zoom/_medium-zoom.scss`

### 说明

在现有 z-index 覆盖的基础上，添加 `.gallery-nav` 及其子元素的样式。按钮在桌面端显示，移动端隐藏（通过 `@media` 查询）。

- [ ] **Step 1: 扩展 _medium-zoom.scss**

将 `mysite/themes/lotusdocs/assets/docs/scss/custom/plugins/medium-zoom/_medium-zoom.scss` 的完整内容替换为：

```scss
// medium-zoom z-index override to ensure overlay sits above top-header (999) and sidebar (1000)
.medium-zoom-overlay {
    z-index: 1001 !important;
}

.medium-zoom-image--opened {
    z-index: 1002 !important;
}

// Gallery Navigation
.gallery-nav {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    z-index: 1003;
}

.gallery-nav-btn {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    width: 44px;
    height: 44px;
    border: none;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.15);
    color: #fff;
    font-size: 24px;
    line-height: 1;
    cursor: pointer;
    pointer-events: auto;
    opacity: 0.6;
    transition: opacity 0.2s ease, background 0.2s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0;

    &:hover {
        opacity: 1;
        background: rgba(255, 255, 255, 0.25);
    }

    &.is-disabled {
        opacity: 0.2;
        pointer-events: none;
    }
}

.gallery-nav-prev {
    left: 16px;
}

.gallery-nav-next {
    right: 16px;
}

.gallery-nav-counter {
    position: absolute;
    bottom: 20px;
    left: 50%;
    transform: translateX(-50%);
    color: rgba(255, 255, 255, 0.7);
    font-size: 14px;
    pointer-events: auto;
}

// Fast transition for gallery image switching
.medium-zoom-image {
    transition-duration: 150ms !important;
}

// Hide buttons on mobile, rely on swipe
@media (max-width: 768px) {
    .gallery-nav-btn {
        display: none;
    }
}
```

- [ ] **Step 2: Hugo 构建测试**

Run:
```bash
cd mysite && hugo --gc --minify
```

Expected: 构建成功，无 SCSS 编译错误。

验证生成的 CSS 中包含 gallery-nav 规则：

```bash
grep -q "gallery-nav" mysite/public/docs/scss/style.css || grep -q "gallery-nav" mysite/public/scss/style.css
```

Expected: 命令返回 0（找到匹配）。

- [ ] **Step 3: Commit**

```bash
git add mysite/themes/lotusdocs/assets/docs/scss/custom/plugins/medium-zoom/_medium-zoom.scss
git commit -m "feat: add gallery navigation button and counter styles

Styles for prev/next buttons, counter, disabled state,
mobile hide, and fast image transition.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

## Task 4: 端到端验证

**Files:**
- 无文件变更，纯验证

### 说明

在包含多张图片的内容页上，验证放大导航的完整功能。

- [ ] **Step 1: 完整 Hugo 构建**

Run:
```bash
cd mysite && hugo --gc --minify
```

Expected: `public/` 目录生成成功，无错误。

- [ ] **Step 2: 启动本地服务器**

Run:
```bash
cd mysite && python3 -m http.server 1313 --directory public
```

（或在后台运行，然后打开浏览器访问 `http://localhost:1313`）

- [ ] **Step 3: 浏览器验证清单**

访问一个包含多张图片的页面（如 `/docs/design/renderings/`），逐一验证：

| 检查项 | 预期结果 |
|--------|----------|
| 点击任意图片放大 | medium-zoom 正常打开，背景遮罩显示 |
| 左右按钮出现 | 图片两侧显示 `‹ ›` 圆形按钮 |
| 计数器正确 | 底部显示 `N / M`，与当前图片位置一致 |
| 点击 `›` | 切换到同页面下一张图片 |
| 点击 `‹` | 切换到上一张图片 |
| 第一张图按 `‹` | 按钮禁用（opacity 0.2），无反应 |
| 最后一张图按 `›` | 按钮禁用，无反应 |
| 键盘左箭头 | 切换到上一张 |
| 键盘右箭头 | 切换到下一张 |
| 点击遮罩/Esc | zoom 关闭，按钮和计数器消失 |
| 移动端滑动 | 左滑下一张，右滑上一张，按钮隐藏 |
| 快速连续点击 | 无异常，切换锁正常工作 |

- [ ] **Step 4: Commit（如有修复）**

如果验证过程中发现 bug 并修复，单独提交修复：

```bash
git add <fixed-files>
git commit -m "fix: <description>"
```

如果无修复，此步骤跳过。

---

## Self-Review Checklist

### 1. Spec Coverage

| Spec 需求 | 对应 Task |
|-----------|-----------|
| 保留 medium-zoom | Task 2（保留 CDN 引入） |
| 全页画廊切换 | Task 1（`collectImages` 收集所有正文图片） |
| 桌面端 `<> ` 按钮 | Task 1（`createNavUI`）、Task 3（按钮样式） |
| 键盘左右方向键 | Task 1（`onKeyDown`） |
| 移动端滑动手势 | Task 1（`onTouchStart`/`onTouchEnd`） |
| 到头停止 | Task 1（`navigate` 边界检查 + `updateNavUI` 禁用按钮） |
| 计数器 N/M | Task 1（`updateNavUI`）、Task 3（计数器样式） |
| 无障碍 | Task 1（`aria-label`、`aria-live`） |

### 2. Placeholder Scan

- 无 TBD / TODO
- 无 "add appropriate error handling" 等模糊描述
- 每个代码步骤包含完整代码

### 3. Type/Signature Consistency

- `mediumZoom` 全局函数在各处引用一致
- CSS class 名在 JS 和 SCSS 中一一对应
- `images[]` 在 Task 1 中定义为 `Array.from(document.querySelectorAll(...))`，后续通过 `indexOf` 查找索引，类型一致

---

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-05-22-image-zoom-navigation.md`.

**Two execution options:**

1. **Subagent-Driven (recommended)** - Dispatch a fresh subagent per task, review between tasks, fast iteration
2. **Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

**Which approach?**
