# 修复图片放大被菜单栏遮挡

## 背景

medium-zoom 放大图片时，overlay 默认 z-index 为 999，与 top-header 和 sidebar（z-index 999–1000）冲突，导致菜单栏遮挡放大图片。

## 目标

通过 CSS 提升 medium-zoom overlay 和放大图片的 z-index，使其自然覆盖在菜单栏之上。

## 方案

在主题 SCSS 中添加：

```scss
.medium-zoom-overlay {
    z-index: 1001 !important;
}

.medium-zoom-image--opened {
    z-index: 1002 !important;
}
```

## 文件变更

- **修改**: `mysite/themes/lotusdocs/assets/docs/scss/custom/plugins/medium-zoom/_medium-zoom.scss`（新建）
- **修改**: `mysite/themes/lotusdocs/assets/docs/scss/style.scss`（引入新文件）

## 验证标准

- [ ] Hugo 构建无错误
- [ ] 放大图片时菜单栏不再遮挡
- [ ] 关闭放大后恢复正常
