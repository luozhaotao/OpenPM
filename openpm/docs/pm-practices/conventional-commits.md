# Conventional Commits 规范

> 来源：*Conventional Commits v1.0.0*
> 本文档包含 Conventional Commits 规范的完整内容，以及 OpenPM 的 Task ID 关联约定。

---

## 1. 规范摘要

Conventional Commits 规范是一种对 commit message 的轻量级约定。它提供了一套简单规则来创建明确的提交历史，便于编写自动化工具。

Commit message 结构如下：

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

---

## 2. 完整规范

### 2.1 格式

每个 commit message 包含：

| 部分 | 必需 | 格式 |
|------|------|------|
| **type** | ✅ | 描述提交类型的名词，后跟冒号和空格 |
| **scope** | ❌ | 可选的括号包裹名词，描述代码影响的区域 |
| **description** | ✅ | 紧跟 type 的简短描述，说明代码变更 |
| **body** | ❌ | 更长的描述，提供变更的附加上下文 |
| **footer(s)** | ❌ | 一行或多行脚注，如 BREAKING CHANGE 或关闭的 issue 引用 |

### 2.2 type（类型）

| type | 说明 |
|------|------|
| `feat` | 新功能（对应 MINOR 版本） |
| `fix` | 修复 bug（对应 PATCH 版本） |
| `docs` | 仅文档变更 |
| `style` | 不影响代码含义的变更（空格、格式化、分号等） |
| `refactor` | 既非 bug 修复也非新功能的代码变更 |
| `perf` | 提升性能的代码变更 |
| `test` | 添加或修正测试 |
| `build` | 影响构建系统或外部依赖的变更 |
| `ci` | CI 配置文件和脚本的变更 |
| `chore` | 其他不修改 src 或 test 文件的变更 |
| `revert` | 撤销之前的 commit |

### 2.3 BREAKING CHANGE

在 footer 中包含 `BREAKING CHANGE:` 或 type/scope 后面追加 `!`，表示不向后兼容的变更。

```
feat!: send an email to customer when a product is shipped

或

feat(api): send an email to customer when a product is shipped

BREAKING CHANGE: API endpoint /users no longer accepts email parameter
```

BREAKING CHANGE 必须对应 MAJOR 版本变更。

### 2.4 示例

**基本 feat：**
```
feat: 添加用户登录功能
```

**含 scope：**
```
feat(auth): 实现 OAuth2.0 登录流程
```

**含 body：**
```
fix: 修复并发更新时的数据竞争

使用锁机制保证对 task-042 状态字段的原子更新。
```

**含 footer + BREAKING CHANGE：**
```
feat(api): 调整任务列表接口返回结构

新的返回结构增加了分页信息。

BREAKING CHANGE: /api/tasks 返回格式从数组变为 {data: [...], total: N}
```

---

## 3. OpenPM 扩展约定

### 3.1 Task ID 关联

每个 commit 在 description 中包含 Task ID 引用：

```
feat(task-003): 实现登录表单校验组件
fix(task-012): 修复密码哈希方式不兼容的问题
docs(task-005): 补充认证模块 API 文档
refactor(task-008): 抽取公共的表单校验逻辑
```

### 3.2 Commit 与 OpenPM 的对应关系

| 规则 | 说明 |
|------|------|
| **一个 commit 对应一个 task** | 每个 commit 只处理一个 task，避免混合 |
| **完成 commit 后更新 task 状态** | commit 后执行 `openpm task update <id> --status done` |
| **fix 类型标注关联 task** | bug 修复引用原 task ID 或新建 bug 类型 task |
| **revert 类型保留原始引用** | revert 的 footer 中注明原 commit 的 task ID |

### 3.3 提交前检查清单

- [ ] 是否只包含一个 task 的变更？
- [ ] type 是否正确（feat/fix/docs/refactor 等）？
- [ ] description 是否包含 Task ID？
- [ ] 是否有 BREAKING CHANGE？如有，footer 是否标注？
- [ ] commit 之后是否更新了对应 task 的状态？
