import type { Card } from './link';
import { HEARTS_MAX, moodInfo } from './model';

export interface ShareCopy {
  /** 카톡 미리보기 굵은 제목 (og:title) · 공유 시트 첫 줄 */
  title: string;
  /** 카톡 미리보기 회색 설명 (og:description) */
  description: string;
}

/** 카드의 하트 줄을 글자로: 3개면 ♥♥♥♡♡ */
export const heartLine = (n: number) => '♥'.repeat(n) + '♡'.repeat(HEARTS_MAX - n);

/**
 * 친구에게 보낼 때 쓰는 글 — 한 곳에서 정해서 세 군데에 써요.
 *   1) 서버가 /c/<코드> 페이지에 넣는 og:title · og:description (카톡·iMessage 미리보기)
 *   2) '친구에게 보내기' 공유 시트의 글
 *   3) 공유 화면의 '친구에게는 이렇게 보여요' 미리보기
 *
 * 보내는 사람이 쓰는 말이라 제목은 1인칭이에요. 카톡은 제목 1~2줄 · 설명 2줄 정도에서 잘라서
 * 설명은 카드와 같은 순서(하트 → 메모)로 짧게 담아요.
 *   제목  오늘 내 기분은 '설레요'
 *   설명  ♥♥♥♡♡ 첫 출근 날! 떨리지만 기대돼
 *         ♥♥♥♡♡ 눌러서 움직이는 내 캐릭터를 만나보세요   (메모가 없을 때)
 */
export function shareCopy(card: Card): ShareCopy {
  const { mood, customLabel, amount, memo } = card.entry;
  const m = moodInfo(mood, customLabel);
  // '직접 쓰기'를 고르고 이름을 비워 둔 경우엔 '직접 쓰기'가 제목에 들어가지 않게
  const named = mood !== 'custom' || customLabel.trim() !== '';
  const title = named ? `오늘 내 기분은 '${m.label}'` : '오늘 내 기분 카드가 도착했어요';
  const note = memo.trim() || '눌러서 움직이는 내 캐릭터를 만나보세요';
  return { title, description: `${heartLine(amount)} ${note}` };
}
