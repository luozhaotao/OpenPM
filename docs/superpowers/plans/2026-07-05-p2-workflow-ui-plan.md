# P2 工作流 UI 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在 Web Dashboard 主区域顶部添加工作流 Stepper + 审批提醒，同时将侧边栏重排为宏观→微观顺序。

**Architecture:** 纯粹前端改动，三个文件：style.css（新增样式）、index.html（DOM 结构 + 侧边栏顺序）、app.js（判定逻辑 + 渲染）。不需新增 API，所有数据从现有 `/api/stats`、`/api/epics`、`/api/sprints`、`/api/tasks` 推导。

**Tech Stack:** Vanilla HTML/CSS/JS（无框架），Node.js HTTP server

---

### Task 0: API — stats 端点增加 `todoTasks` 字段

**Files:**
- Modify: `openpm/scripts/web/api.js`

- [ ] **Step 1: 在 /api/stats 返回值中添加 `todoTasks`**

在 `openpm/scripts/web/api.js` 第 43 行（`totalTasks` 之后）插入一行：

```javascript
      todoTasks: tasks.tasks ? tasks.tasks.filter(t => t.status === 'todo').length : 0,
```

最终 `/api/stats` 的返回值（第 41-47 行）变为：

```javascript
    return {
      ok: true,
      totalTasks: tasks.tasks ? tasks.tasks.length : 0,
      todoTasks: tasks.tasks ? tasks.tasks.filter(t => t.status === 'todo').length : 0,
      completedTasks: tasks.tasks ? tasks.tasks.filter(t => t.status === 'done').length : 0,
      inProgressTasks: tasks.tasks ? tasks.tasks.filter(t => t.status === 'in_progress').length : 0,
      activeSprint: sprints.sprints ? sprints.sprints.find(s => s.status === 'active') || null : null,
    };
```

- [ ] **Step 2: 验证**

```bash
curl -s http://localhost:23214/api/stats | python3 -m json.tool
```
Expected: 返回中包含 `"todoTasks": <N>`

- [ ] **Step 3: 提交**

```bash
git add openpm/scripts/web/api.js
git commit -m "feat(api): add todoTasks field to /api/stats"
```

---

### Task 1: CSS — 工作流条形样式

**Files:**
- Modify: `openpm/scripts/web-ui/style.css`

- [ ] **Step 1: 在 style.css 末尾追加 Stepper 和 Alert 样式**

在 `openpm/scripts/web-ui/style.css` 文件末尾追加以下内容：

```css

/* Workflow stepper bar */
.workflow-bar {
  background: var(--surface); border-bottom: 1px solid var(--border);
  padding: 0 24px; height: 36px; display: flex; align-items: center;
  gap: 6px; font-size: 12px; flex-shrink: 0;
}
.wf-step {
  display: flex; align-items: center; gap: 4px; white-space: nowrap;
}
.wf-step .step-circle {
  width: 18px; height: 18px; border-radius: 50%;
  display: inline-flex; align-items: center; justify-content: center;
  font-size: 10px; font-weight: 700; background: var(--hover); color: var(--text-muted);
}
.wf-step.done .step-circle { background: var(--success); color: #fff; }
.wf-step.active .step-circle { background: var(--primary); color: #fff; }
.wf-step.done { color: var(--success); }
.wf-step.active { color: var(--primary); font-weight: 600; }
.wf-step.pending { color: var(--text-muted); }
.wf-connector { color: var(--border); margin: 0 2px; }
.wf-alerts { margin-left: auto; display: flex; gap: 6px; align-items: center; }
.wf-alert {
  font-size: 11px; padding: 2px 8px; border-radius: 3px;
  background: var(--warning-bg); border: 1px solid #fcd34d; color: #92400e;
  white-space: nowrap;
}
```

- [ ] **Step 2: 验证 CSS 无语法错**

```bash
node -e "var fs = require('fs'); var css = fs.readFileSync('openpm/scripts/web-ui/style.css','utf8'); console.log('CSS loaded, ' + css.length + ' bytes');"
```
Expected: `CSS loaded, <N> bytes`

- [ ] **Step 3: 提交**

