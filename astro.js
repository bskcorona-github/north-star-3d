// astro.js — pure, dependency-free astronomy & math helpers + star data.
// No THREE.js, no DOM: everything here is unit-testable in plain Node.
// Vectors are plain {x, y, z}. The viewer (index.html) wraps these into THREE.Vector3.

// ---------------------------------------------------------------------------
// Coordinate conversion
// ---------------------------------------------------------------------------

// Celestial coords (RA in hours, Dec in degrees) -> point {x,y,z} on a sphere of
// radius D. Dec +90° maps to +Y (the pole), so everything pivots around the axis.
// (Returns a plain object; the viewer wraps it into a THREE.Vector3.)
export function raDecToXYZ(raHours, decDeg, D = 1) {
  const ra = raHours * 15 * Math.PI / 180;
  const dec = decDeg * Math.PI / 180;
  const h = D * Math.cos(dec);
  return { x: h * Math.cos(ra), y: D * Math.sin(dec), z: h * Math.sin(ra) };
}

export function length3(v) { return Math.hypot(v.x, v.y, v.z); }

// ---------------------------------------------------------------------------
// Star naming
// ---------------------------------------------------------------------------

export const GREEK = {
  alpha: 'α', beta: 'β', gamma: 'γ', delta: 'δ', epsilon: 'ε', eps: 'ε', zeta: 'ζ', eta: 'η',
  theta: 'θ', iota: 'ι', kappa: 'κ', lambda: 'λ', mu: 'μ', nu: 'ν', xi: 'ξ', pi: 'π',
  sigma: 'σ', tau: 'τ', upsilon: 'υ', phi: 'φ', chi: 'χ', psi: 'ψ', omega: 'ω'
};

export const PROPER = {
  dubhe: 'ドゥーベ', merak: 'メラク', phecda: 'フェクダ', megrez: 'メグレズ', alioth: 'アリオト', mizar: 'ミザール', alkaid: 'アルカイド',
  caph: 'カフ', schedar: 'シェダル', ruchbah: 'ルクバー', segin: 'セギン',
  betelgeuse: 'ベテルギウス', rigel: 'リゲル', bellatrix: 'ベラトリックス', saiph: 'サイフ', alnitak: 'アルニタク', alnilam: 'アルニラム', mintaka: 'ミンタカ',
  sirius: 'シリウス', mirzam: 'ミルザム', wezen: 'ウェズン', adhara: 'アダラ', aludra: 'アルドラ',
  procyon: 'プロキオン', gomeisa: 'ゴメイサ',
  castor: 'カストル', pollux: 'ポルックス', alhena: 'アルヘナ', wasat: 'ワサト', mebsuta: 'メブスタ', tejat: 'テジャト',
  aldebaran: 'アルデバラン', elnath: 'エルナト',
  regulus: 'レグルス', denebola: 'デネボラ',
  vega: 'ベガ（織姫）',
  altair: 'アルタイル（彦星）', tarazed: 'タラゼド', alshain: 'アルシャイン',
  deneb: 'デネブ', sadr: 'サドル', albireo: 'アルビレオ', gienah: 'ギェナー',
  antares: 'アンタレス',
  markab: 'マルカブ', scheat: 'シェアト', algenib: 'アルゲニブ', alpheratz: 'アルフェラッツ', enif: 'エニフ',
  eltanin: 'エルタニン', rastaban: 'ラスタバン', grumium: 'グルミウム', thuban: 'トゥバン',
  hamal: 'ハマル', sheratan: 'シェラタン', mesarthim: 'メサルティム', spica: 'スピカ', arcturus: 'アークトゥルス'
};

export const ABBR = {
  'おおぐま座（北斗七星）': 'UMa', 'カシオペヤ座': 'Cas', 'ケフェウス座': 'Cep', 'りゅう座': 'Dra', 'こぐま座': 'UMi',
  'オリオン座': 'Ori', 'おおいぬ座': 'CMa', 'こいぬ座': 'CMi', 'ふたご座': 'Gem', 'おうし座': 'Tau', 'しし座': 'Leo',
  'こと座': 'Lyr', 'わし座': 'Aql', 'はくちょう座': 'Cyg', 'さそり座': 'Sco', 'ペガスス座': 'Peg',
  'おひつじ座': 'Ari', 'かに座': 'Cnc', 'おとめ座': 'Vir', 'てんびん座': 'Lib', 'いて座（南斗）': 'Sgr',
  'やぎ座': 'Cap', 'みずがめ座': 'Aqr', 'うお座': 'Psc', 'うしかい座': 'Boo'
};

// Resolve a display name for a star: proper/Japanese name (+ Bayer designation when
// known), else Greek letter + constellation abbreviation, else the raw key.
export function starName(constName, key, names) {
  const greek = GREEK[key];
  const abbr = ABBR[constName] || constName;
  const proper = (names && names[key]) || PROPER[key];
  if (proper) return greek ? `${proper}（${greek} ${abbr}）` : proper;
  return greek ? `${greek} ${abbr}` : key;
}

// ---------------------------------------------------------------------------
// Search
// ---------------------------------------------------------------------------

// Find the best matching constellation name for a query (exact, then partial,
// tolerant of the trailing '座'). Returns the matched name or null.
export function searchMatch(query, names) {
  const q = (query || '').trim();
  if (!q) return null;
  if (names.includes(q)) return q;
  const key = q.replace('座', '');
  return names.find((n) => n.includes(q) || n.replace('座', '').includes(key)) || null;
}

// ---------------------------------------------------------------------------
// Observer / horizon geometry
// ---------------------------------------------------------------------------

// Altitude of the celestial pole above the horizon equals the observer's latitude.
export function poleAltitude(latDeg) { return latDeg; }

// A star is circumpolar (never sets) at latitude lat when dec > 90 - |lat|.
export function isCircumpolar(decDeg, latDeg) { return decDeg > 90 - Math.abs(latDeg); }

// Below the local horizon iff the local-up component is negative.
export function belowHorizon(localY) { return localY < 0; }

// Local "north on the ground" = the celestial axis (+Y) projected onto the tangent
// plane at `up`. Returns a unit vector. (up must be a unit vector.)
export function observerNorth(up) {
  const dotY = up.y;
  let nx = -dotY * up.x, ny = 1 - dotY * up.y, nz = -dotY * up.z;
  const nl = Math.hypot(nx, ny, nz) || 1;
  return { x: nx / nl, y: ny / nl, z: nz / nl };
}

// Given a target expressed in the observer's local frame (x=east, y=up, z=south),
// return the yaw/pitch that aims the camera (-Z = north) at it. Pitch is clamped.
export function aimYawPitch(v) {
  const len = Math.hypot(v.x, v.y, v.z) || 1;
  const pitch = Math.asin(Math.max(-1, Math.min(1, v.y / len)));
  return {
    yaw: Math.atan2(-v.x, -v.z),
    pitch: Math.max(-1.45, Math.min(1.45, pitch))
  };
}

// Shortest signed angular difference (radians) for smooth yaw interpolation.
export function shortestAngle(target, current) {
  const d = target - current;
  return Math.atan2(Math.sin(d), Math.cos(d));
}

// ---------------------------------------------------------------------------
// Solar system / orbital motion
// ---------------------------------------------------------------------------

// Kepler's third law: orbital angular speed ∝ a^(-3/2), normalized so Earth = 1.
export function keplerRelSpeed(aAU) { return Math.pow(aAU, -1.5); }

// Compressed display radius so inner & outer planets all fit on screen.
export function orbitDisplayRadius(aAU, scale = 3) { return Math.pow(aAU, 0.5) * scale; }

// Position on a flat circular orbit in the XZ plane.
export function planetXZ(angle, orbit) {
  return { x: Math.cos(angle) * orbit, z: Math.sin(angle) * orbit };
}

// With Earth advancing `earthStep` radians per frame at `fps`, how many real
// seconds does one Earth year take on screen?
export function yearSeconds(earthStep, fps = 60) {
  return (2 * Math.PI / earthStep) / fps;
}

