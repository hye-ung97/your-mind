import type { AppCtx } from '../App';
import { go } from '../App';
import { PLAZA_ACTORS as ACTORS } from '../app/actors';
import { encodeCard } from '../app/link';
import { koDate } from '../app/model';
import { Gem, Icon, Nav, PixelArt, Stars } from '../components/Pixel';
import * as PS from '../pixel/scene.js';

const PLAZA = PS.plaza(ACTORS);

// '예시 둘러보기' 카드
const SAMPLE = encodeCard({
  look: { gender: 'f', mood: 'excited', face: 'love', bg: 'ferris', hair: 'twinTails', hairColor: 'pink', top: 'sailor', bottom: 'checkSkirt', shoes: 'maryjane', acc: 'flowerPin' },
  entry: { mood: 'excited', customLabel: '', amount: 4, memo: '첫 출근 날! 떨리지만 기대돼' },
  date: new Date(),
});

export default function Landing({ ctx, onStart }: { ctx: AppCtx; onStart: () => void }) {
  return (
    <div className="page sky landing">
      <Stars n={60} seed={1} maxH={420} />
      <Nav date={ctx.date} />
      <main className="hero">
        <span className="chip"><Icon name="sparkle" c="#FFC94A" />{koDate(ctx.today)}, 오늘 기분은 어때요?</span>
        <h1 className="t-sky">오늘 당신의 기분을<br className="m-only" /> 표현해주세요</h1>
        <p className="lead">기분을 닮은 픽셀 캐릭터를 꾸미고,<br className="m-only" /> 카드 한 장으로 공유해보세요.</p>
        <div className="hero-cta">
          <button className="btn" type="button" onClick={onStart}>오늘의 나 만들기 <Icon name="arrow" scale={3} /></button>
          <button className="btn indigo" type="button" onClick={() => go(`card/${SAMPLE}`)}>예시 둘러보기</button>
        </div>
      </main>
      <div className="plaza">
        <PixelArt grid={PLAZA} fluid label="기분이 다른 캐릭터들이 모인 광장" />
        {ACTORS.map(a => {
          const m = PS.MOODS[a.mood];
          return (
            <span key={a.x} className="bubble" style={{ left: `${(a.x / PS.PW) * 100}%` }}><Gem c={m.color} />{m.label}</span>
          );
        })}
      </div>
    </div>
  );
}
