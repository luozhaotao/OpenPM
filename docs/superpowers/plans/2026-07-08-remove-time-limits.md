# 移除时间限制 实现计划

> **面向 AI 代理的工作者：** 必需子技能：使用 superpowers:subagent-driven-development（推荐）或 superpowers:executing-plans 逐任务实现此计划。步骤使用复选框（`- [ ]`）语法来跟踪进度。

**目标：** 完全移除 OpenPM 中所有面向用户的时间概念——删除 Milestone 实体、移除日期字段、用纯事件驱动替代时间驱动的阶段判定。

**架构：** 数据模型去时间化（Task/Sprint 移除时间戳字段，Milestone 删除，Log 改为事件记录），工作流改为 Task 完成度驱动（当前 Sprint 所有 Task done 即触发复盘），Web UI 同步更新。

**技术栈：** Node.js 内置模块（fs, path, http），原生 JS SPA

---

### 任务 1：删除 Milestone 实体

**文件：**
- 删除：`openpm/scripts/commands/milestone.js`
- 修改：`openpm/scripts/lib/id.js`

- [ ] **步骤 1：删除 milestone.js 命令文件**

```bash
Remove-Item -LiteralPath "openpm\scripts\commands\milestone.js"
```

- [ ] **步骤 2：从 id.js 中删除 nextMilestoneId 函数和导出**

编辑 `openpm/scripts/lib/id.js`：
- 删除 `nextMilestoneId` 函数体（行 31-39）
- 修改 `module.exports` 行，移除 `nextMilestoneId`

```js
// 删除行 31-39 整个函数：
// function nextMilestoneId(openpmDir) { ... }

// 修改行 41 module.exports：
module.exports = { nextTaskId, nextSprintId, nextEpicId };
```

- [ ] **步骤 3：删除 Milestone 模板文件**

```bash
Remove-Item -LiteralPath "openpm\templates\milestone.md"
```

- [ ] **步骤 4：删除 milestones 数据目录（如果存在）**

```bash
if (Test-Path -LiteralPath ".openpm\milestones") { Remove-Item -Recurse -LiteralPath ".openpm\milestones" }
```

- [ ] **步骤 5：Commit**

```bash
git add openpm/scripts/commands/milestone.js openpm/scripts/lib/id.js openpm/templates/milestone.md
git rm openpm/scripts/commands/milestone.js openpm/templates/milestone.md
git commit -m "refactor: remove Milestone entity"
```

---

### 任务 2：移除 Task 时间戳

**文件：**
- 修改：`openpm/scripts/commands/task.js`
- 修改：`openpm/templates/task.md`

- [ ] **步骤 1：从 task.js createTask 中移除时间戳**

在 `openpm/scripts/commands/task.js:33-54`，`createTask` 函数中：
- 删除 `const now = new Date().toISOString().split('T')[0];`（行 36）
- 从 `frontmatter` 对象中删除 `created: now,`（行 43）
- 从 `frontmatter` 对象中删除 `updated: now,`（行 44）

修改后的 createTask 函数 frontmatter 构建（行 38-49）：
```js
  const frontmatter = {
    id, title: args.title || 'Untitled',
    status: args.status || 'todo',
    priority: args.priority || 'medium',
    type: args.type || 'task',
  };
  if (args.sprint) frontmatter.sprint = args.sprint;
  if (args.epic) frontmatter.epic = args.epic;
  if (args['depends-on']) frontmatter.depends_on = args['depends-on'].split(',');
  if (args.ac) frontmatter.ac = args.ac.split(';');
```

- [ ] **步骤 2：从 startTask 中移除 updated**

在 `openpm/scripts/commands/task.js:73`，删除：
```js
    frontmatter.updated = new Date().toISOString().split('T')[0];
```

- [ ] **步骤 3：从 updateTask 中移除 updated**

在 `openpm/scripts/commands/task.js:138`，删除：
```js
    frontmatter.updated = new Date().toISOString().split('T')[0];
```

