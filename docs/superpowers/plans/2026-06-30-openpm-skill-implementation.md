# OpenPM Skill 实现计划

> **面向 AI 代理的工作者：** 必需子技能：使用 superpowers:subagent-driven-development（推荐）或 superpowers:executing-plans 逐任务实现此计划。步骤使用复选框（`- [ ]`）语法来跟踪进度。

**目标：** 实现 OpenPM Skill——AI Agent 通过 CLI 管理敏捷项目数据，人类通过 Web 仪表盘浏览。

**架构：** Node.js CLI 工具操作 `.openpm/` 目录中的 Markdown+YAML 文件。同一工具内嵌 HTTP 服务，提供 REST API 供纯静态 Web 前端消费。零框架、零构建步骤。

**技术栈：** Node.js（内置模块：fs, path, http, url），无 npm 依赖。前端纯 HTML+CSS+JS，Bootstrap Icons CDN。

---

## 文件结构

```
.claude/skills/openpm/
├── SKILL.md                    # Skill 说明文件（AI 使用指南）
├── scripts/
│   ├── cli.js                  # CLI 入口：参数解析 + 命令路由
│   ├── lib/
│   │   ├── files.js            # 文件系统工具：读写 MD、解析 frontmatter、序列化
│   │   ├── id.js               # ID 生成：task-NNN、sprint-N、epic-xxx
│   │   └── config.js           # 读/写 .openpm/config.yaml
│   ├── commands/
│   │   ├── init.js             # openpm init
│   │   ├── task.js             # openpm task create|list|show|update|delete
│   │   ├── sprint.js           # openpm sprint create|start|close|list
│   │   ├── epic.js             # openpm epic create|list|show
│   │   ├── milestone.js        # openpm milestone create|list
│   │   ├── log.js              # openpm log today
│   │   └── summary.js          # openpm summary --sprint
│   ├── web/
│   │   ├── server.js           # HTTP 服务 + API 路由
│   │   └── api.js              # REST API：GET /api/tasks, /api/sprints, 等
│   └── web-ui/
│       ├── index.html          # SPA 入口（框架页，iframe 或动态加载）
│       ├── app.js              # 路由 + 数据获取 + 页面切换
│       ├── style.css           # 全局样式（设计系统变量、侧边栏、布局）
│       ├── kanban.html         # 看板页（片段）
│       ├── sprint.html         # Sprint 页（片段）
│       ├── epic-tree.html      # Epic 树页（片段）
│       ├── timeline.html       # 时间线页（片段）
│       └── worklog.html        # 工作日志页（片段）
└── templates/
    ├── task.md                 # 任务模板
    ├── sprint.md               # Sprint 模板
    ├── epic.md                 # Epic 模板
    ├── milestone.md            # Milestone 模板
    └── log.md                  # 日志模板
```

**设计原则：**
- `lib/` = 纯函数，不依赖 CLI 参数格式
- `commands/` = 每个实体一个文件，导出 `{entity}Command(action, args)` 函数
- `web/` = HTTP 服务，复用 `lib/` 和 `commands/` 读取数据
- `web-ui/` = SPA 架构，`index.html` + `app.js` 加载页面片段

---

### 任务 1：创建 Skill 目录结构和模板文件

**文件：**
- 创建：`.claude/skills/openpm/templates/task.md`
- 创建：`.claude/skills/openpm/templates/sprint.md`
- 创建：`.claude/skills/openpm/templates/epic.md`
- 创建：`.claude/skills/openpm/templates/milestone.md`
- 创建：`.claude/skills/openpm/templates/log.md`

- [ ] **步骤 1：创建 templates 目录和 task.md 模板**

```bash
mkdir -p .claude/skills/openpm/templates
```

文件 `templates/task.md`：

```markdown
---
id: "{{id}}"
title: "{{title}}"
status: {{status}}
priority: {{priority}}
type: {{type}}
{{#sprint}}sprint: {{sprint}}{{/sprint}}
{{#epic}}epic: {{epic}}{{/epic}}
{{#depends_on}}depends_on:{{#depends_on}}
  - {{.}}{{/depends_on}}{{/depends_on}}
{{#ac}}ac:{{#ac}}
  - "{{.}}"{{/ac}}{{/ac}}
created: "{{created}}"
updated: "{{updated}}"
---

{{description}}
```

- [ ] **步骤 2：创建 sprint.md 模板**

文件 `templates/sprint.md`：

```markdown
---
id: "{{id}}"
name: "{{name}}"
goal: "{{goal}}"
status: {{status}}
start_date: "{{start_date}}"
end_date: "{{end_date}}"
---

{{description}}
```

- [ ] **步骤 3：创建 epic.md 模板**

文件 `templates/epic.md`：

```markdown
---
id: "{{id}}"
title: "{{title}}"
status: {{status}}
---

{{description}}
```

- [ ] **步骤 4：创建 milestone.md 模板**

文件 `templates/milestone.md`：

```markdown
---
id: "{{id}}"
name: "{{name}}"
target_date: "{{target_date}}"
status: {{status}}
---
```

- [ ] **步骤 5：创建 log.md 模板**

文件 `templates/log.md`：

```markdown
---
date: "{{date}}"
tasks: []
---

## 今日摘要

## 阻塞项
```

- [ ] **步骤 6：Commit**

```bash
git add .claude/skills/openpm/templates/
git commit -m "feat(openpm): add entity templates"
```

---

### 任务 2：实现文件系统工具库 (lib/)

**文件：**
- 创建：`.claude/skills/openpm/scripts/lib/files.js`
- 创建：`.claude/skills/openpm/scripts/lib/id.js`
- 创建：`.claude/skills/openpm/scripts/lib/config.js`

- [ ] **步骤 1：创建 lib 目录**

```bash
mkdir -p .claude/skills/openpm/scripts/lib .claude/skills/openpm/scripts/commands .claude/skills/openpm/scripts/web .claude/skills/openpm/scripts/web-ui
```

- [ ] **步骤 2：实现 files.js — 读写 Markdown + YAML frontmatter**

文件 `scripts/lib/files.js`：

