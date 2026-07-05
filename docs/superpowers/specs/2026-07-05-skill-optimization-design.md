# OpenPM SKILL.md 优化设计

> 日期：2026-07-05
> 状态：设计完成，待实现

## 目的

优化 `openpm/SKILL.md`，解决三个核心问题：

1. **触发不足**：description 覆盖的场景太窄，用户需要显式调用
2. **结构扁平**：348 行单一文件，未利用渐进披露；`docs/pm-practices/` 下有 5 个参考文件但从未被引用
3. **规则刚性**：硬性规则只有"做什么"没有"为什么"，Agent 理解不深

参考 spec：[skill-design](./2026-06-30-openpm-skill-design.md)、[workflow-redesign](./2026-07-05-workflow-redesign-design.md)

## 改动范围

| 改动 | 文件 | 说明 |
|------|------|------|
| description 重写 | SKILL.md frontmatter | 全中文，扩展关键词和自然语言触发短语 |
| 结构重组 | 新增 `references/commands.md` | 从 SKILL.md 移出完整命令参考（约 70 行） |
| 渐进披露 | SKILL.md | 在 5 个关键位置引用 `docs/pm-practices/` 下的文件 |
| 规则→原理 | SKILL.md 工程实践节 | 5 条工作原则，每条解释原因；质量标准全部指向 docs |

### 不改变

- `scripts/`、`templates/`、`docs/pm-practices/` 内容完全不动
- 四阶段工作流逻辑、引导话术、决策点标记全部保留
- 核心约束（只用 CLI、决策等用户确认、完成即更新、可选 Web）保留

## 设计详情

### 1. 文件结构

```
openpm/
├── SKILL.md              (目标 ~200 行)
├── references/
│   └── commands.md        (新增，从 SKILL.md 移出)
├── docs/
│   └── pm-practices/      (已有，开始被引用)
├── scripts/               (不变)
└── templates/             (不变)
```

### 2. SKILL.md 最终结构

```
frontmatter (新 description)     (~5 行)
角色定义 + 核心约束               (~10 行)
阶段判断逻辑                      (~15 行)
阶段 1：定义需求                  (~25 行)
阶段 2：规划迭代                  (~25 行)
阶段 3：执行迭代                  (~25 行)
阶段 4：验收复盘                  (~20 行)
数据模型速查表                    (~15 行)
命令参考（关键命令速查）           (~15 行)
工程实践                          (~30 行)
references 索引                   (~10 行)
```

### 3. description 新文案

```
AI Agent 敏捷项目管理助手。当用户提到任何项目管理相关内容时必须激活——包括但不限于：任务、待办、Task、Sprint、迭代、Epic、Milestone、里程碑、进度、工作日志、验收标准、需求拆解、每日站会、Scrum、敏捷。也适用于日常对话式场景："今天做了什么""接下来做什么""项目进展如何""规划下个迭代""关闭这个 Sprint""还剩多少任务"。Agent 以执行者+导航员双重角色，通过 CLI 操作 .openpm/ 中的 Task/Sprint/Epic/Milestone/Log 实体，覆盖需求定义→迭代规划→执行→复盘全流程。
```

### 4. 各阶段命令精简

每阶段只保留 1-2 个关键命令示例，完整命令参考指向 `references/commands.md`。Agent 只需看到"有这个能力"，具体参数去 references 查。

### 5. docs/pm-practices/ 引用策略

| 文件 | 引用位置 | 触发条件 |
|------|---------|---------|
| `agile-principles.md` | 阶段 1 引导话术 | 用户需求模糊，需要价值观引导 |
| `invest.md` | 阶段 1 Task 拆解 | 评估 Task 质量 |
| `scrum.md` | 阶段 2 Sprint 规划 | 理解 Sprint 机制 |
| `dod-checklist.md` | 阶段 3 done 前 | 检查是否满足 DoD |
| `conventional-commits.md` | 阶段 3 编码 | commit 格式参考 |

引用方式：在 SKILL.md 中写"遇到 X 场景时，阅读 `docs/pm-practices/xxx.md` 获取详细指导。"

### 6. 工程实践改造

5 条工作原则（原"硬性规则"）：

1. **修改前先确认状态** — 实体可能已被其他操作改变，`show`/`list` 确保基于最新数据做决策
2. **done 前闭合依赖** — B 依赖 A 未完成时标记 B 为 done 产生假性进度；CLI 自动校验
3. **一个 Task 聚焦一件事** — 多关注点拆多 Task，粒度标准 1 天内可完成
4. **完成即记录** — 立即 `task update --status done`，延迟导致状态与实际进度脱节
5. **关键决策等用户拍板** — Sprint start/close 不可逆，必须用户确认；标记为 🛑

质量标准全部指向 docs/pm-practices/。

## 范围边界

**包含**：
- SKILL.md 的内容重组和描述优化
- 新增 `references/commands.md`
- SKILL.md 中引用现有 docs/pm-practices/

**不包含**：
- 修改 scripts/、templates/、docs/pm-practices/ 的内容
- 添加 evals/ 测试用例（后续迭代再做）
- 修改 CLI 命令行为
- 修改 Web 仪表盘