- [ ] **步骤 4：更新 task 模板，删除 created/updated 字段**

在 `openpm/templates/task.md`，删除行 15-16：
```
created: "{{created}}"
updated: "{{updated}}"
```

- [ ] **步骤 5：Commit**

```bash
git add openpm/scripts/commands/task.js openpm/templates/task.md
git commit -m "refactor: remove time fields from Task"
```

---

### 任务 3：移除 Sprint 时间字段

**文件：**
- 修改：`openpm/scripts/commands/sprint.js`
- 修改：`openpm/templates/sprint.md`

- [ ] **步骤 1：从 sprint create 中移除 start_date/end_date**

在 `openpm/scripts/commands/sprint.js:13`，修改 frontmatter 构建：
```js
      const fm = { id, name: args.name || 'Untitled Sprint', goal: args.goal || '', status: 'plan' };
```

- [ ] **步骤 2：从 sprint update 中移除 start_date/end_date 可更新项**

在 `openpm/scripts/commands/sprint.js:82`，修改 updatable 数组：
```js
         const updatable = ['name', 'goal'];
```

- [ ] **步骤 3：更新 sprint 模板，删除 start_date/end_date**

在 `openpm/templates/sprint.md`，删除行 8-9：
```
start_date: "{{start_date}}"
end_date: "{{end_date}}"
```

- [ ] **步骤 4：Commit**

```bash
git add openpm/scripts/commands/sprint.js openpm/templates/sprint.md
git commit -m "refactor: remove date fields from Sprint"
```

---

### 任务 4：从 CLI 和 API 中移除 Milestone 路由

**文件：**
- 修改：`openpm/scripts/cli.js`
- 修改：`openpm/scripts/web/api.js`

- [ ] **步骤 1：从 cli.js 中删除 milestone case**

在 `openpm/scripts/cli.js:34`，删除：
```js
      case 'milestone': result = require('./commands/milestone')(action, args, cwd); break;
```

- [ ] **步骤 2：从 api.js 中删除 milestone 导入和路由**

在 `openpm/scripts/web/api.js:4`，删除：
```js
const milestoneCommand = require('../commands/milestone');
```

在 `openpm/scripts/web/api.js:35-36`，删除：
```js
  if (pathname === '/api/milestones') return () => milestoneCommand('list', {}, cwd);
```

- [ ] **步骤 3：从 api.js 中删除日志的 /api/logs/today 路由**

在 `openpm/scripts/web/api.js:37`，删除：
```js
  if (pathname === '/api/logs/today') return () => logCommand('today', {}, cwd);
```

- [ ] **步骤 4：Commit**

```bash
git add openpm/scripts/cli.js openpm/scripts/web/api.js
git commit -m "refactor: remove Milestone and today-log routes from CLI/API"
```

---

### 任务 5：重写 Log 为事件日志

**文件：**
- 修改：`openpm/scripts/commands/log.js`
- 修改：`openpm/templates/log.md`

- [ ] **步骤 1：重写 log.js — 移除日期逻辑，改为按 sprint 关联**

将 `openpm/scripts/commands/log.js` 重写为：