```javascript
const fs = require('fs');
const path = require('path');

// 解析 Markdown 文件：分离 frontmatter 和 body
function parseMarkdown(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const match = content.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)?$/);
  if (!match) throw new Error(`Invalid frontmatter in ${filePath}`);
  const frontmatter = parseYaml(match[1]);
  const body = (match[2] || '').trim();
  return { frontmatter, body, _raw: content };
}

// 简易 YAML 解析器（只支持标量、数组、字符串）
function parseYaml(yaml) {
  const result = {};
  const lines = yaml.split('\n');
  let key = null;
  for (const line of lines) {
    if (/^\s*-\s/.test(line)) {
      // 数组项
      const val = line.replace(/^\s*-\s*/, '').trim().replace(/^["']|["']$/g, '');
      if (key && Array.isArray(result[key])) {
        result[key].push(val);
      }
    } else if (/^[\w_]+:/.test(line)) {
      const colonIdx = line.indexOf(':');
      key = line.substring(0, colonIdx).trim();
      let val = line.substring(colonIdx + 1).trim();
      if (val === '') {
        result[key] = [];
      } else {
        // 去掉引号
        val = val.replace(/^["']|["']$/g, '');
        // 尝试转数字/布尔
        if (val === 'true') result[key] = true;
        else if (val === 'false') result[key] = false;
        else if (/^-?\d+(\.\d+)?$/.test(val)) result[key] = Number(val);
        else result[key] = val;
      }
    }
  }
  return result;
}

// 序列化 frontmatter 回 YAML
function serializeYaml(obj) {
  const lines = [];
  for (const [k, v] of Object.entries(obj)) {
    if (v === undefined || v === null) continue;
    if (Array.isArray(v)) {
      lines.push(`${k}:`);
      for (const item of v) {
        if (typeof item === 'string') lines.push(`  - "${item}"`);
        else lines.push(`  - ${item}`);
      }
    } else if (typeof v === 'string') {
      lines.push(`${k}: "${v}"`);
    } else {
      lines.push(`${k}: ${v}`);
    }
  }
  return lines.join('\n');
}

// 写入 Markdown 文件
function writeMarkdown(filePath, frontmatter, body) {
  const yaml = serializeYaml(frontmatter);
  const content = `---\n${yaml}\n---\n\n${body || ''}`.trimEnd() + '\n';
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(filePath, content, 'utf-8');
}

// 列出目录中所有文件
function listFiles(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir)
    .filter(f => f.endsWith('.md'))
    .map(f => path.join(dir, f));
}

// 读取目录中所有文件的 frontmatter
function readAll(dir) {
  return listFiles(dir).map(f => {
    const { frontmatter } = parseMarkdown(f);
    return frontmatter;
  });
}

// 获取下一个 ID 序号
function nextId(dir, prefix) {
  const files = listFiles(dir);
  if (files.length === 0) return `${prefix}001`;
  const nums = files.map(f => {
    const name = path.basename(f, '.md');
    const num = parseInt(name.replace(prefix, ''), 10);
    return isNaN(num) ? 0 : num;
  });
  const max = Math.max(...nums);
  return `${prefix}${String(max + 1).padStart(3, '0')}`;
}

module.exports = { parseMarkdown, parseYaml, serializeYaml, writeMarkdown, listFiles, readAll, nextId };
```

- [ ] **步骤 3：运行 Node.js 验证 files.js 语法**

```bash
node -e "const m = require('./.claude/skills/openpm/scripts/lib/files.js'); console.log('OK:', Object.keys(m))"
```
预期：`OK: [ 'parseMarkdown', 'parseYaml', ... ]`

- [ ] **步骤 4：实现 id.js — ID 生成**

文件 `scripts/lib/id.js`：

```javascript
const { listFiles } = require('./files');
const path = require('path');

function nextTaskId(openpmDir) {
  const files = listFiles(path.join(openpmDir, 'tasks'));
  const nums = files.map(f => {
    const name = path.basename(f, '.md');
    const num = parseInt(name.replace('task-', ''), 10);
    return isNaN(num) ? 0 : num;
  });
  const max = nums.length > 0 ? Math.max(...nums, 0) : 0;
  return `task-${String(max + 1).padStart(3, '0')}`;
}

function nextSprintId(openpmDir) {
  const files = listFiles(path.join(openpmDir, 'sprints'))
    .filter(f => !f.includes('-summary'));
  const nums = files.map(f => {
    const name = path.basename(f, '.md');
    return parseInt(name.replace('sprint-', ''), 10) || 0;
  });
  const max = nums.length > 0 ? Math.max(...nums) : 0;
  return `sprint-${max + 1}`;
}

function nextEpicId() {
  const id = 'epic-' + Math.random().toString(36).substring(2, 8);
  return id;
}

function nextMilestoneId(openpmDir) {
  const files = listFiles(path.join(openpmDir, 'milestones'));
  const nums = files.map(f => {
    const name = path.basename(f, '.md');
    return parseInt(name.replace('ms-', ''), 10) || 0;
  });
  const max = nums.length > 0 ? Math.max(...nums) : 0;
  return `ms-${max + 1}`;
}

module.exports = { nextTaskId, nextSprintId, nextEpicId, nextMilestoneId };
```

- [ ] **步骤 5：实现 config.js — .openpm/config.yaml 读写**

文件 `scripts/lib/config.js`：

```javascript
const fs = require('fs');
const path = require('path');
const { parseYaml, serializeYaml } = require('./files');

const DEFAULT_CONFIG = {
  project: 'Untitled Project',
  workflow: ['todo', 'in_progress', 'done'],
  created: new Date().toISOString().split('T')[0],
};

function readConfig(openpmDir) {
  const configPath = path.join(openpmDir, 'config.yaml');
  if (!fs.existsSync(configPath)) return { ...DEFAULT_CONFIG };
  const content = fs.readFileSync(configPath, 'utf-8');
  return parseYaml(content);
}

function writeConfig(openpmDir, config) {
  const configPath = path.join(openpmDir, 'config.yaml');
  const yaml = serializeYaml(config);
  fs.writeFileSync(configPath, yaml, 'utf-8');
}

function getOpenpmDir(cwd) {
  return path.join(cwd || process.cwd(), '.openpm');
}

module.exports = { readConfig, writeConfig, getOpenpmDir, DEFAULT_CONFIG };
```

- [ ] **步骤 6：运行 Node.js 验证所有 lib 模块**

```bash
node -e "
const files = require('./.claude/skills/openpm/scripts/lib/files.js');
const id = require('./.claude/skills/openpm/scripts/lib/id.js');
const config = require('./.claude/skills/openpm/scripts/lib/config.js');
console.log('files:', Object.keys(files).length, 'functions');
console.log('id:', Object.keys(id).length, 'functions');
console.log('config:', Object.keys(config).length, 'functions');
console.log('ALL OK');
"
```
预期：`ALL OK`

- [ ] **步骤 7：Commit**

```bash
git add .claude/skills/openpm/scripts/lib/
git commit -m "feat(openpm): add file system lib (files, id, config)"
```

---

### 任务 3：实现 init 命令

**文件：**
- 创建：`.claude/skills/openpm/scripts/commands/init.js`

- [ ] **步骤 1：实现 init.js**

文件 `scripts/commands/init.js`：

```javascript
const fs = require('fs');
const path = require('path');
const { writeConfig, getOpenpmDir } = require('../lib/config');

function initCommand(cwd) {
  const openpmDir = getOpenpmDir(cwd);

  if (fs.existsSync(openpmDir)) {
    return { ok: false, error: '.openpm/ already exists' };
  }

  // 创建目录结构
  const dirs = ['tasks', 'sprints', 'epics', 'milestones', 'logs'];
  for (const d of dirs) {
    fs.mkdirSync(path.join(openpmDir, d), { recursive: true });
  }

  // 写入配置文件
  writeConfig(openpmDir, {
    project: path.basename(cwd || process.cwd()),
    workflow: ['todo', 'in_progress', 'done'],
    created: new Date().toISOString().split('T')[0],
  });

  return { ok: true, path: openpmDir };
}

module.exports = initCommand;
```

- [ ] **步骤 2：手动测试 init 命令**

```bash
cd /tmp && rm -rf test-pm && mkdir test-pm && cd test-pm
node -e "
const init = require('d:/Cat/OpenPM/.claude/skills/openpm/scripts/commands/init.js');
console.log(JSON.stringify(init(process.cwd()), null, 2));
"
ls -la .openpm/
```
预期：创建 `.openpm/` 含 config.yaml 和 5 个子目录

- [ ] **步骤 3：Commit**

```bash
git add .claude/skills/openpm/scripts/commands/init.js
git commit -m "feat(openpm): add init command"
```

