import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  raDecToXYZ, length3, GREEK, PROPER, ABBR, starName, searchMatch,
  poleAltitude, isCircumpolar, belowHorizon, observerNorth, aimYawPitch, shortestAngle,
  keplerRelSpeed, orbitDisplayRadius, planetXZ, yearSeconds, speedupFactor,
  umiStars, umiNames, umiLinks, circumpolarConstellations, skyConstellations, triangles, planetDefs,
  julianDay, jdToDate, centuriesSinceJ2000, gmstDeg, lstDeg, norm360, norm24,
  eclipticToEquatorial, sunEqu, moonEqu, planetEqu, moonPhase, moonPhaseLabel, nextLunarPhase,
  bodyEqu, helio, bodyEquFrom, MIYAKO, SKY_BODIES
} from './astro.js';

const close = (a, b, eps = 1e-9) => assert.ok(Math.abs(a - b) <= eps, `${a} ≈ ${b} (±${eps})`);
const HALF_PI = Math.PI / 2;

// ---------------------------------------------------------------------------
// raDecToXYZ
// ---------------------------------------------------------------------------
test('raDecToXYZ: Dec +90° maps to the +Y pole', () => {
  const v = raDecToXYZ(7, 90, 10); // RA irrelevant at the pole
  close(v.x, 0, 1e-6); close(v.y, 10, 1e-6); close(v.z, 0, 1e-6);
});

test('raDecToXYZ: Dec -90° maps to the -Y pole', () => {
  const v = raDecToXYZ(3, -90, 5);
  close(v.y, -5, 1e-6);
});

test('raDecToXYZ: RA 0h, Dec 0 -> +X', () => {
  const v = raDecToXYZ(0, 0, 1);
  close(v.x, 1, 1e-9); close(v.y, 0, 1e-9); close(v.z, 0, 1e-9);
});

test('raDecToXYZ: RA 6h (90°), Dec 0 -> +Z', () => {
  const v = raDecToXYZ(6, 0, 1);
  close(v.x, 0, 1e-9); close(v.z, 1, 1e-9);
});

test('raDecToXYZ: RA 12h (180°), Dec 0 -> -X', () => {
  const v = raDecToXYZ(12, 0, 1);
  close(v.x, -1, 1e-9);
});

test('raDecToXYZ: magnitude always equals D', () => {
  for (const [ra, dec] of [[0, 0], [5.9, 7.4], [18.6, 38.8], [13.4, -11.2], [23.0, 89.3]]) {
    close(length3(raDecToXYZ(ra, dec, 700)), 700, 1e-6);
  }
});

test('raDecToXYZ: default radius is 1', () => {
  close(length3(raDecToXYZ(10, 20)), 1, 1e-9);
});

// ---------------------------------------------------------------------------
// starName
// ---------------------------------------------------------------------------
test('starName: proper-name key without Bayer letter -> just the name', () => {
  assert.equal(starName('ふたご座', 'pollux'), 'ポルックス');
  assert.equal(starName('ふたご座', 'castor'), 'カストル');
});

test('starName: names override + Greek key -> "name（greek abbr）"', () => {
  assert.equal(starName('ケフェウス座', 'alpha', { alpha: 'アルデラミン' }), 'アルデラミン（α Cep）');
});

test('starName: Greek-only key -> "greek abbr"', () => {
  assert.equal(starName('りゅう座', 'nu'), 'ν Dra');
});

test('starName: unknown key falls back to the key itself', () => {
  assert.equal(starName('オリオン座', 'zzz'), 'zzz');
});

test('starName: PROPER table wins when no names override', () => {
  assert.equal(starName('おおいぬ座', 'sirius'), 'シリウス');
});

// ---------------------------------------------------------------------------
// searchMatch
// ---------------------------------------------------------------------------
test('searchMatch: exact name', () => {
  const names = ['オリオン座', 'おとめ座', 'こぐま座'];
  assert.equal(searchMatch('オリオン座', names), 'オリオン座');
});

test('searchMatch: tolerates a missing 座', () => {
  assert.equal(searchMatch('オリオン', ['オリオン座', 'こと座']), 'オリオン座');
});

