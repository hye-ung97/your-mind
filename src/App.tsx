import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { decodeCard } from './app/link';
import { type Entry, type Saved, freshStart, load, longDate, save } from './app/model';
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
/** 화면 주소: 보통은 해시(#/edit), 공유 링크로 들어오면 경로(/c/<코드>) */
function readRoute(): Route {
  const h = readHash();
  if (h) return h;
  const m = /^\/c\/([A-Za-z0-9_-]+)\/?$/.exec(location.pathname);
  return m ? (`card/${m[1]}` as const) : '';
}
export function go(r: Route) {
  // 공유 링크(/c/…)에서 다른 화면으로 갈 땐 주소를 처음(/)으로 돌려놓고 해시로 이어가요
  if (location.pathname !== '/') {
    history.pushState(null, '', `/#/${r}`);
    window.dispatchEvent(new HashChangeEvent('hashchange'));
    return;
  }
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
  const [route, setRoute] = useState<Route>(readRoute);
  const [saved, setSaved] = useState<Saved>(load);
  const [toastMsg, setToastMsg] = useState('');
  const toastTimer = useRef<number>();
  const today = useMemo(() => new Date(), []);

  useEffect(() => {
    const on = () => { setRoute(readRoute()); window.scrollTo(0, 0); };
    window.addEventListener('hashchange', on);
    window.addEventListener('popstate', on);
    return () => { window.removeEventListener('hashchange', on); window.removeEventListener('popstate', on); };
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

  // 캐릭터를 고르면 그 캐릭터의 기본 코디로 새로 시작해서 기분 고르기로
  const chooseGender = (g: Gender) => {
    setSaved(s => freshStart(s, g));
    go('mood');
  };
  // 홈·친구 카드에서 시작하면 언제나 기본 캐릭터 고르기부터
  const begin = () => go('start');

  let screen: JSX.Element;
  const needsGender = (r: Route) => (r === 'mood' || r === 'edit' || r === 'share') && !saved.gender;
  if (route.startsWith('card/')) {
    const code = route.slice(5);
    screen = <CardView key={code} ctx={ctx} code={code} card={decodeCard(code)} onMake={begin} />;
  } else if (needsGender(route) || route === 'start') {
    screen = <Start ctx={ctx} onPick={chooseGender} />;
  } else if (route === 'mood') {
    screen = <MoodPick ctx={ctx} onNext={() => go('edit')} />;
  } else if (route === 'edit') {
    screen = <Editor ctx={ctx} onBack={() => go('mood')} onDone={() => { setSaved(s => ({ ...s, lastDone: longDate(today) })); go('share'); }} />;
  } else if (route === 'share') {
    screen = <Share ctx={ctx} onEdit={() => go('edit')} onRestart={() => go('start')} />;
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
