#!/usr/bin/env node
const initCommand = require('./commands/init');
const taskCommand = require('./commands/task');
const sprintCommand = require('./commands/sprint');
const epicCommand = require('./commands/epic');
const milestoneCommand = require('./commands/milestone');
const logCommand = require('./commands/log');
const summaryCommand = require('./commands/summary');

function parseArgs(argv) {
  const args = { _: [] };
  for (let i = 2; i < argv.length; i++) {
    const arg = argv[i];
    if (arg.startsWith('--')) {
      const key = arg.slice(2);
      const next = argv[i + 1];
      if (next && !next.startsWith('--')) { args[key] = next; i++; }
      else { args[key] = true; }
    } else { args._.push(arg); }
  }
  return args;
}

function main() {
  const args = parseArgs(process.argv);
  const entity = args._[0];
  const action = args._[1];
  const cwd = process.cwd();
  const format = args.format || 'json';
  let result;
  // Map positional args: openpm task update <id> -> args.id
  if (args._.length > 2) args.id = args._[2];
  // Map '--depends-on' and '--ac'
  if (args['depends-on']) args['depends-on'] = args['depends-on'];
  try {
    switch (entity) {
      case 'init': result = initCommand(cwd); break;
      case 'task': result = taskCommand(action, args, cwd); break;
      case 'sprint': result = sprintCommand(action, args, cwd); break;
      case 'epic': result = epicCommand(action, args, cwd); break;
      case 'milestone': result = milestoneCommand(action, args, cwd); break;
      case 'log': result = logCommand(action, args, cwd); break;
      case 'summary': result = summaryCommand(args, cwd); break;
      case 'web': {
        const server = require('./web/server');
        return server.start(args.port || 3000, cwd);
      }
      default: result = { ok: false, error: 'Unknown entity: ' + entity };
    }
  } catch (err) { result = { ok: false, error: err.message }; }
  if (format === 'markdown') console.log(formatMarkdown(result));
  else console.log(JSON.stringify(result, null, 2));
  process.exit(result.ok ? 0 : 1);
}

function formatMarkdown(result) {
  if (!result.ok) return 'ERROR: ' + result.error;
  let md = '';
  for (const [key, value] of Object.entries(result)) {
    if (key === 'ok') continue;
    if (Array.isArray(value)) {
      md += '## ' + key + ' (' + value.length + ')\n';
      for (const item of value) md += '- ' + (item.id || item.name || item.date) + ': ' + (item.title || item.goal || '') + '\n';
    } else if (typeof value === 'object' && value !== null) {
      md += '## ' + key + '\n';
      for (const [k, v] of Object.entries(value)) { if (typeof v !== 'object') md += '- ' + k + ': ' + v + '\n'; }
    }
  }
  return md || 'OK';
}

main();
