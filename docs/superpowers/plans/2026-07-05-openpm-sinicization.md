# OpenPM 中文化实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将 OpenPM 的 SKILL.md 和 Web UI 全面中文化，建立共享术语映射层

**Architecture:** 在 `app.js` 顶部定义全局 `window.LABELS` 映射对象，所有页面统一引用；SKILL.md 文本手动对齐同一套中文术语

**Tech Stack:** Vanilla JavaScript, HTML, CSS

---

### Task 1: app.js — 新增 LABELS 映射对象，改页面标题

**Files:**
- Modify: `openpm/scripts/web-ui/app.js`

- [ ] **Step 1: 在 app.js 顶部插入 window.LABELS 定义**

在文件第 1 行（`var pages = {` 之前）插入：

```javascript
// 术语映射 — 单一数据源，所有页面统一引用
window.LABELS = {
  status: {
    todo: '待办',
    in_progress: '进行中',
    done: '已完成'
  },
  type: {
    story: '需求',
    task: '开发任务',
    bug: '缺陷'
  },
  priority: {
    high: '高',
    medium: '中',
    low: '低'
  },
  sprint_status: {
    plan: '规划中',
    active: '进行中',
    done: '已完成'
  },
  milestone_status: {
    upcoming: '计划中',
    current: '当前',
    done: '已完成'
  }
};
```

- [ ] **Step 2: 更新 pages 对象中的页面标题**

将 `pages` 对象中：
- `sprint: { title: 'Sprint', file: 'sprint.html' }` → `sprint: { title: '迭代', file: 'sprint.html' }`
- `'epic-tree': { title: 'Epic 树', file: 'epic-tree.html' }` → `'epic-tree': { title: '专题树', file: 'epic-tree.html' }`

- [ ] **Step 3: 提交**

```bash
git add openpm/scripts/web-ui/app.js
git commit -m "feat(web): add LABELS mapping object, localize page titles"
```

---

### Task 2: index.html — 侧边栏标签中文化

**Files:**
- Modify: `openpm/scripts/web-ui/index.html`

- [ ] **Step 1: 修改侧边栏导航链接文字**

将第 14-17 行中：
```html
<a href="#sprint" data-page="sprint"><i class="bi bi-graph-up"></i> Sprint</a>
<a href="#epic-tree" data-page="epic-tree"><i class="bi bi-diagram-3"></i> Epic 树</a>
```

改为：
```html
<a href="#sprint" data-page="sprint"><i class="bi bi-graph-up"></i> 迭代</a>
<a href="#epic-tree" data-page="epic-tree"><i class="bi bi-diagram-3"></i> 专题树</a>
```

- [ ] **Step 2: 提交**

```bash
git add openpm/scripts/web-ui/index.html
git commit -m "feat(web): localize sidebar nav labels"
```

---

### Task 3: kanban.html — 类型和优先级标签映射

**Files:**
- Modify: `openpm/scripts/web-ui/kanban.html`

- [ ] **Step 1: 修改 renderCard 函数中的标签渲染**

在 `renderCard` 函数开头，`var acHtml` 之前加：
```javascript
var L = window.LABELS;
```

将原来的标签生成逻辑：
```javascript
var tags = '';
if (t.epic) tags += '<span class="tag epic">' + t.epic + '</span>';
tags += '<span class="tag ' + (t.type || 'task') + '">' + (t.type || 'task') + '</span>';
tags += '<span class="tag ' + (t.priority || 'medium') + '">' + (t.priority || '中') + '</span>';
```

改为：
```javascript
var tags = '';
if (t.epic) tags += '<span class="tag epic">' + t.epic + '</span>';
tags += '<span class="tag ' + (t.type || 'task') + '">' + (L.type[t.type] || '开发任务') + '</span>';
tags += '<span class="tag ' + (t.priority || 'medium') + '">' + (L.priority[t.priority] || '中') + '</span>';
```

- [ ] **Step 2: 提交**

```bash
git add openpm/scripts/web-ui/kanban.html
git commit -m "feat(web): localize kanban card labels with LABELS mapping"
```

---

### Task 4: sprint.html — 状态映射和文本替换

**Files:**
- Modify: `openpm/scripts/web-ui/sprint.html`

- [ ] **Step 1: 在 loadSprint 函数头部加 LABELS 引用**

在 `async function loadSprint() {` 下一行加：
```javascript
var L = window.LABELS;
```

- [ ] **Step 2: 映射 sprint 状态显示**

将第 23 行的：
```javascript
'<span style="font-size:12px;color:var(--text-secondary)">' + s.status + '</span></div>';
```

改为：
```javascript
'<span style="font-size:12px;color:var(--text-secondary)">' + (L.sprint_status[s.status] || s.status) + '</span></div>';
```