// Time-compression factor: real seconds in a year ÷ on-screen seconds per year.
export function speedupFactor(earthStep, fps = 60) {
  return (365.25 * 86400) / yearSeconds(earthStep, fps);
}

// ---------------------------------------------------------------------------
// Star data — single source of truth, shared with the viewer and the tests.
// star entry = [RA hours, Dec deg, magnitude(, color)]
// ---------------------------------------------------------------------------

export const umiStars = {
  alpha: [2.530, 89.264, 1.98, 0xffe9a8], // Polaris (handle tip) — drawn separately
  delta: [17.537, 86.586, 4.36, 0xcfe0ff], // Yildun
  eps:   [16.766, 82.037, 4.21, 0xcfe0ff],
  zeta:  [15.734, 77.794, 4.29, 0xcfe0ff],
  eta:   [16.292, 75.755, 4.95, 0xcfe0ff],
  beta:  [14.845, 74.155, 2.07, 0xffc98a], // Kochab
  gamma: [15.345, 71.834, 3.00, 0xeef2ff]  // Pherkad
};
export const umiNames = {
  delta: 'ユィルドゥン（δ UMi）', eps: 'ε こぐま座', zeta: 'ζ こぐま座', eta: 'η こぐま座',
  beta: 'コカブ（β UMi）', gamma: 'フェルカド（γ UMi）'
};
export const umiLinks = [
  ['alpha', 'delta'], ['delta', 'eps'], ['eps', 'zeta'],
  ['zeta', 'beta'], ['beta', 'gamma'], ['gamma', 'eta'], ['eta', 'zeta']
];

export const circumpolarConstellations = {
  'おおぐま座（北斗七星）': {
    color: 0x9ad0ff, labelKey: 'dubhe',
    stars: { dubhe: [11.062, 61.75, 1.79], merak: [11.031, 56.38, 2.37], phecda: [11.897, 53.69, 2.44],
             megrez: [12.257, 57.03, 3.31], alioth: [12.900, 55.96, 1.77], mizar: [13.399, 54.93, 2.23], alkaid: [13.792, 49.31, 1.86] },
    links: [['dubhe', 'merak'], ['merak', 'phecda'], ['phecda', 'megrez'], ['megrez', 'dubhe'],
            ['megrez', 'alioth'], ['alioth', 'mizar'], ['mizar', 'alkaid']]
  },
  'カシオペヤ座': {
    color: 0xffb3c8, labelKey: 'gamma', names: { gamma: 'ナビ' },
    stars: { caph: [0.153, 59.15, 2.28], schedar: [0.675, 56.54, 2.24], gamma: [0.945, 60.72, 2.47],
             ruchbah: [1.430, 60.24, 2.68], segin: [1.906, 63.67, 3.35] },
    links: [['caph', 'schedar'], ['schedar', 'gamma'], ['gamma', 'ruchbah'], ['ruchbah', 'segin']]
  },
  'ケフェウス座': {
    color: 0xc6b3ff, labelKey: 'alpha', names: { alpha: 'アルデラミン', beta: 'アルフィルク', gamma: 'エライ' },
    stars: { alpha: [21.310, 62.59, 2.45], beta: [21.477, 70.56, 3.23], gamma: [23.656, 77.63, 3.21],
             iota: [22.828, 66.20, 3.52], eta: [20.755, 61.84, 3.43] },
    links: [['beta', 'gamma'], ['gamma', 'iota'], ['iota', 'alpha'], ['alpha', 'eta'], ['eta', 'beta']]
  },
  'りゅう座': {
    color: 0xa8e6b0, labelKey: 'eltanin',
    stars: { eltanin: [17.943, 51.49, 2.23], rastaban: [17.507, 52.30, 2.79], grumium: [17.892, 56.87, 3.75], nu: [17.685, 55.18, 4.9],
             delta: [19.209, 67.66, 3.07], zeta: [17.146, 65.71, 3.17], eta: [16.400, 61.51, 2.73], iota: [15.415, 58.96, 3.29],
             thuban: [14.073, 64.38, 3.65], kappa: [12.557, 69.79, 3.82], lambda: [11.518, 69.33, 3.84] },
    links: [['rastaban', 'eltanin'], ['eltanin', 'grumium'], ['grumium', 'nu'], ['nu', 'rastaban'],
            ['grumium', 'delta'], ['delta', 'zeta'], ['zeta', 'eta'], ['eta', 'iota'], ['iota', 'thuban'],
            ['thuban', 'kappa'], ['kappa', 'lambda']]
  }
};

