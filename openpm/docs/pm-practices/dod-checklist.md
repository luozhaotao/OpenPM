# DoD 检查清单与 Sprint 管理

> 来源：基于 Scrum Guide 的 Definition of Done 条款和工程实践经验综合整理
> 本文档提供 AI Agent 在执行项目管理时可操作的检查和判定规则。

---

## 1. Definition of Done（完成定义）

### 1.1 通用 DoD（适用于所有 Task）

一个 Task 标记为 `done` 时，必须同时满足以下全部条件：

| # | 条件 | 验证方式 |
|---|------|---------|
| D1 | 所有验收标准（AC）均已满足 | 逐条 AC 确认结果为"是" |
| D2 | 所有 `depends_on` 前置依赖的 Task 已 `done` | `openpm task show <dep-id>` 确认 status 为 done |
| D3 | 代码已 commit 且 message 含 Task ID | `git log -1` 检查 message 包含 task-XXX |
| D4 | 代码已通过项目的测试命令（如有） | 运行测试套件 |
| D5 | 无遗留的 TODO / FIXME / 调试代码注释 | 代码审查确认 |
| D6 | 对应的文档（API 文档 / README / CHANGELOG）已更新 | 如有接口变更则必须 |

### 1.2 类型特定的 DoD

| Task type | 额外要求 |
|-----------|---------|
| **story** | 全部 AC 可独立验证（不需要其他 story 的前置条件） |
| **task** | 产出可交付的 Increment 部分（非中间产物） |
| **bug** | 复现步骤已验证不再触发 + 回归测试通过（如适用） |

---

## 2. Task 拆分粒度

### 2.1 判定规则

| 信号 | 判定 | 操作 |
|------|------|------|
| 1 天内不可完成 | ❌ 太大 | 拆分 |
| AC > 5 条 | ❌ 太大 | 按 AC 聚类拆分为 ≥2 个 task |
| depends_on ≥ 3 个 | ❌ 依赖太多 | 合并相关依赖或重新设计拆分 |
| title 包含 "和" / "及" / "and" | ⚠️ 可疑 | 检查是否实际包含两个独立功能 |
| 描述超过 200 字 | ⚠️ 可疑 | 可能任务边界不清 |
| 验收标准 1-3 条，可 1 天内完成 | ✅ 良好 | 保持 |
| 一个明确的动词 + 名词标题 | ✅ 良好 | 典型的良好粒度 |

### 2.2 拆分示例

```
❌ task-001: 实现用户认证系统（登录+注册+找回+权限+OAuth）

✅ 拆分为：
task-001: 邮箱+密码登录
task-002: 用户注册（邮箱验证）
task-003: 密码找回（邮件重置）
task-004: 基础角色权限（admin/user）
task-005: OAuth 第三方登录（Google）
```

---

## 3. Sprint 容量指南

### 3.1 规模控制

| 参数 | 推荐值 | 说明 |
|------|--------|------|
| Sprint 长度 | 1-2 周 | 对应 Scrum Guide "1 个月以内"，取偏短周期 |
| Task 数量 | 5-12 个/Sprint | 按 1 天/task，留 20% 余量应对意外 |
| Story 占比 | ≥50% | Sprint 应有明确的用户价值交付 |
| Bug 上限 | ≤20% | 超过说明质量/技术债务需要专门 Sprint 解决 |

### 3.2 优先级排序（MoSCoW 简化版）

在将 Task 纳入 Sprint 时，按以下顺序选取：

1. **Must have**（必须有）— 不完成则 Sprint Goal 无法达成
2. **Should have**（应该有）— 重要但 Sprint Goal 不依赖它
3. **Could have**（可以有）— 锦上添花，有余力才做
4. **Won't have**（这次不做）— 明确这期不做，放入 Product Backlog

---

## 4. Sprint 生命周期的硬性约束

### 4.1 Sprint 启动前检查

- [ ] Sprint Goal 明确（`sprint.goal` 字段非空）
- [ ] Sprint Backlog 中 task ≥ 5 个
- [ ] 所有入选 Task 的 INVEST 总分 ≥ 4
- [ ] 所有入选 Task 有至少 1 条验收标准
- [ ] Sprint 的 start_date 和 end_date 设置正确

### 4.2 Sprint 执行中检查（Daily Scrum 等价）

- [ ] 有 task 处于 `in_progress`（Sprint 有人在推进）
- [ ] 每日有 `log today` 记录（工作日志持续更新）
- [ ] 如发现阻塞，标记依赖并评估是否需要调整 Sprint Backlog

### 4.3 Sprint 关闭前检查

- [ ] 没有 `in_progress` 的 task（全部 done 或明确移至下个 Sprint）
- [ ] 所有 `done` task 满足 DoD
- [ ] Sprint summary 已生成（`sprint close` 自动执行）
- [ ] 未完成任务已移入下个 Sprint

---

## 5. 反模式警示

| 反模式 | 症状 | 纠正 |
|--------|------|------|
| **瀑布伪装** | Sprint 前半段全是 `todo`，最后一天批量 `done` | 要求每日至少完成 1 个 task |
| **永远规划** | Sprint 反复处于 `plan` 状态不激活 | 规划超 30 分钟仍未 start → 先启动，边做边调整 |
| **僵尸任务** | Task 长期 `in_progress` 无进展 | 超过 3 天标记检查：是否太大？是否阻塞？ |
| **AC 空洞** | AC 全是主观描述（"界面美观"、"性能优良"） | 改写为客观可测量的标准 |
| **依赖地狱** | Task 依赖链超过 3 层 | 重新设计任务拆分，消除中间层依赖 |
