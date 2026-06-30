const path = require('path');
const { writeMarkdown, readAll } = require('../lib/files');
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
    case 'list': return { ok: true, milestones: readAll(msDir) };
    default: return { ok: false, error: 'Unknown milestone action: ' + action };
  }
}
module.exports = milestoneCommand;
