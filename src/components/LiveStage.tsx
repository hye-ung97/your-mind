import { useMemo, useRef, type CSSProperties } from 'react';
import { liveHtml } from '../pixel/live';
import type { Look } from '../pixel/types';

/**
 * 움직이는 스테이지 (캔버스 share-motion 「01 모션 가이드」)
 * 배경+그림자 / 하체 / 상체(숨쉬기·깜빡) / 이펙트 4겹. 움직임은 styles.css 의 .ast 키프레임이 맡아요.
 * - motion: 기분 id (happy·excited·…·custom) → 시그니처 모션
 * - enter='land': 위에서 떨어져 착지 (landAt 초 뒤 시작)
 * - 누르면 폴짝 + 하트 (콕)
 */
export default function LiveStage({ look, motion, enter, landAt = 0, label, onPoke }: {
  look: Look; motion: string; enter?: 'land'; landAt?: number; label?: string; onPoke?: () => void;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const lookKey = JSON.stringify(look); // 같은 모습이면 다시 그리지 않아요
  const html = useMemo(() => liveHtml(JSON.parse(lookKey) as Look, motion, !!enter), [lookKey, motion, enter]);

  // 콕: 같은 클래스를 다시 붙여도 애니메이션이 처음부터 돌도록 한 번 떼었다 붙여요
  const poke = () => {
    const el = ref.current;
    if (!el) return;
    el.querySelectorAll<HTMLElement>('.ast-poke, .poke-heart').forEach(n => {
      n.classList.remove('on');
      void n.offsetWidth;
      n.classList.add('on');
    });
    onPoke?.();
  };

  return (
    <span
      ref={ref}
      className={`ast mo-${motion}${enter ? ` enter-${enter}` : ''}`}
      style={{ '--land-at': `${landAt}s` } as CSSProperties}
      role="img"
      aria-label={label}
      onClick={poke}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
