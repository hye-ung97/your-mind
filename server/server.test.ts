// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { encodeCard } from '../src/app/link';
import { defaultLook } from '../src/app/model';
import { renderPage } from './meta';
import { OG_H, OG_W, ogPngFor } from './og';

const card = {
  look: { ...defaultLook('f'), mood: 'excited', face: 'excited', bg: 'flowers' },
  entry: { mood: 'excited' as const, customLabel: '', amount: 3, memo: '첫 출근 날! "떨리지만" <기대돼>' },
  date: new Date(2026, 10, 13),
};
const size = (png: Buffer) => [png.readUInt32BE(16), png.readUInt32BE(20)];

describe('미리보기 그림', () => {
  it('카드 코드면 그 카드의 1200×630 PNG', () => {
    const { png, isCard } = ogPngFor(encodeCard(card));
    expect(isCard).toBe(true);
    expect(png.subarray(1, 4).toString()).toBe('PNG');
    expect(size(png)).toEqual([OG_W, OG_H]);
    expect(png.length).toBeLessThan(300_000);
  });
  it('열 수 없는 코드나 default 면 대표 그림', () => {
    expect(ogPngFor('nope').isCard).toBe(false);
    expect(size(ogPngFor('default').png)).toEqual([OG_W, OG_H]);
  });
});

describe('미리보기 태그', () => {
  const tpl = '<head><!--app-meta--></head>';
  it('카드 페이지엔 그 카드의 제목·그림 주소가 들어가고, 따옴표·꺾쇠는 안전하게 바뀌어요', () => {
    const code = encodeCard(card);
    const html = renderPage(tpl, 'https://mind.example', { code, card });
    expect(html).toContain(`<meta property="og:image" content="https://mind.example/og/${code}.png" />`);
    expect(html).toContain(`<meta property="og:url" content="https://mind.example/c/${code}" />`);
    expect(html).toContain('&quot;떨리지만&quot; &lt;기대돼&gt;');
    expect(html).not.toContain('<!--app-meta-->');
  });
  it('그 밖의 페이지엔 대표 미리보기', () => {
    expect(renderPage(tpl, 'https://mind.example')).toContain('content="https://mind.example/og/default.png"');
  });
});
