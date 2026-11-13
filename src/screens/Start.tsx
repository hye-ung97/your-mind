import { useState } from 'react';
import type { AppCtx } from '../App';
import { Icon, Nav, Stage, Stars, Win } from '../components/Pixel';
import type { Gender } from '../pixel/types';

const OPTIONS: { g: Gender; title: string; gem: string; cap: string }[] = [
  { g: 'm', title: '남자', gem: '#7AA7FF', cap: '삐죽 숏컷 · 트랙 재킷 · 카고 바지 · 스니커즈' },
  { g: 'f', title: '여자', gem: '#FF7EB6', cap: '하이 포니테일 · 큰 리본 · 오프숄더 · 레이어드 스커트' },
];

export default function Start({ ctx, onPick }: { ctx: AppCtx; onPick: (g: Gender) => void }) {
  const [g, setG] = useState<Gender>(ctx.saved.gender ?? 'f');
  return (
    <div className="page sky">
      <Stars n={50} seed={2} />
      <Nav date={ctx.date} mark="새로 시작" />
      <main className="wrap start">
        <div className="center-title">
          <h1 className="t-sky">어떤 캐릭터로 시작할까요?</h1>
          <p className="sub-sky">고른 캐릭터의 기본 코디로 새로 시작해요. 꾸미기에서 언제든 바꿀 수 있어요.</p>
        </div>
        <div className="g-wins" role="radiogroup" aria-label="시작 캐릭터">
          {OPTIONS.map(o => (
            <div key={o.g} role="radio" tabIndex={0} aria-checked={g === o.g} aria-label={o.title} className="g-pick" onClick={() => setG(o.g)}
              onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setG(o.g); } }}>
              <Win title={o.title} gem={o.gem} pick={g === o.g}>
                {g === o.g && <span className="check"><Icon name="check" /></span>}
                <div className="body">
                  <span className={`slot ${g === o.g ? 'on' : ''}`}><Stage look={{ gender: o.g, face: 'calm', bg: 'spot' }} fluid label={`${o.title} 캐릭터`} /></span>
                  <p className="cap">{o.cap}</p>
                </div>
              </Win>
            </div>
          ))}
        </div>
        <div className="start-foot">
          <span className="chip policy"><Icon name="sparkle" c="#FFC94A" />헤어·옷·소품은 성별과 상관없이 모두 고를 수 있어요</span>
          <div className="cta-bar">
            <button className="btn" type="button" onClick={() => onPick(g)}>이 캐릭터로 시작 <Icon name="arrow" scale={3} /></button>
          </div>
        </div>
      </main>
    </div>
  );
}
