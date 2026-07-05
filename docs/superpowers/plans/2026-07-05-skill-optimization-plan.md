# OpenPM SKILL.md 优化实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 优化 openpm/SKILL.md 的描述、结构、内容，新增 references/commands.md 和 README.md

**Architecture:** 纯文档编辑——修改 openpm/SKILL.md（重写 description、重构工程实践节、添加 docs 引用、精简命令示例），从 SKILL.md 提取完整命令参考到新文件 openpm/references/commands.md，新建 openpm/README.md

**Tech Stack:** Markdown + YAML frontmatter

---

### Task 1: 重写 description

**Files:**
- Modify: `openpm/SKILL.md:1-9`

- [ ] **Step 1: 替换 frontmatter 中的 description 字段**

将当前 description：

```
description: AI Agent 敏捷项目管理——当需要创建任务、规划 Sprint、更新进度、记录工作日志时使用。覆盖完整开发流程的项目管理数据操作。
```

替换为：

```
description: AI Agent 敏捷项目管理助手。当用户提到任何项目管理相关内容时必须激活——包括但不限于：任务、待办、Task、Sprint、迭代、Epic、Milestone、里程碑、进度、工作日志、验收标准、需求拆解、每日站会、Scrum、敏捷。也适用于日常对话式场景："今天做了什么""接下来做什么""项目进展如何""规划下个迭代""关闭这个 Sprint""还剩多少任务"。Agent 以执行者+导航员双重角色，通过 CLI 操作 .openpm/ 中的 Task/Sprint/Epic/Milestone/Log 实体，覆盖需求定义→迭代规划→执行→复盘全流程。
```

- [ ] **Step 2: 验证 frontmatter 结构正确**

```bash
node -e "const fs = require('fs'); const content = fs.readFileSync('openpm/SKILL.md', 'utf8'); const match = content.match(/^---\n([\s\S]*?)\n---/); if (!match || !match[1].includes('description:')) { console.log('FAIL: frontmatter invalid'); process.exit(1); } console.log('PASS: frontmatter valid');"
```

- [ ] **Step 3: Commit**

```bash
git add openpm/SKILL.md
git commit -m "docs(skill): rewrite description for broader trigger coverage"
```

---

### Task 2: 新建 references/commands.md，从 SKILL.md 移出命令参考

**Files:**
- Create: `openpm/references/commands.md`
- Modify: `openpm/SKILL.md`

- [ ] **Step 1: 创建 references/commands.md**

从 SKILL.md 第 261-331 行的命令参考内容提取到新文件。内容如下：

```markdown
# OpenPM CLI 命令参考

所有命令通过 Node.js 执行：

```bash
node openpm/scripts/cli.js <entity> <action> [--flags]
```

## 初始化

```bash
node openpm/scripts/cli.js init                        # 创建 .openpm/ 目录
```

## Task

```bash
node openpm/scripts/cli.js task create --title "..." --status todo --priority medium --type task [--sprint sprint-x] [--epic epic-x] [--depends-on task-xxx] [--ac "标准1;标准2"]
node openpm/scripts/cli.js task list [--sprint sprint-x] [--status todo|in_progress|done] [--epic epic-x]
node openpm/scripts/cli.js task show <task-id>          # 查看详情和 AC
node openpm/scripts/cli.js task start <task-id>         # 复合命令：验证依赖 → 读 AC → 标记 in_progress
node openpm/scripts/cli.js task update <task-id> --status done [--title "..."]
node openpm/scripts/cli.js task delete <task-id>
```

## Sprint

```bash
node openpm/scripts/cli.js sprint create --name "Sprint 1" --goal "..." --start 2026-07-01 --end 2026-07-14
node openpm/scripts/cli.js sprint list
node openpm/scripts/cli.js sprint show <sprint-id>
node openpm/scripts/cli.js sprint start --id sprint-1   # 激活 Sprint (plan → active)
node openpm/scripts/cli.js sprint update <sprint-id> --name "..." --goal "..."
node openpm/scripts/cli.js sprint close <sprint-id>     # 关闭并生成 summary；未完成任务自动迁移
node openpm/scripts/cli.js sprint delete <sprint-id> [--force]
```

## Epic

```bash
node openpm/scripts/cli.js epic create --title "用户认证系统"
node openpm/scripts/cli.js epic list
node openpm/scripts/cli.js epic show <epic-id>
node openpm/scripts/cli.js epic update <epic-id> --title "..." --status in_progress
node openpm/scripts/cli.js epic delete <epic-id> [--force]
```

## Milestone

```bash
node openpm/scripts/cli.js milestone create --name "MVP v0.1" --date 2026-08-01
node openpm/scripts/cli.js milestone list
node openpm/scripts/cli.js milestone show <ms-id>
node openpm/scripts/cli.js milestone update <ms-id> --name "..." --date ... --status current
node openpm/scripts/cli.js milestone delete <ms-id>
```

## Log

```bash
node openpm/scripts/cli.js log today [--summary "..."] [--tasks "task-001:done,task-002:in_progress"]
node openpm/scripts/cli.js log show <date>              # 读取指定日期日志
node openpm/scripts/cli.js log list                     # 列出所有日志
```

## Summary & Web

```bash
node openpm/scripts/cli.js summary --sprint sprint-1    # 查看 Sprint 总结
node openpm/scripts/cli.js web [--port 23214]           # 启动 Web 仪表盘
```
```

