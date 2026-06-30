// OpenPM Web Dashboard SPA
var pages = {
  kanban: { title: '看板', file: 'kanban.html' },
  sprint: { title: 'Sprint', file: 'sprint.html' },
  'epic-tree': { title: 'Epic 树', file: 'epic-tree.html' },
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
    document.getElementById('page-content').innerHTML = html;
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

// Hash routing
window.addEventListener('hashchange', function() {
  navigate(location.hash.slice(1) || 'kanban');
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

// Start
navigate(location.hash.slice(1) || 'kanban');
updateAiStatus();
setInterval(updateAiStatus, 30000);
