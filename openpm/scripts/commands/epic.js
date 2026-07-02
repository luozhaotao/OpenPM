const path = require('path');
const { parseMarkdown, writeMarkdown, readAll } = require('../lib/files');
const { nextEpicId } = require('../lib/id');
const { getOpenpmDir } = require('../lib/config');

function epicCommand(action, args, cwd) {
  const openpmDir = getOpenpmDir(cwd);
  const epicsDir = path.join(openpmDir, 'epics');
  switch (action) {
    case 'create': {
      const id = nextEpicId();
      const fm = { id, title: args.title || 'Untitled Epic', status: 'todo' };
      writeMarkdown(path.join(epicsDir, id + '.md'), fm, '');
      return { ok: true, epic: fm };
    }
    case 'list': return { ok: true, epics: readAll(epicsDir) };
    case 'show': {
      const fp = path.join(epicsDir, args.id + '.md');
      const { frontmatter, body } = parseMarkdown(fp);
      const tasks = readAll(path.join(openpmDir, 'tasks')).filter(t => t.epic === args.id);
      return { ok: true, epic: Object.assign({}, frontmatter, { description: body, tasks: tasks }) };
    }
    case 'update': {
      const fp = path.join(epicsDir, args.id + '.md');
      try {
        const { frontmatter, body } = parseMarkdown(fp);
        if (args.title !== undefined) frontmatter.title = args.title;
        if (args.status !== undefined) {
          const transitions = { todo: ['in_progress'], in_progress: ['done'], done: [] };
          const allowed = transitions[frontmatter.status];
          if (!allowed || !allowed.includes(args.status)) {
            return { ok: false, error: 'Epic ' + args.id + ' 状态 ' + frontmatter.status + ' 不允许流转到 ' + args.status };
          }
          frontmatter.status = args.status;
        }
        writeMarkdown(fp, frontmatter, body);
        return { ok: true, epic: frontmatter };
      } catch {
        return { ok: false, error: 'Epic not found: ' + args.id };
      }
    }
    case 'delete': {
      const fs = require('fs');
      const fp = path.join(epicsDir, args.id + '.md');
      const tasksDir = path.join(openpmDir, 'tasks');
      const tasks = readAll(tasksDir).filter(t => t.epic === args.id);
      if (tasks.length > 0 && !args.force) {
        const ids = tasks.map(t => t.id).join(', ');
        return { ok: false, error: 'Epic ' + args.id + ' 关联 ' + tasks.length + ' 个任务(' + ids + ')。使用 --force 强制删除。' };
      }
      try {
        fs.unlinkSync(fp);
        return { ok: true, deleted: args.id };
      } catch {
        return { ok: false, error: 'Epic not found: ' + args.id };
      }
    }
    default: return { ok: false, error: 'Unknown epic action: ' + action };
  }
}
module.exports = epicCommand;
