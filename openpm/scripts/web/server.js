const http = require('http');
const fs = require('fs');
const path = require('path');
const { handleApi } = require('./api');

function start(port, cwd) {
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

  server.listen(port, () => {
    console.log(JSON.stringify({
      ok: true,
      url: 'http://localhost:' + port,
      cwd: cwd,
      dataDir: path.join(cwd, '.openpm'),
      message: 'OpenPM dashboard running',
    }));
  });
}

module.exports = { start };
