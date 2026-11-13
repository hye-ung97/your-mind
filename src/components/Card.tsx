import type { Card as CardData } from '../app/link';
import { longDate, moodInfo, shortDate } from '../app/model';
import { Gem, Hearts, Icon, Stage } from './Pixel';

/** 오늘의 기분 카드 (공유 화면 · 링크로 열었을 때 공통) */
export default function Card({ card, compact, onMake }: { card: CardData; compact?: boolean; onMake?: () => void }) {
  const m = moodInfo(card.entry.mood, card.entry.customLabel);
  return (
    <article className="win card" aria-label={`오늘의 기분 카드: ${m.label}`}>
      <div className="top"><span>TODAY'S MOOD</span><span>{compact ? shortDate(card.date) : longDate(card.date)}</span></div>
      <span className="slot"><Stage look={card.look} fluid label={`${m.label} 기분의 캐릭터`} /></span>
      <div className="mname"><Gem c={m.color} size={18} />{m.label}</div>
      <Hearts n={card.entry.amount} c={m.color} scale={3} />
      {card.entry.memo && <div className="speech">{card.entry.memo}</div>}
      <div className="foot">
        <span className="brand"><Icon name="heart" c="#FF7EB6" />your mind</span>
        {onMake ? <button type="button" className="make" onClick={onMake}>나도 만들기 ▶</button> : <span className="make">나도 만들기 ▶</span>}
      </div>
    </article>
  );
}