- [ ] **Step 2: 在 SKILL.md 中原命令参考位置替换为精简版 + 引用**

将 SKILL.md 第 261-331 行的 `## 命令参考` 节替换为：

```markdown
## 命令参考

常用命令速查。完整参考见 `references/commands.md`。

```bash
node openpm/scripts/cli.js <entity> <action> [--flags]
```

### 常用操作

```bash
# 查看状态
node openpm/scripts/cli.js task list [--sprint sprint-x] [--status todo|in_progress|done]
node openpm/scripts/cli.js sprint list
node openpm/scripts/cli.js epic list

# 创建实体
node openpm/scripts/cli.js task create --title "..." --status todo --priority medium --type task [--epic epic-x]
node openpm/scripts/cli.js sprint create --name "..." --goal "..." --start YYYY-MM-DD --end YYYY-MM-DD
node openpm/scripts/cli.js epic create --title "..."

# 状态流转
node openpm/scripts/cli.js task start <task-id>        # 验证依赖 → 读 AC → 标记 in_progress
node openpm/scripts/cli.js task update <task-id> --status done

# Sprint 生命周期
node openpm/scripts/cli.js sprint start --id sprint-1   # 🛑 需用户确认
node openpm/scripts/cli.js sprint close sprint-1        # 🛑 需用户确认

# 日常记录
node openpm/scripts/cli.js log today --summary "..." --tasks "task-001:done"

# 仪表盘
node openpm/scripts/cli.js web [--port 23214]
```
```

- [ ] **Step 3: 验证 references/ 目录结构**

```bash
test -f openpm/references/commands.md && echo "PASS" || echo "FAIL"
```

- [ ] **Step 4: Commit**

```bash
git add openpm/references/commands.md openpm/SKILL.md
git commit -m "docs(skill): extract command reference to references/commands.md"
```

---

### Task 3: 在 SKILL.md 关键位置引用 docs/pm-practices/

**Files:**
- Modify: `openpm/SKILL.md`

- [ ] **Step 1: 阶段 1 末尾添加 INVEST 引用**

在阶段 1 的"🛑 决策点"之前，引导话术之后，加入：

```markdown
> **参考**：评估 Task 质量时阅读 `docs/pm-practices/invest.md`；需求模糊时参考 `docs/pm-practices/agile-principles.md`。
```

- [ ] **Step 2: 阶段 2 末尾添加 Scrum 引用**

在阶段 2 的"🛑 决策点"之前加入：

```markdown
> **参考**：规划 Sprint 时阅读 `docs/pm-practices/scrum.md` 了解 Sprint 机制和容量规划原则。
```

- [ ] **Step 3: 阶段 3 末尾添加 DoD 和 commit 引用**

在阶段 3 的引导话术之后加入：

```markdown
> **参考**：标记 done 前阅读 `docs/pm-practices/dod-checklist.md` 逐项检查；编码时参考 `docs/pm-practices/conventional-commits.md` 的 commit 格式。
```

- [ ] **Step 4: Commit**

```bash
git add openpm/SKILL.md
git commit -m "docs(skill): add references to docs/pm-practices in workflow phases"
```

---

### Task 4: 重构工程实践节 —— 硬性规则改为工作原则

**Files:**
- Modify: `openpm/SKILL.md`

