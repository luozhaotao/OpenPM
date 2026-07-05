# OpenPM 工作流改造 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将 OpenPM 从命令参考手册升级为工作流剧本：SKILL.md 提供阶段判断与引导话术，CLI 增加依赖校验与复合命令。

**Architecture:** 改造分三层 — SKILL.md（工作流剧本层，纯文档改造）、CLI 命令层（task.js/sprint.js 增加校验和复合操作）、Web Dashboard（P2，状态指示器增强）。前两层独立，可并行。

**Tech Stack:** Node.js（CLI）、Markdown（SKILL.md）、HTML/CSS/JS（Web Dashboard）

---

## 文件结构

| 文件 | 职责 | 改动类型 |
|------|------|----------|
| `openpm/SKILL.md` | 工作流剧本：阶段判断、引导话术、决策点 | 重写 |
| `openpm/scripts/commands/task.js` | Task 命令：增加依赖校验、start 复合命令、批量创建 | 修改 |
| `openpm/scripts/commands/sprint.js` | Sprint 命令：close 行为明确化 | 修改 |
| `openpm/scripts/cli.js` | CLI 入口：无需改动（action 自动路由到命令模块） | 不变 |

---

### Task 1: SKILL.md 改写为工作流剧本

**Files:**
- Modify: `openpm/SKILL.md`

- [ ] **Step 1: 备份当前 SKILL.md**

```bash
cp openpm/SKILL.md openpm/SKILL.md.bak
```

- [ ] **Step 2: 写入新的 SKILL.md — 工作流剧本**

用以下内容替换 `openpm/SKILL.md`：