export const skyConstellations = {
  'オリオン座': { color: 0x9fb8ff, labelKey: 'alnilam',
    stars: { betelgeuse: [5.919, 7.41, 0.5], rigel: [5.242, -8.20, 0.13], bellatrix: [5.418, 6.35, 1.64], saiph: [5.796, -9.67, 2.07],
             alnitak: [5.679, -1.94, 1.74], alnilam: [5.604, -1.20, 1.69], mintaka: [5.533, -0.30, 2.23] },
    links: [['betelgeuse', 'bellatrix'], ['bellatrix', 'mintaka'], ['betelgeuse', 'alnitak'], ['mintaka', 'alnilam'],
            ['alnilam', 'alnitak'], ['mintaka', 'rigel'], ['alnitak', 'saiph'], ['rigel', 'saiph']] },
  'おおいぬ座': { color: 0xfff0a0, labelKey: 'sirius',
    stars: { sirius: [6.752, -16.72, -1.46], mirzam: [6.378, -17.96, 1.98], wezen: [7.140, -26.39, 1.83], adhara: [6.977, -28.97, 1.50], aludra: [7.402, -29.30, 2.45] },
    links: [['mirzam', 'sirius'], ['sirius', 'wezen'], ['wezen', 'adhara'], ['wezen', 'aludra']] },
  'こいぬ座': { color: 0xffe0b0, labelKey: 'procyon',
    stars: { procyon: [7.655, 5.22, 0.34], gomeisa: [7.452, 8.29, 2.89] },
    links: [['procyon', 'gomeisa']] },
  'ふたご座': { color: 0xffc0d8, labelKey: 'pollux',
    stars: { castor: [7.577, 31.89, 1.58], pollux: [7.755, 28.03, 1.14], alhena: [6.629, 16.40, 1.93], wasat: [7.335, 21.98, 3.53], mebsuta: [6.732, 25.13, 3.0], tejat: [6.383, 22.51, 2.87] },
    links: [['castor', 'pollux'], ['pollux', 'wasat'], ['wasat', 'alhena'], ['castor', 'mebsuta'], ['mebsuta', 'tejat']] },
  'おうし座': { color: 0xffc890, labelKey: 'aldebaran',
    stars: { aldebaran: [4.599, 16.51, 0.85], elnath: [5.438, 28.61, 1.65], zeta: [5.627, 21.14, 3.0], gamma: [4.330, 15.63, 3.65] },
    links: [['aldebaran', 'elnath'], ['aldebaran', 'zeta'], ['aldebaran', 'gamma']] },
  'しし座': { color: 0xf5d76e, labelKey: 'regulus',
    stars: { regulus: [10.139, 11.97, 1.36], eta: [10.122, 16.76, 3.48], gamma: [10.333, 19.84, 2.01], zeta: [10.278, 23.42, 3.43],
             epsilon: [9.764, 23.77, 2.97], delta: [11.235, 20.52, 2.56], theta: [11.237, 15.43, 3.33], denebola: [11.818, 14.57, 2.11] },
    links: [['regulus', 'eta'], ['eta', 'gamma'], ['gamma', 'zeta'], ['zeta', 'epsilon'], ['gamma', 'delta'],
            ['delta', 'theta'], ['theta', 'regulus'], ['delta', 'denebola'], ['theta', 'denebola']] },
  'こと座': { color: 0xa0ffe0, labelKey: 'vega', names: { beta: 'シェリアク', gamma: 'スラファト' },
    stars: { vega: [18.615, 38.78, 0.03], epsilon: [18.737, 39.61, 4.0], zeta: [18.746, 37.60, 4.3], delta: [18.908, 36.90, 4.3], gamma: [18.982, 32.69, 3.26], beta: [18.835, 33.36, 3.5] },
    links: [['vega', 'epsilon'], ['vega', 'zeta'], ['zeta', 'delta'], ['delta', 'gamma'], ['gamma', 'beta'], ['beta', 'zeta']] },
  'わし座': { color: 0xd0c0ff, labelKey: 'altair',
    stars: { altair: [19.846, 8.87, 0.76], tarazed: [19.771, 10.61, 2.72], alshain: [19.922, 6.41, 3.71], delta: [19.425, 3.12, 3.36], zeta: [19.090, 13.86, 2.99], theta: [20.188, -0.82, 3.23], lambda: [19.104, -4.88, 3.43] },
    links: [['tarazed', 'altair'], ['altair', 'alshain'], ['altair', 'delta'], ['delta', 'zeta'], ['delta', 'theta'], ['theta', 'lambda']] },
  'はくちょう座': { color: 0xbfe0ff, labelKey: 'deneb',
    stars: { deneb: [20.690, 45.28, 1.25], sadr: [20.371, 40.26, 2.23], albireo: [19.512, 27.96, 3.18], delta: [19.750, 45.13, 2.87], gienah: [20.770, 33.97, 2.48] },
    links: [['deneb', 'sadr'], ['sadr', 'albireo'], ['delta', 'sadr'], ['sadr', 'gienah']] },
  'さそり座': { color: 0xff9a8a, labelKey: 'antares', names: { beta: 'アクラブ', delta: 'ジュバ', lambda: 'シャウラ', theta: 'サルガス' },
    stars: { antares: [16.490, -26.43, 1.06], beta: [16.090, -19.81, 2.56], delta: [16.005, -22.62, 2.29], pi: [15.981, -26.11, 2.89], sigma: [16.353, -25.59, 2.89],
             tau: [16.598, -28.22, 2.82], epsilon: [16.836, -34.29, 2.29], mu: [16.864, -38.05, 3.0], zeta: [16.913, -42.36, 3.62], eta: [17.203, -43.24, 3.33],
             theta: [17.622, -42.99, 1.87], iota: [17.793, -40.13, 3.03], kappa: [17.708, -39.03, 2.41], lambda: [17.560, -37.10, 1.62], upsilon: [17.512, -37.30, 2.7] },
    links: [['beta', 'delta'], ['delta', 'pi'], ['delta', 'sigma'], ['sigma', 'antares'], ['antares', 'tau'], ['tau', 'epsilon'], ['epsilon', 'mu'],
            ['mu', 'zeta'], ['zeta', 'eta'], ['eta', 'theta'], ['theta', 'iota'], ['iota', 'kappa'], ['kappa', 'lambda'], ['lambda', 'upsilon']] },
  'ペガスス座': { color: 0xc8ffb0, labelKey: 'markab',
    stars: { markab: [23.079, 15.21, 2.49], scheat: [23.063, 28.08, 2.42], algenib: [0.221, 15.18, 2.83], alpheratz: [0.140, 29.09, 2.06], enif: [21.736, 9.87, 2.39] },
    links: [['markab', 'scheat'], ['scheat', 'alpheratz'], ['alpheratz', 'algenib'], ['algenib', 'markab'], ['markab', 'enif']] },

  'おひつじ座': { color: 0xffcf9a, labelKey: 'hamal',
    stars: { hamal: [2.119, 23.46, 2.0], sheratan: [1.911, 20.81, 2.64], mesarthim: [1.892, 19.29, 3.86] },
    links: [['hamal', 'sheratan'], ['sheratan', 'mesarthim']] },
  'かに座': { color: 0xc9e0a0, labelKey: 'delta',
    stars: { iota: [8.778, 28.76, 4.0], gamma: [8.722, 21.47, 4.66], delta: [8.745, 18.15, 3.94], alpha: [8.974, 11.86, 4.25], beta: [8.275, 9.19, 3.5] },
    links: [['iota', 'gamma'], ['gamma', 'delta'], ['delta', 'alpha'], ['delta', 'beta']] },
  'おとめ座': { color: 0xa0e0c8, labelKey: 'spica', names: { epsilon: 'ヴィンデミアトリックス', gamma: 'ポリマ' },
    stars: { spica: [13.420, -11.16, 0.98], zeta: [13.578, -0.60, 3.38], gamma: [12.694, -1.45, 2.74], delta: [12.927, 3.40, 3.38], epsilon: [13.036, 10.96, 2.83], beta: [11.845, 1.76, 3.6] },
    links: [['epsilon', 'delta'], ['delta', 'gamma'], ['gamma', 'zeta'], ['zeta', 'spica'], ['gamma', 'beta']] },
  'てんびん座': { color: 0xd0d0ff, labelKey: 'beta', names: { alpha: 'ズベンエルゲヌビ', beta: 'ズベンエスカマリ' },
    stars: { alpha: [14.848, -16.04, 2.75], beta: [15.283, -9.38, 2.61], gamma: [15.586, -14.79, 3.91], sigma: [15.067, -25.28, 3.29] },
    links: [['alpha', 'beta'], ['beta', 'gamma'], ['gamma', 'alpha'], ['alpha', 'sigma']] },
  'いて座（南斗）': { color: 0xffbfa0, labelKey: 'epsilon', names: { epsilon: 'カウス・アウストラリス', sigma: 'ヌンキ', lambda: 'カウス・ボレアリス', delta: 'カウス・メディア' },
    stars: { gamma: [18.097, -30.42, 2.99], delta: [18.350, -29.83, 2.7], epsilon: [18.403, -34.38, 1.85], zeta: [19.044, -29.88, 2.6],
             phi: [18.766, -26.99, 3.17], lambda: [18.466, -25.42, 2.81], sigma: [18.921, -26.30, 2.05], tau: [19.116, -27.67, 3.32] },
    links: [['gamma', 'delta'], ['delta', 'epsilon'], ['epsilon', 'zeta'], ['zeta', 'phi'], ['phi', 'lambda'], ['lambda', 'delta'], ['phi', 'sigma'], ['sigma', 'tau'], ['tau', 'zeta']] },
  'やぎ座': { color: 0xe0d090, labelKey: 'delta', names: { delta: 'デネブ・アルゲディ', beta: 'ダビ', alpha: 'アルゲディ' },
    stars: { alpha: [20.300, -12.51, 3.57], beta: [20.350, -14.78, 3.05], omega: [20.864, -26.92, 4.1], zeta: [21.444, -22.41, 3.74], gamma: [21.668, -16.66, 3.68], delta: [21.784, -16.13, 2.85] },
    links: [['alpha', 'beta'], ['beta', 'omega'], ['omega', 'zeta'], ['zeta', 'gamma'], ['gamma', 'delta'], ['delta', 'alpha']] },
  'みずがめ座': { color: 0xa0d8ff, labelKey: 'alpha', names: { beta: 'サダルスード', alpha: 'サダルメリク', delta: 'スカト' },
    stars: { beta: [21.526, -5.57, 2.9], alpha: [22.096, -0.32, 2.95], gamma: [22.361, -1.39, 3.84], zeta: [22.481, -0.02, 3.65], eta: [22.595, -0.12, 4.04], delta: [22.911, -15.82, 3.27] },
    links: [['beta', 'alpha'], ['alpha', 'gamma'], ['gamma', 'zeta'], ['zeta', 'eta'], ['gamma', 'delta']] },
  'うお座': { color: 0xbfe0d0, labelKey: 'alpha', names: { alpha: 'アルレシャ' },
    stars: { eta: [1.524, 15.35, 3.62], alpha: [2.034, 2.76, 3.82], omega: [23.992, 6.86, 4.0], iota: [23.660, 5.63, 4.13], gamma: [23.286, 3.28, 3.69] },
    links: [['eta', 'alpha'], ['alpha', 'omega'], ['omega', 'iota'], ['iota', 'gamma']] },
  'うしかい座': { color: 0xffd2a0, labelKey: 'arcturus', names: { epsilon: 'イザール', gamma: 'セギヌス', eta: 'ムフリド' },
    stars: { arcturus: [14.261, 19.18, -0.05], epsilon: [14.749, 27.07, 2.37], delta: [15.258, 33.31, 3.47], beta: [15.032, 40.39, 3.49], gamma: [14.534, 38.31, 3.03], eta: [13.911, 18.40, 2.68] },
    links: [['arcturus', 'epsilon'], ['epsilon', 'delta'], ['delta', 'beta'], ['beta', 'gamma'], ['gamma', 'arcturus'], ['arcturus', 'eta']] }
};