- [ ] **Step 1: 替换「工程实践」和「硬性规则」两个节**

将 SKILL.md 中当前的「工程实践」和「硬性规则」内容（约第 333-348 行）替换为：

```markdown
## 工程实践

### 工作原则

以下是 Agent 在执行项目管理时的行为准则。理解每条规则背后的原因，比机械执行更重要。

**修改前先确认状态** — 实体可能已被其他操作改变。`show` 或 `list` 确保你基于最新数据做决策，而非过期记忆。

**done 前闭合依赖** — 如果 B 依赖 A 而 A 未完成，标记 B 为 done 会产生假性进度。CLI 在 `task update --status done` 时自动校验 `depends_on` 并拒绝不合法操作——但 Agent 也应主动理解依赖关系，不依赖 CLI 兜底。

**一个 Task 聚焦一件事** — 如果编码涉及多个独立关注点，拆成多个 Task 而非塞进一个。粒度标准：单个 Task 应在 1 天内可完成。当发现一个 Task 做了超过 1 天仍未完成时，考虑拆分。

**完成即记录** — 编码完成后立即 `task update --status done`，不等积累。延迟更新会导致状态与实际进度脱节，破坏 Sprint 燃尽图和完成率统计的准确性。

**关键决策等用户拍板** — Sprint 启动和关闭是不可逆或难以回滚的操作，必须用户明确确认后才能执行。这些节点在流程中标记为 🛑。

### 质量标准

- **DoD**：Task 标记 done 前，验收标准全满足、依赖已闭合、commit 含 task-id。详细检查清单见 `docs/pm-practices/dod-checklist.md`
- **Task 粒度**：单个 Task 1 天内可完成。超出则拆分。INVEST 原则见 `docs/pm-practices/invest.md`
- **Sprint 容量**：5-12 个 Task，≥50% story，≤20% bug。Scrum 指南见 `docs/pm-practices/scrum.md`
- **Commit 规范**：每个 commit 对应一个 Task，格式 `feat(task-xxx): 描述`。详见 `docs/pm-practices/conventional-commits.md`
- **AC 写法**：可验证陈述句。如"输入正确密码后 3 秒内跳转首页"，而非"登录功能正常"
- **依赖**：每个 Task 的 depends_on ≤ 2 个

### references 索引

当遇到以下场景时，阅读对应的参考文件获取详细指导：

| 场景 | 阅读 |
|------|------|
| Task 拆解质量评估 | `docs/pm-practices/invest.md` |
| Sprint 机制和容量规划 | `docs/pm-practices/scrum.md` |
| done 前检查清单 | `docs/pm-practices/dod-checklist.md` |
| commit 格式规范 | `docs/pm-practices/conventional-commits.md` |
| 需求模糊需要价值观引导 | `docs/pm-practices/agile-principles.md` |
| 完整 CLI 命令参考 | `references/commands.md` |
```

- [ ] **Step 2: 验证「硬性规则」已不在文件中**

```bash
grep -q "硬性规则" openpm/SKILL.md && echo "FAIL: 硬性规则 still present" || echo "PASS"
```

- [ ] **Step 3: Commit**

```bash
git add openpm/SKILL.md
git commit -m "docs(skill): rewrite engineering practices as principles with rationale"
```

---

### Task 5: 新建 README.md

**Files:**
- Create: `openpm/README.md`

- [ ] **Step 1: 创建 README.md**

```markdown
# OpenPM · AI 原生项目管理

OpenPM 是一个 AI Agent 驱动的敏捷项目管理技能。**Agent 操作数据，人类浏览仪表盘**——所有项目数据以 Markdown + YAML 格式存放在项目 `.openpm/` 目录中，零外部依赖，完全由你掌控。

## 工作原理

```
你说"我要做用户认证功能"
        ↓
Agent 拆解为 Task，创建 Sprint，逐个实现
        ↓
