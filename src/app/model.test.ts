import { describe, expect, it } from 'vitest';
import { decodeCard, encodeCard } from './link';
import { shareCopy } from './shareCopy';
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
    expect(decodeCard('A')).toBeUndefined();
    expect(decodeCard('AgA')).toBeUndefined();
  });
  it('메모가 없으면 링크 코드가 40자도 안 돼요', () => {
    const code = encodeCard({ look: starterLook('happy', defaultLook('m')), entry: { ...NEW_ENTRY, mood: 'happy' }, date: new Date(2026, 10, 13) });
    expect(code.length).toBeLessThan(40);
    expect(code.startsWith('A')).toBe(true);
  });
  it('예전 링크(#/card/ JSON)도 계속 열려요', () => {
    const json = JSON.stringify({ l: { ...defaultLook('m'), hair: 'dandy', mood: 'sad', face: 'sad', bg: 'rain' }, e: { mood: 'sad', customLabel: '', amount: 2, memo: '비 와' }, d: '2026-11-13' });
    const v1 = btoa(String.fromCharCode(...new TextEncoder().encode(json))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    const back = decodeCard(v1)!;
    expect(back.look).toMatchObject({ gender: 'm', hair: 'dandy', bg: 'rain' });
    expect(back.entry).toEqual({ mood: 'sad', customLabel: '', amount: 2, memo: '비 와' });
  });
  it('직접 쓴 기분 · 색 · 소품 여러 개도 왕복해요', () => {
    const card = {
      look: { ...defaultLook('f'), mood: 'custom', face: 'shy', acc: 'crown,glasses', topColor: 'mint', bottomColor: '', shoesColor: 'navy' },
      entry: { mood: 'custom' as const, customLabel: '두근반', amount: 5, memo: '' },
      date: new Date(2025, 0, 2),
    };
    const back = decodeCard(encodeCard(card))!;
    expect(back.look).toMatchObject({ mood: 'custom', face: 'shy', acc: 'crown,glasses', topColor: 'mint', bottomColor: '', shoesColor: 'navy' });
    expect(back.entry).toEqual(card.entry);
    expect(longDate(back.date)).toBe('2025.01.02 THU');
  });
  // 파츠 표의 순서가 바뀌면 이미 보낸 링크가 다른 모습으로 열려요. 이 테스트가 깨지면 표 순서를 되돌려주세요 (새 파츠는 표 끝에만)
  it('고정 코드: 표 순서가 그대로예요', () => {
    expect(decodeCard(GOLDEN)).toMatchObject({
      look: { gender: 'f', mood: 'excited', face: 'love', hair: 'twinTails', hairColor: 'pink', top: 'sailor', bottom: 'checkSkirt', shoes: 'maryjane', acc: 'flowerPin', bg: 'ferris', topColor: 'mint' },
      entry: { mood: 'excited', amount: 4, memo: '첫 출근' },
    });
  });
});
// 2026.11.13 · 설레요 · 하트 4 · '첫 출근' — 위 기대값과 함께 만든 코드예요
const GOLDEN = 'AgACCQICBgQIDAULBQAAAQsBBAAK7LKrIOy2nOq3vMwT';

describe('공유 문구', () => {
  const base = { look: defaultLook('f'), date: new Date(2026, 10, 13) };
  it('제목은 기분 이름, 설명은 하트 줄 + 메모', () => {
    const c = shareCopy({ ...base, entry: { mood: 'excited', customLabel: '', amount: 3, memo: '첫 출근 날!' } });
    expect(c).toEqual({ title: "오늘 내 기분은 '설레요'", description: '♥♥♥♡♡ 첫 출근 날!' });
  });
  it('메모가 없으면 캐릭터를 보러 오라고 해요', () => {
    expect(shareCopy({ ...base, entry: { mood: 'tired', customLabel: '', amount: 5, memo: '  ' } }).description)
      .toBe('♥♥♥♥♥ 눌러서 움직이는 내 캐릭터를 만나보세요');
  });
  it('직접 쓴 기분은 그 이름으로, 이름이 비었으면 기분 이름 없이', () => {
    expect(shareCopy({ ...base, entry: { mood: 'custom', customLabel: '두근반', amount: 1, memo: '' } }).title).toBe("오늘 내 기분은 '두근반'");
    expect(shareCopy({ ...base, entry: { mood: 'custom', customLabel: '', amount: 1, memo: '' } }).title).toBe('오늘 내 기분 카드가 도착했어요');
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