```js
const path = require('path');
const fs = require('fs');
const { parseMarkdown, writeMarkdown, readAll, listFiles } = require('../lib/files');
const { getOpenpmDir } = require('../lib/config');

function logCommand(action, args, cwd) {
  const openpmDir = getOpenpmDir(cwd);
  const logsDir = path.join(openpmDir, 'logs');

  if (action === 'create') {
    const logId = args.sprint ? 'sprint-' + args.sprint : 'log-' + Date.now();
    const fm = { id: logId, sprint: args.sprint || '', event: args.event || 'general' };
    const body = (args.summary || '') + '\n\n## 阻塞项\n' + (args.blockers || '无');
    writeMarkdown(path.join(logsDir, logId + '.md'), fm, body);
    return { ok: true, log: fm };
  }

  if (action === 'show') {
    const fp = path.join(logsDir, args.id + '.md');
    try {
      const { frontmatter, body } = parseMarkdown(fp);
      return { ok: true, log: Object.assign({}, frontmatter, { body }) };
    } catch {
      return { ok: false, error: 'Log not found: ' + args.id };
    }
  }

  if (action === 'list') {
    const logFiles = listFiles(logsDir);
    const logs = logFiles.map(function(f) {
      var parsed = parseMarkdown(f);
      return Object.assign({}, parsed.frontmatter, { body: parsed.body });
    });
    if (args.sprint) {
      return { ok: true, logs: logs.filter(function(l) { return l.sprint === args.sprint; }) };
    }
    return { ok: true, logs: logs };
  }

  if (action === 'delete') {
    const fp = path.join(logsDir, args.id + '.md');
    try { fs.unlinkSync(fp); return { ok: true, deleted: args.id }; }
    catch { return { ok: false, error: 'Log not found: ' + args.id }; }
  }

  return { ok: false, error: 'Unknown log action: ' + action };
}
module.exports = logCommand;
```

- [ ] **步骤 2：更新 log 模板**

将 `openpm/templates/log.md` 改为：
```
<!-- 字段参考，禁止复制。请用 CLI: node ${SKILL_DIR}/scripts/cli.js log create -->

---
id: "{{id}}"
sprint: "{{sprint}}"
event: "{{event}}"
---

{{summary}}

## 阻塞项
```

- [ ] **步骤 3：Commit**

```bash
git add openpm/scripts/commands/log.js openpm/templates/log.md
git commit -m "refactor: rewrite Log as event-based records"
```

---

### 任务 6：重写 Web UI 阶段判定和提醒

**文件：**
- 修改：`openpm/scripts/web-ui/app.js`

- [ ] **步骤 1：重写 derivePhase() — 事件驱动判定**

将 `openpm/scripts/web-ui/app.js:95-107` 的 `derivePhase` 替换为：

```js
function derivePhase(stats, sprints, epics) {
  var hasActiveSprint = sprints.some(function(s) {
    return s.status === 'active';
  });
  // 检测活跃 Sprint 中是否所有 Task 都 done
  if (hasActiveSprint && stats.activeSprint) {
    var sprintTaskCount = (stats.activeSprintTasks || 0);
    var doneInSprint = (stats.activeSprintDone || 0);
    if (sprintTaskCount > 0 && doneInSprint >= sprintTaskCount) return 4;
    return 3;
  }
  if (stats.totalTasks > 0) return 2;
  return 1;
}
```

- [ ] **步骤 2：重写 deriveAlerts() — 事件驱动提醒**

将 `openpm/scripts/web-ui/app.js:110-136` 的 `deriveAlerts` 替换为：

```js
function deriveAlerts(stats, sprints) {
  var alerts = [];
  var activeSprint = sprints.find(function(s) {
    return s.status === 'active';
  });

  // Sprint 中所有 Task done → 待复盘
  if (activeSprint && stats.activeSprintTasks > 0 &&
      stats.activeSprintDone >= stats.activeSprintTasks) {
    alerts.push({ text: "Sprint '" + activeSprint.name + "' 所有任务已完成，待复盘", priority: 1 });
  }

  // Sprint 待启动
  var planSprints = sprints.filter(function(s) {
    return s.status === 'plan';
  });
  if (planSprints.length > 0) {
    alerts.push({ text: "Sprint '" + planSprints[0].name + "' 待启动", priority: 2 });
  }

  // Task 待分配 Sprint
  if (stats.todoTasks > 0) {
    alerts.push({ text: stats.todoTasks + ' 个 Task 待分配 Sprint', priority: 3 });
  }

  return alerts.slice(0, 2);
}
```

- [ ] **步骤 3：更新 renderWorkflowBar() 中的 api 调用 — 传入 Sprint task 统计**

