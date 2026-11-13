// 이 파일은 디자인 캔버스(.doan/assets/pixel-avatar.js)의 그리기 코드를 앱용 ES 모듈로 옮긴 것이에요.
// 캐릭터·배경 그림을 바꿀 때는 두 곳을 함께 맞춰주세요.
/* eslint-disable */
function toSVG(g, crop, label) {
  const [cx, cy, cw, ch] = crop || [0, 0, g[0].length, g.length];
  let rects = '';
  for (let y = cy; y < cy + ch && y < g.length; y++) {
    let x = cx;
    while (x < cx + cw && x < g[0].length) {
      const c = g[y][x];
      let run = 1;
      while (x + run < cx + cw && g[y][x + run] === c) run++;
      if (c) rects += `<rect x="${x}" y="${y}" width="${run}" height="1" fill="${c}"/>`;
      x += run;
    }
  }
  const aria = label ? `role="img" aria-label="${label}"` : 'aria-hidden="true"';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${cx} ${cy} ${cw} ${ch}" shape-rendering="crispEdges" ${aria}>${rects}</svg>`;
}

const ICONS = {
  smile: ['..KKKKKK..', '.KCCCCCCK.', 'KCCKCCKCCK', 'KCCKCCKCCK', 'KCCCCCCCCK', 'KCKCCCCKCK', 'KCCKKKKCCK', '.KCCCCCCK.', '..KKKKKK..'],
  hair:  ['..KKKKKK..', '.KCCCCCCK.', 'KCCCCCCCCK', 'KCCKKKKCCK', 'KCK....KCK', 'KCK....KCK', 'KCK....KCK', 'KKK....KKK'],
  shirt: ['..KK..KK..', '.KCCKKCCK.', 'KCCCCCCCCK', 'KKCCCCCCKK', '.KCCCCCCK.', '.KCCCCCCK.', '.KCCCCCCK.', '.KKKKKKKK.'],
  shoe:  ['.KKKK.....', '.KCCK.....', '.KCCKKKK..', '.KCCCCCCK.', '.KCCCCCCCK', '.KWWWWWWWK', '.KKKKKKKKK'],
  bow:   ['.KK....KK.', 'KCCK..KCCK', 'KCCCKKCCCK', 'KCCCKKCCCK', 'KCCK..KCCK', '.KK....KK.'],
  frame: ['KKKKKKKKKK', 'KCCCCCCYCK', 'KCCCCCCCCK', 'KCCCKCCCCK', 'KCCKGKCKCK', 'KCKGGGKGKK', 'KKGGGGGGGK', 'KKKKKKKKKK'],
  dice:  ['KKKKKKKKK', 'KWWWWWWWK', 'KWKWWWKWK', 'KWWWWWWWK', 'KWWWKWWWK', 'KWWWWWWWK', 'KWKWWWKWK', 'KWWWWWWWK', 'KKKKKKKKK'],
  undo:  ['...K......', '..KK......', '.KKKKKKK..', 'KKKKKKKKK.', '.KKKKKKKKK', '..KK....KK', '...K....KK', '........KK', '.......KK.', '.....KKK..'],
  redo:  ['......K...', '......KK..', '..KKKKKKK.', '.KKKKKKKKK', 'KKKKKKKKK.', 'KK....KK..', 'KK....K...', 'KK........', '.KK.......', '..KKK.....'],
  reset: ['...KKKK...', '.KK....KK.', 'K........K', 'K...KK...K', 'K...KK...K', 'K........K', '.KK....KK.', '...KKKK...'],
  down:  ['....KK....', '....KK....', '....KK....', '..KKKKKK..', '...KKKK...', '....KK....', 'K........K', 'K........K', 'KKKKKKKKKK'],
  link:  ['....KKKKK.', '...K.....K', '...K..K..K', '.KKKK.K..K', 'K..K.KKKK.', 'K..K.K....', 'K.....K...', '.KKKKK....'],
  chat:  ['.KKKKKKKK.', 'KCCCCCCCCK', 'KCKCCKCCKK', 'KCCCCCCCCK', '.KKKKKKKK.', '..KK......', '.K........'],
  camera:['...KKK....', 'KKKKKKKKKK', 'KCCCCCCCCK', 'KCCCKKCCCK', 'KCCKWWKCCK', 'KCCCKKCCCK', 'KCCCCCCCCK', 'KKKKKKKKKK'],
  heart: ['.KKK.KKK.', 'KCCCKCCCK', 'KCWCCCCCK', 'KCCCCCCCK', '.KCCCCCK.', '..KCCCK..', '...KCK...', '....K....'],
  check: ['.........K', '........KK', '.......KK.', 'K.....KK..', 'KK...KK...', '.KK.KK....', '..KKK.....', '...K......'],
  star:  ['....K....', '...KCK...', 'KKKKCKKKK', 'KCCCCCCCK', '.KCCCCCK.', '..KCCCK..', '.KCCKCCK.', '.KK...KK.'],
  lock:  ['..KKKK..', '.K....K.', '.K....K.', 'KKKKKKKK', 'KCCCCCCK', 'KCCKKCCK', 'KCCCCCCK', 'KKKKKKKK'],
  plus:  ['...KK...', '...KK...', 'KKKKKKKK', 'KKKKKKKK', '...KK...', '...KK...'],
  arrow: ['....K...', '....KK..', 'KKKKKKK.', 'KKKKKKKK', 'KKKKKKK.', '....KK..', '....K...'],
  back:  ['...K....', '..KK....', '.KKKKKKK', 'KKKKKKKK', '.KKKKKKK', '..KK....', '...K....'],
  close: ['KK....KK', '.KK..KK.', '..KKKK..', '...KK...', '..KKKK..', '.KK..KK.', 'KK....KK'],
  sparkle:['...K...', '...K...', '..KCK..', 'KKCCCKK', '..KCK..', '...K...', '...K...'],
};


// 탭용 바지 아이콘 (캔버스에서 추가한 것)
ICONS.pants = ['KKKKKKKK', 'KCCCCCCK', 'KCCCCCCK', 'KCCKKCCK', 'KCCKKCCK', 'KCCKKCCK', 'KCCKKCCK', 'KKKKKKKK'];

const INK = '#1A1838';
// 아이콘 문자열 → 색 격자. K 외곽 · C 칠 · W 흰색 · Y 노랑 · G 초록
function iconGrid(name, c, ink) {
  const rows = ICONS[name];
  const w = Math.max(...rows.map(r => r.length));
  const pal = { K: ink || INK, C: c || '#FFFFFF', W: '#FFFFFF', Y: '#FFE07A', G: '#7BD389' };
  return rows.map(r => Array.from({ length: w }, (_, x) => pal[r[x]] || null));
}

export { toSVG, ICONS, iconGrid };