// Seasonal great triangles: [RA hours, Dec deg] for each of the 3 vertices.
export const triangles = {
  '春の大三角': { color: 0x7dff9e, pts: [[14.261, 19.18], [13.420, -11.16], [11.818, 14.57]] }, // Arcturus, Spica, Denebola
  '夏の大三角': { color: 0x7dd0ff, pts: [[18.615, 38.78], [20.690, 45.28], [19.846, 8.87]] },   // Vega, Deneb, Altair
  '冬の大三角': { color: 0xffd27d, pts: [[5.919, 7.41], [6.752, -16.72], [7.655, 5.22]] }        // Betelgeuse, Sirius, Procyon
};

// Planets: a = semi-major axis (AU). orbit/size are display values; rel speed is
// derived from `a` via Kepler's third law (see index.html).
export const planetDefs = [
  { jp: '水星',  en: 'Mercury', a: 0.387, orbit: 2.2,  size: 0.18, color: 0xb0a090 },
  { jp: '金星',  en: 'Venus',   a: 0.723, orbit: 3.0,  size: 0.32, color: 0xe8d8a0 },
  { jp: '地球',  en: 'Earth',   a: 1.000, orbit: 3.9,  size: 0.34, color: 0x4a90e2 },
  { jp: '火星',  en: 'Mars',    a: 1.524, orbit: 4.9,  size: 0.24, color: 0xd0552f },
  { jp: '木星',  en: 'Jupiter', a: 5.203, orbit: 7.2,  size: 0.92, color: 0xd9b58a },
  { jp: '土星',  en: 'Saturn',  a: 9.537, orbit: 9.6,  size: 0.78, color: 0xe3d6a6, ring: true },
  { jp: '天王星', en: 'Uranus',  a: 19.19, orbit: 12.4, size: 0.52, color: 0xa9e6e6 },
  { jp: '海王星', en: 'Neptune', a: 30.07, orbit: 15.0, size: 0.50, color: 0x5878e6 },
  { jp: '冥王星', en: 'Pluto',   a: 39.48, orbit: 17.4, size: 0.16, color: 0xb39a86 }
];

// ===========================================================================
// Ephemeris: faithful Sun / Moon / planet positions and sidereal time.
// Accuracy ~arcmin–degree (Standish low-precision elements, valid ~1800–2050);
// plenty for "which star/planet is where in the sky tonight".
// ===========================================================================

// Observer location. 宮古島 (Miyako-jima): 24.74°N, 125.28°E.
export const MIYAKO = { name: '宮古島', latDeg: 24.74, lonEastDeg: 125.28 };

const RAD = Math.PI / 180;
const toRad = (d) => d * RAD;
const toDeg = (r) => r / RAD;
export const norm360 = (d) => ((d % 360) + 360) % 360;
export const norm24 = (h) => ((h % 24) + 24) % 24;

// Julian Day from a JS Date (uses its absolute UTC instant) and back.
export function julianDay(date) { return date.getTime() / 86400000 + 2440587.5; }
export function jdToDate(jd) { return new Date((jd - 2440587.5) * 86400000); }
export function centuriesSinceJ2000(jd) { return (jd - 2451545.0) / 36525; }

// Greenwich Mean Sidereal Time (degrees, 0–360).
export function gmstDeg(jd) {
  const d = jd - 2451545.0;
  return norm360(280.46061837 + 360.98564736629 * d);
}
// Local Sidereal Time (degrees) at an east longitude = RA currently on the meridian.
export function lstDeg(jd, lonEastDeg) { return norm360(gmstDeg(jd) + lonEastDeg); }

const obliquityRad = (jd) => toRad(23.439291 - 0.0130042 * centuriesSinceJ2000(jd));

// Rotate an ecliptic (J2000) vector to equatorial and read off RA(hours)/Dec(deg).
function eclVecToEqu(x, y, z, jd) {
  const eps = obliquityRad(jd);
  const ce = Math.cos(eps), se = Math.sin(eps);
  const xe = x, ye = y * ce - z * se, ze = y * se + z * ce;
  return {
    ra: norm24(toDeg(Math.atan2(ye, xe)) / 15),
    dec: toDeg(Math.atan2(ze, Math.hypot(xe, ye))),
    dist: Math.hypot(x, y, z)
  };
}

// Convert ecliptic lon/lat (radians) to RA(hours)/Dec(deg).
export function eclipticToEquatorial(lonRad, latRad, jd) {
  const eps = obliquityRad(jd);
  const sl = Math.sin(lonRad), cl = Math.cos(lonRad), tb = Math.tan(latRad);
  return {
    ra: norm24(toDeg(Math.atan2(sl * Math.cos(eps) - tb * Math.sin(eps), cl)) / 15),
    dec: toDeg(Math.asin(Math.sin(latRad) * Math.cos(eps) + Math.cos(latRad) * Math.sin(eps) * sl))
  };
}

// Standish Keplerian elements at J2000 and their per-century rates:
// [value0, ratePerCentury] for a(AU), e, I(deg), L(deg), ϖ(deg), Ω(deg).
const ELEMENTS = {
  Mercury: { a: [0.38709927, 0.00000037], e: [0.20563593, 0.00001906], I: [7.00497902, -0.00594749], L: [252.25032350, 149472.67411175], w: [77.45779628, 0.16047689], O: [48.33076593, -0.12534081] },
  Venus:   { a: [0.72333566, 0.00000390], e: [0.00677672, -0.00004107], I: [3.39467605, -0.00078890], L: [181.97909950, 58517.81538729], w: [131.60246718, 0.00268329], O: [76.67984255, -0.27769418] },
  Earth:   { a: [1.00000261, 0.00000562], e: [0.01671123, -0.00004392], I: [-0.00001531, -0.01294668], L: [100.46457166, 35999.37244981], w: [102.93768193, 0.32327364], O: [0.0, 0.0] },
  Mars:    { a: [1.52371034, 0.00001847], e: [0.09339410, 0.00007882], I: [1.84969142, -0.00813131], L: [-4.55343205, 19140.30268499], w: [-23.94362959, 0.44441088], O: [49.55953891, -0.29257343] },
  Jupiter: { a: [5.20288700, -0.00011607], e: [0.04838624, -0.00013253], I: [1.30439695, -0.00183714], L: [34.39644051, 3034.74612775], w: [14.72847983, 0.21252668], O: [100.47390909, 0.20469106] },
  Saturn:  { a: [9.53667594, -0.00125060], e: [0.05386179, -0.00050991], I: [2.48599187, 0.00193609], L: [49.95424423, 1222.49362201], w: [92.59887831, -0.41897216], O: [113.66242448, -0.28867794] },
  Uranus:  { a: [19.18916464, -0.00196176], e: [0.04725744, -0.00004397], I: [0.77263783, -0.00242939], L: [313.23810451, 428.48202785], w: [170.95427630, 0.40805281], O: [74.01692503, 0.04240589] },
  Neptune: { a: [30.06992276, 0.00026291], e: [0.00859048, 0.00005105], I: [1.77004347, 0.00035372], L: [-55.12002969, 218.45945325], w: [44.96476227, -0.32241464], O: [131.78422574, -0.00508664] }
};