在 `openpm/scripts/web-ui/app.js:144-150` 的 `renderWorkflowBar` 中，更新 stats 计算。需要在 `/api/stats` 中增加 active sprint 内 task 的完成统计（见任务 7 步骤 1）。

- [ ] **步骤 4：调整 stats API 返回数据**

在 `openpm/scripts/web/api.js:38-49`，更新 `/api/stats` 为：

```js
  if (pathname === '/api/stats') return () => {
    const tasks = taskCommand('list', {}, cwd);
    const sprints = sprintCommand('list', {}, cwd);
    var activeSprint = sprints.sprints ? sprints.sprints.find(function(s) { return s.status === 'active'; }) || null : null;
    var sprintTasks = activeSprint ? (tasks.tasks || []).filter(function(t) { return t.sprint === activeSprint.id; }) : [];
    return {
      ok: true,
      totalTasks: tasks.tasks ? tasks.tasks.length : 0,
      todoTasks: tasks.tasks ? tasks.tasks.filter(function(t) { return t.status === 'todo'; }).length : 0,
      completedTasks: tasks.tasks ? tasks.tasks.filter(function(t) { return t.status === 'done'; }).length : 0,
      inProgressTasks: tasks.tasks ? tasks.tasks.filter(function(t) { return t.status === 'in_progress'; }).length : 0,
      activeSprint: activeSprint,
      activeSprintTasks: sprintTasks.length,
      activeSprintDone: sprintTasks.filter(function(t) { return t.status === 'done'; }).length,
    };
  };
```

- [ ] **步骤 5：Commit**

```bash
git add openpm/scripts/web-ui/app.js openpm/scripts/web/api.js
git commit -m "refactor: event-driven phase detection and alerts"
```

---

### 任务 7：更新 Web UI 页面

**文件：**
- 修改：`openpm/scripts/web-ui/sprint.html`
- 重写：`openpm/scripts/web-ui/worklog.html`
- 修改：`openpm/scripts/web-ui/index.html`
- 删除：`openpm/scripts/web-ui/timeline.html`

- [ ] **步骤 1：更新 sprint.html — 移除日期展示**

在 `openpm/scripts/web-ui/sprint.html:23`，将日期行改为纯文本元信息：

```html
      '<div class="sprint-meta">任务数: ' + (s.taskCount || 0) + ' · ' + (s.goal || '') + '</div></div>' +
```

注：`taskCount` 字段从 sprint show API 返回。

- [ ] **步骤 2：重写 worklog.html — 事件日志视图**

将 `openpm/scripts/web-ui/worklog.html` 重写为：

```html
<style>.log-entry { background:var(--surface);border:1px solid var(--border);border-radius:8px;padding:16px;margin-bottom:12px } .log-event { font-weight:600;font-size:13px } .log-sprint { font-size:11px;color:var(--primary);margin-left:6px } .log-body { font-size:12px;color:var(--text-secondary);margin-top:8px;line-height:1.6 }</style>
<div style="padding:20px">
  <h2 style="font-size:13px;font-weight:600;margin-bottom:12px">事件日志</h2>
  <div id="log-entries"></div>
</div>
<script>
async function loadWorklog() {
  var logs = await api('logs');
  var list = logs.logs || [];
  var sprints = await api('sprints');
  var sprintMap = {};
  (sprints.sprints || []).forEach(function(s) { sprintMap[s.id] = s.name; });
  var html = '';
  for (var i = 0; i < list.length; i++) {
    var l = list[i];
    var sprintLabel = l.sprint ? ('<span class="log-sprint">[' + (sprintMap[l.sprint] || l.sprint) + ']</span>') : '';
    html += '<div class="log-entry"><div class="log-event">' + (l.event || 'general') + sprintLabel + '</div><div class="log-body">' + (l.body || '') + '</div></div>';
  }
  document.getElementById('log-entries').innerHTML = html || '<p style="color:var(--text-muted)">暂无日志</p>';
}
window.initPage = function(p) { if (p === 'worklog') loadWorklog(); };
window.refreshPage = function() { if (currentPage === 'worklog') loadWorklog(); };
</script>
```

