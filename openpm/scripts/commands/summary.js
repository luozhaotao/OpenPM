const path = require('path');
const { parseMarkdown } = require('../lib/files');
const { getOpenpmDir } = require('../lib/config');

function summaryCommand(args, cwd) {
  const openpmDir = getOpenpmDir(cwd);
  const summaryPath = path.join(openpmDir, 'sprints', args.sprint + '-summary.md');
  try {
    const { frontmatter, body } = parseMarkdown(summaryPath);
    return { ok: true, summary: Object.assign({}, frontmatter, { details: body }) };
  } catch {
    return { ok: false, error: 'Summary not found for ' + args.sprint + ". Run 'openpm sprint close' first." };
  }
}
module.exports = summaryCommand;
