/*
 * your mind — 픽셀 캐릭터 렌더러 (시안용, 아직 앱 코드 아님)
 *
 * 캐릭터 그리드 32×34, 스테이지(배경 포함) 48×48.
 * 파츠는 문자열 픽셀 맵으로 정의하고, 문자 하나가 색 슬롯 하나를 뜻한다.
 *   K 외곽선 · W 흰색 · S/s 피부/그늘 · H/h/L 헤어 기본/그늘/하이라이트
 *   O/o/A 옷 기본/그늘/포인트 · 그 외 문자는 FIXED 고정색
 * 레이어 순서: 배경 → 그림자 → 뒷머리 → 몸 → 옷 → 신발 → 표정 → 앞머리 → 악세서리
 */
(function (global) {
  'use strict';

  const CW = 32, CH = 34;          // 캐릭터 그리드
  const STAGE = 48;                // 스테이지 그리드
  const OX = 8, OY = 8;            // 스테이지 안 캐릭터 위치 (발끝 y=40)

  const FIXED = {
    K: '#2B2140', W: '#FFFFFF', p: '#FF9AA2', R: '#FF4F7B', r: '#C93A55',
    T: '#6CC4FF', b: '#B8A7E8', X: '#FF6B6B', n: '#5274B8',
    Q: '#FF6B57', Y: '#FFD23F', y: '#FFF1A8', k: '#D94A5A', F: '#FFD6E6', f: '#FF9EC4',
    P: '#7AA7FF', Z: '#C4DAFF', G: '#7BD389', g: '#4FA862', V: '#FF8A7A', v: '#E05F52',
  };

  const SKINS = {
    light:  { name: '밝은 톤',  S: '#FFE3CC', s: '#F4BFA0' },
    peach:  { name: '복숭아 톤', S: '#F8CFA8', s: '#E3A77C' },
    tan:    { name: '태닝 톤',  S: '#D9A06F', s: '#B57B4E' },
    deep:   { name: '깊은 톤',  S: '#9A6440', s: '#7A4A2C' },
  };

  const HAIR_COLORS = {
    brown:  { name: '갈색', H: '#8B5A3C', h: '#6B3F28', L: '#B07A52' },
    black:  { name: '검정', H: '#3D3552', h: '#2E2840', L: '#5E5576' },
    blonde: { name: '금발', H: '#F5C95B', h: '#D9A43A', L: '#FFE59A' },
    pink:   { name: '핑크', H: '#FF8FB8', h: '#E0679A', L: '#FFC2D9' },
    mint:   { name: '민트', H: '#6FD6C0', h: '#44B09A', L: '#A8F0E0' },
    purple: { name: '보라', H: '#9C7BE8', h: '#7558C4', L: '#C5B0F5' },
  };

  const OUTFIT_COLORS = {
    pink:     { name: '핑크',   O: '#FF9EC4', o: '#E9719F', A: '#FFFFFF' },
    sky:      { name: '하늘',   O: '#8EC9FF', o: '#5E9EE0', A: '#FFFFFF' },
    mint:     { name: '민트',   O: '#8FE0C8', o: '#5DB89F', A: '#FFF6C8' },
    yellow:   { name: '노랑',   O: '#FFE07A', o: '#E7B93E', A: '#FF8A5B' },
    lavender: { name: '라벤더', O: '#C3B1FF', o: '#9884E0', A: '#FFFFFF' },
    charcoal: { name: '차콜',   O: '#4A4560', o: '#35304A', A: '#FFD23F' },
  };

  // ── 기본 몸 ──────────────────────────────────────────────
  const HEAD = '.......KSSSSSSSSSSSSSSSSK.......';
  const ARM = '........KSSKSSSSSSSSKSSK........';
  const LEG = '...........KSSSKKSSSK...........';
  const BASE = { x: 0, y: 5, rows: [
    '..........KKKKKKKKKKKK..........',
    '........KKSSSSSSSSSSSSKK........',
    HEAD, HEAD, HEAD, HEAD, HEAD, HEAD, HEAD, HEAD, HEAD,
    '........KKSSSSSSSSSSSSKK........',
    '..........KKKKKKKKKKKK..........',
    '..............KSSK..............',
    '..........KKKKKKKKKKKK..........',
    '.........KSSSSSSSSSSSSK.........',
    ARM, ARM, ARM, ARM,
    '........KssKSSSSSSSSKssK........',
    '.........KKKSSSSSSSSKKK.........',
    LEG, LEG, LEG, LEG,
    '...........KKKKKKKKKK...........',
  ] };

  // ── 표정 (x=8, 16칸) ─────────────────────────────────────
  const FACES = {
    happy:   { name: '방긋',   y: 11, rows: [
      '...K........K...',
      '..K.K......K.K..',
      '.pp..........pp.',
      '.....KKKKKK.....',
      '......KrrK......' ] },
    excited: { name: '두근',   y: 11, rows: [
      '..R.R......R.R..',
      '..RRR......RRR..',
      'p..R........R..p',
      '......K..K......',
      '.......KK.......' ] },
    calm:    { name: '포근',   y: 11, rows: [
      '..K.K......K.K..',
      '...K........K...',
      '.pp..........pp.',
      '......K..K......',
      '.......KK.......' ] },
    tired:   { name: '하품',   y: 11, rows: [
      '..KKK......KKK..',
      '...K........K...',
      '..bbb......bbb..',
      '.......KK.......',
      '......K..K......',
      '.......KK.......' ] },
    sad:     { name: '울먹',   y: 9, rows: [
      '....K......K....',
      '..KK........KK..',
      '...K........K...',
      '...K........K...',
      '...T............',
      '...T...KK.......',
      '......K..K......' ] },
    angry:   { name: '부글',   y: 10, rows: [
      '..KK........KK..',
      '....K......K....',
      '...KK......KK...',
      'X..KK......KK..X',
      '................',
      '......KKKK......',
      '.....K....K.....' ] },
    blank:   { name: '멍',     y: 11, rows: [
      '..KKK......KKK..',
      '..KWK......KWK..',
      '..KKK......KKK..',
      '................',
      '......KKKK......' ] },
  };

  // ── 헤어 ─────────────────────────────────────────────────
  const DOME = [ // y3..y8 공통 돔
    '.........KKHHHHHHHHHHKK.........',
    '........KHHHHLLHHHHHHHHK........',
    '.......KHHHLLHHHHHHHHHhhK.......',
    '......KHHHHHHHHHHHHHHHHhhK......',
    '......KHHHHHHHHHHHHHHHHHhK......',
    '......KHHHHHHHHHHHHHHHHHHK......',
  ];
  const BANGS = [ // y9..y10 기본 앞머리
    '......KHHKKHHHKKKKHHHKKHHK......',
    '......KHHK.KKK....KKK.KHHK......',
  ];
  const SIDE = '......KhHK............KHhK......';
  const SIDE_END = '......KKKK............KKKK......';
  const repeat = (row, n) => Array.from({ length: n }, () => row);

  const TAIL_L = [ // 양갈래 왼쪽 꼬리 (x=0, y=7), 오른쪽은 좌우 반전
    '....KK.', '...KYY.', '..KHYY.', '.KHHHH.', 'KHLHHH.',
    'KHHHhH.', 'KHHhhK.', '.KHhK..', '.KHhK..', '..KK...',
  ];

  const HAIRS = {
    bob:   { name: '단발', front: [{ x: 0, y: 2, rows: [
      '...........KKKKKKKKKK...........', ...DOME, ...BANGS, ...repeat(SIDE, 5), SIDE_END ] }] },
    long:  { name: '긴 생머리',
      back:  [{ x: 0, y: 16, rows: repeat('......KhhhhhhhhhhhhhhhhhhK......', 4) }],
      front: [{ x: 0, y: 2, rows: [
        '...........KKKKKKKKKK...........', ...DOME, ...BANGS, ...repeat(SIDE, 11), SIDE_END ] }] },
    bun:   { name: '똥머리', front: [{ x: 0, y: 0, rows: [
      '.............KKKKKK.............',
      '............KHHLHHhK............',
      '...........KKHHHHHhKK...........',
      ...DOME,
      '......KHHHHHHHHKKKKKKKKHHK......',
      '......KHHHKKKKK.......KHHK......',
      '......KHHK............KHhK......',
      SIDE,
      '.......KKK............KKK.......' ] }] },
    short: { name: '숏컷', front: [{ x: 0, y: 1, rows: [
      '...........KK...KK...KK.........',
      '..........KHHK.KHHK.KHHK........',
      '.........KHHHHKHHHHKHHHHK.......',
      '.......KHHHLLHHHHHHHHHHHK.......',
      ...DOME.slice(2),
      '......KHHHKHHKKKKHHKKKKHHK......',
      '......KHHK.KK....KK...KHHK......',
      '.......KKK............KKK.......' ] }] },
    twin:  { name: '양갈래', front: [
      { x: 0, y: 2, rows: [
        '...........KKKKKKKKKK...........', ...DOME, ...BANGS, SIDE, SIDE, SIDE_END ] },
      { x: 0, y: 7, rows: TAIL_L },
      { x: 25, y: 7, rows: TAIL_L, mirror: true },
    ] },
  };

  // ── 옷 ───────────────────────────────────────────────────
  const OUTFITS = {
    hoodie: { name: '후드티', y: 18, rows: [
      '............KOK..KOK............',
      '..........KKKKKKKKKKKK..........',
      '.........KOOOOAOOAOOOOK.........',
      '........KOOKOOAOOAOOKOOK........',
      '........KOOKOOOOOOOOKOOK........',
      '........KOOKOKKKKKKOKOOK........',
      '........KooKOKooooKOKooK........',
      '........KssKooooooooKssK........',
      '.........KKKnnnnnnnnKKK.........',
      '...........KnnnKKnnnK...........',
      '...........KnnnKKnnnK...........',
      '...........KnnnKKnnnK...........' ] },
    stripe: { name: '줄무늬 티', y: 19, rows: [
      '..........KKKKKKKKKKKK..........',
      '.........KOOOOOOOOOOOOK.........',
      '........KAAKAAAAAAAAKAAK........',
      '........KOOKOOOOOOOOKOOK........',
      '...........KAAAAAAAAK...........',
      '...........KOOOOOOOOK...........',
      '...........KAAAAAAAAK...........',
      '.........KKKnnnnnnnnKKK.........',
      '...........KnnnKKnnnK...........' ] },
    dress:  { name: '원피스', y: 19, rows: [
      '..........KKKKKKKKKKKK..........',
      '.........KOOOOAAAAOOOOK.........',
      '........KOOKOOOOOOOOKOOK........',
      '...........KOOOOOOOOK...........',
      '...........KAAAAAAAAK...........',
      '...........KOOOOOOOOK...........',
      '...........KOOOOOOOOK...........',
      '.........KOOOOOOOOOOOOK.........',
      '........KooooooooooooooK........',
      '........KKKKKKKKKKKKKKKK........' ] },
    overall: { name: '멜빵바지', y: 19, rows: [
      '..........KKKKKKKKKKKK..........',
      '.........KWWOWWWWWWOWWK.........',
      '........KWWKOWWWWWWOKWWK........',
      '...........KOAOOOOAOK...........',
      '...........KOOKKKKOOK...........',
      '...........KOOKooKOOK...........',
      '...........KOOKKKKOOK...........',
      '.........KKKOOOOOOOOKKK.........',
      '...........KoooKKoooK...........' ] },
    pajama: { name: '잠옷', y: 19, rows: [
      '..........KKKKKKKKKKKK..........',
      '.........KOOOAAOOAAOOOK.........',
      '........KOAKOOOAOOOOKAOK........',
      '........KOOKOAOOOOAOKOOK........',
      '........KAOKOOOAOOOOKOAK........',
      '........KooKOAOOOOAOKooK........',
      '........KssKooooooooKssK........',
      '.........KKKOOOOOOOOKKK.........',
      '...........KOAOKKOAOK...........',
      '...........KOOOKKOOOK...........',
      '...........KoooKKoooK...........' ] },
  };

  // ── 신발 ─────────────────────────────────────────────────
  const SHOES = {
    sneakers: { name: '운동화', y: 29, rows: [
      '...........KQWQKKQWQK...........',
      '..........KQQQQKKQQQQK..........',
      '..........KWWWWKKWWWWK..........',
      '..........KKKKKKKKKKKK..........' ] },
    boots:    { name: '장화', y: 27, rows: [
      '...........KYYYKKYYYK...........',
      '...........KyYYKKyYYK...........',
      '...........KYYYKKYYYK...........',
      '..........KYYYYKKYYYYK..........',
      '..........KYYYYKKYYYYK..........',
      '..........KKKKKKKKKKKK..........' ] },
    maryjane: { name: '메리제인', y: 29, rows: [
      '...........KWWWKKWWWK...........',
      '..........KkKkkKKkkKkK..........',
      '..........KkkkkKKkkkkK..........',
      '..........KKKKKKKKKKKK..........' ] },
    slipper:  { name: '털슬리퍼', y: 29, rows: [
      '...........KFFFKKFFFK...........',
      '.........KFfFFFKKFFFfFK.........',
      '.........KFFFFFKKFFFFFK.........',
      '.........KKKKKKKKKKKKKK.........' ] },
  };

  // ── 악세서리 ─────────────────────────────────────────────
  const BEANIE_RIB = '.....K' + 'vV'.repeat(10) + 'K.....';
  const ACCS = {
    none:   { name: '없음', parts: [] },
    bow:    { name: '리본', parts: [{ x: 18, y: 1, rows: [
      '.KK...KK.', 'KRRK.KRRK', 'KRRRKRRRK', 'KRRK.KRRK', '.KK...KK.' ] }] },
    glasses:{ name: '동그란 안경', parts: [{ x: 8, y: 10, rows: [
      '..KKK......KKK..', '.K...K....K...K.', 'KK...KKKKKK...KK', '..KKK......KKK..' ] }] },
    phones: { name: '헤드폰', parts: [{ x: 0, y: 1, rows: [
      '..........KKKKKKKKKKKK..........',
      '........KKPPPPPPPPPPPPKK........',
      '.......KPPKKKKKKKKKKKKPPK.......',
      ...repeat('......KPPK............KPPK......', 4),
      '....KKKKKK............KKKKKK....',
      '....KPZPPK............KPPZPK....',
      ...repeat('....KPPPPK............KPPPPK....', 3),
      '....KKKKKK............KKKKKK....' ] }] },
    beanie: { name: '비니', parts: [{ x: 0, y: 0, rows: [
      '..............KKKK..............',
      '.............KWWWWK.............',
      '..........KKKKWWWWKKKK..........',
      '........KKVVVVVVVVVVVVKK........',
      '.......KVVVVVVVVVVVVVVVVK.......',
      '......KVVVVVVVVVVVVVVVVVVK......',
      '......KVVVVVVVVVVVVVVVVVVK......',
      BEANIE_RIB, BEANIE_RIB,
      '.....KKKKKKKKKKKKKKKKKKKKKK.....' ] }] },
    sprout: { name: '새싹', parts: [{ x: 13, y: 0, rows: [
      '.KK.KK.', 'KGGKGGK', '.KKgKK.', '...g...' ] }] },
  };

  // ── 기분 ─────────────────────────────────────────────────
  // rec: 기분별 추천 아이템 (에디터의 '추천' 뱃지)
  const MOODS = {
    happy:   { label: '행복해요', color: '#FFD23F', soft: '#FFF0B3', face: 'happy',   bg: 'sky',
               rec: { hair: ['bob', 'bun'], outfit: ['stripe', 'overall'], shoes: ['sneakers'], acc: ['sprout'], bg: ['sky', 'flowers'] } },
    excited: { label: '설레요',   color: '#FF7EB6', soft: '#FFD6E8', face: 'excited', bg: 'flowers',
               rec: { hair: ['twin', 'long'], outfit: ['dress'], shoes: ['maryjane'], acc: ['bow'], bg: ['flowers', 'sunset'] } },
    calm:    { label: '평온해요', color: '#7ED9C3', soft: '#D3F4EA', face: 'calm',    bg: 'room',
               rec: { hair: ['long', 'bun'], outfit: ['overall'], shoes: ['sneakers'], acc: ['sprout', 'glasses'], bg: ['room', 'sky'] } },
    tired:   { label: '피곤해요', color: '#B8A7E8', soft: '#E6DFFA', face: 'tired',   bg: 'night',
               rec: { hair: ['bun', 'short'], outfit: ['pajama', 'hoodie'], shoes: ['slipper'], acc: ['beanie'], bg: ['night', 'room'] } },
    sad:     { label: '우울해요', color: '#7AA7FF', soft: '#D6E4FF', face: 'sad',     bg: 'rain',
               rec: { hair: ['long', 'short'], outfit: ['hoodie'], shoes: ['boots'], acc: ['phones'], bg: ['rain', 'night'] } },
    angry:   { label: '화나요',   color: '#FF6B57', soft: '#FFD5CE', face: 'angry',   bg: 'sunset',
               rec: { hair: ['short'], outfit: ['hoodie'], shoes: ['sneakers'], acc: ['phones'], bg: ['sunset', 'checker'] } },
    blank:   { label: '멍해요',   color: '#C9CDD6', soft: '#EEF0F3', face: 'blank',   bg: 'checker',
               rec: { hair: ['bob'], outfit: ['stripe'], shoes: ['slipper'], acc: ['glasses'], bg: ['checker', 'sky'] } },
  };

  // ── 배경 (48×48 절차적 생성) ───────────────────────────────
  const SPRITES = {
    cloud: ['...WWW.....', '.WWWWWWWW..', 'WWWWWWWWWWW', '.ccccccccc.'],
    sun:   ['..YYYY..', '.YYYYYY.', 'YYYYYYYY', 'YYYYYYYY', '.YYYYYY.', '..YYYY..'],
    moon:  ['..WWW.', '.WWW..', 'WWW...', 'WWW...', '.WWW..', '..WWW.'],
    star:  ['.Y.', 'YWY', '.Y.'],
    flower:['.R.', 'RYR', '.R.'],
  };

  function rng(seed) {
    let s = seed >>> 0;
    return () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296;
  }
  function fillRows(g, y0, y1, color) {
    for (let y = y0; y <= y1; y++) for (let x = 0; x < STAGE; x++) g[y][x] = color;
  }
  function stamp(g, x0, y0, rows, pal) {
    rows.forEach((row, dy) => [...row].forEach((ch, dx) => {
      const c = pal[ch];
      const x = x0 + dx, y = y0 + dy;
      if (c && y >= 0 && y < g.length && x >= 0 && x < g[0].length) g[y][x] = c;
    }));
  }
  const GROUND = 40; // 발끝(y=40) 바로 아래부터 땅

  const BGS = {
    sky: { name: '맑은 하늘', draw(g) {
      fillRows(g, 0, 9, '#8FD3FF'); fillRows(g, 10, 21, '#A6DDFF');
      fillRows(g, 22, 31, '#BFE7FF'); fillRows(g, 32, GROUND - 1, '#D8F1FF');
      stamp(g, 36, 4, SPRITES.sun, { Y: '#FFE07A' });
      const cl = { W: '#FFFFFF', c: '#E1F1FF' };
      stamp(g, 3, 7, SPRITES.cloud, cl); stamp(g, 27, 16, SPRITES.cloud, cl); stamp(g, 6, 24, SPRITES.cloud, cl);
      fillRows(g, GROUND, GROUND, '#6CC07A'); fillRows(g, GROUND + 1, STAGE - 1, '#8FD694');
      [3, 11, 37, 44].forEach(x => { g[GROUND - 1][x] = '#6CC07A'; g[GROUND - 1][x + 2] = '#6CC07A'; });
    } },
    flowers: { name: '꽃밭', draw(g) {
      fillRows(g, 0, 13, '#FFD9E8'); fillRows(g, 14, 25, '#FFE5EF'); fillRows(g, 26, GROUND - 5, '#FFF0F5');
      fillRows(g, GROUND - 4, STAGE - 1, '#A5E3A1'); fillRows(g, GROUND - 4, GROUND - 4, '#7FCB86');
      const r = rng(7);
      for (let i = 0; i < 9; i++) {
        const x = Math.floor(r() * 44), y = GROUND - 3 + Math.floor(r() * 6);
        const c = ['#FF7EB6', '#FFFFFF', '#FFB86B'][i % 3];
        stamp(g, x, y, SPRITES.flower, { R: c, Y: '#FFE07A' });
      }
      const h = { R: '#FF9EC4' };
      stamp(g, 6, 6, ['.R.R.', 'RRRRR', '.RRR.', '..R..'], h);
      stamp(g, 38, 12, ['R.R', 'RRR', '.R.'], h);
      stamp(g, 31, 4, ['R.R', 'RRR', '.R.'], { R: '#FFB3D1' });
    } },
    room: { name: '내 방', draw(g) {
      fillRows(g, 0, GROUND - 2, '#FFE8D6');
      for (let y = 2; y < GROUND - 2; y += 6) for (let x = (y / 6) % 2 ? 1 : 4; x < STAGE; x += 6) g[y][x] = '#FFD3B8';
      // 창문
      for (let y = 5; y <= 18; y++) for (let x = 4; x <= 19; x++) {
        const edge = y === 5 || y === 18 || x === 4 || x === 19 || x === 11 || x === 12 || y === 11;
        g[y][x] = edge ? '#FFFFFF' : (y < 11 ? '#A6DDFF' : '#C4E8FF');
      }
      for (let x = 3; x <= 20; x++) g[19][x] = '#E3B892';
      // 액자
      for (let y = 9; y <= 16; y++) for (let x = 33; x <= 41; x++) {
        const edge = y === 9 || y === 16 || x === 33 || x === 41;
        g[y][x] = edge ? '#C98A5B' : (y > 13 ? '#7FCB86' : '#FFF6C8');
      }
      fillRows(g, GROUND - 1, GROUND - 1, '#FFFFFF');
      fillRows(g, GROUND, STAGE - 1, '#E0AE7E');
      for (let y = GROUND + 2; y < STAGE; y += 3) for (let x = 0; x < STAGE; x++) g[y][x] = '#CC9566';
    } },
    night: { name: '밤하늘', draw(g) {
      fillRows(g, 0, 11, '#1F1B45'); fillRows(g, 12, 23, '#28235A'); fillRows(g, 24, GROUND - 1, '#332D6E');
      stamp(g, 37, 4, SPRITES.moon, { W: '#FFF1A8' });
      const r = rng(11);
      for (let i = 0; i < 16; i++) {
        const x = Math.floor(r() * 46), y = Math.floor(r() * 30);
        if (i % 4 === 0) stamp(g, x, y, SPRITES.star, { Y: '#FFE07A', W: '#FFFFFF' });
        else g[y][x] = i % 2 ? '#FFFFFF' : '#C9C1FF';
      }
      fillRows(g, GROUND, STAGE - 1, '#241F4A'); fillRows(g, GROUND, GROUND, '#3E3880');
    } },
    rain: { name: '비 오는 날', draw(g) {
      fillRows(g, 0, 13, '#7F93B5'); fillRows(g, 14, 27, '#8DA0C0'); fillRows(g, 28, GROUND - 1, '#9DAFCB');
      const cl = { W: '#B9C6DC', c: '#A3B3CF' };
      stamp(g, 2, 3, SPRITES.cloud, cl); stamp(g, 30, 6, SPRITES.cloud, cl);
      const r = rng(5);
      for (let i = 0; i < 26; i++) {
        const x = Math.floor(r() * 48), y = 10 + Math.floor(r() * 26);
        if (y + 1 < GROUND) { g[y][x] = '#D6E4FF'; g[y + 1][x] = '#D6E4FF'; }
      }
      fillRows(g, GROUND, STAGE - 1, '#5E6F8F');
      for (let x = 4; x < 16; x++) g[GROUND + 3][x] = '#9FB4D6';
      for (let x = 32; x < 44; x++) g[GROUND + 5][x] = '#9FB4D6';
    } },
    sunset: { name: '노을', draw(g) {
      const bands = ['#6B5BA8', '#8E63AE', '#B86BAA', '#E07AA0', '#FF9686', '#FFB98A'];
      bands.forEach((c, i) => fillRows(g, i * 6, i * 6 + 5, c));
      fillRows(g, 36, GROUND - 1, '#FFD49A');
      stamp(g, 30, 30, ['....YYYY....', '..YYYYYYYY..', '.YYYYYYYYYY.', 'YYYYYYYYYYYY', 'YYYYYYYYYYYY', 'YYYYYYYYYYYY'], { Y: '#FFE9A8' });
      fillRows(g, GROUND, STAGE - 1, '#4E3F7A'); fillRows(g, GROUND, GROUND, '#3B2F63');
      for (let x = 30; x < 42; x += 2) g[GROUND + 3][x] = '#FFB98A';
    } },
    checker: { name: '기분 컬러', draw(g, look) {
      const m = MOODS[look.mood] || MOODS.blank;
      for (let y = 0; y < STAGE; y++) for (let x = 0; x < STAGE; x++)
        g[y][x] = ((x >> 2) + (y >> 2)) % 2 ? m.color : m.soft;
    } },
  };

  const LAYERS = ['bg', 'shadow', 'hairBack', 'base', 'outfit', 'shoes', 'face', 'hairFront', 'acc'];

  const DEFAULT = {
    mood: 'happy', hair: 'bob', hairColor: 'brown', skin: 'light', face: null,
    outfit: 'hoodie', outfitColor: 'pink', shoes: 'sneakers', acc: 'none', bg: null,
  };

  function palette(look) {
    return Object.assign({}, FIXED, SKINS[look.skin], HAIR_COLORS[look.hairColor], OUTFIT_COLORS[look.outfitColor]);
  }

  function drawPart(g, part, pal, ox, oy) {
    const rows = part.mirror ? part.rows.map(r => [...r].reverse().join('')) : part.rows;
    stamp(g, ox + (part.x || 0), oy + part.y, rows, pal);
  }

  // look → 색 그리드. withBg=false면 캐릭터만 (32×34)
  function compose(lookIn, opts) {
    opts = opts || {};
    const look = Object.assign({}, DEFAULT, lookIn);
    const S = styleOf(look.style);
    const { HAIRS, BASE, OUTFITS, SHOES, FACES, ACCS } = S;
    const mood = MOODS[look.mood] || MOODS.happy;
    look.face = look.face || mood.face;
    look.bg = look.bg || mood.bg;
    const withBg = opts.bg !== false && look.bg !== 'none';
    const w = withBg ? STAGE : S.CW, h = withBg ? STAGE : S.CH;
    const ox = withBg ? S.OX : 0, oy = withBg ? S.OY : 0;
    const g = Array.from({ length: h }, () => Array(w).fill(null));
    const pal = Object.assign(palette(look), S.FIXED);
    const upto = opts.upto == null ? LAYERS.length : opts.upto;
    // only: ['outfit'] 처럼 특정 레이어만 그리기 (아이템 썸네일용)
    const on = name => opts.only ? opts.only.includes(name) : LAYERS.indexOf(name) < upto;

    if (withBg && on('bg')) BGS[look.bg].draw(g, look);
    if (withBg && on('shadow')) {
      const sh = 'rgba(43,33,64,0.22)';
      for (let x = ox + 9; x <= ox + 22; x++) g[oy + S.shadowY][x] = sh;
      for (let x = ox + 11; x <= ox + 20; x++) g[oy + S.shadowY + 1][x] = sh;
    }
    const hair = HAIRS[look.hair];
    if (on('hairBack')) (hair.back || []).forEach(p => drawPart(g, p, pal, ox, oy));
    if (on('base')) drawPart(g, BASE, pal, ox, oy);
    if (on('outfit')) drawPart(g, OUTFITS[look.outfit], pal, ox, oy);
    if (on('shoes')) drawPart(g, SHOES[look.shoes], pal, ox, oy);
    if (on('face')) drawPart(g, Object.assign({ x: S.faceX }, FACES[look.face]), pal, ox, oy);
    if (on('hairFront')) hair.front.forEach(p => drawPart(g, p, pal, ox, oy));
    if (on('acc')) ACCS[look.acc].parts.forEach(p => drawPart(g, p, pal, ox, oy));
    return g;
  }

  // 그리드 → SVG (가로로 같은 색이 이어지면 rect 하나로 합침)
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

  // 크롭 프리셋 (스테이지 좌표 / 캐릭터 좌표)
  const CROPS = {
    stage: [0, 0, 48, 48],
    head:  [OX + 2, OY - 1, 28, 28],
    body:  [OX + 3, OY + 12, 26, 26],
    feet:  [OX + 6, OY + 20, 20, 20],
    char:  [0, 0, CW, CH],
    charHead: [2, 0, 28, 24],
    charBody: [6, 17, 20, 14],   // 옷만 그릴 때
    charFeet: [8, 26, 16, 8],    // 신발만 그릴 때
  };

  // ── 캐릭터 스타일 (A안 기본, B안은 pixel-avatar-b.js 가 등록) ──
  // 같은 키(bob, happy, hoodie…)로 파츠를 맞추면 에디터·기분 데이터를 그대로 공유한다.
  const STYLES = {
    a: { CW, CH, OX, OY, shadowY: 32, faceX: 8, FIXED: {}, CROPS,
         BASE, FACES, HAIRS, OUTFITS, SHOES, ACCS },
  };
  function styleOf(id) { return STYLES[id] || STYLES.a; }
  function registerStyle(id, s) { STYLES[id] = s; }
  function cropsFor(id) { return styleOf(id).CROPS; }

  function readLook(el) {
    const d = el.dataset;
    const look = {};
    ['style', 'mood', 'hair', 'hairColor', 'skin', 'face', 'outfit', 'outfitColor', 'shoes', 'acc', 'bg'].forEach(k => {
      if (d[k]) look[k] = d[k];
    });
    return look;
  }

  function render(el, lookOverride) {
    const look = lookOverride || readLook(el);
    const noBg = el.dataset.bg === 'none';
    const g = compose(look, { bg: !noBg, upto: el.dataset.upto ? Number(el.dataset.upto) : undefined });
    const crop = cropsFor(look.style)[el.dataset.crop || (noBg ? 'char' : 'stage')];
    el.innerHTML = toSVG(g, crop, el.dataset.label);
    sizeTo(el, crop[2], crop[3]);
  }

  // data-scale="4" → 픽셀 1칸을 4px로 (정수 배율이라 픽셀이 뭉개지지 않음)
  function sizeTo(el, w, h) {
    const s = Number(el.dataset.scale);
    if (!s) return;
    el.style.width = w * s + 'px';
    el.style.height = h * s + 'px';
  }

  // ── 아이콘 (10×10, C = 지정색) ─────────────────────────────
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

  function renderIcon(el) {
    const rows = ICONS[el.dataset.icon];
    if (!rows) return;
    const w = Math.max(...rows.map(r => r.length)), h = rows.length;
    const ink = el.dataset.ink || FIXED.K;
    const pal = { K: ink, C: el.dataset.c || '#FFFFFF', W: '#FFFFFF', Y: '#FFE07A', G: '#7BD389' };
    const g = Array.from({ length: h }, () => Array(w).fill(null));
    stamp(g, 0, 0, rows, pal);
    el.innerHTML = toSVG(g);
    sizeTo(el, w, h);
  }

  function renderAll(root) {
    (root || document).querySelectorAll('[data-px]').forEach(el => render(el));
    (root || document).querySelectorAll('[data-icon]').forEach(renderIcon);
  }

  global.PixelAvatar = {
    CW, CH, STAGE, LAYERS, FIXED, SKINS, HAIR_COLORS, OUTFIT_COLORS,
    HAIRS, FACES, OUTFITS, SHOES, ACCS, BGS, MOODS, ICONS, DEFAULT, CROPS, STYLES,
    compose, toSVG, render, renderIcon, renderAll, readLook, registerStyle, cropsFor,
  };
})(typeof window !== 'undefined' ? window : globalThis);