---

### 任务 4：实现 task 命令

**文件：**
- 创建：`.claude/skills/openpm/scripts/commands/task.js`

- [ ] **步骤 1：实现 task.js — create, list, show, update, delete**

文件 `scripts/commands/task.js`：

```javascript
const path = require('path');
const { parseMarkdown, writeMarkdown, listFiles, readAll } = require('../lib/files');
const { nextTaskId, getOpenpmDir } = require('../lib/id');
const { getOpenpmDir: getDir } = require('../lib/config');

function taskCommand(action, args, cwd) {
  const openpmDir = getDir(cwd);
  switch (action) {
    case 'create': return createTask(openpmDir, args);
    case 'list': return listTasks(openpmDir, args);
    case 'show': return showTask(openpmDir, args);
    case 'update': return updateTask(openpmDir, args);
    case 'delete': return deleteTask(openpmDir, args);
    default: return { ok: false, error: `Unknown task action: ${action}` };
  }
}

function createTask(openpmDir, args) {
  const tasksDir = path.join(openpmDir, 'tasks');
  const id = nextTaskId(path.join(openpmDir));
  const now = new Date().toISOString().split('T')[0];

  const frontmatter = {
    id, title: args.title || 'Untitled',
    status: args.status || 'todo',
    priority: args.priority || 'medium',
    type: args.type || 'task',
    created: now,
    updated: now,
  };
  if (args.sprint) frontmatter.sprint = args.sprint;
  if (args.epic) frontmatter.epic = args.epic;
  if (args['depends-on']) frontmatter.depends_on = args['depends-on'].split(',');
  if (args.ac) frontmatter.ac = args.ac.split(';');

  const body = args.description || '';
  writeMarkdown(path.join(tasksDir, `${id}.md`), frontmatter, body);
  return { ok: true, task: frontmatter };
}

function listTasks(openpmDir, args) {
  const tasksDir = path.join(openpmDir, 'tasks');
  let tasks = readAll(tasksDir);

  if (args.sprint) tasks = tasks.filter(t => t.sprint === args.sprint);
  if (args.epic) tasks = tasks.filter(t => t.epic === args.epic);
  if (args.status) tasks = tasks.filter(t => t.status === args.status);
  if (args.priority) tasks = tasks.filter(t => t.priority === args.priority);

  return { ok: true, tasks, count: tasks.length };
}

function showTask(openpmDir, args) {
  const filePath = path.join(openpmDir, 'tasks', `${args.id}.md`);
  try {
    const { frontmatter, body } = parseMarkdown(filePath);
    return { ok: true, task: { ...frontmatter, description: body } };
  } catch {
    return { ok: false, error: `Task not found: ${args.id}` };
  }
}

function updateTask(openpmDir, args) {
  const filePath = path.join(openpmDir, 'tasks', `${args.id}.md`);
  try {
    const { frontmatter, body } = parseMarkdown(filePath);
    const updatable = ['title', 'status', 'priority', 'type', 'sprint', 'epic'];
    for (const key of updatable) {
      if (args[key] !== undefined) frontmatter[key] = args[key];
    }
    if (args['depends-on'] !== undefined) {
      frontmatter.depends_on = args['depends-on'] ? args['depends-on'].split(',') : [];
    }
    if (args.ac !== undefined) {
      frontmatter.ac = args.ac ? args.ac.split(';') : [];
    }
    frontmatter.updated = new Date().toISOString().split('T')[0];
    writeMarkdown(filePath, frontmatter, body);
    return { ok: true, task: frontmatter };
  } catch {
    return { ok: false, error: `Task not found: ${args.id}` };
  }
}

function deleteTask(openpmDir, args) {
  const fs = require('fs');
  const filePath = path.join(openpmDir, 'tasks', `${args.id}.md`);
  try {
    fs.unlinkSync(filePath);
    return { ok: true, deleted: args.id };
  } catch {
    return { ok: false, error: `Task not found: ${args.id}` };
  }
}

module.exports = taskCommand;
```

- [ ] **步骤 2：手动测试 task create 和 task list**

```bash
cd /tmp/test-pm
node -e "
const task = require('d:/Cat/OpenPM/.claude/skills/openpm/scripts/commands/task.js');
const r1 = task('create', {title:'测试登录', status:'todo', priority:'high', type:'story'}, process.cwd());
console.log('CREATE:', JSON.stringify(r1, null, 2));
const r2 = task('list', {}, process.cwd());
console.log('LIST:', JSON.stringify(r2, null, 2));
"
```
预期：创建成功，列表包含 1 个任务

- [ ] **步骤 3：手动测试 task show 和 task update**

```bash
cd /tmp/test-pm
node -e "
const task = require('d:/Cat/OpenPM/.claude/skills/openpm/scripts/commands/task.js');
const r = task('update', {id:'task-001', status:'done'}, process.cwd());
console.log('UPDATE:', JSON.stringify(r, null, 2));
const s = task('show', {id:'task-001'}, process.cwd());
console.log('SHOW:', JSON.stringify(s, null, 2));
"
```
预期：状态改为 done

- [ ] **步骤 4：Commit**

```bash
git add .claude/skills/openpm/scripts/commands/task.js
git commit -m "feat(openpm): add task CRUD commands"
```

---

### 任务 5：实现 sprint / epic / milestone 命令

**文件：**
- 创建：`.claude/skills/openpm/scripts/commands/sprint.js`
- 创建：`.claude/skills/openpm/scripts/commands/epic.js`
- 创建：`.claude/skills/openpm/scripts/commands/milestone.js`

- [ ] **步骤 1：实现 sprint.js**

文件 `scripts/commands/sprint.js`：

```javascript
const path = require('path');
const fs = require('fs');
const { parseMarkdown, writeMarkdown, readAll, listFiles } = require('../lib/files');
const { nextSprintId } = require('../lib/id');
const { getOpenpmDir } = require('../lib/config');

function sprintCommand(action, args, cwd) {
  const openpmDir = getOpenpmDir(cwd);
  const sprintsDir = path.join(openpmDir, 'sprints');

  switch (action) {
    case 'create': {
      const id = nextSprintId(openpmDir);
      const fm = {
        id, name: args.name || 'Untitled Sprint',
        goal: args.goal || '',
        status: 'plan',
        start_date: args.start || '',
        end_date: args.end || ''
      };
      writeMarkdown(path.join(sprintsDir, `${id}.md`), fm, '');
      return { ok: true, sprint: fm };
    }
    case 'start': {
      const fp = path.join(sprintsDir, `${args.id}.md`);
      const { frontmatter, body } = parseMarkdown(fp);
      frontmatter.status = 'active';
      writeMarkdown(fp, frontmatter, body);
      return { ok: true, sprint: frontmatter };
    }
    case 'close': {
      const fp = path.join(sprintsDir, `${args.id}.md`);
      const { frontmatter, body } = parseMarkdown(fp);
      if (frontmatter.status === 'done') return { ok: false, error: 'Sprint already closed' };
      frontmatter.status = 'done';
      writeMarkdown(fp, frontmatter, body);
      // 自动生成 summary
      const tasksDir = path.join(openpmDir, 'tasks');
      const tasks = readAll(tasksDir).filter(t => t.sprint === args.id);
      const completed = tasks.filter(t => t.status === 'done').length;
      const summary = {
        sprint: args.id,
        completed,
        total: tasks.length,
      };
      writeMarkdown(
        path.join(sprintsDir, `${args.id}-summary.md`),
        summary,
        `## 完成事项\n${tasks.filter(t => t.status === 'done').map(t => `- ${t.title} ✅`).join('\n')}\n\n## 未完成\n${tasks.filter(t => t.status !== 'done').map(t => `- ${t.title}`).join('\n')}\n`
      );
      // 未完成任务移到下一个 sprint
      const nextFiles = listFiles(sprintsDir).filter(f => f.includes('sprint-') && !f.includes('summary'));
      const nextIds = nextFiles.map(f => {
        const name = path.basename(f, '.md');
        return parseInt(name.replace('sprint-', ''), 10) || 0;
      });
      const nextNum = Math.max(...nextIds, parseInt(args.id.replace('sprint-', ''), 10));
      const nextSprintId = `sprint-${nextNum}`;
      for (const t of tasks.filter(t => t.status !== 'done')) {
        const tfp = path.join(tasksDir, `${t.id}.md`);
        const { frontmatter: tfm, body: tb } = parseMarkdown(tfp);
        if (nextFiles.some(f => f.includes(nextSprintId))) {
          tfm.sprint = nextSprintId;
          writeMarkdown(tfp, tfm, tb);
        }
      }
      return { ok: true, sprint: frontmatter, summary };
    }
    case 'list': {
      const sprints = listFiles(sprintsDir)
        .filter(f => !f.includes('-summary'))
        .map(f => parseMarkdown(f).frontmatter);
      return { ok: true, sprints };
    }
    default: return { ok: false, error: `Unknown sprint action: ${action}` };
  }
}

