# 迁移 OPENSPEC 到 SUPERPOWER Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 从项目中完全移除 OPENSPEC 及其依赖，迁移到内置 Superpowers 工作流，并生成 CLAUDE.md。

**Architecture：** 直接删除所有 openspec 相关文件和目录，然后基于项目现状生成 CLAUDE.md 背景知识文件。不涉及代码变更，无测试需求。

**Tech Stack：** Bash, Git, Markdown

---

### Task 1: 删除 openspec/ 目录

**Files:**
- Delete: `openspec/`（递归删除整个目录）

- [ ] **Step 1: 验证 openspec/ 目录存在并列出内容**

Run: `ls -la openspec/ && find openspec -type f`
Expected: 显示 config.yaml 和 changes/archive/ 下的文件

- [ ] **Step 2: 删除 openspec/ 目录**

Run: `rm -rf openspec/`
Expected: 无输出（成功）

- [ ] **Step 3: 验证删除成功**

Run: `ls openspec/ 2>&1`
Expected: "没有那个文件或目录" 或类似错误

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "移除 openspec 目录及所有变更记录"
```

---

### Task 2: 删除 openspec 本地技能

**Files:**
- Delete: `.claude/skills/openspec-propose/`
- Delete: `.claude/skills/openspec-explore/`
- Delete: `.claude/skills/openspec-apply-change/`
- Delete: `.claude/skills/openspec-archive-change/`

- [ ] **Step 1: 验证技能目录存在**

Run: `ls -la .claude/skills/`
Expected: 显示 4 个 openspec-* 目录

- [ ] **Step 2: 删除所有 openspec 技能目录**

Run: `rm -rf .claude/skills/openspec-*`
Expected: 无输出（成功）

- [ ] **Step 3: 验证删除成功**

Run: `ls .claude/skills/`
Expected: 不再显示任何 openspec-* 目录

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "移除 openspec 本地技能"
```

---

### Task 3: 删除 opsx 命令

**Files:**
- Delete: `.claude/commands/opsx/propose.md`
- Delete: `.claude/commands/opsx/explore.md`
- Delete: `.claude/commands/opsx/apply.md`
- Delete: `.claude/commands/opsx/archive.md`
- Delete（若为空）: `.claude/commands/opsx/`

- [ ] **Step 1: 验证命令文件存在**

Run: `ls -la .claude/commands/opsx/`
Expected: 显示 4 个 .md 文件

- [ ] **Step 2: 删除 opsx 目录及其内容**

Run: `rm -rf .claude/commands/opsx/`
Expected: 无输出（成功）

- [ ] **Step 3: 验证删除成功**

Run: `ls .claude/commands/opsx/ 2>&1`
Expected: "没有那个文件或目录" 或类似错误

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "移除 opsx 命令入口"
```

---

### Task 4: 生成 CLAUDE.md

**Files:**
- Create: `.claude/CLAUDE.md`

- [ ] **Step 1: 阅读项目关键文件获取背景信息**

阅读以下文件以收集项目背景：
- `Dockerfile` — 构建方式
- `nginx.conf` — 服务配置
- `entrypoint.sh` — 启动脚本
- `mysite/content/docs/_index.md` — 网站主题
- `mysite/themes/lotusdocs/README.md` — 主题信息（可选）
- `.github/workflows/docker-build.yml` — CI 配置

- [ ] **Step 2: 生成 CLAUDE.md**

基于收集的信息，创建 `.claude/CLAUDE.md`，内容应包括：
- 项目概述（装修手记 — Hugo 静态网站）
- 技术栈（Hugo v0.160.1、LotusDocs 主题、Nginx、Docker）
- 项目结构说明
- 内容组织方式（docs/ 下的沟通、设计、施工等分类）
- 构建与部署方式（Docker 多阶段构建 + GitHub Actions 推送 Docker Hub）
- 开发注意事项

- [ ] **Step 3: 验证文件生成成功**

Run: `ls -la .claude/CLAUDE.md && head -20 .claude/CLAUDE.md`
Expected: 文件存在且有内容

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "添加 CLAUDE.md 项目背景知识文件"
```

---

### Task 5: 最终验证

- [ ] **Step 1: 全局检查无残留 openspec 文件**

Run: `find . -path './.git' -prune -o -name '*openspec*' -print 2>/dev/null | grep -v '.git/'`
Expected: 无输出（表示无残留）

- [ ] **Step 2: 验证 .claude 目录结构**

Run: `find .claude -type f | sort`
Expected: 显示 CLAUDE.md 和可能的其他文件，但无任何 openspec 或 opsx 相关内容

- [ ] **Step 3: 显示最终 git status**

Run: `git status`
Expected: 工作区干净（无未提交更改）
