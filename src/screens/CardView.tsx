import type { AppCtx } from '../App';
import type { Card as CardData } from '../app/link';
import Card from '../components/Card';
import { Icon, Nav, Stars } from '../components/Pixel';

/** 공유 링크로 들어왔을 때: 카드만 보여주고 '나도 만들기'로 이어줘요 */
export default function CardView({ ctx, card, onMake }: { ctx: AppCtx; card?: CardData; onMake: () => void }) {
  return (
    <div className="page sky">
      <Stars n={50} seed={6} />
      <Nav date={ctx.date} />
      <main className="wrap card-view">
        {card ? (
          <>
            <div className="center-title">
              <h1 className="t-sky">친구의 오늘 기분이 도착했어요</h1>
              <p className="sub-sky">나도 오늘 기분을 닮은 캐릭터를 만들어볼까요?</p>
            </div>
            <Card card={card} onMake={onMake} />
          </>
        ) : (
          <div className="center-title">
            <h1 className="t-sky">카드를 열 수 없어요</h1>
            <p className="sub-sky">링크가 잘렸거나 바뀐 것 같아요. 보낸 친구에게 다시 받아보세요.</p>
          </div>
        )}
        <div className="cta-bar">
          <button className="btn" type="button" onClick={onMake}>나도 만들기 <Icon name="arrow" scale={3} /></button>
        </div>
      </main>
    </div>
  );
}
