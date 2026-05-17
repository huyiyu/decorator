# 效果图阶段文章 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在设计篇创建「效果图阶段」文章，包含 20 张效果图和配套文字描述。

**Architecture：** 创建文章目录，复制精选效果图，编写 Markdown 内容，验证 Hugo 构建成功。

**Tech Stack：** Hugo, Markdown, Bash

---

### Task 1: 创建文章目录并复制图片

**Files:**
- Create: `mysite/content/docs/design/renderings/` 目录
- Create: 20 张 PNG 图片

- [ ] **Step 1: 创建目录**

Run: `mkdir -p mysite/content/docs/design/renderings`
Expected: 目录创建成功

- [ ] **Step 2: 复制图片**

Run:
```bash
cp ~/Downloads/images/客厅3.png mysite/content/docs/design/renderings/
cp ~/Downloads/images/餐厅+客厅.png mysite/content/docs/design/renderings/
cp ~/Downloads/images/餐厅-客厅视角-右.png mysite/content/docs/design/renderings/
cp ~/Downloads/images/餐厅-入户视角.png mysite/content/docs/design/renderings/
cp ~/Downloads/images/阳台-客厅连接点.png mysite/content/docs/design/renderings/
cp ~/Downloads/images/餐厨-客厅视角-左.png mysite/content/docs/design/renderings/
cp ~/Downloads/images/餐厨-客厅视角-合并.png mysite/content/docs/design/renderings/
cp ~/Downloads/images/客厅5.png mysite/content/docs/design/renderings/
cp ~/Downloads/images/客厅4.png mysite/content/docs/design/renderings/
cp ~/Downloads/images/主卧-餐厅视角.png mysite/content/docs/design/renderings/
cp ~/Downloads/images/客厅-南偏东视角.png mysite/content/docs/design/renderings/
cp ~/Downloads/images/客厅-次卧墙视角.png mysite/content/docs/design/renderings/
cp ~/Downloads/images/主卧-次卧墙.png mysite/content/docs/design/renderings/
cp ~/Downloads/images/主卧3.png mysite/content/docs/design/renderings/
cp ~/Downloads/images/主卧.png mysite/content/docs/design/renderings/
cp ~/Downloads/images/主卧2.png mysite/content/docs/design/renderings/
cp ~/Downloads/images/主卧-侧视图.png mysite/content/docs/design/renderings/
cp ~/Downloads/images/主卧-靠墙视角.png mysite/content/docs/design/renderings/
cp ~/Downloads/images/次卧.png mysite/content/docs/design/renderings/
cp ~/Downloads/images/次卧-主视右.png mysite/content/docs/design/renderings/
```

Expected: 全部复制成功

- [ ] **Step 3: 验证图片**

Run: `ls mysite/content/docs/design/renderings/ | wc -l`
Expected: 21（20 张图 + 后续创建的 index.md）

- [ ] **Step 4: Commit**

```bash
git add mysite/content/docs/design/renderings/
git commit -m "添加效果图阶段图片资源"
```

---

### Task 2: 编写文章 index.md

**Files:**
- Create: `mysite/content/docs/design/renderings/index.md`

- [ ] **Step 1: 编写文章全文**

内容结构：
- frontmatter（title, description, date, weight）
- 整体印象（2 张图）
- 入户与餐厨区（5 张图）
- 客厅（6 张图）
- 主卧（5 张图）
- 次卧（2 张图）
- 设计说明（奶油中古风总结表格）

每节包含：
- 空间描述文字（3-5 句）
- 图片 img 标签（max-width: 100%, border-radius: 6px）
- 竖构图图片使用 max-width: 70% 居中

- [ ] **Step 2: 验证文件存在**

Run: `ls mysite/content/docs/design/renderings/index.md`
Expected: 文件存在

- [ ] **Step 3: Commit**

```bash
git add mysite/content/docs/design/renderings/index.md
git commit -m "添加效果图阶段文章"
```

---

### Task 3: 验证 Hugo 构建

**Files:**
- 验证：Hugo 构建产物

- [ ] **Step 1: Hugo 构建**

Run:
```bash
cd mysite && hugo --gc --minify
```
Expected: 构建成功，无错误

- [ ] **Step 2: 检查生成页面**

Run: `ls mysite/public/docs/design/renderings/ 2>/dev/null || echo "未生成"`
Expected: 显示 index.html 和图片文件

- [ ] **Step 3: 检查图片引用**

Run: `grep -c 'img src' mysite/public/docs/design/renderings/index.html`
Expected: 20（或接近，取决于具体生成的 HTML）

- [ ] **Step 4: Commit（如 hugo 产物变更）**

Run: `git status`
若 public/ 有变更（通常被 .gitignore 忽略则不会），按需处理。

---

### Task 4: 最终检查

- [ ] **Step 1: 检查设计篇索引**

Run: `ls mysite/content/docs/design/`
Expected: _index.md, room-layout, renderings, vr-showcase

- [ ] **Step 2: 检查 git 状态**

Run: `git status`
Expected: 干净或仅新增文件

- [ ] **Step 3: 提交所有变更**

```bash
git add -A
git commit -m "完成效果图阶段文章"
```
