import { iconGrid } from '../pixel/core.js';
import * as PS from '../pixel/scene.js';
import type { Grid } from '../pixel/types';
import type { Card } from './link';
import { longDate, moodInfo } from './model';

export type Ratio = 'story' | 'square';
const SIZE: Record<Ratio, [number, number]> = { story: [1080, 1920], square: [1080, 1080] };

// 카드는 화면과 같은 360×648 좌표로 그리고, 이미지 크기에 맞춰 키워요
const CW = 360, CH = 648;
const C = {
  night: '#1A1838', band: '#4B4796', parch: '#FFF6E3', parch2: '#F6E8C8', parch3: '#E2CFA6', parch4: '#B79E72',
  ink: '#2B2140', ink2: '#5E5478', drop: 'rgba(10,8,30,.35)',
  sky: ['#211F4F', '#2B2A63', '#3A3778', '#4E4590', '#6A519E'], skyStops: [0, 0.16, 0.38, 0.6, 0.82],
};
const F11 = "'Galmuri11', monospace", F14 = "'Galmuri14', 'Galmuri11', monospace";

// 격자를 1칸=1px 로 따로 그린 뒤 한 번에 키워요 (칸마다 따로 키우면 소수점 경계에 줄무늬가 생겨요)
function drawGrid(x: CanvasRenderingContext2D, g: Grid, ox: number, oy: number, cell: number) {
  const off = document.createElement('canvas');
  off.width = g[0].length; off.height = g.length;
  const o = off.getContext('2d')!;
  g.forEach((row, y) => row.forEach((c, i) => { if (c) { o.fillStyle = c; o.fillRect(i, y, 1, 1); } }));
  x.imageSmoothingEnabled = false;
  x.drawImage(off, ox, oy, off.width * cell, off.height * cell);
}

function wrap(x: CanvasRenderingContext2D, text: string, max: number) {
  const lines: string[] = [];
  let cur = '';
  for (const ch of Array.from(text)) {
    if (x.measureText(cur + ch).width > max && cur) { lines.push(cur); cur = ch; } else cur += ch;
  }
  if (cur) lines.push(cur);
  return lines;
}

export async function renderCardImage(card: Card, ratio: Ratio): Promise<Blob> {
  await Promise.all([`11px ${F11}`, `700 33px ${F11}`, `14px ${F14}`, `700 14px ${F14}`].map(f => document.fonts.load(f)));
  const [W, H] = SIZE[ratio];
  const cv = document.createElement('canvas');
  cv.width = W; cv.height = H;
  const x = cv.getContext('2d')!;
  x.imageSmoothingEnabled = false;

  // 하늘 + 별
  C.sky.forEach((c, i) => { x.fillStyle = c; const y0 = Math.round(C.skyStops[i] * H); x.fillRect(0, y0, W, H - y0); });
  let s = 7919;
  const r = () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296;
  for (let i = 0; i < 70; i++) { x.fillStyle = r() < 0.12 ? '#FFE6A0' : r() < 0.5 ? '#FFFFFF' : '#CFC8F0'; x.fillRect(Math.floor(r() * W / 4) * 4, Math.floor(r() * H / 4) * 4, 4, 4); }

  const k = ratio === 'story' ? 2.4 : 1.5;
  x.save();
  x.translate(Math.round((W - CW * k) / 2), Math.round((H - CH * k) / 2) - (ratio === 'story' ? 20 : 0));
  x.scale(k, k);

  // 창 (어두운 선 + 인디고 띠 + 양피지)
  x.fillStyle = C.drop; x.fillRect(-6, 6, CW + 12, CH + 12);
  x.fillStyle = C.night; x.fillRect(-6, -6, CW + 12, CH + 12);
  x.fillStyle = C.band; x.fillRect(-3, -3, CW + 6, CH + 6);
  x.fillStyle = C.parch3; x.fillRect(0, 0, CW, CH);
  x.fillStyle = C.parch; x.fillRect(3, 3, CW - 6, CH - 6);

  const m = moodInfo(card.entry.mood, card.entry.customLabel);
  x.textBaseline = 'top';
  x.font = `11px ${F11}`; x.fillStyle = C.ink2;
  x.textAlign = 'left'; x.fillText("TODAY'S MOOD", 20, 22);
  x.textAlign = 'right'; x.fillText(longDate(card.date), CW - 20, 22);

  // 스테이지
  x.fillStyle = C.parch4; x.fillRect(18, 45, 324, 324);
  drawGrid(x, PS.stage(card.look), 20, 47, 4);

  // 기분 이름 + 보석
  x.font = `700 33px ${F11}`; x.fillStyle = C.ink;
  const tw = x.measureText(m.label).width, gx = (CW - (18 + 10 + tw)) / 2, ty = 391;
  x.fillStyle = C.night; x.fillRect(gx - 2, ty + 5, 22, 22);
  x.fillStyle = m.color; x.fillRect(gx, ty + 7, 18, 18);
  x.fillStyle = 'rgba(255,255,255,.55)'; x.fillRect(gx, ty + 7, 18, 2); x.fillRect(gx, ty + 7, 2, 18);
  x.fillStyle = 'rgba(0,0,0,.25)'; x.fillRect(gx, ty + 23, 18, 2); x.fillRect(gx + 16, ty + 7, 2, 18);
  x.fillStyle = C.ink; x.textAlign = 'left'; x.fillText(m.label, gx + 28, ty);

  // 하트
  const hw = 9 * 3, hx = (CW - (hw * 5 + 3 * 4)) / 2;
  for (let i = 0; i < 5; i++) drawGrid(x, iconGrid('heart', i < card.entry.amount ? m.color : C.parch3, C.night), hx + i * (hw + 3), 436, 3);

  // 말풍선
  if (card.entry.memo) {
    x.font = `14px ${F14}`;
    const lines = wrap(x, card.entry.memo, 292);
    const bw = Math.min(320, Math.max(...lines.map(l => x.measureText(l).width)) + 28), bh = lines.length * 21 + 20;
    const bx = (CW - bw) / 2, by = 488;
    x.fillStyle = C.night; x.fillRect(bx - 2, by - 2, bw + 4, bh + 4);
    x.beginPath(); x.moveTo(CW / 2, by - 10); x.lineTo(CW / 2 + 6, by - 2); x.lineTo(CW / 2 - 6, by - 2); x.fill();
    x.fillStyle = '#FFFFFF'; x.fillRect(bx, by, bw, bh);
    x.fillStyle = C.ink; x.textAlign = 'center';
    lines.forEach((l, i) => x.fillText(l, CW / 2, by + 11 + i * 21));
  }

  // 아래: 로고
  drawGrid(x, iconGrid('heart', '#FF7EB6', C.night), 20, CH - 34, 2);
  x.font = `700 14px ${F14}`; x.fillStyle = C.ink; x.textAlign = 'left'; x.fillText('your mind', 46, CH - 32);
  x.font = `11px ${F11}`; x.fillStyle = C.ink2; x.textAlign = 'right'; x.fillText('나도 만들기 ▶', CW - 20, CH - 30);
  x.restore();

  return new Promise((ok, fail) => cv.toBlob(b => (b ? ok(b) : fail(new Error('이미지를 만들지 못했어요'))), 'image/png'));
}

export function download(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const a = Object.assign(document.createElement('a'), { href: url, download: name });
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
