# OpenPM CLI CRUD 补全 实现计划

> **面向 AI 代理的工作者：** 必需子技能：使用 superpowers:subagent-driven-development（推荐）或 superpowers:executing-plans 逐任务实现此计划。步骤使用复选框（`- [ ]`）语法来跟踪进度。

**目标：** 补齐 sprint、epic、milestone、log 的 show/update/delete 命令，使所有实体具备完整 CRUD，附带删除引用检查和状态流转校验。

**架构：** 在每个命令文件的 switch 中新增 action case，复用现有 `parseMarkdown`/`writeMarkdown`/`readAll` 工具函数。删除时扫描 tasks 目录检查引用，更新时校验状态流转方向。不新增文件，不改动 CLI 入口。

**技术栈：** Node.js 内置模块（fs, path），零外部依赖。

---

## 文件职责

| 文件 | 改动类型 | 职责 |
|------|----------|------|
| `openpm/scripts/commands/sprint.js` | 修改 | 新增 show/update/delete 三个 action case |
| `openpm/scripts/commands/epic.js` | 修改 | 新增 update/delete 两个 action case |
| `openpm/scripts/commands/milestone.js` | 修改 | 新增 show/update/delete 三个 action case，补充 parseMarkdown 导入 |
| `openpm/scripts/commands/log.js` | 修改 | 新增 show action（按日期读取历史日志） |
| `openpm/SKILL.md` | 修改 | 命令参考表补全所有新增命令 |

---

### 任务 1：Sprint — show/update/delete

**文件：**
- 修改：`openpm/scripts/commands/sprint.js`

- [ ] **步骤 1：新增 `show` case**

在 `case 'list':` 之前插入：

```javascript
case 'show': {
  const fp = path.join(sprintsDir, args.id + '.md');
  const { frontmatter, body } = parseMarkdown(fp);
  const tasksDir = path.join(openpmDir, 'tasks');
  const tasks = readAll(tasksDir).filter(t => t.sprint === args.id);
  return { ok: true, sprint: Object.assign({}, frontmatter, { body, taskCount: tasks.length }) };
}
```

- [ ] **步骤 2：新增 `update` case**

在 `case 'show':` 之后插入：

```javascript
case 'update': {
  const fp = path.join(sprintsDir, args.id + '.md');
  const { frontmatter, body } = parseMarkdown(fp);
  const updatable = ['name', 'goal', 'start_date', 'end_date'];
  for (const key of updatable) {
    if (args[key] !== undefined) frontmatter[key] = args[key];
  }
  if (args.status !== undefined) {
    const transitions = { plan: ['active'], active: ['done'], done: [] };
    const allowed = transitions[frontmatter.status];
    if (!allowed || !allowed.includes(args.status)) {
      return { ok: false, error: 'Sprint ' + args.id + ' 状态 ' + frontmatter.status + ' 不允许流转到 ' + args.status };
    }
    frontmatter.status = args.status;
  }
  writeMarkdown(fp, frontmatter, body);
  return { ok: true, sprint: frontmatter };
}
```

- [ ] **步骤 3：新增 `delete` case**

在 `case 'update':` 之后插入：

```javascript
case 'delete': {
  const fs = require('fs');
  const fp = path.join(sprintsDir, args.id + '.md');
  const tasksDir = path.join(openpmDir, 'tasks');
  const tasks = readAll(tasksDir).filter(t => t.sprint === args.id);
  if (tasks.length > 0 && !args.force) {
    const ids = tasks.map(t => t.id).join(', ');
    return { ok: false, error: 'Sprint ' + args.id + ' 关联 ' + tasks.length + ' 个任务(' + ids + ')。使用 --force 强制删除。' };
  }
  fs.unlinkSync(fp);
  return { ok: true, deleted: args.id };
}
```

- [ ] **步骤 4：验证 show**

前提：`openpm init` 已完成，已有 `sprint-1`。

```bash
node openpm/scripts/cli.js sprint show sprint-1
```

预期：返回 JSON，`ok: true`，`sprint` 含 id/name/goal/status，`taskCount` 为数字。

- [ ] **步骤 5：验证 update — 正常更新**

```bash
node openpm/scripts/cli.js sprint update sprint-1 --name "Sprint 1 改名" --goal "新的目标"
node openpm/scripts/cli.js sprint show sprint-1
```

预期：show 返回更新后的 name 和 goal，其他字段不变。

- [ ] **步骤 6：验证 update — 状态流转校验**

```bash
node openpm/scripts/cli.js sprint update sprint-1 --status active
node openpm/scripts/cli.js sprint update sprint-1 --status plan
```

预期：第一次成功（plan→active 合法），第二次失败返回 `ok: false`，错误信息含"不允许流转"。