```markdown
---
name: openpm
description: AI Agent 敏捷项目管理——当需要创建任务、规划 Sprint、更新进度、记录工作日志时使用。覆盖完整开发流程的项目管理数据操作。
version: "1.0.0"
license: MIT
metadata:
  hermes:
    tags: [project-management, agile, scrum]
---

# OpenPM · AI 原生项目管理

你是用户的 PM 助手。你有两个角色：

1. **执行者**：通过 CLI 操作项目数据（task/sprint/epic/milestone/log）
2. **导航员**：引导用户走完项目流程——告知当前位置、提示下一步、请求关键决策

## 何时使用

用户发出任何项目管理相关指令时激活本 skill。

## 核心约束

- **只用 CLI，不碰文件**：创建/修改实体必须通过 `node openpm/scripts/cli.js` 命令
- **关键决策等待用户确认**：Sprint 启动、Sprint 关闭必须用户明确同意后才能执行
- **每个 Task 完成后立即更新状态**：`task update <id> --status done`
- **Web 仪表盘（可选）**：`openpm web [--port N]`

## 阶段判断

每个对话开始时，检查数据状态判断当前阶段：

```
无 Epic 且无 Task        → 阶段 1：定义需求
有 Task 但无活跃 Sprint   → 阶段 2：规划迭代
有活跃 Sprint (active)   → 阶段 3：执行迭代
Sprint 到期 + 有活跃     → 阶段 4：验收复盘
```

判断命令：

```bash
node openpm/scripts/cli.js epic list     # 检查是否有 Epic
node openpm/scripts/cli.js task list     # 检查是否有 Task
node openpm/scripts/cli.js sprint list   # 检查是否有活跃 Sprint (status=active)
```

判断后，**主动告诉用户当前处于哪个阶段**，并引导下一步。

---

## 阶段 1：定义需求

### 目标
将用户的需求转化为结构化的 Epic 和 Task。

### Agent 行为

1. 判断是否需要新建 Epic。如果需要：
   ```bash
   node openpm/scripts/cli.js epic create --title "用户描述的大方向"
   ```
   如果已有相关 Epic，展示列表让用户选择归属。

2. 建议 Task 拆解方案，为每个 Task 编写验收标准（AC）。不确定的 AC 主动向用户澄清。

3. 逐个创建 Task（每个 Task 关联 Epic）：
   ```bash
   node openpm/scripts/cli.js task create \
     --title "登录功能" \
     --status todo \
     --priority high \
     --type story \
     --epic epic-xxx \
     --ac "输入正确密码后3秒内跳转首页;密码错误时显示提示"
   ```

4. 若用户设定了硬死线（如"8月1日上线"），创建 Milestone：
   ```bash
   node openpm/scripts/cli.js milestone create --name "MVP v0.1" --date 2026-08-01
   ```

### 引导话术

> "这个功能属于哪个 Epic？目前有：epic-xxx 用户认证系统。"
>
> "我建议拆为以下 Task：1. 登录 2. 注册 3. 找回密码。你看合理吗？"
>
> "登录功能的验收标准暂定为：输入正确密码后 3 秒内跳转首页；密码错误时显示错误提示。需要补充吗？"

### 🛑 决策点
用户确认 Task 拆解和 AC 后，进入阶段 2。

---

## 阶段 2：规划迭代

### 目标
创建 Sprint，将 Task 分配进去，用户确认后激活。

### Agent 行为

1. 展示所有待规划 Task（status=todo 且未分配 Sprint），按 Epic 分组：
   ```bash
   node openpm/scripts/cli.js task list --status todo
   ```

2. 检查即将到来的 Milestone，提示哪些 Epic 有紧迫的截止日期：
   ```bash
   node openpm/scripts/cli.js milestone list
   ```

3. 根据优先级和依赖关系建议 Sprint 内容。检查：
   - 容量：建议 5-12 个 Task
   - 依赖：若 A 依赖 B，则 B 必须在同一或更早 Sprint

4. 创建 Sprint：
   ```bash
   node openpm/scripts/cli.js sprint create \
     --name "Sprint 1" \
     --goal "完成用户认证基础功能" \
     --start 2026-07-01 \
     --end 2026-07-14
   ```

5. 逐个关联 Task 到 Sprint：
   ```bash
   node openpm/scripts/cli.js task update task-001 --sprint sprint-1
   node openpm/scripts/cli.js task update task-002 --sprint sprint-1
   ```

6. **等待用户明确确认后**，激活 Sprint：
   ```bash
   node openpm/scripts/cli.js sprint start --id sprint-1
   ```

### 引导话术

> "当前有 8 个待规划 Task。我建议 Sprint 1 包含前 5 个：登录、注册、首页、导航、样式。容量 5/12。"
>
> "找回密码依赖登录，必须和登录在同一 Sprint。"
>
> "提醒：Milestone 'MVP v0.1' 目标 8月1日，关联 3 个 Epic 还有 2 个未完成。建议优先处理。"
>
> "Sprint 1 已创建。请在 Dashboard 查看计划。确认后告诉我，我启动 Sprint。"

### 🛑 决策点
用户确认 Sprint 计划后，Agent 才能执行 `sprint start`。

---

## 阶段 3：执行迭代

### 目标
按 Sprint 计划逐个完成 Task，保持用户知情。

### 每个 Task 的执行流程

1. 查看待办：
   ```bash
   node openpm/scripts/cli.js task list --sprint sprint-1 --status todo
   ```

2. 读取验收标准：
   ```bash
   node openpm/scripts/cli.js task show task-001
   ```

3. 标记开始（使用 start 复合命令）：
   ```bash
   node openpm/scripts/cli.js task start task-001
   ```
   此命令自动完成：验证依赖 → 读取 AC → 更新状态为 in_progress

4. 编码实现。

5. 完成后标记 done（CLI 自动校验依赖）：
   ```bash
   node openpm/scripts/cli.js task update task-001 --status done
   ```

6. 记录工作日志：
   ```bash
   node openpm/scripts/cli.js log today --summary "实现登录功能" --tasks "task-001:done"
   ```

### 引导话术

> "开始处理 task-001 登录功能。当前进度：0/5 done。"
>
> "task-003 被阻塞——邮件服务未配置。需要我创建新 Task 处理邮件配置吗？"
>
> "今日完成：登录、注册。进行中：首页。明天继续。"
>
> "⚠️ Milestone 'MVP v0.1' 剩余 2 周，关联 Epic '用户认证系统' 还有 3 个 Task 未完成。建议加快进度。"

### 日常结束时
- 确保所有完成的 Task 已 `update --status done`
- 执行 `log today` 记录当天工作
- 告诉用户今天的进展

---

## 阶段 4：验收复盘

### 目标
关闭 Sprint，生成总结，帮助用户决定下一步。

### Agent 行为

1. 检查遗留 Task：
   ```bash
   node openpm/scripts/cli.js task list --sprint sprint-1 --status todo
   node openpm/scripts/cli.js task list --sprint sprint-1 --status in_progress
   ```

2. 展示完成情况（done/total，完成率）。

3. 列出未完成 Task 及原因，建议去向（下个 Sprint / 关闭）。

4. 检查 Milestone 进展：
   ```bash
   node openpm/scripts/cli.js milestone list
   ```
   标记每个 Milestone 的状态（on_track / at_risk / overdue）。

5. **等待用户确认后**，关闭 Sprint：
   ```bash
   node openpm/scripts/cli.js sprint close sprint-1
   ```

### 引导话术

> "Sprint 1 完成情况：4/5 done（80%）。task-005 样式优化未完成——需要设计输入。"
>
> "Milestone 'MVP v0.1' 进展：关联 2 个 Epic 中，'用户认证系统' 已完成，'数据看板' 进度 60%。距目标还有 3 周——on_track。"
>
> "未完成的 task-005 建议迁移到 Sprint 2，你觉得呢？"
>
> "确认关闭 Sprint 1 吗？关闭后会生成总结并迁移未完成任务。"

### 🛑 决策点
用户确认 Sprint 关闭、遗留 Task 去向、Milestone 是否需要调整。

---

## 数据模型速查

| 实体 | 目录 | 状态流转 | 用途 |
|------|------|----------|------|
| Task | `.openpm/tasks/` | `todo` → `in_progress` → `done` | 最小可分配工作单元 |
| Sprint | `.openpm/sprints/` | `plan` → `active` → `done` | 时间盒，控制交付节奏 |
| Epic | `.openpm/epics/` | `todo` → `in_progress` → `done` | 跨 Sprint 需求聚合 |
| Milestone | `.openpm/milestones/` | `upcoming` → `current` → `done` | 时间锚点，可选 |
| Log | `.openpm/logs/` | 按日期 | 每日工作记录 |
| Summary | `.openpm/sprints/` | 自动生成 | Sprint 复盘依据 |

Task 字段：`id`, `title`, `status`, `priority` (high/medium/low), `type` (story/task/bug), `sprint`, `epic`, `depends_on` (数组), `ac` (验收标准数组)
Sprint 字段：`id`, `name`, `goal`, `status`, `start_date`, `end_date`

## 命令参考

所有命令通过 Node.js 执行：

```bash
node openpm/scripts/cli.js <entity> <action> [--flags]
```

### 初始化

```bash
node openpm/scripts/cli.js init                        # 创建 .openpm/ 目录
```

### Task

```bash
node openpm/scripts/cli.js task create --title "..." --status todo --priority medium --type task [--sprint sprint-x] [--epic epic-x] [--depends-on task-xxx] [--ac "标准1;标准2"]
node openpm/scripts/cli.js task list [--sprint sprint-x] [--status todo|in_progress|done] [--epic epic-x]
node openpm/scripts/cli.js task show <task-id>          # 查看详情和 AC
node openpm/scripts/cli.js task start <task-id>         # 复合命令：验证依赖 → 读 AC → 标记 in_progress
node openpm/scripts/cli.js task update <task-id> --status done [--title "..."]
node openpm/scripts/cli.js task delete <task-id>
```

### Sprint

```bash
node openpm/scripts/cli.js sprint create --name "Sprint 1" --goal "..." --start 2026-07-01 --end 2026-07-14
node openpm/scripts/cli.js sprint list
node openpm/scripts/cli.js sprint show <sprint-id>
node openpm/scripts/cli.js sprint start --id sprint-1   # 激活 Sprint (plan → active)
node openpm/scripts/cli.js sprint update <sprint-id> --name "..." --goal "..."
node openpm/scripts/cli.js sprint close <sprint-id>     # 关闭并生成 summary；未完成任务自动迁移
node openpm/scripts/cli.js sprint delete <sprint-id> [--force]
```

### Epic

```bash
node openpm/scripts/cli.js epic create --title "用户认证系统"
node openpm/scripts/cli.js epic list
node openpm/scripts/cli.js epic show <epic-id>
node openpm/scripts/cli.js epic update <epic-id> --title "..." --status in_progress
node openpm/scripts/cli.js epic delete <epic-id> [--force]
```

### Milestone

```bash
node openpm/scripts/cli.js milestone create --name "MVP v0.1" --date 2026-08-01
node openpm/scripts/cli.js milestone list
node openpm/scripts/cli.js milestone show <ms-id>
node openpm/scripts/cli.js milestone update <ms-id> --name "..." --date ... --status current
node openpm/scripts/cli.js milestone delete <ms-id>
```

### Log

```bash
node openpm/scripts/cli.js log today [--summary "..."] [--tasks "task-001:done,task-002:in_progress"]
node openpm/scripts/cli.js log show <date>              # 读取指定日期日志
node openpm/scripts/cli.js log list                     # 列出所有日志
```

### Summary & Web

```bash
node openpm/scripts/cli.js summary --sprint sprint-1    # 查看 Sprint 总结
node openpm/scripts/cli.js web [--port 23214]           # 启动 Web 仪表盘
```

## 工程实践

- **DoD**：Task 标记 done 前，AC 全满足、依赖已闭合、commit 含 task-id、无 TODO/FIXME
- **Task 粒度**：单个 Task 1 天内可完成。超过则拆分
- **Sprint 容量**：5-12 个 Task，≥50% story，≤20% bug
- **依赖**：每个 Task 的 depends_on ≤ 2 个
- **AC 写法**：可验证陈述句。如"输入正确密码后 3 秒内跳转首页"
- **Commit 规范**：每个 commit 对应一个 Task，含 Task ID：`feat(task-003): 实现登录`

### 硬性规则

1. 修改实体前必须 `show` 或 `list` 确认当前状态
2. 标记 done 前确认 depends_on 全部完成（CLI 自动校验）
3. 一个文件一个 Task
4. 每次编码完成后立即 `task update --status done`
5. Sprint start/close 必须等用户确认
```

