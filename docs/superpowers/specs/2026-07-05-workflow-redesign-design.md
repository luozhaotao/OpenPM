# OpenPM 工作流重新设计

## 目的

固化一套统一的工作流规范，同时服务于两个受众：

- **用户（人）**：通过 Web Dashboard 理解项目状态、分配任务、做出决策
- **Agent（AI）**：通过 SKILL.md 和 CLI 执行任务、引导用户走完流程

当前状态：SKILL.md 是一份 CLI 命令参考手册，Web Dashboard 是只读数据展示。两者都不提供工作流引导。

## 设计原则

1. **用户驱动流程**：用户定义需求、规划迭代、验收结果。Agent 是执行者和导航员。
2. **Agent 双重角色**：Agent 不仅要执行 Task，还要主动引导用户：告知当前位置、提示下一步、请求决策。
3. **每个实体有明确作用**：Task、Sprint、Epic、Milestone、Log 各自承担不可替代的职责。
4. **渐进复杂度**：核心流程仅需 Task + Sprint；Epic 和 Milestone 在需要时引入。

## 实体模型

### 六实体职责

| 实体 | 职责 | 创建者 | 生命周期 |
|------|------|--------|----------|
| **Task** | 最小可分配工作单元。用户与 Agent 的契约界面，验收标准是核心条款。 | Agent 建议 → 用户确认 | todo → in_progress → done |
| **Sprint** | 固定时间盒，约束 WIP，控制交付节奏。用户说"开始"和"停"的开关。 | Agent 创建 → 用户确认后启动 | plan → active → done |
| **Epic** | 跨 Sprint 的需求聚合。用户向 Agent 表达"大方向"的语言，提供上下文。 | 用户提出 → Agent 创建 | todo → in_progress → done（从 Task 自动推导） |
| **Milestone** | 时间锚点。多 Epic 汇聚的交付检查点。单 Epic 项目不需要。 | 用户提出 → Agent 创建 | upcoming → current → done |
| **Log** | 每日工作记录。回答"今天做了什么"，为 Sprint Summary 提供原始数据。 | Agent 每日记录 | 按日期，不可变 |
| **Summary** | Sprint 复盘依据。自动生成于 sprint close，展示完成率、遗留项。 | 自动生成 | 只读 |

### 实体关系

```
Milestone (时间锚点)
    │
    ▼
Epic (需求容器) ──→ Task ──→ Sprint (时间盒)
                        │
                        ▼
                     Log (工作记录)
```

Epic 是需求维度的组织单元，Sprint 是时间维度的组织单元。两者正交。Task 横跨两者：属于一个 Epic，归属于一个 Sprint。

## 四阶段工作流

### 阶段判断逻辑

Agent 通过检查数据状态判断当前阶段：

- 无 Epic 且无 Task → 阶段 1：定义需求
- 有 Task 但无活跃 Sprint → 阶段 2：规划迭代
- 有活跃 Sprint（status=active）→ 阶段 3：执行迭代
- Sprint 到期且有活跃 Sprint → 阶段 4：验收复盘

### 阶段 1：定义需求

**用户动作**：向 Agent 描述要做什么。

**Agent 动作**：

1. 判断是否需要新建 Epic。若需要，创建 Epic。
2. 建议 Task 拆解方案。
3. 为每个 Task 编写验收标准。不确定的 AC 主动向用户澄清。
4. 等待用户确认拆解方案。

**Agent 引导话术**：

> "这个功能属于哪个 Epic？目前有：epic-xxx 用户认证系统。"
>
> "我建议拆为以下 Task：1. 登录 2. 注册 3. 找回密码。你看合理吗？"
>
> "登录功能的验收标准我暂定为：输入账号密码后 3 秒内完成验证并跳转首页。需要补充什么吗？"

**🛑 决策点**：用户确认 Task 拆解和 AC。

**涉及实体**：Epic（创建）、Task（创建并关联 Epic）

### 阶段 2：规划迭代

**用户动作**：决定这个 Sprint 做什么、不做什么。

**Agent 动作**：

1. 展示所有待规划 Task，按 Epic 分组。
2. 根据优先级和依赖关系建议 Sprint 内容。
3. 提示容量：当前选了 X 个 Task（建议 5-12 个）。
4. 检查依赖：A 依赖 B，则 B 必须在同一或更早 Sprint。
5. 创建 Sprint 并关联 Task。
6. 等待用户明确确认后执行 `sprint start`。

**Agent 引导话术**：

> "当前有 8 个待规划 Task。我建议 Sprint 1 包含前 5 个：登录、注册、首页、导航、样式。容量 5/12。"
>
> "找回密码依赖登录，必须和登录在同一 Sprint——所以也包含在内。"
>
> "Sprint 1 已创建。请在 Dashboard 查看计划。确认后告诉我，我启动 Sprint。"

**🛑 决策点**：用户确认 Sprint 计划，Agent 执行 `sprint start`。

**涉及实体**：Sprint（创建并激活）、Task（关联 Sprint）

### 阶段 3：执行迭代

**用户动作**：通过 Dashboard 监控进度（Kanban、Sprint 统计、Worklog）。

**Agent 动作（每完成一个 Task）**：