```bash
git add openpm/scripts/web-ui/style.css
git commit -m "feat(web): add workflow stepper and alert CSS styles"
```

---

### Task 2: index.html — 侧边栏重排 + workflow bar 容器

**Files:**
- Modify: `openpm/scripts/web-ui/index.html`

- [ ] **Step 1: 重排侧边栏导航链接顺序**

将 `openpm/scripts/web-ui/index.html` 第 13-19 行的侧边栏链接从当前顺序：

```html
  <div class="sidebar-nav">
    <a href="#kanban" data-page="kanban"><i class="bi bi-columns-gap"></i> 看板</a>
    <a href="#sprint" data-page="sprint"><i class="bi bi-graph-up"></i> 迭代</a>
    <a href="#epic-tree" data-page="epic-tree"><i class="bi bi-diagram-3"></i> 专题树</a>
    <a href="#timeline" data-page="timeline"><i class="bi bi-calendar-week"></i> 时间线</a>
    <a href="#worklog" data-page="worklog"><i class="bi bi-journal-text"></i> 工作日志</a>
  </div>
```

改为新顺序（宏观→微观）：

```html
  <div class="sidebar-nav">
    <a href="#epic-tree" data-page="epic-tree"><i class="bi bi-diagram-3"></i> 专题树</a>
    <a href="#sprint" data-page="sprint"><i class="bi bi-graph-up"></i> 迭代</a>
    <a href="#kanban" data-page="kanban"><i class="bi bi-columns-gap"></i> 看板</a>
    <a href="#timeline" data-page="timeline"><i class="bi bi-calendar-week"></i> 时间线</a>
    <a href="#worklog" data-page="worklog"><i class="bi bi-journal-text"></i> 工作日志</a>
  </div>
```

- [ ] **Step 2: 插入 workflow bar 容器**

将 `openpm/scripts/web-ui/index.html` 第 26 行的：

```html
  <header class="header" id="page-header"></header>
```

改为：

```html
  <header class="header" id="page-header"></header>
  <div class="workflow-bar" id="workflow-bar"></div>
```

- [ ] **Step 3: 更新默认页面为 epic-tree（侧边栏第一项）**

将 `openpm/scripts/web-ui/app.js` 第 128 行的默认页面从 `kanban` 改为 `epic-tree`：

```javascript
navigate(location.hash.slice(1) || 'epic-tree');
```

- [ ] **Step 4: 验证 HTML 结构**

```bash
grep -n "workflow-bar\|epic-tree\|kanban\|sprint\|timeline\|worklog" openpm/scripts/web-ui/index.html | head -15
```
Expected: workflow-bar 出现在 header 之后，侧边栏顺序为 epic-tree → sprint → kanban → timeline → worklog

- [ ] **Step 5: 提交**

```bash
git add openpm/scripts/web-ui/index.html openpm/scripts/web-ui/app.js
git commit -m "feat(web): reorder sidebar (macro-to-micro) and add workflow bar container"
```

---

### Task 3: app.js — 工作流判定与渲染逻辑

**Files:**
- Modify: `openpm/scripts/web-ui/app.js`

- [ ] **Step 1: 在 `api()` 函数之后添加 `derivePhase()` 和 `deriveAlerts()` 函数**

在 `openpm/scripts/web-ui/app.js` 第 90 行（`api()` 函数闭合的 `}`）之后、第 92 行（hash routing 注释）之前，插入以下代码：

```javascript

// 工作流阶段判定
function derivePhase(stats, sprints, epics) {
  var hasActiveSprint = sprints.some(function(s) {
    return s.status === 'active';
  });
  var hasExpiredSprint = sprints.some(function(s) {
    return s.status === 'active' && new Date(s.end_date) < new Date();
  });

  if (hasExpiredSprint) return 4;       // 验收复盘
  if (hasActiveSprint)  return 3;       // 执行迭代
  if (stats.totalTasks > 0) return 2;   // 规划迭代
  return 1;                             // 定义需求
}

// 审批提醒推导
function deriveAlerts(stats, sprints) {
  var alerts = [];

  // Sprint 待复盘（最紧迫）
  var expiredSprints = sprints.filter(function(s) {
    return s.status === 'active' && new Date(s.end_date) < new Date();
  });
  if (expiredSprints.length > 0) {
    alerts.push({ text: 'Sprint \'' + expiredSprints[0].name + '\' 待复盘', priority: 1 });
  }

  // Sprint 待启动
  var planSprints = sprints.filter(function(s) {
    return s.status === 'plan';
  });
  if (planSprints.length > 0) {
    alerts.push({ text: 'Sprint \'' + planSprints[0].name + '\' 待启动', priority: 2 });
  }

  // Task 待分配 Sprint
  if (stats.todoTasks > 0) {
    alerts.push({ text: stats.todoTasks + ' 个 Task 待分配 Sprint', priority: 3 });
  }

  // 最多显示 2 个
  return alerts.slice(0, 2);
}
```

