// 이불 속 선물방 — 사주로 고르는 운 트이는 선물 (2026-10-07, 2차: 질문·밸런스 게임·희귀도·카드 한마디·조르기 강도·약속 링크·선물 궁합)
// 생일은 브라우저 안에서만 계산하고 어디에도 보내거나 저장하지 않아요.
// 링크에는 생일이 아니라 결과 유형(일간·기운·관계·예산·강도·상황·취향)과 별명만 담겨요.
import {calculateFourPillars, lunarToSolar} from 'manseryeok';
import {analyze, STEM_EL} from '../app/analysis.js';
import {ART} from '../app/art.js';
import {
  STEM_LIST, EL_LIST, TYPES, EL, REL, BUDGET, BUDGET_OF, GIFTS, LINES, DISCLOSURE,
  RARITY, RARITY_BASE, SIT, SIT_KEYS, SIT_OF, SIT_LINE, BALANCE, LEVEL, WARN,
  CARD_OPEN, CARD_EL, CARD_END, COMPAT_ROLE, COMPAT_REL, COMPAT_NOTE,
} from './gift_texts.js';
import {LINKS} from './gift_links.js';

const $ = (s) => document.querySelector(s);
const $$ = (s) => [...document.querySelectorAll(s)];
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));

// 오행 관계
const GEN = {목: '화', 화: '토', 토: '금', 금: '수', 수: '목'};
const CTRL = {목: '토', 토: '수', 수: '화', 화: '금', 금: '목'};
const GEN_BY = {화: '목', 토: '화', 금: '토', 수: '금', 목: '수'};
const HAP = [['갑', '기'], ['을', '경'], ['병', '신'], ['정', '임'], ['무', '계']];

const STEPS = {
  give: ['rel', 'sit', 'budget', 'io', 'um', 'birth', 'mybirth'],
  beg: ['nick', 'rel', 'sit', 'budget', 'level', 'io', 'um', 'birth'],
};
const S = {mode: 'give', i: 0, ans: {}, res: null, giver: null, view: false};

// ---------- 화면 ----------
function show(id) {
  $$('.screen').forEach((el) => { el.hidden = el.id !== id; });
  window.scrollTo(0, 0);
}
function bubble(html, art) {
  $('#bubble-text').innerHTML = html;
  if (art !== undefined) $('#scene-img').src = ART.steps[art];
}
function toast(msg) { const t = $('#toast'); t.textContent = msg; t.hidden = false; clearTimeout(t._h); t._h = setTimeout(() => { t.hidden = true; }, 2600); }

