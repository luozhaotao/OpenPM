# OpenPM Skill 设计文档

> 日期：2026-06-30
> 状态：设计完成，待实现

## 概述

OpenPM 是一个 AI Agent 驱动的敏捷项目管理 Skill。AI Agent 通过 CLI 工具读写项目数据，人类通过 Web 仪表盘浏览进度。数据以 Markdown+YAML Frontmatter 格式存放在用户项目的 `.openpm/` 目录中。

**核心原则**：
- AI Agent 是数据生产者/消费者，人类只浏览
- 数据存在于用户的项目中，而非外部服务
- 去掉为人类团队设计的仪式感（故事点、站会），保留 AI 真正需要的数据锚点

---

## 1. 数据模型

### 1.1 实体定义

所有实体以 Markdown 文件存储，YAML frontmatter 存结构化字段，正文存 Markdown 描述。

#### Task（任务/故事）— 核心实体

```yaml
---
id: task-001
title: "用户登录功能"
status: todo          # todo | in_progress | done
priority: high        # high | medium | low
type: story           # story | task | bug
sprint: sprint-1
epic: epic-auth
depends_on:           # 前置依赖（可选）
  - task-002
ac:                   # 验收标准（可选）
  - "输入正确账号密码后跳转首页"
  - "错误时显示提示信息"
created: 2026-06-30
updated: 2026-06-30
---

实现邮箱+密码登录，包含表单校验和错误处理。
```

#### Sprint（迭代）

```yaml
---
id: sprint-1
name: "MVP 核心功能"
goal: "用户可以注册登录并查看首页"
status: active        # plan | active | done
start_date: 2026-06-30
end_date: 2026-07-14
---

本 Sprint 聚焦用户认证和基础页面框架。
```

#### Epic（史诗分组）

```yaml
---
id: epic-auth
title: "用户认证系统"
status: in_progress
---

覆盖注册、登录、密码找回完整流程。
```

#### Milestone（里程碑）

```yaml
---
id: ms-mvp
name: "MVP v0.1"
target_date: 2026-08-01
status: upcoming     # upcoming | current | done
---
```

#### Sprint Summary（迭代小结）

```yaml
---
sprint: sprint-1
completed: 8
total: 10
---

## 完成事项
- 登录功能 ✅

## 未完成
- 密码找回 ➡️ 移入下个 Sprint

## AI 反思
表单校验逻辑需要更早引入测试。
```

#### Work Log（工作日志）

```yaml
---
date: 2026-06-30
tasks:
  - task-001: implemented
  - task-003: code_review
---

## 今日摘要
完成了登录表单组件。

## 阻塞项
等待设计稿确认。
```

### 1.2 目录结构

```
用户项目/
├── .openpm/
│   ├── config.yaml          # 项目配置
│   ├── tasks/
│   │   ├── task-001.md
│   │   └── ...
│   ├── sprints/
│   │   ├── sprint-1.md
│   │   └── sprint-1-summary.md
│   ├── epics/
│   │   └── epic-auth.md
│   ├── milestones/
│   │   └── ms-mvp.md
│   └── logs/
│       └── 2026-06-30.md
```

---

## 2. CLI 命令体系

格式统一为 `openpm <实体> <动词>`，默认输出 JSON，`--format markdown` 切换人类可读。

### 2.1 命令列表

| 命令 | 说明 | 关键参数 |
|------|------|----------|
| `openpm init` | 初始化 .openpm/ 目录 | — |
| `openpm task create` | 创建任务 | --title --status --priority --type --sprint --epic --depends-on |
| `openpm task list` | 列出任务 | --sprint --epic --status --priority |
| `openpm task show` | 查看任务详情 | --id |
| `openpm task update` | 更新任务 | --id --status --title ... |
| `openpm task delete` | 删除任务 | --id |
| `openpm sprint create` | 创建 Sprint | --name --goal --start --end |
| `openpm sprint start` | 激活 Sprint | --id |
| `openpm sprint close` | 关闭 Sprint + 生成小结 | --id |
| `openpm sprint list` | 列出 Sprint | — |
| `openpm epic create` | 创建 Epic | --title |
| `openpm epic list` | 列出 Epic | — |
| `openpm epic show` | 查看 Epic 详情 | --id |
| `openpm milestone create` | 创建 Milestone | --name --date |
| `openpm milestone list` | 列出 Milestone | — |
| `openpm log today` | 写入/查看今日日志 | --summary |
| `openpm summary` | 生成 Sprint 小结 | --sprint |
| `openpm web` | 启动 Web 仪表盘 | --port (默认 3000) |

### 2.2 JSON 输出示例

```json
{
  "id": "task-001",
  "title": "用户登录功能",
  "status": "in_progress",
  "priority": "high",
  "type": "story",
  "sprint": "sprint-1",
  "epic": "epic-auth",
  "depends_on": ["task-002"],
  "ac": ["输入正确账号密码后跳转首页", "错误时显示提示信息"],
  "created": "2026-06-30",
  "updated": "2026-06-30"
}
```

---

## 3. Web 仪表盘

### 3.1 设计系统