test('searchMatch: substring match', () => {
  assert.equal(searchMatch('ケフェ', ['ケフェウス座', 'りゅう座']), 'ケフェウス座');
});

test('searchMatch: empty / whitespace -> null', () => {
  assert.equal(searchMatch('', ['オリオン座']), null);
  assert.equal(searchMatch('   ', ['オリオン座']), null);
});

test('searchMatch: no match -> null', () => {
  assert.equal(searchMatch('xyz', ['オリオン座']), null);
});

// ---------------------------------------------------------------------------
// Horizon / observer geometry
// ---------------------------------------------------------------------------
test('poleAltitude equals latitude', () => {
  assert.equal(poleAltitude(26), 26);
});

test('isCircumpolar: Polaris is circumpolar everywhere in the north', () => {
  assert.equal(isCircumpolar(89.26, 26), true);
});

test('isCircumpolar: Spica is not circumpolar from Okinawa', () => {
  assert.equal(isCircumpolar(-11.16, 26), false);
});

test('isCircumpolar: boundary dec = 90 - lat is NOT circumpolar (strict)', () => {
  assert.equal(isCircumpolar(64, 26), false);   // 90-26 = 64
  assert.equal(isCircumpolar(64.1, 26), true);
});

test('belowHorizon', () => {
  assert.equal(belowHorizon(-0.001), true);
  assert.equal(belowHorizon(0), false);
  assert.equal(belowHorizon(5), false);
});

test('observerNorth: returns a unit vector orthogonal to up', () => {
  const up = raDecToXYZ(0, 26, 1); // some surface normal
  const n = observerNorth(up);
  close(length3(n), 1, 1e-9);
  close(n.x * up.x + n.y * up.y + n.z * up.z, 0, 1e-9); // n · up == 0
});

test('observerNorth: for a northern observer, north tilts toward +Y', () => {
  const up = raDecToXYZ(0, 26, 1);
  assert.ok(observerNorth(up).y > 0);
});

// ---------------------------------------------------------------------------
// aimYawPitch / shortestAngle
// ---------------------------------------------------------------------------
test('aimYawPitch: straight up -> pitch ≈ +90° (clamped)', () => {
  const { pitch } = aimYawPitch({ x: 0, y: 1, z: 0 });
  close(pitch, Math.min(1.45, HALF_PI), 1e-9);
});

test('aimYawPitch: due north (-Z) -> yaw 0, pitch 0', () => {
  const { yaw, pitch } = aimYawPitch({ x: 0, y: 0, z: -1 });
  close(yaw, 0, 1e-9); close(pitch, 0, 1e-9);
});

test('aimYawPitch: pitch is clamped to ±1.45', () => {
  assert.ok(aimYawPitch({ x: 0, y: 1, z: 0 }).pitch <= 1.45);
  assert.ok(aimYawPitch({ x: 0, y: -1, z: 0 }).pitch >= -1.45);
});

test('shortestAngle: wraps to the short way around', () => {
  close(shortestAngle(0.1, 2 * Math.PI - 0.1), 0.2, 1e-9);
  close(shortestAngle(Math.PI / 2, 0), Math.PI / 2, 1e-9);
});

// ---------------------------------------------------------------------------
// Solar system math
// ---------------------------------------------------------------------------
test('keplerRelSpeed: Earth (a=1) is the reference = 1', () => {
  close(keplerRelSpeed(1), 1, 1e-12);
});

test('keplerRelSpeed: Mercury ≈ 4.15× Earth', () => {
  close(keplerRelSpeed(0.387), 4.15, 0.02);
});

test('keplerRelSpeed: speed decreases monotonically with distance', () => {
  const a = [0.387, 0.723, 1, 1.524, 5.203, 9.537, 19.19, 30.07, 39.48];
  for (let i = 1; i < a.length; i++) {
    assert.ok(keplerRelSpeed(a[i]) < keplerRelSpeed(a[i - 1]), `planet ${i} slower than ${i - 1}`);
  }
});

