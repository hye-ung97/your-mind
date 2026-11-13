// 움직이는 스테이지에 쓰는 그림들 (캔버스 .doan/canvases/share-motion.html 의 스크립트를 옮긴 것)
// 스테이지 80×80 = 배경+그림자 / 하체 / 상체(+깜빡) / 이펙트 4겹. 움직임 자체는 styles.css 의 키프레임이 맡아요.
import { toSVG } from './core.js';
import * as PC from './avatar.js';
import * as PS from './scene.js';
import type { Grid, Look } from './types';

const INK = '#1A1838';
const SW = 80, OX = 16, OY = 12;

export const grid = (w: number, h: number): Grid => Array.from({ length: h }, () => Array<string | null>(w).fill(null));
const svgOf = (g: Grid) => toSVG(g, [0, 0, g[0].length, g.length]);
const pct = (v: number) => `${((v / SW) * 100).toFixed(4)}%`;

export function stamp(dst: Grid, src: Grid, ox: number, oy: number) {
  src.forEach((row, y) => row.forEach((c, x) => {
    const Y = oy + y, X = ox + x;
    if (c && Y >= 0 && Y < dst.length && X >= 0 && X < dst[0].length) dst[Y][X] = c;
  }));
}

// ── 깜빡임: 눈 뜬 표정의 눈 줄만 지우고 감은 눈 한 줄을 그려요 ──
// 표정 그림은 왼쪽 절반 12칸 문자열이라, 눈이 있는 줄 범위만 알면 돼요.
const EYE_ROWS: Record<string, [number, number]> = {
  calm: [2, 7], excited: [2, 7], sad: [2, 7], pout: [2, 7], sparkle: [2, 7], shock: [2, 7], angry: [3, 6], blank: [3, 7], smug: [4, 7],
};
interface FaceDef { name: string; hidden?: boolean; rows: string[]; rowsR?: string[] }
const FACES = PC.FACES as unknown as Record<string, FaceDef>;

/** 감은 눈 표정 id (없으면 null). 처음 부를 때 FACES 표 끝에 숨김 항목으로 붙여요 */
export function blinkFace(face: string | undefined, gender: string): string | null {
  const r = face ? EYE_ROWS[face] : undefined;
  if (!face || !r || !FACES[face]) return null;
  const id = `${face}-blink-${gender}`;
  if (!FACES[id]) {
    const mid = r[0] + Math.ceil((r[1] - r[0]) / 2);
    const mk = (rows: string[]) => rows.map((row, i) => {
      if (i < r[0] || i > r[1]) return row;
      const ch = [...row];
      for (let x = 0; x < 8; x++) if ('KWEe'.includes(ch[x])) ch[x] = '.';
      if (i === mid) for (let x = 2; x < 8; x++) ch[x] = 'K';
      if (gender === 'f' && i === mid - 1) ch[1] = 'K';
      return ch.join('');
    });
    const src = FACES[face];
    FACES[id] = { name: '깜빡', hidden: true, rows: mk(src.rows), rowsR: src.rowsR ? mk(src.rowsR) : undefined };
  }
  return id;
}

