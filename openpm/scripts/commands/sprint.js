const path = require('path');
const fs = require('fs');
const { parseMarkdown, writeMarkdown, readAll, listFiles } = require('../lib/files');
const { nextSprintId } = require('../lib/id');
const { getOpenpmDir } = require('../lib/config');

function sprintCommand(action, args, cwd) {
  const openpmDir = getOpenpmDir(cwd);
  const sprintsDir = path.join(openpmDir, 'sprints');
  switch (action) {
    case 'create': {
      const id = nextSprintId(openpmDir);
      const fm = { id, name: args.name || 'Untitled Sprint', goal: args.goal || '', status: 'plan', start_date: args.start || '', end_date: args.end || '' };
      writeMarkdown(path.join(sprintsDir, id + '.md'), fm, '');
      return { ok: true, sprint: fm };
    }
    case 'start': {
      const fp = path.join(sprintsDir, args.id + '.md');
      const { frontmatter, body } = parseMarkdown(fp);
      frontmatter.status = 'active';
      writeMarkdown(fp, frontmatter, body);
      return { ok: true, sprint: frontmatter };
    }
    case 'close': {
      const fp = path.join(sprintsDir, args.id + '.md');
      const { frontmatter, body } = parseMarkdown(fp);
      if (frontmatter.status === 'done') return { ok: false, error: 'Sprint already closed' };
      frontmatter.status = 'done';
      writeMarkdown(fp, frontmatter, body);
      const tasksDir = path.join(openpmDir, 'tasks');
      const tasks = readAll(tasksDir).filter(t => t.sprint === args.id);
      const completed = tasks.filter(t => t.status === 'done').length;
      const summaryFm = { sprint: args.id, completed, total: tasks.length };
      const doneList = tasks.filter(function(t) { return t.status === 'done'; }).map(function(t) { return '- ' + t.title; }).join('\n');
      const todoList = tasks.filter(function(t) { return t.status !== 'done'; }).map(function(t) { return '- ' + t.title; }).join('\n');
      writeMarkdown(path.join(sprintsDir, args.id + '-summary.md'), summaryFm, '## 完成事项\n' + doneList + '\n\n## 未完成\n' + todoList + '\n');
      return { ok: true, sprint: frontmatter, summary: summaryFm };
    }
    case 'list': {
      const sprints = listFiles(sprintsDir).filter(f => !f.includes('-summary')).map(f => parseMarkdown(f).frontmatter);
      return { ok: true, sprints };
    }
    default: return { ok: false, error: 'Unknown sprint action: ' + action };
  }
}
module.exports = sprintCommand;
