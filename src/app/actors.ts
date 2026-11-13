import type { Look } from '../pixel/types';

/** 랜딩 광장에 서 있는 다섯 친구 (캔버스 01 랜딩과 같은 구성). 대표 미리보기 그림에도 같이 써요 */
export const PLAZA_ACTORS: { x: number; mood: string; look: Look }[] = [
  { x: 40, mood: 'happy', look: { gender: 'm', face: 'happy' } },
  { x: 100, mood: 'excited', look: { gender: 'f', face: 'excited' } },
  { x: 160, mood: 'tired', look: { gender: 'f', face: 'tired', hair: 'bob', hairColor: 'pink', top: 'pajama', bottom: 'pjpants', shoes: 'slippers', acc: 'beanie' } },
  { x: 220, mood: 'sad', look: { gender: 'm', face: 'sad', hair: 'dandy', hairColor: 'black', top: 'hoodie', shoes: 'boots', acc: 'phones' } },
  { x: 280, mood: 'calm', look: { gender: 'f', face: 'calm', hair: 'long', hairColor: 'blonde', top: 'knit', bottom: 'skirt', shoes: 'loafers', acc: 'glasses' } },
];
