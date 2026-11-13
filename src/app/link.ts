import type { Look } from '../pixel/types';
import { type Entry, isoDate, parseIso, sanitizeEntry, sanitizeLook } from './model';

/** 공유 카드 한 장에 필요한 것 전부 */
export interface Card { look: Look; entry: Entry; date: Date }

// 링크에는 서버 없이 카드 내용을 그대로 담아요 (#/card/<base64url JSON>)
function toB64Url(text: string) {
  const bytes = new TextEncoder().encode(text);
  let bin = '';
  bytes.forEach(b => { bin += String.fromCharCode(b); });
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
function fromB64Url(s: string) {
  const bin = atob(s.replace(/-/g, '+').replace(/_/g, '/'));
  return new TextDecoder().decode(Uint8Array.from(bin, c => c.charCodeAt(0)));
}

export function encodeCard(card: Card): string {
  const { look, entry } = card;
  return toB64Url(JSON.stringify({ l: look, e: entry, d: isoDate(card.date) }));
}

export function decodeCard(code: string): Card | undefined {
  try {
    const raw = JSON.parse(fromB64Url(code));
    const look = sanitizeLook(raw?.l);
    const entry = sanitizeEntry(raw?.e);
    const date = parseIso(raw?.d);
    if (!look || !entry || !date) return undefined;
    return { look, entry, date };
  } catch {
    return undefined;
  }
}

export function cardUrl(card: Card): string {
  const base = `${location.origin}${location.pathname}`;
  return `${base}#/card/${encodeCard(card)}`;
}
