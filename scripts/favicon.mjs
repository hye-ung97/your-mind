// 파비콘 만들기 — 16×16 픽셀 얼굴(캔버스 .doan/canvases/favicon.html 의 C안) 하나로
//   public/favicon.svg          탭 (크롬·엣지·파이어폭스)
//   public/favicon.ico          16·32·48px 묶음 (SVG 파비콘을 못 쓰는 브라우저 대비)
//   public/apple-touch-icon.png 180×180 아이폰 홈 화면
// 을 만들어요. 그림을 바꾸면 `npm run favicon` 으로 다시 뽑고, 캔버스의 GRIDS.c 도 같이 맞춰주세요.
import { mkdirSync, writeFileSync } from 'node:fs';
import { deflateSync } from 'node:zlib';
import { toSVG } from '../src/pixel/core.js';

const OUT = new URL('../public/', import.meta.url);

// 글자 하나 = 픽셀 하나, '.' 은 투명
const PAL = {
  K: '#1A1838', // 외곽선 (밤하늘 남색)
  H: '#F08DB5', h: '#FFC2DA', d: '#CF6593', // 핑크 머리 · 하이라이트 · 그늘 (C안 HAIR.pink)
  F: '#FFE6D2', // 밝은 피부 (C안 SKINS.light)
  B: '#FF9EC4', // 볼터치
};
const FACE = [
  '................', '.....KKKKKK.....', '...KKHHHHHHKK...', '..KHHhhHHHHHHK..',
  '.KHhhHHHHHHHHdK.', 'KHhHHHHHHHHHHHdK', 'KHHFHHFFFFFFFHdK', 'KHHFFKFFFFKFFHdK',
  'KHHFFKFFFFKFFHdK', 'KHHBBFFFFFFBBHdK', 'KHHFFFKFFKFFFHdK', 'KHHHFFFKKFFFHHdK',
  'KHHHFFFFFFFFHHdK', 'KHHHKKKKKKKKHHdK', '.KKK........KKK.', '................',
];
const N = FACE.length;
const grid = FACE.map(row => [...row].map(ch => PAL[ch] ?? null));

// 밤하늘 띠: src/styles.css 의 .sky 와 같은 비율 (위에서부터 16% · 38% · 60% · 82% · 끝)
const SKY = [[0.16, '#211F4F'], [0.38, '#2B2A63'], [0.6, '#3A3778'], [0.82, '#4E4590'], [1, '#6A519E']];
const sky = t => SKY.find(([stop]) => t < stop)?.[1] ?? SKY.at(-1)[1];

/**
 * 홈 화면 아이콘(180×180) 안에서 16×16 얼굴을 몇 배로, 어디에 놓을지 정해요.
 * 바탕은 밤하늘 띠로 꽉 채워지고, 그 위에 얼굴을 올려요.
 *
 * - scale 은 정수여야 해요. 소수면 칸 경계가 번져서 픽셀 그림이 흐려져요.
 * - iOS 는 아이콘 모서리를 둥글게 깎아요 (180px 기준 반지름 약 40px). 얼굴이 모서리 가까이 가면 머리끝이 잘려요.
 * - 얼굴 그리드는 맨 위 1줄 · 맨 아래 1줄이 비어 있어요 (실제 그림은 1~14번째 줄, 가로는 16칸 꽉 참).
 *
 * @param {number} size 아이콘 한 변 (180)
 * @param {number} n    그리드 한 변 (16)
 * @returns {{ scale: number, x: number, y: number }} x, y = 얼굴 그리드 왼쪽 위 모서리 위치(px)
 */
function touchLayout(size, n) {
  // 가운데 정렬 · ×8 (180 기준 얼굴 128px, 사방 여백 26px — 둥근 모서리에 머리끝이 닿지 않아요)
  const scale = 8;
  const at = Math.floor((size - n * scale) / 2);
  return { scale, x: at, y: at };
}

// ── PNG · ICO 인코더 (의존성 없이) ─────────────────────────
const CRC = Array.from({ length: 256 }, (_, n) => {
  for (let k = 0; k < 8; k++) n = n & 1 ? 0xedb88320 ^ (n >>> 1) : n >>> 1;
  return n >>> 0;
});
const crc32 = buf => { let c = ~0; for (const b of buf) c = CRC[(c ^ b) & 255] ^ (c >>> 8); return ~c >>> 0; };
function chunk(type, data) {
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}
/** size×size RGBA PNG. pixel(x, y) → '#RRGGBB' 또는 null(투명) */
function png(size, pixel) {
  const stride = size * 4 + 1;
  const raw = Buffer.alloc(stride * size); // 줄마다 필터 0 + RGBA, 기본값 0 = 투명
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const c = pixel(x, y);
      if (!c) continue;
      const o = y * stride + 1 + x * 4;
      raw[o] = parseInt(c.slice(1, 3), 16); raw[o + 1] = parseInt(c.slice(3, 5), 16); raw[o + 2] = parseInt(c.slice(5, 7), 16); raw[o + 3] = 255;
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0); ihdr.writeUInt32BE(size, 4); ihdr[8] = 8; ihdr[9] = 6; // 8bit RGBA
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]);
}
/** PNG 여러 장을 담은 ICO (윈도 비스타 이후 · 모든 최신 브라우저가 읽어요) */
function ico(images) {
  const head = Buffer.alloc(6 + 16 * images.length);
  head.writeUInt16LE(1, 2); head.writeUInt16LE(images.length, 4);
  let offset = head.length;
  images.forEach(({ size, data }, i) => {
    const e = 6 + 16 * i;
    head[e] = head[e + 1] = size; // 256 미만만 써요
    head.writeUInt16LE(1, e + 4); head.writeUInt16LE(32, e + 6);
    head.writeUInt32LE(data.length, e + 8); head.writeUInt32LE(offset, e + 12);
    offset += data.length;
  });
  return Buffer.concat([head, ...images.map(i => i.data)]);
}

// ── 만들기 ─────────────────────────────────────────────
const face = scale => (x, y) => grid[Math.floor(y / scale)]?.[Math.floor(x / scale)] ?? null;
mkdirSync(OUT, { recursive: true });

writeFileSync(new URL('favicon.svg', OUT), toSVG(grid, undefined, 'your mind') + '\n');
writeFileSync(new URL('favicon.ico', OUT), ico([16, 32, 48].map(size => ({ size, data: png(size, face(size / N)) }))));
console.log('public/favicon.svg, public/favicon.ico');

const TOUCH = 180;
const { scale, x: ox, y: oy } = touchLayout(TOUCH, N);
if (!Number.isInteger(scale) || scale < 1) throw new Error(`scale 은 1 이상의 정수여야 해요 (지금 ${scale})`);
writeFileSync(new URL('apple-touch-icon.png', OUT), png(TOUCH, (x, y) =>
  (x >= ox && y >= oy ? face(scale)(x - ox, y - oy) : null) ?? sky(y / TOUCH)));
console.log(`public/apple-touch-icon.png (얼굴 ×${scale}, 위치 ${ox}, ${oy})`);
