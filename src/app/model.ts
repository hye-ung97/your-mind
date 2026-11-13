import * as PC from '../pixel/avatar.js';
import * as PS from '../pixel/scene.js';
import type { Gender, Look } from '../pixel/types';

export const MOOD_ORDER = ['happy', 'excited', 'calm', 'tired', 'sad', 'angry', 'blank'] as const;
export type BaseMood = (typeof MOOD_ORDER)[number];
export type MoodId = BaseMood | 'custom';

export const MEMO_MAX = 30;
export const CUSTOM_MAX = 8;
export const HEARTS_MAX = 5;

/** 오늘 남기는 기분 기록 */
export interface Entry {
  mood: MoodId;
  /** '직접 쓰기'로 고른 기분 이름 */
  customLabel: string;
  /** 하트 1~5 */
  amount: number;
  memo: string;
}

export interface MoodInfo { label: string; color: string; soft: string; face: string; bg: string }

/** '직접 쓰기' 기분은 회색 보석 + 포근한 표정 + 맑은 하늘로 시작해요 */
const CUSTOM: MoodInfo = { label: '직접 쓰기', color: '#C9CDD6', soft: '#EEF0F3', face: 'calm', bg: 'sky' };

export function moodInfo(mood: MoodId, customLabel = ''): MoodInfo {
  if (mood === 'custom') return { ...CUSTOM, label: customLabel.trim() || CUSTOM.label };
  const m = PS.MOODS[mood];
  return { label: m.label, color: m.color, soft: m.soft, face: m.face, bg: m.bg };
}

/** 기분을 바꿨을 때: 표정·배경만 기분에 맞추고, 사용자가 꾸민 건 그대로 둬요. (캔버스 starterLook 과 같음) */
/** 받침에 맞는 조사: josa('꽃밭', '을', '를') → '을' */
export function josa(word: string, withFinal: string, withoutFinal: string) {
  const c = word.charCodeAt(word.length - 1);
  const final = c >= 0xac00 && c <= 0xd7a3 ? (c - 0xac00) % 28 !== 0 : false;
  return final ? withFinal : withoutFinal;
}

/** '설레는 날엔' — 미리보기 안내 문장용 */
export const MOOD_DAY: Record<MoodId, string> = {
  happy: '행복한 날엔', excited: '설레는 날엔', calm: '평온한 날엔', tired: '피곤한 날엔',
  sad: '우울한 날엔', angry: '화나는 날엔', blank: '멍한 날엔', custom: '이 기분엔',
};

export function starterLook(mood: MoodId, current: Look): Look {
  const m = moodInfo(mood);
  return { ...current, mood, face: m.face, bg: m.bg };
}

export function defaultLook(gender: Gender): Look {
  return { gender, skin: 'light', ...PC.DEFAULTS[gender] };
}

export const NEW_ENTRY: Entry = { mood: 'excited', customLabel: '', amount: 3, memo: '' };

// ── 저장 (브라우저에만) ─────────────────────────────────────
export interface Saved { v: 1; gender?: Gender; look: Look; entry: Entry; lastDone?: string }
const KEY = 'your-mind:v1';

/** 캐릭터 고르기에서 새로 시작할 때: 고른 성별의 기본 코디 + 새 기록으로 (전에 꾸민 건 지워요) */
export function freshStart(s: Saved, gender: Gender): Saved {
  const entry: Entry = { ...NEW_ENTRY };
  return { ...s, gender, look: starterLook(entry.mood, defaultLook(gender)), entry };
}

export function load(): Saved {
  const fresh: Saved = { v: 1, look: defaultLook('f'), entry: { ...NEW_ENTRY } };
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return fresh;
    const s = JSON.parse(raw) as Saved;
    if (s.v !== 1) return fresh;
    return {
      v: 1,
      gender: s.gender === 'f' || s.gender === 'm' ? s.gender : undefined,
      look: sanitizeLook(s.look) ?? fresh.look,
      entry: sanitizeEntry(s.entry) ?? fresh.entry,
      lastDone: typeof s.lastDone === 'string' ? s.lastDone : undefined,
    };
  } catch {
    return fresh;
  }
}
export function save(s: Saved) {
  try { localStorage.setItem(KEY, JSON.stringify(s)); } catch { /* 저장 공간이 없어도 앱은 계속 동작 */ }
}

