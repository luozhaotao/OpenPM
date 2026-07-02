const path = require('path');
const { parseMarkdown, writeMarkdown, readAll } = require('../lib/files');
const { nextMilestoneId } = require('../lib/id');
const { getOpenpmDir } = require('../lib/config');

function milestoneCommand(action, args, cwd) {
  const openpmDir = getOpenpmDir(cwd);
  const msDir = path.join(openpmDir, 'milestones');
  switch (action) {
    case 'create': {
      const id = nextMilestoneId(openpmDir);
      const fm = { id, name: args.name || 'Untitled Milestone', target_date: args.date || '', status: 'upcoming' };
      writeMarkdown(path.join(msDir, id + '.md'), fm, '');
      return { ok: true, milestone: fm };
    }
    case 'show': {
      const fp = path.join(msDir, args.id + '.md');
      try {
        const { frontmatter, body } = parseMarkdown(fp);
        return { ok: true, milestone: Object.assign({}, frontmatter, { body }) };
      } catch {
        return { ok: false, error: 'Milestone not found: ' + args.id };
      }
    }
    case 'update': {
      const fp = path.join(msDir, args.id + '.md');
      try {
        const { frontmatter, body } = parseMarkdown(fp);
        if (args.name !== undefined) frontmatter.name = args.name;
        if (args.date !== undefined) frontmatter.target_date = args.date;
        if (args.status !== undefined) {
          const transitions = { upcoming: ['current'], current: ['done'], done: [] };
          const allowed = transitions[frontmatter.status];
          if (!allowed || !allowed.includes(args.status)) {
            return { ok: false, error: 'Milestone ' + args.id + ' 状态 ' + frontmatter.status + ' 不允许流转到 ' + args.status };
          }
          frontmatter.status = args.status;
        }
        writeMarkdown(fp, frontmatter, body);
        return { ok: true, milestone: frontmatter };
      } catch {
        return { ok: false, error: 'Milestone not found: ' + args.id };
      }
    }
    case 'list': return { ok: true, milestones: readAll(msDir) };
    case 'delete': {
      const fs = require('fs');
      const fp = path.join(msDir, args.id + '.md');
      try {
        fs.unlinkSync(fp);
        return { ok: true, deleted: args.id };
      } catch {
        return { ok: false, error: 'Milestone not found: ' + args.id };
      }
    }
    default: return { ok: false, error: 'Unknown milestone action: ' + action };
  }
}
module.exports = milestoneCommand;