// ---------- 날짜 입력 ----------
function fillSelect(sel, from, to, suffix, def) {
  sel.innerHTML = def === null ? `<option value="">${suffix === '월' ? '월' : '일'}</option>` : '';
  for (let v = from; v <= to; v++) {
    const o = document.createElement('option');
    o.value = v; o.textContent = v + suffix;
    sel.appendChild(o);
  }
  sel.value = def === null ? '' : String(def);
}
function resetDate() {
  const y = $('#f-y'), yt = $('#f-yt');
  y.value = '1990'; y.dataset.touched = ''; y.dataset.asked = '';
  yt.value = ''; yt.classList.remove('bad');
  $('#f-m').value = ''; $('#f-d').value = '';
  $$('#f-cal button').forEach((x, i) => x.classList.toggle('on', i === 0));
  $('#f-leapwrap').hidden = true; $('#f-leap').checked = false;
}
function setupDate() {
  const y = $('#f-y'), yt = $('#f-yt');
  fillSelect(y, 1900, 2050, '년', 1990);
  fillSelect($('#f-m'), 1, 12, '월', null);
  fillSelect($('#f-d'), 1, 31, '일', null);
  y.addEventListener('change', () => { y.dataset.touched = '1'; yt.value = y.value; yt.classList.remove('bad'); });
  yt.addEventListener('input', () => {
    yt.value = yt.value.replace(/[^0-9]/g, '').slice(0, 4);
    const v = +yt.value;
    if (yt.value.length < 4) { yt.classList.remove('bad'); return; }
    if (v >= 1900 && v <= 2050) { y.value = String(v); y.dataset.touched = '1'; yt.classList.remove('bad'); }
    else yt.classList.add('bad');
  });
  $$('#f-cal button').forEach((b) => b.addEventListener('click', () => {
    $$('#f-cal button').forEach((x) => x.classList.toggle('on', x === b));
    $('#f-leapwrap').hidden = b.dataset.v !== 'lunar';
  }));
}
function readDate() {
  const y = $('#f-y');
  if ($('#f-yt').classList.contains('bad')) throw new Error('태어난 해는 1900년부터 2050년 사이로 써 주시오.');
  const yy = +y.value, m = +$('#f-m').value, d = +$('#f-d').value;
  if (!yy || !m || !d) throw new Error('태어난 해·달·날을 모두 골라 주시오.');
  if (!y.dataset.touched && yy === 1990 && !y.dataset.asked) {
    y.dataset.asked = '1';
    y.classList.add('ask'); setTimeout(() => y.classList.remove('ask'), 2400);
    throw new Error('태어난 해가 정말 1990년이오? 기본으로 골라 둔 해라 한 번 더 묻소. 맞으면 버튼을 한 번 더 누르시오!');
  }
  if ($('#f-cal .on').dataset.v === 'lunar') {
    let r = null;
    try { r = lunarToSolar(yy, m, d, $('#f-leap').checked); } catch (e) { r = null; }
    if (!r || !r.year) throw new Error('없는 음력 날짜요. 날짜나 윤달 여부를 확인해 주시오.');
    return {sy: r.year, sm: r.month, sd: r.day};
  }
  const dt = new Date(yy, m - 1, d);
  if (dt.getMonth() !== m - 1) throw new Error('없는 날짜요. 날짜를 확인해 주시오.');
  return {sy: yy, sm: m, sd: d};
}
// 시간은 묻지 않아요: 사주방과 같은 방식으로 낮 12시 기준 해·달·날 기둥만 써요
function calc(dt) {
  const o = calculateFourPillars({year: dt.sy, month: dt.sm, day: dt.sd, hour: 12, minute: 0}).toObject();
  const A = analyze({year: o.year, month: o.month, day: o.day, hour: null});
  return {stem: A.me, yong: A.yong, gi: A.gi};
}

