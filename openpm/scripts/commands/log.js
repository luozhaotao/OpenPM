const path = require('path');
const { parseMarkdown, writeMarkdown, listFiles } = require('../lib/files');
const { getOpenpmDir } = require('../lib/config');

function logCommand(action, args, cwd) {
  const openpmDir = getOpenpmDir(cwd);
  const logsDir = path.join(openpmDir, 'logs');
  if (action === 'today') {
    const today = new Date().toISOString().split('T')[0];
    const filePath = path.join(logsDir, today + '.md');
    if (args.summary) {
      let existing = { frontmatter: { date: today, tasks: [] }, body: '' };
      try { existing = parseMarkdown(filePath); } catch {}
      const tasks = args.tasks ? args.tasks.split(',') : existing.frontmatter.tasks || [];
      const body = '## 今日摘要\n' + args.summary + '\n\n## 阻塞项\n' + (args.blockers || '无');
      writeMarkdown(filePath, { date: today, tasks }, body);
      return { ok: true, log: { date: today, tasks, summary: args.summary } };
    } else {
      try { const { frontmatter, body } = parseMarkdown(filePath); return { ok: true, log: Object.assign({}, frontmatter, { body: body }) }; }
      catch { return { ok: true, log: { date: today, tasks: [], body: '' }, empty: true }; }
    }
  }
  if (action === 'show') {
    const filePath = path.join(logsDir, args.id + '.md');
    try {
      const { frontmatter, body } = parseMarkdown(filePath);
      return { ok: true, log: Object.assign({}, frontmatter, { body }) };
    } catch {
      return { ok: true, log: null, empty: true };
    }
  }
  if (action === 'list') {
    const logs = listFiles(logsDir).map(f => parseMarkdown(f).frontmatter).sort((a, b) => b.date.localeCompare(a.date));
    return { ok: true, logs };
  }
  return { ok: false, error: 'Unknown log action: ' + action };
}
module.exports = logCommand;
