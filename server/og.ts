// 링크 미리보기 그림 (og:image, 1200×630) — 캔버스 share-motion 「05 링크 미리보기」의 두 그림이에요.
//   카드별: 양피지 창 + 스테이지 + 기분 이름·하트·메모 (/og/<코드>.png)
//   대표:   밤하늘 + 광장 + 로고 (/og/default.png · 홈 · 깨진 링크)
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { PLAZA_ACTORS } from '../src/app/actors';
import { type Card, decodeCard } from '../src/app/link';
import { moodInfo, shortDate } from '../src/app/model';
import { iconGrid } from '../src/pixel/core.js';
import * as PS from '../src/pixel/scene.js';
import { type BdfFont, parseBdf } from './bdf';
import { Raster } from './raster';

export const OG_W = 1200, OG_H = 630;
const C = {
  night: '#1A1838', band: '#4B4796', parch: '#FFF6E3', parch3: '#E2CFA6', parch4: '#B79E72',
  ink: '#2B2140', ink2: '#5E5478', cream: '#FFF6E3', lilac: '#CFC8F0', pink: '#FF7EB6', white: '#FFFFFF',
  sky: ['#211F4F', '#2B2A63', '#3A3778', '#4E4590', '#6A519E'], stops: [0, 0.16, 0.38, 0.6, 0.82],
};

let fonts: { r: BdfFont; b: BdfFont } | undefined;
function loadFonts() {
  if (!fonts) {
    const dir = process.env.FONT_DIR ?? path.dirname(createRequire(import.meta.url).resolve('galmuri'));
    const read = (f: string) => parseBdf(readFileSync(path.join(dir, f), 'utf8'));
    fonts = { r: read('Galmuri11.bdf'), b: read('Galmuri11-Bold.bdf') };
  }
  return fonts;
}

/** 보석 (UI 의 .gem 과 같은 모양) */
function gem(R: Raster, x: number, y: number, size: number, color: string) {
  const t = 4;
  R.fill(x - t, y - t, size + t * 2, size + t * 2, C.night);
  R.fill(x, y, size, size, color);
  R.fill(x, y, size, t, 'rgba(255,255,255,0.55)');
  R.fill(x, y + t, t, size - t, 'rgba(255,255,255,0.55)');
  R.fill(x, y + size - t, size, t, 'rgba(0,0,0,0.25)');
  R.fill(x + size - t, y, t, size - t, 'rgba(0,0,0,0.25)');
}

/** 너비에 맞춰 글자 단위로 줄바꿈 (최대 maxLines 줄, 넘치면 …) */
function wrap(R: Raster, font: BdfFont, text: string, s: number, maxW: number, maxLines: number) {
  const lines: string[] = [];
  let cur = '';
  for (const ch of text) {
    if (cur && R.measure(font, cur + ch, s) > maxW) { lines.push(cur); cur = ch.trimStart(); } else cur += ch;
  }
  if (cur) lines.push(cur);
  if (lines.length > maxLines) {
    lines.length = maxLines;
    lines[maxLines - 1] = lines[maxLines - 1].slice(0, -1) + '…';
  }
  return lines;
}

