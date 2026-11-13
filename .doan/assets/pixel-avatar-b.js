/*
 * your mind — B안 캐릭터 (SD 아바타 비율, 시안용 · 아직 앱 코드 아님)
 *
 * A안과 같은 키로 파츠를 정의해서 PixelAvatar 에 style 'b' 로 등록한다.
 * 그리드 32×36. A안 대비 바뀐 점:
 *   - 머리+헤어가 전체 높이의 약 62% (A안 약 52%)
 *   - 목 없음: 턱 바로 아래에서 옷이 시작
 *   - 눈: 3×4 큰 눈동자 + 하이라이트, 얼굴 아래쪽에 넓은 간격 / 입은 2px
 *   - 헤어가 두상보다 3~4px 더 커서 실루엣이 개성을 만든다
 *   - 몸통 6px, 짧은 원통형 팔다리
 * 특정 게임의 그림체를 따라 그리지 않은 오리지널 SD 비율이며, 시점은 A안과 같은 정면.
 */
(function (PA) {
  'use strict';
  if (!PA) return;

  const DY = 2; // 똥머리·비니 꼭대기를 위해 아래로 2칸 내려 그린다 (설계 y + 2 = 실제 y)
  const at = (y, rows, x) => ({ x: x || 0, y: y + DY, rows });
  const rep = (row, n) => Array.from({ length: n }, () => row);

  // ── 기본 몸 (설계 y3~y33) ─────────────────────────────────
  const HEAD = '......KSSSSSSSSSSSSSSSSSSK......';
  const ARM = '........KSSKSSSSSSSSKSSK........';
  const LEG = '...........KSSSKKSSSK...........';
  const BASE = at(3, [
    '..........KKKKKKKKKKKK..........',
    '........KKSSSSSSSSSSSSKK........',
    '.......KSSSSSSSSSSSSSSSSK.......',
    ...rep(HEAD, 12),
    '.......KSSSSSSSSSSSSSSSSK.......',
    '........KKSSSSSSSSSSSSKK........',
    '..........KKKKKKKKKKKK..........',
    '.........KKSSSSSSSSSSKK.........',   // 목 없이 바로 어깨
    ARM, ARM,
    '........KssKSSSSSSSSKssK........',
    '.........KKKSSSSSSSSKKK.........',
    '...........KSSSSSSSSK...........',
    ...rep(LEG, 6),
    '...........KKKKKKKKKK...........',
  ]);

  // ── 표정 (x=7, 18칸) ─────────────────────────────────────
  const F = (name, y, rows) => ({ name, y: y + DY, rows });
  const FACES = {
    happy:   F('방긋', 15, [
      '...K..........K...',
      '..K.K........K.K..',
      '.pp............pp.',
      '........KK........',
      '........mm........' ]),
    excited: F('두근', 14, [
      '..R.R........R.R..',
      '..RRR........RRR..',
      '...R..........R...',
      '.pp............pp.',
      '........KK........',
      '........mm........' ]),
    calm:    F('포근', 14, [
      '..KKK........KKK..',
      '..EWE........EWE..',
      '..EEE........EEE..',
      '...E..........E...',
      '.pp.....mm.....pp.' ]),
    tired:   F('하품', 15, [
      '..KKK........KKK..',
      '..EEE........EEE..',
      '..bbb........bbb..',
      '........KK........' ]),
    sad:     F('울먹', 12, [
      '....K........K....',
      '..KK..........KK..',
      '..KKK........KKK..',
      '..EWW........EWW..',
      '..EEE........EEE..',
      '...E..........E...',
      '...T....KK........',
      '...T...K..K.......' ]),
    angry:   F('부글', 13, [
      '..K............K..',
      '...KK........KK...',
      '..KKK........KKK..',
      '..EEE........EEE..',
      'X..E..........E..X',
      '........KK........',
      '.......K..K.......' ]),
    blank:   F('멍', 15, [
      '...K..........K...',
      '...K..........K...',
      '..................',
      '........KK........' ]),
  };

  // ── 헤어: 두상보다 큰 돔 ─────────────────────────────────
  const DOME = [ // 설계 y0~y10
    '..........KKKKKKKKKKKK..........',
    '.......KKKHHHHHHHHHHHHKKK.......',
    '.....KKHHHHLLLLHHHHHHHHHHKK.....',
    '....KHHHLLLLHHHHHHHHHHHHHHhK....',
    '...KHHHLLHHHHHHHHHHHHHHHHHhhK...',
    '...KHHHHHHHHHHHHHHHHHHHHHHhhK...',
    '..KHHHHHHHHHHHHHHHHHHHHHHHHhhK..',
    '..KHHHHHHHHHHHHHHHHHHHHHHHHhhK..',
    '..KHHHHHHHHHHHHHHHHHHHHHHHHHhK..',
    '..KHHHHHHHHHHHHHHHHHHHHHHHHHhK..',
    '..KhHHHHHHHHHHHHHHHHHHHHHHHHhK..',
  ];
  const BANGS = [ // 설계 y11~y13, 뭉툭한 앞머리 세 덩어리
    '..KHHHKHHHHKKHHHHHHKKHHHHKHHhK..',
    '..KHHHKHHKK..KHHHHK..KKHHKHHhK..',
    '..KHHHKKK.....KKKK.....KKKHHhK..',
  ];
  const SIDE = '..KHHhK..................KhHHK..';
  const TAPER = '...KHhK..................KhHK...';
  const END = '...KKKK..................KKKK...';
  const TAIL = [ // 양갈래 왼쪽 (x=0, 설계 y14), 오른쪽은 좌우 반전
    '..KYYYK', '.KHHHHK', 'KHLHHHK', 'KHHHHhK', 'KHHHHhK', 'KHHHhhK',
    '.KHHhK.', '.KHHhK.', '.KHHhK.', '..KHhK.', '..KHhK.', '...KK..',
  ];

  const HAIRS = {
    bob:   { name: '단발', front: [at(0, [...DOME, ...BANGS, ...rep(SIDE, 5), TAPER, END])] },
    long:  { name: '긴 생머리',
      back:  [at(18, [...rep('..KHHHHHHHHHHHHHHHHHHHHHHHHHhK..', 8),
                      '...KhhhhhhhhhhhhhhhhhhhhhhhhK...',
                      '....KKKKKKKKKKKKKKKKKKKKKKKK....'])],
      front: [at(0, [...DOME, ...BANGS, ...rep(SIDE, 8)])] },
    bun:   { name: '똥머리', front: [at(-2, [
      '............KKKKKKKK............',
      '...........KHHLLHHHHK...........',
      '..........KKHHHHHHhhKK..........',
      ...DOME.slice(1), ...BANGS, ...rep(SIDE, 3), END ])] },
    short: { name: '숏컷', front: [at(-2, [
      '.........KK....KK.....KK........',
      '........KHHK..KHHK...KHHK.......',
      '.......KHHHHKKHHHHKKKHHHHK......',
      '......KHHHHHHHHHHHHHHHHHHK......',
      ...DOME.slice(2), ...BANGS, ...rep(SIDE, 2), END ])] },
    twin:  { name: '양갈래', front: [
      at(0, [...DOME, ...BANGS]),
      at(14, TAIL, 0),
      Object.assign(at(14, TAIL, 25), { mirror: true }),
    ] },
  };

  // ── 옷 (작은 몸통, 설계 y21~) ─────────────────────────────
  const O = (name, rows) => ({ name, y: 21 + DY, rows });
  const OUTFITS = {
    hoodie: O('후드티', [
      '.........KKOOOOOOOOOOKK.........',
      '........KOOKOOAOOAOOKOOK........',
      '........KOOKOOOOOOOOKOOK........',
      '........KssKooooooooKssK........',
      '.........KKKnnnnnnnnKKK.........',
      '...........KnnnnnnnnK...........',
      ...rep('...........KnnnKKnnnK...........', 3) ]),
    stripe: O('줄무늬 티', [
      '.........KKOOOOOOOOOOKK.........',
      '........KAAKAAAAAAAAKAAK........',
      '...........KOOOOOOOOK...........',
      '...........KAAAAAAAAK...........',
      '...........KOOOOOOOOK...........',
      '...........KnnnnnnnnK...........',
      '...........KnnnKKnnnK...........' ]),
    dress: O('원피스', [
      '.........KKOOOAAAAOOOKK.........',
      '........KOOKOOOOOOOOKOOK........',
      '...........KAAAAAAAAK...........',
      '...........KOOOOOOOOK...........',
      '.........KOOOOOOOOOOOOK.........',
      '........KooooooooooooooK........',
      '........KKKKKKKKKKKKKKKK........' ]),
    overall: O('멜빵바지', [
      '.........KKWWOWWWWOWWKK.........',
      '........KWWKWOOOOOOWKWWK........',
      '...........KOOAOOAOOK...........',
      '...........KOOKKKKOOK...........',
      '...........KOOOOOOOOK...........',
      '...........KOOOOOOOOK...........',
      '...........KoooKKoooK...........' ]),
    pajama: O('잠옷', [
      '.........KKOOOAOOAOOOKK.........',
      '........KOAKOOAOOOOOKAOK........',
      '........KOOKOOOOOAOOKOOK........',
      '........KssKoAooooAoKssK........',
      '.........KKKOOOAOOOOKKK.........',
      '...........KOAOOOOAOK...........',
      '...........KOOOKKOAOK...........',
      '...........KOAOKKOOOK...........',
      '...........KoooKKoooK...........' ]),
  };

  // ── 신발: A안 그림 그대로, 다리가 길어진 만큼 3칸 아래로 ──
  const SHOES = {};
  Object.entries(PA.SHOES).forEach(([k, v]) => { SHOES[k] = Object.assign({}, v, { y: v.y + 3 }); });

  // ── 악세서리 (큰 머리에 맞춰 다시 배치) ────────────────────
  const BEANIE_RIB = '.K' + 'vV'.repeat(14) + 'K.';
  const ACCS = {
    none:    { name: '없음', parts: [] },
    bow:     { name: '리본', parts: [at(-1, PA.ACCS.bow.parts[0].rows, 21)] },
    glasses: { name: '동그란 안경', parts: [at(13, [
      '..KKK........KKK..',
      '.K...K......K...K.',
      'KK...KKKKKKKK...KK',
      '.K...K......K...K.',
      '.K...K......K...K.',
      '..KKK........KKK..' ], 7)] },
    phones:  { name: '헤드폰', parts: [at(-1, [
      '..........KKKKKKKKKKKK..........',
      '........KKPPPPPPPPPPPPKK........',
      '.......KPPKKKKKKKKKKKKPPK.......',
      '......KPPK............KPPK......',
      '.....KPPK..............KPPK.....',
      '....KPPK................KPPK....',
      '...KPPK..................KPPK...',
      ...rep('..KPPK....................KPPK..', 4),
      '.KKKKKK..................KKKKKK.',
      '.KPZPPK..................KPPZPK.',
      ...rep('.KPPPPK..................KPPPPK.', 4),
      '.KKKKKK..................KKKKKK.' ])] },
    beanie:  { name: '비니', parts: [at(-2, [
      '..............KKKK..............',
      '.............KWWWWK.............',
      '..........KKKKWWWWKKKK..........',
      '.......KKKVVVVVVVVVVVVKKK.......',
      '.....KKVVVVVVVVVVVVVVVVVVKK.....',
      '....KVVVVVVVVVVVVVVVVVVVVVVK....',
      '...KVVVVVVVVVVVVVVVVVVVVVVVVK...',
      '...KVVVVVVVVVVVVVVVVVVVVVVVVK...',
      '..KVVVVVVVVVVVVVVVVVVVVVVVVVVK..',
      '..KVVVVVVVVVVVVVVVVVVVVVVVVVVK..',
      BEANIE_RIB, BEANIE_RIB,
      '.KKKKKKKKKKKKKKKKKKKKKKKKKKKKKK.' ])] },
    sprout:  { name: '새싹', parts: [at(-2, PA.ACCS.sprout.parts[0].rows, 13)] },
  };

  const CW = 32, CH = 36, OX = 8, OY = 5; // 발끝이 스테이지 y40에 오도록
  PA.registerStyle('b', {
    CW, CH, OX, OY, shadowY: 35, faceX: 7,
    FIXED: { E: '#3B2F5C', e: '#7E6BC4', m: '#E0707A' },
    BASE, FACES, HAIRS, OUTFITS, SHOES, ACCS,
    CROPS: {
      stage: [0, 0, 48, 48],
      char: [0, 0, CW, CH],
      charHead: [2, 1, 28, 24],
      charBody: [6, 22, 20, 12],
      charFeet: [8, 29, 16, 8],
    },
  });
})(typeof window !== 'undefined' ? window.PixelAvatar : globalThis.PixelAvatar);
