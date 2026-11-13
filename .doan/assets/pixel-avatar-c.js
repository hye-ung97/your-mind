/*
 * your mind — C안 '디테일 SD' 캐릭터 (시안용 · 아직 앱 코드 아님)
 *
 * 그리드 48×64 (A·B안의 약 2배 해상도). 해상도가 높아서 문자열로 한 칸씩 찍지 않고
 *   1) 타원·다각형·캡슐 도형으로 파츠 모양(마스크)을 만들고
 *   2) 왼쪽 위 광원 기준으로 그늘·하이라이트를 자동으로 칠한 뒤
 *   3) 파츠마다 1px 외곽선을 자동으로 두른다.
 * 눈·입처럼 섬세한 부분만 문자열 맵으로 그린다 (왼쪽 절반만 그리고 좌우 반전).
 * 성별은 기본 얼굴(속눈썹·눈썹)과 시작 코디만 바꾸고, 파츠는 모두 공유한다.
 * 실제 서비스에서는 같은 레이어 구조로 픽셀 아티스트가 그린 PNG 파츠를 쓰는 것을 권장.
 */
(function (global) {
  'use strict';
  const PA = global.PixelAvatar;
  const W = 48, H = 64, K = '#2B2140';

  // ── 마스크 도구 ──────────────────────────────────────────
  const M = () => new Uint8Array(W * H);
  const inb = (x, y) => x >= 0 && y >= 0 && x < W && y < H;
  const has = (m, x, y) => inb(x, y) && m[y * W + x] === 1;
  function fill(m, test) {
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (test(x + 0.5, y + 0.5)) m[y * W + x] = 1;
    return m;
  }
  const ell = (cx, cy, rx, ry) => fill(M(), (x, y) => ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1);
  const rect = (x0, y0, x1, y1) => fill(M(), (x, y) => x >= x0 && x <= x1 + 1 && y >= y0 && y <= y1 + 1);
  const poly = pts => fill(M(), (x, y) => {
    let inside = false;
    for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
      const [xi, yi] = pts[i], [xj, yj] = pts[j];
      if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) inside = !inside;
    }
    return inside;
  });
  const cap = (x0, y0, x1, y1, r) => fill(M(), (x, y) => {
    const dx = x1 - x0, dy = y1 - y0, t = Math.max(0, Math.min(1, ((x - x0) * dx + (y - y0) * dy) / (dx * dx + dy * dy)));
    return (x - x0 - t * dx) ** 2 + (y - y0 - t * dy) ** 2 <= r * r;
  });
  const or = (...ms) => { const o = M(); ms.forEach(m => m.forEach((v, i) => { if (v) o[i] = 1; })); return o; };
  const sub = (a, b) => a.map((v, i) => (v && !b[i] ? 1 : 0));
  const clipY = (m, y0, y1) => m.map((v, i) => (v && Math.floor(i / W) >= y0 && Math.floor(i / W) <= y1 ? 1 : 0));
  const mirror = m => { const o = M(); for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) o[y * W + x] = m[y * W + (W - 1 - x)]; return o; };
  const both = m => or(m, mirror(m));

  // 파츠 칠하기: tone = { b 기본, s 그늘, h 하이라이트 }, 광원은 왼쪽 위
  function paint(g, m, tone, opt) {
    opt = opt || {};
    const [sx, sy] = opt.shade || [2, 2];
    const [hx, hy] = opt.hi || [2, 2];
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      if (!has(m, x, y)) continue;
      let c = tone.b;
      if (tone.s && !has(m, x + sx, y + sy)) c = tone.s;
      if (tone.h && !has(m, x - hx, y - hy)) c = tone.h;
      g[y][x] = c;
    }
    if (opt.detail) opt.detail((x, y, c) => { if (has(m, x, y)) g[y][x] = c; });
    if (opt.outline !== false) {
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
        if (has(m, x, y) && (!has(m, x - 1, y) || !has(m, x + 1, y) || !has(m, x, y - 1) || !has(m, x, y + 1))) g[y][x] = K;
      }
    }
  }
  const line = (put, x0, y0, x1, y1, c) => {
    const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0));
    for (let i = 0; i <= n; i++) put(Math.round(x0 + (x1 - x0) * i / n), Math.round(y0 + (y1 - y0) * i / n), c);
  };

  // ── 색 ───────────────────────────────────────────────────
  const SKINS = {
    porcelain: { b: '#FFF1E6', s: '#F2D2BE' }, light: { b: '#FFE6D2', s: '#F4C7A8' },
    rosy:      { b: '#FFD9D0', s: '#F0B0A4' }, peach: { b: '#F8D0AA', s: '#E2A77C' },
    olive:     { b: '#E2BE8E', s: '#C49A66' }, tan:   { b: '#D9A070', s: '#B77D50' },
    deep:      { b: '#9C6844', s: '#7A4B2E' }, rich:  { b: '#6E4630', s: '#52321F' },
  };
  const HAIR = {
    brown:  { b: '#5A3B2A', s: '#3E281C', h: '#8A6146', g: '#B08A6E' },
    black:  { b: '#34303D', s: '#211E28', h: '#5E5870', g: '#C3BED2' },
    blonde: { b: '#E9B95A', s: '#C48E35', h: '#FFE09A', g: '#FFF3CF' },
    pink:   { b: '#F08DB5', s: '#CF6593', h: '#FFC2DA', g: '#FFE1EE' },
    red:    { b: '#B9473A', s: '#8A2F28', h: '#E07060', g: '#F5B3A8' },
    silver: { b: '#C9CDD6', s: '#9AA0AE', h: '#EEF0F4', g: '#FFFFFF' },
    blue:   { b: '#4F6FC9', s: '#36509C', h: '#7E9BE8', g: '#C6D4FF' },
  };
  const EYES = {
    brown: { E: '#3B2620', e: '#8A5A3C' },
    gray:  { E: '#2B2731', e: '#77707F' },
    blue:   { E: '#1F3F8A', e: '#5B8BE0' },
    green:  { E: '#1F5A3A', e: '#5BB07A' },
    gold:   { E: '#6B4410', e: '#E0A82A' },
    violet: { E: '#3E2A7A', e: '#9A7AE0' },
    pink:   { E: '#7A2A4A', e: '#F07AAE' },
    red:    { E: '#6A1A22', e: '#D9474F' },
  };

  // ── 기본 몸 (성별 공통) ───────────────────────────────────
  const HEAD = or(ell(24, 23, 14.2, 12.6), ell(24, 28.6, 12.4, 9));
  const EARS = both(ell(10.6, 28, 2.6, 3.6));
  const ARMS = both(cap(15.3, 40, 14.4, 45.6, 2.4));
  const HANDS = both(ell(14.4, 47.4, 2.4, 2.2));
  const TORSO = poly([[16, 37.5], [32, 37.5], [31, 48], [17, 48]]);
  const LEGS = both(rect(17, 47, 22, 57));

  // ── 표정: 왼쪽 절반(x12~23)만 그리고 좌우 반전, y23부터 ─────
  //  K 외곽 · W 흰자/빛 · E 눈동자 · e 눈동자 밝은쪽 · B 눈썹 · p 볼터치 · m 입 · T 눈물 · b 다크서클
  const EYE_OPEN = ['...KKKK.....', '..KKKKKK....', '..KWEEEK....', '..KEWEeK....', '..KEEeeK....', '...KeeK.....'];
  const FACES = {
    calm:    { name: '포근', rows: ['...BBBB.....', '............', ...EYE_OPEN, '............', '.ppp........', '............', '...........m'] },
    happy:   { name: '방긋', rows: ['...BBBB.....', '............', '............', '...KKKK.....', '..K....K....', '.K......K...', '............', '.ppp........', '..........KK', '...........m'] },
    excited: { name: '두근', rows: ['...BBBB.....', '............', '...KKKK.....', '..KKKKKK....', '..KWWEEK....', '..KWWEeK....', '..KEEeWK....', '...KeeK.....', '............', '.pppp.......', '..........KK', '...........m'] },
    sad:     { name: '울먹', rows: ['......B.....', '...BBB......', ...EYE_OPEN.slice(0, 2), '..KWWEEK....', '..KEWEeK....', '..KEEeeK....', '...KeeK.....', '...T........', '...T........', '..........KK'] },
    tired:   { name: '하품', rows: ['...BBBB.....', '............', '............', '............', '..KKKKKK....', '..KEEEEK....', '...KeeK.....', '..bbbb......', '............', '...........K', '..........Km', '...........K'] },
    angry:   { name: '부글', rows: ['..BB........', '....BBB.....', '......B.....', '..KKKKKK....', '..KWEEEK....', '..KEEeeK....', '...KeeK.....', '............', 'X...........', '..........KK', '.........K..'] },
    blank:   { name: '멍', rows: ['...BBBB.....', '............', '............', '...KKKK.....', '..K....K....', '..K..E.K....', '..K....K....', '...KKKK.....', '............', '............', '.........KKK'] },
  };
  // ── 표정 더 많이 (rowsR 이 있으면 오른쪽 절반은 따로 그림: 윙크·비웃음처럼 비대칭) ──
  const OPEN_MOUTH = ['.........KKK', '.........Kot', '..........KK'];
  Object.assign(FACES, {
    wink:    { name: '찡긋',
      rows:  ['...BBBB.....', '............', ...EYE_OPEN, '............', '.ppp......K.', '...........K'],
      rowsR: ['...BBBB.....', '............', '............', '............', '...KKKK.....', '..K....K....', '.K......K...', '............', '............', '.ppp......K.', '...........K'] },
    love:    { name: '하트눈', rows: ['...BBBB.....', '............', '..RR.RR.....', '.RRRRRRR....', '.RWRRRRR....', '..RRRRR.....', '...RRR......', '....R.......', '............', '.ppp........', ...OPEN_MOUTH] },
    sparkle: { name: '반짝', rows: ['...BBBB.....', '.S..........', 'SSSKKKK.....', '.SKKKKKK....', '..KEWEEK....', '..KWWWeK....', '..KEWeWK....', '...KeeK.....', '............', '.pppp.......', '..........KK', '..........Ko', '...........K'] },
    laugh:   { name: '깔깔', rows: ['...BBBB.....', '............', '............', '..K.........', '...KK.......', '.....KK.....', '...KK.......', '..K.........', '.ppp........', ...OPEN_MOUTH] },
    cry:     { name: '엉엉', rows: ['......B.....', '...BBB......', '............', '............', '..KKKKKK....', '...TTTT.....', '...T..T.....', '...T..T.....', '...T..T.....', '...T..T..KKK', '...T..T..Koo', '....T..T..KK'] },
    shock:   { name: '깜짝', rows: ['...BBBB.....', '............', '...KKKK.....', '..KWWWWK....', '..KWEEWK....', '..KWEEWK....', '..KWWWWK....', '...KKKK.....', '............', '............', '..........KK', '.........Koo', '..........KK'] },
    smug:    { name: '새침',
      rows:  ['...BBBB.....', '............', '............', '............', '..KKKKKK....', '..KKEEeK....', '..KEEeeK....', '...KeeK.....', '............', '.ppp........', '..........KK'],
      rowsR: ['...BBBB.....', '............', '............', '............', '..KKKKKK....', '..KKEEeK....', '..KEEeeK....', '...KeeK.....', '............', '.ppp.....K..', '..........KK'] },
    pout:    { name: '뾰로통', rows: ['..BB........', '....BB......', ...EYE_OPEN, '............', '.pppp.......', '..........KK', '..........Km', '..........KK'] },
    dizzy:   { name: '어질', rows: ['...BBBB.....', '............', '..KKKKK.....', '.K.....K....', '.K.KK..K....', '.K.K.K.K....', '.K....K.....', '..KKKK......', '............', '.ppp........', '.........K.K', '..........K.'] },
    shy:     { name: '부끄', rows: ['...BBBB.....', '............', '............', '............', '............', '..K....K....', '...KKKK.....', '............', '.pRpRp......', '.ppppp......', '..........KK'] },
  });

  const LASHES = ['............', '..K.........', '.K..........']; // 여성: 눈 감은 표정용 작은 꼬리
  const LASH_F = ['...KKKK.....', '.KKKKKKK....', 'K...........']; // 여성: 진한 윗속눈썹 + 꼬리 (y24~)
  const LOWER_F = ['..K.K.......']; // 여성: 아래 속눈썹 (y31)

  function drawFace(g, face, gender, pal) {
    const rows = FACES[face].rows, rowsR = FACES[face].rowsR || rows;
    const put = (x, y, ch) => {
      const c = pal[ch]; if (!c || !inb(x, y)) return;
      g[y][x] = c;
    };
    rows.forEach((r, dy) => [...r].forEach((ch, dx) => put(12 + dx, 23 + dy, ch)));
    rowsR.forEach((r, dy) => [...r].forEach((ch, dx) => put(35 - dx, 23 + dy, ch)));
    const stampHalf = (rows, y0) => rows.forEach((r, dy) => [...r].forEach((ch, dx) => { put(12 + dx, y0 + dy, ch); put(35 - dx, y0 + dy, ch); }));
    if (gender === 'f' && ['calm', 'sad', 'excited', 'sparkle', 'shock', 'pout'].includes(face)) { stampHalf(LASH_F, 24); stampHalf(LOWER_F, 31); }
    else if (gender === 'f' && face === 'angry') stampHalf(LASHES, 24);
  }

  // ── 헤어 ─────────────────────────────────────────────────
  const tri = (a, b, c) => poly([a, b, c]);
  const HAIRS = {
    spiky: { name: '삐죽 숏컷', front() {
      const dome = clipY(ell(24, 20, 16.4, 13.4), 0, 22);
      const spikes = or(
        tri([9, 15], [17, 8], [5, 4]), tri([14, 10], [23, 7], [13, 0]), tri([20, 8], [29, 7], [24, -1]),
        tri([26, 8], [35, 9], [35, 0]), tri([31, 10], [39, 14], [43, 4]),
        tri([8, 15], [10, 23], [2, 13]), tri([39, 15], [38, 23], [46, 12]));
      const bangs = or(
        tri([10, 18], [18, 18], [12, 26]), tri([16, 18], [25, 18], [20, 25]),
        tri([23, 18], [31, 18], [28, 25]), tri([30, 18], [38, 18], [36, 26]));
      const burns = both(poly([[8, 18], [12.5, 18], [12.5, 30], [10.5, 33], [8, 28]]));
      return { m: or(dome, spikes, bangs, burns), strands: [[16, 8, 12, 15], [24, 6, 21, 14], [31, 8, 28, 15], [12, 19, 13, 23], [27, 19, 28, 23]] };
    } },
    dandy: { name: '댄디컷', front() {
      const dome = clipY(ell(24, 20.5, 16.2, 13.6), 0, 22);
      const sweep = poly([[9, 15], [37, 14], [39, 21], [30, 20], [20, 25], [14, 27], [10, 24]]);
      const burns = both(poly([[8, 18], [12.5, 18], [12.5, 29], [10.5, 31], [8, 27]]));
      return { m: or(dome, sweep, burns), strands: [[14, 10, 24, 18], [22, 9, 33, 17], [30, 9, 36, 16]] };
    } },
    long: { name: '긴 생머리',
      back() { return or(clipY(ell(24, 22, 17.4, 15), 0, 30), poly([[8, 22], [40, 22], [40.5, 46], [37, 50], [11, 50], [7.5, 46]])); },
      front() {
        const dome = clipY(ell(24, 20, 16.4, 13.4), 0, 22);
        const bangs = sub(rect(11, 17, 36, 23), or(tri([16, 24], [19, 24], [17.5, 21]), tri([23, 24], [26, 24], [24.5, 21.5]), tri([30, 24], [33, 24], [31.5, 21])));
        const sides = both(poly([[7, 17], [13, 17], [14, 30], [13.5, 46], [10, 50], [6.5, 44]]));
        return { m: or(dome, bangs, sides), strands: [[16, 9, 15, 17], [24, 8, 24, 17], [32, 9, 33, 17], [10, 26, 10, 44]] };
      } },
    bob: { name: '단발',
      back() { return clipY(ell(24, 24, 17.2, 15), 0, 37); },
      front() {
        const dome = clipY(ell(24, 20, 16.4, 13.4), 0, 22);
        const bangs = poly([[10, 16], [38, 16], [37, 23], [31, 22], [24, 24], [17, 22], [11, 23]]);
        const sides = both(poly([[7, 17], [13, 17], [13.5, 33], [12, 37], [8, 37], [6.5, 31]]));
        return { m: or(dome, bangs, sides), strands: [[17, 9, 16, 17], [25, 8, 25, 17], [32, 10, 33, 17], [9, 25, 10, 35]] };
      } },
  };

  HAIRS.ponytail = { name: '하이 포니테일',
    back() {
      return or(clipY(ell(24, 21, 16.8, 14.2), 0, 26),
        poly([[29, 7], [37, 3], [43, 10], [45, 24], [44, 38], [46, 50], [43, 58], [39, 60], [38, 52], [39, 40], [38, 26], [35, 14]]));
    },
    front() {
      const dome = clipY(ell(24, 20, 16.4, 13.4), 0, 22);
      const bangs = sub(rect(11, 16, 36, 24), or(rect(17, 23, 17, 24), rect(25, 22, 25, 24), rect(31, 23, 32, 24)));
      const left = poly([[7, 17], [13, 17], [13.5, 38], [11, 41], [8, 39], [6.5, 30]]);
      const right = poly([[34.5, 17], [41, 17], [40.5, 24], [37, 25.5], [34.5, 24]]);
      return { m: or(dome, bangs, left, right), strands: [[16, 9, 15, 16], [27, 8, 28, 16], [10, 27, 10, 38]],
               gloss: [[20, 17, 20, 23], [22, 18, 22, 21], [9, 20, 9, 24]] };
    } };

  // ── 헤어 더 많이 ──
  const DOME = () => clipY(ell(24, 20, 16.4, 13.4), 0, 22);
  const LONG_BACK = () => or(clipY(ell(24, 22, 17.4, 15), 0, 30), poly([[8, 22], [40, 22], [40.5, 46], [37, 50], [11, 50], [7.5, 46]]));
  Object.assign(HAIRS, {
    twinTails: { name: '양갈래',
      back() { return or(clipY(ell(24, 21, 16.8, 14.2), 0, 26), both(poly([[10, 12], [6, 10], [3, 16], [2, 28], [3.5, 40], [6.5, 46], [7.5, 38], [8, 26], [10, 18]]))); },
      front() {
        const bangs = sub(rect(11, 16, 36, 23), or(tri([16, 24], [19, 24], [17.5, 21]), tri([29, 24], [32, 24], [30.5, 21])));
        return { m: or(DOME(), bangs, both(poly([[7, 17], [12.8, 17], [13, 29], [10, 31], [7, 26]]))),
                 strands: [[16, 9, 15, 17], [24, 8, 24, 16], [32, 9, 33, 17], [4, 22, 5, 38], [43, 22, 42, 38]], gloss: [[20, 17, 20, 21], [9, 20, 9, 23]] };
      } },
    spaceBuns: { name: '양쪽 똥머리', front() {
      const bangs = poly([[10, 16], [38, 16], [37, 23], [31, 22], [24, 24], [17, 22], [11, 23]]);
      return { m: or(DOME(), both(ell(10.5, 8.5, 5, 4.8)), bangs, both(poly([[7, 17], [13, 17], [13.5, 31], [10, 33], [7, 28]]))),
               strands: [[8, 6, 12, 10], [36, 6, 40, 10], [17, 9, 16, 17], [31, 9, 32, 17]], gloss: [[9, 5, 10, 5], [20, 17, 20, 21]] };
    } },
    bun: { name: '똥머리', front() {
      const bangs = poly([[10, 16], [38, 16], [37.5, 22], [33, 20], [26, 19.5], [18, 22.5], [11, 24]]);
      return { m: or(DOME(), ell(24, 4.6, 6.6, 5.4), bangs, both(poly([[7.5, 17], [12.8, 17], [13, 28], [9, 29.5], [7.5, 25]]))),
               strands: [[20, 2, 27, 6], [20, 5, 25, 8], [16, 10, 15, 17], [28, 10, 30, 17]], gloss: [[21, 2, 22, 2], [29, 17, 30, 18]] };
    } },
    wavy: { name: '웨이브 롱',
      back() { return or(clipY(ell(24, 22, 17.4, 15), 0, 30), poly([[8, 22], [40, 22], [41, 30], [39.5, 36], [41.5, 42], [40, 50], [36, 52], [12, 52], [8, 50], [6.5, 42], [8.5, 36], [7, 30]])); },
      front() {
        const bangs = both(poly([[10, 16], [24, 15.5], [21, 18], [15, 21], [12.5, 25.5], [9.5, 22]]));
        const sides = both(poly([[7, 17], [13, 17], [14, 28], [12.5, 34], [14, 40], [12, 48], [8.5, 46], [9.5, 40], [7, 34], [8, 28]]));
        return { m: or(DOME(), bangs, sides), strands: [[24, 8, 24, 16], [17, 10, 14, 18], [31, 10, 34, 18], [10, 27, 9, 33], [11, 37, 10, 44]], gloss: [[18, 17, 15, 20], [29, 17, 32, 20]] };
      } },
    braid: { name: '옆 땋은 머리',
      back() { return clipY(ell(24, 22, 17, 14.5), 0, 30); },
      front() {
        const bangs = poly([[10, 16], [38, 16], [37, 22], [30, 20], [22, 22], [15, 24], [10, 23]]);
        const right = poly([[34.5, 17], [41, 17], [40.5, 28], [37, 30], [34.5, 26]]);
        const left = poly([[7, 17], [13, 17], [13.5, 30], [10, 31], [7, 28]]);
        const plait = or(ell(10, 33, 3, 2.5), ell(10.6, 37.4, 3, 2.5), ell(11.2, 41.8, 3, 2.5), ell(11.8, 46, 2.7, 2.3), tri([10, 47.5], [14, 47.5], [12.5, 52]));
        return { m: or(DOME(), bangs, right, left, plait),
                 strands: [[8, 33, 12, 35], [9, 37, 13, 39], [9, 41, 14, 43], [10, 45, 14, 47], [17, 9, 16, 16], [28, 9, 30, 16]], gloss: [[22, 18, 26, 18]] };
      } },
    hime: { name: '히메컷', back: LONG_BACK,
      front() {
        return { m: or(DOME(), rect(10.5, 16, 36.5, 22.6), both(rect(7, 17, 12.6, 36))),
                 strands: [[17, 9, 17, 22], [24, 8, 24, 22], [31, 9, 31, 22], [9, 24, 9, 36], [38, 24, 38, 36]], gloss: [[13, 18, 15, 18], [27, 18, 29, 18]] };
      } },
    wolf: { name: '울프컷',
      back() { return poly([[8, 18], [40, 18], [41.5, 34], [39, 41], [36, 37], [33, 42], [15, 42], [12, 37], [9, 41], [6.5, 34]]); },
      front() {
        const bangs = or(tri([10, 17], [19, 17], [13, 25]), tri([16, 17], [26, 17], [21, 24.5]), tri([23, 17], [32, 17], [28, 24]), tri([29, 17], [38, 17], [35, 25]));
        return { m: or(DOME(), bangs, both(poly([[7, 17], [13, 17], [13.5, 30], [11, 36], [9, 32], [6.5, 34], [6, 26]]))),
                 strands: [[15, 9, 13, 16], [23, 7, 22, 15], [31, 9, 33, 16], [9, 26, 9, 31]] };
      } },
    buzz: { name: '투블럭', front() {
      const top = clipY(ell(24, 19, 15.8, 12.6), 0, 17);
      const fringe = poly([[11, 13], [37, 12], [38.5, 17.5], [30, 16.5], [22, 18.5], [11, 18]]);
      return { m: or(top, fringe, both(rect(9, 17, 11, 24))), strands: [[15, 9, 17, 15], [21, 7, 23, 15], [28, 7, 29, 14], [33, 9, 34, 15]] };
    } },
    curly: { name: '곱슬 펌', front() {
      const parts = [DOME()];
      for (let i = 0; i <= 8; i++) { const a = Math.PI + i * Math.PI / 8; parts.push(ell(24 + 16 * Math.cos(a), 19.5 + 13.5 * Math.sin(a), 3.4, 3.2)); }
      [12, 16.5, 21, 25.5, 30, 34.5].forEach((x, i) => parts.push(ell(x + 1, 20.4 + (i % 2) * 0.6, 2.9, 2.4)));
      parts.push(both(ell(9, 24, 3, 3.4)));
      return { m: or(...parts), strands: [[14, 12, 16, 14], [22, 9, 24, 11], [30, 11, 32, 13], [18, 15, 20, 17], [28, 15, 30, 17], [9, 22, 10, 25]] };
    } },
    sidePart: { name: '가르마펌', front() {
      const top = clipY(ell(24, 20, 16.4, 13.4), 0, 16);
      const sweep = poly([[7.6, 14], [29, 12], [30.5, 17.5], [26, 19], [20, 22.5], [13, 24.5], [7.6, 22]]);
      const right = poly([[29, 12], [40, 14], [40.4, 23], [38, 20.5], [35, 18], [31, 17.5]]);
      const burns = both(poly([[8, 18], [12.5, 18], [12.5, 28], [10.5, 30], [8, 26]]));
      return { m: or(top, sweep, right, burns), strands: [[30, 8, 30, 14], [14, 14, 24, 18], [18, 12, 27, 15], [33, 13, 37, 17]], gloss: [[20, 15, 24, 14]] };
    } },
  });

  // ── 소품 (여러 개 겹쳐 쓸 수 있음) ─────────────────────────
  const ACCS = {
    bigbow: { name: '큰 리본', draw(g) {
      const bow = { b: '#2A2F4A', s: '#1C2036', h: '#6A76B0' };
      paint(g, or(tri([31, 7], [34, 7], [27, 15]), tri([32, 7], [35, 7], [38, 14])), bow, { shade: [0, 2] });
      paint(g, poly([[32, 5.5], [22, 0], [21, 11]]), bow, { hi: [2, 2] });
      paint(g, poly([[32, 5.5], [43, 0], [44, 11]]), bow, { hi: [2, 2] });
      paint(g, ell(32.5, 5.6, 2.4, 2.8), bow, { hi: [1, 1] });
    } },
    choker: { name: '초커', draw(g) {
      for (let x = 19; x <= 28; x++) g[38][x] = K;
      g[39][23] = '#D9DCE6'; g[39][24] = '#D9DCE6';
    } },
    earring: { name: '귀걸이', draw(g) {
      [[38, 32], [37, 33], [39, 33], [37, 34], [39, 34], [38, 35]].forEach(([x, y]) => { g[y][x] = '#D9DCE6'; });
    } },
  };

  // ── 옷 ───────────────────────────────────────────────────
  const BODY = poly([[15.4, 37.5], [32.6, 37.5], [31.8, 48.6], [16.2, 48.6]]);
  const SLEEVES = both(cap(15.2, 39.6, 14.4, 44, 2.6));
  const TOPS = {
    track: { name: '트랙 재킷', draw(g) {
      const navy = { b: '#2F3A5E', s: '#222A47', h: '#44527F' }, red = { b: '#C9473F', s: '#A8352F' };
      paint(g, BODY, navy, { detail: put => { line(put, 24, 40, 24, 48, '#C9CDD6'); line(put, 16, 47, 32, 47, red.b); line(put, 16, 48, 32, 48, red.s); } });
      paint(g, SLEEVES, navy, { detail: put => {
        line(put, 13, 39, 12, 43, '#F2F2F2'); line(put, 34, 39, 35, 43, '#F2F2F2');
        line(put, 11, 45, 18, 45, red.b); line(put, 29, 45, 36, 45, red.b); line(put, 11, 46, 18, 46, red.s); line(put, 29, 46, 36, 46, red.s);
      } });
      paint(g, poly([[18.5, 36.5], [29.5, 36.5], [27.5, 40.5], [24, 42], [20.5, 40.5]]), red, { shade: [0, 2] });
    } },
    knit: { name: '니트', draw(g) {
      const cream = { b: '#F2E3C6', s: '#DCC79F', h: '#FFF6E4' };
      paint(g, BODY, cream, { detail: put => { [19, 24, 29].forEach(x => { for (let y = 41; y < 48; y += 2) { put(x, y, cream.s); put(x + 1, y + 1, cream.s); } }); line(put, 16, 47, 32, 47, cream.s); } });
      paint(g, SLEEVES, cream, { detail: put => { line(put, 11, 45, 18, 45, cream.s); line(put, 29, 45, 36, 45, cream.s); } });
      paint(g, both(poly([[19, 37], [24, 37], [24, 40], [21, 39.5]])), { b: '#FFFFFF', s: '#E8E4EC' }, { shade: [0, 2] });
    } },
    hoodie: { name: '후드티', draw(g) {
      const pink = { b: '#FF9EC4', s: '#E9719F', h: '#FFC4DC' };
      paint(g, ell(24, 37.6, 9.5, 3.2), { b: '#E9719F' });
      paint(g, BODY, pink, { detail: put => { line(put, 22, 39, 22, 42, '#FFFFFF'); line(put, 26, 39, 26, 42, '#FFFFFF'); } });
      paint(g, rect(19, 43, 28, 47), pink, { shade: [0, 2] });
      paint(g, SLEEVES, pink, { detail: put => { line(put, 11, 45, 18, 45, pink.s); line(put, 29, 45, 36, 45, pink.s); } });
    } },
  };
  TOPS.offshoulder = { name: '오프숄더', draw(g) {
    const blk = { b: '#2E2A38', s: '#1E1B26', h: '#4A4558' };
    paint(g, poly([[16.2, 40.5], [31.8, 40.5], [31.8, 48.6], [16.2, 48.6]]), blk, { detail: put => {
      for (let x = 17; x <= 31; x++) put(x, 41, x % 2 ? '#B9B3C8' : '#6A6478');
      for (let y = 43; y <= 46; y++) { put(23 - (y % 2), y, '#B9B3C8'); put(24 + (y % 2), y, '#B9B3C8'); }
    } });
    paint(g, both(ell(14.8, 41.2, 2.9, 2.3)), blk, { shade: [0, 2], detail: put => { put(13, 40, '#B9B3C8'); put(34, 40, '#B9B3C8'); } });
  } };
  const BOTTOMS = {
    cargo: { name: '카고 바지', draw(g) {
      const olive = { b: '#6F7A4F', s: '#59633D', h: '#86915F' };
      paint(g, rect(16, 46, 31, 49), olive, { shade: [0, 2] });
      paint(g, rect(16, 48, 22.4, 57), olive, { detail: put => { line(put, 16, 51, 19, 51, '#4B5433'); line(put, 19, 51, 19, 54, '#4B5433'); } });
      paint(g, rect(24.6, 48, 31, 57), olive, { detail: put => { line(put, 28, 51, 31, 51, '#4B5433'); line(put, 28, 51, 28, 54, '#4B5433'); } });
    } },
    skirt: { name: '플리츠 스커트', draw(g) {
      const navy = { b: '#3B4A7A', s: '#2C3860', h: '#52639A' };
      paint(g, rect(17, 54, 30, 57), { b: '#FFFFFF', s: '#E2E0EA' }, { shade: [0, 2] });
      paint(g, poly([[16, 46], [32, 46], [35, 54], [13, 54]]), navy, { shade: [0, 2], detail: put => { [17, 20, 23, 26, 29].forEach(x => line(put, x, 48, x - Math.round((24 - x) / 6), 53, navy.s)); } });
    } },
  };
  BOTTOMS.layered = { name: '레이어드 스커트', draw(g, ctx) {
    const blk = { b: '#2E2A38', s: '#1E1B26', h: '#4A4558' }, blue = { b: '#3F63C0', s: '#2A4386', h: '#6F92E0' };
    paint(g, both(rect(17, 50, 22, 57)), ctx.skin, { shade: [2, 0], detail: put => {
      for (let y = 50; y <= 57; y++) for (let x = 17; x <= 30; x++) if ((x + y) % 3 === 0 || (x - y + 63) % 3 === 0) put(x, y, '#3A3442');
    } });
    paint(g, poly([[14, 47.5], [34, 47.5], [36.5, 53.2], [11.5, 53.2]]), blue, { shade: [0, 2], detail: put => {
      for (let x = 13; x < 36; x += 3) line(put, x, 50, x + (x < 24 ? -1 : 1), 52, blue.s);
    } });
    paint(g, poly([[15.5, 46.5], [32.5, 46.5], [33.5, 50.2], [14.5, 50.2]]), blk, { shade: [0, 2], detail: put => {
      line(put, 16, 47, 32, 47, '#6B5236'); [23, 24, 25].forEach(x => put(x, 47, '#E2BE62'));
    } });
  } };
  const SHOES = {
    sneakers: { name: '스니커즈', draw(g) {
      const blk = { b: '#34343D', s: '#22222A' };
      const shoe = poly([[15, 55], [22.6, 55], [22.6, 60], [12.6, 60], [12.6, 58]]);
      paint(g, both(shoe), blk, { shade: [0, 2], detail: put => {
        [[13, 58], [34, 58]].forEach(([x]) => line(put, x, 58, x + (x < 24 ? 9 : -9), 58, '#FFFFFF'));
        put(18, 56, '#FFFFFF'); put(20, 56, '#FFFFFF'); put(29, 56, '#FFFFFF'); put(27, 56, '#FFFFFF');
      } });
    } },
    loafers: { name: '로퍼', draw(g) {
      const br = { b: '#7A4A2E', s: '#5C3520', h: '#9A6646' };
      paint(g, both(poly([[15, 56], [22.6, 56], [22.6, 60], [13, 60], [13, 58]])), br, { shade: [0, 2], detail: put => { line(put, 16, 57, 19, 57, br.s); line(put, 28, 57, 31, 57, br.s); } });
    } },
  };

  SHOES.boots = { name: '워커 부츠', draw(g) {
    const blk = { b: '#2E2A38', s: '#1E1B26', h: '#4A4558' };
    paint(g, both(poly([[16, 55.5], [22.6, 55.5], [22.6, 60], [12.6, 60], [12.6, 58.5], [16, 58]])), blk, { shade: [0, 2], detail: put => {
      [[18, 56], [28, 56]].forEach(([x, y]) => { put(x, y, '#E2BE62'); put(x + 1, y, '#E2BE62'); });
      line(put, 13, 59, 22, 59, '#151219'); line(put, 25, 59, 34, 59, '#151219');
    } });
  } };

  TOPS.pajama = { name: '잠옷', draw(g) {
    const lav = { b: '#C9B8F2', s: '#A592D8', h: '#E2D8FA' };
    paint(g, BODY, lav, { detail: put => {
      for (let y = 40; y <= 47; y += 3) for (let x = 17 + (y % 2) * 2; x <= 31; x += 4) put(x, y, '#FFFFFF');
      line(put, 24, 39, 24, 47, lav.s);
    } });
    paint(g, SLEEVES, lav, { detail: put => { put(13, 41, '#FFFFFF'); put(34, 41, '#FFFFFF'); line(put, 11, 45, 18, 45, lav.s); line(put, 29, 45, 36, 45, lav.s); } });
    paint(g, both(poly([[18.5, 36.5], [24, 36.5], [24, 40], [20.5, 39.5]])), { b: '#FFFFFF', s: '#E8E4EC' }, { shade: [0, 2] });
  } };
  BOTTOMS.pjpants = { name: '잠옷 바지', draw(g) {
    const lav = { b: '#C9B8F2', s: '#A592D8', h: '#E2D8FA' };
    paint(g, rect(16, 46, 31, 49), lav, { shade: [0, 2] });
    paint(g, rect(16, 48, 22.4, 57), lav, { detail: put => { for (let y = 50; y <= 56; y += 3) put(18 + (y % 2), y, '#FFFFFF'); } });
    paint(g, rect(24.6, 48, 31, 57), lav, { detail: put => { for (let y = 50; y <= 56; y += 3) put(28 + (y % 2), y, '#FFFFFF'); } });
  } };
  SHOES.slippers = { name: '털 슬리퍼', draw(g) {
    const pk = { b: '#FFD6E6', s: '#F5AFCB', h: '#FFFFFF' };
    paint(g, both(ell(18.2, 58.2, 5.2, 2.6)), pk, { shade: [0, 1], hi: [1, 1] });
  } };
  ACCS.glasses = { name: '동그란 안경', draw(g) {
    const ring = cx => sub(ell(cx, 27.8, 5.4, 4.9), ell(cx, 27.8, 4.4, 3.9)).forEach((v, i) => { if (v) g[Math.floor(i / W)][i % W] = '#3A3442'; });
    ring(16.8); ring(31.2);
    for (let x = 22; x <= 25; x++) g[27][x] = '#3A3442';
  } };
  ACCS.phones = { name: '헤드폰', draw(g) {
    const c = { b: '#7AA7FF', s: '#5B86D9', h: '#B9D3FF' };
    paint(g, clipY(sub(ell(24, 21, 18.6, 18.4), ell(24, 21, 16.4, 16.2)), 0, 27), c, { shade: [0, 2] });
    paint(g, both(ell(8.8, 29, 3.2, 4.6)), c, { hi: [1, 1] });
  } };
  ACCS.beanie = { name: '비니', draw(g) {
    const c = { b: '#FF8A7A', s: '#E05F52', h: '#FFB3A8' };
    paint(g, clipY(ell(24, 19, 17.2, 15.5), 0, 14), c, { hi: [3, 3] });
    paint(g, rect(8, 13, 39, 17), c, { shade: [0, 2], detail: put => { for (let x = 9; x <= 39; x += 2) for (let y = 14; y <= 16; y++) put(x, y, c.s); } });
    paint(g, ell(24, 3.4, 3.6, 3), { b: '#FFFFFF', s: '#E8E4EC' });
  } };

  // ── 옷 더 많이 (여성·남성 골고루 · 모두 성별 상관없이 고를 수 있음) ──
  const WHITE = { b: '#FFFFFF', s: '#E2E0EA', h: '#FFFFFF' };
  const cuffs = (put, c) => { line(put, 11, 45, 18, 45, c); line(put, 29, 45, 36, 45, c); };
  TOPS.blouse = { name: '퍼프 블라우스', draw(g) {
    const wh = { b: '#FFF8F0', s: '#E8DCCB', h: '#FFFFFF' };
    paint(g, BODY, wh, { detail: put => { [42, 45].forEach(y => put(24, y, '#E2BE62')); line(put, 16, 47, 32, 47, wh.s); } });
    paint(g, both(ell(14.6, 40.6, 3.7, 3.2)), wh, { shade: [0, 2], detail: put => { line(put, 12, 42, 17, 42, '#FFB8D2'); line(put, 30, 42, 35, 42, '#FFB8D2'); } });
    paint(g, both(poly([[18, 36.5], [24, 36.5], [24, 39.5], [19, 40]])), { b: '#FFD6E6', s: '#F5AFCB' }, { shade: [0, 1] });
    paint(g, or(tri([21, 38], [24, 39.5], [21, 41.5]), tri([27, 38], [24, 39.5], [27, 41.5])), { b: '#FF4F7B', s: '#D93362' }, { shade: [0, 1] });
  } };
  TOPS.cardigan = { name: '크롭 가디건', draw(g) {
    const pk = { b: '#FFB8D2', s: '#E98AAE', h: '#FFD8E6' };
    paint(g, BODY, pk, { detail: put => { line(put, 24, 38, 24, 48, pk.s); [40, 43, 46].forEach(y => put(23, y, '#FFFFFF')); line(put, 16, 47, 32, 47, pk.s); line(put, 16, 48, 32, 48, pk.s); } });
    paint(g, poly([[20.5, 37], [27.5, 37], [24, 41.5]]), WHITE, { shade: [0, 2] });
    paint(g, SLEEVES, pk, { detail: put => cuffs(put, pk.s) });
  } };
  TOPS.sailor = { name: '세일러 카라', draw(g) {
    const nv = { b: '#2F3A5E', s: '#222A47', h: '#44527F' }, rd = { b: '#E0475A', s: '#B8323F' };
    paint(g, BODY, WHITE, { detail: put => line(put, 16, 47, 32, 47, nv.b) });
    paint(g, SLEEVES, WHITE, { detail: put => cuffs(put, nv.b) });
    paint(g, sub(poly([[15.6, 37], [32.4, 37], [31.4, 42.5], [16.6, 42.5]]), poly([[19.5, 36], [28.5, 36], [24, 43.5]])), nv, { shade: [0, 1],
      detail: put => { line(put, 17, 41, 20, 41, '#FFFFFF'); line(put, 28, 41, 31, 41, '#FFFFFF'); } });
    paint(g, or(tri([21, 41], [24, 42.5], [22, 46]), tri([27, 41], [24, 42.5], [26, 46]), ell(24, 42.2, 1.7, 1.5)), rd, { shade: [0, 1] });
  } };
  TOPS.stripe = { name: '스트라이프 티', draw(g) {
    const wh = { b: '#FAFAF5', s: '#DEDCD2' }, nv = '#3B4A7A';
    paint(g, BODY, wh, { detail: put => { for (let y = 40; y <= 47; y += 2) line(put, 16, y, 32, y, nv); } });
    paint(g, both(cap(15.2, 39.4, 14.8, 41.8, 2.8)), wh, { detail: put => { [40, 42].forEach(y => { line(put, 11, y, 18, y, nv); line(put, 29, y, 36, y, nv); }); } });
  } };
  TOPS.shirt = { name: '셔츠 & 넥타이', draw(g) {
    const bl = { b: '#CFE2FF', s: '#A6C2EE', h: '#EAF2FF' }, s = bl.s;
    paint(g, BODY, bl, { detail: put => { line(put, 27, 42, 30, 42, s); line(put, 27, 42, 27, 45, s); line(put, 30, 42, 30, 45, s); line(put, 27, 45, 30, 45, s); } });
    paint(g, SLEEVES, bl, { detail: put => cuffs(put, '#FFFFFF') });
    paint(g, poly([[23, 38.5], [25, 38.5], [25.6, 45.5], [24, 47.5], [22.4, 45.5]]), { b: '#3B4A7A', s: '#2C3860', h: '#52639A' }, { shade: [1, 1],
      detail: put => { put(24, 42, '#E2BE62'); put(24, 44, '#E2BE62'); } });
    paint(g, both(poly([[18.5, 36.5], [24, 37.5], [21.5, 41]])), WHITE, { shade: [0, 1] });
  } };
  TOPS.denim = { name: '데님 재킷', draw(g) {
    const dn = { b: '#5C86C9', s: '#4069A8', h: '#86A9E0' };
    paint(g, BODY, dn, { detail: put => { line(put, 17, 42, 20, 42, dn.s); line(put, 28, 42, 31, 42, dn.s); put(18, 43, '#E2BE62'); put(30, 43, '#E2BE62'); line(put, 16, 47, 32, 47, dn.s); } });
    paint(g, poly([[21, 37], [27, 37], [26.4, 48.6], [21.6, 48.6]]), WHITE, { shade: [0, 2] });
    paint(g, SLEEVES, dn, { detail: put => cuffs(put, dn.s) });
    paint(g, both(poly([[17, 36.5], [21.5, 36.5], [22, 40.5], [19, 40]])), dn, { shade: [0, 1] });
  } };
  TOPS.varsity = { name: '야구 점퍼', draw(g) {
    const gr = { b: '#2F6B4F', s: '#22513B', h: '#3F8A66' }, cr = { b: '#F2E3C6', s: '#DCC79F', h: '#FFF6E4' };
    paint(g, BODY, gr, { detail: put => {
      [40, 43, 46].forEach(y => put(24, y, '#FFFFFF'));
      [[18, 41], [20, 41], [19, 42], [19, 43], [19, 44]].forEach(([x, y]) => put(x, y, cr.b));
      line(put, 16, 47, 32, 47, cr.b); line(put, 16, 48, 32, 48, gr.s);
    } });
    paint(g, SLEEVES, cr, { detail: put => cuffs(put, gr.b) });
    paint(g, both(poly([[18.5, 36.5], [24, 36.5], [24, 39.5], [20.5, 39]])), cr, { shade: [0, 1] });
  } };
  TOPS.coat = { name: '롱 코트', draw(g) {
    const cm = { b: '#C99A63', s: '#A87A47', h: '#DDB582' };
    paint(g, poly([[15.4, 37.5], [32.6, 37.5], [33.6, 53.6], [14.4, 53.6]]), cm, { detail: put => {
      line(put, 24, 41, 24, 54, cm.s); [42, 49].forEach(y => { put(21, y, '#5C3520'); put(27, y, '#5C3520'); });
      line(put, 15, 46, 33, 46, '#7A4A2E'); put(24, 46, '#E2BE62');
    } });
    paint(g, poly([[21, 37], [27, 37], [24, 41.5]]), { b: '#34303D', s: '#211E28' }, { outline: false });
    paint(g, SLEEVES, cm, { detail: put => cuffs(put, cm.s) });
    paint(g, both(poly([[17.5, 36.5], [21.5, 36.5], [24, 42], [19.5, 41]])), cm, { shade: [0, 1] });
  } };
  TOPS.puffer = { name: '패딩 점퍼', draw(g) {
    const ye = { b: '#FFC94A', s: '#E09A2A', h: '#FFE08A' };
    paint(g, poly([[14.6, 37.5], [33.4, 37.5], [33, 49.2], [15, 49.2]]), ye, { detail: put => { [41, 45].forEach(y => line(put, 15, y, 33, y, ye.s)); line(put, 24, 38, 24, 49, '#5A4A3A'); } });
    paint(g, both(cap(15, 39.6, 14, 44, 3.2)), ye, { detail: put => { line(put, 10, 42, 19, 42, ye.s); line(put, 28, 42, 37, 42, ye.s); } });
    paint(g, ell(24, 37.2, 7.5, 2.2), ye, { shade: [0, 1] });
  } };

  const WAIST = rect(16, 46, 31, 49);
  const LEGS2 = both(rect(16, 48, 22, 57));
  BOTTOMS.jeans = { name: '청바지', draw(g) {
    const dn = { b: '#4F78BD', s: '#3A5C98', h: '#7096D6' };
    paint(g, WAIST, dn, { shade: [0, 2], detail: put => { put(19, 47, '#E2BE62'); put(28, 47, '#E2BE62'); } });
    paint(g, LEGS2, dn, { detail: put => { line(put, 18, 49, 18, 54, dn.h); line(put, 29, 49, 29, 54, dn.h); } });
    paint(g, both(rect(15.4, 55, 22, 57)), { b: '#86A9E0', s: '#5C86C9' }, { shade: [0, 1] });
  } };
  BOTTOMS.shorts = { name: '반바지', draw(g) {
    const be = { b: '#D8C08E', s: '#B89C68', h: '#EAD8B0' };
    paint(g, WAIST, be, { shade: [0, 2], detail: put => line(put, 16, 46, 31, 46, '#7A4A2E') });
    paint(g, both(rect(15.4, 48, 22, 51)), be, { detail: put => { line(put, 15, 51, 22, 51, be.s); line(put, 25, 51, 32, 51, be.s); } });
  } };
  BOTTOMS.slacks = { name: '슬랙스', draw(g) {
    const gy = { b: '#5A5E6E', s: '#434655', h: '#767B8E' };
    paint(g, WAIST, gy, { shade: [0, 2], detail: put => { line(put, 16, 46, 31, 46, '#2B2140'); put(23, 46, '#D9DCE6'); put(24, 46, '#D9DCE6'); } });
    paint(g, LEGS2, gy, { detail: put => { line(put, 19, 49, 19, 57, gy.h); line(put, 28, 49, 28, 57, gy.h); } });
  } };
  BOTTOMS.jogger = { name: '조거 팬츠', draw(g) {
    const hg = { b: '#B4B8C4', s: '#9095A3', h: '#CDD1DB' };
    paint(g, WAIST, hg, { shade: [0, 2], detail: put => { line(put, 16, 46, 31, 46, hg.s); put(22, 47, '#FFFFFF'); put(22, 48, '#FFFFFF'); put(25, 47, '#FFFFFF'); put(25, 48, '#FFFFFF'); } });
    paint(g, both(poly([[15.6, 48], [23, 48], [22.6, 55.2], [17, 55.2]])), hg, { detail: put => { line(put, 16, 50, 16, 54, '#FFFFFF'); line(put, 31, 50, 31, 54, '#FFFFFF'); } });
    paint(g, both(rect(17, 55, 22, 57)), { b: hg.s, s: '#767B8E' }, { detail: put => { for (let x = 18; x <= 29; x += 2) line(put, x, 55, x, 57, '#767B8E'); } });
  } };
  BOTTOMS.wide = { name: '와이드 팬츠', draw(g) {
    const cr = { b: '#EFE3CC', s: '#D4C2A0', h: '#FFF6E4' };
    paint(g, WAIST, cr, { shade: [0, 2], detail: put => line(put, 16, 46, 31, 46, '#7A4A2E') });
    paint(g, both(poly([[16, 48], [23.2, 48], [23.4, 58], [14.2, 58]])), cr, { detail: put => { line(put, 20, 50, 19, 58, cr.s); line(put, 27, 50, 28, 58, cr.s); } });
  } };
  BOTTOMS.denimMini = { name: '데님 미니', draw(g) {
    const dn = { b: '#5C86C9', s: '#4069A8', h: '#86A9E0' };
    paint(g, poly([[16, 46], [32, 46], [33.6, 52.4], [14.4, 52.4]]), dn, { shade: [0, 2], detail: put => {
      line(put, 16, 47, 32, 47, dn.s); line(put, 24, 47, 24, 52, dn.s); put(19, 49, '#E2BE62'); put(28, 49, '#E2BE62');
      for (let x = 15; x <= 33; x += 2) put(x, 51, '#C9D8F2');
    } });
  } };
  BOTTOMS.longSkirt = { name: '롱 플레어 스커트', draw(g) {
    const sg = { b: '#9CC5A1', s: '#77A27D', h: '#BEDDC0' };
    paint(g, poly([[16, 46], [32, 46], [36, 57.2], [12, 57.2]]), sg, { shade: [0, 2], detail: put => {
      line(put, 16, 47, 32, 47, sg.s);
      [17, 21, 27, 31].forEach(x => line(put, x, 49, x + Math.round((x - 24) / 3), 56, sg.s));
      for (let y = 50; y <= 55; y += 3) for (let x = 15 + (y % 2) * 2; x <= 33; x += 4) put(x, y, '#FFFFFF');
    } });
  } };
  BOTTOMS.checkSkirt = { name: '체크 미니스커트', draw(g) {
    const rd = { b: '#D2484E', s: '#A8323A', h: '#E8737A' };
    paint(g, poly([[16, 46], [32, 46], [34.6, 53.2], [13.4, 53.2]]), rd, { shade: [0, 2], detail: put => {
      for (let y = 47; y <= 53; y++) for (let x = 13; x <= 35; x++) {
        if (x % 4 === 1 || y === 49 || y === 52) put(x, y, '#8E2A35');
        if (y === 50 && x % 4 === 3) put(x, y, '#F2D27A');
      }
      line(put, 16, 47, 32, 47, '#2B2140');
    } });
  } };

  // ── 신발 더 많이 ──
  const FOOT = both(poly([[15, 56], [22.6, 56], [22.6, 60], [13, 60], [13, 58]]));
  SHOES.maryjane = { name: '메리제인', draw(g) {
    paint(g, both(rect(16, 53, 22, 56)), WHITE, { shade: [0, 1] });
    paint(g, FOOT, { b: '#D2484E', s: '#A8323A', h: '#F08A8E' }, { shade: [0, 2], detail: put => {
      line(put, 16, 57, 22, 57, '#2B2140'); line(put, 25, 57, 31, 57, '#2B2140'); put(21, 57, '#E2BE62'); put(26, 57, '#E2BE62'); put(15, 58, '#FFFFFF'); put(32, 58, '#FFFFFF');
    } });
  } };
  SHOES.pumps = { name: '리본 펌프스', draw(g) {
    const pk = { b: '#FF9EC4', s: '#E9719F', h: '#FFC4DC' };
    paint(g, both(poly([[15, 57], [22.6, 57], [22.6, 60], [13, 60], [13, 58.5]])), pk, { shade: [0, 2], detail: put => {
      [[15, 58], [16, 58], [31, 58], [32, 58]].forEach(([x, y]) => put(x, y, '#FF4F7B'));
    } });
  } };
  SHOES.highTop = { name: '하이탑', draw(g) {
    const cv = { b: '#F7F4EE', s: '#D8D2C6' };
    paint(g, both(poly([[16, 52], [22.6, 52], [22.6, 60], [12.6, 60], [12.6, 57.5], [16, 57]])), cv, { shade: [0, 2], detail: put => {
      line(put, 13, 59, 22, 59, '#C9473F'); line(put, 25, 59, 34, 59, '#C9473F');
      [53, 55].forEach(y => { put(20, y, '#8A8F9C'); put(27, y, '#8A8F9C'); });
      put(17, 55, '#3F63C0'); put(30, 55, '#3F63C0');
    } });
  } };
  SHOES.runners = { name: '러닝화', draw(g) {
    const bl = { b: '#4F8BF0', s: '#356BCB', h: '#86B0FF' };
    paint(g, both(poly([[15, 55], [22.6, 55], [22.6, 60], [12.6, 60], [12.6, 58]])), bl, { shade: [0, 2], detail: put => {
      line(put, 13, 59, 22, 59, '#FF8A3D'); line(put, 25, 59, 34, 59, '#FF8A3D');
      line(put, 14, 58, 20, 56, '#FFFFFF'); line(put, 33, 58, 27, 56, '#FFFFFF');
    } });
  } };
  SHOES.oxford = { name: '옥스퍼드', draw(g) {
    paint(g, FOOT, { b: '#2E2A38', s: '#1E1B26', h: '#6A6478' }, { shade: [0, 2], detail: put => {
      [19, 20, 27, 28].forEach(x => put(x, 57, '#8A8F9C')); put(15, 58, '#B9B3C8'); put(32, 58, '#B9B3C8');
    } });
  } };
  SHOES.sandals = { name: '샌들', draw(g, ctx) {
    paint(g, both(poly([[15, 57], [22.4, 57], [22.4, 60], [13, 60], [13, 58.5]])), ctx.skin, { shade: [0, 1], detail: put => {
      line(put, 14, 58, 22, 58, '#7A4A2E'); line(put, 25, 58, 33, 58, '#7A4A2E'); put(18, 57, '#7A4A2E'); put(29, 57, '#7A4A2E');
      line(put, 13, 60, 22, 60, '#5C3520'); line(put, 25, 60, 34, 60, '#5C3520');
    } });
  } };
  SHOES.rainBoots = { name: '레인부츠', draw(g) {
    const ye = { b: '#FFD23F', s: '#E0A82A', h: '#FFF0A0' };
    paint(g, both(poly([[15.6, 51], [22.8, 51], [22.8, 60], [12.6, 60], [12.6, 58], [15.6, 57.5]])), ye, { detail: put => {
      line(put, 16, 52, 23, 52, ye.s); line(put, 24, 52, 31, 52, ye.s); line(put, 13, 59, 23, 59, ye.s); line(put, 24, 59, 34, 59, ye.s);
    } });
  } };
  SHOES.longBoots = { name: '롱부츠', draw(g) {
    const br = { b: '#7A4A2E', s: '#5C3520', h: '#9A6646' };
    paint(g, both(poly([[15.8, 49], [22.8, 49], [22.8, 60], [12.6, 60], [12.6, 58], [15.8, 57.5]])), br, { detail: put => {
      line(put, 16, 50, 23, 50, br.h); line(put, 24, 50, 31, 50, br.h); line(put, 13, 59, 23, 59, '#3E2416'); line(put, 24, 59, 34, 59, '#3E2416');
    } });
  } };
  SHOES.uggs = { name: '어그 부츠', draw(g) {
    paint(g, both(poly([[15, 53], [23, 53], [23, 60], [12.6, 60], [12.6, 57]])), { b: '#D9B07C', s: '#B88A55', h: '#EBCB9E' }, { shade: [0, 2] });
    paint(g, both(rect(15, 52, 22.6, 53.6)), { b: '#FFF3DD', s: '#EADBC0' }, { detail: put => { for (let x = 16; x <= 31; x += 2) put(x, 53, '#EADBC0'); } });
  } };

  // ── 소품 더 많이 ──
  const star = (cx, cy, r1, r2) => poly(Array.from({ length: 10 }, (_, i) => {
    const a = -Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? r2 : r1; return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
  }));
  const GOLD = { b: '#FFD23F', s: '#E0A82A', h: '#FFF0A0' };
  ACCS.cap = { name: '볼캡', draw(g) {
    const c = { b: '#3F63C0', s: '#2A4386', h: '#6F92E0' };
    paint(g, clipY(ell(24, 15.5, 16.8, 12.5), 0, 14), c, { hi: [3, 3], detail: put => { put(24, 8, '#FFFFFF'); put(23, 9, '#FFFFFF'); put(25, 9, '#FFFFFF'); put(24, 10, '#FFFFFF'); } });
    paint(g, poly([[7, 13], [41, 13], [42.5, 17.5], [5.5, 17.5]]), { b: c.s, s: '#1E3166', h: c.b }, { shade: [0, 2] });
  } };
  ACCS.beret = { name: '베레모', draw(g) {
    paint(g, or(ell(26, 8.5, 16.5, 6), ell(25, 1.6, 1.4, 1.6)), { b: '#B23A48', s: '#8A2A36', h: '#D85E6C' }, { hi: [3, 2] });
  } };
  ACCS.catEars = { name: '고양이 머리띠', draw(g) {
    const bk = { b: '#34303D', s: '#211E28', h: '#5E5870' };
    paint(g, both(poly([[8, 12], [17, 6], [8.5, -0.5]])), bk, { detail: put => { put(11, 5, '#FFA8C8'); put(11, 6, '#FFA8C8'); put(12, 7, '#FFA8C8'); put(36, 5, '#FFA8C8'); put(36, 6, '#FFA8C8'); put(35, 7, '#FFA8C8'); } });
    paint(g, clipY(sub(ell(24, 21, 17.4, 15.4), ell(24, 21, 15.8, 13.8)), 0, 15), bk);
  } };
  ACCS.crown = { name: '작은 왕관', draw(g) {
    paint(g, poly([[17, 10], [31, 10], [31, 2.5], [27.5, 6], [24, 0.5], [20.5, 6], [17, 2.5]]), GOLD, { detail: put => {
      put(24, 7, '#FF4F7B'); put(19, 8, '#7AA7FF'); put(29, 8, '#7AA7FF');
    } });
  } };
  ACCS.starPin = { name: '별 머리핀', draw(g) { paint(g, star(13.5, 17.5, 4.4, 2), GOLD, { hi: [1, 1] }); } };
  ACCS.flowerPin = { name: '꽃 머리핀', draw(g) {
    const pk = { b: '#FF9EC4', s: '#E9719F', h: '#FFD6E6' };
    paint(g, or(...[0, 1, 2, 3, 4].map(i => { const a = -Math.PI / 2 + i * 2 * Math.PI / 5; return ell(35 + 2.6 * Math.cos(a), 14 + 2.6 * Math.sin(a), 1.9, 1.9); })), pk, { shade: [1, 1] });
    paint(g, ell(35, 14, 1.4, 1.4), { b: '#FFD23F' }, { outline: false });
  } };
  ACCS.sunglasses = { name: '선글라스', draw(g) {
    const lens = { b: '#2B2140', h: '#77707F' };
    paint(g, both(ell(16.8, 27.8, 5.4, 4.6)), lens, { hi: [2, 2] });
    for (let x = 22; x <= 25; x++) g[26][x] = '#2B2140';
  } };
  ACCS.mask = { name: '마스크', draw(g) {
    paint(g, ell(24, 33.4, 7.6, 3.8), WHITE, { shade: [0, 2], detail: put => { line(put, 19, 33, 29, 33, '#E2E0EA'); } });
    const put = (x, y) => { g[y][x] = '#D9DCE6'; };
    line(put, 16, 32, 11, 29); line(put, 31, 32, 36, 29);
  } };
  ACCS.bandaid = { name: '반창고', draw(g) {
    paint(g, rect(30, 30, 34, 32), { b: '#F2C79A' }, { detail: put => { put(32, 31, '#D9A070'); } });
  } };
  ACCS.sprout = { name: '새싹', draw(g) {
    const gr = { b: '#7ED957', s: '#4FAE3A', h: '#B6F09A' };
    paint(g, or(ell(20.5, 3, 3, 1.6), ell(27.5, 2.4, 3, 1.6)), gr, { shade: [0, 1] });
    for (let y = 3; y <= 8; y++) g[y][24] = gr.s;
  } };
  ACCS.scarf = { name: '목도리', draw(g) {
    const rd = { b: '#E0475A', s: '#B8323F', h: '#FF7A88' };
    paint(g, or(clipY(ell(24, 38, 11.6, 3.4), 35, 41), rect(27, 39, 30, 46)), rd, { shade: [0, 2], detail: put => {
      line(put, 13, 38, 35, 38, '#FFF3DD'); line(put, 27, 43, 30, 43, '#FFF3DD');
    } });
  } };
  ACCS.necklace = { name: '진주 목걸이', draw(g) {
    [[18, 38], [20, 39], [22, 40], [26, 40], [28, 39], [30, 38]].forEach(([x, y]) => { g[y][x] = '#FFFFFF'; });
    paint(g, ell(24, 41, 1.6, 1.6), { b: '#7AA7FF', h: '#D6E4FF' }, { hi: [1, 1] });
  } };
  ACCS.crossbag = { name: '크로스백', draw(g) {
    const put = (x, y) => { g[y][x] = '#5C3520'; };
    line(put, 18, 37, 30, 43); line(put, 18, 38, 29, 43);
    paint(g, rect(28, 41, 34, 45), { b: '#9A6646', s: '#7A4A2E', h: '#B88A65' }, { shade: [0, 2], detail: put2 => { line(put2, 29, 43, 34, 43, '#7A4A2E'); put2(31, 43, '#E2BE62'); } });
  } };

  const DEFAULTS = {
    m: { hair: 'spiky', hairColor: 'brown', eyeColor: 'brown', top: 'track', bottom: 'cargo', shoes: 'sneakers', acc: '' },
    f: { hair: 'ponytail', hairColor: 'black', eyeColor: 'gray', top: 'offshoulder', bottom: 'layered', shoes: 'boots', acc: 'bigbow,choker,earring' },
  };

  // ── 옷·신발 색 바꾸기 ─────────────────────────────────────
  // 파츠를 빈 레이어에 따로 그린 뒤, 가장 많이 쓰인 색(=주 색)과 같은 계열 픽셀만
  // 고른 색으로 바꾼다. 명암 차이(밝기 차)는 그대로 살려서 그늘·하이라이트가 유지된다.
  // 흰 단추·금장·피부처럼 다른 계열 색은 그대로 둔다.
  const CLOTH = {
    red:    { name: '빨강', c: '#E0475A' }, coral:  { name: '코랄', c: '#FF8A6E' },
    yellow: { name: '노랑', c: '#FFD23F' }, green:  { name: '초록', c: '#5BAE6A' },
    mint:   { name: '민트', c: '#7ED9C3' }, sky:    { name: '하늘', c: '#7AB8FF' },
    navy:   { name: '남색', c: '#34437A' }, purple: { name: '보라', c: '#9A7AE0' },
    pink:   { name: '분홍', c: '#FF9EC4' }, beige:  { name: '베이지', c: '#E8D3B0' },
    white:  { name: '흰색', c: '#F7F5F0' }, black:  { name: '검정', c: '#34303D' },
  };
  function hsl(hex) {
    const n = parseInt(hex.slice(1, 7), 16), r = (n >> 16 & 255) / 255, g = (n >> 8 & 255) / 255, b = (n & 255) / 255;
    const mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2, d = mx - mn;
    let h = 0, s = 0;
    if (d) { s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn); h = 60 * (mx === r ? (g - b) / d + (g < b ? 6 : 0) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4); }
    return { h, s, l, chroma: d };
  }
  function hex(h, s, l) {
    const a = s * Math.min(l, 1 - l), f = n => { const k = (n + h / 30) % 12; return l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1)); };
    return '#' + [f(0), f(8), f(4)].map(v => Math.round(v * 255).toString(16).padStart(2, '0')).join('');
  }
  function recolor(layer, target, keep) {
    const skip = c => !c || c === K || c[0] !== '#' || keep.includes(c);
    const counts = {};
    layer.forEach(r => r.forEach(c => { if (!skip(c)) counts[c] = (counts[c] || 0) + 1; }));
    const base = Object.keys(counts).sort((a, b) => counts[b] - counts[a])[0];
    if (!base) return;
    const B = hsl(base), T = hsl(target), neutral = B.chroma < 0.15, map = {};
    layer.forEach(r => r.forEach((c, x) => {
      if (skip(c)) return;
      if (!(c in map)) {
        const C = hsl(c), dh = Math.min(Math.abs(C.h - B.h), 360 - Math.abs(C.h - B.h));
        const same = neutral ? C.chroma < 0.15 && Math.abs(C.l - B.l) < 0.3 : C.chroma > 0.08 && dh < 40;
        map[c] = same ? hex(T.h, T.s, Math.max(0.08, Math.min(0.97, T.l + (C.l - B.l)))) : c;
      }
      r[x] = map[c];
    }));
  }

  // only: ['top'] 처럼 특정 레이어만 그리기 (꾸미기 썸네일용)
  function compose(look, opts) {
    opts = opts || {};
    const on = n => !opts.only || opts.only.includes(n);
    look = Object.assign({ gender: 'f', face: 'calm', skin: 'light' }, DEFAULTS[look.gender || 'f'], look);
    const g = Array.from({ length: H }, () => Array(W).fill(null));
    const skin = SKINS[look.skin], hair = HAIR[look.hairColor], H_ = HAIRS[look.hair];
    const eyes = EYES[look.eyeColor] || EYES.brown, ctx = { skin };
    const pal = { K, W: '#FFFFFF', E: eyes.E, e: eyes.e, B: hair.s, p: '#FFA8A8', m: '#D9706F',
                  T: '#7CC8FF', b: '#C9B8E8', X: '#FF7070', R: '#FF4F7B', o: '#7A2E3A', t: '#FF9AAE', S: '#FFE07A' };
    if (on('shadow') && look.shadow !== false) paint(g, ell(24, 60.5, 11, 1.6), { b: 'rgba(43,33,64,0.18)' }, { outline: false });
    if (on('hairBack') && H_.back) paint(g, H_.back(), hair, { hi: [3, 3] });
    if (on('body')) {
      paint(g, EARS, skin, { detail: put => { put(10, 28, skin.s); put(37, 28, skin.s); } });
      paint(g, LEGS, skin, { shade: [2, 0] });
      paint(g, TORSO, skin);
      paint(g, ARMS, skin);
    }
    // 색을 고른 파츠는 빈 레이어에 그려서 색을 바꾼 뒤 얹는다
    const part = (key, draw) => {
      const col = CLOTH[look[key + 'Color']];
      if (!col) return draw(g, ctx);
      const t = Array.from({ length: H }, () => Array(W).fill(null));
      draw(t, ctx); recolor(t, col.c, [skin.b, skin.s]);
      t.forEach((r, y) => r.forEach((c, x) => { if (c) g[y][x] = c; }));
    };
    if (on('bottom')) part('bottom', BOTTOMS[look.bottom].draw);
    if (on('shoes')) part('shoes', SHOES[look.shoes].draw);
    if (on('top')) part('top', TOPS[look.top].draw);
    if (on('body')) { paint(g, HANDS, skin, { shade: [1, 1] }); paint(g, HEAD, skin, { shade: [0, 2] }); }
    if (on('face')) drawFace(g, look.face, look.gender, pal);
    if (on('hairFront')) {
      const f = H_.front();
      paint(g, f.m, hair, { hi: [3, 3], detail: put => {
        f.strands.forEach(([x0, y0, x1, y1]) => line(put, x0, y0, x1, y1, hair.s));
        (f.gloss || []).forEach(([x0, y0, x1, y1]) => line(put, x0, y0, x1, y1, hair.g));
      } });
    }
    if (on('acc')) String(look.acc || '').split(',').filter(a => ACCS[a]).forEach(a => ACCS[a].draw(g, ctx));
    return g;
  }

  const CROPS = { full: [0, 0, W, H], head: [6, 0, 36, 40], bust: [4, 0, 40, 50],
                  top: [9, 35, 30, 15], bottom: [10, 45, 28, 14], shoes: [10, 48, 28, 14], acc: [6, 0, 36, 46], hair: [2, 0, 44, 46] };
  function render(el) {
    const d = el.dataset, look = {};
    ['gender', 'face', 'hair', 'hairColor', 'eyeColor', 'skin', 'top', 'bottom', 'shoes', 'acc', 'topColor', 'bottomColor', 'shoesColor'].forEach(k => {
      const v = d['c' + k[0].toUpperCase() + k.slice(1)]; if (v != null) look[k] = v;
    });
    const crop = CROPS[d.cCrop || 'full'];
    el.innerHTML = PA.toSVG(compose(look), crop, d.label);
    const s = Number(d.scale); if (s) { el.style.width = crop[2] * s + 'px'; el.style.height = crop[3] * s + 'px'; }
  }
  function renderAll(root) { (root || document).querySelectorAll('[data-pxc]').forEach(render); }

  global.PixelAvatarC = { W, H, FACES, HAIRS, TOPS, BOTTOMS, SHOES, ACCS, SKINS, HAIR, EYES, DEFAULTS, CROPS, CLOTH, compose, render, renderAll };
})(typeof window !== 'undefined' ? window : globalThis);
