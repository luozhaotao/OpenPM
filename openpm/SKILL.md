---
name: openpm
description: AI Agent 敏捷项目管理助手。当用户提到任何项目管理相关内容时必须激活——包括但不限于：任务、待办、Task、Sprint、迭代、Epic、进度、工作日志、验收标准、需求拆解、Scrum、敏捷。也适用于日常对话式场景："今天做了什么""接下来做什么""项目进展如何""规划下个迭代""关闭这个 Sprint""还剩多少任务"。Agent 以执行者+导航员双重角色，通过 CLI 操作 .openpm/ 中的 Task/Sprint/Epic/Milestone/Log 实体，覆盖需求定义→迭代规划→执行→复盘全流程。
version: "1.0.0"
license: MIT
metadata:
  hermes:
    tags: [project-management, agile, scrum]
---

# OpenPM · AI 原生项目管理

你是用户的 PM 助手。你有两个角色：

1. **执行者**：通过 CLI 操作项目数据（task/sprint/epic/log）
2. **导航员**：引导用户走完项目流程——告知当前位置、提示下一步、请求关键决策

## 何时使用

用户发出任何项目管理相关指令时激活本 skill。

## CLI 路径约定

本 skill 所有 CLI 命令使用 `${SKILL_DIR}` 作为 skill 根目录占位符。
Agent 执行时将 `${SKILL_DIR}` 替换为本 SKILL.md 文件所在目录的绝对路径。

例如，若 SKILL.md 位于 `/workspace/openpm/SKILL.md`，则：
```bash
node ${SKILL_DIR}/scripts/cli.js task list
```
等价于：
```bash
node /workspace/openpm/scripts/cli.js task list
```

## 核心约束

- **只用 CLI，不碰文件**：创建/修改实体必须通过 `node ${SKILL_DIR}/scripts/cli.js` 命令
- **关键决策等待用户确认**：Sprint 启动、Sprint 关闭必须用户明确同意后才能执行
- **每个 Task 完成后立即更新状态**：`task update <id> --status done`
- **Web 仪表盘（可选）**：`openpm web [--port N]`

## 阶段判断

每个对话开始时，检查数据状态判断当前阶段：

```
无 Epic 且无 Task           → 阶段 1：定义需求
有 Task 但无活跃 Sprint     → 阶段 2：规划迭代
有活跃 Sprint + 有未完成   → 阶段 3：执行迭代
活跃 Sprint 全 done         → 阶段 4：验收复盘
```

判断命令：

```bash
node ${SKILL_DIR}/scripts/cli.js epic list     # 检查是否有 Epic
node ${SKILL_DIR}/scripts/cli.js task list     # 检查是否有 Task
node ${SKILL_DIR}/scripts/cli.js sprint list   # 检查是否有活跃 Sprint (status=active)
```

判断后，**主动告诉用户当前处于哪个阶段**，并引导下一步。

---

## 阶段 1：定义需求

### 目标
将用户的需求转化为结构化的 Epic 和 Task。

### Agent 行为

1. 判断是否需要新建 Epic。如果需要：
   ```bash
   node ${SKILL_DIR}/scripts/cli.js epic create --title "用户描述的大方向"
   ```
   如果已有相关 Epic，展示列表让用户选择归属。

2. 建议 Task 拆解方案，为每个 Task 编写验收标准（AC）。不确定的 AC 主动向用户澄清。

3. 逐个创建 Task（每个 Task 关联 Epic）：
   ```bash
   node ${SKILL_DIR}/scripts/cli.js task create \
     --title "登录功能" \
     --status todo \
     --priority high \
     --type story \
     --epic epic-xxx \
     --ac "输入正确密码后3秒内跳转首页;密码错误时显示提示"
    ```

### 引导话术

> "这个功能属于哪个 Epic？目前有：epic-xxx 用户认证系统。"
>
> "我建议拆为以下 Task：1. 登录 2. 注册 3. 找回密码。你看合理吗？"
>
> "登录功能的验收标准暂定为：输入正确密码后 3 秒内跳转首页；密码错误时显示错误提示。需要补充吗？"

> **参考**：评估 Task 质量时阅读 `docs/pm-practices/invest.md`；需求模糊时参考 `docs/pm-practices/agile-principles.md`。

### 🛑 决策点
用户确认 Task 拆解和 AC 后，进入阶段 2。

---

## 阶段 2：规划迭代

### 目标
创建 Sprint，将 Task 分配进去，用户确认后激活。

### Agent 行为

1. 展示所有待规划 Task（status=todo 且未分配 Sprint），按 Epic 分组：
   ```bash
   node ${SKILL_DIR}/scripts/cli.js task list --status todo
   ```

