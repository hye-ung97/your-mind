import { memo, useLayoutEffect, useRef, type CSSProperties, type ReactNode } from 'react';
import { go } from '../App';
import { iconGrid, toSVG } from '../pixel/core.js';
import * as PC from '../pixel/avatar.js';
import * as PS from '../pixel/scene.js';
import type { Crop, Grid, Look } from '../pixel/types';

interface ArtProps {
  grid: Grid;
  crop?: Crop;
  /** 픽셀 1칸 = scale px. fluid 면 부모 너비에 맞춰 늘어나요 */
  scale?: number;
  fluid?: boolean;
  label?: string;
  className?: string;
  style?: CSSProperties;
}

export const PixelArt = memo(function PixelArt({ grid, crop, scale = 1, fluid, label, className, style }: ArtProps) {
  const c: Crop = crop ?? [0, 0, grid[0].length, grid.length];
  const size: CSSProperties = fluid ? { width: '100%', aspectRatio: `${c[2]} / ${c[3]}` } : { width: c[2] * scale, height: c[3] * scale };
  return <span className={`px-art ${className ?? ''}`} style={{ ...size, ...style }} dangerouslySetInnerHTML={{ __html: toSVG(grid, c, label) }} />;
});

/** 배경 + 캐릭터 (80×80) */
export function Stage({ look, scale = 4, fluid, label }: { look: Look; scale?: number; fluid?: boolean; label?: string }) {
  return <PixelArt grid={PS.stage(look)} scale={scale} fluid={fluid} label={label} />;
}

/** 캐릭터만 (크롭 지정) */
export function Avatar({ look, crop = 'full', scale = 2, only, label }: { look: Look; crop?: keyof typeof PC.CROPS; scale?: number; only?: string[]; label?: string }) {
  return <PixelArt grid={PC.compose(look, { only })} crop={PC.CROPS[crop]} scale={scale} label={label} />;
}

export function Icon({ name, c, ink, scale = 2 }: { name: string; c?: string; ink?: string; scale?: number }) {
  return <PixelArt className="ic" grid={iconGrid(name, c, ink)} scale={scale} />;
}

export function Gem({ c, size }: { c?: string; size?: number }) {
  return <i className="gem" style={{ ['--c' as string]: c, width: size, height: size }} />;
}

/** 하트 5개 중 n개 칠하기. onPick 이 있으면 눌러서 고를 수 있어요 */
export function Hearts({ n, c, scale = 2, onPick, label }: { n: number; c: string; scale?: number; onPick?: (n: number) => void; label?: string }) {
  const hearts = Array.from({ length: 5 }, (_, i) => <Icon key={i} name="heart" ink="#1A1838" c={i < n ? c : '#E2CFA6'} scale={scale} />);
  if (!onPick) return <span className="hearts" role="img" aria-label={`하트 5개 중 ${n}개`}>{hearts}</span>;
  return (
    <span className="hearts pick" role="radiogroup" aria-label={label}>
      {hearts.map((h, i) => (
        <button key={i} type="button" role="radio" aria-checked={i + 1 === n} aria-label={`${i + 1}`} onClick={() => onPick(i + 1)}>{h}</button>
      ))}
    </span>
  );
}

/** 하늘의 별: 부모 크기에 맞춰 box-shadow 점을 뿌려요 (캔버스와 같은 방식) */
export function Stars({ n = 40, seed = 1, maxH }: { n?: number; seed?: number; maxH?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const el = ref.current, host = el?.parentElement;
    if (!el || !host) return;
    const draw = () => {
      const w = host.offsetWidth, h = Math.min(host.offsetHeight, maxH ?? 9999);
      let s = (seed + 7) * 7919;
      const r = () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296;
      const count = Math.round(n * Math.max(0.5, w / 1280));
      const out: string[] = [];
      for (let k = 0; k < count; k++) {
        const x = Math.floor((r() * w) / 2) * 2, y = Math.floor((r() * h) / 2) * 2, big = r() < 0.12;
        out.push(`${x}px ${y}px 0 ${big ? 1 : 0}px ${big ? '#FFE6A0' : r() < 0.5 ? '#FFFFFF' : '#CFC8F0'}`);
      }
      el.style.boxShadow = out.join(',');
    };
    draw();
    const ro = new ResizeObserver(draw);
    ro.observe(host);
    return () => ro.disconnect();
  }, [n, seed, maxH]);
  return <div className="stars" ref={ref} aria-hidden="true" />;
}

const STEP_NAMES = ['기분', '꾸미기', '공유'];
/** 로고는 어느 화면에서든 홈(랜딩)으로 돌아가요 */
export function Nav({ step, mark, date }: { step?: 1 | 2 | 3; mark?: string; date: string }) {
  return (
    <header className="nav">
      <button className="logo" type="button" onClick={() => go('')} aria-label="your mind 처음 화면">
        <Icon name="heart" c="#FF7EB6" scale={3} />your mind
      </button>
      {step ? (
        <>
        <span className="m-step" aria-hidden="true">{step} / 3</span>
        <ol className="steps" aria-label="진행 단계">
          {STEP_NAMES.map((s, i) => (
            <li key={s} className={i + 1 === step ? 'on' : i + 1 < step ? 'done' : ''} aria-current={i + 1 === step ? 'step' : undefined}>
              <Gem />{i + 1} {s}
            </li>
          ))}
        </ol>
        </>
      ) : mark ? <span className="new-mark">{mark}</span> : null}
      <span className="date">{date}</span>
    </header>
  );
}

export function Win({ title, gem, right, pick, className, children, as: Tag = 'div', id }: {
  title: ReactNode; gem?: string; right?: ReactNode; pick?: boolean; className?: string; children: ReactNode; as?: 'div' | 'article' | 'section'; id?: string;
}) {
  return (
    <Tag className={`win ${pick ? 'pick' : ''} ${className ?? ''}`} id={id}>
      <div className="bar"><Gem c={gem} />{title}{right && <span className="right">{right}</span>}</div>
      {children}
    </Tag>
  );
}