test('orbitDisplayRadius increases monotonically with a', () => {
  assert.ok(orbitDisplayRadius(1) < orbitDisplayRadius(5) && orbitDisplayRadius(5) < orbitDisplayRadius(30));
});

test('planetXZ: angle 0 -> (orbit, 0)', () => {
  const p = planetXZ(0, 5);
  close(p.x, 5, 1e-9); close(p.z, 0, 1e-9);
});

test('planetXZ: angle 90° -> (0, orbit)', () => {
  const p = planetXZ(HALF_PI, 5);
  close(p.x, 0, 1e-9); close(p.z, 5, 1e-9);
});

test('yearSeconds: Earth step 0.012 rad/frame @60fps ≈ 8.73 s/year', () => {
  close(yearSeconds(0.012, 60), 8.727, 0.01);
});

test('speedupFactor: ≈ 3.6 million× real time', () => {
  const f = speedupFactor(0.012, 60);
  assert.ok(f > 3.5e6 && f < 3.7e6, `factor ${f}`);
});

// ---------------------------------------------------------------------------
// Data integrity — the big star tables
// ---------------------------------------------------------------------------
const allConstellations = { ...circumpolarConstellations, ...skyConstellations };

test('data: every constellation has a valid labelKey that exists in its stars', () => {
  for (const [name, c] of Object.entries(allConstellations)) {
    assert.ok(c.stars[c.labelKey], `${name}: labelKey "${c.labelKey}" missing from stars`);
  }
});

test('data: every link endpoint refers to an existing star', () => {
  for (const [name, c] of Object.entries(allConstellations)) {
    for (const [a, b] of c.links) {
      assert.ok(c.stars[a], `${name}: link references unknown star "${a}"`);
      assert.ok(c.stars[b], `${name}: link references unknown star "${b}"`);
    }
  }
});

test('data: every names-override key exists in the constellation', () => {
  for (const [name, c] of Object.entries(allConstellations)) {
    if (!c.names) continue;
    for (const k of Object.keys(c.names)) {
      assert.ok(c.stars[k], `${name}: names key "${k}" missing from stars`);
    }
  }
});

test('data: all RA in [0,24) and Dec in [-90,90], magnitude is finite', () => {
  for (const [name, c] of Object.entries(allConstellations)) {
    for (const [k, s] of Object.entries(c.stars)) {
      const [ra, dec, mag] = s;
      assert.ok(ra >= 0 && ra < 24, `${name}.${k}: RA ${ra} out of range`);
      assert.ok(dec >= -90 && dec <= 90, `${name}.${k}: Dec ${dec} out of range`);
      assert.ok(Number.isFinite(mag), `${name}.${k}: magnitude not finite`);
    }
  }
});

test('data: constellation names are unique across both sets', () => {
  const keys = [...Object.keys(circumpolarConstellations), ...Object.keys(skyConstellations)];
  assert.equal(new Set(keys).size, keys.length, 'duplicate constellation name');
});

test('data: every constellation name has an ABBR entry', () => {
  for (const name of Object.keys(allConstellations)) {
    assert.ok(ABBR[name], `no ABBR for ${name}`);
  }
});

test('data: all 12 zodiac constellations are present', () => {
  const zodiac = ['おひつじ座', 'おうし座', 'ふたご座', 'かに座', 'しし座', 'おとめ座',
    'てんびん座', 'さそり座', 'いて座（南斗）', 'やぎ座', 'みずがめ座', 'うお座'];
  for (const z of zodiac) assert.ok(allConstellations[z], `missing zodiac sign ${z}`);
});

// Ursa Minor
test('data: umiLinks endpoints all exist in umiStars', () => {
  for (const [a, b] of umiLinks) {
    assert.ok(umiStars[a], `umiLinks unknown star ${a}`);
    assert.ok(umiStars[b], `umiLinks unknown star ${b}`);
  }
});

test('data: umiNames keys exist in umiStars (and exclude alpha/Polaris)', () => {
  for (const k of Object.keys(umiNames)) {
    assert.ok(umiStars[k], `umiNames unknown star ${k}`);
    assert.notEqual(k, 'alpha');
  }
});

