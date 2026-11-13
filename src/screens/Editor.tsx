import { useMemo, useState } from 'react';
import type { AppCtx } from '../App';
import { MOOD_ORDER, defaultLook, moodInfo, starterLook } from '../app/model';
import { Gem, Hearts, Icon, Nav, PixelArt, Stage, Stars } from '../components/Pixel';
import * as PC from '../pixel/avatar.js';
import * as PS from '../pixel/scene.js';
import type { Look, Part } from '../pixel/types';

type Tab = 'hair' | 'face' | 'top' | 'bottom' | 'shoes' | 'acc' | 'bg';
interface Cat { title: string; icon: string; iconC: string; src: Record<string, Part>; crop?: keyof typeof PC.CROPS; scale: number; only?: string[]; look?: (k: string) => Look; stage?: boolean }

// 탭별 썸네일 규칙 (캔버스 04 꾸미기와 같음)
const CATS: Record<Tab, Cat> = {
  hair:   { title: '헤어', icon: 'hair',  iconC: '#5A3B2A', src: PC.HAIRS,   crop: 'hair',   scale: 2, look: k => ({ hair: k, acc: '' }) },
  face:   { title: '얼굴', icon: 'smile', iconC: '#FFD23F', src: PC.FACES,   crop: 'head',   scale: 2, look: k => ({ face: k }) },
  top:    { title: '상의', icon: 'shirt', iconC: '#7AA7FF', src: PC.TOPS,    crop: 'top',    scale: 3, only: ['top'] },
  bottom: { title: '하의', icon: 'pants', iconC: '#6F7A4F', src: PC.BOTTOMS, crop: 'bottom', scale: 3, only: ['bottom'] },
  shoes:  { title: '신발', icon: 'shoe',  iconC: '#FF6B57', src: PC.SHOES,   crop: 'shoes',  scale: 3, only: ['shoes'] },
  acc:    { title: '소품', icon: 'bow',   iconC: '#FF4F7B', src: PC.ACCS,    crop: 'acc',    scale: 2, look: k => ({ acc: k }) },
  bg:     { title: '배경', icon: 'frame', iconC: '#A6DDFF', src: PS.BGS,     stage: true,    scale: 1 },
};
const TABS = Object.keys(CATS) as Tab[];
const visible = (o: Record<string, Part>) => Object.keys(o).filter(k => !o[k].hidden);
const pick = (o: Record<string, Part | unknown>) => { const k = Object.keys(o).filter(k => !(o[k] as Part).hidden); return k[Math.floor(Math.random() * k.length)]; };

function Thumb({ tab, look, k }: { tab: Tab; look: Look; k: string }) {
  const c = CATS[tab];
  if (c.stage) return <PixelArt grid={PS.stage({ ...look, bg: k })} scale={1} fluid />;
  const g = PC.compose({ ...look, ...(c.look ? c.look(k) : { [tab]: k }) }, { only: c.only });
  return <PixelArt grid={g} crop={PC.CROPS[c.crop!]} scale={c.scale} className="thumb" />;
}

const CLOTH_TITLE: Partial<Record<Tab, string>> = { top: '상의 색', bottom: '하의 색', shoes: '신발 색' };
const RAINBOW = 'linear-gradient(135deg,#FF7EB6 0 33%,#FFD23F 33% 66%,#7AA7FF 66%)';

