const path = require('path');
const fs = require('fs');
const { parseMarkdown, writeMarkdown, readAll, listFiles } = require('../lib/files');
const { getOpenpmDir } = require('../lib/config');

function logCommand(action, args, cwd) {
  const openpmDir = getOpenpmDir(cwd);
  const logsDir = path.join(openpmDir, 'logs');

  if (action === 'create') {
    const logId = args.sprint ? 'sprint-' + args.sprint : 'log-' + Date.now();
    const fm = { id: logId, sprint: args.sprint || '', event: args.event || 'general' };
    const body = (args.summary || '') + '\n\n## 阻塞项\n' + (args.blockers || '无');
    writeMarkdown(path.join(logsDir, logId + '.md'), fm, body);
    return { ok: true, log: fm };
  }

  if (action === 'show') {
    const fp = path.join(logsDir, args.id + '.md');
    try {
      const { frontmatter, body } = parseMarkdown(fp);
      return { ok: true, log: Object.assign({}, frontmatter, { body }) };
    } catch {
      return { ok: false, error: 'Log not found: ' + args.id };
    }
  }

  if (action === 'list') {
    const logFiles = listFiles(logsDir);
    const logs = logFiles.map(function(f) {
      var parsed = parseMarkdown(f);
      return Object.assign({}, parsed.frontmatter, { body: parsed.body });
    });
    if (args.sprint) {
      return { ok: true, logs: logs.filter(function(l) { return l.sprint === args.sprint; }) };
    }
    return { ok: true, logs: logs };
  }

  if (action === 'delete') {
    const fp = path.join(logsDir, args.id + '.md');
    try { fs.unlinkSync(fp); return { ok: true, deleted: args.id }; }
    catch { return { ok: false, error: 'Log not found: ' + args.id }; }
  }

  return { ok: false, error: 'Unknown log action: ' + action };
}
module.exports = logCommand;