// ---------- 질문 단계 ----------
const who = () => (S.mode === 'beg' ? '그대' : '이 사람');
function stepDef(key) {
  const a = S.ans, beg = S.mode === 'beg';
  switch (key) {
    case 'nick': return {q: '그대 별명은?', say: '먼저 그대 <b>별명</b>을 알려 주시오. 조르기 받는 사람이 이 이름을 보게 되오 😏', kind: 'nick'};
    case 'rel': return {q: beg ? '누구한테 조를 거요?' : '누구에게 줄 선물이오?', say: beg ? '좋소! 그럼 <b>누구한테</b> 조를 거요? 🙏' : '선물 고르기 어렵소? 하나씩 물을 테니 툭툭 눌러 주시오 🎁<br>먼저, <b>누구에게</b> 줄 거요?', kind: 'opts',
      opts: Object.entries(REL).map(([k, v]) => [k, {l: '💘', p: '👪', c: '💼'}[k], v.name])};
    case 'sit': return {q: '무슨 날이오?', say: `${REL[a.rel].name}이라… 그럼 <b>무슨 날</b>이오?`, kind: 'opts',
      opts: SIT_OF[a.rel].map((k) => [k, SIT[k].emoji, SIT[k].name])};
    case 'budget': return {q: beg ? '얼마짜리까지 조를 거요?' : '예산은 얼마쯤이오?', say: `${SIT_LINE[a.sit]}<br>${beg ? '자, <b>얼마짜리까지</b> 조를 거요? 😏' : '<b>예산</b>은 얼마쯤이오?'}`, kind: 'opts',
      opts: BUDGET_OF[a.rel].map((b) => [String(b), ['💵', '💰', '💎', '👑'][[1, 3, 5, 10].indexOf(b)], BUDGET[b]])};
    case 'level': return {q: '얼마나 세게 조를 거요?', say: '조르기에도 <b>강도</b>가 있소. 얼마나 세게 갈 거요? 🔥', kind: 'opts',
      opts: Object.entries(LEVEL).map(([k, v]) => [k, v.emoji, v.name])};
    case 'io': return {q: BALANCE[0].q(who()), say: `<b>밸런스 게임</b> 들어가오! ⚖️<br>${BALANCE[0].q(who())}`, kind: 'opts', opts: BALANCE[0].a, big: true};
    case 'um': return {q: BALANCE[1].q(who()), say: `하나 더! ⚖️<br>${BALANCE[1].q(who())}`, kind: 'opts', opts: BALANCE[1].a, big: true};
    case 'birth': return {q: beg ? '그대의 생일' : '받을 사람의 생일', say: beg ? '마지막이오! <b>그대 생일</b>을 알려 주시오. 시간은 몰라도 되오.' : '이제 <b>받을 사람 생일</b>만 알려 주시오. 시간은 몰라도 되오.', kind: 'date', go: '다음'};
    case 'mybirth': return {q: '덤으로, 그대 생일은?', say: '덤이오! <b>그대 생일</b>도 넣으면 둘의 <b>선물 궁합</b>을 봐 드리리다 💞<br>싫으면 건너뛰어도 되오.', kind: 'date', go: '궁합도 볼래요 💞', skip: '건너뛰고 결과 보기'};
  }
  return null;
}
function renderStep() {
  const steps = STEPS[S.mode];
  const key = steps[S.i];
  const d = stepDef(key);
  bubble(d.say, key === 'birth' || key === 'mybirth' ? 3 : 1);
  $('#st-dots').innerHTML = steps.map((_, i) => `<i class="${i < S.i ? 'done' : i === S.i ? 'on' : ''}"></i>`).join('');
  $('#st-q').textContent = d.q;
  $('#st-err').textContent = '';
  const body = $('#st-body');
  $('#date-form').hidden = d.kind !== 'date';
  $('#st-next').hidden = d.kind === 'opts';
  $('#st-skip').hidden = !d.skip;
  if (d.kind === 'opts') {
    body.innerHTML = `<div class="opts ${d.big ? 'big' : ''}">${d.opts.map(([v, e, t]) => `<button type="button" class="opt" data-v="${v}"><span class="oe">${e}</span><span>${t}</span></button>`).join('')}</div>`;
    $$('#st-body .opt').forEach((b) => b.addEventListener('click', () => {
      b.classList.add('picked');
      const v = b.dataset.v;
      S.ans[key] = key === 'budget' || key === 'level' ? +v : v;
      setTimeout(next, 220);
    }));
  } else if (d.kind === 'nick') {
    body.innerHTML = `<input id="f-nick" maxlength="10" autocomplete="off" placeholder="예: 쉬고싶은청년" value="${esc(S.ans.nick || '')}">`;
    $('#st-next').textContent = '다음';
    setTimeout(() => $('#f-nick').focus(), 50);
  } else {
    body.innerHTML = '';
    resetDate();
    $('#st-next').textContent = d.go;
    if (d.skip) $('#st-skip').textContent = d.skip;
  }
}
function onNext() {
  const key = STEPS[S.mode][S.i];
  const err = $('#st-err');
  if (key === 'nick') {
    const v = $('#f-nick').value.trim().slice(0, 10);
    if (!v) { err.textContent = '받는 사람이 누군지 알아보게 별명을 써 주시오.'; return; }
    S.ans.nick = v; next(); return;
  }
  let dt;
  try { dt = readDate(); } catch (e) { err.textContent = e.message; return; }
  if (key === 'birth') S.res = calc(dt);
  if (key === 'mybirth') S.giver = calc(dt);
  next();
}
function next() {
  if (S.i < STEPS[S.mode].length - 1) { S.i++; renderStep(); return; }
  finish();
}
function back() {
  if (S.i > 0) { S.i--; renderStep(); return; }
  goHome();
}
function startQuiz(mode) {
  S.mode = mode; S.i = 0; S.ans = {}; S.res = null; S.giver = null; S.view = false;
  $('#quiz-home').appendChild($('#date-form'));
  history.replaceState(null, '', location.pathname);
  $('#st-title').textContent = mode === 'beg' ? '🙏 선물 조르기' : '🎁 선물 주기';
  show('s-quiz');
  renderStep();
}
function finish() {
  const a = S.ans;
  Object.assign(S.res, {rel: a.rel, sit: a.sit, budget: a.budget, io: a.io, um: a.um, level: a.level || 1, nick: a.nick || ''});
  bubble(LINES.loading, 2);
  show('s-load');
  setTimeout(() => { renderResult(S.res, false); bubble(LINES.open_box, 4); show('s-result'); }, 1700);
}

