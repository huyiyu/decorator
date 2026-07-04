# 费用板块 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在装修手记 Hugo 站点中新增「费用」一级板块，包含全屋预算汇总表。

**Architecture:** 在 `mysite/content/docs/` 下新建 `fee/` 目录，`_index.md` 同时作为板块入口和内容载体。LotusDocs 主题自动发现目录结构，无需改动 Hugo 配置或其他文件。

**Tech Stack:** Hugo, Markdown

## Global Constraints

- 仅操作 `mysite/content/docs/fee/` 目录下的文件
- 不修改 `hugo.toml` 或其他已有文件
- 不引用其他板块内容
- 数据以设计文档为准，TBD 字段保持原样

---

### Task 1: 创建费用板块 _index.md

**Files:**
- Create: `mysite/content/docs/fee/_index.md`

**Interfaces:**
- Produces: Hugo 板块首页文件，包含完整预算汇总表

- [ ] **Step 1: 创建 fee 目录和 _index.md**

创建 `mysite/content/docs/fee/_index.md`，内容如下：

```markdown
+++
title = "费用"
description = "装修全屋预算汇总与费用追踪"
weight = 2
+++

全屋装修预算汇总，按项目记录费用明细与付款进度。

| 项目 | 总费用 | 付费阶段 | 金额（分期） | 已支出 |
|:---|:---:|:---|:---|:---:|
| 装修保证金 | ¥5,999.20 | 一次性交齐 | ¥5,999.20 | ¥5,999.20 |
| 砸墙 | ¥1,300 | 一次性交齐 | ¥1,300 | ¥1,300 |
| 设计费 | ¥20,000 | 签约30% → 深化80% → 验收100% | ¥6,000 / ¥10,000 / ¥4,000 | ¥16,000 |
| 硬装半包 | ¥155,000 | 签约50% → 尾款50% | ¥77,500 / ¥77,500 | ¥77,500 |
| 中央空调 | ¥60,000 | 定金¥10,000 → 安装前尾款 | ¥10,000 / ¥50,000 | ¥10,000 |
| 全屋定制 | ¥130,000 | 预付50% → TBD | ¥65,000 / TBD | ¥0 |
| 封窗 | ¥30,800 | 预付50% → TBD | ¥15,400 / TBD | ¥15,400 |
| **合计** | **¥403,099.20** | | | **¥126,199.20** |
| **待支出汇总** | | | | **¥276,900** |
```

> 说明：
> - TBD 字段保留，待后续装修进度中填入
> - 合计行 = 各项目总费用之和（¥5,999.20 + ¥1,300 + ¥20,000 + ¥155,000 + ¥60,000 + ¥130,000 + ¥30,800 = ¥403,099.20）
> - 已支出合计 = 各项目已支出之和（¥5,999.20 + ¥1,300 + ¥16,000 + ¥77,500 + ¥10,000 + ¥15,400 = ¥126,199.20）
> - 待支出汇总 = ¥403,099.20 − ¥126,199.20 = ¥276,900
> - 金额（分期）列中用 `/` 分隔各阶段金额

- [ ] **Step 2: 构建并验证**

```bash
cd mysite && hugo --gc --minify
```

- 预期：构建成功，无错误
- 验证：确认 `mysite/public/docs/fee/index.html` 已生成，包含完整表格

- [ ] **Step 3: 提交**

```bash
git add mysite/content/docs/fee/_index.md
git commit -m "feat: add fee section with budget summary table

- New top-level fee section in sidebar
- Budget table with 7 confirmed items and summary rows

Co-Authored-By: Claude <noreply@anthropic.com>"
```