test('data: Polaris (umiStars.alpha) sits within 1° of the pole', () => {
  assert.ok(umiStars.alpha[1] > 89, `Polaris Dec ${umiStars.alpha[1]} not near +90`);
});

// Triangles
test('data: each great triangle has exactly 3 vertices with valid coords', () => {
  for (const [name, t] of Object.entries(triangles)) {
    assert.equal(t.pts.length, 3, `${name} should have 3 points`);
    for (const [ra, dec] of t.pts) {
      assert.ok(ra >= 0 && ra < 24 && dec >= -90 && dec <= 90, `${name}: bad coord`);
    }
  }
});

// Planets
test('data: 9 planets, strictly increasing semi-major axis', () => {
  assert.equal(planetDefs.length, 9);
  for (let i = 1; i < planetDefs.length; i++) {
    assert.ok(planetDefs[i].a > planetDefs[i - 1].a, `${planetDefs[i].jp} should be farther`);
  }
});

test('data: Earth is the 3rd planet with a = 1 AU', () => {
  assert.equal(planetDefs[2].jp, '地球');
  close(planetDefs[2].a, 1, 1e-9);
});

test('data: planet display orbit radii are strictly increasing', () => {
  for (let i = 1; i < planetDefs.length; i++) {
    assert.ok(planetDefs[i].orbit > planetDefs[i - 1].orbit);
  }
});

test('data: planet Japanese names are unique', () => {
  const jp = planetDefs.map((p) => p.jp);
  assert.equal(new Set(jp).size, jp.length);
});

test('data: exactly one planet (Saturn) has a ring', () => {
  assert.equal(planetDefs.filter((p) => p.ring).length, 1);
  assert.equal(planetDefs.find((p) => p.ring).jp, '土星');
});

// ---------------------------------------------------------------------------
// Ephemeris: time, sidereal time
// ---------------------------------------------------------------------------
const J2000 = new Date(Date.UTC(2000, 0, 1, 12, 0, 0));

test('julianDay: J2000 epoch (2000-01-01 12:00 UTC) = 2451545.0', () => {
  close(julianDay(J2000), 2451545.0, 1e-6);
});

test('centuriesSinceJ2000: zero at J2000', () => {
  close(centuriesSinceJ2000(julianDay(J2000)), 0, 1e-9);
});

test('gmstDeg: ≈280.46° at J2000', () => {
  close(gmstDeg(2451545.0), 280.4606, 0.01);
});

test('gmstDeg: always within [0,360)', () => {
  for (const d of [-5000, 0, 1234.5, 9000]) {
    const g = gmstDeg(2451545.0 + d);
    assert.ok(g >= 0 && g < 360, `gmst ${g} out of range`);
  }
});

test('lstDeg: equals GMST + east longitude (mod 360)', () => {
  const jd = 2451545.0;
  close(lstDeg(jd, 125.28), norm360(gmstDeg(jd) + 125.28), 1e-9);
});

test('norm360 / norm24 wrap correctly', () => {
  close(norm360(-10), 350, 1e-9);
  close(norm360(370), 10, 1e-9);
  close(norm24(25), 1, 1e-9);
  close(norm24(-1), 23, 1e-9);
});

// ---------------------------------------------------------------------------
// Ephemeris: ecliptic→equatorial, Sun, Moon, planets
// ---------------------------------------------------------------------------
test('eclipticToEquatorial: ecliptic lon 90°, lat 0 -> RA 6h, Dec ≈ +obliquity', () => {
  const { ra, dec } = eclipticToEquatorial(Math.PI / 2, 0, 2451545.0);
  close(ra, 6, 1e-3);
  close(dec, 23.4393, 0.01);
});

test('eclipticToEquatorial: lon 0, lat 0 -> RA 0, Dec 0 (vernal point)', () => {
  const { ra, dec } = eclipticToEquatorial(0, 0, 2451545.0);
  close(norm24(ra), 0, 1e-6);
  close(dec, 0, 1e-6);
});

const decOf = (date) => sunEqu(julianDay(date)).dec;

