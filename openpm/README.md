# OpenPM · AI 原生项目管理

OpenPM 是一个 AI Agent 驱动的敏捷项目管理技能。**Agent 操作数据，人类浏览仪表盘**——所有项目数据以 Markdown + YAML 格式存放在项目 `.openpm/` 目录中，零外部依赖，完全由你掌控。

## 工作原理

```
你说"我要做用户认证功能"
        ↓
Agent 拆解为 Task，创建 Sprint，逐个实现
        ↓
你通过 Web 仪表盘看进度、做决策
```

Agent 以**执行者 + 导航员**双重角色运行：
- **执行者**：通过 CLI 读写 Task/Sprint/Epic/Milestone/Log 数据
- **导航员**：主动告知当前位置、提示下一步、在关键决策点等待你拍板

## 快速开始

在 Claude Code 中对 Agent 说：

1. **初始化**（首次使用）：
   > "初始化项目管理"
   
   Agent 会在项目根目录创建 `.openpm/` 数据目录。

2. **创建需求**：
   > "我要做一个用户认证系统，包含登录、注册、找回密码"
   
   Agent 会创建 Epic，拆解为 Task，并为每个 Task 编写验收标准。你确认后进入下一步。

3. **规划迭代**：
   Agent 会展示所有待规划 Task，建议 Sprint 内容。你说"开始"后，Agent 启动 Sprint。

4. **执行**：
   Agent 逐个完成 Task，每次完成都会更新状态并记录工作日志。你可以随时打开仪表盘看进度：
   > "打开项目管理仪表盘"

5. **复盘**：
   Sprint 结束时，Agent 展示完成情况、未完成任务、里程碑进展。你说"关闭"后，Agent 生成总结。

## 关键决策点

在这些节点 Agent **必须**等你确认后才能继续：

| 决策点 | 阶段 | 说明 |
|--------|------|------|
| 确认 Task 拆解和验收标准 | 阶段 1 | 你决定做什么、做到什么程度 |
| 启动 Sprint | 阶段 2 | 你决定这个迭代的内容 |
| 关闭 Sprint | 阶段 4 | 你确认交付成果、决定遗留任务去向 |

## 目录结构

```
openpm/
├── SKILL.md              # AI Agent 的工作流指南
├── README.md             # 本文档（给人类看的）
├── references/
│   └── commands.md       # 完整 CLI 命令参考（Agent 按需加载）
├── docs/
│   └── pm-practices/     # 敏捷实践知识库
│       ├── agile-principles.md    # 敏捷宣言与原则
│       ├── scrum.md               # Scrum 指南
│       ├── invest.md              # INVEST 原则
│       ├── dod-checklist.md       # DoD 检查清单
│       └── conventional-commits.md # Commit 规范
├── scripts/              # CLI 实现 + Web 仪表盘
│   ├── cli.js            # CLI 入口
│   ├── commands/         # 命令处理器
│   ├── lib/              # 工具库
│   ├── web/              # HTTP 服务
│   └── web-ui/           # 仪表盘前端
└── templates/            # 实体模板
```

## 数据存储

所有项目数据存在项目根目录的 `.openpm/` 中：

```
你的项目/
├── .openpm/
│   ├── tasks/            # 每个 Task 一个 .md 文件
│   ├── sprints/          # Sprint 定义 + 自动生成的 Summary
│   ├── epics/            # Epic 定义
│   ├── milestones/       # Milestone 定义
│   └── logs/             # 每日工作日志
├── src/
└── ...
```

纯文本，可版本控制，不依赖任何外部服务。