function solveKepler(Mdeg, e) {
  const eStar = e / RAD; // e in degrees
  let E = Mdeg + eStar * Math.sin(toRad(Mdeg));
  for (let i = 0; i < 12; i++) {
    const dM = Mdeg - (E - eStar * Math.sin(toRad(E)));
    const dE = dM / (1 - e * Math.cos(toRad(E)));
    E += dE;
    if (Math.abs(dE) < 1e-8) break;
  }
  return E;
}

// Heliocentric J2000 ecliptic position (AU) for a planet at T centuries past J2000.
function helioEcl(el, T) {
  const a = el.a[0] + el.a[1] * T;
  const e = el.e[0] + el.e[1] * T;
  const I = el.I[0] + el.I[1] * T;
  const L = el.L[0] + el.L[1] * T;
  const wbar = el.w[0] + el.w[1] * T;
  const Om = el.O[0] + el.O[1] * T;
  const w = wbar - Om;
  let M = norm360(L - wbar); if (M > 180) M -= 360;
  const E = solveKepler(M, e);
  const xp = a * (Math.cos(toRad(E)) - e);
  const yp = a * Math.sqrt(1 - e * e) * Math.sin(toRad(E));
  const cw = Math.cos(toRad(w)), sw = Math.sin(toRad(w));
  const cO = Math.cos(toRad(Om)), sO = Math.sin(toRad(Om));
  const cI = Math.cos(toRad(I)), sI = Math.sin(toRad(I));
  return {
    x: (cw * cO - sw * sO * cI) * xp + (-sw * cO - cw * sO * cI) * yp,
    y: (cw * sO + sw * cO * cI) * xp + (-sw * sO + cw * cO * cI) * yp,
    z: (sw * sI) * xp + (cw * sI) * yp
  };
}

// Geocentric equatorial RA(hours)/Dec(deg) for a planet (key = English name).
export function planetEqu(name, jd) {
  const T = centuriesSinceJ2000(jd);
  const p = helioEcl(ELEMENTS[name], T);
  const earth = helioEcl(ELEMENTS.Earth, T);
  return eclVecToEqu(p.x - earth.x, p.y - earth.y, p.z - earth.z, jd);
}

// Geocentric Sun: the Sun is opposite the Earth's heliocentric position.
export function sunEqu(jd) {
  const e = helioEcl(ELEMENTS.Earth, centuriesSinceJ2000(jd));
  return eclVecToEqu(-e.x, -e.y, -e.z, jd);
}

// Geocentric Moon (low-precision series, ~0.1–0.3° accuracy).
export function moonEqu(jd) {
  const T = centuriesSinceJ2000(jd);
  const Lp = 218.3164477 + 481267.88123421 * T;
  const D = toRad(297.8501921 + 445267.1114034 * T);
  const M = toRad(357.5291092 + 35999.0502909 * T);
  const Mp = toRad(134.9633964 + 477198.8675055 * T);
  const F = toRad(93.2720950 + 483202.0175233 * T);
  const lon = Lp
    + 6.289 * Math.sin(Mp)
    + 1.274 * Math.sin(2 * D - Mp)
    + 0.658 * Math.sin(2 * D)
    + 0.214 * Math.sin(2 * Mp)
    - 0.186 * Math.sin(M)
    - 0.114 * Math.sin(2 * F);
  const lat = 5.128 * Math.sin(F)
    + 0.281 * Math.sin(Mp + F)
    + 0.278 * Math.sin(F - Mp)
    + 0.173 * Math.sin(2 * D - F);
  return eclipticToEquatorial(toRad(norm360(lon)), toRad(lat), jd);
}

// Approximate Moon phase: 0=new, 0.5=full (illuminated fraction grows then shrinks).
export function moonPhase(jd) {
  const T = centuriesSinceJ2000(jd);
  const D = norm360(297.8501921 + 445267.1114034 * T); // mean elongation Sun–Moon
  return { elongationDeg: D, illuminated: (1 - Math.cos(toRad(D))) / 2 };
}

// Find the next Julian Day after `jdStart` at which the Sun-Moon elongation
// hits `targetDeg`: 0 = new moon, 90 = first quarter, 180 = full, 270 = last.
// Scans in half-day steps then bisects to ~minute precision.
export function nextLunarPhase(jdStart, targetDeg) {
  const diff = (jd) => ((moonPhase(jd).elongationDeg - targetDeg + 540) % 360) - 180;
  const STEP = 0.5;
  let prevJd = jdStart, prevD = diff(jdStart);
  for (let i = 1; i <= 80; i++) { // up to 40 days (synodic month ~29.5)
    const jd = jdStart + i * STEP;
    const d = diff(jd);
    if (prevD < 0 && d >= 0) {
      let lo = prevJd, hi = jd;
      for (let k = 0; k < 30; k++) {
        const mid = (lo + hi) / 2;
        if (diff(mid) < 0) lo = mid; else hi = mid;
      }
      return (lo + hi) / 2;
    }
    prevJd = jd; prevD = d;
  }
  return null;
}

// Pretty emoji + label for the current moon phase.
export function moonPhaseLabel(jd) {
  const D = moonPhase(jd).elongationDeg;
  if (D < 22.5 || D >= 337.5) return { emoji: '🌑', name: '新月' };
  if (D < 67.5)  return { emoji: '🌒', name: '三日月' };
  if (D < 112.5) return { emoji: '🌓', name: '上弦の月' };
  if (D < 157.5) return { emoji: '🌔', name: '十三夜月' };
  if (D < 202.5) return { emoji: '🌕', name: '満月' };
  if (D < 247.5) return { emoji: '🌖', name: '十六夜' };
  if (D < 292.5) return { emoji: '🌗', name: '下弦の月' };
  return { emoji: '🌘', name: '有明月' };
}

// Convenience: all sky bodies (Sun, Moon, naked-eye + outer planets) for a date.
// Returns [{ key, jp, ra, dec, kind, color }].
export const SKY_BODIES = [
  { key: 'Sun',     jp: '太陽', kind: 'sun',    color: 0xffd14d },
  { key: 'Moon',    jp: '月',   kind: 'moon',   color: 0xdfe6f0 },
  { key: 'Mercury', jp: '水星', kind: 'planet', color: 0xb0a090 },
  { key: 'Venus',   jp: '金星', kind: 'planet', color: 0xe8d8a0 },
  { key: 'Earth',   jp: '地球', kind: 'planet', color: 0x4a90e2 },
  { key: 'Mars',    jp: '火星', kind: 'planet', color: 0xd0552f },
  { key: 'Jupiter', jp: '木星', kind: 'planet', color: 0xd9b58a },
  { key: 'Saturn',  jp: '土星', kind: 'planet', color: 0xe3d6a6 },
  { key: 'Uranus',  jp: '天王星', kind: 'planet', color: 0xa9e6e6 },
  { key: 'Neptune', jp: '海王星', kind: 'planet', color: 0x5878e6 }
];

export function bodyEqu(key, jd) {
  if (key === 'Sun') return sunEqu(jd);
  if (key === 'Moon') return moonEqu(jd);
  return planetEqu(key, jd);
}

