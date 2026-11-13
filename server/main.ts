// 배포용 서버 (Coolify 등). 의존성 없이 node:http 만 써요.
//   /c/<코드>          카드 페이지 — index.html 에 그 카드의 미리보기 태그를 넣어서 줘요
//   /og/<코드>.png     카드별 미리보기 그림 (/og/default.png 는 대표 그림)
//   /healthz           상태 확인
//   그 밖              dist/ 정적 파일, 없으면 index.html (해시 라우팅)
import { createReadStream } from 'node:fs';
import { readFile, stat } from 'node:fs/promises';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { CODE_RE, decodeCard } from '../src/app/link';
import { renderPage } from './meta';
import { ogPngFor } from './og';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(process.env.STATIC_DIR ?? path.join(HERE, '../dist'));
const PORT = Number(process.env.PORT ?? 3000);
const PUBLIC_URL = process.env.PUBLIC_URL?.replace(/\/+$/, '');

const TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.ico': 'image/x-icon',
  '.woff2': 'font/woff2', '.woff': 'font/woff', '.ttf': 'font/ttf', '.txt': 'text/plain; charset=utf-8', '.webmanifest': 'application/manifest+json',
};

const templateP = readFile(path.join(ROOT, 'index.html'), 'utf8');

/** 미리보기 태그에 넣을 절대 주소. 프록시(Traefik) 뒤라면 PUBLIC_URL 을 꼭 지정해주세요 */
function originOf(req: http.IncomingMessage) {
  if (PUBLIC_URL) return PUBLIC_URL;
  const first = (v: string | string[] | undefined) => String(Array.isArray(v) ? v[0] : v ?? '').split(',')[0].trim();
  const proto = first(req.headers['x-forwarded-proto']) || 'http';
  const host = first(req.headers['x-forwarded-host']) || req.headers.host || `localhost:${PORT}`;
  return `${proto}://${host}`;
}

function send(res: http.ServerResponse, status: number, headers: Record<string, string>, body?: string | Buffer, head = false) {
  res.writeHead(status, { 'X-Content-Type-Options': 'nosniff', ...headers });
  res.end(head ? undefined : body);
}

async function serveStatic(res: http.ServerResponse, pathname: string, head: boolean) {
  let rel: string;
  try { rel = decodeURIComponent(pathname); } catch { return false; }
  if (rel.includes('\0')) return false;
  const file = path.join(ROOT, rel);
  if (!file.startsWith(ROOT + path.sep) || path.basename(file) === 'index.html') return false;
  const info = await stat(file).catch(() => null);
  if (!info?.isFile()) return false;
  res.writeHead(200, {
    'Content-Type': TYPES[path.extname(file).toLowerCase()] ?? 'application/octet-stream',
    'Content-Length': String(info.size),
    'Cache-Control': rel.startsWith('/assets/') ? 'public, max-age=31536000, immutable' : 'public, max-age=3600',
    'X-Content-Type-Options': 'nosniff',
  });
  if (head) res.end(); else createReadStream(file).pipe(res);
  return true;
}

const server = http.createServer(async (req, res) => {
  try {
    const head = req.method === 'HEAD';
    if (req.method !== 'GET' && !head) return send(res, 405, { Allow: 'GET, HEAD' });
    const { pathname } = new URL(req.url ?? '/', 'http://x');

    if (pathname === '/healthz') return send(res, 200, { 'Content-Type': 'text/plain' }, 'ok', head);

    const og = /^\/og\/([^/]+)\.png$/.exec(pathname);
    if (og && CODE_RE.test(og[1])) {
      const { png, isCard } = ogPngFor(og[1]);
      return send(res, 200, {
        'Content-Type': 'image/png',
        'Cache-Control': isCard ? 'public, max-age=31536000, immutable' : 'public, max-age=86400',
      }, png, head);
    }

    const template = await templateP;
    const html = (body: string) => send(res, 200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-cache' }, body, head);
    const card = /^\/c\/([^/]+)\/?$/.exec(pathname);
    if (card && CODE_RE.test(card[1])) {
      const decoded = decodeCard(card[1]);
      return html(renderPage(template, originOf(req), decoded && { code: card[1], card: decoded }));
    }

    if (await serveStatic(res, pathname, head)) return;
    if (path.extname(pathname)) return send(res, 404, { 'Content-Type': 'text/plain' }, 'not found', head);
    return html(renderPage(template, originOf(req)));
  } catch (e) {
    console.error(e);
    if (!res.headersSent) send(res, 500, { 'Content-Type': 'text/plain' }, 'error');
    else res.end();
  }
});

server.listen(PORT, '0.0.0.0', () => console.log(`your mind: http://localhost:${PORT} (static: ${ROOT})`));
