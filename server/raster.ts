import type { Grid } from '../src/pixel/types';
import { type BdfFont, hasBit } from './bdf';
import { encodePng } from './png';

type RGBA = [number, number, number, number];
const colors = new Map<string, RGBA>();
function parseColor(c: string): RGBA {
  let v = colors.get(c);
  if (v) return v;
  const hex = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(c);
  if (hex) {
    const h = hex[1].length === 3 ? [...hex[1]].map(x => x + x).join('') : hex[1];
    v = [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16), 1];
  } else {
    const m = /^rgba?\(([^)]+)\)$/.exec(c.replace(/\s+/g, ''));
    const p = m ? m[1].split(',').map(Number) : [0, 0, 0, 1];
    v = [p[0], p[1], p[2], p[3] ?? 1];
  }
  colors.set(c, v);
  return v;
}

/** RGB 그림판: 칠하기 · 픽셀 격자 · 비트맵 글자 */
export class Raster {
  readonly data: Uint8Array;
  constructor(readonly w: number, readonly h: number, bg: string) {
    this.data = new Uint8Array(w * h * 3);
    this.fill(0, 0, w, h, bg);
  }

  fill(x: number, y: number, w: number, h: number, color: string) {
    const [r, g, b, a] = parseColor(color);
    const x0 = Math.max(0, Math.round(x)), y0 = Math.max(0, Math.round(y));
    const x1 = Math.min(this.w, Math.round(x + w)), y1 = Math.min(this.h, Math.round(y + h));
    for (let yy = y0; yy < y1; yy++) {
      let i = (yy * this.w + x0) * 3;
      for (let xx = x0; xx < x1; xx++, i += 3) {
        if (a >= 1) { this.data[i] = r; this.data[i + 1] = g; this.data[i + 2] = b; }
        else {
          this.data[i] = Math.round(this.data[i] * (1 - a) + r * a);
          this.data[i + 1] = Math.round(this.data[i + 1] * (1 - a) + g * a);
          this.data[i + 2] = Math.round(this.data[i + 2] * (1 - a) + b * a);
        }
      }
    }
  }

  /** 테두리만 (두께 t) */
  frame(x: number, y: number, w: number, h: number, t: number, color: string) {
    this.fill(x, y, w, t, color);
    this.fill(x, y + h - t, w, t, color);
    this.fill(x, y, t, h, color);
    this.fill(x + w - t, y, t, h, color);
  }

  /** 픽셀 격자 한 칸 = s px */
  grid(g: Grid, ox: number, oy: number, s: number) {
    g.forEach((row, y) => row.forEach((c, x) => { if (c) this.fill(ox + x * s, oy + y * s, s, s, c); }));
  }

  measure(font: BdfFont, text: string, s: number) {
    let w = 0;
    for (const ch of text) w += (font.glyphs.get(ch.codePointAt(0)!)?.dw ?? 0) * s;
    return w;
  }

  /** baseline 은 글자 기준선의 y. 글꼴에 없는 글자(이모지 등)는 건너뛰어요. 그린 너비를 돌려줘요 */
  text(font: BdfFont, text: string, x: number, baseline: number, s: number, color: string) {
    let pen = x;
    for (const ch of text) {
      const g = font.glyphs.get(ch.codePointAt(0)!);
      if (!g) continue;
      const top = baseline - (g.yo + g.h) * s;
      g.rows.forEach((row, ry) => {
        for (let rx = 0; rx < g.w; rx++) if (hasBit(row, rx)) this.fill(pen + (g.xo + rx) * s, top + ry * s, s, s, color);
      });
      pen += g.dw * s;
    }
    return pen - x;
  }

  png() {
    return encodePng(this.w, this.h, this.data);
  }
}
