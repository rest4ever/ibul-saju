// 사주 상세 분석 — 2026-10-05 조사(명리 규칙 정리 보고서) 기준. 학파마다 갈리는 것은 이 사이트 기준을 화면에 밝힌다.
export const STEMS = ['갑', '을', '병', '정', '무', '기', '경', '신', '임', '계'];
export const BRANCHES = ['자', '축', '인', '묘', '진', '사', '오', '미', '신', '유', '술', '해'];
export const HANJA_S = {갑: '甲', 을: '乙', 병: '丙', 정: '丁', 무: '戊', 기: '己', 경: '庚', 신: '辛', 임: '壬', 계: '癸'};
export const HANJA_B = {자: '子', 축: '丑', 인: '寅', 묘: '卯', 진: '辰', 사: '巳', 오: '午', 미: '未', 신: '申', 유: '酉', 술: '戌', 해: '亥'};
export const STEM_EL = {갑: '목', 을: '목', 병: '화', 정: '화', 무: '토', 기: '토', 경: '금', 신: '금', 임: '수', 계: '수'};
export const BRANCH_EL = {자: '수', 축: '토', 인: '목', 묘: '목', 진: '토', 사: '화', 오: '화', 미: '토', 신: '금', 유: '금', 술: '토', 해: '수'};
const YANG = new Set(['갑', '병', '무', '경', '임']);
const GEN = {목: '화', 화: '토', 토: '금', 금: '수', 수: '목'};
const CTRL = {목: '토', 토: '수', 수: '화', 화: '금', 금: '목'};
const GEN_BY = {화: '목', 토: '화', 금: '토', 수: '금', 목: '수'};
const CTRL_BY = {토: '목', 수: '토', 화: '수', 금: '화', 목: '금'};
// 지지 속 주된 글자(정기)
export const BRANCH_MAIN = {자: '계', 축: '기', 인: '갑', 묘: '을', 진: '무', 사: '병', 오: '정', 미: '기', 신: '경', 유: '신', 술: '무', 해: '임'};
// 지장간 (한국식 표, 위키백과 '지장간') — [천간, 일수]
export const JIJANG = {
  자: [['임', 10], ['계', 20]], 축: [['계', 9], ['신', 3], ['기', 18]], 인: [['무', 7], ['병', 7], ['갑', 16]],
  묘: [['갑', 10], ['을', 20]], 진: [['을', 9], ['계', 3], ['무', 18]], 사: [['무', 7], ['경', 7], ['병', 16]],
  오: [['병', 10], ['기', 9], ['정', 11]], 미: [['정', 9], ['을', 3], ['기', 18]], 신: [['무', 7], ['임', 7], ['경', 16]],
  유: [['경', 10], ['신', 20]], 술: [['신', 9], ['정', 3], ['무', 18]], 해: [['무', 7], ['갑', 7], ['임', 16]],
};
export const GROUP = {비견: '비겁', 겁재: '비겁', 식신: '식상', 상관: '식상', 편재: '재성', 정재: '재성', 편관: '관성', 정관: '관성', 편인: '인성', 정인: '인성'};
export const GROUPS = ['비겁', '식상', '재성', '관성', '인성'];

export function sipsin(me, o) {
  const a = STEM_EL[me], b = STEM_EL[o], same = YANG.has(me) === YANG.has(o);
  if (a === b) return same ? '비견' : '겁재';
  if (GEN[a] === b) return same ? '식신' : '상관';
  if (CTRL[a] === b) return same ? '편재' : '정재';
  if (CTRL[b] === a) return same ? '편관' : '정관';
  return same ? '편인' : '정인';
}
export const branchSipsin = (me, br) => sipsin(me, BRANCH_MAIN[br]);
// 일간 기준으로 어떤 오행이 어떤 무리인지
export function groupEl(me) {
  const e = STEM_EL[me];
  return {비겁: e, 식상: GEN[e], 재성: CTRL[e], 관성: CTRL_BY[e], 인성: GEN_BY[e]};
}

// 12운성 (화토동법, 음간 역행)
const STAGES = ['장생', '목욕', '관대', '건록', '제왕', '쇠', '병', '사', '묘', '절', '태', '양'];
const JANGSAENG = {갑: '해', 병: '인', 무: '인', 경: '사', 임: '신', 을: '오', 정: '유', 기: '유', 신: '자', 계: '묘'};
export function unseong(stem, br) {
  const dir = YANG.has(stem) ? 1 : -1;
  const i = (((BRANCHES.indexOf(br) - BRANCHES.indexOf(JANGSAENG[stem])) * dir) % 12 + 12) % 12;
  return STAGES[i];
}

