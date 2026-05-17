# 修复 medium-zoom 被菜单栏遮挡 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 提升 medium-zoom overlay 和放大图片的 z-index，使其高于 top-header (999) 和 sidebar (1000)。

**Architecture：** 通过新建 SCSS 文件覆盖 medium-zoom 默认 z-index，并在主题入口引入。

**Tech Stack：** Hugo, SCSS

---

### Task 1: 创建 medium-zoom SCSS 覆盖文件

**Files:**
- Create: `mysite/themes/lotusdocs/assets/docs/scss/custom/plugins/medium-zoom/_medium-zoom.scss`
- Modify: `mysite/themes/lotusdocs/assets/docs/scss/style.scss`

- [ ] **Step 1: 创建 SCSS 文件**

```scss
// medium-zoom z-index override
.medium-zoom-overlay {
    z-index: 1001 !important;
}

.medium-zoom-image--opened {
    z-index: 1002 !important;
}
```

Run:
```bash
mkdir -p mysite/themes/lotusdocs/assets/docs/scss/custom/plugins/medium-zoom
cat > mysite/themes/lotusdocs/assets/docs/scss/custom/plugins/medium-zoom/_medium-zoom.scss << 'EOF'
// medium-zoom z-index override
.medium-zoom-overlay {
    z-index: 1001 !important;
}

.medium-zoom-image--opened {
    z-index: 1002 !important;
}
EOF
```

Expected: 文件创建成功

- [ ] **Step 2: 在 style.scss 中引入**

在 `mysite/themes/lotusdocs/assets/docs/scss/style.scss` 的 `@import` 区域添加：

```scss
@import "custom/plugins/medium-zoom/medium-zoom";
```

- [ ] **Step 3: 验证引入位置**

检查 style.scss 中其他 plugin 的引入方式，保持一致。

- [ ] **Step 4: Commit**

```bash
git add mysite/themes/lotusdocs/assets/docs/scss/custom/plugins/medium-zoom/_medium-zoom.scss
git add mysite/themes/lotusdocs/assets/docs/scss/style.scss
git commit -m "fix: 提升 medium-zoom z-index 避免被菜单栏遮挡"
```

---

### Task 2: 验证 Hugo 构建

**Files:**
- 验证：构建产物

- [ ] **Step 1: Hugo 构建**

Run:
```bash
cd mysite && hugo --gc --minify
```

Expected: 构建成功，无 SCSS 编译错误

- [ ] **Step 2: 检查生成的 CSS**

Run:
```bash
grep -A 2 "medium-zoom-overlay" mysite/public/docs/scss/style.css 2>/dev/null || grep -r "medium-zoom-overlay" mysite/public/ --include="*.css" | head -5
```

Expected: 包含 `z-index: 1001` 规则

- [ ] **Step 3: Commit（如有变更）**

若 public/ 有变更（通常被 .gitignore 忽略则不会），按需处理。

---

### Task 3: 最终检查

- [ ] **Step 1: 检查 git 状态**

Run: `git status`
Expected: 干净或仅新增文件

- [ ] **Step 2: 提交所有变更**

```bash
git add -A
git commit -m "完成 medium-zoom z-index 修复"
```