- [ ] **Step 3: 替换页面标题文字**

- "迭代列表"（第 5 行）保持不变 ✓
- "Sprint 小结" → "迭代小结"
- "暂无 Sprint" → "暂无迭代"
- "活跃 Sprint" → "活跃迭代"

具体改动：

第 5 行：`<h2 style="font-size:13px;font-weight:600;margin-bottom:12px">Sprint 小结</h2>` → `迭代小结`

第 25 行：`document.getElementById('sprint-list').innerHTML = html || '<p style="color:var(--text-muted)">暂无 Sprint</p>';` → `暂无迭代`

第 30 行：`'<div class="stat-label">活跃 Sprint</div>'` → `'<div class="stat-label">活跃迭代</div>'`

- [ ] **Step 4: 提交**

```bash
git add openpm/scripts/web-ui/sprint.html
git commit -m "feat(web): localize sprint page — status mapping and text"
```

---

### Task 5: epic-tree.html — 状态映射和文本替换

**Files:**
- Modify: `openpm/scripts/web-ui/epic-tree.html`

- [ ] **Step 1: 在 loadEpics 函数头部加 LABELS 引用**

在 `async function loadEpics() {` 下一行加：
```javascript
var L = window.LABELS;
```

- [ ] **Step 2: 映射 epic 状态显示**

将第 20 行中的：
```javascript
'<span style="font-size:11px;color:var(--text-muted)">' + done + '/' + etasks.length + ' · ' + e.status + '</span></div>';
```

改为（Epic 状态值为 todo/in_progress/done，与 Task 状态相同，用 L.status）：
```javascript
'<span style="font-size:11px;color:var(--text-muted)">' + done + '/' + etasks.length + ' · ' + (L.status[e.status] || e.status) + '</span></div>';
```

- [ ] **Step 3: 替换文本**

- 第 27 行：`html || '<p style="color:var(--text-muted)">暂无 Epic</p>'` → `暂无专题`
- 第 29 行：`'<p>Epic: <strong>'` → `'<p>专题: <strong>'`

- [ ] **Step 4: 提交**

```bash
git add openpm/scripts/web-ui/epic-tree.html
git commit -m "feat(web): localize epic-tree page — status mapping and text"
```

---

### Task 6: timeline.html — 状态映射和文本替换

**Files:**
- Modify: `openpm/scripts/web-ui/timeline.html`

- [ ] **Step 1: 在 loadTimeline 函数头部加 LABELS 引用**

在 `async function loadTimeline() {` 下一行加：
```javascript
var L = window.LABELS;
```

- [ ] **Step 2: 映射 sprint 状态显示**

将第 24 行的：
```javascript
'<span style="font-size:12px;color:var(--text-secondary)">' + s.status + '</span></div>';
```

改为：
```javascript
'<span style="font-size:12px;color:var(--text-secondary)">' + (L.sprint_status[s.status] || s.status) + '</span></div>';
```

- [ ] **Step 3: 映射 milestone 状态显示**

将第 31 行的（dot class 保留英文值用于 CSS 匹配）：
```javascript
mhtml += '<div class="ml-item"><span class="ml-dot ' + m.status + '"></span><div><div class="ml-name">' + m.name + '</div><div class="ml-date">' + (m.target_date || '') + '</div></div></div>';
```

改为（在日期位置显示中文状态标签）：
```javascript
mhtml += '<div class="ml-item"><span class="ml-dot ' + m.status + '"></span><div><div class="ml-name">' + m.name + '</div><div class="ml-date">' + (L.milestone_status[m.status] || m.status) + ' · ' + (m.target_date || '') + '</div></div></div>';
```

- [ ] **Step 4: 替换标题文字**

- 第 4 行：`"Sprint 时间线"` → `"迭代时间线"`
- 第 26 行：`'<p style="color:var(--text-muted)">暂无 Sprint</p>'` → `'<p style="color:var(--text-muted)">暂无迭代</p>'`

- [ ] **Step 5: 提交**

```bash
git add openpm/scripts/web-ui/timeline.html
git commit -m "feat(web): localize timeline page — status mapping and text"
```

---

### Task 7: SKILL.md — 术语统一

**Files:**
- Modify: `openpm/SKILL.md`

- [ ] **Step 1: 数据模型速查表 — Epic 和 Log 行**

第 33 行：
```
| Epic | `.openpm/epics/` | `todo` → `in_progress` → `done` |
```
→
```
| 专题 | `.openpm/epics/` | `todo` → `in_progress` → `done` |
```

第 35 行：
```
| Log | `.openpm/logs/` | 按日期存储 |
```
→
```
| Log（工作日志） | `.openpm/logs/` | 按日期存储 |
```

- [ ] **Step 2: Task 字段说明 — type 字段注释**