1. `task list --sprint <sprint> --status todo` — 查看待办
2. `task show <task-id>` — 读取验收标准
3. `task update <task-id> --status in_progress` — 标记开始
4. 编码实现
5. `task update <task-id> --status done` — 标记完成
6. `log today --summary "..." --tasks "<task-id>:done"` — 记录日志

**Agent 引导话术**：

> "开始处理 task-001 登录功能。当前进度：0/5 done。"
>
> "task-003 被阻塞——邮件服务未配置。需要我创建新 Task 处理邮件配置吗？"
>
> "今日完成：登录、注册。进行中：首页。明天继续。"

**涉及实体**：Task（状态流转）、Log（每日记录）

### 阶段 4：验收复盘

**用户动作**：查看 Sprint Summary，评估交付成果，决定下一步。

**Agent 动作**：

1. `task list --sprint <sprint> --status todo` — 检查遗留
2. 展示完成情况：done/total，完成率
3. 列出未完成任务及原因
4. 建议未完成任务去向：下个 Sprint / 关闭 / 新建 Epic
5. 等待用户确认后执行 `sprint close`

**Agent 引导话术**：

> "Sprint 1 完成情况：4/5 done（80%）。task-005 样式优化未完成——需要设计输入。"
>
> "未完成的 task-005 建议迁移到 Sprint 2，你觉得呢？"
>
> "确认关闭 Sprint 1 吗？关闭后会生成总结并迁移未完成任务。"

**🛑 决策点**：用户确认 Sprint 关闭和遗留任务去向。

**涉及实体**：Sprint（关闭）、Summary（自动生成）

## Agent 双重角色

Agent 在每个阶段扮演两个角色：

| 角色 | 职责 | 产出 |
|------|------|------|
| **执行者** | 通过 CLI 操作实体（创建、更新、删除） | 文件系统中的数据变更 |
| **导航员** | 告知用户当前位置、提示下一步、请求决策 | 对话中的引导信息 |

SKILL.md 需要同时编码这两种行为：不仅写"执行什么命令"，还要写"对用户说什么、等待什么决策"。

## 痛点与解决方案

按严重度排序：

| # | 痛点 | 维度 | 影响 | 严重度 | 方案 |
|---|------|------|------|--------|------|
| 1 | Agent 每 Task 要 5-6 次 CLI 调用 | 心智负担 | Agent | 🔴 高 | 提供复合命令：`task start <id>` 自动完成 list→show→update in_progress |
| 2 | 用户没有审批节点，创建即生效 | 信息流转 | 用户 | 🔴 高 | SKILL.md 强制 Agent 在关键节点等待用户确认后才继续 |
| 3 | Web Dashboard 纯只读 | 角色分工 | 用户 | 🟡 中 | 评估是否需要 Web 写操作（至少 Task 创建/编辑） |
| 4 | 依赖检查全靠 Agent 自觉 | 边界异常 | Agent | 🟡 中 | CLI 在 `task update --status done` 时自动校验 depends_on |
| 5 | 一个 Task 一个 Commit 限制效率 | 心智负担 | Agent | 🟡 中 | 允许批量创建 Task（一个 commit 包含多个 task create） |
| 6 | Sprint close 行为边界不明确 | 边界异常 | 双方 | 🟡 中 | 定义 in_progress Task 的关闭行为，增加 close 前确认 |
| 7 | 没有 Task 阻塞状态 | 信息流转 | 用户 | 🟢 低 | 考虑增加 blocked 状态或备注字段 |
| 8 | Epic 状态与 Task 进度脱节 | 信息流转 | 双方 | 🟢 低 | Epic 状态从关联 Task 自动推导 |

## SKILL.md 改造要求

当前 SKILL.md 结构：命令参考手册（列出 entity → action → flags）。

目标结构：**工作流剧本**，包含：

1. **阶段判断**：如何通过检查数据状态识别当前阶段
2. **阶段行为**：每个阶段 Agent 要做什么、对用户说什么
3. **决策点**：哪些操作必须等待用户确认（🛑 Gate）
4. **异常处理**：阻塞、依赖未满足、用户犹豫时的行为
5. **命令参考**：作为附录保留，供执行时查阅

## Web Dashboard 改造要求

当前 Web Dashboard 结构：5 个数据展示页面（Kanban、Sprint、Epic Tree、Timeline、Worklog）。

目标增强：

1. **工作流状态指示器**：顶部显示当前阶段（定义/规划/执行/复盘）
2. **下一步引导**：提示用户可执行的操作（如"3 个 Task 待分配 Sprint"）
3. **审批提醒**：Agent 创建待审批内容时醒目提示

## 实施优先级

### P0 — 必须（阻塞工作流顺畅度）
- SKILL.md 改造为工作流剧本（含阶段判断、引导话术、决策点）
- CLI 依赖自动校验（`task update --status done` 时检查 depends_on）

### P1 — 重要（显著改善体验）
- 复合命令（`task start`）
- Sprint close 行为明确化
- 批量 Task 创建支持

### P2 — 增强（锦上添花）
- Web Dashboard 工作流状态指示器
- Task 阻塞状态
- Epic 状态自动推导
- Web Dashboard 审批提醒
