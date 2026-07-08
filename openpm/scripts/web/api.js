const taskCommand = require('../commands/task');
const sprintCommand = require('../commands/sprint');
const epicCommand = require('../commands/epic');
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
  if (pathname === '/api/logs') return () => logCommand('list', {}, cwd);
  if (pathname === '/api/stats') return () => {
    const tasks = taskCommand('list', {}, cwd);
    const sprints = sprintCommand('list', {}, cwd);
    var activeSprint = sprints.sprints ? sprints.sprints.find(function(s) { return s.status === 'active'; }) || null : null;
    var sprintTasks = activeSprint ? (tasks.tasks || []).filter(function(t) { return t.sprint === activeSprint.id; }) : [];
    return {
      ok: true,
      totalTasks: tasks.tasks ? tasks.tasks.length : 0,
      todoTasks: tasks.tasks ? tasks.tasks.filter(function(t) { return t.status === 'todo'; }).length : 0,
      completedTasks: tasks.tasks ? tasks.tasks.filter(function(t) { return t.status === 'done'; }).length : 0,
      inProgressTasks: tasks.tasks ? tasks.tasks.filter(function(t) { return t.status === 'in_progress'; }).length : 0,
      activeSprint: activeSprint,
      activeSprintTasks: sprintTasks.length,
      activeSprintDone: sprintTasks.filter(function(t) { return t.status === 'done'; }).length,
    };
  };
  return null;
}

module.exports = { handleApi };