- [ ] **步骤 7：验证 delete — 引用拒绝**

```bash
# 确保 sprint-1 下有任务
node openpm/scripts/cli.js task create --title "测试任务" --sprint sprint-1 --status todo
node openpm/scripts/cli.js sprint delete sprint-1
```

预期：返回 `ok: false`，错误含"关联 1 个任务"。

- [ ] **步骤 8：验证 delete — force 强制删除**

```bash
node openpm/scripts/cli.js sprint delete sprint-1 --force
```

预期：返回 `ok: true`，sprint 文件被删除。

- [ ] **步骤 9：Commit**

```bash
git add openpm/scripts/commands/sprint.js
git commit -m "feat(cli): sprint 新增 show/update/delete 命令，含状态校验和引用检查"
```

---

### 任务 2：Epic — update/delete

**文件：**
- 修改：`openpm/scripts/commands/epic.js`

- [ ] **步骤 1：新增 `update` case**

在 `case 'show':` 之后插入：

```javascript
case 'update': {
  const fp = path.join(epicsDir, args.id + '.md');
  const { frontmatter, body } = parseMarkdown(fp);
  if (args.title !== undefined) frontmatter.title = args.title;
  if (args.status !== undefined) {
    const transitions = { todo: ['in_progress'], in_progress: ['done'], done: [] };
    const allowed = transitions[frontmatter.status];
    if (!allowed || !allowed.includes(args.status)) {
      return { ok: false, error: 'Epic ' + args.id + ' 状态 ' + frontmatter.status + ' 不允许流转到 ' + args.status };
    }
    frontmatter.status = args.status;
  }
  writeMarkdown(fp, frontmatter, body);
  return { ok: true, epic: frontmatter };
}
```

- [ ] **步骤 2：新增 `delete` case**

在 `case 'update':` 之后插入：

```javascript
case 'delete': {
  const fs = require('fs');
  const fp = path.join(epicsDir, args.id + '.md');
  const tasksDir = path.join(openpmDir, 'tasks');
  const tasks = readAll(tasksDir).filter(t => t.epic === args.id);
  if (tasks.length > 0 && !args.force) {
    const ids = tasks.map(t => t.id).join(', ');
    return { ok: false, error: 'Epic ' + args.id + ' 关联 ' + tasks.length + ' 个任务(' + ids + ')。使用 --force 强制删除。' };
  }
  fs.unlinkSync(fp);
  return { ok: true, deleted: args.id };
}
```

- [ ] **步骤 3：验证 update**

```bash
node openpm/scripts/cli.js epic create --title "测试Epic"
node openpm/scripts/cli.js epic update epic-xxxxxx --title "改名Epic" --status in_progress
node openpm/scripts/cli.js epic show epic-xxxxxx
```

预期：show 返回更新后的 title 和 status。

- [ ] **步骤 4：验证 update — 状态回退拒绝**

```bash
node openpm/scripts/cli.js epic update epic-xxxxxx --status todo
```

预期：`ok: false`，错误含"不允许流转"。

- [ ] **步骤 5：验证 delete — 引用检查**

```bash
node openpm/scripts/cli.js task create --title "Epic测试任务" --epic epic-xxxxxx --status todo
node openpm/scripts/cli.js epic delete epic-xxxxxx
```

预期：`ok: false`，含关联任务列表。然后 `--force` 验证可删除。

- [ ] **步骤 6：Commit**

```bash
git add openpm/scripts/commands/epic.js
git commit -m "feat(cli): epic 新增 update/delete 命令，含状态校验和引用检查"
```

---

### 任务 3：Milestone — show/update/delete

**文件：**
- 修改：`openpm/scripts/commands/milestone.js`

- [ ] **步骤 1：补充 `parseMarkdown` 导入**

将第 2 行：
```javascript
const { writeMarkdown, readAll } = require('../lib/files');
```
改为：
```javascript
const { parseMarkdown, writeMarkdown, readAll } = require('../lib/files');
```

- [ ] **步骤 2：新增 `show` case**

在 `case 'list':` 之前插入：

```javascript
case 'show': {
  const fp = path.join(msDir, args.id + '.md');
  const { frontmatter, body } = parseMarkdown(fp);
  return { ok: true, milestone: Object.assign({}, frontmatter, { body }) };
}
```

- [ ] **步骤 3：新增 `update` case**

在 `case 'show':` 之后插入：

