<!-- 字段参考，禁止复制。请用 CLI: node ${SKILL_DIR}/scripts/cli.js task create -->

---
id: "{{id}}"
title: "{{title}}"
status: {{status}}
priority: {{priority}}
type: {{type}}
{{#sprint}}sprint: {{sprint}}{{/sprint}}
{{#epic}}epic: {{epic}}{{/epic}}
{{#depends_on}}depends_on:{{#depends_on}}
  - {{.}}{{/depends_on}}{{/depends_on}}
{{#ac}}ac:{{#ac}}
  - "{{.}}"{{/ac}}{{/ac}}
created: "{{created}}"
updated: "{{updated}}"
---

{{description}}