module.exports = sprintCommand;
```

- [ ] **步骤 2：实现 epic.js**

文件 `scripts/commands/epic.js`：

```javascript
const path = require('path');
const { parseMarkdown, writeMarkdown, readAll, listFiles } = require('../lib/files');
const { nextEpicId } = require('../lib/id');
const { getOpenpmDir } = require('../lib/config');

function epicCommand(action, args, cwd) {
  const openpmDir = getOpenpmDir(cwd);
  const epicsDir = path.join(openpmDir, 'epics');

  switch (action) {
    case 'create': {
      const id = nextEpicId();
      const fm = { id, title: args.title || 'Untitled Epic', status: 'todo' };
      writeMarkdown(path.join(epicsDir, `${id}.md`), fm, '');
      return { ok: true, epic: fm };
    }
    case 'list': {
      const epics = readAll(epicsDir);
      return { ok: true, epics };
    }
    case 'show': {
      const fp = path.join(epicsDir, `${args.id}.md`);
      const { frontmatter, body } = parseMarkdown(fp);
      const tasks = readAll(path.join(openpmDir, 'tasks'))
        .filter(t => t.epic === args.id);
      return { ok: true, epic: { ...frontmatter, description: body, tasks } };
    }
    default: return { ok: false, error: `Unknown epic action: ${action}` };
  }
}

module.exports = epicCommand;
```

- [ ] **步骤 3：实现 milestone.js**

文件 `scripts/commands/milestone.js`：

```javascript
const path = require('path');
const { writeMarkdown, readAll } = require('../lib/files');
const { nextMilestoneId } = require('../lib/id');
const { getOpenpmDir } = require('../lib/config');

function milestoneCommand(action, args, cwd) {
  const openpmDir = getOpenpmDir(cwd);
  const msDir = path.join(openpmDir, 'milestones');

  switch (action) {
    case 'create': {
      const id = nextMilestoneId(openpmDir);
      const fm = {
        id, name: args.name || 'Untitled Milestone',
        target_date: args.date || '',
        status: 'upcoming'
      };
      writeMarkdown(path.join(msDir, `${id}.md`), fm, '');
      return { ok: true, milestone: fm };
    }
    case 'list': {
      const milestones = readAll(msDir);
      return { ok: true, milestones };
    }
    default: return { ok: false, error: `Unknown milestone action: ${action}` };
  }
}

module.exports = milestoneCommand;
```

- [ ] **步骤 4：手动测试 sprint create, start, close**

```bash
cd /tmp/test-pm
node -e "
const sprint = require('d:/Cat/OpenPM/.claude/skills/openpm/scripts/commands/sprint.js');
console.log('CREATE:', JSON.stringify(sprint('create', {name:'Sprint 1', goal:'MVP'}, process.cwd())));
console.log('START:', JSON.stringify(sprint('start', {id:'sprint-1'}, process.cwd())));
console.log('LIST:', JSON.stringify(sprint('list', {}, process.cwd())));
"
```

- [ ] **步骤 5：Commit**

```bash
git add .claude/skills/openpm/scripts/commands/sprint.js .claude/skills/openpm/scripts/commands/epic.js .claude/skills/openpm/scripts/commands/milestone.js
git commit -m "feat(openpm): add sprint, epic, milestone commands"
```

---

### 任务 6：实现 log 和 summary 命令

**文件：**
- 创建：`.claude/skills/openpm/scripts/commands/log.js`
- 创建：`.claude/skills/openpm/scripts/commands/summary.js`

- [ ] **步骤 1：实现 log.js**

文件 `scripts/commands/log.js`：

```javascript
const path = require('path');
const { parseMarkdown, writeMarkdown, listFiles } = require('../lib/files');
const { getOpenpmDir } = require('../lib/config');

function logCommand(action, args, cwd) {
  const openpmDir = getOpenpmDir(cwd);
  const logsDir = path.join(openpmDir, 'logs');

  if (action === 'today') {
    const today = new Date().toISOString().split('T')[0];
    const filePath = path.join(logsDir, `${today}.md`);

    if (args.summary) {
      // 写入模式
      let existing = { frontmatter: { date: today, tasks: [] }, body: '' };
      try { existing = parseMarkdown(filePath); } catch {}
      const tasks = args.tasks ? args.tasks.split(',') : existing.frontmatter.tasks || [];
      const body = `## 今日摘要\n${args.summary}\n\n## 阻塞项\n${args.blockers || '无'}`;
      writeMarkdown(filePath, { date: today, tasks }, body);
      return { ok: true, log: { date: today, tasks, summary: args.summary } };
    } else {
      // 读取模式
      try {
        const { frontmatter, body } = parseMarkdown(filePath);
        return { ok: true, log: { ...frontmatter, body } };
      } catch {
        return { ok: true, log: { date: today, tasks: [], body: '' }, empty: true };
      }
    }
  }

  if (action === 'list') {
    const logs = listFiles(logsDir)
      .map(f => parseMarkdown(f).frontmatter)
      .sort((a, b) => b.date.localeCompare(a.date));
    return { ok: true, logs };
  }

  return { ok: false, error: `Unknown log action: ${action}` };
}

module.exports = logCommand;
```

- [ ] **步骤 2：实现 summary.js**

文件 `scripts/commands/summary.js`：

```javascript
const path = require('path');
const { parseMarkdown } = require('../lib/files');
const { getOpenpmDir } = require('../lib/config');

function summaryCommand(args, cwd) {
  const openpmDir = getOpenpmDir(cwd);
  const sprintsDir = path.join(openpmDir, 'sprints');
  const summaryPath = path.join(sprintsDir, `${args.sprint}-summary.md`);

  try {
    const { frontmatter, body } = parseMarkdown(summaryPath);
    return { ok: true, summary: { ...frontmatter, details: body } };
  } catch {
    return { ok: false, error: `Summary not found for ${args.sprint}. Run 'openpm sprint close' first.` };
  }
}