// Heliocentric ecliptic xyz (AU) for any sky body — used to swap the observer.
export function helio(key, jd) {
  const T = centuriesSinceJ2000(jd);
  if (key === 'Sun') return { x: 0, y: 0, z: 0 };
  if (key === 'Moon') {
    const earth = helioEcl(ELEMENTS.Earth, T);
    const Lp = 218.3164477 + 481267.88123421 * T;
    const D = toRad(297.8501921 + 445267.1114034 * T);
    const M = toRad(357.5291092 + 35999.0502909 * T);
    const Mp = toRad(134.9633964 + 477198.8675055 * T);
    const F = toRad(93.2720950 + 483202.0175233 * T);
    const lon = toRad(norm360(Lp + 6.289 * Math.sin(Mp) + 1.274 * Math.sin(2 * D - Mp) + 0.658 * Math.sin(2 * D)
      + 0.214 * Math.sin(2 * Mp) - 0.186 * Math.sin(M) - 0.114 * Math.sin(2 * F)));
    const lat = toRad(5.128 * Math.sin(F) + 0.281 * Math.sin(Mp + F) + 0.278 * Math.sin(F - Mp) + 0.173 * Math.sin(2 * D - F));
    const dist = 0.00257; // ~1 lunar distance in AU
    return {
      x: earth.x + dist * Math.cos(lat) * Math.cos(lon),
      y: earth.y + dist * Math.cos(lat) * Math.sin(lon),
      z: earth.z + dist * Math.sin(lat)
    };
  }
  return ELEMENTS[key] ? helioEcl(ELEMENTS[key], T) : { x: 0, y: 0, z: 0 };
}

// Apparent RA/Dec of a target body as seen from an observer body.
// observerKey === targetKey → null (you can't see your own home).
export function bodyEquFrom(targetKey, jd, observerKey = 'Earth') {
  if (targetKey === observerKey) return null;
  const o = helio(observerKey, jd);
  const t = helio(targetKey, jd);
  const e = obliquityRad(jd); const ce = Math.cos(e), se = Math.sin(e);
  const dx = t.x - o.x, dy = t.y - o.y, dz = t.z - o.z;
  const xe = dx, ye = dy * ce - dz * se, ze = dy * se + dz * ce;
  return {
    ra: norm24(toDeg(Math.atan2(ye, xe)) / 15),
    dec: toDeg(Math.atan2(ze, Math.hypot(xe, ye))),
    dist: Math.hypot(dx, dy, dz)
  };
}

// ---------------------------------------------------------------------------
// 二十四節気 (24 solar terms) & 月齢 (moon age)
// ---------------------------------------------------------------------------

// Geocentric ecliptic longitude of the Sun (degrees, 0–360). 0° = vernal equinox.
export function sunEclipticLon(jd) {
  const T = centuriesSinceJ2000(jd);
  const e = helioEcl(ELEMENTS.Earth, T);
  return norm360(toDeg(Math.atan2(-e.y, -e.x)));
}

// 24 solar terms — each at a sun-ecliptic-longitude multiple of 15°. The cycle
// starts at 立春 (lon=315°) by Chinese-Japanese convention; ordering here uses
// the modern Japanese listing that begins with 立春 in early February.
export const SOLAR_TERMS = [
  { lon: 315, name: '立春',   season: '春' }, { lon: 330, name: '雨水',   season: '春' },
  { lon: 345, name: '啓蟄',   season: '春' }, { lon:   0, name: '春分',   season: '春' },
  { lon:  15, name: '清明',   season: '春' }, { lon:  30, name: '穀雨',   season: '春' },
  { lon:  45, name: '立夏',   season: '夏' }, { lon:  60, name: '小満',   season: '夏' },
  { lon:  75, name: '芒種',   season: '夏' }, { lon:  90, name: '夏至',   season: '夏' },
  { lon: 105, name: '小暑',   season: '夏' }, { lon: 120, name: '大暑',   season: '夏' },
  { lon: 135, name: '立秋',   season: '秋' }, { lon: 150, name: '処暑',   season: '秋' },
  { lon: 165, name: '白露',   season: '秋' }, { lon: 180, name: '秋分',   season: '秋' },
  { lon: 195, name: '寒露',   season: '秋' }, { lon: 210, name: '霜降',   season: '秋' },
  { lon: 225, name: '立冬',   season: '冬' }, { lon: 240, name: '小雪',   season: '冬' },
  { lon: 255, name: '大雪',   season: '冬' }, { lon: 270, name: '冬至',   season: '冬' },
  { lon: 285, name: '小寒',   season: '冬' }, { lon: 300, name: '大寒',   season: '冬' }
];

// Find the JD when the Sun first reaches `targetLonDeg` at or after jdStart.
// Half-day scan + bisection — good to ~1 minute for the 24 solar terms.
export function nextSolarTerm(jdStart, targetLonDeg) {
  const diff = (jd) => ((sunEclipticLon(jd) - targetLonDeg + 540) % 360) - 180;
  const STEP = 0.5;
  let prevJd = jdStart, prevD = diff(jdStart);
  for (let i = 1; i <= 800; i++) { // up to 400 days (full annual cycle + buffer)
    const jd = jdStart + i * STEP;
    const d = diff(jd);
    if (prevD < 0 && d >= 0) {
      let lo = prevJd, hi = jd;
      for (let k = 0; k < 30; k++) {
        const mid = (lo + hi) / 2;
        if (diff(mid) < 0) lo = mid; else hi = mid;
      }
      return (lo + hi) / 2;
    }
    prevJd = jd; prevD = d;
  }
  return null;
}

// Identify the current 二十四節気 segment and the next term. Returns
// { current: { name, lon, season }, next: { name, lon, season }, daysToNext }.
export function solarTerm(jd) {
  const lon = sunEclipticLon(jd);
  // Find the term whose lon is the largest <= lon (cyclically, anchored at 立春=315).
  // Cycle starts at 315 (立春). Compute "cycle position" t = (lon - 315 + 360) % 360,
  // then the current term index is floor(t / 15) and the next is +1 mod 24.
  const t = ((lon - 315) % 360 + 360) % 360;
  const idx = Math.floor(t / 15) % 24;
  const current = SOLAR_TERMS[idx];
  const next = SOLAR_TERMS[(idx + 1) % 24];
  const nextJd = nextSolarTerm(jd, next.lon);
  return { current, next, daysToNext: nextJd != null ? nextJd - jd : null };
}

// Days since the most recent new moon (0 = exactly new, up to ~29.53).
export function moonAge(jd) {
  // Walk backwards until we cross a new moon. The synodic month is ~29.53 days;
  // step in 0.5-day increments looking for the sign change of (elongation - 180)
  // (we use the wrapped diff so that 0° is "new" but lies between values around 360 and 0).
  const D = (j) => moonPhase(j).elongationDeg; // 0..360
  // We define "new" as crossing from ~360 back to ~0 going forward, so going
  // backwards we're looking for the most recent J where D(J) wraps. Use a
  // monotone "phase angle" instead: subtract a steady linear drift so it's
  // strictly monotone, then bisect.
  // Simpler: scan back ≤32 days in half-day steps to find a crossing.
  let prevJ = jd, prevD = D(jd);
  for (let i = 1; i <= 66; i++) {
    const j = jd - i * 0.5;
    const d = D(j);
    // detect descending crossing from <22.5° down through 0/360 wrap up to >337.5°
    if (prevD < 180 && d > 180 && (prevD + (360 - d)) < 60) {
      // crossing somewhere in (j, prevJ); bisect on "(D + 180) mod 360 - 180" → near zero
      const wrap = (x) => ((x + 180) % 360 + 360) % 360 - 180;
      let lo = j, hi = prevJ;
      for (let k = 0; k < 30; k++) {
        const mid = (lo + hi) / 2;
        if (wrap(D(mid)) < 0) hi = mid; else lo = mid;
      }
      return jd - (lo + hi) / 2;
    }
    prevJ = j; prevD = d;
  }
  return null;
}

// ---------------------------------------------------------------------------
// 歳差運動 (Precession of the equinoxes)
// ---------------------------------------------------------------------------

