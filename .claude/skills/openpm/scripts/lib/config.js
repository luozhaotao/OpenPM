const fs = require('fs');
const path = require('path');
const { parseYaml, serializeYaml } = require('./files');

const DEFAULT_CONFIG = {
  project: 'Untitled Project',
  workflow: ['todo', 'in_progress', 'done'],
  created: new Date().toISOString().split('T')[0],
};

function readConfig(openpmDir) {
  const configPath = path.join(openpmDir, 'config.yaml');
  if (!fs.existsSync(configPath)) return { ...DEFAULT_CONFIG };
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

module.exports = { readConfig, writeConfig, getOpenpmDir, DEFAULT_CONFIG };
