# 敏捷宣言与原则

> 来源：*Manifesto for Agile Software Development*（2001），中文版
> 本文档包含敏捷宣言的 4 条价值观和 12 条原则的完整原文。

---

## 敏捷软件开发宣言

我们一直在实践中探寻更好的软件开发方法，
身体力行，同时也帮助他人。由此我们建立了如下价值观：

| | |
|---|---|
| **个体和互动** 高于 流程和工具 | *Individuals and interactions* over processes and tools |
| **工作的软件** 高于 详尽的文档 | *Working software* over comprehensive documentation |
| **客户合作** 高于 合同谈判 | *Customer collaboration* over contract negotiation |
| **响应变化** 高于 遵循计划 | *Responding to change* over following a plan |

> 也就是说，尽管右项有其价值，我们更重视左项的价值。

---

## 敏捷宣言背后的 12 条原则

1. **我们最重要的目标，是通过持续不断地及早交付有价值的软件使客户满意。**
   *Our highest priority is to satisfy the customer through early and continuous delivery of valuable software.*

2. **欢迎需求变化，即使是在开发后期。敏捷过程利用变化为客户创造竞争优势。**
   *Welcome changing requirements, even late in development. Agile processes harness change for the customer's competitive advantage.*

3. **频繁地交付可工作的软件，交付的间隔可以从几周到几个月，交付的频率越短越好。**
   *Deliver working software frequently, from a couple of weeks to a couple of months, with a preference to the shorter timescale.*

4. **业务人员和开发人员在整个项目期间必须每天一起协同工作。**
   *Business people and developers must work together daily throughout the project.*

5. **围绕被激励起来的个体来构建项目。给他们提供所需的环境和支持，相信他们能够达成目标。**
   *Build projects around motivated individuals. Give them the environment and support they need, and trust them to get the job done.*

6. **在团队内部，最富有效果和效率的信息传递方式，是面对面交谈。**
   *The most efficient and effective method of conveying information to and within a development team is face-to-face conversation.*

7. **可工作的软件是进度的首要度量标准。**
   *Working software is the primary measure of progress.*

8. **敏捷过程倡导可持续开发。负责人、开发者和用户要能够共同维持其步调稳定延续。**
   *Agile processes promote sustainable development. The sponsors, developers, and users should be able to maintain a constant pace indefinitely.*

9. **坚持不懈地追求技术卓越和良好设计，可增强敏捷能力。**
   *Continuous attention to technical excellence and good design enhances agility.*

10. **以简洁为本，最大程度地减少不必要的工作量。**
    *Simplicity — the art of maximizing the amount of work not done — is essential.*

11. **最好的架构、需求和设计出自自组织团队。**
    *The best architectures, requirements, and designs emerge from self-organizing teams.*

12. **团队定期地反思如何能提高成效，并依此调整自身的举止表现。**
    *At regular intervals, the team reflects on how to become more effective, then tunes and adjusts its behavior accordingly.*

---

## 在 AI 驱动的项目管理中的转化

| 原则 | OpenPM 实践 |
|------|------------|
| 1. 持续交付价值 | 每个 Sprint 闭合时产出可验证的 Increment |
| 2. 欢迎需求变化 | Sprint Goal 范围内的 task 可动态调整 |
| 3. 频繁交付 | Sprint 长度 1-2 周，保持短节奏 |
| 7. 可工作软件是进度的首要度量 | `task status: done` 是唯一有效的进度指标，不是计划文档或讨论 |
| 8. 可持续开发 | Sprint 容量控制在 5-12 个 task |
| 9. 追求技术卓越 | DoD 包含代码质量、测试覆盖、无遗留注释 |
| 10. 简洁为本 | 每个 task 可 1 天内完成。超过则拆分 |
| 12. 定期反思 | Sprint close 时自动生成 summary，含反思部分 |
