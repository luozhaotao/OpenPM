const { listFiles } = require('./files');
const path = require('path');

function nextTaskId(openpmDir) {
  const files = listFiles(path.join(openpmDir, 'tasks'));
  const nums = files.map(f => {
    const name = path.basename(f, '.md');
    const num = parseInt(name.replace('task-', ''), 10);
    return isNaN(num) ? 0 : num;
  });
  const max = nums.length > 0 ? Math.max(...nums, 0) : 0;
  return `task-${String(max + 1).padStart(3, '0')}`;
}

function nextSprintId(openpmDir) {
  const files = listFiles(path.join(openpmDir, 'sprints'))
    .filter(f => !f.includes('-summary'));
  const nums = files.map(f => {
    const name = path.basename(f, '.md');
    return parseInt(name.replace('sprint-', ''), 10) || 0;
  });
  const max = nums.length > 0 ? Math.max(...nums) : 0;
  return `sprint-${max + 1}`;
}

function nextEpicId() {
  const id = 'epic-' + Math.random().toString(36).substring(2, 8);
  return id;
}

function nextMilestoneId(openpmDir) {
  const files = listFiles(path.join(openpmDir, 'milestones'));
  const nums = files.map(f => {
    const name = path.basename(f, '.md');
    return parseInt(name.replace('ms-', ''), 10) || 0;
  });
  const max = nums.length > 0 ? Math.max(...nums) : 0;
  return `ms-${max + 1}`;
}

module.exports = { nextTaskId, nextSprintId, nextEpicId, nextMilestoneId };
