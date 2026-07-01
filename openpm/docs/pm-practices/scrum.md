# Scrum 指南

> 来源：*The Scrum Guide* — Ken Schwaber & Jeff Sutherland (2020)
> 本文档摘录 Scrum 框架的核心内容，供 AI Agent 在执行项目管理时正确应用。

---

## 1. Scrum 定义

Scrum 是一个轻量级框架，通过针对复杂问题的自适应解决方案，帮助人们、团队和组织创造价值。

Scrum 基于**经验主义**（empiricism）和**精益思维**（lean thinking）。经验主义主张知识来自经验，决策基于观察。Scrum 的三大支柱：

| 支柱 | 说明 |
|------|------|
| **透明**（Transparency） | 工作过程与产出对执行者和接收者可见。低透明度的决策价值降低、风险升高 |
| **检视**（Inspection） | 频繁检视 Scrum 工件和 Sprint 目标进展，发现偏差。检视不应过度干扰工作 |
| **适应**（Adaptation） | 检视发现偏离可接受范围时，必须尽快调整。调整越迟，偏差越大 |

---

## 2. Scrum 团队

Scrum 团队由 1 名 Scrum Master、1 名 Product Owner 和 Developers 组成。团队是跨职能（cross-functional）且自管理（self-managing）的单元。典型规模为 **10 人以下**。

### 2.1 Developers（开发人员）

- 负责创建每个 Sprint 可用的 Increment
- 承诺实现 Sprint Goal
- 对 Sprint Backlog 及其每日计划负责
- 相互负责，保持高标准的质量

### 2.2 Product Owner（产品负责人）

- 最大化 Scrum 团队工作的产品价值
- 有效管理 Product Backlog：
  - 开发和明确沟通 Product Goal
  - 创建并沟通 Product Backlog 条目
  - 排序 Product Backlog 条目
  - 确保 Product Backlog 透明、可见、可理解

### 2.3 Scrum Master

- 以多种方式服务 Scrum 团队和组织，确保 Scrum 被理解和实践
- 服务 Scrum 团队：教练自管理和跨职能、移除障碍、确保事件积极高效
- 服务 Product Owner：帮助找到有效 Product Goal 定义和 Backlog 管理技术
- 服务组织：领导/培训/教练 Scrum 采用、规划建议、移除障碍

---

## 3. Scrum 事件

5 个事件构成 Sprint 的节奏循环。每个事件都是检视和适应的正式机会。

### 3.1 Sprint（冲刺）

- **时长**：固定长度，**1 个月以内**。新 Sprint 在上一个 Sprint 结束后立即开始
- **内容**：完成 Increment 所需的所有工作——Sprint Planning、Daily Scrum、Sprint Review、Sprint Retrospective
- **规则**：
  - 不允许做出危及 Sprint Goal 的变更
  - 不降低质量
  - Product Backlog 在需要时可重新精炼（refinement）
  - 如果 Sprint Goal 变得过时，只有 Product Owner 可以取消 Sprint

### 3.2 Sprint Planning（冲刺规划）

- **时长**：最长 **8 小时**（1 个月 Sprint）
- **回答三个问题**：
  1. **Sprint 为什么有价值？** → Product Owner 提出 Sprint Goal
  2. **这个 Sprint 能完成什么？** → 从 Product Backlog 选取条目到 Sprint Backlog
  3. **选定的工作如何完成？** → 每个选定的 Backlog 条目制定完成计划（分解为一天以内的工作单元）

### 3.3 Daily Scrum（每日站会）

- **时长**：**15 分钟**，每天同一时间同一地点
- **目的**：检视 Sprint Goal 进展，调整 Sprint Backlog
- **结构**：Developers 自选方式。聚焦于进展，产生可行动的计划

### 3.4 Sprint Review（冲刺评审）

- **时长**：最长 **4 小时**（1 个月 Sprint）
- **目的**：检视 Sprint 产出并确定未来调整
- **内容**：Scrum 团队向利益相关者展示工作成果，讨论进展和 Product Backlog 调整

### 3.5 Sprint Retrospective（冲刺回顾）

- **时长**：最长 **3 小时**（1 个月 Sprint）
- **目的**：规划提升质量和效率的方式
- **内容**：检视上个 Sprint 在人、交互、过程、工具和 DoD 方面的表现，识别最有帮助的改进，纳入下个 Sprint

---

## 4. Scrum 工件

每个工件包含一个**承诺**（Commitment），提供可检视和适应的信息。

### 4.1 Product Backlog + Product Goal（承诺）

- **Product Backlog**：涌现的、有序的改进清单。所有工作的唯一来源
- **Product Goal**：Product Backlog 的承诺——描述产品的未来状态，是规划的目标
- 条目属性：描述、估算、排序、价值

### 4.2 Sprint Backlog + Sprint Goal（承诺）

- **Sprint Backlog**：Sprint Goal + 选定的 Product Backlog 条目 + 交付 Increment 的可执行计划
- **Sprint Goal**：Sprint Backlog 的承诺——Sprint 的单一目标，为 Developers 提供聚焦和灵活性
- 足够具体有焦点，足够灵活允许协商

### 4.3 Increment + Definition of Done（承诺）

- **Increment**：迈向 Product Goal 的具体垫脚石。每个 Increment 叠加在前一个上，经验证可协同工作
- **Definition of Done（DoD）**：Increment 的承诺——质量要求的正式描述
- 工作不符合 DoD 则不能发布甚至不能出现在 Sprint Review 中
- 组织级 DoD 为最低标准，Scrum 团队可制定更严格的标准

---

## 5. 与 OpenPM 的映射

| Scrum 概念 | OpenPM 映射 |
|-----------|-------------|
| Sprint | `sprint` 实体，状态 `plan` → `active` → `done` |
| Sprint Goal | `sprint.goal` 字段 |
| Product Backlog 条目 | `task` 实体（作为 Sprint 候选） |
| Sprint Backlog | 关联到某个 `sprint` 的 `task` 集合 |
| Increment | Sprint 结束时所有 `status: done` 的 task |
| DoD | `task.ac`（验收标准）+ 硬性规则中的依赖检查 |
| Sprint Planning | `openpm sprint create` + 批量 `task create` + `sprint start` |
| Sprint Review | `openpm sprint close`（自动生成 summary） |
| Sprint Retrospective | Sprint summary 中的反思部分 |
| Daily Scrum | `openpm task list --status todo` + `log today` |
