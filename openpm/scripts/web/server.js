const http = require('http');
const fs = require('fs');
const path = require('path');
const { handleApi } = require('./api');

function probePort(port) {
  return new Promise((resolve) => {
    const req = http.get('http://localhost:' + port + '/api/config', (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch { resolve(null); }
      });
    });
    req.on('error', () => resolve(null));
    req.setTimeout(2000, () => { req.destroy(); resolve(null); });
  });
}

async function start(port, cwd) {
  const existing = await probePort(port);
  if (existing) {
    if (existing.cwd === cwd) {
      console.log(JSON.stringify({
        ok: true,
        message: '已在运行: ' + cwd,
        url: 'http://localhost:' + port,
        cwd: cwd,
        dataDir: path.join(cwd, '.openpm'),
      }));
      return;
    }
    console.log(JSON.stringify({
      ok: false,
      error: '端口 ' + port + ' 已被占用: ' + existing.cwd + '\n请先关闭该服务，或使用 --port 换端口',
    }));
    process.exit(1);
  }

  const webUiDir = path.join(__dirname, '..', 'web-ui');
  const mimeTypes = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'application/javascript',
    '.css': 'text/css',
    '.svg': 'image/svg+xml',
  };

  const server = http.createServer((req, res) => {
    const url = new URL(req.url, 'http://localhost:' + port);
    const pathname = url.pathname;

    if (pathname.startsWith('/api/')) {
      const handler = handleApi(pathname, cwd);
      if (handler) {
        const result = handler(url.searchParams, pathname);
        if (pathname === '/api/config' && result.ok) result.port = port;
        res.writeHead(result.ok ? 200 : 404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(result));
        return;
      }
      res.writeHead(404);
      res.end('{"error":"API not found"}');
      return;
    }

    let filePath = pathname === '/' ? '/index.html' : pathname;
    filePath = path.join(webUiDir, filePath);
    const ext = path.extname(filePath);
    const contentType = mimeTypes[ext] || 'text/plain';

    try {
      const content = fs.readFileSync(filePath);
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content);
    } catch {
      try {
        const indexContent = fs.readFileSync(path.join(webUiDir, 'index.html'));
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(indexContent);
      } catch {
        res.writeHead(404);
        res.end('Not Found');
      }
    }
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.log(JSON.stringify({
        ok: false,
        error: '端口 ' + port + ' 被占用（非 OpenPM 服务），请使用 --port 换端口',
      }));
      process.exit(1);
    }
    throw err;
  });

  server.listen(port, () => {
    const config = require('../lib/config').readConfig(path.join(cwd, '.openpm'));
    console.log(JSON.stringify({
      ok: true,
      url: 'http://localhost:' + port,
      cwd: cwd,
      dataDir: path.join(cwd, '.openpm'),
      project: config.project,
      message: 'OpenPM dashboard running',
    }));
  });
}

module.exports = { start };
