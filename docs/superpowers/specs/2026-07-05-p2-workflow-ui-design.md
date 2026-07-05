# P2：工作流 Stepper + 审批提醒 + 侧边栏重排

## 目的

让用户打开 Web Dashboard 时能一眼知道三件事：

1. **项目在哪个阶段**（定义需求 / 规划迭代 / 执行迭代 / 验收复盘）
2. **有什么需要我决策**（待分配 Task、待启动 Sprint、待复盘 Sprint）
3. **用什么顺序浏览**（从宏观到微观，符合认知流）

## 设计原则

- **数据派生，不新增存储**：所有展示从现有 API 数据推导，不增加新接口或新实体
- **只读展示**：Web Dashboard 仍然是只读的。所有操作通过 Agent + CLI 完成
- **全局可见**：Stepper 和审批提醒在所有页面都显示，不随页面切换消失

## 功能 1：工作流 Stepper

### 位置

主内容区域顶部，页面标题和内容之间。`#page-header` 之后，`#page-content` 之前。

### 视觉效果

横向四阶段进度条：

```
✓ 定义需求 ─ ● 规划迭代 ─ ③ 执行迭代 ─ ④ 验收复盘
```

- **已完成阶段**：绿色 ✓ + 阶段名（正常字重）
- **当前阶段**：蓝色圆底 + 编号 + 加粗阶段名
- **未来阶段**：灰色编号 + 阶段名（muted）

### 阶段判定逻辑（前端实现）

```javascript
function derivePhase(stats, sprints, epics) {
  var hasActiveSprint = sprints.some(function(s) {
    return s.status === 'active';
  });
  var hasExpiredSprint = sprints.some(function(s) {
    return s.status === 'active' && new Date(s.end_date) < new Date();
  });

  if (hasExpiredSprint) return 4;       // 验收复盘
  if (hasActiveSprint)  return 3;       // 执行迭代
  if (stats.totalTasks > 0) return 2;   // 规划迭代
  return 1;                             // 定义需求
}
```

### 数据来源

- `/api/stats`：totalTasks, activeSprint
- `/api/sprints`：sprints 的 status 和 end_date
- `/api/epics`：判断是否有 Epic（用于阶段 1 判定）

## 功能 2：审批提醒

### 位置

Stepper 条的右侧，以黄色 badge 形式呈现。

### 提醒类型与触发条件

| 提醒文案 | 触发条件 | 数据来源 |
|----------|----------|----------|
| N 个 Task 待分配 Sprint | 有 Task 状态为 todo 且 sprint 字段为空 | `/api/tasks` |
| Sprint 'X' 待启动 | 有 Sprint 状态为 plan | `/api/sprints` |
| Sprint 'X' 待复盘 | 有 Sprint 状态为 active 且 end_date 已过 | `/api/sprints` |

### 优先级

多个提醒同时存在时，按以下优先级展示（最多显示 2 个，其余用 "+N" 折叠）：

1. Sprint 待复盘（最紧迫）
2. Sprint 待启动
3. Task 待分配 Sprint

## 功能 3：侧边栏重排

### 当前顺序

```
看板 → 迭代 → 专题树 → 时间线 → 工作日志
```

### 新顺序（宏观→微观）

```
专题树 → 迭代 → 看板 → 时间线 → 工作日志
```

**理由**：用户打开 Dashboard 的浏览路径应该是：先看"要做什么"（专题树），再看"这轮做哪些"（迭代），然后看"正在做什么"（看板），关注"什么时候交付"（时间线），最后追溯"做了什么"（工作日志）。

## 文件改动

| 文件 | 改动 | 说明 |
|------|------|------|
| `openpm/scripts/web-ui/index.html` | 修改 | 侧边栏导航重排；在 `#page-header` 后插入 `<div id="workflow-bar"></div>` |
| `openpm/scripts/web-ui/app.js` | 修改 | 新增 `renderWorkflowBar()`；`navigate()` 中每次页面切换时调用 |
| `openpm/scripts/web-ui/style.css` | 修改 | 新增 `.workflow-bar`、`.wf-step`、`.wf-alert` 等 CSS 类 |
| `openpm/scripts/web/api.js` | **不改** | 所有数据从现有接口获取 |

## 实施优先级

单个实施单元，约 2-3 个改动点：

1. CSS：workflow bar 样式（stepper 圆圈、连线、badge）
2. app.js：阶段判定 + 审批推导 + 渲染逻辑
3. index.html：DOM 容器 + 侧边栏重排
