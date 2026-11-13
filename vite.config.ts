/// <reference types="vitest" />
import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';

/** 개발 서버에서도 /og/<코드>.png 미리보기 그림을 볼 수 있게 (배포에선 server/main.ts 가 맡아요) */
function ogDev(): Plugin {
  return {
    name: 'your-mind-og-dev',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const m = /^\/og\/([A-Za-z0-9_-]+)\.png$/.exec((req.url ?? '').split('?')[0]);
        if (!m) return next();
        try {
          const { ogPngFor } = await server.ssrLoadModule('/server/og.ts');
          res.setHeader('Content-Type', 'image/png');
          res.end(ogPngFor(m[1]).png);
        } catch (e) {
          next(e);
        }
      });
    },
  };
}

export default defineConfig(({ isSsrBuild }) => ({
  plugins: [react(), ogDev()],
  // 서버 번들(dist-server)에는 public/ 을 복사하지 않아요 — 정적 파일은 dist/ 에서 나가요
  build: { copyPublicDir: !isSsrBuild },
  test: { environment: 'jsdom' },
}));