- [ ] **Step 3: 验证文件格式正确**

```bash
head -5 openpm/SKILL.md
```
Expected: 显示 YAML frontmatter（`---` 开头，`name: openpm` 等）

- [ ] **Step 4: 提交**

```bash
git add openpm/SKILL.md
git commit -m "docs(skill): rewrite SKILL.md as workflow script with phase guidance"
```

---

### Task 2: CLI 依赖自动校验 — 阻止有未完成依赖的 Task 标记 done

**Files:**
- Modify: `openpm/scripts/commands/task.js`

**Goal:** 当 Agent 执行 `task update <id> --status done` 时，自动检查该 Task 的 `depends_on` 是否全部完成。若有未完成依赖，拒绝操作并返回清晰的错误信息。

- [ ] **Step 1: 在 updateTask 函数中添加依赖校验逻辑**

在 `openpm/scripts/commands/task.js` 的 `updateTask` 函数中，找到 `const updatable = [...]` 行之前，插入依赖校验代码块。

定位到第 63 行 `function updateTask(openpmDir, args) {`，在第 66 行 `const { frontmatter, body } = parseMarkdown(filePath);` 之后、第 67 行 `const updatable = ...` 之前，添加以下代码：

```javascript
    // 依赖校验：标记 done 前检查 depends_on 是否全部完成
    if (args.status === 'done' && frontmatter.depends_on && frontmatter.depends_on.length > 0) {
      const tasksDir = path.join(openpmDir, 'tasks');
      const allTasks = readAll(tasksDir);
      const pending = frontmatter.depends_on.filter(function(depId) {
        var dep = allTasks.find(function(t) { return t.id === depId; });
        return !dep || dep.status !== 'done';
      });
      if (pending.length > 0) {
        return { ok: false, error: '依赖未完成，不能标记为 done。未完成的依赖: ' + pending.join(', ') };
      }
    }
```