你通过 Web 仪表盘看进度、做决策
```

Agent 以**执行者 + 导航员**双重角色运行：
- **执行者**：通过 CLI 读写 Task/Sprint/Epic/Milestone/Log 数据
- **导航员**：主动告知当前位置、提示下一步、在关键决策点等待你拍板

## 快速开始

在 Claude Code 中对 Agent 说：

1. **初始化**（首次使用）：
   > "初始化项目管理"
   
   Agent 会在项目根目录创建 `.openpm/` 数据目录。

2. **创建需求**：
   > "我要做一个用户认证系统，包含登录、注册、找回密码"
   
   Agent 会创建 Epic，拆解为 Task，并为每个 Task 编写验收标准。你确认后进入下一步。

3. **规划迭代**：
   Agent 会展示所有待规划 Task，建议 Sprint 内容。你说"开始"后，Agent 启动 Sprint。

4. **执行**：
   Agent 逐个完成 Task，每次完成都会更新状态并记录工作日志。你可以随时打开仪表盘看进度：
   > "打开项目管理仪表盘"

5. **复盘**：
   Sprint 结束时，Agent 展示完成情况、未完成任务、里程碑进展。你说"关闭"后，Agent 生成总结。

## 关键决策点

在这些节点 Agent **必须**等你确认后才能继续：

| 决策点 | 阶段 | 说明 |
|--------|------|------|
| 确认 Task 拆解和验收标准 | 阶段 1 | 你决定做什么、做到什么程度 |
| 启动 Sprint | 阶段 2 | 你决定这个迭代的内容 |
| 关闭 Sprint | 阶段 4 | 你确认交付成果、决定遗留任务去向 |

## 目录结构

```
openpm/
├── SKILL.md              # AI Agent 的工作流指南
├── README.md             # 本文档（给人类看的）
├── references/
│   └── commands.md       # 完整 CLI 命令参考（Agent 按需加载）
├── docs/
│   └── pm-practices/     # 敏捷实践知识库
│       ├── agile-principles.md    # 敏捷宣言与原则
│       ├── scrum.md               # Scrum 指南
│       ├── invest.md              # INVEST 原则
│       ├── dod-checklist.md       # DoD 检查清单
│       └── conventional-commits.md # Commit 规范
├── scripts/              # CLI 实现 + Web 仪表盘
│   ├── cli.js            # CLI 入口
│   ├── commands/         # 命令处理器
│   ├── lib/              # 工具库
│   ├── web/              # HTTP 服务
│   └── web-ui/           # 仪表盘前端
└── templates/            # 实体模板
```

## 数据存储

所有项目数据存在项目根目录的 `.openpm/` 中：

```
你的项目/
├── .openpm/
│   ├── tasks/            # 每个 Task 一个 .md 文件
│   ├── sprints/          # Sprint 定义 + 自动生成的 Summary
│   ├── epics/            # Epic 定义
│   ├── milestones/       # Milestone 定义
│   └── logs/             # 每日工作日志
├── src/
└── ...
```

纯文本，可版本控制，不依赖任何外部服务。
```

- [ ] **Step 2: 验证文件存在**

```bash
test -f openpm/README.md && echo "PASS" || echo "FAIL"
```

- [ ] **Step 3: Commit**

```bash
git add openpm/README.md
git commit -m "docs: add README.md for human users"
```

---

### Task 6: 最终验证

**Files:**
- Check: `openpm/SKILL.md`
- Check: `openpm/references/commands.md`
- Check: `openpm/README.md`

- [ ] **Step 1: 检查 SKILL.md 行数在目标范围内**

```bash
lines=$(wc -l < openpm/SKILL.md)
echo "SKILL.md: $lines lines"
test $lines -le 250 && echo "PASS: under 250 lines" || echo "NOTE: over 250 lines"
```

- [ ] **Step 2: 检查 frontmatter 完整**

```bash
node -e "
const fs = require('fs');
const content = fs.readFileSync('openpm/SKILL.md', 'utf8');
const match = content.match(/^---\n([\s\S]*?)\n---/);
const fm = match[1];
['name:', 'description:', 'version:', 'license:'].forEach(f => {
  if (!fm.includes(f)) { console.log('FAIL: missing ' + f); process.exit(1); }
});
console.log('PASS: all frontmatter fields present');
"
```

- [ ] **Step 3: 检查所有引用路径有效**

```bash
for f in openpm/references/commands.md openpm/docs/pm-practices/agile-principles.md openpm/docs/pm-practices/scrum.md openpm/docs/pm-practices/invest.md openpm/docs/pm-practices/dod-checklist.md openpm/docs/pm-practices/conventional-commits.md; do
  test -f "$f" && echo "PASS: $f" || echo "FAIL: $f not found"
done
```

- [ ] **Step 4: Commit**

```bash
git add openpm/SKILL.md
git commit -m "chore: final verification of skill optimization"
```