module.exports = summaryCommand;
```

- [ ] **步骤 3：手动测试日志写入和读取**

```bash
cd /tmp/test-pm
node -e "
const log = require('d:/Cat/OpenPM/.claude/skills/openpm/scripts/commands/log.js');
console.log('WRITE:', JSON.stringify(log('today', {summary:'完成了登录', tasks:'task-001:implemented'}, process.cwd())));
console.log('READ:', JSON.stringify(log('today', {}, process.cwd())));
"
```

- [ ] **步骤 4：Commit**

```bash
git add .claude/skills/openpm/scripts/commands/log.js .claude/skills/openpm/scripts/commands/summary.js
git commit -m "feat(openpm): add log and summary commands"
```

---

### 任务 7：实现 CLI 入口 (cli.js)

**文件：**
- 创建：`.claude/skills/openpm/scripts/cli.js`

- [ ] **步骤 1：实现 cli.js — 参数解析 + 命令路由**

文件 `scripts/cli.js`：

```javascript
#!/usr/bin/env node
const initCommand = require('./commands/init');
const taskCommand = require('./commands/task');
const sprintCommand = require('./commands/sprint');
const epicCommand = require('./commands/epic');
const milestoneCommand = require('./commands/milestone');
const logCommand = require('./commands/log');
const summaryCommand = require('./commands/summary');

function parseArgs(argv) {
  const args = { _: [] };
  for (let i = 2; i < argv.length; i++) {
    const arg = argv[i];
    if (arg.startsWith('--')) {
      const key = arg.slice(2);
      const next = argv[i + 1];
      if (next && !next.startsWith('--')) {
        args[key] = next;
        i++;
      } else {
        args[key] = true;
      }
    } else {
      args._.push(arg);
    }
  }
  return args;
}

function main() {
  const args = parseArgs(process.argv);
  const entity = args._[0];
  const action = args._[1];
  const cwd = process.cwd();
  const format = args.format || 'json';

  let result;
  try {
    switch (entity) {
      case 'init':
        result = initCommand(cwd);
        break;
      case 'task':
        result = taskCommand(action, args, cwd);
        break;
      case 'sprint':
        result = sprintCommand(action, args, cwd);
        break;
      case 'epic':
        result = epicCommand(action, args, cwd);
        break;
      case 'milestone':
        result = milestoneCommand(action, args, cwd);
        break;
      case 'log':
        result = logCommand(action, args, cwd);
        break;
      case 'summary':
        result = summaryCommand(args, cwd);
        break;
      case 'web':
        const server = require('./web/server');
        return server.start(args.port || 3000, cwd);
      default:
        result = { ok: false, error: `Unknown entity: ${entity}. Use: task, sprint, epic, milestone, log, summary, web, init` };
    }
  } catch (err) {
    result = { ok: false, error: err.message };
  }

  if (format === 'markdown') {
    console.log(formatMarkdown(result));
  } else {
    console.log(JSON.stringify(result, null, 2));
  }
  process.exit(result.ok ? 0 : 1);
}

function formatMarkdown(result) {
  if (!result.ok) return `❌ **Error:** ${result.error}`;
  // 简化 Markdown 格式化
  let md = '';
  for (const [key, value] of Object.entries(result)) {
    if (key === 'ok') continue;
    if (Array.isArray(value)) {
      md += `## ${key} (${value.length})\n`;
      for (const item of value) {
        md += `- **${item.id || item.name || item.date}**: ${item.title || item.goal || ''}\n`;
      }
    } else if (typeof value === 'object' && value !== null) {
      md += `## ${key}\n`;
      for (const [k, v] of Object.entries(value)) {
        if (typeof v !== 'object') md += `- **${k}**: ${v}\n`;
      }
    }
  }
  return md || 'OK';
}

main();
```

- [ ] **步骤 2：创建 package.json（可选，便于 npx 使用）**

文件 `.claude/skills/openpm/package.json`：

```json
{
  "name": "openpm",
  "version": "1.0.0",
  "description": "AI-native agile project management CLI + Web dashboard",
  "main": "scripts/cli.js",
  "bin": {
    "openpm": "./scripts/cli.js"
  },
  "private": true
}
```

- [ ] **步骤 3：端到端测试 CLI**

```bash
cd /tmp && rm -rf e2e-test && mkdir e2e-test && cd e2e-test
node d:/Cat/OpenPM/.claude/skills/openpm/scripts/cli.js init
node d:/Cat/OpenPM/.claude/skills/openpm/scripts/cli.js task create --title "E2E 测试任务" --priority high
node d:/Cat/OpenPM/.claude/skills/openpm/scripts/cli.js task list
node d:/Cat/OpenPM/.claude/skills/openpm/scripts/cli.js sprint create --name "E2E Sprint" --goal "验证完整流程"
node d:/Cat/OpenPM/.claude/skills/openpm/scripts/cli.js sprint start --id sprint-1
node d:/Cat/OpenPM/.claude/skills/openpm/scripts/cli.js task update task-001 --status done
node d:/Cat/OpenPM/.claude/skills/openpm/scripts/cli.js sprint close --id sprint-1
ls -la .openpm/tasks/ .openpm/sprints/
```
预期：所有命令返回 `"ok": true`，文件正确创建和更新

- [ ] **步骤 4：Commit**

```bash
git add .claude/skills/openpm/scripts/cli.js .claude/skills/openpm/package.json
git commit -m "feat(openpm): add CLI entry point with argument parsing"
```

---

### 任务 8：实现 Web API 和 HTTP 服务

**文件：**
- 创建：`.claude/skills/openpm/scripts/web/api.js`
- 创建：`.claude/skills/openpm/scripts/web/server.js`

- [ ] **步骤 1：实现 api.js — REST API 路由**

文件 `scripts/web/api.js`：

```javascript
const taskCommand = require('../commands/task');
const sprintCommand = require('../commands/sprint');
const epicCommand = require('../commands/epic');
const milestoneCommand = require('../commands/milestone');
const logCommand = require('../commands/log');
const summaryCommand = require('../commands/summary');

function handleApi(pathname, cwd) {
  // GET /api/tasks?sprint=xxx&status=xxx
  if (pathname === '/api/tasks') return (params) => {
    const args = {};
    if (params.get('sprint')) args.sprint = params.get('sprint');
    if (params.get('epic')) args.epic = params.get('epic');
    if (params.get('status')) args.status = params.get('status');
    return taskCommand('list', args, cwd);
  };

  // GET /api/tasks/:id
  if (pathname.startsWith('/api/tasks/')) return (params, pathname) => {
    const id = pathname.split('/').pop();
    return taskCommand('show', { id }, cwd);
  };

  // GET /api/sprints
  if (pathname === '/api/sprints') return () => sprintCommand('list', {}, cwd);

  // GET /api/sprints/:id/summary
  if (pathname.match(/^\/api\/sprints\/[^/]+\/summary$/)) return (params, pathname) => {
    const sprint = pathname.split('/')[3];
    return summaryCommand({ sprint }, cwd);
  };

  // GET /api/epics
  if (pathname === '/api/epics') return () => epicCommand('list', {}, cwd);

  // GET /api/epics/:id
  if (pathname.startsWith('/api/epics/')) return (params, pathname) => {
    const id = pathname.split('/').pop();
    return epicCommand('show', { id }, cwd);
  };

  // GET /api/milestones
  if (pathname === '/api/milestones') return () => milestoneCommand('list', {}, cwd);

  // GET /api/logs
  if (pathname === '/api/logs') return () => logCommand('list', {}, cwd);

  // GET /api/logs/today
  if (pathname === '/api/logs/today') return () => logCommand('today', {}, cwd);

  // GET /api/stats (aggregated stats)
  if (pathname === '/api/stats') return () => {
    const tasks = taskCommand('list', {}, cwd);
    const sprints = sprintCommand('list', {}, cwd);
    return {
      ok: true,
      totalTasks: tasks.tasks?.length || 0,
      completedTasks: tasks.tasks?.filter(t => t.status === 'done').length || 0,
      inProgressTasks: tasks.tasks?.filter(t => t.status === 'in_progress').length || 0,
      activeSprint: sprints.sprints?.find(s => s.status === 'active') || null,
    };
  };

  return null;
}

