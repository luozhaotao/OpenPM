# OpenPM SKILL.md 内容

以下是 Skill 文件 `.claude/skills/openpm/SKILL.md` 的完整内容。

---

```markdown
---
name: openpm
description: AI Agent 敏捷项目管理 — 当需要创建任务、规划 Sprint、更新进度、记录工作日志时使用。覆盖完整开发流程的项目管理数据操作。
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

## 数据模型速查

| 实体 | 目录 | 状态流转 |
|------|------|----------|
| Task | `.openpm/tasks/` | `todo` → `in_progress` → `done` |
| Sprint | `.openpm/sprints/` | `plan` → `active` → `done` |
| Epic | `.openpm/epics/` | `todo` → `in_progress` → `done` |
| Milestone | `.openpm/milestones/` | `upcoming` → `current` → `done` |
| Log | `.openpm/logs/` | 按日期存储 |
| Summary | `.openpm/sprints/` | Sprint 关闭时生成 |

Task 字段：`id`, `title`, `status`, `priority` (high/medium/low), `type` (story/task/bug), `sprint`, `epic`, `depends_on`, `ac` (验收标准数组)
Sprint 字段：`id`, `name`, `goal`, `status`, `start_date`, `end_date`

## 命令参考

默认输出 JSON，添加 `--format markdown` 获取人类可读输出。

### 初始化

```bash
openpm init
```
在当前项目创建 `.openpm/` 目录结构。开始任何项目管理操作前运行一次。

### Task（任务）

```bash
openpm task create --title "..." --status todo --priority medium --type task [--sprint sprint-x] [--epic epic-x] [--depends-on task-xxx]
openpm task list [--sprint sprint-x] [--epic epic-x] [--status todo|in_progress|done] [--priority high|medium|low]
openpm task show task-001
openpm task update task-001 --status done [--title "..." --priority ...]
openpm task delete task-001
```

### Sprint（迭代）

```bash
openpm sprint create --name "Sprint 1" --goal "..." --start 2026-07-01 --end 2026-07-14
openpm sprint start --id sprint-1          # 状态 → active
openpm sprint close --id sprint-1          # 状态 → done + 自动生成 summary
openpm sprint list
```

### Epic（史诗）

```bash
openpm epic create --title "用户认证系统"
openpm epic list
openpm epic show epic-auth
```

### Milestone（里程碑）

```bash
openpm milestone create --name "MVP v0.1" --date 2026-08-01
openpm milestone list
```

### 工作日志 & 小结

```bash
openpm log today [--summary "..."]
openpm summary --sprint sprint-1
```

### Web 仪表盘

```bash
openpm web [--port 3000]
```
启动 Web 服务供人类浏览。后台运行，端口默认 3000。

## 工作流指南

### 流程 1：Sprint Planning

```
目标：为下个迭代创建任务列表
```

1. **创建 Sprint**：
   ```bash
   openpm sprint create --name "Sprint 2 - 支付模块" --goal "集成微信支付，完成下单流程" --start 2026-07-15 --end 2026-07-28
   ```

2. **批量创建任务**（每个任务一条命令）：
   ```bash
   openpm task create --title "接入支付 SDK" --status todo --priority high --type story --sprint sprint-2 --epic epic-payment
   openpm task create --title "退款流程处理" --status todo --priority medium --type story --sprint sprint-2 --epic epic-payment --depends-on task-xxx
   openpm task create --title "账单记录页面" --status todo --priority medium --type task --sprint sprint-2 --epic epic-payment
   ```

3. **标记依赖关系**（如有遗漏）：
   ```bash
   openpm task update task-015 --depends-on task-010
   ```

4. **激活 Sprint**：
   ```bash
   openpm sprint start --id sprint-2
   ```

### 流程 2：每日开发

```
目标：取任务 → 做任务 → 更新状态 → 记录日志
```

1. **查看待办**：
   ```bash
   openpm task list --sprint sprint-2 --status todo
   ```

2. **开始任务前，读取详情和 AC**：
   ```bash
   openpm task show task-010
   ```

3. **标记开始**：
   ```bash
   openpm task update task-010 --status in_progress
   ```

4. **编码实现后标记完成**：
   ```bash
   openpm task update task-010 --status done
   ```

5. **收工时记录日志**：
   ```bash
   openpm log today --summary "完成支付 SDK 接入。遇到签名验证问题，通过查阅文档解决。"
   ```

### 流程 3：Sprint 闭合

```
目标：关闭当前 Sprint，生成小结，规划后续
```

1. **检查是否有遗漏**：
   ```bash
   openpm task list --sprint sprint-2 --status todo
   openpm task list --sprint sprint-2 --status in_progress
   ```

2. **关闭 Sprint**（未完成任务自动移入下一个 Sprint）：
   ```bash
   openpm sprint close --id sprint-2
   ```

3. **查看生成的小结**：
   ```bash
   openpm summary --sprint sprint-2
   ```

### 流程 4：状态查询

```
目标：回答用户"项目进度怎么样"
```

```bash
# 当前 Sprint 进度
openpm sprint list              # 找到当前 Sprint ID
openpm task list --sprint sprint-2 --status done    # 已完成数
openpm task list --sprint sprint-2 --status todo    # 剩余数

# 或直接读 Sprint 文件
openpm summary --sprint sprint-2
```

## 规则

### 硬性规则

1. **操作前检查**：修改任何实体前，先用 `show` 或 `list` 确认当前状态
2. **依赖检查**：标记任务为 `done` 前，确认其 `depends_on` 已全部完成
3. **一个任务一个文件**：不要在一个文件中定义多个任务
4. **ID 唯一**：task-id 格式为 `task-NNN`（三位数字），sprint 为 `sprint-N`，epic 为 `epic-xxx`
5. **每次编码后更新状态**：完成任务后立即 `task update --status done`，不要积累

### 建议规则

1. **每日写日志**：每天收工前执行 `openpm log today`
2. **附带验收标准**：创建 Story 类型任务时尽量填写 `--ac`（可以通过 `task update` 后补）
3. **保持 Sprint Backlog 精简**：一个 Sprint 建议 5-12 个任务
4. **关闭 Sprint 前检查**：确保没有 `in_progress` 状态的任务被遗留

## 示例输出

```bash
$ openpm task list --sprint sprint-2 --status todo
```

```json
[
  {
    "id": "task-015",
    "title": "退款流程处理",
    "status": "todo",
    "priority": "medium",
    "type": "story",
    "sprint": "sprint-2",
    "epic": "epic-payment",
    "depends_on": ["task-010"],
    "ac": ["用户可在订单页发起退款", "退款金额原路返回"]
  }
]
```
```

---

## 内容结构说明

SKILL.md 分为 6 个部分：

| 部分 | 作用 | AI 如何使用 |
|------|------|-------------|
| **何时使用** | 触发条件 | AI 识别到项目管理意图时激活技能 |
| **数据模型速查** | 实体-字段映射 | 快速查阅字段名和合法值 |
| **命令参考** | CLI 完整语法 | 作为命令速查手册 |
| **工作流指南** | 4 个典型场景的步骤 | 按场景执行命令序列 |
| **规则** | 约束和最佳实践 | 硬性规则必须遵守，建议规则灵活执行 |
| **示例输出** | JSON 格式参考 | 了解返回值结构 |

核心设计原则：
- **命令自解释**：参数名即文档，AI 不看说明也能猜出用法
- **工作流即代码**：每个流程是可直接执行的命令序列
- **规则驱动行为**：硬性规则防止 AI 犯错（比如不检查依赖就标记完成）
