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
      const fm = { id, name: args.name || 'Untitled Sprint', goal: args.goal || '', status: 'plan' };
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
      const tasks = readAll(tasksDir).filter(function(t) { return t.sprint === args.id; });
      const completed = tasks.filter(function(t) { return t.status === 'done'; }).length;
      const inProgress = tasks.filter(function(t) { return t.status === 'in_progress'; });
      const todoTasks = tasks.filter(function(t) { return t.status === 'todo'; });
      const incomplete = inProgress.concat(todoTasks);

      // 自动迁移未完成任务到下一个 plan 状态的 Sprint，或清除 sprint 归属
      const nextSprint = readAll(sprintsDir).filter(function(s) { return s.status === 'plan'; }).sort(function(a, b) { return a.id.localeCompare(b.id); })[0];
      const migrated = [];
      for (var i = 0; i < incomplete.length; i++) {
        var t = incomplete[i];
        var tfp = path.join(tasksDir, t.id + '.md');
        var parsed = parseMarkdown(tfp);
        var tfm = parsed.frontmatter;
        var tbody = parsed.body;
        if (nextSprint) {
          tfm.sprint = nextSprint.id;
          migrated.push({ task: t.id, to: nextSprint.id });
        } else {
          delete tfm.sprint;
          migrated.push({ task: t.id, to: 'unassigned' });
        }
        writeMarkdown(tfp, tfm, tbody);
      }

      // 生成 summary，区分 in_progress 和 todo
      const summaryFm = { sprint: args.id, completed: completed, total: tasks.length, in_progress: inProgress.length };
      const doneList = tasks.filter(function(t) { return t.status === 'done'; }).map(function(t) { return '- ' + t.title; }).join('\n');
      const inProgressList = inProgress.map(function(t) { return '- ' + t.title + ' (进行中被关闭)'; }).join('\n');
      const todoList = todoTasks.map(function(t) { return '- ' + t.title; }).join('\n');
      var warningText = '';
      if (inProgress.length > 0) {
        warningText = '\n\n> ⚠️ 此 Sprint 关闭时有 ' + inProgress.length + ' 个进行中的任务，已自动迁移。\n';
      }
      writeMarkdown(path.join(sprintsDir, args.id + '-summary.md'), summaryFm,
        '## 完成事项\n' + doneList + '\n\n## 进行中（已迁移）\n' + inProgressList + '\n\n## 未开始（已迁移）\n' + todoList + warningText);
      return { ok: true, sprint: frontmatter, summary: summaryFm, migrated: migrated, warning: inProgress.length > 0 ? '有 ' + inProgress.length + ' 个 in_progress 任务被关闭并迁移' : null };
    }
    case 'show': {
      const fp = path.join(sprintsDir, args.id + '.md');
      try {
        const { frontmatter, body } = parseMarkdown(fp);
        const tasksDir = path.join(openpmDir, 'tasks');
        const tasks = readAll(tasksDir).filter(t => t.sprint === args.id);
        return { ok: true, sprint: Object.assign({}, frontmatter, { body, taskCount: tasks.length }) };
      } catch (e) { return { ok: false, error: 'Sprint not found: ' + args.id }; }
    }
    case 'update': {
      const fp = path.join(sprintsDir, args.id + '.md');
      try {
        const { frontmatter, body } = parseMarkdown(fp);
        const updatable = ['name', 'goal'];
        for (const key of updatable) {
          if (args[key] !== undefined) frontmatter[key] = args[key];
        }
        if (args.status !== undefined) {
          const transitions = { plan: ['active'], active: ['done'], done: [] };
          const allowed = transitions[frontmatter.status];
          if (!allowed || !allowed.includes(args.status)) {
            return { ok: false, error: 'Sprint ' + args.id + ' 状态 ' + frontmatter.status + ' 不允许流转到 ' + args.status };
          }
          frontmatter.status = args.status;
        }
        writeMarkdown(fp, frontmatter, body);
        return { ok: true, sprint: frontmatter };
      } catch (e) { return { ok: false, error: 'Sprint not found: ' + args.id }; }
    }
    case 'delete': {
      const fp = path.join(sprintsDir, args.id + '.md');
      const tasksDir = path.join(openpmDir, 'tasks');
      const tasks = readAll(tasksDir).filter(t => t.sprint === args.id);
      if (tasks.length > 0 && !args.force) {
        const ids = tasks.map(t => t.id).join(', ');
        return { ok: false, error: 'Sprint ' + args.id + ' 关联 ' + tasks.length + ' 个任务(' + ids + ')。使用 --force 强制删除。' };
      }
      try { fs.unlinkSync(fp); } catch (e) { return { ok: false, error: 'Sprint not found: ' + args.id }; }
      return { ok: true, deleted: args.id };
    }
    case 'list': {
      const sprints = listFiles(sprintsDir).filter(f => !f.includes('-summary')).map(f => parseMarkdown(f).frontmatter);
      return { ok: true, sprints };
    }
    default: return { ok: false, error: 'Unknown sprint action: ' + action };
  }
}
module.exports = sprintCommand;
