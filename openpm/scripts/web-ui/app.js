// OpenPM Web Dashboard SPA

// 术语映射 — 单一数据源，所有页面统一引用
window.LABELS = {
  status: {
    todo: '待办',
    in_progress: '进行中',
    done: '已完成'
  },
  type: {
    story: '需求',
    task: '开发任务',
    bug: '缺陷'
  },
  priority: {
    high: '高',
    medium: '中',
    low: '低'
  },
  sprint_status: {
    plan: '规划中',
    active: '进行中',
    done: '已完成'
  },
  milestone_status: {
    upcoming: '计划中',
    current: '当前',
    done: '已完成'
  }
};

var pages = {
  kanban: { title: '看板', file: 'kanban.html' },
  sprint: { title: '迭代', file: 'sprint.html' },
  'epic-tree': { title: '专题树', file: 'epic-tree.html' },
  timeline: { title: '时间线', file: 'timeline.html' },
  worklog: { title: '工作日志', file: 'worklog.html' },
};

var currentPage = 'kanban';

async function navigate(page) {
  if (!pages[page]) return;

  currentPage = page;

  // Update nav active state
  document.querySelectorAll('.sidebar-nav a').forEach(function(a) {
    a.classList.toggle('active', a.dataset.page === page);
  });

  // Update header
  document.getElementById('page-header').innerHTML = '<h1>' + pages[page].title + '</h1>';

  // Load page content
  try {
    var resp = await fetch(pages[page].file);
    var html = await resp.text();
    // innerHTML 不执行 <script>，手动提取并动态创建执行
    var container = document.getElementById('page-content');
    var temp = document.createElement('div');
    temp.innerHTML = html;
    var scripts = temp.querySelectorAll('script');
    scripts.forEach(function(s) { s.remove(); });
    container.innerHTML = temp.innerHTML;
    scripts.forEach(function(s) {
      var ns = document.createElement('script');
      for (var i = 0; i < s.attributes.length; i++) {
        ns.setAttribute(s.attributes[i].name, s.attributes[i].value);
      }
      ns.textContent = s.textContent;
      container.appendChild(ns);
    });
    // 更新工作流导航条
    renderWorkflowBar();
    // Trigger page initialization
    if (typeof window.initPage === 'function') window.initPage(page);
    if (typeof window.refreshPage === 'function') {
      // Auto-refresh every 30s
      window._refreshInterval && clearInterval(window._refreshInterval);
      window._refreshInterval = setInterval(function() { window.refreshPage(); }, 30000);
    }
  } catch (err) {
    document.getElementById('page-content').innerHTML = '<p style="padding:24px;color:var(--text-muted)">加载失败: ' + err.message + '</p>';
  }
}

// API helper
async function api(path) {
  var resp = await fetch('/api/' + path);
  return resp.json();
}

// 工作流阶段判定
function derivePhase(stats, sprints, epics) {
  var hasActiveSprint = sprints.some(function(s) {
    return s.status === 'active';
  });
  if (hasActiveSprint && stats.activeSprint) {
    var sprintTaskCount = (stats.activeSprintTasks || 0);
    var doneInSprint = (stats.activeSprintDone || 0);
    if (sprintTaskCount > 0 && doneInSprint >= sprintTaskCount) return 4;
    return 3;
  }
  if (stats.totalTasks > 0) return 2;
  return 1;
}

// 审批提醒推导
function deriveAlerts(stats, sprints) {
  var alerts = [];
  var activeSprint = sprints.find(function(s) {
    return s.status === 'active';
  });

  if (activeSprint && stats.activeSprintTasks > 0 &&
      stats.activeSprintDone >= stats.activeSprintTasks) {
    alerts.push({ text: "Sprint '" + activeSprint.name + "' 所有任务已完成，待复盘", priority: 1 });
  }

  var planSprints = sprints.filter(function(s) {
    return s.status === 'plan';
  });
  if (planSprints.length > 0) {
    alerts.push({ text: "Sprint '" + planSprints[0].name + "' 待启动", priority: 2 });
  }

  if (stats.todoTasks > 0) {
    alerts.push({ text: stats.todoTasks + ' 个 Task 待分配 Sprint', priority: 3 });
  }

  return alerts.slice(0, 2);
}

// 渲染工作流 Stepper + 审批提醒
async function renderWorkflowBar() {
  var bar = document.getElementById('workflow-bar');
  if (!bar) return;

  try {
    var results = await Promise.all([
      api('stats'),
      api('sprints'),
      api('epics')
    ]);
    var stats = results[0].ok ? results[0] : { totalTasks: 0 };
    var sprints = results[1].ok ? results[1].sprints : [];
    var epics = results[2].ok ? results[2].epics : [];

    var phase = derivePhase(stats, sprints, epics);
    var alerts = deriveAlerts(stats, sprints);

    var phases = [
      { num: 1, label: '定义需求' },
      { num: 2, label: '规划迭代' },
      { num: 3, label: '执行迭代' },
      { num: 4, label: '验收复盘' },
    ];

    var html = '';
    for (var i = 0; i < phases.length; i++) {
      if (i > 0) html += '<span class="wf-connector">─</span>';

      var cls = 'wf-step';
      var circle = '' + phases[i].num;

      if (phases[i].num < phase) {
        cls += ' done';
        circle = '✓';
      } else if (phases[i].num === phase) {
        cls += ' active';
      } else {
        cls += ' pending';
      }

      html += '<span class="' + cls + '">';
      html += '<span class="step-circle">' + circle + '</span>';
      html += phases[i].label;
      html += '</span>';
    }

    // 审批提醒
    if (alerts.length > 0) {
      html += '<span class="wf-alerts">';
      for (var j = 0; j < alerts.length; j++) {
        html += '<span class="wf-alert">⚠ ' + alerts[j].text + '</span>';
      }
      html += '</span>';
    }

    bar.innerHTML = html;
  } catch (e) {
    bar.innerHTML = '';
  }
}

// Hash routing
window.addEventListener('hashchange', function() {
  navigate(location.hash.slice(1) || 'epic-tree');
});

// AI status detection
function updateAiStatus() {
  var dot = document.getElementById('ai-indicator');
  var text = document.getElementById('ai-status-text');
  api('stats').then(function(data) {
    if (data.ok) {
      dot.style.background = 'var(--success)';
      dot.style.animation = 'none';
      text.textContent = 'AI 在线';
    }
  }).catch(function() {
    dot.style.background = 'var(--text-muted)';
    dot.style.animation = 'none';
    text.textContent = '离线';
  });
}

// Load project name from server
function loadProjectName() {
  fetch('/api/config').then(function(resp) { return resp.json(); }).then(function(data) {
    if (data.ok && data.project) {
      var el = document.getElementById('sidebar-project');
      el.textContent = data.project;
      el.title = data.cwd || data.project;
    }
  }).catch(function() {
    // Server not running or AI offline — keep default "OpenPM"
  });
}

// Start
navigate(location.hash.slice(1) || 'epic-tree');
updateAiStatus();
loadProjectName();
setInterval(updateAiStatus, 30000);
