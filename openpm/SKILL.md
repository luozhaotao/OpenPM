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

通过 CLI 工具管理 `.openpm/` 目录中的项目数据。AI Agent 是数据生产者，人类通过 Web 仪表盘浏览进度。

## 何时使用

- 用户发出项目管理指令："创建任务"、"开始 Sprint"、"查看进度"、"记录今日工作"
- Sprint Planning：规划新迭代，拆解需求为任务
- 每日开发：领取任务、更新状态、记录工作日志
- Sprint 结束：关闭迭代，生成小结
- 用户询问项目状态："现在进度如何"、"还有多少任务没做"

## 核心约束

- **只用 CLI，不碰文件**：创建/修改任何实体必须通过 `node openpm/scripts/cli.js` 命令。`templates/` 目录仅供参考字段含义，禁止直接复制。
- **先启 Web，再操数据**：任何数据操作之前，先启动 `openpm web`。如端口被其他项目占用，使用 `--port` 换端口。

## 数据模型速查

| 实体 | 目录 | 状态流转 |
|------|------|----------|
| Task | `.openpm/tasks/` | `todo` → `in_progress` → `done` |
| Sprint | `.openpm/sprints/` | `plan` → `active` → `done` |
| Epic | `.openpm/epics/` | `todo` → `in_progress` → `done` |
| Milestone | `.openpm/milestones/` | `upcoming` → `current` → `done` |
| Log | `.openpm/logs/` | 按日期存储 |
| Summary | `.openpm/sprints/` | Sprint 关闭时生成 |

Task 字段：`id`, `title`, `status`, `priority` (high/medium/low), `type` (story/task/bug), `sprint`, `epic`, `depends_on` (数组), `ac` (验收标准数组)
Sprint 字段：`id`, `name`, `goal`, `status`, `start_date`, `end_date`

## 命令参考

默认输出 JSON。添加 `--format markdown` 获取人类可读输出。

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

> 以下命令参考中 `openpm` 均为 `node openpm/scripts/cli.js` 的简写。

### 初始化

```bash
openpm init
```
在当前项目创建 `.openpm/` 目录结构。

### Task（任务）

```bash
openpm task create --title "..." --status todo --priority medium --type task [--sprint sprint-x] [--epic epic-x] [--depends-on task-xxx] [--ac "标准1;标准2"]
openpm task list [--sprint sprint-x] [--status todo|in_progress|done]
openpm task show <task-id>
openpm task update <task-id> --status done [--title "..."]
openpm task delete <task-id>
```

### Sprint（迭代）

```bash
openpm sprint create --name "Sprint 1" --goal "..." --start 2026-07-01 --end 2026-07-14
openpm sprint show <sprint-id>     # 查看单个 Sprint 详情及关联任务数
openpm sprint list
openpm sprint start --id sprint-1   # 激活 Sprint（plan → active）
openpm sprint update <sprint-id> --name "..." --goal "..." --status active
openpm sprint close <sprint-id>     # 关闭并自动生成 summary；未完成任务移入下个 Sprint
openpm sprint delete <sprint-id> [--force]  # 有关联任务时需 --force
```

### Epic / Milestone / Log / Summary

```bash
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

### Web 仪表盘

```bash
openpm web [--port 23214]
```

## 工作流指南

### Sprint Planning

> ⚠️ 先确保 `openpm web` 已运行

1. 创建 Sprint：`openpm sprint create --name "Sprint 2" --goal "..." --start ... --end ...`
2. 批量创建任务（每个任务一条命令）
3. 激活 Sprint：`openpm sprint start --id sprint-2`

### 每日开发

> ⚠️ 先确保 `openpm web` 已运行

1. 看待办：`openpm task list --sprint sprint-2 --status todo`
2. 读 AC：`openpm task show <task-id>`
3. 开始：`openpm task update <task-id> --status in_progress`
4. 完成：`openpm task update <task-id> --status done`
5. 收工：`openpm log today --summary "..."`

### Sprint 闭合

> ⚠️ 先确保 `openpm web` 已运行

1. 检查遗漏：`openpm task list --sprint sprint-2 --status todo`
2. 关闭：`openpm sprint close sprint-2`（未完成任务自动移入下个 Sprint）
3. 查看小结：`openpm summary --sprint sprint-2`

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

## 规则

### 硬性规则

1. **操作前检查**：修改任何实体前，先用 `show` 或 `list` 确认当前状态
2. **依赖检查**：标记任务为 `done` 前，确认其 `depends_on` 已全部完成
3. **一个任务一个文件**：不要在一个文件中定义多个任务
4. **ID 唯一**：task-id 格式为 `task-NNN`，sprint 为 `sprint-N`，epic 为 `epic-xxx`
5. **每次编码后更新状态**：完成任务后立即 `task update --status done`

### 建议规则

1. **每日写日志**：每天收工前执行 `openpm log today`
2. **附带验收标准**：创建 Story 类型任务时尽量填写 `--ac`
3. **保持 Sprint Backlog 精简**：一个 Sprint 建议 5-12 个任务
4. **关闭 Sprint 前检查**：确保没有 `in_progress` 状态的任务遗留
