const path = require('path');
const { parseMarkdown, writeMarkdown, readAll } = require('../lib/files');
const { nextTaskId } = require('../lib/id');
const { getOpenpmDir } = require('../lib/config');

function taskCommand(action, args, cwd) {
  const openpmDir = getOpenpmDir(cwd);
  switch (action) {
    case 'create': {
      if (args.batch) {
        try {
          const tasksData = JSON.parse(args.batch);
          const results = [];
          for (const taskArgs of tasksData) {
            results.push(createTask(openpmDir, taskArgs));
          }
          return { ok: true, tasks: results.map(function(r) { return r.task; }), count: results.length };
        } catch (e) {
          return { ok: false, error: '批量创建失败：JSON 解析错误 - ' + e.message };
        }
      }
      return createTask(openpmDir, args);
    }
    case 'list': return listTasks(openpmDir, args);
    case 'show': return showTask(openpmDir, args);
    case 'start': return startTask(openpmDir, args);
    case 'update': return updateTask(openpmDir, args);
    case 'delete': return deleteTask(openpmDir, args);
    default: return { ok: false, error: 'Unknown task action: ' + action };
  }
}

function createTask(openpmDir, args) {
  const tasksDir = path.join(openpmDir, 'tasks');
  const id = nextTaskId(openpmDir);
  const now = new Date().toISOString().split('T')[0];

  const frontmatter = {
    id, title: args.title || 'Untitled',
    status: args.status || 'todo',
    priority: args.priority || 'medium',
    type: args.type || 'task',
    created: now,
    updated: now,
  };
  if (args.sprint) frontmatter.sprint = args.sprint;
  if (args.epic) frontmatter.epic = args.epic;
  if (args['depends-on']) frontmatter.depends_on = args['depends-on'].split(',');
  if (args.ac) frontmatter.ac = args.ac.split(';');

  const body = args.description || '';
  writeMarkdown(path.join(tasksDir, `${id}.md`), frontmatter, body);
  return { ok: true, task: frontmatter };
}

function startTask(openpmDir, args) {
  const filePath = path.join(openpmDir, 'tasks', `${args.id}.md`);
  try {
    const { frontmatter, body } = parseMarkdown(filePath);

    // 检查依赖状态
    const depStatus = [];
    if (frontmatter.depends_on && frontmatter.depends_on.length > 0) {
      const allTasks = readAll(path.join(openpmDir, 'tasks'));
      for (const depId of frontmatter.depends_on) {
        const dep = allTasks.find(function(t) { return t.id === depId; });
        depStatus.push({ id: depId, status: dep ? dep.status : 'not_found', done: dep && dep.status === 'done' });
      }
    }

    // 标记 in_progress
    frontmatter.status = 'in_progress';
    frontmatter.updated = new Date().toISOString().split('T')[0];
    writeMarkdown(filePath, frontmatter, body);

    return {
      ok: true,
      task: { id: frontmatter.id, title: frontmatter.title, status: frontmatter.status },
      ac: frontmatter.ac || [],
      depends_on: depStatus,
      message: '已开始任务 ' + frontmatter.id + ': ' + frontmatter.title,
    };
  } catch (e) {
    return { ok: false, error: 'Task not found: ' + args.id };
  }
}

function listTasks(openpmDir, args) {
  const tasksDir = path.join(openpmDir, 'tasks');
  let tasks = readAll(tasksDir);

  if (args.sprint) tasks = tasks.filter(t => t.sprint === args.sprint);
  if (args.epic) tasks = tasks.filter(t => t.epic === args.epic);
  if (args.status) tasks = tasks.filter(t => t.status === args.status);
  if (args.priority) tasks = tasks.filter(t => t.priority === args.priority);

  return { ok: true, tasks, count: tasks.length };
}

function showTask(openpmDir, args) {
  const filePath = path.join(openpmDir, 'tasks', `${args.id}.md`);
  try {
    const { frontmatter, body } = parseMarkdown(filePath);
    return { ok: true, task: { ...frontmatter, description: body } };
  } catch {
    return { ok: false, error: 'Task not found: ' + args.id };
  }
}

function updateTask(openpmDir, args) {
  const filePath = path.join(openpmDir, 'tasks', `${args.id}.md`);
  try {
    const { frontmatter, body } = parseMarkdown(filePath);

    // 依赖校验：标记 done 前检查 depends_on 是否全部完成
    if (args.status === 'done' && frontmatter.depends_on && frontmatter.depends_on.length > 0) {
      const tasksDir = path.join(openpmDir, 'tasks');
      const allTasks = readAll(tasksDir);
      const pending = frontmatter.depends_on.filter(function(depId) {
        var dep = allTasks.find(function(t) { return t.id === depId; });
        return !dep || dep.status !== 'done';
      });
      if (pending.length > 0) {
        return { ok: false, error: '依赖未完成，不能标记为 done。未完成的依赖: ' + pending.join(', ') };
      }
    }

    const updatable = ['title', 'status', 'priority', 'type', 'sprint', 'epic'];
    for (const key of updatable) {
      if (args[key] !== undefined) frontmatter[key] = args[key];
    }
    if (args['depends-on'] !== undefined) {
      frontmatter.depends_on = args['depends-on'] ? args['depends-on'].split(',') : [];
    }
    if (args.ac !== undefined) {
      frontmatter.ac = args.ac ? args.ac.split(';') : [];
    }
    frontmatter.updated = new Date().toISOString().split('T')[0];
    writeMarkdown(filePath, frontmatter, body);
    return { ok: true, task: frontmatter };
  } catch {
    return { ok: false, error: 'Task not found: ' + args.id };
  }
}

function deleteTask(openpmDir, args) {
  const fs = require('fs');
  const filePath = path.join(openpmDir, 'tasks', `${args.id}.md`);
  try {
    fs.unlinkSync(filePath);
    return { ok: true, deleted: args.id };
  } catch {
    return { ok: false, error: 'Task not found: ' + args.id };
  }
}

module.exports = taskCommand;
