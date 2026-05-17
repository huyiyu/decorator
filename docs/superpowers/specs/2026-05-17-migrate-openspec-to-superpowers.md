# 迁移 OPENSPEC 到 SUPERPOWER

## 背景

本项目（装修手记）之前使用 OPENSPEC 进行变更管理，包含 4 个本地技能（`openspec-propose`、`openspec-explore`、`openspec-apply-change`、`openspec-archive-change`）、4 个命令（`/opsx:propose`、`/opsx:explore`、`/opsx:apply`、`/opsx:archive`）以及一个 `openspec/` 目录存放配置和归档的变更。

决策：完全迁移到内置的 Superpowers 工作流，删除所有 OPENSPEC 相关内容。

## 变更范围

### 删除项

1. **`openspec/` 目录**
   - `config.yaml`
   - `changes/archive/2026-04-28-second-communication-and-image-zoom/.openspec.yaml`
   - `changes/archive/2026-04-28-second-communication-and-image-zoom/proposal.md`
   - `changes/archive/2026-04-28-second-communication-and-image-zoom/tasks.md`

2. **`.claude/skills/openspec-*`（4 个技能目录）**
   - `openspec-propose/SKILL.md`
   - `openspec-explore/SKILL.md`
   - `openspec-apply-change/SKILL.md`
   - `openspec-archive-change/SKILL.md`

3. **`.claude/commands/opsx/*`（4 个命令文件）**
   - `propose.md`
   - `explore.md`
   - `apply.md`
   - `archive.md`
   - 若 `opsx/` 目录变空则一并删除

### 新增项

1. **`.claude/CLAUDE.md`** — 项目背景知识文件，包含：
   - 项目概述（Hugo 静态网站 + LotusDocs 主题）
   - 技术栈（Hugo v0.160.1、Nginx、Docker）
   - 项目结构（mysite/、Dockerfile、nginx.conf）
   - 内容组织方式
   - 构建与部署方式

## 迁移映射

| OPENSPEC 功能 | Superpowers 替代 |
|--------------|-----------------|
| `/opsx:explore` | `Skill: superpowers:brainstorming` 或 `/brainstorm` |
| `/opsx:propose` | `Skill: superpowers:brainstorming` + `Skill: superpowers:writing-plans` |
| `/opsx:apply` | `Skill: superpowers:executing-plans` 或 `/execute-plan` |
| `/opsx:archive` | 手动归档（无对应技能） |

## 验证标准

- [ ] `openspec/` 目录已完全删除
- [ ] `.claude/skills/openspec-*` 已完全删除
- [ ] `.claude/commands/opsx/` 已完全删除
- [ ] `.claude/CLAUDE.md` 已生成且内容准确
- [ ] 无残留 openspec 相关文件