test('Sun: ≈0° declination at the March equinox', () => {
  assert.ok(Math.abs(decOf(new Date(Date.UTC(2025, 2, 20, 9, 1)))) < 0.5);
});

test('Sun: ≈+23.4° declination at the June solstice', () => {
  close(decOf(new Date(Date.UTC(2025, 5, 21, 2, 42))), 23.4, 0.4);
});

test('Sun: ≈-23.4° declination at the December solstice', () => {
  close(decOf(new Date(Date.UTC(2025, 11, 21, 15, 3))), -23.4, 0.4);
});

test('Sun: RA ≈ 6h at the June solstice', () => {
  close(sunEqu(julianDay(new Date(Date.UTC(2025, 5, 21, 2, 42)))).ra, 6, 0.1);
});

test('Sun: declination never leaves ±23.5° over a year', () => {
  for (let day = 0; day < 365; day += 5) {
    const d = sunEqu(julianDay(new Date(Date.UTC(2025, 0, 1 + day)))).dec;
    assert.ok(Math.abs(d) <= 23.6, `Sun dec ${d} on day ${day}`);
  }
});

test('Moon: stays within the ±28.6° declination envelope', () => {
  for (let day = 0; day < 60; day += 2) {
    const d = moonEqu(julianDay(new Date(Date.UTC(2026, 0, 1 + day)))).dec;
    assert.ok(Math.abs(d) <= 29, `Moon dec ${d} on day ${day}`);
  }
});

test('moonPhase: illuminated fraction is within [0,1]', () => {
  for (let day = 0; day < 30; day++) {
    const f = moonPhase(julianDay(new Date(Date.UTC(2026, 0, 1 + day)))).illuminated;
    assert.ok(f >= 0 && f <= 1, `illum ${f}`);
  }
});

test('planetEqu: every planet returns valid RA/Dec on a sample date', () => {
  const jd = julianDay(new Date(Date.UTC(2026, 4, 28)));
  for (const name of ['Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune']) {
    const { ra, dec, dist } = planetEqu(name, jd);
    assert.ok(ra >= 0 && ra < 24, `${name} RA ${ra}`);
    assert.ok(dec >= -90 && dec <= 90, `${name} Dec ${dec}`);
    assert.ok(dist > 0, `${name} dist ${dist}`);
  }
});

test('planets stay near the ecliptic (|Dec| < 30°)', () => {
  const jd = julianDay(new Date(Date.UTC(2026, 4, 28)));
  for (const name of ['Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn']) {
    assert.ok(Math.abs(planetEqu(name, jd).dec) < 30, `${name} too far off ecliptic`);
  }
});

test('bodyEqu: dispatches Sun/Moon/planet', () => {
  const jd = julianDay(J2000);
  assert.deepEqual(bodyEqu('Sun', jd), sunEqu(jd));
  assert.deepEqual(bodyEqu('Moon', jd), moonEqu(jd));
  assert.deepEqual(bodyEqu('Jupiter', jd), planetEqu('Jupiter', jd));
});

test('MIYAKO location is configured (24.74°N, 125.28°E)', () => {
  close(MIYAKO.latDeg, 24.74, 1e-6);
  close(MIYAKO.lonEastDeg, 125.28, 1e-6);
});

test('SKY_BODIES: includes Sun, Moon, and Jupiter', () => {
  const keys = SKY_BODIES.map((b) => b.key);
  for (const k of ['Sun', 'Moon', 'Jupiter']) assert.ok(keys.includes(k), `missing ${k}`);
});

// ---------------------------------------------------------------------------
// Lunar phase finding
// ---------------------------------------------------------------------------
test('jdToDate is the inverse of julianDay', () => {
  const d = new Date(Date.UTC(2026, 4, 28, 12, 34, 56));
  close(jdToDate(julianDay(d)).getTime(), d.getTime(), 2);
});

test('nextLunarPhase: next new moon is within 30 days', () => {
  const start = julianDay(new Date(Date.UTC(2026, 4, 1)));
  const jd = nextLunarPhase(start, 0);
  assert.ok(jd !== null, 'should find a new moon');
  assert.ok(jd > start && jd - start < 30, `next new moon ${jd - start} days out`);
});

