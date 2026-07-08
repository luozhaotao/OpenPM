const fs = require('fs');
const path = require('path');
const { writeConfig, getOpenpmDir } = require('../lib/config');

function initCommand(cwd) {
  const openpmDir = getOpenpmDir(cwd);

  if (fs.existsSync(openpmDir)) {
    return { ok: false, error: '.openpm/ already exists' };
  }

  // 创建目录结构
  const dirs = ['tasks', 'sprints', 'epics', 'logs'];
  for (const d of dirs) {
    fs.mkdirSync(path.join(openpmDir, d), { recursive: true });
  }

  // 写入配置文件
  writeConfig(openpmDir, {
    project: path.basename(cwd || process.cwd()),
    workflow: ['todo', 'in_progress', 'done'],
    created: new Date().toISOString().split('T')[0],
  });

  return { ok: true, path: openpmDir };
}

module.exports = initCommand;
