# OpenPM 实际运行问题修复设计

> 日期：2026-07-01
> 状态：设计完成，待实现

## 问题综述

在实际运行中发现三类问题：

1. **AI Agent 倾向直接复制模板而非走 CLI** —— `templates/` 目录对 AI 形成"填空题"诱惑
2. **AI Agent 先 CLI 后 Web 的顺序错误** —— SKILL.md 工作流未含 web 启动步骤
3. **CLI 创建数据后 Web 看不到** —— 致命原因：`app.js` 用 `innerHTML` 加载页面，`<script>` 标签不执行；附带原因：端口不一致、cwd 歧义

## 修复方案

### A 区：SKILL.md 重写

**文件**：`openpm/SKILL.md`

在三处精准插入：

1. **"## 何时使用"之后新增"## 核心约束"**：
   - 只用 CLI，不碰文件。`templates/` 仅供参考字段含义，禁止直接复制
   - 先启 Web，再操数据：任何数据操作前先启动 `openpm web`

2. **"## 命令参考"开头新增"### 调用方式"**：
   - 明确所有命令通过 `node openpm/scripts/cli.js` 执行
   - 附 3 个示例（init / task create / web）

3. **三个工作流各加一行前置检查**：
   - `> ⚠️ 先确保 openpm web 已运行`

4. **新增"## 工程实践"节**：
   - 嵌入式执行原则（DoD 定义、任务粒度、Sprint 容量、依赖最小化、AC 写法、commit 关联）
   - 引用本地 5 份规范文档

### B 区：前端脚本执行修复

**文件**：`openpm/scripts/web-ui/app.js`

**问题**：`innerHTML` 不执行 `<script>` 标签，5 个页面数据加载逻辑从未运行。

**方案**：改造 `navigate()` 函数：
1. 用临时 div 承载 innerHTML
2. 提取并移除所有 `<script>` 标签
3. 以非脚本内容设置 innerHTML
4. 动态创建新 `<script>` 元素执行提取的脚本

不改动任何 HTML 页面文件。

### C 区：CLI/Web 一致性加固

**文件**：`openpm/scripts/web/server.js`、`openpm/scripts/cli.js`

1. `server.js`：默认端口 `3000` → `23214`（与 SKILL.md 一致）
2. `server.js`：启动日志追加 `cwd` 和 `dataDir` 字段
3. `cli.js`：`cwd` 计算改为 `args.project || process.cwd()`，支持 `--project` 显式指定

### D 区：模板目录去诱惑化

**文件**：`openpm/templates/*.md` ×5

每个模板文件顶部加 HTML 注释：`<!-- 字段参考，禁止复制。请用 CLI: node openpm/scripts/cli.js <entity> create -->`

### E 区：工程实践规范文档

**文件**：`openpm/docs/pm-practices/*.md` ×5（已写入）

| 文件 | 来源 | 行数 |
|------|------|------|
| `scrum.md` | Scrum Guide (Schwaber & Sutherland, 2020) | 131 |
| `agile-principles.md` | Agile Manifesto (2001) 中文版 | 75 |
| `conventional-commits.md` | Conventional Commits v1.0.0 | 128 |
| `invest.md` | INVEST (Bill Wake, 2003) | 163 |
| `dod-checklist.md` | Scrum DoD + 工程实践综合 | 117 |

每份文档包含权威原文 + OpenPM 实践映射，AI Agent 可直接读取并执行。

## 改动影响范围

| 文件 | 改动 | 类型 |
|------|------|------|
| `openpm/SKILL.md` | 新增核心约束 + 调用方式 + 前置检查 + 工程实践 | 修改 |
| `openpm/scripts/web-ui/app.js` | navigate() 脚本执行修复 | 修改 |
| `openpm/scripts/web/server.js` | 默认端口 + cwd 日志 | 修改 |
| `openpm/scripts/cli.js` | --project 参数 | 修改 |
| `openpm/templates/task.md` | 禁止复制注释 | 修改 |
| `openpm/templates/sprint.md` | 禁止复制注释 | 修改 |
| `openpm/templates/epic.md` | 禁止复制注释 | 修改 |
| `openpm/templates/milestone.md` | 禁止复制注释 | 修改 |
| `openpm/templates/log.md` | 禁止复制注释 | 修改 |
| `openpm/docs/pm-practices/scrum.md` | Scrum 完整规范 | 新增 |
| `openpm/docs/pm-practices/agile-principles.md` | 敏捷宣言与原则 | 新增 |
| `openpm/docs/pm-practices/conventional-commits.md` | Commit 规范 | 新增 |
| `openpm/docs/pm-practices/invest.md` | INVEST 原则 | 新增 |
| `openpm/docs/pm-practices/dod-checklist.md` | DoD 检查清单 | 新增 |

**总计**：14 个文件（5 新增，9 修改），约 680 行。

## 不改动的部分

- `scripts/commands/*` — 命令逻辑正确
- `scripts/lib/*` — 文件/ID/配置库正确
- `scripts/web/api.js` — API 路由正确
- `scripts/web-ui/*.html` — 页面文件无需改动（B 区方案在 app.js 统一修复）
- `scripts/web-ui/style.css` — 样式无需改动