// ---------- 선물 고르기 ----------
function hash(str) { let h = 2166136261; for (const c of str) { h ^= c.codePointAt(0); h = Math.imul(h, 16777619); } return h >>> 0; }
function rng(seed) { let s = seed || 1; return () => { s ^= s << 13; s ^= s >>> 17; s ^= s << 5; return ((s >>> 0) % 100000) / 100000; }; }
// 점수: 예산과 같은 가격대 3점(낮은 가격대는 가격에 비례해 0~2점) + 밸런스 게임 답과 맞는 꼬리표마다 1점, 같은 점수는 섞어서
export function pickGifts(el, rel, budget, io, um, seedStr) {
  const r = rng(hash(seedStr));
  const ok = GIFTS[el].filter((g) => g.r.includes(rel) && g.b <= budget);
  const scored = ok.map((g) => ({g, s: (g.b === budget ? 3 : (g.b / budget) * 2) + (g.t.includes(io) ? 1 : 0) + (g.t.includes(um) ? 1 : 0) + r() * 0.5}));
  return scored.sort((x, y) => y.s - x.s).slice(0, 3).map((x) => x.g);
}
const linkOf = (g) => LINKS[g.id] || `https://www.coupang.com/np/search?q=${encodeURIComponent(g.k)}`;
const hasPartner = () => Object.values(LINKS).some(Boolean);
const giftById = (id) => Object.values(GIFTS).flat().find((g) => g.id === id);

// 결과 코드 9자리: 일간 · 용신 · 기신 · 관계 · 예산(1/3/5/9) · 강도(1~3) · 상황 번호 · 집/밖(i/o) · 실용/감성(u/m)
function encode(r) {
  return `${STEM_LIST.indexOf(r.stem)}${EL_LIST.indexOf(r.yong)}${EL_LIST.indexOf(r.gi)}${r.rel}${r.budget === 10 ? 9 : r.budget}${r.level}${SIT_KEYS.indexOf(r.sit)}${r.io}${r.um}`;
}
function decode(j) {
  const m = /^([0-9])([0-4])([0-4])([lpc])([1359])(?:([123])([0-6])([io])([um]))?$/.exec(j || '');
  if (!m) return null;
  const budget = m[5] === '9' ? 10 : +m[5];
  const rel = m[4];
  const sit = m[7] !== undefined ? SIT_KEYS[+m[7]] : SIT_OF[rel][0];
  if (!BUDGET_OF[rel].includes(budget) || m[2] === m[3] || !SIT_OF[rel].includes(sit)) return null;
  return {stem: STEM_LIST[+m[1]], yong: EL_LIST[+m[2]], gi: EL_LIST[+m[3]], rel, budget, level: +(m[6] || 1), sit, io: m[8] || 'i', um: m[9] || 'u'};
}