export function cardOg(card: Card): Raster {
  const { r: f, b: fb } = loadFonts();
  const R = new Raster(OG_W, OG_H, C.parch);
  // 게임 창 테두리: 남색 · 띠 · 양피지 그늘
  R.frame(0, 0, OG_W, OG_H, 12, C.night);
  R.frame(12, 12, OG_W - 24, OG_H - 24, 6, C.band);
  R.frame(18, 18, OG_W - 36, OG_H - 36, 6, C.parch3);

  // 스테이지: 80칸 × 6 = 480
  const sx = 78, sy = 75;
  R.fill(sx - 6, sy - 6, 492, 492, C.parch4);
  R.grid(PS.stage(card.look), sx, sy, 6);

  const m = moodInfo(card.entry.mood, card.entry.customLabel);
  const x = 618, right = OG_W - 66;
  R.text(f, `TODAY'S MOOD · ${shortDate(card.date)}`, x, 132, 2, C.ink2);

  // 보석 + 기분 이름 (긴 이름은 글자를 줄여요)
  const gy = 168, gs = 48, lx = x + gs + 26;
  gem(R, x, gy, gs, m.color);
  const ls = [5, 4, 3, 2].find(s => R.measure(fb, m.label, s) <= right - lx) ?? 2;
  R.text(fb, m.label, lx, gy + gs / 2 + (11 * ls) / 2, ls, C.ink);

  // 하트 5개 중 n개
  for (let i = 0; i < 5; i++) R.grid(iconGrid('heart', i < card.entry.amount ? m.color : C.parch3, C.night), x + i * 55, 254, 5);

  // 메모 말풍선
  if (card.entry.memo) {
    const lines = wrap(R, f, card.entry.memo, 2, right - x - 40, 3);
    const bw = Math.max(...lines.map(l => R.measure(f, l, 2))) + 40, bh = lines.length * 32 + 24, by = 340;
    R.fill(x - 4, by - 4, bw + 8, bh + 8, C.night);
    for (let k = 0; k < 4; k++) R.fill(x + 36 - k * 4, by - 8 - (3 - k) * 4, 8 + k * 8, 4, C.night); // 위쪽 꼬리
    R.fill(x, by, bw, bh, C.white);
    lines.forEach((l, i) => R.text(f, l, x + 20, by + 12 + 22 + i * 32, 2, C.ink));
  }

  // 아래: 로고
  R.grid(iconGrid('heart', C.pink, C.night), x, 520, 3);
  const w = R.text(fb, 'your mind', x + 40, 544, 2, C.ink);
  R.text(f, '나도 만들기 ▶', x + 40 + w + 24, 544, 2, C.ink2);
  return R;
}

export function defaultOg(): Raster {
  const { r: f, b: fb } = loadFonts();
  const R = new Raster(OG_W, OG_H, C.sky[0]);
  C.sky.forEach((c, i) => { const y0 = Math.round(C.stops[i] * OG_H); R.fill(0, y0, OG_W, OG_H - y0, c); });
  let s = 7919;
  const rnd = () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296;
  for (let i = 0; i < 60; i++) {
    const x = Math.floor(rnd() * 200) * 6, y = Math.floor(rnd() * 50) * 6, c = rnd() < 0.15 ? '#FFE6A0' : rnd() < 0.5 ? C.white : C.lilac;
    if (x > 300 && x < 900 && y > 50 && y < 215) continue; // 글자 자리는 비워요
    R.fill(x, y, 6, 6, c);
  }
  // 광장 320×120 × 4 (양옆 40px 은 잘려요)
  R.grid(PS.plaza(PLAZA_ACTORS), -40, OG_H - 480, 4);
  // 로고 + 한 줄 (글자 그림자 먼저)
  const logo = 'your mind', ls = 5, lw = 9 * ls + 20 + R.measure(fb, logo, ls), lx = Math.round((OG_W - lw) / 2);
  R.grid(iconGrid('heart', C.pink, C.night), lx, 70, ls);
  R.text(fb, logo, lx + 9 * ls + 20 + 5, 120 + 5, ls, C.night);
  R.text(fb, logo, lx + 9 * ls + 20, 120, ls, C.cream);
  const sub = '오늘 기분을 닮은 픽셀 캐릭터', sx = Math.round((OG_W - R.measure(f, sub, 3)) / 2);
  R.text(f, sub, sx + 3, 196 + 3, 3, C.night);
  R.text(f, sub, sx, 196, 3, C.lilac);
  return R;
}

// ── PNG 캐시 (같은 코드 = 같은 그림) ──
let defaultPng: Buffer | undefined;
const cache = new Map<string, Buffer>();
const MAX = 300;

/** code 가 'default' 이거나 열 수 없는 코드면 대표 그림을 줘요 */
export function ogPngFor(code: string): { png: Buffer; isCard: boolean } {
  const card = code === 'default' ? undefined : decodeCard(code);
  if (!card) return { png: (defaultPng ??= defaultOg().png()), isCard: false };
  let png = cache.get(code);
  if (!png) {
    png = cardOg(card).png();
    cache.set(code, png);
    if (cache.size > MAX) cache.delete(cache.keys().next().value!);
  }
  return { png, isCard: true };
}