// ── 값 검사 (저장된 값·공유 링크 모두 이걸 거쳐요) ─────────────
const pick = (v: unknown, table: Record<string, unknown>) => (typeof v === 'string' && v in table ? v : undefined);
const pickColor = (v: unknown) => (v === '' ? '' : pick(v, PC.CLOTH));

export function sanitizeLook(raw: unknown): Look | undefined {
  if (!raw || typeof raw !== 'object') return undefined;
  const r = raw as Record<string, unknown>;
  const gender: Gender = r.gender === 'm' ? 'm' : 'f';
  const base = defaultLook(gender);
  const acc = typeof r.acc === 'string' ? r.acc.split(',').filter(a => a in PC.ACCS).join(',') : base.acc;
  const mood = r.mood === 'custom' ? 'custom' : pick(r.mood, PS.MOODS);
  return {
    gender,
    mood,
    face: pick(r.face, PC.FACES) ?? 'calm',
    skin: pick(r.skin, PC.SKINS) ?? base.skin,
    eyeColor: pick(r.eyeColor, PC.EYES) ?? base.eyeColor,
    hair: pick(r.hair, PC.HAIRS) ?? base.hair,
    hairColor: pick(r.hairColor, PC.HAIR) ?? base.hairColor,
    top: pick(r.top, PC.TOPS) ?? base.top,
    bottom: pick(r.bottom, PC.BOTTOMS) ?? base.bottom,
    shoes: pick(r.shoes, PC.SHOES) ?? base.shoes,
    acc,
    bg: pick(r.bg, PS.BGS) ?? 'sky',
    topColor: pickColor(r.topColor) ?? '',
    bottomColor: pickColor(r.bottomColor) ?? '',
    shoesColor: pickColor(r.shoesColor) ?? '',
  };
}

export function sanitizeEntry(raw: unknown): Entry | undefined {
  if (!raw || typeof raw !== 'object') return undefined;
  const r = raw as Record<string, unknown>;
  const mood = r.mood === 'custom' ? 'custom' : (MOOD_ORDER as readonly string[]).includes(r.mood as string) ? (r.mood as BaseMood) : undefined;
  if (!mood) return undefined;
  const amount = Math.round(Number(r.amount));
  return {
    mood,
    customLabel: typeof r.customLabel === 'string' ? r.customLabel.slice(0, CUSTOM_MAX) : '',
    amount: amount >= 1 && amount <= HEARTS_MAX ? amount : 3,
    memo: typeof r.memo === 'string' ? r.memo.slice(0, MEMO_MAX) : '',
  };
}

// ── 날짜 ─────────────────────────────────────────────────────
const DAYS_EN = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
const DAYS_KO = ['일', '월', '화', '수', '목', '금', '토'];
const p2 = (n: number) => String(n).padStart(2, '0');
export const isoDate = (d: Date) => `${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())}`;
export function parseIso(s: string | undefined): Date | undefined {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s ?? '');
  if (!m) return undefined;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return isNaN(d.getTime()) ? undefined : d;
}
/** 2026.11.13 FRI */
export const longDate = (d: Date) => `${d.getFullYear()}.${p2(d.getMonth() + 1)}.${p2(d.getDate())} ${DAYS_EN[d.getDay()]}`;
/** 11.13 FRI */
export const shortDate = (d: Date) => `${p2(d.getMonth() + 1)}.${p2(d.getDate())} ${DAYS_EN[d.getDay()]}`;
/** 11월 13일 금요일 */
export const koDate = (d: Date) => `${d.getMonth() + 1}월 ${d.getDate()}일 ${DAYS_KO[d.getDay()]}요일`;