export default function Editor({ ctx, onBack, onDone }: { ctx: AppCtx; onBack: () => void; onDone: () => void }) {
  const { entry } = ctx.saved;
  const look = ctx.saved.look;
  const [tab, setTab] = useState<Tab>('hair');
  const [recOnly, setRecOnly] = useState(false);
  const [hist, setHist] = useState<{ past: Look[]; future: Look[] }>({ past: [], future: [] });

  // 캐릭터를 바꾸면서, 되돌리기로 기분이 바뀐 경우 기록의 기분도 맞춰요
  const apply = (next: Look) => {
    ctx.setLook(next);
    if (next.mood && next.mood !== entry.mood) ctx.setEntry({ ...entry, mood: next.mood as typeof entry.mood });
  };
  const set = (patch: Look) => {
    setHist(h => ({ past: [...h.past, look], future: [] }));
    apply({ ...look, ...patch });
  };
  const undo = () => { if (!hist.past.length) return; setHist(h => ({ past: h.past.slice(0, -1), future: [look, ...h.future] })); apply(hist.past[hist.past.length - 1]); };
  const redo = () => { if (!hist.future.length) return; setHist(h => ({ past: [...h.past, look], future: h.future.slice(1) })); apply(hist.future[0]); };

  const m = moodInfo(entry.mood, entry.customLabel);
  const recs = PS.MOODS[look.mood ?? '']?.rec;
  const isRec = (cat: Tab, k: string) => (recs?.[cat] ?? (cat === 'face' && recs ? [PS.MOODS[look.mood!].face] : [])).includes(k);
  const accs = String(look.acc || '').split(',').filter(Boolean);
  const isOn = (cat: Tab, k: string) => (cat === 'acc' ? accs.includes(k) : look[cat] === k);

  const c = CATS[tab];
  const keys = useMemo(() => {
    const all = visible(c.src);
    return recOnly ? all.filter(k => isRec(tab, k)) : all;
  }, [tab, recOnly, look.mood]);

  const choose = (k: string) => {
    if (tab === 'acc') set({ acc: (accs.includes(k) ? accs.filter(x => x !== k) : accs.concat(k)).join(',') });
    else set({ [tab]: k });
  };
  const nextMood = () => {
    const i = MOOD_ORDER.indexOf(entry.mood as (typeof MOOD_ORDER)[number]);
    set(starterLook(MOOD_ORDER[(i + 1) % MOOD_ORDER.length], look));
  };
  const random = () => set({
    hair: pick(PC.HAIRS), hairColor: pick(PC.HAIR), top: pick(PC.TOPS), bottom: pick(PC.BOTTOMS), shoes: pick(PC.SHOES),
    acc: Object.keys(PC.ACCS).filter(() => Math.random() < 0.15).join(','),
    topColor: Math.random() < 0.4 ? pick(PC.CLOTH) : '', bottomColor: Math.random() < 0.4 ? pick(PC.CLOTH) : '', shoesColor: Math.random() < 0.4 ? pick(PC.CLOTH) : '',
  });
  const reset = () => set(starterLook(entry.mood, defaultLook(look.gender ?? 'f')));

  const swatches = (title: string, key: keyof Look, opts: [string, string, string][], small?: boolean) => (
    <div>
      <span className="label">{title}</span>
      <div className={`row ${small ? 'small' : ''}`} role="radiogroup" aria-label={title}>
        {opts.map(([k, bg, name]) => (
          <button key={k || 'base'} type="button" role="radio" aria-checked={(look[key] ?? '') === k} aria-label={name} title={name}
            className={`swatch ${(look[key] ?? '') === k ? 'on' : ''}`} style={{ background: bg }} onClick={() => set({ [key]: k })} />
        ))}
      </div>
    </div>
  );
  const colorRows = () => {
    if (tab === 'hair') return swatches('헤어 컬러', 'hairColor', Object.entries(PC.HAIR).map(([k, v]) => [k, v.b, k]));
    if (tab === 'face') return (<>
      {swatches('눈 색', 'eyeColor', Object.entries(PC.EYES).map(([k, v]) => [k, v.e, k]), true)}
      {swatches('피부 톤', 'skin', Object.entries(PC.SKINS).map(([k, v]) => [k, v.b, k]), true)}
    </>);
    if (tab === 'acc') return <p className="hint">다시 누르면 빠져요. 리본·초커·귀걸이처럼 겹쳐 쓸 수 있어요.</p>;
    if (tab === 'bg') return <p className="hint">'기분 컬러' 배경은 고른 기분의 색을 따라가요.</p>;
    const key = `${tab}Color` as keyof Look;
    return swatches(CLOTH_TITLE[tab]!, key, [['', RAINBOW, '원래 색'] as [string, string, string]].concat(Object.entries(PC.CLOTH).map(([k, v]) => [k, v.c, v.name])));
  };

  return (
    <div className="page sky">
      <Stars n={40} seed={4} maxH={160} />
      <Nav date={ctx.date} step={2} />
      <main className="wrap editor">
        <section className="win stage-win" aria-label="캐릭터 미리보기">
          <div className="bar">
            <Gem c={m.color} /><span>{m.label}</span><span className="d-only"><Hearts n={entry.amount} c={m.color} scale={1} /></span>
            <span className="right">
              <button className="btn parch sm" type="button" onClick={nextMood}>기분 바꾸기</button>
              <span className="seg" role="radiogroup" aria-label="성별 기본 코디">
                {(['f', 'm'] as const).map(g => (
                  <button key={g} type="button" role="radio" aria-checked={look.gender === g} className={look.gender === g ? 'on' : ''}
                    onClick={() => look.gender !== g && set({ ...PC.DEFAULTS[g], gender: g })}>{g === 'f' ? '여' : '남'}</button>
                ))}
              </span>
            </span>
          </div>
          <div className="body">
            <span className="slot stage-slot"><Stage look={look} fluid label="꾸미는 중인 캐릭터" /></span>
            <div className="tools">
              <button className="btn parch sm" type="button" onClick={undo} disabled={!hist.past.length} aria-label="되돌리기"><Icon name="undo" /><span className="t">되돌리기</span></button>
              <button className="btn parch sm" type="button" onClick={redo} disabled={!hist.future.length} aria-label="다시하기"><Icon name="redo" /><span className="t">다시하기</span></button>
              <button className="btn sm" type="button" onClick={random} aria-label="랜덤"><Icon name="dice" /><span className="t">랜덤</span></button>
              <button className="btn parch sm" type="button" onClick={reset} aria-label="처음으로"><Icon name="reset" /><span className="t">처음으로</span></button>
            </div>
          </div>
        </section>
        <section className="win edit-win" aria-label="꾸미기">
          <div className="bar"><Gem />꾸미기<span className="right"><span className="tag gold">성별 상관없이 모든 아이템</span></span></div>
          <div className="body">
            <nav className="tabs" role="tablist" aria-label="파츠 종류">
              {TABS.map(t => (
                <button key={t} type="button" role="tab" aria-selected={tab === t} className={`tab ${tab === t ? 'on' : ''}`} onClick={() => setTab(t)}>
                  <Icon name={CATS[t].icon} c={CATS[t].iconC} />{CATS[t].title}
                </button>
              ))}
            </nav>
            <div className="ptitle">
              <h3>{c.title}{tab === 'acc' ? ' · 여러 개 겹쳐 쓰기' : ` · ${keys.length}개`}</h3>
              <button type="button" className={`toggle ${recOnly ? 'on' : ''}`} aria-pressed={recOnly} onClick={() => setRecOnly(v => !v)} disabled={!recs}>
                <span className="sw" />추천만 보기
              </button>
            </div>
            <div className="items" role="listbox" aria-label={c.title} aria-multiselectable={tab === 'acc'}>
              {keys.map(k => (
                <button key={k} type="button" role="option" aria-selected={isOn(tab, k)} className={`item ${isOn(tab, k) ? 'on' : ''}`} onClick={() => choose(k)}>
                  <span className={`slot ${isOn(tab, k) ? 'on' : ''}`}>
                    {isRec(tab, k) && <span className="rec"><span className="tag gold">추천</span></span>}
                    <Thumb tab={tab} look={look} k={k} />
                  </span>
                  {c.src[k].name}
                </button>
              ))}
              {!keys.length && <p className="hint">이 기분에 추천하는 아이템이 없어요.</p>}
            </div>
            <div className={`colors ${tab === 'face' ? 'many' : ''}`}>{colorRows()}</div>
          </div>
        </section>
        <div className="edit-foot cta-bar">
          <button className="btn parch" type="button" onClick={onBack}>이전</button>
          <button className="btn" type="button" onClick={onDone}>완성하기 <Icon name="arrow" scale={3} /></button>
        </div>
      </main>
    </div>
  );
}
