# 设计规格：移除时间限制，面向 Agent

> 日期: 2026-07-08
> 状态: 已确认

## 1. 动机

OpenPM 当前面向人类团队设计，包含大量时间约束（Sprint 时间盒、Milestone 截止日、Task "1天内完成"）。当使用者是 AI Agent 而非人类时，这些时间约束没有意义——Agent 不需要时间盒管理节奏，不需要死线驱动紧迫感，不需要按天拆分任务。

核心原则：**Agent 操作数据，用事件而非时间驱动流程。**

## 2. 数据模型变更

### 2.1 Task

| 操作 | 详情 |
|------|------|
| 移除 | `created`、`updated` 时间戳字段 |
| 保留 | `id`、`title`、`status`、`epic`、`sprint`、`dependencies`、`ac`、`description` |
| 粒度规则 | 从「1 天内可完成」改为「单一关注点」——一个 Task 只做一件事 |

### 2.2 Sprint

| 操作 | 详情 |
|------|------|
| 移除 | `start_date`、`end_date` 字段 |
| 保留 | `id`、`status`、`goal`、`tasks` |
| 新增 | `task_count`（可选，用于容量参考） |
| 状态流转 | `plan → active → done` 不变 |
| Done 触发 | 所有关联 Task 状态为 `done`（非时间到期） |

### 2.3 Epic

| 操作 | 详情 |
|------|------|
| 移除 | `created`、`updated` 时间戳字段 |
| 保留 | 其余字段不变 |

### 2.4 Milestone

| 操作 | 详情 |
|------|------|
| 删除 | 整个实体类型，包括 CLI 命令、模板、数据目录、Web 时间线页 |

### 2.5 Log

| 操作 | 详情 |
|------|------|
| 改为 | 事件日志——无时间戳，纯文本，记录关键决策和阻塞项 |
| 组织 | 按 Sprint/迭代维度关联，不再按日期组织 |

## 3. 工作流变更

### 3.1 4 阶段推进：纯事件驱动

```
阶段 1 (需求定义)
  └─ → 阶段 2: 所有需求已拆解为 Task，用户确认后

阶段 2 (迭代规划)
  └─ → 阶段 3: 用户确认 Sprint 启动

阶段 3 (执行)
  └─ → 阶段 4: Sprint 内所有 Task 状态为 done

阶段 4 (验收复盘)
  └─ → 阶段 1: 用户确认复盘完成
```

### 3.2 Agent 行为变更 (SKILL.md)

- 删除「Sprint 到期 + 有活跃 → 阶段 4」判定逻辑
- 🛑 关键决策点减为 3 个：
  1. 确认 Task 拆解和验收标准（阶段 1）
  2. 确认 Sprint 启动（阶段 2）
  3. 确认 Sprint 复盘完成，处理遗留 Task（阶段 4）

### 3.3 Web UI 变更

| 函数/页面 | 变更 |
|-----------|------|
| `derivePhase()` | 移除 `new Date(s.end_date) < new Date()` 判定，改为检测「当前 Sprint 所有 Task 是否 done」 |
| `deriveAlerts()` | 移除「Sprint 过期待复盘」检测，改为「Sprint 所有 Task done → 待复盘」 |
| `sprint.html` | 移除日期展示行 |
| `timeline.html` | 删除（Milestone 已不存在） |
| `worklog.html` | 改为事件日志视图 |
| `index.html` | 侧边栏移除时间线和 Milestone 导航项 |

## 4. 保留不变

以下基础设施时间配置保留不动（非面向用户的时间约束）：

| 配置 | 值 | 理由 |
|------|-----|------|
| Web 自动刷新 | 30s | 前端轮询，保证仪表盘数据新鲜 |
| 内存缓存 TTL | 5s | 文件读取缓存，避免重复 I/O |
| 网络超时 | 500ms | 端口探测，防止挂死 |

## 5. 文件改动清单

### CLI / 命令层

| 文件 | 改动 |
|------|------|
| `scripts/cli.js` | 删除 milestone 路由分支 |
| `scripts/commands/sprint.js` | 移除 `--start`/`--end` 参数；关闭条件改为「所有 Task done」 |
| `scripts/commands/task.js` | 移除 `created`/`updated` 时间戳写入 |
| `scripts/commands/milestone.js` | **删除** |
| `scripts/commands/log.js` | 改为事件日志：按 Sprint 关联，无日期 |

### 模板

| 文件 | 改动 |
|------|------|
| `templates/task.md` | 移除 `created`/`updated` 字段 |
| `templates/sprint.md` | 移除 `start_date`/`end_date` |
| `templates/milestone.md` | **删除** |
| `templates/log.md` | 改为事件记录模板 |

### Web 服务端

| 文件 | 改动 |
|------|------|
| `scripts/web/api.js` | 删除 Milestone 路由，调整 Sprint 关闭逻辑 |

### Web 前端

| 文件 | 改动 |
|------|------|
| `app.js` | 重写 `derivePhase()` 和 `deriveAlerts()` |
| `sprint.html` | 移除日期展示 |
| `timeline.html` | **删除或重构** |
| `worklog.html` | 改为事件日志视图 |
| `index.html` | 侧边栏调整 |

### 文档

| 文件 | 改动 |
|------|------|
| `openpm/SKILL.md` | 删除时间约束描述，重写阶段触发条件 |
| `openpm/README.md` | 更新面向用户说明 |
| `docs/pm-practices/scrum.md` | 标记时间内容为「人类团队参考」 |

**总计约 15 个文件（含 2 个删除）。**
