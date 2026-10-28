const http = require('http');
const fs = require('fs');
const path = require('path');

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