第 39 行：
```
Task 字段：`id`, `title`, `status`, `priority` (high/medium/low), `type` (story/task/bug), `sprint`, `epic`, `depends_on` (数组), `ac` (验收标准数组)
```
→
```
Task 字段：`id`, `title`, `status`, `priority` (high/medium/low), `type` (story/需求, task/开发任务, bug/缺陷), `sprint`, `epic`, `depends_on` (数组), `ac` (验收标准数组)
```

- [ ] **Step 3: 命令参考子标题**

第 92 行：
```
### Epic / Milestone / Log / Summary
```
→ (拆分为独立小节)
```
### Epic（专题）

```bash
openpm epic create --title "用户认证系统"
openpm epic list
openpm epic show <epic-id>          # 查看专题详情及关联任务
openpm epic update <epic-id> --title "..." --status in_progress
openpm epic delete <epic-id> [--force]  # 有关联任务时需 --force
```

### Milestone（里程碑）

```bash
openpm milestone create --name "MVP v0.1" --date 2026-08-01
openpm milestone list
openpm milestone show <ms-id>
openpm milestone update <ms-id> --name "..." --date ... --status current
openpm milestone delete <ms-id>
```

### Log（工作日志）

```bash
openpm log today [--summary "..."] [--tasks "task-001:done,task-002:in_progress"]
openpm log show <date>              # 读取指定日期日志，如 2026-07-01
openpm log list
```

### Summary（小结）

```bash
openpm summary --sprint sprint-1
```
```

- [ ] **Step 4: 工作流指南章节标题**

第 122 行：`### Sprint Planning` → `### 迭代规划`

第 136 行：`### Sprint 闭合` → `### 迭代闭合`

- [ ] **Step 5: 正文术语替换**

逐一替换以下术语：

| 原文 | 改为 | 位置线索 |
|------|------|----------|
| Sprint Planning | 迭代规划 | 第 17 行（何时使用），第 122 行（已改标题） |
| Sprint 容量 | 迭代容量 | 第 148 行（每 Sprint 5-12 个 Task） |
| Sprint Backlog 精简 | 迭代待办列表精简 | 第 177 行 |
| Story 类型任务 | 需求类型任务 | 第 176 行 |
| 下一个 Sprint | 下一个迭代 | 第 88 行（sprint close 说明） |
| 未完成任务移入下个 Sprint | 未完成任务移入下个迭代 | 第 88 行 |
| 上一个 Sprint | 上一个迭代 | 查找 sprint close 上下文 |

- [ ] **Step 6: 提交**

```bash
git add openpm/SKILL.md
git commit -m "docs(skill): unify Chinese terminology in SKILL.md"
```

---

### Task 8: 验证 — 启动 Web 服务并逐页检查

- [ ] **Step 1: 初始化测试数据（如无可跳过）**

```bash
node openpm/scripts/cli.js init 2>/dev/null || echo "Already initialized, skip"
```

如果 `.openpm/` 目录尚无非测试数据，创建一些示例数据用于验证：

```bash
node openpm/scripts/cli.js sprint create --name "Sprint 1" --goal "MVP 版本" --start 2026-07-01 --end 2026-07-14
node openpm/scripts/cli.js task create --title "用户登录" --status in_progress --type story --priority high --sprint sprint-1
node openpm/scripts/cli.js task create --title "修复登录页样式" --status todo --type bug --priority medium --sprint sprint-1
node openpm/scripts/cli.js epic create --title "用户认证系统"
node openpm/scripts/cli.js milestone create --name "MVP v0.1" --date 2026-08-01 --status current
```

- [ ] **Step 2: 启动 Web 服务**

```bash
node openpm/scripts/cli.js web --port 23214
```

- [ ] **Step 3: 逐页验证**

打开浏览器访问 `http://localhost:23214`，检查：

1. **看板页**（默认）：卡片标签显示"需求"/"缺陷"/"高"/"中"（非 story/bug/high/medium）
2. **迭代页**：状态标签显示"规划中"/"进行中"/"已完成"（非 plan/active/done）；页面标题"迭代"；统计卡片"活跃迭代"
3. **专题树**：状态显示中文；统计区"专题:"
4. **时间线**：标题"迭代时间线"；迭代和里程碑状态均显示中文
5. **工作日志**：无英文残留

- [ ] **Step 4: 验证 SKILL.md**

通读 `openpm/SKILL.md`，确认：
- "迭代"贯穿全文（不再出现未翻译的 "Sprint"）
- "专题"替代 "Epic" 作为实体名
- "需求类型任务"替代 "Story 类型任务"
- CLI 命令和参数名保持英文（正确）

- [ ] **Step 5: 关闭 Web 服务，提交验证通过**

```bash
# 确认无问题后，无需额外提交（验证步骤不产生代码变更）
```