// Direction of the celestial pole at epoch `jd`, expressed as a unit vector
// in the J2000 equatorial frame our scene uses (raDecToXYZ convention: +Y = pole).
// The pole drifts along a small circle of radius ε ≈ 23.44° around the ecliptic
// pole, completing one revolution in ≈ 25,772 years.
export function precessionPoleDirJ2000(jd) {
  const T = (jd - 2451545.0) / 365.25; // years from J2000
  const period = 25772;
  const omega = 2 * Math.PI * T / period; // precession angle so far
  const eps = obliquityRad(2451545.0);    // use the J2000 obliquity for the small circle
  // The ecliptic pole in equatorial J2000 XYZ (our raDecToXYZ convention) sits at
  // RA = 18h (= 270° in our +X-cos / +Z-sin layout), Dec = 90° - ε. Plugging in:
  //   x = cos(Dec)cos(RA) = 0,  y = sin(Dec) = cos(ε),  z = cos(Dec)sin(RA) = -sin(ε)
  const cosE = Math.cos(eps), sinE = Math.sin(eps);
  const eclP = { x: 0, y: cosE, z: -sinE };
  // J2000 celestial pole = (0, 1, 0). Decompose into a parallel-to-eclP component +
  // a perpendicular part, then rotate the perpendicular part by ω around eclP.
  const dot = 1 * cosE; // (0,1,0) · eclP = cos(ε)
  // Perpendicular (lies in the plane through ecliptic pole tangent to the pole circle):
  const px = 0 - dot * eclP.x;
  const py = 1 - dot * eclP.y;
  const pz = 0 - dot * eclP.z;
  // A second basis vector in the small-circle plane: eclP × perp
  const bx = eclP.y * pz - eclP.z * py;
  const by = eclP.z * px - eclP.x * pz;
  const bz = eclP.x * py - eclP.y * px;
  const cosO = Math.cos(omega), sinO = Math.sin(omega);
  return {
    x: dot * eclP.x + px * cosO + bx * sinO,
    y: dot * eclP.y + py * cosO + by * sinO,
    z: dot * eclP.z + pz * cosO + bz * sinO
  };
}

// Direction of the ecliptic pole in our J2000 equatorial frame (used to draw
// the precession circle as a small circle of radius ε around this pole).
export function eclipticPoleDirJ2000() {
  const eps = obliquityRad(2451545.0);
  return { x: 0, y: Math.cos(eps), z: -Math.sin(eps) };
}

// ---------------------------------------------------------------------------
// 彗星 (Comets) — Keplerian elements + position from epoch of perihelion
// ---------------------------------------------------------------------------

// Famous periodic / long-period comets. Elements pulled from JPL/MPC, expressed
// in heliocentric ecliptic J2000 coordinates. period in years; Tperi_jd is the
// Julian date of the most recent perihelion passage we have on file.
export const COMETS = [
  // 1P/Halley — most famous; last perihelion 1986-02-09, next ≈ 2061-07-28.
  {
    name: 'ハレー彗星', en: '1P/Halley',
    a: 17.834, e: 0.96714, i: 162.26, w: 111.33, O: 58.42,
    Tperi_jd: 2446470.95, period: 75.32, color: 0x9ff5ff
  },
  // C/1995 O1 (Hale-Bopp) — the spectacular 1997 comet; very long period.
  {
    name: 'ヘール・ボップ彗星', en: 'C/1995 O1',
    a: 178.0, e: 0.99513, i: 89.43, w: 130.59, O: 282.47,
    Tperi_jd: 2450538.14, period: 2533, color: 0xb0e0ff
  },
  // C/2020 F3 (NEOWISE) — bright naked-eye comet in July 2020.
  {
    name: 'ネオワイズ彗星', en: 'C/2020 F3',
    a: 358.6, e: 0.99918, i: 128.94, w: 37.28, O: 60.97,
    Tperi_jd: 2459033.0, period: 6800, color: 0xfff0a0
  }
];

// Heliocentric ecliptic XYZ (AU) of a comet at jd, using its Keplerian elements
// and time-since-perihelion (rather than mean longitude at epoch, since comet
// elements are normally tabulated relative to T_peri).
export function cometHelio(c, jd) {
  const n = 2 * Math.PI / (c.period * 365.25); // mean motion (rad/day)
  const M = n * (jd - c.Tperi_jd);              // mean anomaly (rad)
  // Solve M = E − e sin E for E (Kepler's equation), radians.
  let E = M;
  for (let k = 0; k < 50; k++) {
    const dE = (M - E + c.e * Math.sin(E)) / (1 - c.e * Math.cos(E));
    E += dE;
    if (Math.abs(dE) < 1e-10) break;
  }
  // True anomaly v and distance r (AU)
  const v = 2 * Math.atan2(
    Math.sqrt(1 + c.e) * Math.sin(E / 2),
    Math.sqrt(1 - c.e) * Math.cos(E / 2)
  );
  const r = c.a * (1 - c.e * Math.cos(E));
  // Perifocal frame: x toward perihelion, y in the orbital plane perpendicular.
  const xp = r * Math.cos(v), yp = r * Math.sin(v);
  // Rotate to ecliptic by (ω, i, Ω) — the standard composition R_Ω · R_i · R_ω.
  const w = toRad(c.w), iR = toRad(c.i), O = toRad(c.O);
  const cw = Math.cos(w), sw = Math.sin(w);
  const cO = Math.cos(O), sO = Math.sin(O);
  const ci = Math.cos(iR), si = Math.sin(iR);
  return {
    x: (cw * cO - sw * sO * ci) * xp + (-sw * cO - cw * sO * ci) * yp,
    y: (cw * sO + sw * cO * ci) * xp + (-sw * sO + cw * cO * ci) * yp,
    z: (sw * si) * xp + (cw * si) * yp,
    r // heliocentric distance (AU) — useful for visibility / size scaling
  };
}

// Geocentric apparent RA/Dec for a comet (plus heliocentric distance & geocentric dist).
export function cometEqu(c, jd) {
  const cp = cometHelio(c, jd);
  const ep = helioEcl(ELEMENTS.Earth, centuriesSinceJ2000(jd));
  const dx = cp.x - ep.x, dy = cp.y - ep.y, dz = cp.z - ep.z;
  const dist = Math.hypot(dx, dy, dz);
  const eq = eclVecToEqu(dx, dy, dz, jd);
  return { ...eq, dist, helioDist: cp.r };
}

// ---------------------------------------------------------------------------
// Apollo lunar landing sites — selenographic latitude/longitude (deg).
// Convention: +lat = north, +lon = east. Used to draw markers on the Moon.
// ---------------------------------------------------------------------------
export const APOLLO_SITES = [
  { mission: 'Apollo 11', jp: 'アポロ11号 静かの海',     date: '1969-07-20', lat:  0.674, lon:  23.473 },
  { mission: 'Apollo 12', jp: 'アポロ12号 嵐の大洋',     date: '1969-11-19', lat: -3.012, lon: -23.422 },
  { mission: 'Apollo 14', jp: 'アポロ14号 フラ・マウロ', date: '1971-02-05', lat: -3.646, lon: -17.473 },
  { mission: 'Apollo 15', jp: 'アポロ15号 ハドリー谷',   date: '1971-07-30', lat: 26.132, lon:   3.634 },
  { mission: 'Apollo 16', jp: 'アポロ16号 デカルト高地', date: '1972-04-21', lat: -8.973, lon:  15.501 },
  { mission: 'Apollo 17', jp: 'アポロ17号 タウルス・リトロー', date: '1972-12-11', lat: 20.190, lon:  30.770 }
];

// Convert selenographic (lat, lon in degrees) to a unit vector pointing out
// from the Moon's centre in a frame where +X=Moon's prime-meridian-equator,
// +Y=Moon's north pole, +Z=90°E equator. (Matches raDecToXYZ-style: lat→Y up.)
export function moonSurfacePoint(latDeg, lonDeg, R = 1) {
  const la = toRad(latDeg), lo = toRad(lonDeg);
  return {
    x: R * Math.cos(la) * Math.cos(lo),
    y: R * Math.sin(la),
    z: R * Math.cos(la) * Math.sin(lo)
  };
}