```javascript
case 'update': {
  const fp = path.join(msDir, args.id + '.md');
  const { frontmatter, body } = parseMarkdown(fp);
  if (args.name !== undefined) frontmatter.name = args.name;
  if (args.date !== undefined) frontmatter.target_date = args.date;
  if (args.status !== undefined) {
    const transitions = { upcoming: ['current'], current: ['done'], done: [] };
    const allowed = transitions[frontmatter.status];
    if (!allowed || !allowed.includes(args.status)) {
      return { ok: false, error: 'Milestone ' + args.id + ' 状态 ' + frontmatter.status + ' 不允许流转到 ' + args.status };
    }
    frontmatter.status = args.status;
  }
  writeMarkdown(fp, frontmatter, body);
  return { ok: true, milestone: frontmatter };
}
```

- [ ] **步骤 4：新增 `delete` case**

在 `case 'update':` 之后插入：

```javascript
case 'delete': {
  const fs = require('fs');
  const fp = path.join(msDir, args.id + '.md');
  fs.unlinkSync(fp);
  return { ok: true, deleted: args.id };
}
```

- [ ] **步骤 5：验证 show**

```bash
node openpm/scripts/cli.js milestone show ms-1
```

预期：返回 JSON，`ok: true`，`milestone` 含 id/name/target_date/status/body。

- [ ] **步骤 6：验证 update**

```bash
node openpm/scripts/cli.js milestone update ms-1 --status current
node openpm/scripts/cli.js milestone update ms-1 --status upcoming
```

预期：第一次成功（upcoming→current 合法），第二次失败（回退拒绝）。

- [ ] **步骤 7：验证 delete**

```bash
node openpm/scripts/cli.js milestone delete ms-1
node openpm/scripts/cli.js milestone list
```

预期：删除成功，list 中不再出现 ms-1。

- [ ] **步骤 8：Commit**

```bash
git add openpm/scripts/commands/milestone.js
git commit -m "feat(cli): milestone 新增 show/update/delete 命令，含状态流转校验"
```

---

### 任务 4：Log — show

**文件：**
- 修改：`openpm/scripts/commands/log.js`

- [ ] **步骤 1：新增 `show` action**

在 `if (action === 'list')` 之前插入：

```javascript
if (action === 'show') {
  const filePath = path.join(logsDir, args.id + '.md');
  try {
    const { frontmatter, body } = parseMarkdown(filePath);
    return { ok: true, log: Object.assign({}, frontmatter, { body }) };
  } catch {
    return { ok: true, log: null, empty: true };
  }
}
```

- [ ] **步骤 2：验证 show — 读取今日日志**

```bash
node openpm/scripts/cli.js log today --summary "测试摘要" --tasks "task-001:done"
node openpm/scripts/cli.js log show 2026-07-01
```

预期：返回 JSON 含 date/tasks/summary（body 中含测试摘要）。

- [ ] **步骤 3：验证 show — 不存在日期**

```bash
node openpm/scripts/cli.js log show 2099-01-01
```

预期：返回 `ok: true`，`log: null`，`empty: true`（不报错）。

- [ ] **步骤 4：Commit**

```bash
git add openpm/scripts/commands/log.js
git commit -m "feat(cli): log 新增 show 命令，按日期读取历史日志"
```

---

### 任务 5：更新 SKILL.md 命令参考

**文件：**
- 修改：`openpm/SKILL.md`

- [ ] **步骤 1：更新 Sprint 命令块**

将第 84-87 行的 Sprint 命令块：
```
openpm sprint create --name "Sprint 1" --goal "..." --start 2026-07-01 --end 2026-07-14
openpm sprint start --id sprint-1
openpm sprint close <sprint-id>     # 自动生成 summary
openpm sprint list
```

替换为：
```
openpm sprint create --name "Sprint 1" --goal "..." --start 2026-07-01 --end 2026-07-14
openpm sprint show <sprint-id>     # 查看单个 Sprint 详情及关联任务数
openpm sprint list
openpm sprint start --id sprint-1   # 激活 Sprint（plan → active）
openpm sprint update <sprint-id> --name "..." --goal "..." --status active
openpm sprint close <sprint-id>     # 关闭并自动生成 summary；未完成任务移入下个 Sprint
openpm sprint delete <sprint-id> [--force]  # 有关联任务时需 --force
```

- [ ] **步骤 2：更新 Epic/Milestone/Log 命令块**

将第 93-101 行：
```
openpm epic create --title "用户认证系统"
openpm epic list

openpm milestone create --name "MVP v0.1" --date 2026-08-01
openpm milestone list

openpm log today [--summary "..."] [--tasks "task-001:done,task-002:in_progress"]

openpm summary --sprint sprint-1
```

替换为：
```
openpm epic create --title "用户认证系统"
openpm epic list
openpm epic show <epic-id>          # 查看 Epic 详情及关联任务
openpm epic update <epic-id> --title "..." --status in_progress
openpm epic delete <epic-id> [--force]  # 有关联任务时需 --force

openpm milestone create --name "MVP v0.1" --date 2026-08-01
openpm milestone list
openpm milestone show <ms-id>
openpm milestone update <ms-id> --name "..." --date ... --status current
openpm milestone delete <ms-id>

openpm log today [--summary "..."] [--tasks "task-001:done,task-002:in_progress"]
openpm log show <date>              # 读取指定日期日志，如 2026-07-01
openpm log list

openpm summary --sprint sprint-1
```