// ── 이펙트 스프라이트: 채운 칸(c)·흰 칸(w)만 적으면 바깥선(K)은 자동 ──
const SPR: Record<string, { rows: string[]; c: string; bare?: boolean }> = {
  heart:  { rows: ['wc.cc', 'ccccc', '.ccc.', '..c..'], c: '#FF7EB6' },
  spark:  { rows: ['.c.', 'cwc', '.c.'], c: '#FFC94A' },
  note:   { rows: ['..cc', '..c.', '..c.', 'ccc.', 'cc..'], c: '#7ED9C3' },
  z:      { rows: ['cccc', '..c.', '.c..', 'cccc'], c: '#CFC8F0' },
  cloud:  { rows: ['..ccc..', '.ccccc.', 'ccccccc', 'ccccccc'], c: '#A9B4CC' },
  drop:   { rows: ['c', 'c'], c: '#7CC8FF' },
  anger:  { rows: ['cc.cc', 'c...c', '.....', 'c...c', 'cc.cc'], c: '#FF4F5E' },
  puff:   { rows: ['.c.', 'ccc'], c: '#FFFFFF' },
  bubble: { rows: ['ccccccccc', 'ccccccccc', 'ccccccccc', '.c.......'], c: '#FFFFFF' },
  dot:    { rows: ['c'], c: INK, bare: true },
};
export function sprite(name: string): Grid {
  const s = SPR[name], pad = s.bare ? 0 : 1;
  const w = Math.max(...s.rows.map(r => r.length)) + pad * 2, h = s.rows.length + pad * 2;
  const g = grid(w, h);
  s.rows.forEach((r, y) => [...r].forEach((ch, x) => { if (ch !== '.') g[y + pad][x + pad] = ch === 'w' ? '#FFFFFF' : s.c; }));
  if (!s.bare) {
    const src = g.map(r => r.slice());
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++)
      if (!src[y][x] && [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => src[y + dy]?.[x + dx])) g[y][x] = INK;
  }
  return g;
}

/** 기분별 이펙트: [스프라이트, x, y (스테이지 칸), 움직임(CSS 클래스), 시작 지연(초)] */
type Fx = [string, number, number, string, number];
const FX: Record<string, Fx[]> = {
  happy:   [['spark', 57, 13, 'twinkle', 0], ['spark', 15, 23, 'twinkle', 0.8], ['spark', 61, 38, 'twinkle', 1.6]],
  excited: [['heart', 56, 19, 'rise', 0], ['heart', 15, 27, 'rise', 0.7], ['heart', 59, 35, 'rise', 1.4]],
  calm:    [['note', 56, 16, 'float', 0], ['note', 16, 28, 'float', 1.6]],
  tired:   [['z', 54, 14, 'zz', 0], ['z', 54, 14, 'zz', 1.5]],
  sad:     [['cloud', 35, 0, 'hover', 0], ['drop', 37, 7, 'drip', 0], ['drop', 41, 7, 'drip', 0.7]],
  angry:   [['anger', 55, 12, 'pulse', 0], ['puff', 23, 13, 'puff', 0], ['puff', 51, 9, 'puff', 0.1]],
  blank:   [['bubble', 53, 5, 'bubble', 0], ['dot', 56, 7, 'dot1', 0], ['dot', 58, 7, 'dot2', 0], ['dot', 60, 7, 'dot3', 0]],
};
FX.custom = FX.calm;
/** 착지·봉투 열림 때 퍼지는 반짝이 8개의 방향 (칸) */
export const BURST: [number, number][] = [[-14, -3], [14, -3], [-10, -11], [10, -11], [0, -15], [-15, 7], [15, 7], [-5, -17]];

function fxSpan(name: string, x: number, y: number, cls: string, vars = '') {
  const g = sprite(name);
  return `<span class="fx ${cls}" style="left:${pct(x)};top:${pct(y)};width:${pct(g[0].length)};height:${pct(g.length)};${vars}">${svgOf(g)}</span>`;
}
/** 봉투처럼 스테이지 밖에서 쓰는 반짝이 (부모 상자 기준 %) */
export function burstHtml(leftPct: number, topPct: number, sizePct: number) {
  const g = svgOf(sprite('spark'));
  return BURST.map(([dx, dy]) =>
    `<span class="fx burst" style="left:${leftPct}%;top:${topPct}%;width:${sizePct}%;aspect-ratio:1;--dx:${dx};--dy:${dy}">${g}</span>`).join('');
}

type Bg = { draw(g: Grid, look: Look): void };