// ---------------------------------------------------------------------------
// 月の秤動 (Lunar libration)
// ---------------------------------------------------------------------------
// The Moon's rotation is "almost" synchronous, but small periodic wobbles
// reveal ~59% of its surface over time. We model just the dominant terms:
//   - Libration in longitude L ≈ −6.29° sin(Mp) + 1.27° sin(2D − Mp)
//   - Libration in latitude  B ≈ +6.69° sin(F) (with small Mp correction)
// (Approximation of Meeus Ch. 53; accurate to ~0.3° — enough to visibly nudge
// the limb features.)
export function lunarLibration(jd) {
  const T = centuriesSinceJ2000(jd);
  const D  = toRad(297.8501921 + 445267.1114034 * T); // mean elongation
  const M  = toRad(357.5291092 +  35999.0502909 * T); // Sun mean anomaly
  const Mp = toRad(134.9633964 + 477198.8675055 * T); // Moon mean anomaly
  const F  = toRad( 93.2720950 + 483202.0175233 * T); // argument of latitude
  // Dominant terms only — adding the higher-order corrections lets the sum
  // exceed the physical ±7° bound, so we keep just enough fidelity to make
  // the wobble visible without overshooting.
  const lLon = -6.29 * Math.sin(Mp) + 1.27 * Math.sin(2 * D - Mp);
  const lLat =  6.69 * Math.sin(F);
  return { lonDeg: lLon, latDeg: lLat };
}

// ---------------------------------------------------------------------------
// 歴史イベント (Notable astronomical events through history)
// ---------------------------------------------------------------------------
// Each entry: { iso, name, jp, hint, view, toggle, focus }.
//   iso     — UTC moment to jump to
//   name    — short label shown in the dropdown
//   jp      — full description for the persistent detail panel
//   hint    — one-line "what to look at" suggestion shown in the chip
//   view    — 'space' | 'japan' | 'solar' — view the simulator should switch to
//   toggle  — array of toggle-button IDs to turn ON (e.g. ['cometsBtn'])
//   focus   — string passed to the search box to highlight a body/constellation
export const HISTORICAL_EVENTS = [
  { iso: '1054-07-04T22:00:00Z', name: '🌟 かに星雲超新星 (SN 1054)',
    jp: '中国・日本の天文学者が記録した「客星」。23日間昼間も見えた歴史的大爆発。',
    hint: 'おうし座の方向に出現。日本ビューで南東の空を見上げよう。',
    view: 'japan', focus: 'おうし座' },
  { iso: '1066-04-24T22:00:00Z', name: '☄ ハレー彗星 1066年回帰',
    jp: 'ノルマン征服の年に出現。バイユーのタペストリーに描かれた歴史的回帰。',
    hint: '「有名な彗星」をONにして、ハレー彗星の位置を確認。',
    view: 'japan', toggle: ['cometsBtn'], focus: 'ハレー彗星' },
  { iso: '1572-11-11T20:00:00Z', name: '🌟 ティコの超新星 (SN 1572)',
    jp: 'Tycho Brahe が観測。アリストテレスの「不変の天界」観を打ち砕いた。',
    hint: 'カシオペヤ座に現れた超新星。北の空を見上げて。',
    view: 'japan', focus: 'カシオペヤ座' },
  { iso: '1604-10-09T18:00:00Z', name: '🌟 ケプラーの超新星 (SN 1604)',
    jp: '最後の銀河系内肉眼超新星。Kepler が詳細に観測。',
    hint: 'へびつかい座の方向。日没後、南西の低い空。',
    view: 'japan' },
  { iso: '1610-01-07T21:00:00Z', name: '🔭 ガリレオが木星の衛星を発見',
    jp: 'イオ・エウロパ・ガニメデ・カリストの「ガリレオ衛星」初観測。望遠鏡天文学の幕開け。',
    hint: '木星にフォーカス。当時ガリレオが見たのと同じ夜空。',
    view: 'japan', focus: '木星' },
  { iso: '1631-11-07T05:00:00Z', name: '☿ 水星の太陽面通過 (1631年)',
    jp: 'Pierre Gassendi が初観測。Kepler の予測通りに実現。',
    hint: '太陽の前を水星が横切る。太陽系ビューで内側を確認。',
    view: 'solar' },
  { iso: '1769-06-03T19:00:00Z', name: '♀ 金星の太陽面通過 (1769年)',
    jp: 'Cook の太平洋遠征で観測、太陽までの距離決定に貢献した世界協同観測。',
    hint: '太陽系ビューで金星が太陽と一直線に並ぶのを確認。',
    view: 'solar' },
  { iso: '1843-02-27T03:00:00Z', name: '☄ 大彗星 1843 (C/1843 D1)',
    jp: '昼間も見えた史上最大級の彗星。「サングレーザー」として太陽をかすめた。',
    hint: '彗星トグルON。',
    view: 'japan', toggle: ['cometsBtn'] },
  { iso: '1910-04-20T00:00:00Z', name: '☄ ハレー彗星 1910年回帰',
    jp: '地球がコマ尾を通過、青酸ガス騒動が起きた回帰。',
    hint: 'ハレー彗星にフォーカス。',
    view: 'japan', toggle: ['cometsBtn'], focus: 'ハレー彗星' },
  { iso: '1969-07-20T20:17:00Z', name: '🚀 アポロ11号 月面着陸',
    jp: 'Neil Armstrong & Buzz Aldrin が静かの海に着陸。人類初の月面歩行。',
    hint: '宇宙ビューで月にズーム。アポロ着陸点トグルONで6つの旗を表示。',
    view: 'space', toggle: ['apolloBtn'], focus: '月' },
  { iso: '1986-02-09T11:00:00Z', name: '☄ ハレー彗星 1986年近日点',
    jp: 'Vega・Giotto 探査機が接近観測した近代の回帰。一生に一度の天体ショー。',
    hint: 'ハレー彗星にフォーカス。',
    view: 'japan', toggle: ['cometsBtn'], focus: 'ハレー彗星' },
  { iso: '1994-07-16T20:00:00Z', name: '💥 シューメーカー・レヴィ第9彗星 木星衝突',
    jp: '木星に分裂彗星片が次々と衝突した観測史的事件。1週間にわたり衝突が続いた。',
    hint: '太陽系ビューで木星に注目。',
    view: 'solar', focus: '木星' },
  { iso: '1997-04-01T00:00:00Z', name: '☄ ヘール・ボップ彗星 近日点',
    jp: '20世紀後半最大の彗星。18か月にわたり肉眼で見えた、世代に一度の彗星。',
    hint: 'ヘール・ボップ彗星にフォーカス。',
    view: 'japan', toggle: ['cometsBtn'], focus: 'ヘール・ボップ彗星' },
  { iso: '2009-07-22T02:00:00Z', name: '🌑 トカラ皆既日食',
    jp: '日本のトカラ列島で6分40秒の皆既日食。21世紀最長クラス。',
    hint: '日本ビューで太陽が月に隠される瞬間。',
    view: 'japan', focus: '太陽' },
  { iso: '2020-12-21T18:30:00Z', name: '✨ 木星・土星 大接近',
    jp: '397年ぶりの「グレートコンジャンクション」。木星と土星がわずか0.1°まで接近。',
    hint: '日本ビューで南西の低空、木星と土星が重なる。',
    view: 'japan', focus: '木星' },
  { iso: '2024-04-08T18:18:00Z', name: '🌑 北米皆既日食',
    jp: 'メキシコ・米国・カナダを横断した皆既日食。',
    hint: '観測地を「ニューヨーク」に変えて見るとリアル！',
    view: 'japan', focus: '太陽' },
  { iso: '2024-10-12T00:00:00Z', name: '☄ 紫金山・ATLAS彗星 (C/2023 A3)',
    jp: '21世紀屈指の大彗星、夕空に長い尾を曳いた。',
    hint: '彗星トグルON。日没後の西の空に出現した。',
    view: 'japan', toggle: ['cometsBtn'] },
  { iso: '2061-07-28T12:00:00Z', name: '☄ ハレー彗星 次回回帰',
    jp: 'あなたが見られる次のハレー回帰。次々世代への贈り物。',
    hint: 'ハレー彗星にフォーカス。',
    view: 'japan', toggle: ['cometsBtn'], focus: 'ハレー彗星' }
];
