# OpenPM 中文化设计文档

**日期**: 2026-07-05
**状态**: 设计中

## 目标

将 OpenPM 的 SKILL.md 和 Web UI 全面中文化，统一专业术语，使中文用户获得一致、自然的使用体验。

## 术语表

以下术语映射为本次中文化的唯一标准：

| 英文 | 中文 | 说明 |
|------|------|------|
| Sprint | 迭代 | Scrum 框架的核心节奏单位 |
| Epic | 专题 | 跨迭代的大工作主题 |
| Story | 需求 | Task type 中的用户故事类型 |
| Bug | 缺陷 | Task type 中的缺陷类型 |
| Task（实体） | 任务 | 项目管理的原子工作单元 |
| Task（类型值） | 开发任务 | 纯技术实现类任务 |
| Log | 工作日志 | 每日工作记录 |
| Summary | 小结 | Sprint 闭合时自动生成的总结 |
| Milestone | 里程碑 | 项目关键时间节点 |
| todo | 待办 | 任务初始状态 |
| in_progress | 进行中 | 正在执行的状态 |
| done | 已完成 | 任务/Sprint/Milestone 的终态 |
| plan | 规划中 | Sprint 未激活状态 |
| active | 进行中 | Sprint 执行中状态 |
| upcoming | 计划中 | Milestone 未到状态 |
| current | 当前 | Milestone 进行中状态 |
| high / medium / low | 高 / 中 / 低 | 优先级标签 |

## 不翻译的内容

以下保留英文，因为它们属于程序接口而非用户界面：

- CLI 命令名：`task create`, `sprint list` 等
- CLI 参数名和值：`--status todo`, `--priority high`
- 数据模型字段名：`depends_on`, `ac`, `start_date`
- 文件路径和目录名：`.openpm/tasks/`, `openpm/scripts/`

## 实施方案

### 方案：共享映射层（推荐并采纳）

**核心思路**：在 `app.js` 顶部定义全局 `window.LABELS` 映射对象，所有 Web UI 页面统一引用。SKILL.md 同步对齐同一套术语。

**优点**：单一数据源，改一词全局生效；术语一致性有保障；易于扩展到 CLI 输出。

### Web UI 改动

#### 1. app.js — 新增 LABELS 对象，改页面标题

新增 `window.LABELS`：

```javascript
window.LABELS = {
  status: {
    todo: '待办',
    in_progress: '进行中',
    done: '已完成'
  },
  type: {
    story: '需求',
    task: '开发任务',
    bug: '缺陷'
  },
  priority: {
    high: '高',
    medium: '中',
    low: '低'
  },
  sprint_status: {
    plan: '规划中',
    active: '进行中',
    done: '已完成'
  },
  milestone_status: {
    upcoming: '计划中',
    current: '当前',
    done: '已完成'
  }
};
```

`pages` 对象中 "Epic 树" → "专题树", "Sprint" → "迭代"。

#### 2. index.html — 侧边栏

- "Epic 树" → "专题树"
- "Sprint" → "迭代"

#### 3. kanban.html — 看板页

- `renderCard()` 中 type/priority 显示用 `LABELS.type[t.type]` 和 `LABELS.priority[t.priority]` 映射
- 列标题、空状态文本已是中文，无需改动

#### 4. sprint.html — 迭代页

- sprint 状态用 `LABELS.sprint_status[s.status]` 映射
- "Sprint 小结" → "迭代小结"
- "活跃 Sprint" → "活跃迭代"
- "暂无 Sprint" → "暂无迭代"

#### 5. epic-tree.html — 专题页

- epic 状态用 `LABELS.sprint_status[e.status]` 映射
- "暂无 Epic" → "暂无专题"
- "Epic:" → "专题:"

#### 6. timeline.html — 时间线页

- sprint 状态用 `LABELS.sprint_status[s.status]` 映射
- milestone 状态用 `LABELS.milestone_status[m.status]` 映射
- "Sprint 时间线" → "迭代时间线"
- "暂无 Sprint" → "暂无迭代"

#### 7. worklog.html — 无需改动

所有用户可见文本已是中文。

### SKILL.md 改动

#### 数据模型速查表（第30-37行）

- "Epic" 行实体名 → "专题"
- "Log" 行说明 → "工作日志（按日期存储）"

#### Task 字段说明（第39行）

- `type (story/task/bug)` → `type (story/需求, task/开发任务, bug/缺陷)`

#### 命令参考子标题（第92行）

- "Epic / Milestone / Log / Summary" → "Epic（专题）/ Milestone（里程碑）/ Log（工作日志）/ Summary（小结）"

#### 章节标题

- "### Sprint Planning" → "### 迭代规划"
- "### Sprint 闭合" → "### 迭代闭合"

#### 正文术语替换（~8处）

- "Sprint Planning" → "迭代规划"
- "Sprint 容量" → "迭代容量"
- "Sprint Backlog 精简" → "迭代待办列表精简"
- "Story 类型任务" → "需求类型任务"
- "上一个/下个 Sprint" → "上一个/下个迭代"
- "未完成任务移入下个 Sprint" → "未完成任务移入下个迭代"

## 改动文件清单

| 文件 | 改动类型 |
|------|----------|
| `openpm/scripts/web-ui/app.js` | 新增 LABELS 对象；改 pages 标题 |
| `openpm/scripts/web-ui/index.html` | 改侧边栏文字 |
| `openpm/scripts/web-ui/kanban.html` | type/priority 映射 |
| `openpm/scripts/web-ui/sprint.html` | 状态映射；标题替换 |
| `openpm/scripts/web-ui/epic-tree.html` | 状态映射；文字替换 |
| `openpm/scripts/web-ui/timeline.html` | 状态映射；标题替换 |
| `openpm/SKILL.md` | 术语统一；章节标题翻译 |

## 验证方式

1. 启动 `openpm web`，浏览所有 5 个页面，确认无英文硬编码文本残留
2. 检查看板卡片上的标签（类型、优先级）显示中文
3. 检查 Sprint 页面的状态标签显示中文
4. 检查 Epic 树状态和统计标签显示中文
5. 检查时间线的迭代和里程碑状态显示中文
6. 通读 SKILL.md，确认术语一致、无遗漏英文