- [ ] **Step 2: 添加 `renderWorkflowBar()` 函数**

在 Step 1 插入的代码之后，继续插入：

```javascript

// 渲染工作流 Stepper + 审批提醒
async function renderWorkflowBar() {
  var bar = document.getElementById('workflow-bar');
  if (!bar) return;

  try {
    var results = await Promise.all([
      api('stats'),
      api('sprints'),
      api('epics')
    ]);
    var stats = results[0].ok ? results[0] : { totalTasks: 0 };
    var sprints = results[1].ok ? results[1].sprints : [];
    var epics = results[2].ok ? results[2].epics : [];

    var phase = derivePhase(stats, sprints, epics);
    var alerts = deriveAlerts(stats, sprints);

    var phases = [
      { num: 1, label: '定义需求' },
      { num: 2, label: '规划迭代' },
      { num: 3, label: '执行迭代' },
      { num: 4, label: '验收复盘' },
    ];

    var html = '';
    for (var i = 0; i < phases.length; i++) {
      if (i > 0) html += '<span class="wf-connector">─</span>';

      var cls = 'wf-step';
      var circle = '' + phases[i].num;

      if (phases[i].num < phase) {
        cls += ' done';
        circle = '✓';
      } else if (phases[i].num === phase) {
        cls += ' active';
      } else {
        cls += ' pending';
      }

      html += '<span class="' + cls + '">';
      html += '<span class="step-circle">' + circle + '</span>';
      html += phases[i].label;
      html += '</span>';
    }

    // 审批提醒
    if (alerts.length > 0) {
      html += '<span class="wf-alerts">';
      for (var j = 0; j < alerts.length; j++) {
        html += '<span class="wf-alert">⚠ ' + alerts[j].text + '</span>';
      }
      html += '</span>';
    }

    bar.innerHTML = html;
  } catch (e) {
    bar.innerHTML = '';
  }
}
```

- [ ] **Step 3: 在 `navigate()` 中调用 `renderWorkflowBar()`**

在 `openpm/scripts/web-ui/app.js` 的 `navigate()` 函数中，找到第 73 行（`if (typeof window.initPage === 'function')` 那一行），在该行之前插入对 `renderWorkflowBar()` 的调用：

```javascript
    // 更新工作流导航条
    renderWorkflowBar();
```

插入后的上下文应为：

```javascript
    scripts.forEach(function(s) {
      var ns = document.createElement('script');
      for (var i = 0; i < s.attributes.length; i++) {
        ns.setAttribute(s.attributes[i].name, s.attributes[i].value);
      }
      ns.textContent = s.textContent;
      container.appendChild(ns);
    });
    // 更新工作流导航条
    renderWorkflowBar();
    // Trigger page initialization
    if (typeof window.initPage === 'function') window.initPage(page);
```

- [ ] **Step 4: 验证 — 启动 Web Dashboard 并检查渲染**

```bash
node openpm/scripts/cli.js web &
sleep 2
curl -s http://localhost:23214/api/stats
curl -s http://localhost:23214/api/sprints
curl -s http://localhost:23214/api/epics
```
Expected: 所有 API 返回 JSON 数据。在浏览器打开 `http://localhost:23214` 确认 Stepper 和审批提醒正常显示。

- [ ] **Step 5: 提交**

```bash
git add openpm/scripts/web-ui/app.js
git commit -m "feat(web): add workflow stepper and approval alert rendering"
```