/** 움직이는 스테이지 한 장의 HTML (.ast 안에 넣어요) */
export function liveHtml(lookIn: Look, motion: string, enter: boolean): string {
  const look = PS.withMood(lookIn);
  const bg = grid(SW, SW);
  if (look.bg !== 'none') (PS.BGS[look.bg ?? 'sky'] as unknown as Bg | undefined)?.draw(bg, look);
  stamp(bg, PC.compose(look, { only: ['shadow'] }), OX, OY);
  const char = svgOf(PC.compose({ ...look, shadow: false }));
  const bf = blinkFace(look.face, look.gender ?? 'f');
  const blink = bf ? `<span class="ast-blink">${svgOf(PC.compose({ ...look, face: bf, shadow: false }))}</span>` : '';
  const fx = (FX[motion] ?? []).map(([n, x, y, cls, d]) => fxSpan(n, x, y, cls, `--d:${d}s`)).join('');
  const burst = enter ? BURST.map(([dx, dy]) => fxSpan('spark', 37.5, 41.5, 'burst', `--dx:${dx};--dy:${dy}`)).join('') : '';
  return `<span class="ast-bg">${svgOf(bg)}</span>`
    + `<span class="ast-enter"><span class="ast-poke"><span class="ast-char">`
    + `<span class="ast-lower">${char}</span><span class="ast-upper">${char}${blink}</span>`
    + `</span></span></span>`
    + `<span class="ast-fx">${fx}${burst}${fxSpan('heart', 44, 10, 'poke-heart')}</span>`;
}

// ── 편지 봉투 (42×36) ─────────────────────────────────────
export type EnvState = 'closed' | 'open' | 'empty';
export function envelope(state: EnvState): Grid {
  const W = 42, H = 36, T = 14, B = H - 1, CX = 21;
  const g = grid(W, H);
  const P1 = '#FFF6E3', P2 = '#F6E8C8', P3 = '#E2CFA6', P4 = '#B79E72';
  const tri = (a: number[], b: number[], c: number[], col: string) => {
    const s = (p: number[], q: number[], r: number[]) => (p[0] - r[0]) * (q[1] - r[1]) - (q[0] - r[0]) * (p[1] - r[1]);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const p = [x + 0.5, y + 0.5], d1 = s(p, a, b), d2 = s(p, b, c), d3 = s(p, c, a);
      if (!((d1 < 0 || d2 < 0 || d3 < 0) && (d1 > 0 || d2 > 0 || d3 > 0))) g[y][x] = col;
    }
  };
  const line = (x0: number, y0: number, x1: number, y1: number, col: string) => {
    const dx = Math.abs(x1 - x0), sx = x0 < x1 ? 1 : -1, dy = -Math.abs(y1 - y0), sy = y0 < y1 ? 1 : -1;
    let err = dx + dy;
    for (;;) {
      if (y0 >= 0 && y0 < H && x0 >= 0 && x0 < W) g[y0][x0] = col;
      if (x0 === x1 && y0 === y1) break;
      const e2 = 2 * err;
      if (e2 >= dy) { err += dy; x0 += sx; }
      if (e2 <= dx) { err += dx; y0 += sy; }
    }
  };
  const open = state !== 'closed';
  if (open) { tri([0, T + 1], [W, T + 1], [CX, 1], P3); line(0, T, 20, 1, INK); line(W - 1, T, 21, 1, INK); }
  for (let y = T; y <= B; y++) for (let x = 0; x < W; x++) g[y][x] = P1;
  if (open) { tri([0, T], [W, T], [CX, T + 12], P3); line(1, T + 1, 20, T + 11, P4); line(W - 2, T + 1, 21, T + 11, P4); }
  tri([0, B + 1], [W, B + 1], [CX, T + 9], P2);
  line(1, B - 1, 20, T + 10, P4); line(W - 2, B - 1, 21, T + 10, P4);
  if (!open) { tri([0, T], [W, T], [CX, T + 14], P2); line(0, T, 20, T + 13, INK); line(W - 1, T, 21, T + 13, INK); }
  for (let x = 0; x < W; x++) { g[T][x] = INK; g[B][x] = INK; }
  for (let y = T; y <= B; y++) { g[y][0] = INK; g[y][W - 1] = INK; }
  if (state === 'closed') {
    ['.cc.cc.', 'cwccccc', 'ccccccc', '.ccccc.', '..ccc..', '...c...'].forEach((r, dy) => [...r].forEach((ch, dx) => {
      if (ch !== '.') g[T + 8 + dy][18 + dx] = ch === 'w' ? '#FFFFFF' : '#FF7EB6';
    }));
  }
  return g;
}
