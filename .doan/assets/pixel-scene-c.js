/*
 * your mind — C안 장면: 배경(80×80 스테이지), 랜딩 광장 파노라마, 기분 데이터 (시안용 · 아직 앱 코드 아님)
 *
 * 배경은 외곽선 없이 면과 그늘만 써서, 외곽선이 있는 캐릭터가 앞으로 도드라지게 한다.
 * 캐릭터(48×64)는 PixelAvatarC.compose 결과를 스테이지 위에 찍는다.
 */
(function (global) {
  'use strict';
  const PA = global.PixelAvatar, PC = global.PixelAvatarC;
  const SW = 80, SH = 80, OX = 16, OY = 12, GROUND = 64;

  // ── 그리기 도구 (크기 자유) ────────────────────────────────
  const grid = (w, h) => Array.from({ length: h }, () => Array(w).fill(null));
  function shape(g, test, c) {
    for (let y = 0; y < g.length; y++) for (let x = 0; x < g[0].length; x++) if (test(x + 0.5, y + 0.5)) g[y][x] = c;
  }
  const R = (g, x0, y0, x1, y1, c) => shape(g, (x, y) => x >= x0 && x <= x1 + 1 && y >= y0 && y <= y1 + 1, c);
  const E = (g, cx, cy, rx, ry, c) => shape(g, (x, y) => ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1, c);
  const P = (g, pts, c) => shape(g, (x, y) => {
    let inside = false;
    for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
      const [xi, yi] = pts[i], [xj, yj] = pts[j];
      if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) inside = !inside;
    }
    return inside;
  }, c);
  const px = (g, x, y, c) => { if (y >= 0 && y < g.length && x >= 0 && x < g[0].length) g[y][x] = c; };
  function bands(g, stops, y1) {
    const end = y1 == null ? g.length - 1 : y1;
    stops.forEach(([y0, c], i) => { const ye = i + 1 < stops.length ? stops[i + 1][0] - 1 : end; R(g, 0, y0, g[0].length - 1, ye, c); });
  }
  function rng(seed) { let s = seed >>> 0; return () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296; }
  // 구름: 타원 여러 개 합치고 아랫줄만 그늘
  function cloud(g, x, y, s, base, shade) {
    const parts = [[0, 0, 6, 3.2], [-5, 1, 4, 2.6], [5, 1, 4.5, 2.4], [1, -2, 4, 3]];
    const inC = (X, Y) => parts.some(([dx, dy, rx, ry]) => ((X - x - dx * s) / (rx * s)) ** 2 + ((Y - y - dy * s) / (ry * s)) ** 2 <= 1);
    shape(g, (X, Y) => inC(X, Y), base);
    shape(g, (X, Y) => inC(X, Y) && !inC(X, Y + 1.5), shade);
  }
  const heart = (g, x, y, c) => ['.c.c.', 'ccccc', '.ccc.', '..c..'].forEach((r, dy) => [...r].forEach((ch, dx) => { if (ch === 'c') px(g, x + dx, y + dy, c); }));
  const flower = (g, x, y, c) => { px(g, x, y - 1, c); px(g, x - 1, y, c); px(g, x + 1, y, c); px(g, x, y + 1, c); px(g, x, y, '#FFE07A'); };
  const spot = (g, c) => E(g, 40, 73, 19, 3.6, c); // 캐릭터 발밑 밝은 바닥

  // ── 배경 ─────────────────────────────────────────────
  const BGS = {
    sky: { name: '맑은 하늘', draw(g) {
      bands(g, [[0, '#79C3F2'], [14, '#8CCDF5'], [28, '#A2D8F8'], [42, '#BCE4FA'], [54, '#D3EEFC']], GROUND - 1);
      E(g, 66, 12, 8.5, 8.5, '#FFF1B8'); E(g, 66, 12, 6, 6, '#FFE07A');
      cloud(g, 16, 14, 1.2, '#FFFFFF', '#D5EBFB'); cloud(g, 52, 30, 1, '#FFFFFF', '#D5EBFB'); cloud(g, 24, 44, 0.8, '#FFFFFF', '#D5EBFB');
      E(g, 12, 70, 28, 12, '#A8DBA3'); E(g, 66, 72, 34, 14, '#94D093');
      R(g, 0, GROUND, 79, 79, '#7CC47F'); R(g, 0, GROUND, 79, GROUND, '#6DB572');
      spot(g, '#93D394');
      const r = rng(3); for (let i = 0; i < 10; i++) flower(g, 2 + Math.floor(r() * 76), GROUND + 3 + Math.floor(r() * 13), i % 2 ? '#FFFFFF' : '#FF9EC4');
    } },
    flowers: { name: '꽃밭', draw(g) {
      bands(g, [[0, '#FFC2D9'], [16, '#FFD1E2'], [32, '#FFDFEA'], [48, '#FFECF2']], GROUND - 1);
      const r = rng(9); for (let i = 0; i < 7; i++) heart(g, 4 + Math.floor(r() * 70), 4 + Math.floor(r() * 40), i % 2 ? '#FF9EC4' : '#FFFFFF');
      R(g, 6, 30, 9, GROUND, '#8A5A44'); R(g, 9, 30, 9, GROUND, '#6E4532');
      E(g, 8, 26, 13, 10, '#F28DB3'); E(g, 7, 24, 12, 9, '#FFB3CF'); E(g, 16, 30, 7, 5, '#FFB3CF');
      for (let i = 0; i < 12; i++) px(g, 10 + Math.floor(r() * 60), 20 + Math.floor(r() * 40), '#FFB3CF');
      R(g, 0, GROUND, 79, 79, '#9EDB9A'); R(g, 0, GROUND, 79, GROUND, '#86CC86');
      spot(g, '#B3E6AE');
      for (let i = 0; i < 22; i++) flower(g, 2 + Math.floor(r() * 76), GROUND + 3 + Math.floor(r() * 14), ['#FF7EB6', '#FFFFFF', '#FFB86B'][i % 3]);
    } },
    room: { name: '내 방', draw(g) {
      R(g, 0, 0, 79, GROUND - 1, '#F5E1CC');
      for (let x = 3; x < 80; x += 8) R(g, x, 0, x + 1, GROUND - 1, '#EFD4BB');
      R(g, 2, 5, 36, 6, '#8A5A44');
      R(g, 7, 9, 31, 37, '#FFFFFF'); R(g, 9, 11, 29, 35, '#A8DBF7'); R(g, 9, 24, 29, 35, '#C2E6FA');
      cloud(g, 17, 18, 0.55, '#FFFFFF', '#E0F1FB');
      R(g, 18, 11, 19, 35, '#FFFFFF'); R(g, 9, 22, 29, 23, '#FFFFFF');
      R(g, 3, 7, 8, 42, '#E98A8A'); R(g, 30, 7, 35, 42, '#E98A8A');
      [5, 32].forEach(x => R(g, x, 8, x, 41, '#D06F6F'));
      R(g, 52, 22, 75, 23, '#B07A52');
      R(g, 56, 16, 60, 21, '#E07A5F'); E(g, 58, 13, 4.5, 3.5, '#6DB572'); E(g, 56, 12, 2, 2, '#86CC86');
      R(g, 64, 14, 66, 21, '#7AA7FF'); R(g, 67, 16, 69, 21, '#FFD23F'); R(g, 70, 13, 72, 21, '#B8A7E8');
      R(g, 48, 32, 62, 45, '#B07A52'); R(g, 50, 34, 60, 43, '#FFF1C4'); E(g, 55, 40, 4, 2.5, '#9ED9A0'); E(g, 57, 36.5, 1.6, 1.6, '#FFC94A');
      R(g, 0, GROUND - 2, 79, GROUND - 1, '#FFFFFF');
      R(g, 0, GROUND, 79, 79, '#D9A472');
      [68, 73, 78].forEach(y => R(g, 0, y, 79, y, '#C38D5C'));
      E(g, 40, 73, 25, 5.2, '#E9A3B8'); E(g, 40, 73, 21, 3.6, '#F3BFD0');
    } },
    night: { name: '밤하늘', draw(g) {
      bands(g, [[0, '#14123A'], [16, '#1C1A4A'], [32, '#26235C'], [46, '#322E70']], GROUND - 1);
      shape(g, (x, y) => ((x - 62) / 7) ** 2 + ((y - 14) / 7) ** 2 <= 1 && ((x - 65.5) / 6) ** 2 + ((y - 11.5) / 6) ** 2 > 1, '#FFF1B8');
      const r = rng(21);
      for (let i = 0; i < 26; i++) {
        const x = Math.floor(r() * 80), y = Math.floor(r() * 40);
        if (i % 6 === 0) { px(g, x, y, '#FFE39A'); px(g, x - 1, y, '#8C83C9'); px(g, x + 1, y, '#8C83C9'); px(g, x, y - 1, '#8C83C9'); px(g, x, y + 1, '#8C83C9'); }
        else px(g, x, y, i % 2 ? '#FFFFFF' : '#B9B3E8');
      }
      [[0, 46, 10], [10, 40, 16], [26, 50, 30], [42, 36, 52], [52, 44, 62], [62, 38, 72], [72, 48, 79]].forEach(([x0, y0, x1]) => {
        R(g, x0, y0, x1, GROUND - 1, '#221F52');
        for (let y = y0 + 3; y < GROUND - 3; y += 4) for (let x = x0 + 2; x < x1 - 1; x += 3) if (r() < 0.45) px(g, x, y, '#FFD36B');
      });
      R(g, 0, GROUND, 79, 79, '#1E1C46'); spot(g, '#2E2B66');
    } },
    rain: { name: '비 오는 날', draw(g) {
      bands(g, [[0, '#5F6F8E'], [16, '#6E7E9C'], [32, '#7E8DAA'], [48, '#8E9CB7']], GROUND - 1);
      [[0, 42, 12], [14, 34, 24], [30, 46, 40], [46, 38, 58], [62, 44, 79]].forEach(([x0, y0, x1]) => R(g, x0, y0, x1, GROUND - 1, '#71809D'));
      cloud(g, 18, 8, 1.4, '#9AA7BF', '#7F8CA6'); cloud(g, 58, 12, 1.2, '#9AA7BF', '#7F8CA6');
      const r = rng(5);
      for (let i = 0; i < 40; i++) { const x = Math.floor(r() * 80), y = 14 + Math.floor(r() * 60); px(g, x, y, '#C9D6EE'); px(g, x - 1, y + 1, '#C9D6EE'); }
      R(g, 0, GROUND, 79, 79, '#4E5B78');
      E(g, 14, 75, 9, 2.2, '#7F93BA'); E(g, 66, 70, 8, 1.8, '#7F93BA'); E(g, 14, 75, 5, 1, '#A9BCE0');
      spot(g, '#5C6A88');
    } },
    sunset: { name: '노을', draw(g) {
      bands(g, [[0, '#4B3B8C'], [10, '#7A4A9E'], [20, '#B0569E'], [30, '#E06A8E'], [40, '#FF8F6E'], [50, '#FFB36B']], GROUND - 1);
      shape(g, (x, y) => ((x - 58) / 13) ** 2 + ((y - 62) / 13) ** 2 <= 1 && y < GROUND, '#FFE08A');
      E(g, 20, 18, 12, 1.4, '#FF9FB0'); E(g, 30, 26, 9, 1.2, '#FFB3A7');
      P(g, [[0, 54], [14, 48], [28, 56], [44, 50], [60, 57], [80, 50], [80, 64], [0, 64]], '#3B2D6B');
      R(g, 0, GROUND, 79, 79, '#2E2358'); spot(g, '#43357A');
      [[14, 10], [20, 13], [64, 8]].forEach(([x, y]) => { px(g, x, y, '#2E2358'); px(g, x - 1, y - 1, '#2E2358'); px(g, x + 1, y - 1, '#2E2358'); });
    } },
    checker: { name: '기분 컬러', draw(g, look) {
      const m = MOODS[look.mood] || MOODS.blank;
      for (let y = 0; y < SH; y++) for (let x = 0; x < SW; x++) g[y][x] = ((x >> 3) + (y >> 3)) % 2 ? m.color : m.soft;
      spot(g, 'rgba(255,255,255,0.45)');
    } },
    spot: { name: '스포트라이트', hidden: true, draw(g) {
      bands(g, [[0, '#2B2A63'], [20, '#33316E'], [40, '#3D3A7C'], [56, '#48428A']], GROUND - 1);
      P(g, [[32, 0], [48, 0], [64, 74], [16, 74]], 'rgba(255,240,200,0.10)');
      R(g, 0, GROUND, 79, 79, '#2A2858'); E(g, 40, 73, 22, 4.4, '#4A4590'); E(g, 40, 73, 16, 3, '#5C56A6');
    } },
  };

  // ── 배경 더 많이 ──
  const L = (g, x0, y0, x1, y1, c) => { const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)) || 1; for (let i = 0; i <= n; i++) px(g, Math.round(x0 + (x1 - x0) * i / n), Math.round(y0 + (y1 - y0) * i / n), c); };
  const ring = (g, cx, cy, r0, r1, c) => shape(g, (x, y) => { const d = Math.hypot(x - cx, y - cy); return d >= r0 && d < r1; }, c);
  const pine = (g, x, y, h, c, snow) => {
    for (let i = 0; i < 3; i++) { const t = y + i * h * 0.28, w = h * (0.22 + i * 0.1); P(g, [[x, t], [x + w, t + h * 0.38], [x - w, t + h * 0.38]], c); if (snow) P(g, [[x, t], [x + w * 0.45, t + h * 0.15], [x - w * 0.45, t + h * 0.15]], snow); }
    R(g, x - 1, y + h * 0.92, x, y + h * 1.08, '#6E4532');
  };
  Object.assign(BGS, {
    beach: { name: '바닷가', draw(g) {
      bands(g, [[0, '#6CC4F0'], [14, '#86D0F4'], [28, '#A6DEF8']], 41);
      E(g, 64, 12, 7, 7, '#FFF1B8'); E(g, 64, 12, 5, 5, '#FFE07A');
      cloud(g, 20, 12, 1, '#FFFFFF', '#D5EBFB');
      bands(g, [[42, '#2F9BD6'], [47, '#3FAEE0'], [52, '#58C0E8']], 55);
      const r = rng(13); for (let i = 0; i < 14; i++) { const x = Math.floor(r() * 76), y = 43 + Math.floor(r() * 12); R(g, x, y, x + 2, y, '#A8E2F8'); }
      R(g, 0, 56, 79, 57, '#FFFFFF'); for (let x = 0; x < 80; x += 6) E(g, x + 3, 57.5, 3, 1.2, '#FFFFFF');
      R(g, 0, 58, 79, 79, '#F5DFA8'); R(g, 0, 58, 79, 58, '#EBD08E'); spot(g, '#FBEBC4');
      R(g, 9, 30, 9, 70, '#8A5A44');
      P(g, [[9, 22], [24, 32], [-6, 32]], '#FF6B6B'); P(g, [[9, 22], [14, 32], [4, 32]], '#FFFFFF');
      [[66, 70], [72, 76], [6, 76]].forEach(([x, y], i) => { const c = i ? '#FFB3A7' : '#FF8A5C'; px(g, x, y, c); px(g, x - 1, y, c); px(g, x + 1, y, c); px(g, x, y - 1, c); px(g, x - 1, y + 1, c); px(g, x + 1, y + 1, c); });
    } },
    rainbow: { name: '무지개 언덕', draw(g) {
      bands(g, [[0, '#BFE6FF'], [20, '#D2EEFF'], [40, '#E6F6FF']], GROUND - 1);
      ['#FF7A7A', '#FFB86B', '#FFE07A', '#8ED98A', '#7AB8FF', '#B69CF0'].forEach((c, i) => ring(g, 40, 62, 36 - i * 2.6, 38.6 - i * 2.6, c));
      cloud(g, 7, 56, 1.1, '#FFFFFF', '#E0EEF8'); cloud(g, 73, 56, 1.1, '#FFFFFF', '#E0EEF8');
      E(g, 40, 82, 56, 20, '#9EDB9A'); R(g, 0, GROUND + 2, 79, 79, '#8ACF88'); spot(g, '#B3E6AE');
      const r = rng(17); for (let i = 0; i < 12; i++) flower(g, 2 + Math.floor(r() * 76), GROUND + 4 + Math.floor(r() * 12), ['#FFFFFF', '#FFE07A', '#FF9EC4'][i % 3]);
    } },
    ferris: { name: '놀이공원', draw(g) {
      bands(g, [[0, '#B8A7E8'], [16, '#CDB8EE'], [32, '#E6C6EC'], [48, '#FFD6E8']], GROUND - 1);
      for (let a = 0; a < 8; a++) { const t = a * Math.PI / 4; L(g, 60, 28, 60 + Math.round(17 * Math.cos(t)), 28 + Math.round(17 * Math.sin(t)), '#8C7BC9'); }
      ring(g, 60, 28, 16.2, 17.6, '#6E5DB0'); E(g, 60, 28, 2.4, 2.4, '#FFD23F');
      L(g, 60, 28, 50, GROUND - 1, '#6E5DB0'); L(g, 60, 28, 70, GROUND - 1, '#6E5DB0');
      ['#FF7EB6', '#7ED9C3', '#FFD23F', '#7AA7FF', '#FF8A5C', '#B8A7E8', '#FF7EB6', '#7ED9C3'].forEach((c, a) => { const t = a * Math.PI / 4 + Math.PI / 8; const x = 60 + Math.round(17 * Math.cos(t)), y = 28 + Math.round(17 * Math.sin(t)); R(g, x - 1, y, x + 1, y + 2, c); });
      for (let x = 0; x < 42; x++) { const y = Math.round(10 + 4 * Math.sin(Math.PI * x / 21)); px(g, x, y, '#5A4A8C'); if (x % 4 === 2) px(g, x, y + 1, ['#FFD23F', '#FF7EB6', '#7ED9C3'][(x / 4 | 0) % 3]); }
      P(g, [[12, 40], [20, 46], [4, 46]], '#FF7EB6'); R(g, 5, 46, 19, 47, '#FFD23F'); R(g, 6, 48, 18, GROUND - 1, '#FFF1F6'); [8, 12, 16].forEach(x => R(g, x, 48, x, GROUND - 1, '#E9A3C8'));
      R(g, 0, GROUND, 79, 79, '#A897DA'); for (let x = 0; x < 80; x += 8) R(g, x, GROUND, x, 79, '#9886CC'); spot(g, '#BEB0E6');
    } },
    cafe: { name: '카페', draw(g) {
      R(g, 0, 0, 79, GROUND - 1, '#EBD7BF'); R(g, 0, 44, 79, GROUND - 1, '#8A5A44'); R(g, 0, 44, 79, 45, '#6E4532');
      for (let x = 4; x < 80; x += 8) R(g, x, 46, x, GROUND - 1, '#7A4A36');
      R(g, 4, 8, 28, 36, '#FFFFFF'); R(g, 6, 10, 26, 34, '#BFE3F7'); R(g, 6, 26, 26, 34, '#D6EEFB'); R(g, 16, 10, 16, 34, '#FFFFFF');
      E(g, 11, 30, 4, 3, '#86CC86'); E(g, 22, 31, 4, 2.6, '#9ED9A0');
      [[40, 0], [56, 0]].forEach(([x]) => { R(g, x, 0, x, 8, '#3A3442'); P(g, [[x, 8], [x + 4, 13], [x - 4, 13]], '#3A3442'); E(g, x, 14, 2.4, 1.4, '#FFE39A'); });
      R(g, 62, 8, 77, 30, '#7A4A2E'); R(g, 63, 9, 76, 29, '#2F4A3E');
      [12, 16, 20, 24].forEach((y, i) => R(g, 65, y, 65 + 6 + (i % 2) * 3, y, '#F2F2F2')); E(g, 72, 26, 1.6, 1.6, '#FF9EC4');
      R(g, 34, 22, 52, 23, '#8A5A44'); [[36, '#FFFFFF'], [41, '#FF9EC4'], [46, '#7ED9C3']].forEach(([x, c]) => { R(g, x, 18, x + 3, 21, c); px(g, x + 4, 19, c); });
      for (let y = GROUND; y < 80; y++) for (let x = 0; x < 80; x++) g[y][x] = ((x >> 3) + (y >> 3)) % 2 ? '#B07A52' : '#C08A60';
      spot(g, '#D9A87A');
    } },
    classroom: { name: '교실', draw(g) {
      R(g, 0, 0, 79, GROUND - 1, '#F3EBD8'); R(g, 0, 50, 79, GROUND - 1, '#C9A27A'); R(g, 0, 50, 79, 50, '#A88158');
      R(g, 8, 6, 72, 38, '#8A5A44'); R(g, 10, 8, 70, 36, '#3E6B52'); R(g, 12, 39, 68, 40, '#B07A52');
      [[16, 13, 30, 13], [16, 17, 26, 17], [16, 21, 28, 21]].forEach(([a, b, c, d]) => L(g, a, b, c, d, '#E8F0E8'));
      ['.c.c.', 'ccccc', '.ccc.', '..c..'].forEach((r, dy) => [...r].forEach((ch, dx) => { if (ch === 'c') { px(g, 58 + dx * 2, 12 + dy * 2, '#FFB3CF'); px(g, 59 + dx * 2, 12 + dy * 2, '#FFB3CF'); px(g, 58 + dx * 2, 13 + dy * 2, '#FFB3CF'); px(g, 59 + dx * 2, 13 + dy * 2, '#FFB3CF'); } }));
      R(g, 20, 39, 23, 39, '#FFFFFF'); R(g, 26, 39, 28, 39, '#FFD23F');
      E(g, 40, 3, 3, 3, '#FFFFFF'); px(g, 40, 2, '#3A3442'); px(g, 41, 3, '#3A3442');
      R(g, 0, GROUND, 79, 79, '#D9B48A'); [68, 73, 78].forEach(y => R(g, 0, y, 79, y, '#C49C70')); spot(g, '#E6C69E');
    } },
    autumn: { name: '단풍길', draw(g) {
      bands(g, [[0, '#FFD9A8'], [16, '#FFE3B8'], [32, '#FFEDCC']], GROUND - 1);
      [[8, 34], [72, 30]].forEach(([x, y]) => { R(g, x - 1, y, x + 2, GROUND - 1, '#7A4A2E'); E(g, x, y - 6, 12, 10, '#E0603A'); E(g, x - 2, y - 9, 9, 7, '#F28A3D'); E(g, x + 4, y - 4, 6, 5, '#FFB84A'); });
      E(g, 40, 50, 30, 8, '#E9B87A');
      R(g, 0, GROUND, 79, 79, '#D9A472'); P(g, [[28, GROUND], [52, GROUND], [70, 79], [10, 79]], '#E9C08E'); spot(g, '#F0CFA0');
      const r = rng(31); for (let i = 0; i < 30; i++) { const y = i < 14 ? 8 + Math.floor(r() * 50) : GROUND + 1 + Math.floor(r() * 15); px(g, Math.floor(r() * 80), y, ['#E0603A', '#F28A3D', '#FFC94A', '#B8432E'][i % 4]); }
    } },
    snow: { name: '눈 오는 날', draw(g) {
      bands(g, [[0, '#A9BCE0'], [16, '#BACAE8'], [32, '#CBD8F0'], [48, '#DCE6F7']], GROUND - 1);
      E(g, 14, 64, 30, 12, '#EEF3FC'); E(g, 66, 66, 32, 14, '#E4ECFA');
      pine(g, 8, 26, 34, '#3E6B5A', '#FFFFFF'); pine(g, 72, 30, 30, '#4A7A66', '#FFFFFF');
      E(g, 68, 60, 5, 4.6, '#FFFFFF'); E(g, 68, 52, 3.6, 3.4, '#FFFFFF'); px(g, 67, 51, '#2B2140'); px(g, 69, 51, '#2B2140'); px(g, 68, 53, '#FF8A3D'); R(g, 65, 55, 71, 55, '#E0475A');
      R(g, 0, GROUND, 79, 79, '#F4F8FF'); R(g, 0, GROUND, 79, GROUND, '#DCE6F5'); spot(g, '#FFFFFF');
      const r = rng(7); for (let i = 0; i < 40; i++) { const x = Math.floor(r() * 80), y = Math.floor(r() * 62); px(g, x, y, '#FFFFFF'); if (i % 5 === 0) { px(g, x + 1, y, '#FFFFFF'); px(g, x, y + 1, '#FFFFFF'); } }
    } },
    camping: { name: '숲속 캠핑', draw(g) {
      bands(g, [[0, '#2A2E5E'], [14, '#3B3C74'], [28, '#5A4F8E'], [42, '#8A6AA6']], GROUND - 1);
      const r = rng(19); for (let i = 0; i < 14; i++) px(g, Math.floor(r() * 80), Math.floor(r() * 24), '#FFFFFF');
      [[4, 18, 40], [16, 26, 34], [66, 22, 38], [76, 16, 44], [56, 30, 30]].forEach(([x, y, h]) => pine(g, x, y, h, '#1F3A3A'));
      P(g, [[14, 40], [28, GROUND + 2], [0, GROUND + 2]], '#FF8A5C'); P(g, [[14, 40], [18, GROUND + 2], [10, GROUND + 2]], '#C9573A'); L(g, 14, 38, 14, 41, '#5A4A3A');
      R(g, 0, GROUND, 79, 79, '#2F4A3A'); spot(g, '#46604A');
      R(g, 66, 72, 74, 73, '#7A4A2E'); P(g, [[70, 63], [74, 72], [66, 72]], '#FF8A3D'); P(g, [[70, 66], [72, 72], [68, 72]], '#FFE07A');
      for (let i = 0; i < 10; i++) px(g, Math.floor(r() * 80), 34 + Math.floor(r() * 40), '#E8FF7A');
    } },
    underwater: { name: '바닷속', draw(g) {
      bands(g, [[0, '#7FD3F0'], [14, '#5BBDE6'], [30, '#3FA3D6'], [46, '#2E86C0']], GROUND - 1);
      [[12, 16], [36, 41], [58, 62]].forEach(([a, b]) => P(g, [[a, 0], [b, 0], [b + 6, 34], [a + 4, 34]], '#94DCF4'));
      const r = rng(23); for (let i = 0; i < 10; i++) { const x = 4 + Math.floor(r() * 72), y = 4 + Math.floor(r() * 50); ring(g, x, y, 0.9, 1.9, '#D6F3FF'); }
      [[6, 0], [12, 1], [70, 0], [75, 1]].forEach(([x, k]) => { for (let y = 30 + k * 6; y < GROUND + 4; y++) px(g, x + Math.round(1.6 * Math.sin(y / 3)), y, '#4FAE6A'); });
      [[22, 20, '#FFB84A'], [62, 34, '#FF7EB6']].forEach(([x, y, c]) => { E(g, x, y, 3.4, 2, c); P(g, [[x + 2.5, y], [x + 6, y - 2.5], [x + 6, y + 2.5]], c); px(g, x - 2, y - 1, '#2B2140'); });
      R(g, 0, GROUND, 79, 79, '#E9D3A0'); spot(g, '#F4E2B8');
      E(g, 66, GROUND, 6, 5, '#FF8AA8'); E(g, 62, GROUND - 2, 2.4, 3.2, '#FF6B8E'); E(g, 12, GROUND + 1, 5, 3, '#FFB3C8');
    } },
    space: { name: '우주', draw(g) {
      bands(g, [[0, '#0E0B2A'], [20, '#17123C'], [40, '#21194E']], GROUND - 1);
      const r = rng(41); for (let i = 0; i < 40; i++) px(g, Math.floor(r() * 80), Math.floor(r() * 60), i % 4 ? '#FFFFFF' : '#FFE39A');
      E(g, 64, 16, 8, 8, '#FF9E7A'); E(g, 62, 14, 5, 4, '#FFB89A'); shape(g, (x, y) => { const v = ((x - 64) / 14) ** 2 + ((y - 17) / 3) ** 2; return v <= 1 && v > 0.55 && !(y < 16 && ((x - 64) / 8) ** 2 + ((y - 16) / 8) ** 2 <= 1); }, '#FFE07A');
      E(g, 14, 30, 4, 4, '#7AA7FF'); E(g, 13, 29, 2, 2, '#B9D3FF');
      E(g, 40, 92, 70, 30, '#8E8AA8'); R(g, 0, GROUND + 2, 79, 79, '#8E8AA8');
      [[12, 70, 4, 1.4], [64, 74, 5, 1.6], [30, 77, 3, 1]].forEach(([x, y, a, b]) => E(g, x, y, a, b, '#77738F')); spot(g, '#A6A2C0');
    } },
  });

  // ── 기분 (C안) ───────────────────────────────────────────
  const MOODS = {
    happy:   { label: '행복해요', color: '#FFD23F', soft: '#FFF0B3', face: 'happy',   bg: 'sky',
               rec: { face: ['happy', 'laugh', 'wink'], hair: ['bob', 'spiky', 'spaceBuns', 'curly'], top: ['track', 'hoodie', 'stripe', 'varsity'], bottom: ['cargo', 'jeans', 'shorts'], shoes: ['sneakers', 'highTop', 'runners'], acc: ['phones', 'cap', 'starPin', 'sprout'], bg: ['sky', 'flowers', 'beach', 'rainbow', 'ferris'] } },
    excited: { label: '설레요',   color: '#FF7EB6', soft: '#FFD6E8', face: 'excited', bg: 'flowers',
               rec: { face: ['excited', 'love', 'sparkle'], hair: ['ponytail', 'long', 'twinTails', 'wavy', 'hime'], top: ['offshoulder', 'blouse', 'sailor'], bottom: ['layered', 'checkSkirt', 'denimMini'], shoes: ['maryjane', 'pumps', 'loafers'], acc: ['bigbow', 'flowerPin', 'crown', 'necklace'], bg: ['flowers', 'sunset', 'ferris', 'cafe'] } },
    calm:    { label: '평온해요', color: '#7ED9C3', soft: '#D3F4EA', face: 'calm',    bg: 'room',
               rec: { face: ['calm', 'smug', 'shy'], hair: ['long', 'dandy', 'braid', 'sidePart'], top: ['knit', 'cardigan', 'shirt'], bottom: ['skirt', 'longSkirt', 'wide', 'slacks'], shoes: ['loafers', 'oxford', 'sandals'], acc: ['glasses', 'beret', 'necklace'], bg: ['room', 'sky', 'cafe', 'autumn', 'underwater'] } },
    tired:   { label: '피곤해요', color: '#B8A7E8', soft: '#E6DFFA', face: 'tired',   bg: 'night',
               rec: { face: ['tired', 'dizzy'], hair: ['bob', 'dandy', 'bun', 'buzz'], top: ['pajama', 'hoodie', 'puffer'], bottom: ['pjpants', 'jogger'], shoes: ['slippers', 'uggs'], acc: ['beanie', 'mask'], bg: ['night', 'room', 'camping'] } },
    sad:     { label: '우울해요', color: '#7AA7FF', soft: '#D6E4FF', face: 'sad',     bg: 'rain',
               rec: { face: ['sad', 'cry', 'pout'], hair: ['long', 'hime', 'wolf'], top: ['hoodie', 'coat', 'puffer'], bottom: ['cargo', 'jogger', 'wide'], shoes: ['boots', 'rainBoots'], acc: ['phones', 'scarf', 'bandaid'], bg: ['rain', 'night', 'snow', 'autumn'] } },
    angry:   { label: '화나요',   color: '#FF6B57', soft: '#FFD5CE', face: 'angry',   bg: 'sunset',
               rec: { face: ['angry', 'pout'], hair: ['spiky', 'wolf', 'buzz'], top: ['track', 'denim'], bottom: ['cargo', 'jeans'], shoes: ['boots', 'longBoots'], acc: ['choker', 'sunglasses', 'cap'], bg: ['sunset', 'space'] } },
    blank:   { label: '멍해요',   color: '#C9CDD6', soft: '#EEF0F3', face: 'blank',   bg: 'checker',
               rec: { face: ['blank', 'shock', 'dizzy'], hair: ['bob', 'bun', 'curly'], top: ['pajama', 'stripe'], bottom: ['pjpants', 'shorts'], shoes: ['slippers', 'sandals'], acc: ['glasses', 'catEars', 'sprout'], bg: ['checker', 'sky', 'classroom', 'snow'] } },
  };

  function stampGrid(dst, src, ox, oy) {
    src.forEach((row, y) => row.forEach((c, x) => { if (c) px(dst, ox + x, oy + y, c); }));
  }
  function withMood(look) {
    const m = MOODS[look.mood];
    return Object.assign({}, look, { face: look.face || (m && m.face) || 'calm', bg: look.bg || (m && m.bg) || 'sky' });
  }
  // 80×80 스테이지 = 배경 + 캐릭터
  function stage(lookIn) {
    const look = withMood(lookIn);
    const g = grid(SW, SH);
    if (look.bg !== 'none') BGS[look.bg].draw(g, look);
    stampGrid(g, PC.compose(look), OX, OY);
    return g;
  }

  // 랜딩 광장 파노라마 (하늘은 비워서 프레임 배경이 보이게)
  const PW = 320, PH = 120, FEET = 112, FLOOR = 96;
  function plaza(actors) {
    const g = grid(PW, PH);
    const r = rng(42);
    let x0 = 0;
    while (x0 < PW) {
      const w = 12 + Math.floor(r() * 14), top = 44 + Math.floor(r() * 22), x1 = Math.min(PW - 1, x0 + w);
      R(g, x0, top, x1, FLOOR, r() < 0.5 ? '#3A2F6E' : '#34296A');
      R(g, x0, top, x1, top, '#4A3D82');
      for (let y = top + 3; y < FLOOR - 2; y += 4) for (let x = x0 + 2; x < x1 - 1; x += 3) if (r() < 0.38) px(g, x, y, r() < 0.7 ? '#FFD36B' : '#FF9EC4');
      x0 = x1 + 1;
    }
    for (let x = 0; x < PW; x++) {
      const t = (x % 80) / 80, y = Math.round(30 + 8 * Math.sin(Math.PI * t));
      px(g, x, y, '#1A1838');
      if (x % 7 === 3) { const c = ['#FFC94A', '#FF7EB6', '#7ED9C3', '#9DB8FF'][(x / 7 | 0) % 4]; px(g, x, y + 1, c); px(g, x, y + 2, c); px(g, x - 1, y + 1, c); px(g, x + 1, y + 1, c); }
    }
    R(g, 0, FLOOR, PW - 1, PH - 1, '#4A3F7A');
    R(g, 0, FLOOR, PW - 1, FLOOR + 1, '#5E5294');
    for (let x = 0; x < PW; x += 14) R(g, x, FLOOR + 2, x, PH - 1, '#433872');
    [104, 114].forEach(y => R(g, 0, y, PW - 1, y, '#433872'));
    [80, 160, 240].forEach(x => {
      E(g, x, FLOOR + 6, 12, 2.6, '#6A5B9E');
      R(g, x, 56, x + 1, FLOOR + 6, '#1A1838'); R(g, x - 2, 51, x + 3, 55, '#1A1838'); R(g, x - 1, 52, x + 2, 54, '#FFE39A');
    });
    (actors || []).forEach(a => {
      E(g, a.x, FEET + 1, 14, 2.6, '#6A5B9E');
      stampGrid(g, PC.compose(Object.assign({ shadow: true }, a.look)), a.x - 24, FEET - 60);
    });
    return g;
  }

  function readLook(el) {
    const d = el.dataset, look = {};
    ['gender', 'mood', 'face', 'hair', 'hairColor', 'eyeColor', 'skin', 'top', 'bottom', 'shoes', 'acc', 'bg', 'topColor', 'bottomColor', 'shoesColor'].forEach(k => {
      const v = d['c' + k[0].toUpperCase() + k.slice(1)]; if (v != null) look[k] = v;
    });
    return look;
  }
  function size(el, w, h) { const s = Number(el.dataset.scale); if (s) { el.style.width = w * s + 'px'; el.style.height = h * s + 'px'; } }
  // data-scene="stage" : 배경+캐릭터 / data-scene="plaza" : 랜딩 광장 (data-actors JSON)
  function render(el) {
    if (el.dataset.scene === 'plaza') {
      el.innerHTML = PA.toSVG(plaza(JSON.parse(el.dataset.actors || '[]')), [0, 0, PW, PH], el.dataset.label);
      return size(el, PW, PH);
    }
    el.innerHTML = PA.toSVG(stage(readLook(el)), [0, 0, SW, SH], el.dataset.label);
    size(el, SW, SH);
  }
  function renderAll(root) { (root || document).querySelectorAll('[data-scene]').forEach(render); }

  global.PixelSceneC = { SW, SH, PW, PH, FEET, BGS, MOODS, stage, plaza, render, renderAll, readLook, withMood };
})(typeof window !== 'undefined' ? window : globalThis);