module.exports = { handleApi };
```

- [ ] **步骤 2：实现 server.js — HTTP 服务**

文件 `scripts/web/server.js`：

```javascript
const http = require('http');
const fs = require('fs');
const path = require('path');
const { handleApi } = require('./api');

function start(port, cwd) {
  const webUiDir = path.join(__dirname, '..', 'web-ui');

  const mimeTypes = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'application/javascript',
    '.css': 'text/css',
    '.svg': 'image/svg+xml',
  };

  const server = http.createServer((req, res) => {
    const url = new URL(req.url, `http://localhost:${port}`);
    const pathname = url.pathname;

    // API 路由
    if (pathname.startsWith('/api/')) {
      const handler = handleApi(pathname, cwd);
      if (handler) {
        const result = handler(url.searchParams, pathname);
        res.writeHead(result.ok ? 200 : 404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(result));
        return;
      }
      res.writeHead(404);
      res.end(JSON.stringify({ error: 'API not found' }));
      return;
    }

    // 静态文件
    let filePath = pathname === '/' ? '/index.html' : pathname;
    filePath = path.join(webUiDir, filePath);

    const ext = path.extname(filePath);
    const contentType = mimeTypes[ext] || 'text/plain';

    try {
      const content = fs.readFileSync(filePath);
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content);
    } catch {
      // SPA fallback
      try {
        const indexContent = fs.readFileSync(path.join(webUiDir, 'index.html'));
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(indexContent);
      } catch {
        res.writeHead(404);
        res.end('Not Found');
      }
    }
  });

  server.listen(port, () => {
    console.log(JSON.stringify({
      ok: true,
      url: `http://localhost:${port}`,
      message: 'OpenPM dashboard running',
    }));
  });
}

module.exports = { start };
```

- [ ] **步骤 3：测试 Web 服务启动**

```bash
cd /tmp/test-pm
node -e "
const server = require('d:/Cat/OpenPM/.claude/skills/openpm/scripts/web/server.js');
server.start(3099, process.cwd());
" &
sleep 1
curl -s http://localhost:3099/api/tasks | head -c 200
curl -s http://localhost:3099/api/stats
kill %1 2>/dev/null
```
预期：返回 JSON 数据

- [ ] **步骤 4：Commit**

```bash
git add .claude/skills/openpm/scripts/web/
git commit -m "feat(openpm): add web API and HTTP server"
```

---

### 任务 9：实现 Web UI — 全局框架 (SPA shell)

**文件：**
- 创建：`.claude/skills/openpm/scripts/web-ui/index.html`
- 创建：`.claude/skills/openpm/scripts/web-ui/app.js`
- 创建：`.claude/skills/openpm/scripts/web-ui/style.css`

- [ ] **步骤 1：实现 style.css — 设计系统**

文件 `scripts/web-ui/style.css`：

```css
:root {
  --bg: #fafaf9; --surface: #ffffff; --hover: #f3f4f6;
  --border: #e5e7eb; --border-light: #f0f0ee;
  --primary: #2563eb; --primary-bg: #eff6ff;
  --success: #16a34a; --success-bg: #f0fdf4;
  --warning: #d97706; --warning-bg: #fffbeb;
  --danger: #dc2626; --purple: #7c3aed;
  --text: #1f2937; --text-secondary: #6b7280; --text-muted: #9ca3af;
  --sidebar-w: 160px; --radius: 6px;
}
* { margin: 0; padding: 0; box-sizing: border-box; }
body {
  font-family: system-ui, -apple-system, 'Segoe UI', sans-serif;
  background: var(--bg); color: var(--text);
  display: flex; height: 100vh; overflow: hidden;
  font-size: 13px; line-height: 1.5;
}
.sidebar {
  width: var(--sidebar-w); background: var(--surface);
  border-right: 1px solid var(--border);
  display: flex; flex-direction: column; padding: 16px 12px; flex-shrink: 0;
}
.sidebar-logo { font-size: 15px; font-weight: 700; padding: 0 8px; margin-bottom: 24px; }
.sidebar-nav { display: flex; flex-direction: column; gap: 2px; flex: 1; }
.sidebar-nav a {
  display: flex; align-items: center; gap: 8px; padding: 7px 8px;
  border-radius: var(--radius); color: var(--text-secondary);
  text-decoration: none; font-size: 12.5px; transition: all 0.12s;
}
.sidebar-nav a:hover { background: var(--hover); color: var(--text); }
.sidebar-nav a.active { background: var(--primary-bg); color: var(--primary); font-weight: 500; }
.sidebar-footer {
  border-top: 1px solid var(--border); padding-top: 12px;
  font-size: 11px; display: flex; align-items: center; gap: 8px;
}
.sidebar-ai {
  width: 8px; height: 8px; border-radius: 50%; background: var(--primary);
  animation: ai-pulse 2s ease-in-out infinite; flex-shrink: 0;
}
@keyframes ai-pulse { 0%,100%{transform:scale(1)} 50%{transform:scale(1.5)} }
.main { flex: 1; display: flex; flex-direction: column; overflow: hidden; }
.header {
  background: var(--surface); border-bottom: 1px solid var(--border);
  padding: 0 24px; height: 44px; display: flex; align-items: center; flex-shrink: 0;
}
.content { flex: 1; overflow-y: auto; }
```

- [ ] **步骤 2：实现 index.html — SPA shell**

文件 `scripts/web-ui/index.html`：

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>OpenPM</title>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.css">
<link rel="stylesheet" href="style.css">
</head>
<body>
<nav class="sidebar">
  <div class="sidebar-logo">OpenPM</div>
  <div class="sidebar-nav">
    <a href="#kanban" data-page="kanban"><i class="bi bi-columns-gap"></i> 看板</a>
    <a href="#sprint" data-page="sprint"><i class="bi bi-graph-up"></i> Sprint</a>
    <a href="#epic-tree" data-page="epic-tree"><i class="bi bi-diagram-3"></i> Epic 树</a>
    <a href="#timeline" data-page="timeline"><i class="bi bi-calendar-week"></i> 时间线</a>
    <a href="#worklog" data-page="worklog"><i class="bi bi-journal-text"></i> 工作日志</a>
  </div>
  <div class="sidebar-footer">
    <div class="sidebar-ai" id="ai-indicator" title="AI 状态"></div>
    <span id="ai-status-text">检测中...</span>
  </div>
</nav>
<div class="main">
  <header class="header" id="page-header"></header>
  <div class="content" id="page-content"></div>
</div>
<script src="app.js"></script>
</body>
</html>
```