最终 `updateTask` 函数的前半部分应变为：

```javascript
function updateTask(openpmDir, args) {
  const filePath = path.join(openpmDir, 'tasks', `${args.id}.md`);
  try {
    const { frontmatter, body } = parseMarkdown(filePath);

    // 依赖校验：标记 done 前检查 depends_on 是否全部完成
    if (args.status === 'done' && frontmatter.depends_on && frontmatter.depends_on.length > 0) {
      const tasksDir = path.join(openpmDir, 'tasks');
      const allTasks = readAll(tasksDir);
      const pending = frontmatter.depends_on.filter(function(depId) {
        var dep = allTasks.find(function(t) { return t.id === depId; });
        return !dep || dep.status !== 'done';
      });
      if (pending.length > 0) {
        return { ok: false, error: '依赖未完成，不能标记为 done。未完成的依赖: ' + pending.join(', ') };
      }
    }

    const updatable = ['title', 'status', 'priority', 'type', 'sprint', 'epic'];
    // ... 后续代码不变
```

- [ ] **Step 2: 手工验证 — 创建两个有依赖关系的 Task 并测试校验**

```bash
# 创建 Task A（被依赖）
node openpm/scripts/cli.js task create --title "依赖测试-TaskA" --status todo
# 记录返回的 ID，例如 task-003

# 创建 Task B（依赖 Task A）
node openpm/scripts/cli.js task create --title "依赖测试-TaskB" --status todo --depends-on task-003

# 尝试标记 Task B 为 done（此时 Task A 还是 todo）——应该被拒绝
node openpm/scripts/cli.js task update task-003 --status done
# 如果要先让task-003变成done: node openpm/scripts/cli.js task update task-003 --status done
# Expected: {"ok":false,"error":"依赖未完成，不能标记为 done。未完成的依赖: task-003"}

# 标记 Task A 为 done
node openpm/scripts/cli.js task update task-003 --status done
# Expected: {"ok":true,...}

# 现在标记 Task B 为 done——应该成功
# （需要知道 Task B 的实际 ID）
# Expected: {"ok":true,...}

# 清理测试 Task
node openpm/scripts/cli.js task delete task-003
# node openpm/scripts/cli.js task delete task-004  # Task B 的 ID
```

