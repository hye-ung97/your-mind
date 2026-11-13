import type { Card as CardData } from '../app/link';
import { longDate, moodInfo, shortDate } from '../app/model';
import LiveStage from './LiveStage';
import { Gem, Hearts, Icon, Stage } from './Pixel';

/** 오늘의 기분 카드 (공유 화면 · 링크로 열었을 때 공통). live 면 캐릭터가 움직여요 */
export default function Card({ card, compact, onMake, live, landAt, className, onPoke }: {
  card: CardData; compact?: boolean; onMake?: () => void;
  live?: boolean; landAt?: number; className?: string; onPoke?: () => void;
}) {
  const m = moodInfo(card.entry.mood, card.entry.customLabel);
  const label = `${m.label} 기분의 캐릭터`;
  return (
    <article className={`win card ${className ?? ''}`} aria-label={`오늘의 기분 카드: ${m.label}`}>
      <div className="top"><span>TODAY'S MOOD</span><span>{compact ? shortDate(card.date) : longDate(card.date)}</span></div>
      <span className="slot">
        {live
          ? <LiveStage look={card.look} motion={card.entry.mood} enter="land" landAt={landAt} label={label} onPoke={onPoke} />
          : <Stage look={card.look} fluid label={label} />}
      </span>
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
