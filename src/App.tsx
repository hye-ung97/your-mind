import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { decodeCard } from './app/link';
import { type Entry, type Saved, defaultLook, load, longDate, save, starterLook } from './app/model';
import type { Gender, Look } from './pixel/types';
import Landing from './screens/Landing';
import Start from './screens/Start';
import MoodPick from './screens/MoodPick';
import Editor from './screens/Editor';
import Share from './screens/Share';
import CardView from './screens/CardView';

export type Route = '' | 'start' | 'mood' | 'edit' | 'share' | `card/${string}`;

function readHash(): Route {
  return location.hash.replace(/^#\/?/, '') as Route;
}
export function go(r: Route) {
  if (readHash() === r) return;
  location.hash = `/${r}`;
}

export interface AppCtx {
  today: Date;
  date: string;
  saved: Saved;
  setLook: (look: Look) => void;
  setEntry: (e: Entry) => void;
  toast: (msg: string) => void;
}

export default function App() {
  const [route, setRoute] = useState<Route>(readHash);
  const [saved, setSaved] = useState<Saved>(load);
  const [toastMsg, setToastMsg] = useState('');
  const toastTimer = useRef<number>();
  const today = useMemo(() => new Date(), []);

  useEffect(() => {
    const on = () => { setRoute(readHash()); window.scrollTo(0, 0); };
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);
  useEffect(() => save(saved), [saved]);

  const toast = useCallback((msg: string) => {
    setToastMsg(msg);
    window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToastMsg(''), 2400);
  }, []);

  const ctx: AppCtx = {
    today,
    date: longDate(today),
    saved,
    setLook: look => setSaved(s => ({ ...s, look })),
    setEntry: entry => setSaved(s => ({ ...s, entry })),
    toast,
  };

  // 처음 고른 캐릭터를 기억하고, 바로 기분 고르기로
  const chooseGender = (g: Gender) => {
    setSaved(s => ({ ...s, gender: g, look: starterLook(s.entry.mood, s.gender === g ? s.look : defaultLook(g)) }));
    go('mood');
  };
  const begin = () => go(saved.gender ? 'mood' : 'start');

  let screen: JSX.Element;
  const needsGender = (r: Route) => (r === 'mood' || r === 'edit' || r === 'share') && !saved.gender;
  if (route.startsWith('card/')) {
    const card = decodeCard(route.slice(5));
    screen = <CardView ctx={ctx} card={card} onMake={begin} />;
  } else if (needsGender(route) || route === 'start') {
    screen = <Start ctx={ctx} onPick={chooseGender} />;
  } else if (route === 'mood') {
    screen = <MoodPick ctx={ctx} onNext={() => go('edit')} />;
  } else if (route === 'edit') {
    screen = <Editor ctx={ctx} onBack={() => go('mood')} onDone={() => { setSaved(s => ({ ...s, lastDone: longDate(today) })); go('share'); }} />;
  } else if (route === 'share') {
    screen = <Share ctx={ctx} onEdit={() => go('edit')} onRestart={() => { setSaved(s => ({ ...s, entry: { ...s.entry, memo: '' } })); go('mood'); }} />;
  } else {
    screen = <Landing ctx={ctx} onStart={begin} />;
  }

  return (
    <>
      {screen}
      <div className={`toast ${toastMsg ? 'show' : ''}`} role="status" aria-live="polite">{toastMsg}</div>
    </>
  );
}