- [ ] **Step 3: 提交**

```bash
git add openpm/scripts/commands/task.js
git commit -m "feat(cli): auto-check depends_on before marking task as done"
```

---

### Task 3: 复合命令 `task start` — 一站式开始任务

**Files:**
- Modify: `openpm/scripts/commands/task.js`

**Goal:** 新增 `task start <task-id>` 命令，自动完成：验证依赖 → 读取并展示 AC → 标记 in_progress。返回结构包含依赖状态和 AC 列表。

- [ ] **Step 1: 在 taskCommand 路由中添加 'start' case 和 startTask 函数**

在 `openpm/scripts/commands/task.js` 中：

在 `taskCommand` 函数的 switch 中，`case 'update'` 之前添加：

```javascript
    case 'start': return startTask(openpmDir, args);
```

在 `createTask` 函数之后、`listTasks` 函数之前，添加 `startTask` 函数：

```javascript
function startTask(openpmDir, args) {
  const filePath = path.join(openpmDir, 'tasks', `${args.id}.md`);
  try {
    const { frontmatter, body } = parseMarkdown(filePath);

    // 1. 检查依赖
    const depStatus = [];
    if (frontmatter.depends_on && frontmatter.depends_on.length > 0) {
      const allTasks = readAll(path.join(openpmDir, 'tasks'));
      for (const depId of frontmatter.depends_on) {
        const dep = allTasks.find(function(t) { return t.id === depId; });
        depStatus.push({ id: depId, status: dep ? dep.status : 'not_found', done: dep && dep.status === 'done' });
      }
    }

    // 2. 返回 AC 和依赖状态，同时标记 in_progress
    frontmatter.status = 'in_progress';
    frontmatter.updated = new Date().toISOString().split('T')[0];
    writeMarkdown(filePath, frontmatter, body);

    return {
      ok: true,
      task: { id: frontmatter.id, title: frontmatter.title, status: frontmatter.status },
      ac: frontmatter.ac || [],
      depends_on: depStatus,
      message: '已开始任务 ' + frontmatter.id + ': ' + frontmatter.title,
    };
  } catch (e) {
    return { ok: false, error: 'Task not found: ' + args.id };
  }
}
```

- [ ] **Step 2: 验证新命令**