// ---------- 희귀도 · 궁합 · 카드 ----------
function rarity(r) {
  const pct = RARITY[r.stem + r.yong];
  if (pct === undefined) return null;
  const tier = pct <= 1.5 ? ['🦄', '희귀 조합', 'rare'] : pct <= 3 ? ['✨', '보기 드문 조합', 'mid'] : ['👥', '흔한 조합', 'com'];
  return {pct, tier};
}
export function compat(giverStem, r) {
  const ge = STEM_EL[giverStem], re = STEM_EL[r.stem];
  const hee = GEN_BY[r.yong], gu = GEN_BY[r.gi];
  const role = ge === r.yong ? 'yong' : ge === hee ? 'hee' : ge === r.gi ? 'gi' : ge === gu ? 'gu' : 'han';
  let rel;
  if (HAP.some(([x, y]) => (x === giverStem && y === r.stem) || (y === giverStem && x === r.stem))) rel = 'hap';
  else if (ge === re) rel = 'same';
  else if (GEN[ge] === re) rel = 'igive';
  else if (GEN[re] === ge) rel = 'igot';
  else if (CTRL[ge] === re) rel = 'ihit';
  else rel = 'igothit';
  const score = Math.max(40, Math.min(99, 70 + COMPAT_ROLE[role].pt + COMPAT_REL[rel].pt));
  return {score, role, rel};
}
// 카드 한마디: 주는 사람이 받는 사람에게 쓰는 말. 연인은 반말, 부모님·동료에게는 존댓말
// (조르기 링크를 연 사람은 조른 사람에게 주는 쪽이라, 부모님이 자녀에게 쓰는 말은 반말)
function cardMsg(r, viewer) {
  const formal = viewer ? r.rel === 'c' : r.rel !== 'l';
  const f = formal ? 1 : 0;
  let open = CARD_OPEN[r.sit][f];
  if (viewer && r.rel === 'p' && r.sit === 'bday') open = '생일 축하해! 올해는 운까지 챙겨 주고 싶었어.';
  return `${open} ${CARD_EL[r.yong][f]}. ${CARD_END[r.stem][f]}`;
}