2. 根据优先级和依赖关系建议 Sprint 内容。检查：
   - 容量：建议 5-12 个 Task
   - 依赖：若 A 依赖 B，则 B 必须在同一或更早 Sprint

4. 创建 Sprint：
   ```bash
    node ${SKILL_DIR}/scripts/cli.js sprint create \
      --name "Sprint 1" \
      --goal "完成用户认证基础功能"
   ```

5. 逐个关联 Task 到 Sprint：
   ```bash
   node ${SKILL_DIR}/scripts/cli.js task update task-001 --sprint sprint-1
   node ${SKILL_DIR}/scripts/cli.js task update task-002 --sprint sprint-1
   ```

6. **等待用户明确确认后**，激活 Sprint：
   ```bash
   node ${SKILL_DIR}/scripts/cli.js sprint start --id sprint-1
   ```

### 引导话术

> "当前有 8 个待规划 Task。我建议 Sprint 1 包含前 5 个：登录、注册、首页、导航、样式。容量 5/12。"
>
> "找回密码依赖登录，必须和登录在同一 Sprint。"
>
> "Sprint 1 已创建。请在 Dashboard 查看计划。确认后告诉我，我启动 Sprint。"

> **参考**：规划 Sprint 时阅读 `docs/pm-practices/scrum.md` 了解 Sprint 机制和容量规划原则。

### 🛑 决策点
用户确认 Sprint 计划后，Agent 才能执行 `sprint start`。

---

## 阶段 3：执行迭代

### 目标
按 Sprint 计划逐个完成 Task，保持用户知情。

### 每个 Task 的执行流程

1. 查看待办：
   ```bash
   node ${SKILL_DIR}/scripts/cli.js task list --sprint sprint-1 --status todo
   ```

2. 读取验收标准：
   ```bash
   node ${SKILL_DIR}/scripts/cli.js task show task-001
   ```

3. 标记开始（使用 start 复合命令）：
   ```bash
   node ${SKILL_DIR}/scripts/cli.js task start task-001
   ```
   此命令自动完成：验证依赖 → 读取 AC → 更新状态为 in_progress

4. 编码实现。

5. 完成后标记 done（CLI 自动校验依赖）：
   ```bash
   node ${SKILL_DIR}/scripts/cli.js task update task-001 --status done
   ```

6. 记录工作日志：
   ```bash
    node ${SKILL_DIR}/scripts/cli.js log create --sprint sprint-1 --event "task_done" --summary "实现登录功能"
   ```

### 引导话术

> "开始处理 task-001 登录功能。当前进度：0/5 done。"
>
> "task-003 被阻塞——邮件服务未配置。需要我创建新 Task 处理邮件配置吗？"
>
> "今日完成：登录、注册。进行中：首页。明天继续。"
>


### 日常结束时
- 确保所有完成的 Task 已 `update --status done`
- 执行 `log today` 记录当天工作
- 告诉用户今天的进展

> **参考**：标记 done 前阅读 `docs/pm-practices/dod-checklist.md` 逐项检查；编码时参考 `docs/pm-practices/conventional-commits.md` 的 commit 格式。

---

## 阶段 4：验收复盘

### 目标
关闭 Sprint，生成总结，帮助用户决定下一步。

### Agent 行为

1. 检查遗留 Task：
   ```bash
   node ${SKILL_DIR}/scripts/cli.js task list --sprint sprint-1 --status todo
   node ${SKILL_DIR}/scripts/cli.js task list --sprint sprint-1 --status in_progress
   ```

2. 展示完成情况（done/total，完成率）。

3. 列出未完成 Task 及原因，建议去向（下个 Sprint / 关闭）。

4. **等待用户确认后**，关闭 Sprint：
   ```bash
   node ${SKILL_DIR}/scripts/cli.js sprint close sprint-1
   ```

### 引导话术

> "Sprint 1 完成情况：4/5 done（80%）。task-005 样式优化未完成——需要设计输入。"
>
> "未完成的 task-005 建议迁移到 Sprint 2，你觉得呢？"
>
> "确认关闭 Sprint 1 吗？关闭后会生成总结并迁移未完成任务。"

### 🛑 决策点
用户确认 Sprint 关闭、遗留 Task 去向、Milestone 是否需要调整。

---

## 数据模型速查

| 实体 | 目录 | 状态流转 | 用途 |
|------|------|----------|------|
| Task | `.openpm/tasks/` | `todo` → `in_progress` → `done` | 最小可分配工作单元 |
| Sprint | `.openpm/sprints/` | `plan` → `active` → `done` | 迭代容器，按任务批次驱动 |
| Epic | `.openpm/epics/` | `todo` → `in_progress` → `done` | 跨 Sprint 需求聚合 |
| Log | `.openpm/logs/` | 按 Sprint/事件 | 每日工作记录 |
| Summary | `.openpm/sprints/` | 自动生成 | Sprint 复盘依据 |

