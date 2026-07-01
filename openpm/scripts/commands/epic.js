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
    default: return { ok: false, error: 'Unknown epic action: ' + action };
  }
}
module.exports = epicCommand;