// ---------- 결과 ----------
function renderResult(r, view) {
  const T = TYPES[r.stem], Y = EL[r.yong], G = EL[r.gi];
  const code = encode(r);
  const gifts = pickGifts(r.yong, r.rel, r.budget, r.io, r.um, code);
  const subj = view ? `<b>${esc(r.nick)}</b>님` : S.mode === 'beg' ? '그대' : '이 사람';
  const rar = rarity(r);
  $('#r-disc').hidden = !hasPartner();
  $('#r-disc').textContent = DISCLOSURE;
  $('#r-type').innerHTML = `
    ${rar ? `<div class="badge ${rar.tier[2]}">${rar.tier[0]} ${rar.tier[1]} · 100명 중 약 ${Math.max(1, Math.round(rar.pct))}명꼴 <small>(${rar.pct}%)</small></div>` : ''}
    <div class="kicker">${subj}의 타고난 선물 성향</div>
    <div class="type-row"><span class="big-emoji">${T.emoji}</span><div><div class="type-name">${T.name}</div><div class="type-sub">${T.hanja} · <b>${T.style}</b></div></div></div>
    <p>${T.line}</p><p class="tip">💡 ${T.tip}</p>
    ${rar ? `<p class="fine">희귀도는 '타고난 성향 + 모자란 기운' 조합 50가지의 비율이에요 (${RARITY_BASE}).</p>` : ''}`;
  $('#r-el').style.setProperty('--c', Y.color);
  $('#r-el').style.setProperty('--soft', Y.soft);
  $('#r-el').innerHTML = `
    <div class="kicker">${subj}에게 모자란 기운</div>
    <div class="el-big">${Y.emoji} ${Y.name}(${Y.hanja}) 기운</div>
    <p>이 기운을 채우면 <b>${Y.luck}</b>이 살아난다 하오.<br>어울리는 것: ${Y.look}</p>`;
  renderCompat(r, view);
  $('#r-gifts').innerHTML = gifts.map((g, i) => `
    <div class="gift" style="--i:${i}">
      <a class="g-main" href="${esc(linkOf(g))}" target="_blank" rel="sponsored noopener" data-id="${g.id}">
        <span class="g-no">${i + 1}</span>
        <span class="g-body"><b>${esc(g.n)}</b><span class="g-why">${esc(g.why)}</span><span class="g-price">보통 ${BUDGET[g.b]} · 가격은 쿠팡에서 확인</span></span>
        <span class="g-go">쿠팡에서<br>보기 ›</span>
      </a>
      ${view ? `<button type="button" class="promise" data-id="${g.id}">🤙 이걸로 사 줄게</button>` : ''}
    </div>`).join('');
  $('#r-avoid').innerHTML = `<b>🙅 이건 피하시오:</b> ${G.avoid}. ${subj}에겐 ${G.name}(${G.hanja}) 기운이 맞지 않소.<br><span class="warn">⚠️ 이거 주면 생기는 일: ${WARN[r.gi]}</span>`;
  $('#r-note').textContent = hasPartner() ? '' : '지금은 쿠팡 검색 화면으로 연결돼요.';
  // 카드 한마디: 주기 결과, 또는 조르기 링크를 연 사람에게
  const showCard = view || S.mode === 'give';
  $('#r-card').hidden = !showCard;
  if (showCard) {
    const msg = cardMsg(r, view);
    $('#r-cardmsg').textContent = msg;
    $('#r-cardcopy').onclick = () => copy(msg, '카드 문구를 복사했소! ✍️');
  }
  renderShare(r, view, code);
  $('#r-again').hidden = !!view;
  $$('#r-gifts .promise').forEach((b) => b.addEventListener('click', () => openPromise(b.dataset.id)));
  $('#r-promise').hidden = true;
  $('#r-box').classList.remove('open');
  $('#r-open').hidden = true;
  $('#r-box').hidden = false;
}
function renderCompat(r, view) {
  const box = $('#r-compat');
  if (!S.giver) {
    if (view) {
      box.hidden = false;
      box.innerHTML = `<div class="kicker">💞 선물 궁합</div><p>그대 생일을 넣으면 <b>${esc(r.nick)}</b>님과의 선물 궁합을 봐 드리리다.</p><button id="c-open" class="dark">내 생일 넣고 궁합 보기</button>`;
      $('#c-open').onclick = () => { S.compatAsk = true; $('#c-form').hidden = false; $('#c-slot').appendChild($('#date-form')); $('#date-form').hidden = false; resetDate(); $('#c-open').hidden = true; };
      return;
    }
    box.hidden = true; return;
  }
  const c = compat(S.giver.stem, r);
  const R = COMPAT_REL[c.rel], RO = COMPAT_ROLE[c.role];
  const GT = TYPES[S.giver.stem];
  box.hidden = false;
  box.innerHTML = `
    <div class="kicker">💞 ${view ? `그대와 <b>${esc(r.nick)}</b>님의` : '그대와 이 사람의'} 선물 궁합</div>
    <div class="score"><b>${c.score}</b><span>점</span></div>
    <div class="meter"><i style="width:${c.score}%"></i></div>
    <p class="pair">${GT.emoji} ${GT.name} → ${TYPES[r.stem].emoji} ${TYPES[r.stem].name} · <b>${R.name}</b></p>
    <p>${R.line}</p><p>${RO.line}</p>
    <p class="fine">${COMPAT_NOTE}</p>`;
}
function renderShare(r, view, code) {
  const url = `${location.origin}${location.pathname}`;
  const sh = $('#r-share');
  if (view) {
    sh.innerHTML = `<p class="share-q">나도 조르고 싶소? 🙏</p>
      <button id="go-beg" class="dark">나도 조르기 링크 만들기</button>
      <button id="go-give" class="ghost">내가 줄 선물 고르기</button>`;
  } else if (S.mode === 'beg') {
    const link = `${url}?j=${code}&n=${encodeURIComponent(r.nick)}`;
    sh.innerHTML = `<p class="share-q">${LEVEL[r.level].emoji} 이 링크를 ${REL[r.rel].short}에게 보내시오!</p>
      <p class="hint">열면 이 선물 목록이 바로 보이고, "이걸로 사 줄게"를 누르면 그대에게 <b>약속 링크</b>가 돌아오오.</p>
      <div class="linkbox">${esc(link)}</div>
      <button id="share-link">${REL[r.rel].call} 조르기 링크 보내기</button>
      <button id="copy-link" class="ghost">링크만 복사하기</button>
      <p class="hint">링크에는 생일이 들어가지 않아요. 결과 유형과 별명만 담겨요.</p>`;
    $('#share-link').onclick = () => share(link, LEVEL[r.level].share(r.nick));
    $('#copy-link').onclick = () => copy(link);
  } else {
    sh.innerHTML = `<p class="share-q">받을 사람한테 슬쩍 보여 줘도 재밌소 😏</p>
      <button id="share-site">선물방 친구에게 알려 주기</button>
      <button id="go-beg" class="ghost">나도 받고 싶은 선물 조르기</button>`;
    $('#share-site').onclick = () => share(url, '사주로 고르는 운 트이는 선물 🎁');
  }
  $('#go-beg') && ($('#go-beg').onclick = () => startQuiz('beg'));
  $('#go-give') && ($('#go-give').onclick = () => startQuiz('give'));
}
function openBox() {
  const box = $('#r-box');
  if (box.classList.contains('open')) return;
  box.classList.add('open');
  confetti();
  setTimeout(() => {
    box.hidden = true; $('#r-open').hidden = false;
    bubble(S.view ? `${LEVEL[S.res.level].line(esc(S.res.nick))}<br>맘에 드는 걸 골라 <b>"이걸로 사 줄게"</b>를 누르시오!` : '짜잔~ 이 세 가지가 운을 채워 주는 선물이오! 🎉', 2);
  }, 650);
}
function confetti(sel = '#confetti') {
  const host = $(sel);
  const parts = ['🎉', '✨', '🎁', '💛', '🌟'];
  host.innerHTML = Array.from({length: 18}, (_, i) => `<i style="--x:${Math.round((Math.random() - 0.5) * 320)}px;--y:${Math.round(-120 - Math.random() * 200)}px;--r:${Math.round(Math.random() * 360)}deg;--d:${i * 18}ms">${parts[i % parts.length]}</i>`).join('');
  host.classList.remove('go'); void host.offsetWidth; host.classList.add('go');
}