```bash
# 创建一个测试 Task
node openpm/scripts/cli.js task create --title "start命令测试" --status todo --ac "AC1;AC2"

# 使用 task start（假设返回的 ID 是 task-005）
node openpm/scripts/cli.js task start task-005
# Expected: {"ok":true,"task":{"id":"task-005","title":"start命令测试","status":"in_progress"},"ac":["AC1","AC2"],"depends_on":[],"message":"已开始任务 task-005: start命令测试"}

# 验证状态已变为 in_progress
node openpm/scripts/cli.js task show task-005
# Expected: status 应为 "in_progress"

# 清理
node openpm/scripts/cli.js task delete task-005
```

- [ ] **Step 3: 提交**

```bash
git add openpm/scripts/commands/task.js
git commit -m "feat(cli): add task start composite command"
```

---

### Task 4: Sprint close 行为明确化 — 处理 in_progress 任务

**Files:**
- Modify: `openpm/scripts/commands/sprint.js`

**Goal:** 当 Sprint 中存在 `in_progress` 状态的 Task 时，`sprint close` 应给出警告并列出这些 Task，但仍允许关闭（将它们视为未完成迁移）。同时在 summary 中区分 `in_progress` 和 `todo` 的未完成任务。

- [ ] **Step 1: 修改 sprint close 逻辑**

在 `openpm/scripts/commands/sprint.js` 中，找到 `case 'close':` 块（第 24-37 行），替换为：

```javascript
    case 'close': {
      const fp = path.join(sprintsDir, args.id + '.md');
      const { frontmatter, body } = parseMarkdown(fp);
      if (frontmatter.status === 'done') return { ok: false, error: 'Sprint already closed' };
      frontmatter.status = 'done';
      writeMarkdown(fp, frontmatter, body);
      const tasksDir = path.join(openpmDir, 'tasks');
      const tasks = readAll(tasksDir).filter(t => t.sprint === args.id);
      const completed = tasks.filter(function(t) { return t.status === 'done'; }).length;
      const inProgress = tasks.filter(function(t) { return t.status === 'in_progress'; });
      const todoTasks = tasks.filter(function(t) { return t.status === 'todo'; });
      const incomplete = inProgress.concat(todoTasks);

      // 自动迁移未完成任务到下一个 plan 状态的 Sprint，或清除 sprint 归属
      const nextSprint = readAll(sprintsDir).filter(function(s) { return s.status === 'plan'; }).sort(function(a, b) { return a.id.localeCompare(b.id); })[0];
      const migrated = [];
      for (const t of incomplete) {
        const tfp = path.join(tasksDir, t.id + '.md');
        const { frontmatter: tfm, body: tbody } = parseMarkdown(tfp);
        if (nextSprint) {
          tfm.sprint = nextSprint.id;
          migrated.push({ task: t.id, to: nextSprint.id });
        } else {
          delete tfm.sprint;
          migrated.push({ task: t.id, to: 'unassigned' });
        }
        writeMarkdown(tfp, tfm, tbody);
      }

      // 生成 summary
      const summaryFm = { sprint: args.id, completed: completed, total: tasks.length, in_progress: inProgress.length };
      const doneList = tasks.filter(function(t) { return t.status === 'done'; }).map(function(t) { return '- ' + t.title; }).join('\n');
      const inProgressList = inProgress.map(function(t) { return '- ' + t.title + ' (进行中被关闭)'; }).join('\n');
      const todoList = todoTasks.map(function(t) { return '- ' + t.title; }).join('\n');
      const warning = inProgress.length > 0 ? '\n\n> ⚠️ 此 Sprint 关闭时有 ' + inProgress.length + ' 个进行中的任务，已自动迁移。\n' : '';
      writeMarkdown(path.join(sprintsDir, args.id + '-summary.md'), summaryFm,
        '## 完成事项\n' + doneList + '\n\n## 进行中（已迁移）\n' + inProgressList + '\n\n## 未开始（已迁移）\n' + todoList + warning);
      return { ok: true, sprint: frontmatter, summary: summaryFm, migrated: migrated, warning: inProgress.length > 0 ? '有 ' + inProgress.length + ' 个 in_progress 任务被关闭并迁移' : null };
    }
```

- [ ] **Step 2: 验证 close 行为**

