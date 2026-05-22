# 图片放大导航设计文档

## 背景

当前网站使用 medium-zoom 库对正文图片提供点击放大功能。每张图片独立放大，放大后无法在当前页面内的其他图片之间快速切换。用户希望在放大视图下增加前后导航能力，提升查看多张图片时的体验。

## 目标

- 放大图片后，支持在当前页面所有正文图片之间前后切换
- 桌面端：显示 `<>` 按钮 + 键盘左右方向键
- 移动端：滑动手势切换，隐藏按钮
- 切换到头停止（不循环）

## 架构

保留现有的 **medium-zoom** 库负责单张图片的放大动画和遮罩层。在其之上新增一个轻量的 **Gallery Navigation 层**。

| 模块 | 职责 |
|------|------|
| `ImageCollection` | 页面加载时收集所有正文图片，维护有序数组 |
| `medium-zoom` | 单张图片的放大/缩小动画、遮罩、点击关闭 |
| `NavUI` | 渲染 `<>` 按钮、图片计数器 |
| `InputController` | 监听键盘左右箭头 + 移动端触摸滑动 |

## 文件变更

- `themes/lotusdocs/layouts/docs/baseof.html`：移除内联的 medium-zoom 初始化脚本，改为通过 Hugo 的 `js.Build` 引入打包后的 `gallery-zoom.js`
- 新建 `themes/lotusdocs/assets/js/gallery-zoom.js`：Gallery Navigation 核心逻辑（图片收集、事件监听、NavUI 注入、切换控制）
- 修改 `themes/lotusdocs/assets/docs/scss/custom/plugins/medium-zoom/_medium-zoom.scss`：增加导航按钮、计数器、触摸滑动手势相关的样式

## 交互流程

```
页面加载
  └── 收集 #content img 所有图片 → images[]
  └── 初始化 medium-zoom(selector)

用户点击图片 N
  └── medium-zoom 打开图片 N
  └── Gallery 记录 currentIndex = N
  └── 注入 NavUI（按钮 + 计数器 + 键盘/触摸监听）

触发切换（点击按钮 / 左右键 / 滑动）
  └── 计算 targetIndex = currentIndex ± 1
  └── 边界检查（第一张禁用「上」，最后一张禁用「下」）
  └── 关闭当前 zoom → 打开目标 zoom
  └── 更新 NavUI（按钮状态 + 计数器）

点击遮罩 / 按 ESC / 点击关闭按钮
  └── medium-zoom 关闭
  └── Gallery 移除 NavUI，解绑事件
```

## 切换动画

medium-zoom 没有原生 gallery 切换 API。实现上采用「快速关闭→打开」方式，通过覆盖 CSS transition-duration 让切换间隔控制在 150ms 以内，视觉上呈现平滑的内容替换而非完整缩放回弹。

## 样式方案

| 元素 | 样式 |
|------|------|
| 左右按钮 | 圆形 44×44px，背景 `rgba(255,255,255,0.15)`，白色 `‹ ›` 图标，垂直居中于图片两侧，距边缘 16px |
| 按钮状态 | 默认 opacity 0.6，hover 1.0；禁用时 opacity 0.2 + pointer-events:none |
| 计数器 | 底部居中，14px，`rgba(255,255,255,0.7)`，格式 `N / M` |
| 移动端 | `@media (max-width: 768px)` 隐藏按钮，纯滑动手势 |
| z-index | 按钮 `1003`，在 zoomed-image (`1002`) 之上 |

## 边界处理

| 场景 | 处理 |
|------|------|
| 页面只有 0 或 1 张图 | 不注入导航 UI，保持原有 medium-zoom 行为 |
| 快速连续点击切换 | 加 `isTransitioning` 锁，动画期间忽略新指令 |
| 图片未完全加载时切换 | 等待图片 onload 后再执行打开，避免尺寸闪烁 |

## 无障碍

- 按钮添加 `aria-label="上一张" / "下一张"`
- 计数器使用 `aria-live="polite"`
- 切换后焦点保持在当前图片，不跳转到按钮
- ESC 关闭保持 medium-zoom 原有行为
