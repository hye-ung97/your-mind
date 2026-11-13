// BDF(텍스트로 된 비트맵 글꼴) 읽기 — galmuri 패키지에 들어 있는 Galmuri11.bdf 를 그대로 써요.
// 네이티브 모듈 없이 미리보기 그림에 한글 도트 글자를 찍기 위한 것이에요.

export interface Glyph {
  /** 그림 크기와 기준선에서의 위치 (BBX) */
  w: number; h: number; xo: number; yo: number;
  /** 다음 글자까지 거리 (DWIDTH) */
  dw: number;
  /** 줄마다 비트 (왼쪽 칸이 가장 높은 비트) */
  rows: Uint8Array[];
}
export interface BdfFont { ascent: number; descent: number; glyphs: Map<number, Glyph> }

export function parseBdf(text: string): BdfFont {
  const font: BdfFont = { ascent: 0, descent: 0, glyphs: new Map() };
  let enc = -1, dw = 0, bbx = [0, 0, 0, 0];
  let bitmap: string[] | null = null;
  for (const raw of text.split('\n')) {
    const line = raw.trim();
    if (bitmap) {
      if (line !== 'ENDCHAR') { bitmap.push(line); continue; }
      if (enc >= 0) {
        const rows = bitmap.map(hex => Uint8Array.from(hex.match(/../g) ?? [], b => parseInt(b, 16)));
        font.glyphs.set(enc, { w: bbx[0], h: bbx[1], xo: bbx[2], yo: bbx[3], dw, rows });
      }
      bitmap = null;
      continue;
    }
    const sp = line.indexOf(' ');
    const key = sp < 0 ? line : line.slice(0, sp);
    const args = sp < 0 ? [] : line.slice(sp + 1).split(/\s+/).map(Number);
    if (key === 'FONT_ASCENT') font.ascent = args[0];
    else if (key === 'FONT_DESCENT') font.descent = args[0];
    else if (key === 'STARTCHAR') { enc = -1; dw = 0; bbx = [0, 0, 0, 0]; }
    else if (key === 'ENCODING') enc = args[0];
    else if (key === 'DWIDTH') dw = args[0];
    else if (key === 'BBX') bbx = args;
    else if (key === 'BITMAP') bitmap = [];
  }
  return font;
}

export const hasBit = (row: Uint8Array, x: number) => ((row[x >> 3] ?? 0) >> (7 - (x & 7))) & 1;
