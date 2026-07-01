const taskCommand = require('../commands/task');
const sprintCommand = require('../commands/sprint');
const epicCommand = require('../commands/epic');
const milestoneCommand = require('../commands/milestone');
const logCommand = require('../commands/log');
const summaryCommand = require('../commands/summary');
const { readConfig, getOpenpmDir } = require('../lib/config');

function handleApi(pathname, cwd) {
  if (pathname === '/api/config') return () => {
    const config = readConfig(getOpenpmDir(cwd));
    return { ok: true, cwd, project: config.project };
  };
  if (pathname === '/api/tasks') return (params) => {
    const args = {};
    if (params.get('sprint')) args.sprint = params.get('sprint');
    if (params.get('epic')) args.epic = params.get('epic');
    if (params.get('status')) args.status = params.get('status');
    return taskCommand('list', args, cwd);
  };
  if (pathname.startsWith('/api/tasks/')) return (params, pathname) => {
    const id = pathname.split('/').pop();
    return taskCommand('show', { id }, cwd);
  };
  if (pathname === '/api/sprints') return () => sprintCommand('list', {}, cwd);
  if (pathname.match(/^\/api\/sprints\/[^/]+\/summary$/)) return (params, pathname) => {
    const sprint = pathname.split('/')[3];
    return summaryCommand({ sprint }, cwd);
  };
  if (pathname === '/api/epics') return () => epicCommand('list', {}, cwd);
  if (pathname.startsWith('/api/epics/')) return (params, pathname) => {
    const id = pathname.split('/').pop();
    return epicCommand('show', { id }, cwd);
  };
  if (pathname === '/api/milestones') return () => milestoneCommand('list', {}, cwd);
  if (pathname === '/api/logs') return () => logCommand('list', {}, cwd);
  if (pathname === '/api/logs/today') return () => logCommand('today', {}, cwd);
  if (pathname === '/api/stats') return () => {
    const tasks = taskCommand('list', {}, cwd);
    const sprints = sprintCommand('list', {}, cwd);
    return {
      ok: true,
      totalTasks: tasks.tasks ? tasks.tasks.length : 0,
      completedTasks: tasks.tasks ? tasks.tasks.filter(t => t.status === 'done').length : 0,
      inProgressTasks: tasks.tasks ? tasks.tasks.filter(t => t.status === 'in_progress').length : 0,
      activeSprint: sprints.sprints ? sprints.sprints.find(s => s.status === 'active') || null : null,
    };
  };
  return null;
}

module.exports = { handleApi };
