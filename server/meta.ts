// index.html 의 <!--app-meta--> 자리에 미리보기 태그(og:*, twitter:*)를 넣어요.
// 해시(#) 뒤는 서버에 오지 않아서, 카드마다 다른 미리보기는 /c/<코드> 경로로만 만들 수 있어요.
import type { Card } from '../src/app/link';
import { cardPath, ogImagePath } from '../src/app/link';
import { shareCopy } from '../src/app/shareCopy';
import { OG_H, OG_W } from './og';

export const PLACEHOLDER = '<!--app-meta-->';
export const DEFAULT_COPY = {
  title: 'your mind · 오늘의 기분',
  description: '기분을 닮은 픽셀 캐릭터를 꾸미고, 카드 한 장으로 공유해보세요.',
};

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export function metaTags(m: { title: string; description: string; image: string; url: string }) {
  const p = (k: string, v: string) => `<meta property="${k}" content="${esc(v)}" />`;
  const n = (k: string, v: string) => `<meta name="${k}" content="${esc(v)}" />`;
  return [
    p('og:type', 'website'), p('og:site_name', 'your mind'), p('og:locale', 'ko_KR'),
    p('og:title', m.title), p('og:description', m.description), p('og:url', m.url),
    p('og:image', m.image), p('og:image:width', String(OG_W)), p('og:image:height', String(OG_H)),
    n('twitter:card', 'summary_large_image'), n('twitter:title', m.title), n('twitter:description', m.description), n('twitter:image', m.image),
  ].join('\n    ');
}

/** 카드가 있으면 그 카드의 미리보기, 없으면 대표 미리보기 */
export function renderPage(template: string, origin: string, card?: { code: string; card: Card }) {
  const copy = card ? shareCopy(card.card) : DEFAULT_COPY;
  const tags = metaTags({
    ...copy,
    url: origin + (card ? cardPath(card.code) : '/'),
    image: origin + ogImagePath(card ? card.code : 'default'),
  });
  return template.replace(PLACEHOLDER, tags);
}
