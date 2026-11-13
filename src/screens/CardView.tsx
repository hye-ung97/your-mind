import { useEffect, useMemo, useRef, useState, type CSSProperties, type MouseEvent } from 'react';
import type { AppCtx } from '../App';
import { download, renderCardImage } from '../app/cardImage';
import type { Card as CardData } from '../app/link';
import { isoDate } from '../app/model';
import Card from '../components/Card';
import LiveStage from '../components/LiveStage';
import { Icon, Nav, PixelArt, Stars } from '../components/Pixel';
import { burstHtml, envelope } from '../pixel/live';

const ENV = { closed: envelope('closed'), open: envelope('open'), empty: envelope('empty') };
/** 편지 연출이 끝나는 시각 (초). 이보다 먼저 누르면 건너뛰어요 */
const ARRIVE_END = 2.4;
const BURST = burstHtml(45, 32, 10);

// 같은 탭에서 같은 링크를 다시 열면 연출은 생략해요
const seenKey = (code: string) => `your-mind:seen:${code}`;
function shouldPlay(code: string) {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return false;
  try { return !sessionStorage.getItem(seenKey(code)); } catch { return true; }
}
function markSeen(code: string) {
  try { sessionStorage.setItem(seenKey(code), '1'); } catch { /* 저장소를 못 써도 괜찮아요 */ }
}

/** 공유 링크로 들어왔을 때: 편지 도착 → 카드 → 캐릭터 착지 (캔버스 share-motion 02 · 04 · M2 · M3) */
export default function CardView({ ctx, code, card, onMake }: { ctx: AppCtx; code: string; card?: CardData; onMake: () => void }) {
  const [play] = useState(() => !!card && shouldPlay(code));
  const [skipped, setSkipped] = useState(false);
  const start = useRef(performance.now());
  useEffect(() => { if (card) markSeen(code); }, [card, code]);

  // 연출 중 첫 탭은 '건너뛰기'로만 써요 (보이지 않는 버튼이 눌리지 않게)
  const skip = (e: MouseEvent) => {
    if (!play || skipped || performance.now() - start.current > ARRIVE_END * 1000) return;
    e.preventDefault();
    e.stopPropagation();
    setSkipped(true);
  };
  const saveImage = async () => {
    if (!card) return;
    try { download(await renderCardImage(card, 'square'), `your-mind-friend-${isoDate(card.date)}.png`); ctx.toast('카드를 이미지로 저장했어요'); }
    catch { ctx.toast('앗, 잠깐 문제가 생겼어요. 다시 시도해주세요.'); }
  };

  if (!card) return <Broken ctx={ctx} onMake={onMake} />;

  const style = { '--t': skipped ? `${ARRIVE_END}s` : '0s' } as CSSProperties;
  return (
    <div className={`page sky ${play ? 'arrive' : ''}`} style={style} onClickCapture={skip}>
      <Stars n={50} seed={6} />
      <Nav date={ctx.date} />
      <main className="wrap view">
        <div className="view-left">
          <span className="d-only"><PixelArt grid={ENV.open} scale={3} /></span>
          <h1 className="t-sky">친구의 오늘 기분이<br className="d-only" /> 도착했어요</h1>
          <div className="swap">
            {play && <p className="sub-sky a-wait">두근두근… 봉투를 여는 중</p>}
            <p className="sub-sky a-done">캐릭터를 콕 눌러보세요, 반응해요!<span className="d-only"><br />나도 오늘 기분을 닮은 캐릭터를 만들어 답장해볼까요?</span></p>
          </div>
          <div className="view-cta d-only cta-arr">
            <button className="btn big" type="button" onClick={onMake}>나도 만들기 <Icon name="arrow" scale={3} /></button>
            <button className="linkish" type="button" onClick={saveImage}>이 카드 이미지로 저장</button>
          </div>
          <p className="cap d-only">만든 카드를 친구에게 보내면 답장이 돼요</p>
        </div>
        <div className="view-card">
          <Card card={card} onMake={onMake} live landAt={play ? 1.3 : 0.3} className={play ? 'card-arr' : 'card-pop'} />
          {play && (
            <span className="arr-pos" aria-hidden="true">
              <span className="arr-env">
                <span className="env-o"><PixelArt grid={ENV.open} fluid /></span>
                <span className="env-c"><PixelArt grid={ENV.closed} fluid /></span>
                <span dangerouslySetInnerHTML={{ __html: BURST }} />
              </span>
            </span>
          )}
        </div>
        <div className="cta-bar m-only cta-arr">
          <button className="btn" type="button" onClick={onMake}>나도 만들기 <Icon name="arrow" scale={3} /></button>
          <span className="cap">만든 카드를 보내면 답장이 돼요</span>
        </div>
      </main>
    </div>
  );
}

/** 링크가 깨졌을 때 (M3): 빈 봉투 옆에서 캐릭터가 '멍—' */
function Broken({ ctx, onMake }: { ctx: AppCtx; onMake: () => void }) {
  const look = useMemo(() => ({ gender: 'f' as const, mood: 'blank', face: 'blank', bg: 'none' }), []);
  return (
    <div className="page sky">
      <Stars n={50} seed={6} />
      <Nav date={ctx.date} />
      <main className="wrap broken">
        <div className="center-title">
          <h1 className="t-sky">카드를 열 수 없어요</h1>
          <p className="sub-sky">링크가 잘렸거나 바뀐 것 같아요.<br />보낸 친구에게 다시 받아보세요.</p>
        </div>
        <div className="broken-scene" aria-hidden="true">
          <span className="broken-env"><PixelArt grid={ENV.empty} fluid /></span>
          <span className="broken-char"><LiveStage look={look} motion="blank" /></span>
        </div>
        <div className="note broken-tip"><b>이럴 때 많이 깨져요</b>링크를 일부만 복사했거나, 메신저에서 링크가 두 줄로 나뉘면 열리지 않아요.</div>
        <div className="cta-bar">
          <button className="btn" type="button" onClick={onMake}>나도 만들기 <Icon name="arrow" scale={3} /></button>
        </div>
      </main>
    </div>
  );
}