// ---------- 원국 분석 ----------
// p: {year:'경오', month:'신사', day:'경진', hour:'계미'|null}
const POS = [['년간', 'year', 0, 10], ['년지', 'year', 1, 10], ['월간', 'month', 0, 10], ['월지', 'month', 1, 30],
  ['일지', 'day', 1, 15], ['시간', 'hour', 0, 10], ['시지', 'hour', 1, 15]];
export function analyze(p) {
  const me = p.day[0];
  const chars = [];   // 일간 뺀 7글자
  for (const [name, k, i, w] of POS) {
    if (!p[k]) continue;
    const ch = p[k][i];
    const ss = i === 0 ? sipsin(me, ch) : branchSipsin(me, ch);
    chars.push({name, ch, kind: i === 0 ? 'stem' : 'branch', ss, g: GROUP[ss], w, el: i === 0 ? STEM_EL[ch] : BRANCH_EL[ch]});
  }
  const gcount = {비겁: 0, 식상: 0, 재성: 0, 관성: 0, 인성: 0};
  chars.forEach((c) => gcount[c.g]++);
  // 신강·신약: 자리별 점수(월지 30, 일지·시지 15, 나머지 10) 중 나를 돕는 글자(인성·비겁)가 차지하는 비율
  const tot = chars.reduce((s, c) => s + c.w, 0);
  const help = chars.filter((c) => c.g === '인성' || c.g === '비겁').reduce((s, c) => s + c.w, 0);
  const score = Math.round((help / tot) * 100);
  const deukryeong = chars.some((c) => c.name === '월지' && (c.g === '인성' || c.g === '비겁'));
  const deukji = chars.some((c) => c.name === '일지' && (c.g === '인성' || c.g === '비겁'));
  // 기준점: 6천 명 무작위 시험에서 이 점수의 중앙값이 40이라, 45 이상 신강 / 35 미만 신약 / 그 사이 중화 (이 사이트 기준)
  const strength = score >= 45 ? '신강' : score < 35 ? '신약' : '중화';
  // 용신 (억부 간단 판단 — 이 사이트 기준)
  const GE = groupEl(me);
  let yongG, why;
  if (strength === '신강') {
    if (gcount.인성 > gcount.비겁) { yongG = '재성'; why = '나를 돕는 인성이 넘쳐서, 인성을 눌러 주는 재성을 씀'; }
    else if (gcount.관성 >= 1) { yongG = '관성'; why = '나와 같은 비겁이 넘쳐서, 비겁을 다스리는 관성을 씀'; }
    else { yongG = '식상'; why = '나와 같은 비겁이 넘쳐서, 힘을 밖으로 빼 주는 식상을 씀'; }
  } else if (strength === '신약') {
    const maxOut = Math.max(gcount.식상, gcount.재성, gcount.관성);
    if (gcount.재성 === maxOut && gcount.재성 > gcount.관성) { yongG = '비겁'; why = '돈(재성)이 내 힘보다 많아서, 나를 받쳐 주는 비겁을 씀'; }
    else { yongG = '인성'; why = gcount.관성 >= gcount.식상 ? '나를 누르는 관성이 많아서, 관성의 힘을 나에게로 돌려주는 인성을 씀' : '힘을 빼는 식상이 많아서, 나를 채워 주는 인성을 씀'; }
  } else {
    const cnt = elCount(p);
    const least = ['목', '화', '토', '금', '수'].sort((a, b) => cnt[a] - cnt[b])[0];
    yongG = Object.keys(GE).find((g) => GE[g] === least); why = '균형이 잡힌 편이라, 가장 부족한 기운을 채우는 쪽으로 봄';
  }
  const yong = GE[yongG];
  const hee = GEN_BY[yong];      // 용신을 살리는 기운
  const gi = CTRL_BY[yong];      // 용신을 누르는 기운
  const gu = GEN_BY[gi];         // 기신을 돕는 기운
  return {me, chars, gcount, score, strength, deukryeong, deukji, yongG, yong, hee, gi, gu, why, GE};
}
export function elCount(p) {
  const c = {목: 0, 화: 0, 토: 0, 금: 0, 수: 0};
  [p.year, p.month, p.day, p.hour].filter(Boolean).forEach((x) => { c[STEM_EL[x[0]]]++; c[BRANCH_EL[x[1]]]++; });
  return c;
}
// 어떤 오행이 나에게 어떤 기운인지: 'yong' | 'hee' | 'gi' | 'gu' | 'han'(한신)
export function elRole(A, el) {
  if (el === A.yong) return 'yong';
  if (el === A.hee) return 'hee';
  if (el === A.gi) return 'gi';
  if (el === A.gu) return 'gu';
  return 'han';
}