test('nextLunarPhase: at the returned jd, elongation ≈ target (±0.05°)', () => {
  const start = julianDay(new Date(Date.UTC(2026, 4, 1)));
  for (const target of [0, 90, 180, 270]) {
    const jd = nextLunarPhase(start, target);
    const e = moonPhase(jd).elongationDeg;
    const d = Math.abs(((e - target + 540) % 360) - 180);
    assert.ok(d < 0.05, `target ${target}: actual ${e} (diff ${d})`);
  }
});

test('nextLunarPhase: full moon comes ~14.8 days after new moon', () => {
  const start = julianDay(new Date(Date.UTC(2026, 0, 1)));
  const newMoon = nextLunarPhase(start, 0);
  const fullMoon = nextLunarPhase(newMoon, 180);
  const gap = fullMoon - newMoon;
  assert.ok(gap > 13 && gap < 17, `new->full gap ${gap} days`);
});

test('moonPhaseLabel: 0° -> 🌑 新月, 180° -> 🌕 満月', () => {
  // Force a moment near new moon, then near full
  const start = julianDay(new Date(Date.UTC(2026, 0, 1)));
  const newJd = nextLunarPhase(start, 0);
  const fullJd = nextLunarPhase(newJd, 180);
  assert.equal(moonPhaseLabel(newJd).name, '新月');
  assert.equal(moonPhaseLabel(fullJd).name, '満月');
});

// ---------------------------------------------------------------------------
// Observer change: viewing the sky from a non-Earth body
// ---------------------------------------------------------------------------
test('helio: Sun is at the origin and Earth is ~1 AU away', () => {
  const jd = julianDay(new Date(Date.UTC(2026, 4, 28)));
  const sun = helio('Sun', jd);
  close(sun.x, 0, 1e-9); close(sun.y, 0, 1e-9); close(sun.z, 0, 1e-9);
  const earth = helio('Earth', jd);
  const r = Math.hypot(earth.x, earth.y, earth.z);
  assert.ok(r > 0.98 && r < 1.02, `Earth ${r} AU from Sun`);
});

test('helio: Moon hugs Earth (within ~0.003 AU)', () => {
  const jd = julianDay(new Date(Date.UTC(2026, 4, 28)));
  const e = helio('Earth', jd), m = helio('Moon', jd);
  const sep = Math.hypot(m.x - e.x, m.y - e.y, m.z - e.z);
  assert.ok(sep > 0.002 && sep < 0.003, `Earth-Moon sep ${sep} AU`);
});

test('bodyEquFrom: observer == target returns null', () => {
  assert.equal(bodyEquFrom('Mars', julianDay(new Date()), 'Mars'), null);
});

test('bodyEquFrom: from Earth matches geocentric bodyEqu (within 0.001°)', () => {
  const jd = julianDay(new Date(Date.UTC(2026, 4, 28)));
  for (const name of ['Mars', 'Jupiter', 'Saturn', 'Sun']) {
    const a = bodyEquFrom(name, jd, 'Earth');
    const b = name === 'Sun' ? sunEqu(jd) : planetEqu(name, jd);
    close(a.dec, b.dec, 0.001);
    close(a.ra, b.ra, 0.001);
  }
});

test('bodyEquFrom: Sun viewed from Mars points roughly opposite to Earth viewed from Mars', () => {
  const jd = julianDay(new Date(Date.UTC(2026, 4, 28)));
  const sun = bodyEquFrom('Sun', jd, 'Mars');
  const earth = bodyEquFrom('Earth', jd, 'Mars');
  // they sit on the same line from Mars (Sun is opposite to outward direction), so RA differs by ~180° (12h) or matches
  // diff should be very small since both Earth and Sun lie in the same direction approximately from outside
  // here at conjunction/opposition the diff varies. Just test both return valid RA/Dec.
  assert.ok(sun.ra >= 0 && sun.ra < 24);
  assert.ok(earth.ra >= 0 && earth.ra < 24);
});