| 维度 | 选择 |
|------|------|
| 主题 | 浅色，底色 `#fafaf9`，主色 `#2563eb` |
| 字体 | 系统原生字体栈；等宽字体用于 ID/数据 |
| 图标 | Bootstrap Icons |
| 布局 | 桌面端优先，160px 左侧导航栏，多列内容区 |
| 签名元素 | 侧边栏底部 AI 状态脉动指示器 |
| 前端技术 | 纯静态 HTML + Vanilla JS + CSS，零框架零构建 |

### 3.2 页面

#### 看板 (Kanban)
- 默认首页，三列状态栏（Todo / In Progress / Done）
- 任务卡片含：ID、标题、Epic 标签、类型标签、优先级、验收标准、依赖标注
- 顶部筛选器（Epic、优先级）
- 已完成卡片半透明+划线

#### Sprint
- 统计卡片：当前迭代、完成率、剩余天数、AI 活动数
- 燃尽图：SVG 绘制，理想线 vs 实际线
- 迭代列表：当前 Sprint（蓝色高亮）+ 历史 Sprint
- 团队速率图：Sprint 间任务完成趋势
- AI Sprint 小结：完成/未完成/反思三列

#### Epic 树
- 左：Epic 可展开列表，内含任务状态、依赖、验收标准数
- 右：Epic 概览统计 + 环形进度 + 跨 Epic 依赖图

#### 时间线 (Timeline)
- 甘特图：Sprint + 里程碑横跨时间轴
- 里程碑纵向时间线
- 关键依赖链图

#### 工作日志 (Work Log)
- 左：日志条目列表（日期、摘要、关联任务、阻塞项）
- 右：月度活动热力图 + Sprint 统计 + AI 贡献卡片

### 3.3 数据获取

Web 前端通过 `openpm web` 启动的内嵌 HTTP 服务获取数据。API 读取 `.openpm/` 文件，返回 JSON。前端每 30 秒轮询刷新。

---

## 4. 技术架构

```
用户项目/.openpm/          ← 数据层 (Markdown + YAML)
        ↓
   openpm CLI              ← 中间层 (Node.js)
   ├── 命令处理器          ← AI Agent 通过 Bash 调用
   └── HTTP 服务           ← Web 前端 fetch 数据
        ↓
┌───────┴───────┐
🤖 AI Agent      🌐 浏览器
(Bash 调用 CLI)   (仪表盘浏览)
```

- **运行时**：Node.js
- **数据层**：文件系统读写 Markdown + YAML frontmatter
- **CLI**：解析命令行参数，操作数据文件，输出 JSON
- **Web**：CLI 内嵌 HTTP 服务 + 静态 HTML 文件
- **无外部依赖**：不使用数据库、构建工具或框架

---

## 5. Skill 文件结构

```
.claude/skills/openpm/
├── SKILL.md              # Skill 说明（AI 的使用指南）
├── scripts/
│   ├── cli.js            # CLI 入口
│   ├── core/
│   │   ├── task.js       # Task CRUD
│   │   ├── sprint.js     # Sprint 管理
│   │   ├── epic.js       # Epic 管理
│   │   ├── milestone.js  # Milestone 管理
│   │   ├── log.js        # 工作日志
│   │   └── summary.js    # Sprint 小结
│   ├── web/
│   │   ├── server.js     # HTTP 服务
│   │   └── api.js        # API 路由
│   └── web-ui/
│       ├── index.html    # SPA 入口
│       ├── kanban.html
│       ├── sprint.html
│       ├── epic-tree.html
│       ├── timeline.html
│       └── worklog.html
└── templates/            # 实体模板
    ├── task.md
    ├── sprint.md
    ├── epic.md
    ├── milestone.md
    └── log.md
```

---

## 6. AI Agent 工作流

### 6.1 Sprint Planning
```
openpm sprint create --name "Sprint 2" --goal "..."
openpm task create --title "..." --epic epic-x --sprint sprint-2 --type story
openpm task create --title "..." --epic epic-x --sprint sprint-2 --depends-on task-xxx
openpm sprint start --id sprint-2
```

### 6.2 每日工作
```
openpm task list --sprint current --status todo        # 看待办
openpm task show task-xxx                               # 读 AC
openpm task update task-xxx --status in_progress        # 开始工作
# ... 编码 ...
openpm task update task-xxx --status done               # 完成
openpm log today --summary "..."                        # 收工记录
```

### 6.3 Sprint 闭合
```
openpm sprint close sprint-1   # 自动生成 summary，未完成任务移入下一个 Sprint
```

---

## 7. 范围边界

**包含**：
- Task / Sprint / Epic / Milestone / Summary / Log 的完整 CRUD
- CLI 命令（供 AI 使用）
- Web 仪表盘（供人类浏览）
- 数据存储在用户项目的 `.openpm/` 中

**不包含**：
- 多用户/团队协作（仅 AI Agent 操作）
- 人类编辑数据（只浏览）
- 外部集成（Jira/GitHub 同步等）
- 实时通知/WebSocket
- 移动端优化
- 身份认证/权限管理