// ---------- 합·충 ----------
const STEM_HAP = [['갑', '기', '토'], ['을', '경', '금'], ['병', '신', '수'], ['정', '임', '목'], ['무', '계', '화']];
const YUKHAP = [['자', '축'], ['인', '해'], ['묘', '술'], ['진', '유'], ['사', '신'], ['오', '미']];
const CHUNG = [['자', '오'], ['축', '미'], ['인', '신'], ['묘', '유'], ['진', '술'], ['사', '해']];
const HAE = [['자', '미'], ['축', '오'], ['인', '사'], ['묘', '진'], ['신', '해'], ['유', '술']];
const SAMHAP = [['신', '자', '진', '수'], ['인', '오', '술', '화'], ['사', '유', '축', '금'], ['해', '묘', '미', '목']];
const pairIn = (L, a, b) => L.some(([x, y]) => (x === a && y === b) || (x === b && y === a));
export function stemHap(a, b) { const h = STEM_HAP.find(([x, y]) => (x === a && y === b) || (x === b && y === a)); return h ? h[2] : null; }
export function branchRel(a, b) {
  if (a === b) return null;
  if (pairIn(YUKHAP, a, b)) return '합';
  if (pairIn(CHUNG, a, b)) return '충';
  const s = SAMHAP.find((g) => g.includes(a) && g.includes(b));
  if (s && (s[1] === a || s[1] === b)) return '반합';
  if (pairIn(HAE, a, b)) return '해';
  return null;
}
// 원국 안의 합·충
export function innerRelations(p) {
  const pos = [['년', p.year], ['월', p.month], ['일', p.day], ['시', p.hour]].filter(([, v]) => v);
  const out = [];
  for (let i = 0; i < pos.length; i++) for (let j = i + 1; j < pos.length; j++) {
    const [na, a] = pos[i], [nb, b] = pos[j];
    const h = stemHap(a[0], b[0]);
    if (h) out.push({kind: '천간합', text: `${na}간 ${a[0]}·${nb}간 ${b[0]} 합 (${h} 기운)`});
    const r = branchRel(a[1], b[1]);
    if (r && r !== '해') out.push({kind: r, text: `${na}지 ${a[1]}·${nb}지 ${b[1]} ${r}`});
  }
  // 삼합 완성
  const brs = pos.map(([, v]) => v[1]);
  SAMHAP.forEach((g) => { if (g.slice(0, 3).every((x) => brs.includes(x))) out.push({kind: '삼합', text: `${g.slice(0, 3).join('·')} 삼합 (${g[3]} 기운 국)`}); });
  return out;
}

