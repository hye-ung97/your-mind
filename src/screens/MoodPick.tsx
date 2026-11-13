import type { AppCtx } from '../App';
import { CUSTOM_MAX, MEMO_MAX, MOOD_DAY, MOOD_ORDER, type MoodId, josa, moodInfo, starterLook } from '../app/model';
import { Avatar, Gem, Hearts, Icon, Nav, Stage, Stars, Win } from '../components/Pixel';
import * as PC from '../pixel/avatar.js';
import * as PS from '../pixel/scene.js';

export default function MoodPick({ ctx, onNext }: { ctx: AppCtx; onNext: () => void }) {
  const { entry, look, gender } = { ...ctx.saved };
  const m = moodInfo(entry.mood, entry.customLabel);

  const pickMood = (mood: MoodId) => {
    ctx.setEntry({ ...entry, mood });
    ctx.setLook(starterLook(mood, look));
  };
  // 지금 캐릭터에 실제로 들어간 표정·배경을 알려줘요
  const faceName = PC.FACES[look.face ?? m.face]?.name ?? '';
  const bgName = PS.BGS[look.bg ?? m.bg]?.name ?? '';

  return (
    <div className="page sky">
      <Stars n={40} seed={3} />
      <Nav date={ctx.date} step={1} />
      <main className="wrap mood-page">
        <div className="page-title">
          <h1 className="t-sky">오늘 기분이 어때요?</h1>
          <p className="sub-sky">고른 기분에 맞춰 표정과 배경을 먼저 골라둘게요. 꾸미면서 언제든 바꿀 수 있어요.</p>
        </div>
        <div className="mood-cols">
          <Win title="기분 고르기" right={<span className="tag gold">하나만 골라요</span>} className="mood-win">
            <div className="body">
              <div className="mood-grid" role="radiogroup" aria-label="오늘의 기분">
                {MOOD_ORDER.map(id => {
                  const md = PS.MOODS[id], on = entry.mood === id;
                  return (
                    <button key={id} type="button" role="radio" aria-checked={on} className={`slot mood ${on ? 'on' : ''}`} style={{ ['--ms' as string]: md.soft }} onClick={() => pickMood(id)}>
                      {on && <span className="check sm"><Icon name="check" /></span>}
                      <Avatar look={{ gender, face: md.face, acc: '' }} crop="head" scale={2} />
                      <span className="name"><Gem c={md.color} />{md.label}</span>
                    </button>
                  );
                })}
                <button type="button" role="radio" aria-checked={entry.mood === 'custom'} className={`slot mood free ${entry.mood === 'custom' ? 'on' : ''}`} onClick={() => pickMood('custom')}>
                  {entry.mood === 'custom' && <span className="check sm"><Icon name="check" /></span>}
                  <Icon name="plus" ink="#8C83A3" scale={4} />
                  <span className="name">직접 쓰기</span>
                </button>
              </div>
              {entry.mood === 'custom' && (
                <label className="custom-field">
                  <span className="label">기분 이름</span>
                  <span className="field">
                    <input value={entry.customLabel} maxLength={CUSTOM_MAX} placeholder="예: 두근반 설렘반" autoFocus
                      onChange={e => ctx.setEntry({ ...entry, customLabel: e.target.value.slice(0, CUSTOM_MAX) })} />
                    <span>{entry.customLabel.length}/{CUSTOM_MAX}</span>
                  </span>
                </label>
              )}
              <div className="amount">
                <span className="label">얼마나 {entry.mood === 'custom' ? '그래요' : m.label}?</span>
                <Hearts n={entry.amount} c={m.color} scale={3} label="기분의 크기" onPick={amount => ctx.setEntry({ ...entry, amount })} />
                <span className="scale">조금 ··· 아주 많이</span>
              </div>
              <label>
                <span className="label">한 줄 메모 (선택)</span>
                <span className="field" style={{ marginTop: 10 }}>
                  <input value={entry.memo} maxLength={MEMO_MAX} placeholder="오늘 있었던 일을 한 줄로"
                    onChange={e => ctx.setEntry({ ...entry, memo: e.target.value.slice(0, MEMO_MAX) })} />
                  <span>{entry.memo.length}/{MEMO_MAX}</span>
                </span>
              </label>
            </div>
          </Win>
          <Win title="미리보기" right={<span className="chip sm"><Gem c={m.color} />{m.label}</span>} className="prev-win">
            <div className="body">
              <span className="slot"><Stage look={look} fluid label="미리보기 캐릭터" /></span>
              <p className="why">{MOOD_DAY[entry.mood]} 표정 <b>'{faceName}'</b>{josa(faceName, '과', '와')} 배경 <b>'{bgName}'</b>{josa(bgName, '을', '를')} 먼저 골라뒀어요. 다음 단계에서 마음대로 바꿔보세요.</p>
              <button className="btn block d-only" type="button" onClick={onNext}>꾸미러 가기 <Icon name="arrow" scale={3} /></button>
            </div>
          </Win>
        </div>
        <div className="cta-bar m-only">
          <button className="btn block" type="button" onClick={onNext}>꾸미러 가기 <Icon name="arrow" scale={3} /></button>
        </div>
      </main>
    </div>
  );
}