- [ ] **步骤 3：从 index.html 移除时间线导航项**

在 `openpm/scripts/web-ui/index.html:17`，删除：
```html
    <a href="#timeline" data-page="timeline"><i class="bi bi-calendar-week"></i> 时间线</a>
```

- [ ] **步骤 4：从 app.js pages 中删除 timeline 注册**

在 `openpm/scripts/web-ui/app.js:36`，删除：
```js
  timeline: { title: '时间线', file: 'timeline.html' },
```

- [ ] **步骤 5：删除 timeline.html**

```bash
Remove-Item -LiteralPath "openpm\scripts\web-ui\timeline.html"
```

- [ ] **步骤 6：Commit**

```bash
git add openpm/scripts/web-ui/sprint.html openpm/scripts/web-ui/worklog.html openpm/scripts/web-ui/index.html openpm/scripts/web-ui/app.js
git rm openpm/scripts/web-ui/timeline.html
git commit -m "refactor: update Web UI pages for time-free model"
```

---

### 任务 8：更新 SKILL.md Agent 行为指南

**文件：**
- 修改：`openpm/SKILL.md`

涉及多处变更，逐处修改：

- [ ] **步骤 1：更新 description frontmatter**

行 3：`Milestone、里程碑、进度、工作日志、验收标准、需求拆解、每日站会、Scrum、敏捷。`

改为：
`进度、工作日志、验收标准、需求拆解、Scrum、敏捷。`

（移除 "Milestone、里程碑、"、"每日站会、"）

- [ ] **步骤 2：更新角色描述**

行 15：`通过 CLI 操作项目数据（task/sprint/epic/milestone/log）`

改为：
`通过 CLI 操作项目数据（task/sprint/epic/log）`

- [ ] **步骤 3：更新阶段判断**

行 47-52，将阶段判断表格改为：
```
无 Epic 且无 Task           → 阶段 1：定义需求
有 Task 但无活跃 Sprint     → 阶段 2：规划迭代
有活跃 Sprint + 有未完成   → 阶段 3：执行迭代
活跃 Sprint 全 done         → 阶段 4：验收复盘
```

删除：
```
Sprint 到期 + 有活跃     → 阶段 4：验收复盘
```

- [ ] **步骤 4：阶段 1 — 删除 Milestone 创建引导**

行 92-99：删除整个 "若用户设定了硬死线" 的引导话术和 Milestone create 命令示例。

以及行 159：删除 Milestone 相关引导话术。

- [ ] **步骤 5：阶段 2 — 删除时间参数**

行 125-127：删除 "检查即将到来的 Milestone" 引导和 `milestone list` 命令。

行 134-139：修改 sprint create 命令示例，移除 `--start` 和 `--end`：
```bash
    node ${SKILL_DIR}/scripts/cli.js sprint create \
      --name "Sprint 1" \
      --goal "完成用户认证基础功能"
```

- [ ] **步骤 6：阶段 2 — 引导话术去时间**

删除行 159 的 Milestone 提醒话术。

行 155 — 删除 Sprint 引导话术中的 Milestone 相关提醒：
```
> "提醒：Milestone 'MVP v0.1' 目标 8月1日..."
```
改为删除整行。

- [ ] **步骤 7：阶段 3 — 删除时间相关引导话术**

行 200-203：修改 log 命令示例：
```bash
    node ${SKILL_DIR}/scripts/cli.js log create --sprint sprint-1 --event "task_done" --summary "实现登录功能"
```

行 213：删除 Milestone 进度提醒话术。

- [ ] **步骤 8：阶段 4 — 删除 Milestone 检查步骤**

行 241-245：删除 "检查 Milestone 进展" 的说明和 `milestone list` 命令。

行 256：删除 Milestone 进展相关的引导话术。