Task 字段：`id`, `title`, `status`, `priority` (high/medium/low), `type` (story/task/bug), `sprint`, `epic`, `depends_on` (数组), `ac` (验收标准数组)
Sprint 字段：`id`, `name`, `goal`, `status`

## 命令参考

常用命令速查。完整参考见 `references/commands.md`。

```bash
node ${SKILL_DIR}/scripts/cli.js <entity> <action> [--flags]
```

### 常用操作

```bash
# 查看状态
node ${SKILL_DIR}/scripts/cli.js task list [--sprint sprint-x] [--status todo|in_progress|done]
node ${SKILL_DIR}/scripts/cli.js sprint list
node ${SKILL_DIR}/scripts/cli.js epic list

# 创建实体
node ${SKILL_DIR}/scripts/cli.js task create --title "..." --status todo --priority medium --type task [--epic epic-x]
node ${SKILL_DIR}/scripts/cli.js sprint create --name "..." --goal "..."
node ${SKILL_DIR}/scripts/cli.js epic create --title "..."

# 状态流转
node ${SKILL_DIR}/scripts/cli.js task start <task-id>        # 验证依赖 → 读 AC → 标记 in_progress
node ${SKILL_DIR}/scripts/cli.js task update <task-id> --status done

# Sprint 生命周期
node ${SKILL_DIR}/scripts/cli.js sprint start --id sprint-1   # 🛑 需用户确认
node ${SKILL_DIR}/scripts/cli.js sprint close sprint-1        # 🛑 需用户确认

# 日常记录
node ${SKILL_DIR}/scripts/cli.js log create --sprint <id> --event <type> --summary "..."

# 仪表盘
node ${SKILL_DIR}/scripts/cli.js web [--port 23214]
```

## 工程实践

### 工作原则

以下是 Agent 在执行项目管理时的行为准则。理解每条规则背后的原因，比机械执行更重要。

**修改前先确认状态** — 实体可能已被其他操作改变。`show` 或 `list` 确保你基于最新数据做决策，而非过期记忆。

**done 前闭合依赖** — 如果 B 依赖 A 而 A 未完成，标记 B 为 done 会产生假性进度。CLI 在 `task update --status done` 时自动校验 `depends_on` 并拒绝不合法操作——但 Agent 也应主动理解依赖关系，不依赖 CLI 兜底。

**一个 Task 聚焦一件事** — 如果编码涉及多个独立关注点，拆成多个 Task 而非塞进一个。粒度标准：单个 Task 聚焦一件事，按功能/模块边界判断粒度。

**完成即记录** — 编码完成后立即 `task update --status done`，不等积累。延迟更新会导致状态与实际进度脱节，破坏 Sprint 燃尽图和完成率统计的准确性。

**关键决策等用户拍板** — Sprint 启动和关闭是不可逆或难以回滚的操作，必须用户明确确认后才能执行。这些节点在流程中标记为 🛑。

### 质量标准

- **DoD**：Task 标记 done 前，验收标准全满足、依赖已闭合、commit 含 task-id。详细检查清单见 `docs/pm-practices/dod-checklist.md`
- **Task 粒度**：单个 Task 聚焦一件事。按功能边界拆分。INVEST 原则见 `docs/pm-practices/invest.md`
- **Sprint 容量**：合理的 Task 数量，保持可管理范围。Scrum 指南见 `docs/pm-practices/scrum.md`
- **Commit 规范**：每个 commit 对应一个 Task，格式 `feat(task-xxx): 描述`。详见 `docs/pm-practices/conventional-commits.md`
- **AC 写法**：可验证陈述句。如"输入正确密码后 3 秒内跳转首页"，而非"登录功能正常"
- **依赖**：每个 Task 的 depends_on ≤ 2 个

### references 索引

当遇到以下场景时，阅读对应的参考文件获取详细指导：

| 场景 | 阅读 |
|------|------|
| Task 拆解质量评估 | `docs/pm-practices/invest.md` |
| Sprint 机制和容量规划 | `docs/pm-practices/scrum.md` |
| done 前检查清单 | `docs/pm-practices/dod-checklist.md` |
| commit 格式规范 | `docs/pm-practices/conventional-commits.md` |
| 需求模糊需要价值观引导 | `docs/pm-practices/agile-principles.md` |
| 完整 CLI 命令参考 | `references/commands.md` |
