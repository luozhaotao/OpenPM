# OpenPM 实际运行问题修复 实现计划

> **面向 AI 代理的工作者：** 必需子技能：使用 superpowers:subagent-driven-development（推荐）或 superpowers:executing-plans 逐任务实现此计划。步骤使用复选框（`- [ ]`）语法来跟踪进度。

**目标：** 修复三个实际运行问题——AI 复制模板而非走 CLI、CLI/Web 执行顺序错误、CLI 创建数据后 Web 看不到

**架构：** 在现有零依赖 Node.js + 纯静态 SPA 架构上做最小化改动，不改命令逻辑、不改 API 路由、不改页面文件。E 区（5 份规范文档）已写入，剩余 A/B/C/D 区 9 个文件

**技术栈：** Node.js (http 模块)、Vanilla JS、Markdown + YAML frontmatter

---

### 任务 1：SKILL.md — 核心约束 + 调用方式 + 前置检查 + 工程实践

**文件：**
- 修改：`openpm/SKILL.md`

- [ ] **步骤 1：在"## 何时使用"之后、"## 数据模型速查"之前插入"## 核心约束"节**

在 [SKILL.md:16](openpm/SKILL.md#L16) 后插入：

```markdown
## 核心约束

- **只用 CLI，不碰文件**：创建/修改任何实体必须通过 `node openpm/scripts/cli.js` 命令。`templates/` 目录仅供参考字段含义，禁止直接复制。
- **先启 Web，再操数据**：任何数据操作之前，先启动 `openpm web`。
```

- [ ] **步骤 2：在"## 命令参考"标题下、"### 初始化"之前插入"### 调用方式"节**

```markdown
### 调用方式

所有命令通过 Node.js 脚本执行：

```bash
node openpm/scripts/cli.js <entity> <action> [--flags]
```

示例：
```bash
node openpm/scripts/cli.js init
node openpm/scripts/cli.js task create --title "登录功能" --status todo
node openpm/scripts/cli.js web --port 23214
```
```

- [ ] **步骤 3：三个工作流各加前置检查行**

在"### Sprint Planning"标题下、"1. 创建 Sprint"之前插入：

```markdown
> ⚠️ 先确保 `openpm web` 已运行
```

在"### 每日开发"标题下、"1. 看待办"之前插入：

```markdown
> ⚠️ 先确保 `openpm web` 已运行
```

在"### Sprint 闭合"标题下、"1. 检查遗漏"之前插入：

```markdown
> ⚠️ 先确保 `openpm web` 已运行
```

- [ ] **步骤 4：在"## 规则"之前插入"## 工程实践"节**

```markdown
## 工程实践

### 执行原则

- **DoD（完成定义）**：任务标记 `done` 前，AC 全部满足、依赖项已闭合、无遗留代码注释。详见 [dod-checklist.md](docs/pm-practices/dod-checklist.md)
- **任务粒度**：单个 Task 应在 1 天内可完成。超过则拆分为子任务。详见 [invest.md](docs/pm-practices/invest.md)
- **Sprint 容量**：每 Sprint 5-12 个 Task，按优先级排列，高优先级优先入 Sprint。详见 [scrum.md](docs/pm-practices/scrum.md)
- **依赖最小化**：Task 间 `depends_on` 不超过 2 个前置。长依赖链说明拆分不合理
- **AC 写法**：验收标准用可验证的陈述句，每条独立、可测试。如"输入正确密码后跳转首页"而非"登录正常"
- **每个 commit 应对应一个 Task**：commit message 中包含 Task ID（如 `feat(task-003): 实现登录表单校验`）。详见 [conventional-commits.md](docs/pm-practices/conventional-commits.md)

### 参考规范

| 文档 | 路径 |
|------|------|
| Scrum 框架 | [scrum.md](docs/pm-practices/scrum.md) |
| 敏捷宣言与原则 | [agile-principles.md](docs/pm-practices/agile-principles.md) |
| Conventional Commits | [conventional-commits.md](docs/pm-practices/conventional-commits.md) |
| INVEST 原则 | [invest.md](docs/pm-practices/invest.md) |
| DoD 检查清单 | [dod-checklist.md](docs/pm-practices/dod-checklist.md) |
```

- [ ] **步骤 5：验证——确认 SKILL.md 结构完整**

预期：SKILL.md 各节顺序为：何时使用 → 核心约束 → 数据模型速查 → 命令参考（含调用方式）→ 工作流指南（含前置检查）→ 工程实践 → 规则

- [ ] **步骤 6：Commit**

```bash
git add openpm/SKILL.md
git commit -m "docs(openpm): 重写SKILL.md — 核心约束、调用方式、前置检查、工程实践"
```

---

### 任务 2：app.js — 修复 innerHTML 脚本不执行 Bug

**文件：**
- 修改：`openpm/scripts/web-ui/app.js:26-34`

- [ ] **步骤 1：替换 navigate() 函数中的 innerHTML 赋值逻辑**

将 [app.js:26-34](openpm/scripts/web-ui/app.js#L26-L34)：

```javascript
  // Load page content
  try {
    var resp = await fetch(pages[page].file);
    var html = await resp.text();
    document.getElementById('page-content').innerHTML = html;
    // Trigger page initialization
    if (typeof window.initPage === 'function') window.initPage(page);
```

替换为：

```javascript
  // Load page content
  try {
    var resp = await fetch(pages[page].file);
    var html = await resp.text();
    // innerHTML 不执行 <script>，手动提取并动态创建执行
    var container = document.getElementById('page-content');
    var temp = document.createElement('div');
    temp.innerHTML = html;
    var scripts = temp.querySelectorAll('script');
    scripts.forEach(function(s) { s.remove(); });
    container.innerHTML = temp.innerHTML;
    scripts.forEach(function(s) {
      var ns = document.createElement('script');
      ns.textContent = s.textContent;
      container.appendChild(ns);
    });
    // Trigger page initialization
    if (typeof window.initPage === 'function') window.initPage(page);
```

- [ ] **步骤 2：验证——启动 Web 服务，打开看板页面，确认数据加载**

```bash
node openpm/scripts/cli.js web --port 23214
```

在浏览器中打开 `http://localhost:23214`：
- 预期：看板页面加载后，三列显示任务卡片（如有数据），计数徽章显示数字而非 "-"
- 预期：AI 状态指示器显示绿色"AI 在线"
- 预期：30 秒后自动刷新

- [ ] **步骤 3：验证页面切换**

点击侧边栏切换到 Sprint / Epic 树 / 时间线 / 工作日志页面：
- 预期：每个页面正常渲染其专属内容，而非显示看板数据或空白

- [ ] **步骤 4：Commit**

```bash
git add openpm/scripts/web-ui/app.js
git commit -m "fix(web-ui): 修复innerHTML不执行script导致页面数据不加载"
```

---

### 任务 3：server.js — 端口统一 + cwd 日志

**文件：**
- 修改：`openpm/scripts/web/server.js:46,54-59`

- [ ] **步骤 1：修改默认端口**

将 [server.js:46](openpm/scripts/web/server.js#L46)：

```javascript
        return server.start(args.port || 3000, cwd);
```

改为：

```javascript
        return server.start(args.port || 23214, cwd);
```

- [ ] **步骤 2：修改启动日志，增加 cwd 和 dataDir 字段**

将 [server.js:54-58](openpm/scripts/web/server.js#L54-L58)：

```javascript
    console.log(JSON.stringify({
      ok: true,
      url: 'http://localhost:' + port,
      message: 'OpenPM dashboard running',
    }));
```

改为：

```javascript
    console.log(JSON.stringify({
      ok: true,
      url: 'http://localhost:' + port,
      cwd: cwd,
      dataDir: path.join(cwd, '.openpm'),
      message: 'OpenPM dashboard running',
    }));
```

- [ ] **步骤 3：验证——启动 web 服务，检查日志输出**

```bash
node openpm/scripts/cli.js web --port 23214
```

预期输出（JSON 格式）：
```json
{
  "ok": true,
  "url": "http://localhost:23214",
  "cwd": "<当前目录>",
  "dataDir": "<当前目录>/.openpm",
  "message": "OpenPM dashboard running"
}
```

- [ ] **步骤 4：验证——无参数启动使用新默认端口**

```bash
node openpm/scripts/cli.js web
```

预期：服务启动在 23214 端口。

- [ ] **步骤 5：Commit**

```bash
git add openpm/scripts/web/server.js
git commit -m "fix(web): 默认端口改为23214，启动日志增加cwd和dataDir"
```

---

### 任务 4：cli.js — 支持 --project 参数

**文件：**
- 修改：`openpm/scripts/cli.js:28`

- [ ] **步骤 1：修改 cwd 计算逻辑**

将 [cli.js:28](openpm/scripts/cli.js#L28)：

```javascript
  const cwd = process.cwd();
```

改为：

```javascript
  const cwd = args.project || process.cwd();
```

- [ ] **步骤 2：验证——使用 --project 指定项目目录**

```bash
# 先在临时目录初始化
mkdir /tmp/test-openpm
node openpm/scripts/cli.js --project /tmp/test-openpm init

# 确认 .openpm/ 创建在指定目录
ls /tmp/test-openpm/.openpm/
```

预期：`.openpm/` 目录创建在 `/tmp/test-openpm/` 而非当前工作目录。

- [ ] **步骤 3：验证——不带 --project 行为不变**

```bash
node openpm/scripts/cli.js task list
```

预期：仍使用 `process.cwd()`，行为与改前一致。

- [ ] **步骤 4：Cleanup + Commit**

```bash
rm -rf /tmp/test-openpm
git add openpm/scripts/cli.js
git commit -m "feat(cli): 支持--project参数显式指定项目目录"
```

---

### 任务 5：templates/ — 模板文件加禁止复制注释

**文件：**
- 修改：`openpm/templates/task.md`
- 修改：`openpm/templates/sprint.md`
- 修改：`openpm/templates/epic.md`
- 修改：`openpm/templates/milestone.md`
- 修改：`openpm/templates/log.md`

- [ ] **步骤 1：5 个模板文件各在顶部加一行注释**

在 [task.md](openpm/templates/task.md#L1) 顶部插入：

```markdown
<!-- 字段参考，禁止复制。请用 CLI: node openpm/scripts/cli.js task create -->
```

在 [sprint.md](openpm/templates/sprint.md#L1) 顶部插入：

```markdown
<!-- 字段参考，禁止复制。请用 CLI: node openpm/scripts/cli.js sprint create -->
```

在 [epic.md](openpm/templates/epic.md#L1) 顶部插入：

```markdown
<!-- 字段参考，禁止复制。请用 CLI: node openpm/scripts/cli.js epic create -->
```

在 [milestone.md](openpm/templates/milestone.md#L1) 顶部插入：

```markdown
<!-- 字段参考，禁止复制。请用 CLI: node openpm/scripts/cli.js milestone create -->
```

在 [log.md](openpm/templates/log.md#L1) 顶部插入：

```markdown
<!-- 字段参考，禁止复制。请用 CLI: node openpm/scripts/cli.js log today -->
```

- [ ] **步骤 2：Commit**

```bash
git add openpm/templates/
git commit -m "docs(templates): 模板文件加禁止复制注释，引导AI使用CLI"
```

---

## 任务依赖关系

```
任务2 (app.js)  ←── 必须最先做，这是致命Bug
任务1 (SKILL.md) ←── 独立
任务3 (server.js) ←── 独立
任务4 (cli.js)   ←── 独立
任务5 (templates) ←── 独立

推荐顺序：2 → 3 → 4 → 1 → 5
（先修致命Bug，再加固基础设施，最后修文档）
```

## 端到端验证

全部任务完成后执行：

```bash
# 1. 初始化项目
node openpm/scripts/cli.js init

# 2. 启动 web 服务（后台）
node openpm/scripts/cli.js web --port 23214 &
WEB_PID=$!

# 3. 创建 Sprint
node openpm/scripts/cli.js sprint create --name "Sprint 1" --goal "验证修复" --start 2026-07-01 --end 2026-07-14

# 4. 创建 Task
node openpm/scripts/cli.js task create --title "测试任务1" --status todo --priority high --sprint sprint-1
node openpm/scripts/cli.js task create --title "测试任务2" --status todo --priority medium --sprint sprint-1

# 5. 验证 Web 能读到数据
curl http://localhost:23214/api/tasks
curl http://localhost:23214/api/sprints
curl http://localhost:23214/api/stats

# 6. 验证前端页面
# 浏览器打开 http://localhost:23214，检查：
# - 看板页：3 列显示任务卡片
# - Sprint 页：统计卡片 + Sprint 列表
# - 页面切换正常

# 7. 清理
kill $WEB_PID
```
