# OpenPM CLI CRUD 补全设计

**日期**: 2026-07-01  
**状态**: 待实现  
**目标**: 补齐 sprint、epic、milestone、log 四个实体的 show/update/delete 命令，使所有实体具备完整 CRUD 能力，消灭 AI Agent "无法通过 CLI 操作只能手动改文件"的借口。

---

## 动机

当前 CLI 命令覆盖度：

| 实体 | create | list | show | update | delete |
|------|--------|------|------|--------|--------|
| Task | ✅ | ✅ | ✅ | ✅ | ✅ |
| Sprint | ✅ | ✅ | ❌ | ❌ | ❌ |
| Epic | ✅ | ✅ | ✅ | ❌ | ❌ |
| Milestone | ✅ | ✅ | ❌ | ❌ | ❌ |
| Log | ✅ | ✅ | ❌ | ❌ | ❌ |

在实际使用中，AI Agent 因 milestone 缺少 update 命令，直接修改了 `.openpm/milestones/` 下的 Markdown 文件，违反了"只用 CLI，不碰文件"的核心约束。补全 CRUD 是从根本上消除这个问题。

---

## 设计原则

1. **严格遵循现有模式**：每个命令文件 `switch(action)` + `parseMarkdown`/`writeMarkdown` + `{ ok: true/false, ... }`，与 task 命令保持一致
2. **带安全校验**：删除时检查下游引用，拒绝误删；更新时校验状态流转方向
3. **接口对称**：同类型命令在不同实体间接口一致，降低 AI Agent 学习成本

---

## 安全规则

### 删除引用检查

- sprint delete：扫描 `.openpm/tasks/` 中 `sprint` 字段匹配的文件，有则返回错误，需 `--force` 强制删除
- epic delete：同上，扫描 `epic` 字段
- milestone delete：无下游引用，直接删除

错误格式：
```json
{ "ok": false, "error": "Sprint sprint-1 关联 3 个任务(task-001, task-002, task-003)。使用 --force 强制删除。" }
```

### 状态流转校验

update 操作只允许状态向前流转，拒绝回退：

| 实体 | 合法流转 |
|------|----------|
| Sprint | `plan` → `active` → `done` |
| Epic | `todo` → `in_progress` → `done` |
| Milestone | `upcoming` → `current` → `done` |

不在合法流转列表中的状态变更将被拒绝：
```json
{ "ok": false, "error": "Sprint sprint-1 状态 done 不允许回退到 active" }
```

未提供 `--status` 参数时不校验（只改其他字段）。

---

## 新增命令详情

### 1. Sprint — 新增 `show`、`update`、`delete`

```
openpm sprint show <sprint-id>
openpm sprint update <sprint-id> [--name "..." --goal "..." --start ... --end ... --status active]
openpm sprint delete <sprint-id> [--force]
```

**show**：解析 sprint 文件返回 `{ ok, sprint: { id, name, goal, status, start_date, end_date, body } }`，附带关联任务数量 `taskCount`。

**update**：可更新字段 `name`, `goal`, `start_date`, `end_date`, `status`。仅覆盖传入的字段，未传入的保持不变。更新 `status` 时校验流转合法性。

**delete**：扫描 `tasks/` 目录检查 `sprint` 引用。有关联任务且无 `--force` 则拒绝。同时删除 sprint 文件，但不删除 `-summary.md`。

**delete --force**：跳过引用检查，直接删除 sprint 文件。

### 2. Epic — 新增 `update`、`delete`

```
openpm epic update <epic-id> [--title "..." --status in_progress]
openpm epic delete <epic-id> [--force]
```

**update**：可更新字段 `title`, `status`。状态校验流转 `todo → in_progress → done`。

**delete**：扫描 `tasks/` 目录检查 `epic` 引用。有关联任务且无 `--force` 则拒绝。

### 3. Milestone — 新增 `show`、`update`、`delete`

```
openpm milestone show <ms-id>
openpm milestone update <ms-id> [--name "..." --date ... --status current]
openpm milestone delete <ms-id>
```

**show**：解析 milestone 文件返回 `{ ok, milestone: { id, name, target_date, status, body } }`。

**update**：可更新字段 `name`, `target_date`, `status`。状态校验流转 `upcoming → current → done`。

**delete**：直接删除（无下游引用）。`--force` 也接受（保持接口对称），但无额外效果。

### 4. Log — 新增 `show`

```
openpm log show <date>
```

**show**：按日期读取日志文件返回 `{ ok, log: { date, tasks, body } }`。文件不存在返回 `{ ok, log: null, empty: true }`。

> `log today` 已支持 `--summary` 写入，等于 upsert。无需额外 update/delete。工作日志不应删除。

---

## 实现涉及文件

| 文件 | 改动 |
|------|------|
| `openpm/scripts/commands/sprint.js` | 新增 show/update/delete action，添加状态校验和引用检查 |
| `openpm/scripts/commands/epic.js` | 新增 update/delete action，添加状态校验和引用检查 |
| `openpm/scripts/commands/milestone.js` | 新增 show/update/delete action，添加状态校验 |
| `openpm/scripts/commands/log.js` | 新增 show action |
| `openpm/SKILL.md` | 命令参考表新增 show/update/delete 命令，更新核心约束说明 |

---

## 约束

- 不新增 npm 依赖，继续使用纯 Node.js 内置模块
- 输出格式与现有命令一致（默认 JSON，`--format markdown` 可选）
- `--project` 参数在所有新增命令中正常工作（通过 cwd 参数传递）
- 不修改现有命令的行为

---

## 无关项（故意不做）

- 不新增实体类型
- 不做批量操作（batch-update 等）
- 不新增 config CLI 管理
- 不做数据校验/修复命令
- log 不做 delete
- 不修改 task 命令
