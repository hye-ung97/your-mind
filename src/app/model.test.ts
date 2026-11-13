import { describe, expect, it } from 'vitest';
import { decodeCard, encodeCard } from './link';
import { NEW_ENTRY, defaultLook, freshStart, josa, longDate, moodInfo, sanitizeEntry, sanitizeLook, starterLook } from './model';

describe('starterLook', () => {
  it('기분을 바꾸면 표정·배경만 바뀌고 옷은 그대로예요', () => {
    const look = { ...defaultLook('m'), top: 'coat', topColor: 'navy' };
    const next = starterLook('sad', look);
    expect(next).toMatchObject({ mood: 'sad', face: 'sad', bg: 'rain', top: 'coat', topColor: 'navy', gender: 'm' });
  });
  it('직접 쓴 기분은 포근한 표정과 맑은 하늘', () => {
    expect(starterLook('custom', defaultLook('f'))).toMatchObject({ mood: 'custom', face: 'calm', bg: 'sky' });
    expect(moodInfo('custom', '  두근반  ').label).toBe('두근반');
    expect(moodInfo('custom', '').label).toBe('직접 쓰기');
  });
});

describe('sanitize', () => {
  it('모르는 파츠는 성별 기본값으로 바꿔요', () => {
    const l = sanitizeLook({ gender: 'm', hair: '<script>', acc: 'cap,nope,crown', topColor: 'rainbow' })!;
    expect(l.hair).toBe('spiky');
    expect(l.acc).toBe('cap,crown');
    expect(l.topColor).toBe('');
  });
  it('메모는 30자, 하트는 1~5', () => {
    const e = sanitizeEntry({ mood: 'happy', amount: 99, memo: 'x'.repeat(50) })!;
    expect(e.amount).toBe(3);
    expect(e.memo).toHaveLength(30);
    expect(sanitizeEntry({ mood: 'nope' })).toBeUndefined();
  });
});

describe('공유 링크', () => {
  it('한글 메모까지 그대로 왕복해요', () => {
    const card = {
      look: { ...defaultLook('f'), mood: 'excited', face: 'love', bg: 'ferris', topColor: 'mint' },
      entry: { mood: 'excited' as const, customLabel: '', amount: 4, memo: '첫 출근 날! 떨리지만 기대돼 💛' },
      date: new Date(2026, 10, 13),
    };
    const back = decodeCard(encodeCard(card))!;
    expect(back.entry).toEqual(card.entry);
    expect(back.look).toMatchObject({ face: 'love', bg: 'ferris', topColor: 'mint', hair: 'ponytail' });
    expect(longDate(back.date)).toBe('2026.11.13 FRI');
  });
  it('망가진 링크는 무시해요', () => {
    expect(decodeCard('!!!')).toBeUndefined();
    expect(decodeCard('e30')).toBeUndefined();
  });
});

describe('josa', () => {
  it('받침에 따라 조사를 골라요', () => {
    expect(josa('꽃밭', '을', '를')).toBe('을');
    expect(josa('기분 컬러', '을', '를')).toBe('를');
    expect(josa('두근', '과', '와')).toBe('과');
  });
});

describe('freshStart', () => {
  it('캐릭터를 고르면 그 성별의 기본 코디와 새 기록으로 시작해요', () => {
    const before = { v: 1 as const, gender: 'f' as const, lastDone: '2026.11.12 THU',
      look: { ...defaultLook('f'), hair: 'bob', acc: 'crown' }, entry: { mood: 'sad' as const, customLabel: '', amount: 5, memo: '우울' } };
    const next = freshStart(before, 'f');
    expect(next.look).toEqual(starterLook(NEW_ENTRY.mood, defaultLook('f')));
    expect(next.entry).toEqual(NEW_ENTRY);
    expect(next.lastDone).toBe('2026.11.12 THU');
    expect(freshStart(before, 'm').look.gender).toBe('m');
  });
});