// 받침에 따라 '으로/로'
function ro(w) { const c = w.charCodeAt(w.length - 1) - 0xAC00; if (c < 0 || c > 11171) return '(으)로'; const j = c % 28; return j === 0 || j === 8 ? '로' : '으로'; }
// ---------- 약속 링크 (조르기 받은 사람 → 조른 사람) ----------
function openPromise(id) {
  const g = giftById(id);
  const p = $('#r-promise');
  p.hidden = false;
  p.innerHTML = `<div class="kicker">🤙 약속 도장 찍기</div>
    <p><b>${esc(g.n)}</b>${ro(g.n)} 사 주기로 하는 거요?</p>
    <label for="p-nick">그대 별명 <small>(약속 받는 사람이 보게 되오)</small></label>
    <input id="p-nick" maxlength="10" autocomplete="off" placeholder="예: 산타">
    <button id="p-make">약속 링크 보내기 📮</button>`;
  p.scrollIntoView({behavior: 'smooth', block: 'center'});
  $('#p-make').onclick = () => {
    const f = $('#p-nick').value.trim().slice(0, 10) || '누군가';
    const link = `${location.origin}${location.pathname}?ok=${id}&n=${encodeURIComponent(S.res.nick)}&f=${encodeURIComponent(f)}`;
    share(link, `${f}님이 선물을 사 주기로 약속했어요 🤙`);
  };
}
function showPromise(id, n, f) {
  const g = giftById(id);
  if (!g) return false;
  const el = Object.keys(GIFTS).find((k) => GIFTS[k].includes(g));
  bubble(`🎉 <b>${esc(f)}</b>님이 <b>${esc(n)}</b>님에게<br><b>${esc(g.n)}</b> 사 주기로 약속했소!! 📮`, 4);
  $('#ok-card').innerHTML = `
    <div class="stamp">약속<br>쾅!</div>
    <div class="kicker">${EL[el].emoji} ${EL[el].name} 기운 선물</div>
    <h2>${esc(g.n)}</h2>
    <p>${esc(g.why)}</p>
    <p class="g-price">보통 ${BUDGET[g.b]}</p>
    <a class="okbtn" href="${esc(linkOf(g))}" target="_blank" rel="sponsored noopener">쿠팡에서 보기 ›</a>
    <p class="hint">약속은 지키라고 있는 거요 😏 이 화면을 캡처해 두시오!</p>`;
  $('#ok-disc').hidden = !hasPartner();
  $('#ok-disc').textContent = DISCLOSURE;
  show('s-ok');
  setTimeout(() => confetti('#confetti-ok'), 300);
  return true;
}