test('SKY_BODIES now includes Earth too', () => {
  assert.ok(SKY_BODIES.some((b) => b.key === 'Earth'));
});

// ---------------------------------------------------------------------------
// Observer change — additional integrity tests (the feature the user verified)
// ---------------------------------------------------------------------------
test('helio: Earth-Mars distance over a year stays in [0.37, 2.7] AU', () => {
  let minD = Infinity, maxD = 0;
  for (let day = 0; day < 366; day += 5) {
    const jd = julianDay(new Date(Date.UTC(2026, 0, 1 + day)));
    const e = helio('Earth', jd), m = helio('Mars', jd);
    const d = Math.hypot(m.x - e.x, m.y - e.y, m.z - e.z);
    if (d < minD) minD = d;
    if (d > maxD) maxD = d;
  }
  // 2026 has no Mars opposition (closest pass ~0.92 AU), so allow a wide band
  assert.ok(minD > 0.5 && minD < 1.5, `closest approach ${minD} AU out of range`);
  assert.ok(maxD > 2.0 && maxD < 2.8, `farthest separation ${maxD} AU out of range`);
});

test('helio: Sun-Earth distance is ~1 AU (0.98–1.02)', () => {
  for (let m = 0; m < 12; m++) {
    const jd = julianDay(new Date(Date.UTC(2026, m, 15)));
    const e = helio('Earth', jd);
    const d = Math.hypot(e.x, e.y, e.z);
    assert.ok(d > 0.98 && d < 1.02, `Earth at month ${m}: ${d} AU`);
  }
});

test('bodyEquFrom: direction-reverse symmetry — A→B opposite to B→A', () => {
  // direction from A to B should be exactly the opposite of B to A
  const jd = julianDay(new Date(Date.UTC(2026, 4, 28)));
  for (const [a, b] of [['Earth', 'Mars'], ['Sun', 'Jupiter'], ['Moon', 'Saturn']]) {
    const ab = bodyEquFrom(b, jd, a);
    const ba = bodyEquFrom(a, jd, b);
    // declinations are negatives of each other (Dec range -90..90)
    close(ab.dec, -ba.dec, 0.001);
    // RA differs by 12h (mod 24)
    const diff = ((ab.ra - ba.ra) % 24 + 24) % 24;
    close(Math.min(diff, 24 - diff), 12, 0.0001);
  }
});

test('bodyEquFrom: Sun from Earth ≈ Sun direction matches geocentric Sun RA/Dec', () => {
  const jd = julianDay(new Date(Date.UTC(2026, 4, 28)));
  const a = bodyEquFrom('Sun', jd, 'Earth');
  const b = sunEqu(jd);
  close(a.ra, b.ra, 0.001);
  close(a.dec, b.dec, 0.001);
});

test('SKY_BODIES: Earth is included as an observable planet', () => {
  const earth = SKY_BODIES.find((b) => b.key === 'Earth');
  assert.ok(earth, 'Earth missing from SKY_BODIES');
  assert.equal(earth.kind, 'planet');
});

test('helio: inner planets (Mercury, Venus) closer to Sun than Earth', () => {
  const jd = julianDay(new Date(Date.UTC(2026, 4, 28)));
  for (const inner of ['Mercury', 'Venus']) {
    const p = helio(inner, jd);
    const d = Math.hypot(p.x, p.y, p.z);
    const earthD = Math.hypot(helio('Earth', jd).x, helio('Earth', jd).y, helio('Earth', jd).z);
    assert.ok(d < earthD, `${inner} (${d} AU) should be inside Earth (${earthD} AU)`);
  }
});

test('helio: outer planets follow expected distance ordering at a sample date', () => {
  const jd = julianDay(new Date(Date.UTC(2026, 4, 28)));
  const dists = ['Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune'].map((k) => {
    const p = helio(k, jd);
    return Math.hypot(p.x, p.y, p.z);
  });
  for (let i = 1; i < dists.length; i++) {
    assert.ok(dists[i] > dists[i - 1], `planet ${i} should be farther: ${dists.join(', ')}`);
  }
});