```bash
# 创建测试 Sprint
node openpm/scripts/cli.js sprint create --name "close测试" --goal "测试close行为" --start 2026-07-01 --end 2026-07-14
# 假设返回 sprint-2

# 创建两个 Task 并关联 Sprint
node openpm/scripts/cli.js task create --title "已完成任务" --status done --sprint sprint-2
node openpm/scripts/cli.js task create --title "进行中任务" --status in_progress --sprint sprint-2
node openpm/scripts/cli.js task create --title "未开始任务" --status todo --sprint sprint-2

# 关闭 Sprint
node openpm/scripts/cli.js sprint close sprint-2
# Expected: warning 字段指示有 1 个 in_progress 任务被迁移

# 检查 summary
node openpm/scripts/cli.js summary --sprint sprint-2
# Expected: 包含"进行中（已迁移）"和"未开始（已迁移）"两部分

# 清理
node openpm/scripts/cli.js sprint delete sprint-2 --force
```

- [ ] **Step 3: 提交**

```bash
git add openpm/scripts/commands/sprint.js
git commit -m "feat(cli): clarify sprint close behavior — handle in_progress tasks with migration"
```

---

### Task 5: 批量 Task 创建支持

**Files:**
- Modify: `openpm/scripts/commands/task.js`

**Goal:** 支持 `task create --batch` 从 JSON 数组批量创建 Task，减少 Agent 的命令调用次数。

- [ ] **Step 1: 在 createTask 所在的 case 中添加批量逻辑**

在 `openpm/scripts/commands/task.js` 的 `taskCommand` 函数中，修改 `case 'create'`：

```javascript
    case 'create': {
      if (args.batch) {
        try {
          const tasksData = JSON.parse(args.batch);
          const results = [];
          for (const taskArgs of tasksData) {
            results.push(createTask(openpmDir, taskArgs));
          }
          return { ok: true, tasks: results.map(function(r) { return r.task; }), count: results.length };
        } catch (e) {
          return { ok: false, error: '批量创建失败：JSON 解析错误 - ' + e.message };
        }
      }
      return createTask(openpmDir, args);
    }
```

- [ ] **Step 2: 验证批量创建**

```bash
# 批量创建 3 个 Task
node openpm/scripts/cli.js task create --batch '[{"title":"批量测试1","status":"todo","type":"task"},{"title":"批量测试2","status":"todo","type":"task"},{"title":"批量测试3","status":"todo","type":"task"}]'
# Expected: {"ok":true,"tasks":[...3 tasks...],"count":3}

# 验证创建结果
node openpm/scripts/cli.js task list
# Expected: 应包含 3 个新 Task

# 清理
# 删除刚才创建的 3 个 Task（根据返回的 ID）
```

- [ ] **Step 3: 提交**

```bash
git add openpm/scripts/commands/task.js
git commit -m "feat(cli): support batch task creation via --batch JSON flag"
```

---

## 验证

完成所有 Task 后，运行完整流程验证：

```bash
# 1. 初始化（如果尚未）
node openpm/scripts/cli.js init

# 2. 创建 Epic
node openpm/scripts/cli.js epic create --title "验证测试Epic"

# 3. 批量创建 Task（含依赖关系）
node openpm/scripts/cli.js task create --batch '[
  {"title":"前置任务","status":"todo","type":"task","epic":"<EPIC_ID>"},
  {"title":"后置任务","status":"todo","type":"task","epic":"<EPIC_ID>","depends-on":"<TASK_A_ID>"}
]'

# 4. task start（依赖未满足时应给出警告信息）
node openpm/scripts/cli.js task start <TASK_B_ID>

# 5. task start + task update done（前置任务）
node openpm/scripts/cli.js task start <TASK_A_ID>
node openpm/scripts/cli.js task update <TASK_A_ID> --status done

# 6. 现在标记后置任务 done（依赖已满足）
node openpm/scripts/cli.js task update <TASK_B_ID> --status done

# 7. 创建 Sprint、关联 Task、close（含 in_progress）
node openpm/scripts/cli.js sprint create --name "验证Sprint" --goal "测试" --start 2026-07-01 --end 2026-07-07
# ...关联 task...
node openpm/scripts/cli.js sprint close <SPRINT_ID>

# 8. 清理测试数据
```
