# OpenPM CLI 命令参考

> `${SKILL_DIR}` 为 SKILL.md 文件所在目录的绝对路径，Agent 执行时自动替换。
> 例如 SKILL.md 位于 `/workspace/openpm/`，则 `${SKILL_DIR}` = `/workspace/openpm`。

所有命令通过 Node.js 执行：

```bash
node ${SKILL_DIR}/scripts/cli.js <entity> <action> [--flags]
```

## 初始化

```bash
node ${SKILL_DIR}/scripts/cli.js init                        # 创建 .openpm/ 目录
```

## Task

```bash
node ${SKILL_DIR}/scripts/cli.js task create --title "..." --status todo --priority medium --type task [--sprint sprint-x] [--epic epic-x] [--depends-on task-xxx] [--ac "标准1;标准2"]
node ${SKILL_DIR}/scripts/cli.js task list [--sprint sprint-x] [--status todo|in_progress|done] [--epic epic-x]
node ${SKILL_DIR}/scripts/cli.js task show <task-id>          # 查看详情和 AC
node ${SKILL_DIR}/scripts/cli.js task start <task-id>         # 复合命令：验证依赖 → 读 AC → 标记 in_progress
node ${SKILL_DIR}/scripts/cli.js task update <task-id> --status done [--title "..."]
node ${SKILL_DIR}/scripts/cli.js task delete <task-id>
```

## Sprint

```bash
node ${SKILL_DIR}/scripts/cli.js sprint create --name "Sprint 1" --goal "..." --start 2026-07-01 --end 2026-07-14
node ${SKILL_DIR}/scripts/cli.js sprint list
node ${SKILL_DIR}/scripts/cli.js sprint show <sprint-id>
node ${SKILL_DIR}/scripts/cli.js sprint start --id sprint-1   # 激活 Sprint (plan → active)
node ${SKILL_DIR}/scripts/cli.js sprint update <sprint-id> --name "..." --goal "..."
node ${SKILL_DIR}/scripts/cli.js sprint close <sprint-id>     # 关闭并生成 summary；未完成任务自动迁移
node ${SKILL_DIR}/scripts/cli.js sprint delete <sprint-id> [--force]
```

## Epic

```bash
node ${SKILL_DIR}/scripts/cli.js epic create --title "用户认证系统"
node ${SKILL_DIR}/scripts/cli.js epic list
node ${SKILL_DIR}/scripts/cli.js epic show <epic-id>
node ${SKILL_DIR}/scripts/cli.js epic update <epic-id> --title "..." --status in_progress
node ${SKILL_DIR}/scripts/cli.js epic delete <epic-id> [--force]
```

## Milestone

```bash
node ${SKILL_DIR}/scripts/cli.js milestone create --name "MVP v0.1" --date 2026-08-01
node ${SKILL_DIR}/scripts/cli.js milestone list
node ${SKILL_DIR}/scripts/cli.js milestone show <ms-id>
node ${SKILL_DIR}/scripts/cli.js milestone update <ms-id> --name "..." --date ... --status current
node ${SKILL_DIR}/scripts/cli.js milestone delete <ms-id>
```

## Log

```bash
node ${SKILL_DIR}/scripts/cli.js log today [--summary "..."] [--tasks "task-001:done,task-002:in_progress"]
node ${SKILL_DIR}/scripts/cli.js log show <date>              # 读取指定日期日志
node ${SKILL_DIR}/scripts/cli.js log list                     # 列出所有日志
```

## Summary & Web

```bash
node ${SKILL_DIR}/scripts/cli.js summary --sprint sprint-1    # 查看 Sprint 总结
node ${SKILL_DIR}/scripts/cli.js web [--port 23214]           # 启动 Web 仪表盘
```