// ---------- 신살 ----------
const SAL3 = [[['신', '자', '진'], '유', '인', '진'], [['인', '오', '술'], '묘', '신', '술'], [['사', '유', '축'], '오', '해', '축'], [['해', '묘', '미'], '자', '사', '미']];
const CHEONEUL = {갑: ['축', '미'], 무: ['축', '미'], 경: ['축', '미'], 을: ['자', '신'], 기: ['자', '신'], 병: ['해', '유'], 정: ['해', '유'], 신: ['인', '오'], 임: ['묘', '사'], 계: ['묘', '사']};
const MUNCHANG = {갑: '사', 을: '오', 병: '신', 정: '유', 무: '신', 기: '유', 경: '해', 신: '자', 임: '인', 계: '묘'};
const YANGIN = {갑: '묘', 병: '오', 무: '오', 경: '유', 임: '자'};
const GOEGANG = ['경진', '임진', '경술', '임술'];
const BAEKHO = ['무진', '정축', '병술', '을미', '갑진', '계축', '임술'];
export function salOf(baseBranch) {   // 기준 지지 → {도화, 역마, 화개}
  const g = SAL3.find(([grp]) => grp.includes(baseBranch));
  return {도화: g[1], 역마: g[2], 화개: g[3]};
}
export function sinsal(p) {
  const me = p.day[0];
  const brs = [['년지', p.year[1]], ['월지', p.month[1]], ['일지', p.day[1]], ...(p.hour ? [['시지', p.hour[1]]] : [])];
  const found = [];
  // 도화·역마·화개: 이 사이트는 일지와 년지 둘 다 기준으로 본다
  for (const [basePos, base] of [['일지', p.day[1]], ['년지', p.year[1]]]) {
    const s = salOf(base);
    for (const k of ['도화', '역마', '화개']) {
      brs.forEach(([pn, b]) => { if (pn !== basePos && b === s[k]) found.push({name: k + '살', where: pn}); });
    }
  }
  brs.forEach(([pn, b]) => {
    if (CHEONEUL[me].includes(b)) found.push({name: '천을귀인', where: pn});
    if (MUNCHANG[me] === b) found.push({name: '문창귀인', where: pn});
    if (YANGIN[me] === b) found.push({name: '양인', where: pn});
  });
  if (GOEGANG.includes(p.day)) found.push({name: '괴강', where: '일주'});
  if (BAEKHO.includes(p.day)) found.push({name: '백호', where: '일주'});
  // 같은 이름은 한 번만
  const seen = new Map();
  found.forEach((f) => { if (!seen.has(f.name)) seen.set(f.name, []); if (!seen.get(f.name).includes(f.where)) seen.get(f.name).push(f.where); });
  return [...seen].map(([name, where]) => ({name, where}));
}

// ---------- 2027 월운 ----------
// 2027년 각 달 간지 (정미년: 둔월법으로 임인월부터). 날짜는 절입일(한국 시각), 만세력 라이브러리의 절기표에서 계산
// 절입 시각(한국 시각): 2/4 10:46, 3/6 04:40, 4/5 09:18, 5/6 02:25, 6/6 06:26, 7/7 16:37, 8/8 02:27, 9/8 05:28, 10/8 21:17, 11/8 00:39, 12/7 17:38, 2028 1/6 04:55, 2028 2/4 16:31 (manseryeok 2.0 절기표)
export const MONTH_RANGES_2027 = ['2/4~3/5', '3/6~4/4', '4/5~5/5', '5/6~6/5', '6/6~7/6', '7/7~8/7', '8/8~9/7', '9/8~10/7', '10/8~11/7', '11/8~12/6', '12/7~1/5', '1/6~2/3'];
export const MONTHS_2027 = ['임인', '계묘', '갑진', '을사', '병오', '정미', '무신', '기유', '경술', '신해', '임자', '계축'];
const ROLE_PT = {yong: 16, hee: 8, han: 0, gu: -6, gi: -12};
export function monthScore(A, p, mp) {
  let s = 50 + ROLE_PT[elRole(A, STEM_EL[mp[0]])] + Math.round(ROLE_PT[elRole(A, BRANCH_EL[mp[1]])] * 1.2);
  const r = branchRel(mp[1], p.day[1]);
  if (r === '충') s -= 10; else if (r === '합' || r === '반합') s += 6;
  if (CHEONEUL[A.me].includes(mp[1])) s += 6;
  if (stemHap(mp[0], A.me)) s += 4;
  return Math.max(10, Math.min(95, s));
}

// ---------- 2027 연운 점수 (이 사이트 기준 참고 점수) ----------
const PT = {yong: 2, hee: 1, han: 0, gu: -1, gi: -2};
export function yearScore2027(A, p, daeunStem) {
  let s = 50 + 8 * PT[elRole(A, '화')] + 10 * PT[elRole(A, '토')];
  for (const v of [p.year, p.month, p.day, p.hour]) {
    if (!v) continue;
    const r = branchRel('미', v[1]);
    if (r === '합' || r === '반합') s += 5;
    if (r === '충') s -= 6;
    if (stemHap('정', v[0])) s += 3;
  }
  if (CHEONEUL[A.me].includes('미')) s += 6;   // 2027 未가 천을귀인
  if (daeunStem) s += 4 * PT[elRole(A, STEM_EL[daeunStem])];
  return s;
}
// 점수 → 별 (6천 명 시험 분포: 별 2개 약 12%, 3개 약 45%, 4개 약 28%, 5개 약 15%)
export const toStars = (s) => (s >= 75 ? 5 : s >= 56 ? 4 : s >= 33 ? 3 : 2);
