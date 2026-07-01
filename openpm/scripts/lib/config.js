const fs = require('fs');
const path = require('path');
const { parseYaml, serializeYaml } = require('./files');

const DEFAULT_WORKFLOW = ['todo', 'in_progress', 'done'];

function getDefaults() {
  return {
    project: 'Untitled Project',
    workflow: [...DEFAULT_WORKFLOW],
    created: new Date().toISOString().split('T')[0],
  };
}

function readConfig(openpmDir) {
  const configPath = path.join(openpmDir, 'config.yaml');
  if (!fs.existsSync(configPath)) return getDefaults();
  const content = fs.readFileSync(configPath, 'utf-8');
  return parseYaml(content);
}

function writeConfig(openpmDir, config) {
  const configPath = path.join(openpmDir, 'config.yaml');
  const yaml = serializeYaml(config);
  fs.writeFileSync(configPath, yaml, 'utf-8');
}

function getOpenpmDir(cwd) {
  return path.join(cwd || process.cwd(), '.openpm');
}

module.exports = { readConfig, writeConfig, getOpenpmDir, getDefaults };
