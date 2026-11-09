// Tiny static server for local preview of docs/ (what GitHub Pages serves).
import http from 'node:http';
import { createReadStream, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const DOCS = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'docs');
const PORT = Number(process.env.PORT || 4173);
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.ico': 'image/x-icon', '.webmanifest': 'application/manifest+json' };

http.createServer((req, res) => {
  const urlPath = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  let file = path.join(DOCS, urlPath.endsWith('/') ? urlPath + 'index.html' : urlPath);
  if (!file.startsWith(DOCS)) { res.writeHead(403); return res.end(); }
  try {
    if (statSync(file).isDirectory()) file = path.join(file, 'index.html');
    statSync(file);
  } catch { res.writeHead(404); return res.end('not found'); }
  res.writeHead(200, { 'content-type': TYPES[path.extname(file)] || 'application/octet-stream', 'cache-control': 'no-store' });
  createReadStream(file).pipe(res);
}).listen(PORT, () => console.log(`serving ${DOCS} at http://localhost:${PORT}`));