- [ ] **步骤 3：实现 app.js — SPA 路由 + 数据获取**

文件 `scripts/web-ui/app.js`：

```javascript
const pages = {
  kanban: { title: '📋 看板', file: 'kanban.html' },
  sprint: { title: '📊 Sprint', file: 'sprint.html' },
  'epic-tree': { title: '🌳 Epic 树', file: 'epic-tree.html' },
  timeline: { title: '📅 时间线', file: 'timeline.html' },
  worklog: { title: '📝 工作日志', file: 'worklog.html' },
};

let currentPage = 'kanban';

async function navigate(page) {
  if (!pages[page]) return;

  currentPage = page;

  // 更新导航
  document.querySelectorAll('.sidebar-nav a').forEach(a => {
    a.classList.toggle('active', a.dataset.page === page);
  });

  // 更新标题
  document.getElementById('page-header').innerHTML = `<h1 style="font-size:14px;font-weight:600">${pages[page].title}</h1>`;

  // 加载页面内容
  try {
    const resp = await fetch(pages[page].file);
    const html = await resp.text();
    document.getElementById('page-content').innerHTML = html;
    // 触发页面初始化
    if (typeof initPage === 'function') initPage(page);
  } catch (err) {
    document.getElementById('page-content').innerHTML = `<p style="padding:24px;color:var(--text-muted)">加载失败: ${err.message}</p>`;
  }
}

// API 辅助函数
async function api(path) {
  const resp = await fetch(`/api/${path}`);
  return resp.json();
}

// 哈希路由
window.addEventListener('hashchange', () => {
  const page = location.hash.slice(1) || 'kanban';
  navigate(page);
});

// AI 状态检测
function updateAiStatus() {
  const dot = document.getElementById('ai-indicator');
  const text = document.getElementById('ai-status-text');
  api('stats').then(data => {
    if (data.ok) {
      dot.style.background = 'var(--success)';
      dot.style.animation = 'none';
      text.textContent = 'AI 在线';
    }
  }).catch(() => {
    dot.style.background = 'var(--text-muted)';
    dot.style.animation = 'none';
    text.textContent = '离线';
  });
}

// 启动
const initialPage = location.hash.slice(1) || 'kanban';
navigate(initialPage);
updateAiStatus();
setInterval(updateAiStatus, 30000);

// 定时刷新数据
setInterval(() => {
  if (typeof refreshPage === 'function') refreshPage();
}, 30000);
```

- [ ] **步骤 4：Commit**

```bash
git add .claude/skills/openpm/scripts/web-ui/index.html .claude/skills/openpm/scripts/web-ui/app.js .claude/skills/openpm/scripts/web-ui/style.css
git commit -m "feat(openpm): add web UI SPA shell with routing"
```

---

### 任务 10：实现 Web UI — 5 个页面

**文件：**
- 创建：`.claude/skills/openpm/scripts/web-ui/kanban.html`
- 创建：`.claude/skills/openpm/scripts/web-ui/sprint.html`
- 创建：`.claude/skills/openpm/scripts/web-ui/epic-tree.html`
- 创建：`.claude/skills/openpm/scripts/web-ui/timeline.html`
- 创建：`.claude/skills/openpm/scripts/web-ui/worklog.html`

- [ ] **步骤 1：实现 kanban.html — 看板页**

从视觉伴侣原型 `d:\Cat\OpenPM\.superpowers\brainstorm\958-1782830465\content\kanban.html` 移植，抽取页面内容部分（不含 sidebar/header/html boilerplate）。关键改动：数据改为从 API 动态加载。

文件 `scripts/web-ui/kanban.html`：

```html
<style>
  .board { display: flex; gap: 0; overflow-x: auto; padding: 16px 20px; height: 100%; }
  .column { flex: 1; min-width: 300px; max-width: 420px; display: flex; flex-direction: column; background: var(--surface); border: 1px solid var(--border); border-radius: 8px; margin-right: 12px; }
  .column:last-child { margin-right: 0; }
  .column-header { padding: 12px 14px; border-bottom: 1px solid var(--border); display: flex; align-items: center; gap: 8px; flex-shrink: 0; }
  .dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
  .dot.todo { background: #9ca3af; } .dot.in-progress { background: var(--primary); } .dot.done { background: var(--success); }
  .column-header h2 { font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; color: var(--text-secondary); }
  .count { font-size: 11px; color: var(--text-muted); margin-left: auto; background: var(--hover); padding: 1px 7px; border-radius: 8px; font-weight: 500; }
  .column-body { flex: 1; overflow-y: auto; padding: 8px 10px; display: flex; flex-direction: column; gap: 6px; }
  .card { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); padding: 10px 12px; cursor: default; transition: box-shadow 0.12s; }
  .card:hover { border-color: #c7c9cc; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
  .card.done { opacity: 0.55; }
  .card.done .card-title { text-decoration: line-through; text-decoration-color: var(--text-muted); }
  .card-id { font-family: 'SF Mono','Fira Code',monospace; font-size: 10px; color: var(--text-muted); }
  .card-title { font-size: 13px; font-weight: 500; margin: 4px 0 6px; line-height: 1.4; }
  .card-meta { display: flex; gap: 6px; flex-wrap: wrap; }
  .tag { font-size: 10px; padding: 1px 6px; border-radius: 3px; font-weight: 500; }
  .tag.epic { background: #f3e8ff; color: var(--purple); }
  .tag.story { background: #e0f2fe; color: #0284c7; }
  .tag.task { background: var(--hover); color: var(--text-secondary); }
  .tag.bug { background: #fef2f2; color: var(--danger); }
  .tag.high { background: #fef2f2; color: var(--danger); }
  .tag.medium { background: var(--warning-bg); color: var(--warning); }
  .tag.low { background: var(--hover); color: var(--text-muted); }
  .card-ac { margin-top: 8px; padding-top: 6px; border-top: 1px solid var(--border-light); }
  .card-ac-label { font-size: 9px; color: var(--text-muted); font-weight: 600; text-transform: uppercase; letter-spacing: 0.3px; margin-bottom: 3px; }
  .card-ac-item { font-size: 11px; color: var(--text-secondary); padding-left: 14px; position: relative; line-height: 1.5; }
  .card-ac-item::before { content:'✓'; position:absolute; left:0; font-size:10px; font-weight:700; color:var(--success); }
  .card-ac-item.pending::before { content:'○'; color:var(--text-muted); font-weight:400; }
  .card-depends { font-size: 10px; color: var(--text-muted); float: right; }
</style>

<div class="board" id="kanban-board">
  <div class="column"><div class="column-header"><span class="dot todo"></span><h2>待办</h2><span class="count" id="todo-count">-</span></div><div class="column-body" id="todo-col"></div></div>
  <div class="column"><div class="column-header"><span class="dot in-progress"></span><h2>进行中</h2><span class="count" id="progress-count">-</span></div><div class="column-body" id="progress-col"></div></div>
  <div class="column"><div class="column-header"><span class="dot done"></span><h2>已完成</h2><span class="count" id="done-count">-</span></div><div class="column-body" id="done-col"></div></div>
</div>

<script>
function renderCard(t) {
  const acHtml = t.ac && t.ac.length ? `
    <div class="card-ac">
      <div class="card-ac-label">验收标准</div>
      ${t.ac.map(a => `<div class="card-ac-item ${t.status === 'done' ? '' : 'pending'}">${a}</div>`).join('')}
    </div>` : '';
  const depHtml = t.depends_on && t.depends_on.length ? `<span class="card-depends">🔗 ${t.depends_on.join(', ')}</span>` : '';
  return `
    <div class="card ${t.status === 'done' ? 'done' : ''}">
      <div class="card-id">${t.id}${depHtml}</div>
      <div class="card-title">${t.title}</div>
      <div class="card-meta">
        ${t.epic ? `<span class="tag epic">${t.epic}</span>` : ''}
        <span class="tag ${t.type || 'task'}">${t.type || 'task'}</span>
        <span class="tag ${t.priority || 'medium'}">${t.priority || '中'}</span>
      </div>
      ${acHtml}
    </div>`;
}

async function loadKanban() {
  const stats = await api('stats');
  const tasksResp = await api('tasks');
  const tasks = tasksResp.tasks || [];
  const cols = { todo: [], 'in_progress': [], done: [] };
  tasks.forEach(t => { if (cols[t.status]) cols[t.status].push(t); });
  document.getElementById('todo-col').innerHTML = cols.todo.map(renderCard).join('') || '<div class="column-body" style="align-items:center;justify-content:center;color:var(--text-muted)">暂无任务</div>';
  document.getElementById('progress-col').innerHTML = cols.in_progress.map(renderCard).join('') || '<div class="column-body" style="align-items:center;justify-content:center;color:var(--text-muted)">暂无任务</div>';
  document.getElementById('done-col').innerHTML = cols.done.map(renderCard).join('') || '<div class="column-body" style="align-items:center;justify-content:center;color:var(--text-muted)">暂无任务</div>';
  document.getElementById('todo-count').textContent = cols.todo.length;
  document.getElementById('progress-count').textContent = cols.in_progress.length;
  document.getElementById('done-count').textContent = cols.done.length;
}

initPage = function(page) { if (page === 'kanban') loadKanban(); };
refreshPage = function() { if (currentPage === 'kanban') loadKanban(); };
</script>
```