- [ ] **步骤 9：更新数据模型速查表**

行 269-281：更新表格：
- 删除 Milestone 行
- Sprint 用途从 "时间盒，控制交付节奏" 改为 "迭代容器，按任务批次驱动"
- Log 从 "按日期" 改为 "按 Sprint/事件"
- Sprint 字段删除 `start_date`、`end_date`

- [ ] **步骤 10：更新命令参考**

行 299：删除 sprint create 示例中的 `--start` 和 `--end`。

行 310-311：更新 log 命令：
```bash
node ${SKILL_DIR}/scripts/cli.js log create --sprint <id> --event <type> --summary "..."
```

- [ ] **步骤 11：更新工程实践**

行 327：将 "单个 Task 应在 1 天内可完成" 改为 "单个 Task 聚焦一件事，按功能/模块边界判断粒度"。

行 336：将 "单个 Task 1 天内可完成" 改为 "单个 Task 聚焦一件事"。

- [ ] **步骤 12：Commit**

```bash
git add openpm/SKILL.md
git commit -m "docs(skill): remove time constraints from agent workflow"
```

---

### 任务 9：更新参考文档

**文件：**
- 修改：`openpm/references/commands.md`
- 修改：`openpm/docs/pm-practices/scrum.md`

- [ ] **步骤 1：更新 commands.md — 删除 Milestone 章节**

删除 `openpm/references/commands.md` 行 51-59 整个 Milestone 章节。

- [ ] **步骤 2：更新 commands.md — 修改 Sprint create 命令**

行 32：删除 `--start` 和 `--end` 参数：
```bash
node ${SKILL_DIR}/scripts/cli.js sprint create --name "Sprint 1" --goal "..."
```

- [ ] **步骤 3：更新 commands.md — 修改 Log 命令**

行 63-67：替换为：
```bash
node ${SKILL_DIR}/scripts/cli.js log create --sprint <id> --event <type> --summary "..."
node ${SKILL_DIR}/scripts/cli.js log list [--sprint <id>]
node ${SKILL_DIR}/scripts/cli.js log show <log-id>
```

- [ ] **步骤 4：标记 scrum.md 时间内容**

在 `openpm/docs/pm-practices/scrum.md` 文件开头添加一段注意事项：
```
> 注意：以下 Scrum 指南中的时间约束（Sprint 时长、仪式时长等）仅供人类团队参考。
> OpenPM 面向 AI Agent 使用，Sprint 由 Task 完成度驱动，不受时间限制。
```

- [ ] **步骤 5：Commit**

```bash
git add openpm/references/commands.md openpm/docs/pm-practices/scrum.md
git commit -m "docs: update references for time-free model"
```

---

### 任务 10：最终验证

**文件：** 无需修改

- [ ] **步骤 1：验证 CLI 正常启动**

```bash
node openpm/scripts/cli.js task list
```
预期：JSON 输出（`{"ok":true,"tasks":[],"count":0}` 或有已存在数据）

- [ ] **步骤 2：验证 sprint create 无报错**

```bash
node openpm/scripts/cli.js sprint create --name "Test Sprint" --goal "test"
```
预期：成功创建，无 `start_date`/`end_date` 字段

- [ ] **步骤 3：验证 task create 无报错**

```bash
node openpm/scripts/cli.js task create --title "Test Task" --status todo
```
预期：成功创建，无 `created`/`updated` 字段

- [ ] **步骤 4：验证 milestone 命令已失效**

```bash
node openpm/scripts/cli.js milestone list
```
预期：错误 "Unknown entity: milestone"

- [ ] **步骤 5：清理测试数据**

```bash
Remove-Item -LiteralPath ".openpm\sprints\sprint-1.md" -ErrorAction SilentlyContinue
Remove-Item -LiteralPath ".openpm\tasks\task-001.md" -ErrorAction SilentlyContinue
```

- [ ] **步骤 6：Commit（如有清理提交）**

```bash
git status
```