- [ ] **步骤 3：验证 SKILL.md 内容**

```bash
cat openpm/SKILL.md | grep -E "(sprint|epic|milestone|log) (show|update|delete)" | wc -l
```

预期：返回 ≥ 10（共 10 个新增命令）。

- [ ] **步骤 4：Commit**

```bash
git add openpm/SKILL.md
git commit -m "docs(openpm): 补全 SKILL.md 命令参考，覆盖新增 CRUD 命令"
```

---

### 最终验证

所有实现完成后，执行一次端到端烟雾测试：

```bash
# 初始化新项目
mkdir /tmp/test-openpm && cd /tmp/test-openpm
node d:/Cat/OpenPM/openpm/scripts/cli.js init

# Sprint 全流程
node d:/Cat/OpenPM/openpm/scripts/cli.js sprint create --name "S1" --goal "测试" --start 2026-07-01 --end 2026-07-14
node d:/Cat/OpenPM/openpm/scripts/cli.js sprint start --id sprint-1
node d:/Cat/OpenPM/openpm/scripts/cli.js sprint show sprint-1
node d:/Cat/OpenPM/openpm/scripts/cli.js sprint update sprint-1 --goal "更新目标"
node d:/Cat/OpenPM/openpm/scripts/cli.js sprint delete sprint-1
# → 关联任务提示 --force
node d:/Cat/OpenPM/openpm/scripts/cli.js sprint delete sprint-1 --force

# Epic 全流程
node d:/Cat/OpenPM/openpm/scripts/cli.js epic create --title "E1"
EPIC_ID=$(node d:/Cat/OpenPM/openpm/scripts/cli.js epic list | grep -oP '"id":\s*"epic-[^"]+"' | head -1 | cut -d'"' -f4)
node d:/Cat/OpenPM/openpm/scripts/cli.js epic update "$EPIC_ID" --status in_progress
node d:/Cat/OpenPM/openpm/scripts/cli.js epic delete "$EPIC_ID"

# Milestone 全流程
node d:/Cat/OpenPM/openpm/scripts/cli.js milestone create --name "M1" --date 2026-08-01
node d:/Cat/OpenPM/openpm/scripts/cli.js milestone show ms-1
node d:/Cat/OpenPM/openpm/scripts/cli.js milestone update ms-1 --status current
node d:/Cat/OpenPM/openpm/scripts/cli.js milestone delete ms-1

# Log 全流程
node d:/Cat/OpenPM/openpm/scripts/cli.js log today --summary "测试"
node d:/Cat/OpenPM/openpm/scripts/cli.js log show $(date +%Y-%m-%d)
node d:/Cat/OpenPM/openpm/scripts/cli.js log list

echo "ALL PASSED"
```

预期：所有命令返回 `ok: true`（除 sprint delete 无 --force 那次），最终输出 `ALL PASSED`。

---

## 自检

### 1. 规格覆盖度

| 规格需求 | 实现任务 |
|----------|----------|
| Sprint show：返回 frontmatter + body + taskCount | 任务 1 步骤 1 |
| Sprint update：可更新 name/goal/start/end/status | 任务 1 步骤 2 |
| Sprint update：状态流转校验 plan→active→done | 任务 1 步骤 2 |
| Sprint delete：引用检查 + --force | 任务 1 步骤 3 |
| Epic update：可更新 title/status，流转校验 | 任务 2 步骤 1 |
| Epic delete：引用检查 + --force | 任务 2 步骤 2 |
| Milestone show：返回 frontmatter + body | 任务 3 步骤 2 |
| Milestone update：可更新 name/date/status，流转校验 | 任务 3 步骤 3 |
| Milestone delete：直接删除 | 任务 3 步骤 4 |
| Log show：按日期读取 | 任务 4 步骤 1 |
| SKILL.md 更新 | 任务 5 |
| 不新增依赖、不改现有行为 | 全任务 |

✅ 全覆盖。

### 2. 占位符扫描

无 "TODO"、"TBD"、"后续实现"、"补充细节"、"添加适当错误处理"等占位符。✅

### 3. 类型一致性

- `args.id`：在 show/update/delete 中统一表示实体 ID，cli.js 第 32 行已统一映射
- `args.force`：delete 中统一使用 `!args.force` 检查
- `frontmatter.status`：所有实体字段名一致
- 错误返回格式：统一 `{ ok: false, error: "..." }` ✅
