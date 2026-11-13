import * as PC from '../pixel/avatar.js';
import * as PS from '../pixel/scene.js';
import type { Look } from '../pixel/types';
import { type Entry, MOOD_ORDER, parseIso, sanitizeEntry, sanitizeLook } from './model';

/** 공유 카드 한 장에 필요한 것 전부 */
export interface Card { look: Look; entry: Entry; date: Date }

// 링크에는 서버 저장 없이 카드 내용을 그대로 담아요.
//   v2 (지금): /c/<코드>  — 값 대신 '표 안의 순서 번호'를 담은 짧은 코드
//   v1 (예전): #/card/<base64url JSON> — 예전에 보낸 링크도 계속 열려요
function bytesToB64Url(bytes: Uint8Array) {
  let bin = '';
  bytes.forEach(b => { bin += String.fromCharCode(b); });
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
function b64UrlToBytes(s: string) {
  const bin = atob(s.replace(/-/g, '+').replace(/_/g, '/'));
  return Uint8Array.from(bin, c => c.charCodeAt(0));
}

// ── v2 ────────────────────────────────────────────────────
// ⚠ 아래 표들의 '키 순서'가 곧 링크 규약이에요. 새 파츠·색·배경은 표 '끝에만' 추가하세요.
//   순서를 바꾸거나 중간에 끼우면 이미 보낸 링크가 다른 모습으로 열려요. (model.test.ts 의 '고정 코드' 테스트가 지켜줘요)
const V2 = 2;
const keys = (o: object) => Object.keys(o);
const ENTRY_MOODS = [...MOOD_ORDER, 'custom'] as const;
const COLOR_FIELDS = new Set<keyof Look>(['topColor', 'bottomColor', 'shoesColor']);
const LOOK_FIELDS: [keyof Look, () => string[]][] = [
  ['mood', () => [...keys(PS.MOODS), 'custom']],
  ['face', () => keys(PC.FACES)],
  ['skin', () => keys(PC.SKINS)],
  ['eyeColor', () => keys(PC.EYES)],
  ['hair', () => keys(PC.HAIRS)],
  ['hairColor', () => keys(PC.HAIR)],
  ['top', () => keys(PC.TOPS)],
  ['bottom', () => keys(PC.BOTTOMS)],
  ['shoes', () => keys(PC.SHOES)],
  ['bg', () => keys(PS.BGS)],
  ['topColor', () => keys(PC.CLOTH)],
  ['bottomColor', () => keys(PC.CLOTH)],
  ['shoesColor', () => keys(PC.CLOTH)],
];
const DAY = 86400000;
const EPOCH = Date.UTC(2020, 0, 1);

/** 작은 수는 1바이트, 큰 수는 여러 바이트 (LEB128) */
class Writer {
  bytes: number[] = [];
  num(n: number) {
    let v = Math.max(0, Math.floor(n));
    while (v >= 0x80) { this.bytes.push((v % 0x80) | 0x80); v = Math.floor(v / 0x80); }
    this.bytes.push(v);
  }
  text(s: string) {
    const u = new TextEncoder().encode(s);
    this.num(u.length);
    u.forEach(b => this.bytes.push(b));
  }
}
class Reader {
  private i = 0;
  constructor(private b: Uint8Array) {}
  num() {
    let n = 0, mul = 1;
    for (let k = 0; k < 5; k++) {
      if (this.i >= this.b.length) throw new Error('짧은 코드');
      const x = this.b[this.i++];
      n += (x & 0x7f) * mul;
      if (!(x & 0x80)) return n;
      mul *= 0x80;
    }
    throw new Error('잘못된 숫자');
  }
  text() {
    const n = this.num();
    if (n > 256 || this.i + n > this.b.length) throw new Error('잘못된 글자');
    const s = new TextDecoder().decode(this.b.subarray(this.i, this.i + n));
    this.i += n;
    return s;
  }
}

function encodeV2({ look, entry, date }: Card): string {
  const w = new Writer();
  w.num(V2);
  w.num(look.gender === 'm' ? 1 : 0);
  for (const [k, list] of LOOK_FIELDS) {
    const v = look[k];
    w.num(typeof v === 'string' && v ? list().indexOf(v) + 1 : 0); // 0 = 비어 있음
  }
  const accKeys = keys(PC.ACCS);
  const accs = String(look.acc ?? '').split(',').map(a => accKeys.indexOf(a)).filter(i => i >= 0);
  w.num(accs.length);
  accs.forEach(i => w.num(i));
  w.num(ENTRY_MOODS.indexOf(entry.mood));
  w.num(entry.amount);
  w.text(entry.customLabel);
  w.text(entry.memo);
  w.num(Math.round((Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) - EPOCH) / DAY));
  return bytesToB64Url(Uint8Array.from(w.bytes));
}

function decodeV2(code: string): Card | undefined {
  const r = new Reader(b64UrlToBytes(code));
  if (r.num() !== V2) return undefined;
  const raw: Record<string, unknown> = { gender: r.num() === 1 ? 'm' : 'f' };
  for (const [k, list] of LOOK_FIELDS) {
    const i = r.num();
    raw[k] = i ? list()[i - 1] : COLOR_FIELDS.has(k) ? '' : undefined;
  }
  const n = r.num();
  if (n > 32) return undefined;
  const accKeys = keys(PC.ACCS);
  raw.acc = Array.from({ length: n }, () => accKeys[r.num()]).filter(Boolean).join(',');
  const entryRaw = { mood: ENTRY_MOODS[r.num()], amount: r.num(), customLabel: r.text(), memo: r.text() };
  const date = new Date(2020, 0, 1 + r.num());
  const look = sanitizeLook(raw);
  const entry = sanitizeEntry(entryRaw);
  if (!look || !entry || isNaN(date.getTime())) return undefined;
  return { look, entry, date };
}

// ── v1 (예전 링크 읽기 전용) ──────────────────────────────
function decodeV1(code: string): Card | undefined {
  const raw = JSON.parse(new TextDecoder().decode(b64UrlToBytes(code)));
  const look = sanitizeLook(raw?.l);
  const entry = sanitizeEntry(raw?.e);
  const date = parseIso(raw?.d);
  if (!look || !entry || !date) return undefined;
  return { look, entry, date };
}

export function encodeCard(card: Card): string {
  return encodeV2(card);
}

/** v1 코드는 언제나 'eyJ'({"…)로 시작하고, v2 코드는 'A'로 시작해요 */
export function decodeCard(code: string): Card | undefined {
  try {
    return code.startsWith('eyJ') ? decodeV1(code) : decodeV2(code);
  } catch {
    return undefined;
  }
}

/** 링크 코드로 쓸 수 있는 글자인지 (서버 라우트·주소 읽기 공통) */
export const CODE_RE = /^[A-Za-z0-9_-]{1,2048}$/;

export const cardPath = (code: string) => `/c/${code}`;
export const ogImagePath = (code: string) => `/og/${code}.png`;

export function cardUrl(card: Card): string {
  return `${location.origin}${cardPath(encodeCard(card))}`;
}
