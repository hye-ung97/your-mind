import { useState } from 'react';
import type { AppCtx } from '../App';
import { download, renderCardImage, type Ratio } from '../app/cardImage';
import { type Card as CardData, cardUrl } from '../app/link';
import { isoDate, moodInfo } from '../app/model';
import Card from '../components/Card';
import { Icon, Nav, Stars } from '../components/Pixel';

async function copy(text: string) {
  try { await navigator.clipboard.writeText(text); return true; } catch { return false; }
}

export default function Share({ ctx, onEdit, onRestart }: { ctx: AppCtx; onEdit: () => void; onRestart: () => void }) {
  const [ratio, setRatio] = useState<Ratio>('story');
  const [busy, setBusy] = useState(false);
  const card: CardData = { look: ctx.saved.look, entry: ctx.saved.entry, date: ctx.today };
  const m = moodInfo(card.entry.mood, card.entry.customLabel);
  const fileName = (r: Ratio) => `your-mind-${isoDate(card.date)}${r === 'square' ? '-square' : ''}.png`;
  const shareText = `오늘 내 기분은 '${m.label}'${card.entry.memo ? ` · ${card.entry.memo}` : ''}`;

  const run = async (fn: () => Promise<void>) => {
    if (busy) return;
    setBusy(true);
    try { await fn(); } catch (e) {
      if ((e as DOMException)?.name !== 'AbortError') ctx.toast('앗, 잠깐 문제가 생겼어요. 다시 시도해주세요.');
    } finally { setBusy(false); }
  };

  const saveImage = () => run(async () => {
    download(await renderCardImage(card, ratio), fileName(ratio));
    ctx.toast('카드를 이미지로 저장했어요');
  });
  const copyLink = () => run(async () => {
    const ok = await copy(cardUrl(card));
    ctx.toast(ok ? '링크를 복사했어요' : '복사하지 못했어요. 주소창의 링크를 직접 복사해주세요');
  });
  // 인스타그램: 휴대폰의 공유 시트로 이미지를 보내요 (지원하지 않으면 저장)
  const story = () => run(async () => {
    const blob = await renderCardImage(card, 'story');
    const file = new File([blob], fileName('story'), { type: 'image/png' });
    if (navigator.canShare?.({ files: [file] })) {
      await navigator.share({ files: [file], title: 'your mind' });
    } else {
      download(blob, fileName('story'));
      ctx.toast('스토리용 이미지를 저장했어요. 인스타그램에서 올려주세요');
    }
  });
  // 카카오톡: 공유 시트로 링크를 보내요 (지원하지 않으면 링크 복사)
  const kakao = () => run(async () => {
    const url = cardUrl(card);
    if (navigator.share) {
      await navigator.share({ title: 'your mind', text: shareText, url });
    } else {
      const ok = await copy(url);
      ctx.toast(ok ? '링크를 복사했어요. 카카오톡에 붙여 넣어 보내주세요' : '복사하지 못했어요');
    }
  });

  return (
    <div className="page sky">
      <Stars n={50} seed={5} />
      <Nav date={ctx.date} step={3} />
      <main className="wrap share">
        <div className="card-col"><Card card={card} /></div>
        <div className="share-side">
          <div className="deco d-only" aria-hidden="true">
            <Icon name="sparkle" c="#FFC94A" ink="#1A1838" scale={4} /><Icon name="star" c="#FF7EB6" scale={3} />
            <Icon name="sparkle" c="#7ED9C3" scale={3} /><Icon name="heart" c="#FF7EB6" scale={3} />
          </div>
          <h1 className="t-sky">짜잔! 오늘의 내가 완성됐어요</h1>
          <p className="sub-sky">카드로 저장하거나, 링크로 친구에게 오늘 기분을 보여주세요.</p>
          <div className="ratio">
            <span className="seg" role="radiogroup" aria-label="이미지 비율">
              <button type="button" role="radio" aria-checked={ratio === 'story'} className={ratio === 'story' ? 'on' : ''} onClick={() => setRatio('story')}>스토리 9:16</button>
              <button type="button" role="radio" aria-checked={ratio === 'square'} className={ratio === 'square' ? 'on' : ''} onClick={() => setRatio('square')}>정사각형 1:1</button>
            </span>
          </div>
          <div className="share-grid">
            <button className="btn save" type="button" onClick={saveImage} disabled={busy}><Icon name="down" scale={3} />이미지로 저장</button>
            <button className="btn indigo" type="button" onClick={copyLink} disabled={busy}><Icon name="link" ink="#FFF6E3" scale={3} />링크 복사</button>
            <button className="btn parch" type="button" onClick={story} disabled={busy}><Icon name="camera" c="#FF7EB6" scale={3} />인스타그램 스토리</button>
            <button className="btn parch" type="button" onClick={kakao} disabled={busy}><Icon name="chat" c="#FFE07A" scale={3} />카카오톡으로 보내기</button>
          </div>
          <div className="share-more">
            <button className="btn indigo sm" type="button" onClick={onEdit}><Icon name="back" ink="#FFF6E3" />다시 꾸미기</button>
            <button className="linkish" type="button" onClick={onRestart}>처음부터 새로 만들기</button>
          </div>
        </div>
      </main>
    </div>
  );
}
