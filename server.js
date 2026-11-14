const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const url = require('url');

const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = __dirname;

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.webp': 'image/webp'
};

const server = http.createServer((req, res) => {
  // Simple SSE (Server-Sent Events) for live telemetry simulation if requested
  if (req.url === '/api/live-telemetry') {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*'
    });
    
    const interval = setInterval(() => {
      const data = {
        timestamp: new Date().toISOString(),
        erpRecordsSynced: 148920 + Math.floor(Math.random() * 50),
        latencyMs: 12 + Math.floor(Math.random() * 8),
        activeSessions: 6,
        systemHealth: 99.98,
        lastSyncedEntity: ['MV Al-Mabrouk (IMO 9283712)', 'LifeRaft #LR-2024-88', 'SOLAS Form Ch.III', 'HRU #HR-9921'][Math.floor(Math.random() * 4)]
      };
      res.write(`data: ${JSON.stringify(data)}\n\n`);
    }, 2500);

    req.on('close', () => {
      clearInterval(interval);
    });
    return;
  }

  // Executive Maritime Webmail API Bridge
  if (req.url.startsWith('/api/mail')) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      res.end();
      return;
    }

    const parsedUrl = url.parse(req.url, true);
    const pathname = parsedUrl.pathname;
    const query = parsedUrl.query;

    let action = query.action;
    if (!action) {
      if (pathname.includes('/folders')) action = 'folders';
      else if (pathname.includes('/list')) action = 'list';
      else if (pathname.includes('/read')) action = 'read';
      else if (pathname.includes('/attachment')) action = 'attachment';
      else if (pathname.includes('/send') || pathname.includes('/reply')) action = 'send';
      else action = 'folders';
    }

    if (req.method === 'POST') {
      let body = '';
      req.on('data', chunk => { body += chunk; });
      req.on('end', () => {
        try {
          const payload = JSON.parse(body || '{}');
          const act = action || payload.action || 'send';
          const py = spawn('python', [path.join(__dirname, 'mail_bridge.py'), act], {
            cwd: __dirname
          });

          let stdout = '';
          let stderr = '';
          py.stdout.on('data', d => { stdout += d; });
          py.stderr.on('data', d => { stderr += d; });

          py.on('close', code => {
            res.writeHead(code === 0 ? 200 : 500, { 'Content-Type': 'application/json' });
            if (stdout.trim()) {
              res.end(stdout);
            } else {
              res.end(JSON.stringify({ success: false, error: stderr || `Process failed with exit code ${code}` }));
            }
          });

          py.stdin.write(JSON.stringify(payload));
          py.stdin.end();
        } catch (err) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: 'Malformed JSON payload' }));
        }
      });
      return;
    }

    // GET requests
    const args = [path.join(__dirname, 'mail_bridge.py'), action];
    if (action === 'list') {
      if (query.folder) args.push('--folder', query.folder);
      if (query.page) args.push('--page', query.page);
      if (query.limit) args.push('--limit', query.limit);
      if (query.search) args.push('--search', query.search);
    } else if (action === 'read') {
      if (query.folder) args.push('--folder', query.folder);
      if (query.id) args.push('--id', query.id);
    } else if (action === 'attachment') {
      if (query.folder) args.push('--folder', query.folder);
      if (query.id) args.push('--id', query.id);
      if (query.index) args.push('--index', query.index);
      if (query.filename) args.push('--filename', query.filename);
    }

    const py = spawn('python', args, { cwd: __dirname });
    let stdout = '';
    let stderr = '';
    py.stdout.on('data', d => { stdout += d; });
    py.stderr.on('data', d => { stderr += d; });

    py.on('close', code => {
      res.writeHead(code === 0 ? 200 : 500, { 'Content-Type': 'application/json' });
      if (stdout.trim()) {
        res.end(stdout);
      } else {
        res.end(JSON.stringify({ success: false, error: stderr || `Process failed with exit code ${code}` }));
      }
    });
    return;
  }

  // Parse URL & resolve file path
  let safePath = path.normalize(decodeURIComponent(req.url.split('?')[0])).replace(/^(\.\.[\/\\])+/, '');
  if (safePath === '/' || safePath === '\\') {
    safePath = '/index.html';
  }

  const filePath = path.join(PUBLIC_DIR, safePath);

  // Security check: ensure path is within PUBLIC_DIR
  if (!filePath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    res.end('403 Forbidden');
    return;
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      // 404 handler: if not found, serve index.html for SPA feel or 404
      const indexPath = path.join(PUBLIC_DIR, 'index.html');
      fs.readFile(indexPath, (readErr, indexContent) => {
        if (!readErr) {
          res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
          res.end(indexContent);
        } else {
          res.writeHead(404, { 'Content-Type': 'text/plain' });
          res.end('404 Not Found');
        }
      });
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    fs.readFile(filePath, (readErr, content) => {
      if (readErr) {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('500 Internal Server Error');
        return;
      }

      res.writeHead(200, {
        'Content-Type': contentType,
        'Cache-Control': 'no-cache',
        'Access-Control-Allow-Origin': '*'
      });
      res.end(content);
    });
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`=======================================================`);
  console.log(`🚀 AIMABGRP.COM Enterprise Portal & Dashboard is LIVE!`);
  console.log(`🌐 Localhost URL: http://localhost:${PORT}`);
  console.log(`⚓ MAB Group ERP AI Integration & SOLAS Maritime Automation`);
  console.log(`🎨 Design Aesthetics: Glassmorphism | Liquid Glass | Neumorphism`);
  console.log(`=======================================================`);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    const nextPort = PORT + 1;
    console.log(`Port ${PORT} is busy, retrying on http://localhost:${nextPort}...`);
    server.listen(nextPort, '0.0.0.0');
  } else {
    console.error('Server error:', err);
  }
});