- [ ] **步骤 2-5：实现其余 4 个页面**

同理，从视觉伴侣原型中移植 sprint.html、epic-tree.html、timeline.html、worklog.html，抽取内容部分，添加 `initPage`/`refreshPage` 钩子和动态数据加载逻辑。

（完整页面代码见视觉伴侣原型文件：
- `d:\Cat\OpenPM\.superpowers\brainstorm\958-1782830465\content\sprint.html`
- `d:\Cat\OpenPM\.superpowers\brainstorm\958-1782830465\content\epic-tree.html`
- `d:\Cat\OpenPM\.superpowers\brainstorm\958-1782830465\content\timeline.html`
- `d:\Cat\OpenPM\.superpowers\brainstorm\958-1782830465\content\worklog.html`
）

每个页面当前静态数据替换为 `api()` 调用。完成后 commit。

- [ ] **步骤 6：Commit**

```bash
git add .claude/skills/openpm/scripts/web-ui/
git commit -m "feat(openpm): add all 5 web dashboard pages"
```

---

### 任务 11：编写 SKILL.md

**文件：**
- 创建：`.claude/skills/openpm/SKILL.md`

- [ ] **步骤 1：使用 writing-skills 技能编写**

执行 writing-skills 流程，根据 `docs/superpowers/specs/2026-06-30-openpm-skill-content.md` 的内容创建正式的 SKILL.md 文件。

- [ ] **步骤 2：Commit**

```bash
git add .claude/skills/openpm/SKILL.md
git commit -m "feat(openpm): add SKILL.md"
```

---

### 任务 12：端到端集成测试

- [ ] **步骤 1：完整工作流测试**

```bash
cd /tmp && rm -rf integration-test && mkdir integration-test && cd integration-test

# 初始化
node d:/Cat/OpenPM/.claude/skills/openpm/scripts/cli.js init

# Sprint Planning
node d:/Cat/OpenPM/.claude/skills/openpm/scripts/cli.js sprint create --name "Sprint 1" --goal "完整流程验证" --start 2026-07-01 --end 2026-07-14
node d:/Cat/OpenPM/.claude/skills/openpm/scripts/cli.js epic create --title "测试 Epic"
EPIC_ID=$(node -e "const r = require('d:/Cat/OpenPM/.claude/skills/openpm/scripts/commands/epic.js'); const res = r('list', {}, process.cwd()); console.log(res.epics[0].id)")
node d:/Cat/OpenPM/.claude/skills/openpm/scripts/cli.js task create --title "任务A" --status todo --priority high --type story --sprint sprint-1 --epic $EPIC_ID --ac "标准1;标准2"
node d:/Cat/OpenPM/.claude/skills/openpm/scripts/cli.js task create --title "任务B" --status todo --priority medium --type task --sprint sprint-1
node d:/Cat/OpenPM/.claude/skills/openpm/scripts/cli.js sprint start --id sprint-1

# 每日工作
node d:/Cat/OpenPM/.claude/skills/openpm/scripts/cli.js task update task-001 --status in_progress
node d:/Cat/OpenPM/.claude/skills/openpm/scripts/cli.js task update task-001 --status done
node d:/Cat/OpenPM/.claude/skills/openpm/scripts/cli.js task update task-002 --status done
node d:/Cat/OpenPM/.claude/skills/openpm/scripts/cli.js log today --summary "完成所有任务"

# Sprint 闭合
node d:/Cat/OpenPM/.claude/skills/openpm/scripts/cli.js sprint close --id sprint-1
node d:/Cat/OpenPM/.claude/skills/openpm/scripts/cli.js summary --sprint sprint-1

# 检查文件结构
find .openpm -type f | sort
```
预期：所有命令返回成功，`.openpm/` 目录结构完整

- [ ] **步骤 2：Web 服务集成测试**

```bash
cd /tmp/integration-test
node d:/Cat/OpenPM/.claude/skills/openpm/scripts/cli.js web --port 3098 &
sleep 2
curl -s http://localhost:3098/api/stats | python3 -m json.tool 2>/dev/null || curl -s http://localhost:3098/api/stats
curl -s http://localhost:3098/ | head -c 100
kill %1 2>/dev/null
```
预期：返回 JSON 数据和 HTML 页面

- [ ] **步骤 3：Commit**

```bash
# 测试通过后无需额外 commit，确认验收
```

---

---

## 自检结果

**1. 规格覆盖度检查：**
- ✅ 数据模型（6 实体）→ 任务 1（模板）+ 任务 4-6（命令）
- ✅ CLI 命令体系（15 命令）→ 任务 3-7
- ✅ Web 仪表盘（5 页面）→ 任务 9-10
- ✅ 技术架构（Node.js + 零依赖）→ 任务 2-8
- ✅ Skill 文件结构 → 任务 1+11
- ✅ AI Agent 工作流 → 任务 11（SKILL.md）

**2. 占位符扫描：**
- 任务 10 的步骤 2-5 引用了视觉伴侣原型文件——包含具体路径，可追溯

**3. 类型一致性：**
- 所有命令返回 `{ ok, ... }` 格式
- API 和 CLI 共用同一套命令函数
- 页面通过 `initPage(page)` / `refreshPage()` 与 SPA shell 约定接口