// ---------- 공유 ----------
async function share(url, text) {
  if (navigator.share) {
    try { await navigator.share({title: '이불 속 선물방', text, url}); return; } catch (e) { if (e && e.name === 'AbortError') return; }
  }
  copy(url);
}
async function copy(text, msg) {
  try { await navigator.clipboard.writeText(text); toast(msg || '링크를 복사했소! 붙여넣기 하시오 📋'); }
  catch (e) { toast('복사가 안 되오. 길게 눌러 복사하시오.'); }
}

// ---------- 시작 ----------
const HOME = '어서 오시오~ <b>이불 속 선물방</b>이오 🎁<br>사주로 <b>운 트이는 선물</b>을 골라 드리리다. 줄 거요, 조를 거요?';
function goHome() { history.replaceState(null, '', location.pathname); $('#quiz-home').appendChild($('#date-form')); $('#date-form').hidden = true; bubble(HOME, 0); show('s-home'); }
function init() {
  $('#scene-img').src = ART.steps[0];
  $('#credit').textContent = ART.credit;
  setupDate();
  $('#h-give').onclick = () => startQuiz('give');
  $('#h-beg').onclick = () => startQuiz('beg');
  $('#st-next').onclick = onNext;
  $('#st-skip').onclick = () => { S.giver = null; next(); };
  $('#st-back').onclick = back;
  $('#r-box').onclick = openBox;
  $('#r-again').onclick = () => startQuiz(S.mode === 'beg' ? 'beg' : 'give');
  $('#ok-beg').onclick = () => startQuiz('beg');
  $('#ok-give').onclick = () => startQuiz('give');
  $('#c-go').onclick = () => {
    $('#c-err').textContent = '';
    try { S.giver = calc(readDate()); } catch (e) { $('#c-err').textContent = e.message; return; }
    $('#quiz-home').appendChild($('#date-form')); $('#date-form').hidden = true; $('#c-form').hidden = true;
    renderCompat(S.res, true);
    $('#r-compat').scrollIntoView({behavior: 'smooth', block: 'center'});
  };
  const q = new URLSearchParams(location.search);
  if (q.get('ok') && showPromise(q.get('ok'), (q.get('n') || '친구').slice(0, 10), (q.get('f') || '누군가').slice(0, 10))) return;
  const r = decode(q.get('j'));
  if (r) {
    r.nick = (q.get('n') || '친구').slice(0, 10);
    S.res = r; S.view = true; S.mode = 'view'; S.giver = null;
    renderResult(r, true);
    bubble(`<b>${esc(r.nick)}</b>님이 보낸 선물 상자가 도착했소! ${LEVEL[r.level].emoji}<br><b>툭 눌러서</b> 열어 보시오 🎁`, 4);
    show('s-result');
    return;
  }
  goHome();
}

window.__gift = {pickGifts, encode, decode, compat, S, calc: (y, m, d) => calc({sy: y, sm: m, sd: d})};
init();
