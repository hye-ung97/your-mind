import { useState } from 'react';
import type { AppCtx } from '../App';
import { download, renderCardImage, type Ratio } from '../app/cardImage';
import { type Card as CardData, cardUrl, encodeCard, ogImagePath } from '../app/link';
import { isoDate } from '../app/model';
import { shareCopy } from '../app/shareCopy';
import Card from '../components/Card';
import { Icon, Nav, Stars } from '../components/Pixel';

async function copy(text: string) {
  try { await navigator.clipboard.writeText(text); return true; } catch { return false; }
}
/** 휴대폰처럼 손가락으로 쓰는 기기에서만 공유 시트를 열어요 (PC 는 링크 복사가 더 자연스러워요) */
const canShareSheet = () => typeof navigator.share === 'function' && matchMedia('(pointer: coarse)').matches;

const POKED_KEY = 'your-mind:poked';
function readPoked() { try { return localStorage.getItem(POKED_KEY) === '1'; } catch { return false; } }

export default function Share({ ctx, onEdit, onRestart }: { ctx: AppCtx; onEdit: () => void; onRestart: () => void }) {
  const [ratio, setRatio] = useState<Ratio>('story');
  const [busy, setBusy] = useState(false);
  const [poked, setPoked] = useState(readPoked);
  const card: CardData = { look: ctx.saved.look, entry: ctx.saved.entry, date: ctx.today };
  const code = encodeCard(card);
  const copyText = shareCopy(card);
  const fileName = (r: Ratio) => `your-mind-${isoDate(card.date)}${r === 'square' ? '-square' : ''}.png`;

  const run = async (fn: () => Promise<void>) => {
    if (busy) return;
    setBusy(true);
    try { await fn(); } catch (e) {
      if ((e as DOMException)?.name !== 'AbortError') ctx.toast('앗, 잠깐 문제가 생겼어요. 다시 시도해주세요.');
    } finally { setBusy(false); }
  };

  // 친구에게 보내기: 휴대폰은 공유 시트(카카오톡 등), PC 는 링크 복사.
  // 링크(/c/코드)를 열면 서버가 그 카드의 미리보기 그림을 붙여줘서, 링크만 보내도 채팅방에 캐릭터가 보여요.
  const send = () => run(async () => {
    const url = cardUrl(card);
    if (canShareSheet()) {
      await navigator.share({ title: copyText.title, text: copyText.title, url });
      return;
    }
    const ok = await copy(url);
    ctx.toast(ok ? '링크를 복사했어요. 카카오톡에 붙여 넣으면 카드가 보여요' : '복사하지 못했어요. 다시 시도해주세요');
  });
  const copyLink = () => run(async () => {
    const ok = await copy(cardUrl(card));
    ctx.toast(ok ? '링크를 복사했어요' : '복사하지 못했어요. 다시 시도해주세요');
  });
  const saveImage = () => run(async () => {
    download(await renderCardImage(card, ratio), fileName(ratio));
    ctx.toast('카드를 이미지로 저장했어요');
  });
  const onPoke = () => {
    if (poked) return;
    setPoked(true);
    try { localStorage.setItem(POKED_KEY, '1'); } catch { /* 저장 못 해도 괜찮아요 */ }
  };

  const insta = (
    <button className="btn parch md soon" type="button" disabled aria-label="인스타그램 스토리 (준비 중)">
      <Icon name="camera" c="#FF7EB6" scale={2} /><span className="t">인스타 스토리</span><span className="tag soon-tag">Coming soon</span>
    </button>
  );

  return (
    <div className="page sky">
      <Stars n={50} seed={5} />
      <Nav date={ctx.date} step={3} />
      <main className="wrap share">
        <div className="card-col">
          <Card card={card} live landAt={0.3} className="card-pop" onPoke={onPoke} />
          {!poked && <span className="poke-tip d-only" aria-hidden="true"><Icon name="sparkle" c="#FFC94A" />콕 눌러보세요</span>}
        </div>
        <div className="share-side">
          <div className="deco d-only" aria-hidden="true">
            <Icon name="sparkle" c="#FFC94A" ink="#1A1838" scale={4} /><Icon name="star" c="#FF7EB6" scale={3} />
            <Icon name="sparkle" c="#7ED9C3" scale={3} /><Icon name="heart" c="#FF7EB6" scale={3} />
          </div>
          <h1 className="t-sky">짜잔! 오늘의 내가 완성됐어요</h1>
          <p className="sub-sky">카드를 보내면 친구도 <span className="hl">움직이는 캐릭터</span>를 바로 볼 수 있어요.</p>
          <div className="send d-only">
            <button className="btn big block" type="button" onClick={send} disabled={busy}><Icon name="chat" c="#FFF6E3" scale={3} />친구에게 보내기</button>
            <p className="cap">카카오톡 · 메시지 어디든 — 링크만 보내도 캐릭터 카드가 보여요</p>
          </div>
          <div className="ratio-row">
            <span className="lbl">이미지 비율</span>
            <span className="seg" role="radiogroup" aria-label="이미지 비율">
              <button type="button" role="radio" aria-checked={ratio === 'story'} className={ratio === 'story' ? 'on' : ''} onClick={() => setRatio('story')}>스토리 9:16</button>
              <button type="button" role="radio" aria-checked={ratio === 'square'} className={ratio === 'square' ? 'on' : ''} onClick={() => setRatio('square')}>정사각형 1:1</button>
            </span>
          </div>
          <div className="share-row">
            <button className="btn indigo md" type="button" onClick={copyLink} disabled={busy}><Icon name="link" ink="#FFF6E3" scale={2} /><span className="t">링크 복사</span></button>
            <button className="btn parch md" type="button" onClick={saveImage} disabled={busy}><Icon name="down" scale={2} /><span className="t">이미지로 저장</span></button>
            {insta}
          </div>
          <div className="win friend-pv d-only">
            <div className="bar"><i className="gem" />친구에게는 이렇게 보여요</div>
            <div className="body">
              <img className="og" src={ogImagePath(code)} alt="" width={206} height={108} />
              <p><b>{copyText.title}</b><br />{copyText.description}<br /><span>링크를 열면 움직이는 캐릭터가 착지해요</span></p>
            </div>
          </div>
          <div className="share-more">
            <button className="btn indigo sm" type="button" onClick={onEdit}><Icon name="back" ink="#FFF6E3" />다시 꾸미기</button>
            <button className="linkish" type="button" onClick={onRestart}>처음부터 새로 만들기</button>
          </div>
        </div>
        <div className="cta-bar m-only send-bar">
          <button className="btn block" type="button" onClick={send} disabled={busy}><Icon name="chat" c="#FFF6E3" scale={3} />친구에게 보내기</button>
          <span className="cap">링크만 보내도 캐릭터 카드가 보여요</span>
        </div>
      </main>
    </div>
  );
}
