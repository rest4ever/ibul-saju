import {calculateFourPillars, lunarToSolar} from 'manseryeok';   // 10/5 엔진 교체: 절입 '시각' 기준 (이전 라이브러리는 날짜 0시 기준이라 절기 날 일부가 틀렸음)
import * as AN from './analysis.js';
import * as TD from './texts_detail.js';
import {initTarot} from './tarot.js';
import {ILGAN, YEAR2027, EL, GUNGHAP, AREA2027, SPOUSE2027} from './texts.js';
import {ART} from './art.js';

// 이불 속 사주방 (2026-10-05 사용자 결정: 이름 '이불 속 사주방', 웹툰형 캐릭터 안내 디자인)
// 모든 계산은 이 브라우저 안에서만 한다. 입력한 생년월일은 어디로도 보내지 않는다.
const STEM_EL = {갑: '목', 을: '목', 병: '화', 정: '화', 무: '토', 기: '토', 경: '금', 신: '금', 임: '수', 계: '수'};
const BRANCH_EL = {자: '수', 축: '토', 인: '목', 묘: '목', 진: '토', 사: '화', 오: '화', 미: '토', 신: '금', 유: '금', 술: '토', 해: '수'};
const ORDER = ['목', '화', '토', '금', '수'];
const GEN = {목: '화', 화: '토', 토: '금', 금: '수', 수: '목'}; // 생(生)
const CTRL = {목: '토', 토: '수', 수: '화', 화: '금', 금: '목'}; // 극(剋)
const HAP = [['갑', '기'], ['을', '경'], ['병', '신'], ['정', '임'], ['무', '계']];
const SITE = '이불 속 사주방';
const YANG = new Set(['갑', '병', '무', '경', '임']);
const BRANCH_MAIN = AN.BRANCH_MAIN;
const sipsin = AN.sipsin;
// 십신: 일간(me)과 다른 천간(o)의 관계
function sipsin_old(me, o) {
  const a = STEM_EL[me], b = STEM_EL[o], same = YANG.has(me) === YANG.has(o);
  if (a === b) return same ? '비견' : '겁재';
  if (GEN[a] === b) return same ? '식신' : '상관';
  if (CTRL[a] === b) return same ? '편재' : '정재';
  if (CTRL[b] === a) return same ? '편관' : '정관';
  return same ? '편인' : '정인';
}
const REL_EASY = {
  비견: '나랑 똑같은 기운, 친구이자 동료', 겁재: '나랑 닮았지만 내 몫을 나눠 가는 기운, 경쟁자',
  식신: '내가 만들어 내는 재주와 먹을 복', 상관: '밖으로 꺼내는 말과 표현력',
  편재: '크게 움직이는 돈, 사업·투자 기운', 정재: '꾸준히 들어오는 돈, 월급·저축 기운',
  편관: '나를 세게 단련시키는 압박과 도전', 정관: '나를 다듬어 주는 규칙, 직장·명예',
  편인: '남다른 생각과 촉, 혼자 깊이 파는 공부', 정인: '나를 도와주고 키워주는 기운, 공부·문서·어른',
};
let LV = 'mid';   // 사주 아는 정도: new 처음 / mid 조금 / pro 잘 앎 (10/5 사용자 제안)
const ART_IDX = {0: 0, 10: 1, 11: 4, 12: 2, 13: 4, 14: 2, 1: 1, 2: 2, 3: 1, 4: 4};   // 0 인사 1 질문 2 등불 4 사주책
const DOT_IDX = {0: 0, 10: 0, 11: 0, 12: 0, 13: 0, 14: 0, 1: 1, 2: 2, 3: 3, 4: 3};

const $ = (s) => document.querySelector(s);
const $$ = (s) => Array.from(document.querySelectorAll(s));
const clean = (t) => (t || '').replace(/<[^>]*>/g, '').replace(/[<>&"']/g, '').trim().slice(0, 8);

let last = null;      // 내 사주 결과
let inviter = null;   // 친구 궁합 링크로 들어온 경우 {g: 일간 한 글자, n: 별명}
let ghLast = null;    // 마지막 궁합 결과 (카드용)
let lastIn = null;    // 마지막 입력 (대운 성별 다시 계산용)

// ---------- 친구 궁합 링크: #g=경&n=별명 (주소의 # 뒤라 서버로 가지 않음. 생년월일은 넣지 않는다) ----------
function readInvite() {
  const q = new URLSearchParams(location.hash.slice(1));
  const g = q.get('g');
  if (!g || !ILGAN[g]) return null;
  return {g, n: clean(q.get('n')) || '친구'};
}

function sex() { const b = document.querySelector('.seg.sex button.on'); return b ? b.dataset.sex : ''; }
function nick() { return clean($('#nick').value) || ''; }
function callName() { return nick() ? `${nick()}님은` : '그대는'; }   // 받침 상관없이 자연스럽게

// ---------- 도령 목소리 (2026-10-05 사용자 선택: 움직임 + 정해진 말은 녹음 + 사람마다 다른 풀이는 기기 목소리) ----------
// 휴대폰 브라우저는 소리가 저절로 나는 걸 막아서, 사용자가 '목소리 켜기'를 한 번 눌러야 말한다.
// 10/5 녹음: Gemini TTS 'Puck'(사용자 선택) 목소리, voice/*.mp3. 기기 기본 목소리는 쓰지 않는다 (사용자: 여자·기계 목소리는 도령답지 않음)
const VKEYS = ['step0', 'step1', 'step2', 'step3', 'step4', 'step10', 'step11', 'step12', 'step13', 'step14', 'ch1', 'ch3', 'ch4', 'ch5', 'ch6', 'ch7', 'ch8', 'ch9',
  'a_money', 'a_work', 'a_love', 'a_study', 'a_health', 'a_all', 'il_gap', 'il_eul', 'il_byeong', 'il_jeong', 'il_mu', 'il_gi', 'il_gyeong', 'il_sin', 'il_im', 'il_gye'];
const RECORDED = Object.fromEntries(VKEYS.map((k) => [k, `voice/${k}.mp3`]));
const IL_KEY = {갑: 'il_gap', 을: 'il_eul', 병: 'il_byeong', 정: 'il_jeong', 무: 'il_mu', 기: 'il_gi', 경: 'il_gyeong', 신: 'il_sin', 임: 'il_im', 계: 'il_gye'};
const voice = {on: false, ko: null, audio: null};
function pickVoice() {
  if (!('speechSynthesis' in window)) return;
  const vs = speechSynthesis.getVoices().filter((v) => /^ko/i.test(v.lang));
  voice.ko = vs.find((v) => /google/i.test(v.name)) || vs[0] || null;
}
function speakable(t) {
  return String(t).replace(/<br\s*\/?>/gi, ' ').replace(/<[^>]*>/g, '')
    .replace(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}\u{200D}]/gu, '').replace(/~+/g, '').replace(/\s+/g, ' ').trim();
}
function stopTalk() {
  try { if ('speechSynthesis' in window) speechSynthesis.cancel(); } catch (e) { /* 무시 */ }
  if (voice.audio) { voice.audio.pause(); voice.audio = null; }
  $$('.talking').forEach((el) => el.classList.remove('talking'));
}
function say(text, el, key) {
  if (!voice.on) return;
  stopTalk();
  const target = el || $('.scene');
  const done = () => target.classList.remove('talking');
  if (key && RECORDED[key]) {
    const au = new Audio(RECORDED[key]);
    voice.audio = au; au.onplay = () => target.classList.add('talking'); au.onended = done; au.onerror = done;
    au.play().catch(done);
    return;
  }
  // 녹음이 없는 말은 소리 없이 넘어간다
}
function setVoice(on) {
  voice.on = on;
  const b = $('#voice');
  b.setAttribute('aria-pressed', on ? 'true' : 'false');
  b.textContent = on ? '🔊 목소리 끄기' : '🔈 도령 목소리 켜기';
  try { localStorage.setItem('ibul-voice', on ? '1' : '0'); } catch (e) { /* 저장 안 돼도 괜찮음 */ }
  if (!on) stopTalk();
}
function readOut(parts, el) {   // 버튼을 누르면 목소리가 꺼져 있어도 켜고 읽는다
  if (!voice.on) setVoice(true);
  say(parts.filter(Boolean).join('. '), el);
}

// ---------- 웹툰 단계 ----------
function bubbleFor(n) {   // 도령 말투: 살짝 사극투 (10/5 사용자 선택)
  if (n === 0) {
    return inviter
      ? `<b>${inviter.n}</b>님이 궁합 보자고 링크를 보냈구려 💌<br>생일만 알려 주면 바로 봐 드리리다!`
      : '어서 오시오~ 여기는 <b>이불 속 사주방</b>이오 🌙<br>누운 채로 편하게, 사주 한번 펼쳐 보겠소?';
  }
  if (n === 10) return '그대, 사주는 좀 아시오?';
  if (n === 11) return '좋소! 사주가 뭔지부터 차근차근 알려 드리리다 📜';
  if (n === 12) return '글자마다 기운이 있소. 딱 다섯 가지요!';
  if (n === 13) return "여덟 글자 중에 제일 중요한 건<br>바로 <b>'나'</b>를 뜻하는 글자요 ☝️";
  if (n === 14) return '마지막이오! 운세는 이렇게 보는 거요 🔮';
  if (n === 1) return '먼저, 뭐라고 불러 드리면 되겠소?';
  if (n === 2) return `${callName()} 언제 태어났소?`;
  if (n === 3) return '태어난 시간도 아시오?<br>몰라도 괜찮소~';
  return '음… 사주 펼치는 중이오…';
}
let stepNow = 0;
function goStep(n) {
  stepNow = n;
  $$('.panel').forEach((p) => { p.hidden = +p.dataset.step !== n; });
  $('#bubble-text').innerHTML = bubbleFor(n);
  const bub = $('.bubble'); bub.classList.remove('pop'); void bub.offsetWidth; bub.classList.add('pop');
  say(bubbleFor(n), $('.scene'), n === 0 && inviter ? null : 'step' + n);
  const art = $('#art'); const nextSrc = ART.steps[ART_IDX[n] ?? 0];
  if (art.getAttribute('src') !== nextSrc) { art.src = nextSrc; art.classList.remove('hop'); void art.offsetWidth; art.classList.add('hop'); }
  $$('.dots i').forEach((d, i) => d.classList.toggle('on', i === (DOT_IDX[n] ?? 0)));
}

function fillSelect(sel, from, to, suffix, def) {
  sel.innerHTML = '';
  for (let v = from; v <= to; v++) {
    const o = document.createElement('option');
    o.value = v; o.textContent = v + suffix;
    if (v === def) o.selected = true;
    sel.appendChild(o);
  }
}
function setupDate(prefix, defYear) {
  fillSelect($(`#${prefix}-y`), 1900, 2050, '년', defYear);
  fillSelect($(`#${prefix}-m`), 1, 12, '월', 1);
  fillSelect($(`#${prefix}-d`), 1, 31, '일', 1);
}

function readDate(prefix) {
  const y = +$(`#${prefix}-y`).value, m = +$(`#${prefix}-m`).value, d = +$(`#${prefix}-d`).value;
  const lunar = $(`#${prefix}-cal`).value === 'lunar';
  const leap = lunar && $(`#${prefix}-leap`).checked;
  let sy = y, sm = m, sd = d;
  if (lunar) {
    let r = null;
    try { r = lunarToSolar(y, m, d, leap); } catch (e) { r = null; }
    if (!r || !r.year) throw new Error('없는 음력 날짜예요. 날짜나 윤달 여부를 확인해 주세요.');
    ({year: sy, month: sm, day: sd} = r);
  } else {
    const dt = new Date(y, m - 1, d);
    if (dt.getMonth() !== m - 1) throw new Error('없는 날짜예요. 날짜를 확인해 주세요.');
  }
  return {sy, sm, sd, lunar, leap, y, m, d};
}

const SEX_EN = {남: 'male', 여: 'female'};
function pillarsOf(dt, hour, minute, correct, sx) {
  const base = {year: dt.sy, month: dt.sm, day: dt.sd};
  if (sx) base.gender = SEX_EN[sx];
  if (hour === null) {
    // 시간을 모르면 낮 12시로 해·달·날 기둥만 쓴다. 그날 안에 절기가 바뀌면 알려 준다
    const r = calculateFourPillars({...base, hour: 12, minute: 0}).toObject();
    const a = calculateFourPillars({year: dt.sy, month: dt.sm, day: dt.sd, hour: 0, minute: 0}).toObject();
    const b = calculateFourPillars({year: dt.sy, month: dt.sm, day: dt.sd, hour: 23, minute: 59}).toObject();
    const full = calculateFourPillars({...base, hour: 12, minute: 0});
    return {year: r.year, month: r.month, day: r.day, hour: null, corrected: false, boundary: a.month !== b.month || a.year !== b.year, luck: full.luckPillars || null, voids: full.voidBranches};
  }
  const opt = {...base, hour, minute};
  if (correct) opt.trueSolarTime = {longitude: 126.978};
  const s = calculateFourPillars(opt);
  const o = s.toObject();
  return {year: o.year, month: o.month, day: o.day, hour: o.hour, corrected: !!correct, boundary: false, luck: s.luckPillars || null, voids: s.voidBranches};
}

function countEl(p) {
  const c = {목: 0, 화: 0, 토: 0, 금: 0, 수: 0};
  [p.year, p.month, p.day, p.hour].filter(Boolean).forEach((x) => { c[STEM_EL[x[0]]]++; c[BRANCH_EL[x[1]]]++; });
  return c;
}

function relation(me, other) {
  if (HAP.some(([a, b]) => (a === me && b === other) || (b === me && a === other))) return 'hap';
  const a = STEM_EL[me], b = STEM_EL[other];
  if (a === b) return 'same';
  if (GEN[a] === b) return 'igive';
  if (GEN[b] === a) return 'igot';
  if (CTRL[a] === b) return 'ihit';
  return 'igothit';
}

function cell(ch, kind, ilgan, isMe) {
  const el = kind === 'stem' ? STEM_EL[ch] : BRANCH_EL[ch];
  let ss = '';
  if (ilgan) ss = `<em>${isMe ? '일간' : sipsin(ilgan, kind === 'stem' ? ch : BRANCH_MAIN[ch])}</em>`;
  return `<div class="cell ${kind}" style="--c:${EL[el].color}"><b>${ch}</b><small>${EL[el].label}</small>${ss}</div>`;
}

function showGunghap(me, you, who) {   // who: '상대' 또는 친구 별명
  const r = GUNGHAP[relation(me, you)];
  const Y = ILGAN[you];
  $('#gh-you').textContent = `${who === '상대' ? '상대는' : who + '님은'} ${Y.name}(${Y.hanja})`;
  $('#gh-score').textContent = r.score;
  $('#gh-title').textContent = r.title;
  $('#gh-text').textContent = r.text;
  $('#gh-result').hidden = false;
  ghLast = {me, you, who, r};
}

function render(p, dt) {
  const ilgan = p.day[0];
  const I = ILGAN[ilgan];
  const cnt = countEl(p);
  const total = Object.values(cnt).reduce((a, b) => a + b, 0);
  const max = Math.max(...Object.values(cnt));
  const many = ORDER.filter((e) => cnt[e] === max && max >= 3);
  const none = ORDER.filter((e) => cnt[e] === 0);
  const Y = YEAR2027[ilgan];
  last = {p, ilgan, cnt, total};

  const cols = [['시', p.hour], ['일', p.day], ['월', p.month], ['년', p.year]];
  $('#chart').innerHTML = cols.map(([lab, v]) => `
    <div class="col${lab === '일' ? ' me' : ''}">
      <div class="lab">${lab}주${lab === '일' ? ' (나)' : ''}</div>
      ${v ? cell(v[0], 'stem', ilgan, lab === '일') + cell(v[1], 'branch', ilgan, false) : '<div class="cell empty">?</div><div class="cell empty">?</div>'}
    </div>`).join('');
  const src = dt.lunar ? `음력 ${dt.y}.${dt.m}.${dt.d}${dt.leap ? ' (윤달)' : ''} → 양력 ${dt.sy}.${dt.sm}.${dt.sd}` : `양력 ${dt.sy}.${dt.sm}.${dt.sd}`;
  const tnote = (p.hour === null ? '태어난 시간은 빼고 봤어요.' : p.corrected ? '시간은 서울 경도 기준 실제 해 위치로 맞춰 봤어요.' : '넣은 시간 그대로 봤어요.')
    + (p.boundary ? ' ⚠️ 태어난 날에 절기가 바뀌어서, 태어난 시간에 따라 달 기둥이 달라질 수 있어요. 시간을 알면 넣어 주세요!' : '');
  $('#chart-note').textContent = `${src} · ${tnote}`;

  $('#say-type').textContent = `${callName()} ${I.name}${josaEun(I.name) === '은' ? '이오' : '요'}! ${I.image} 같은 사람이구려 ✨`;
  $('#tip-type').textContent = `💡 사주에선 태어난 날 위 글자(일간)를 '나'로 보고 성격을 풀어요. 그대의 일간은 ${I.name.slice(0, 1)}(${I.hanja.slice(0, 1)}), ${EL[STEM_EL[ilgan]].label} 기운이에요.`;
  $('#type-name').textContent = `${I.name}(${I.hanja})`;
  $('#type-image').textContent = I.image;
  $('#type-key').textContent = I.key;
  $('#type-text').textContent = I.text;
  $('#type-good').textContent = I.good;
  $('#type-care').textContent = I.care;

  $('#bars').innerHTML = ORDER.map((e) => `
    <div class="bar-row">
      <span class="bar-lab">${EL[e].label}<small>${e}</small></span>
      <span class="bar-track"><span class="bar" style="width:${(cnt[e] / Math.max(4, max)) * 100}%;background:${EL[e].color}"></span></span>
      <span class="bar-num">${cnt[e]}개</span>
    </div>`).join('');
  const notes = [];
  many.forEach((e) => notes.push(`<li><b>${EL[e].label} 많음</b> — ${EL[e].many}</li>`));
  none.forEach((e) => notes.push(`<li><b>${EL[e].label} 없음</b> — ${EL[e].none}</li>`));
  if (!notes.length) notes.push('<li>다섯 기운이 골고루! 균형 잡힌 편이에요.</li>');
  $('#el-notes').innerHTML = notes.join('');
  $('#el-total').textContent = `글자 ${total}개 기준${p.hour === null ? ' (태어난 시간 2글자는 빼고 봤어요)' : ''}`;

  $('#y-rel').textContent = Y.rel;
  const relB = sipsin(ilgan, '기');
  const ez = REL_EASY[Y.rel], last1 = ez.charCodeAt(ez.length - 1);
  const ra = last1 >= 0xAC00 && last1 <= 0xD7A3 && (last1 - 0xAC00) % 28 ? '이라는' : '라는';
  $('#tip-year').textContent = `💡 2027년의 하늘 글자 정(丁)이 그대에게 어떤 사이인지 보는 거예요. '${Y.rel}'은 ${ez}${ra} 뜻이에요.`;
  $('#tip-year-mid').textContent = `💡 ${Y.rel}: ${REL_EASY[Y.rel]}`;
  $('#tip-year-pro').textContent = `천간 丁 = ${Y.rel} · 지지 未(본기 己) = ${relB}`;
  $('#pro-money').textContent = $('#pro-work').textContent = `丁 ${Y.rel} · 未 ${relB}`;
  $$('.seal').forEach((s) => s.classList.remove('open'));
  updateOpenCount();
  $('#y-title').textContent = Y.title;
  $('#y-text').textContent = Y.text;

  const A = AREA2027[ilgan];
  const sx = sex();
  $('#a-money-t').textContent = A.money[0]; $('#a-money').textContent = A.money[1];
  $('#a-work-t').textContent = A.work[0]; $('#a-work').textContent = A.work[1];
  const spouse = SPOUSE2027[p.day[1]] || SPOUSE2027._;
  if (sx) {
    $('#a-love-t').textContent = A.love[sx][0]; $('#a-love').textContent = A.love[sx][1];
    $('#a-spouse').textContent = spouse;
  } else {
    $('#a-love-t').textContent = '배우자 자리로 본 2027년'; $('#a-love').textContent = spouse;
    $('#a-spouse').textContent = '성별을 고르면 전통 방식(남자는 재성, 여자는 관성)으로 더 자세히 봐 드려요.';
  }
  last.sex = sx;
  renderDetail(p, dt);

  $('#gh-me').textContent = `${I.name}(${I.hanja})`;
  $$('.face-img').forEach((im) => { im.src = ART.face; });
  $('#gh-result').hidden = true;
  if (inviter) showGunghap(ilgan, inviter.g, inviter.n);
  $('#stage').hidden = true;
  $('#result').hidden = false;
  showChap(1);
  window.scrollTo({top: 0, behavior: 'smooth'});
  say('', $$('.chap[data-ch="1"] .talk .face')[0], 'ch1');
}


// ---------- 상세 풀이 (10/5 사용자: "너무 간단해, 돈 낼 가치가 있게 전문적이고 디테일하게") ----------
const ROLE_NAME = {yong: '용신', hee: '희신', gi: '기신', gu: '구신', han: '한신'};
const ROLE_EASY = {yong: '나를 살리는 기운', hee: '용신을 돕는 기운', gi: '나와 안 맞는 기운', gu: '안 맞는 기운을 돕는 기운', han: '크게 상관없는 기운'};
const ROLE_PT = {yong: 2, hee: 1, han: 0, gu: -1, gi: -2};
const stars = (n) => { n = Math.max(2, Math.min(5, n)); return `<span class="st-on">${'★'.repeat(n)}</span><span class="st-off">${'★'.repeat(5 - n)}</span><span class="sr">${n}/5</span>`; };   // 최소 별 2개 (겁주지 않기)
const josaEun = (w) => { const c = w.charCodeAt(w.length - 1); return c >= 0xAC00 && c <= 0xD7A3 && (c - 0xAC00) % 28 ? '은' : '는'; };
const josaI = (w) => { const c = w.charCodeAt(w.length - 1); return c >= 0xAC00 && c <= 0xD7A3 && (c - 0xAC00) % 28 ? '이' : '가'; };
function kst(d) { const t = new Date(d.getTime() + 9 * 3600e3); return [t.getUTCMonth() + 1, t.getUTCDate()]; }
function renderDetail(p, dt) {
  const A = AN.analyze(p);
  last.A = A;
  const me = A.me;
  // 1장: 지장간·12운성 표
  const cols = [['시', p.hour], ['일', p.day], ['월', p.month], ['년', p.year]].filter(([, v]) => v);
  $('#hidden-tbl').innerHTML = `<table class="htbl"><tr><th></th>${cols.map(([l]) => `<th>${l}주</th>`).join('')}</tr>
    <tr><th>지장간</th>${cols.map(([, v]) => `<td>${AN.JIJANG[v[1]].map(([s, n]) => `${s}${n}`).join(' ')}</td>`).join('')}</tr>
    <tr><th>12운성</th>${cols.map(([, v]) => `<td>${AN.unseong(me, v[1])}</td>`).join('')}</tr></table>`;
  // 신강·신약
  const ST = TD.STRENGTH_TEXT[A.strength];
  $('#str-badge').textContent = `${A.strength} · ${A.score}점`;
  $('#gauge-bar').style.left = Math.max(3, Math.min(97, A.score < 40 ? A.score * 1.25 : 50 + (A.score - 40) * (50 / 60))) + '%';   // 40점을 가운데로
  $('#str-title').textContent = ST[0];
  $('#str-text').textContent = ST[1];
  $('#str-how').textContent = `계산법(이 사이트 기준): 나를 돕는 글자(인성·비겁)가 자리 점수(월지 30, 일지·시지 15, 나머지 10) 중 몇 %인지. 45 이상 신강, 35 미만 신약, 그 사이 중화 (무작위 6천 명 시험에서 중앙값이 40이 되도록 맞춘 기준). 월지에서 도움 ${A.deukryeong ? '받음(득령)' : '못 받음'} · 일지에서 도움 ${A.deukji ? '받음(득지)' : '못 받음'}.`;
  const rel = AN.innerRelations(p);
  $('#inner-rel').innerHTML = rel.length ? '<p class="note" style="margin-top:12px">내 사주 안의 합·충</p>' + rel.map((r) => `<span class="rel-chip ${r.kind}">${r.text}</span>`).join('') : '<p class="note" style="margin-top:12px">내 사주 안에 서로 강하게 합치거나 부딪히는 글자는 없어요.</p>';

  // 2장: 십신 분포
  const gmax = Math.max(3, ...Object.values(A.gcount));
  $('#gbars').innerHTML = AN.GROUPS.map((g) => `<div class="gbar"><b>${g}</b><span class="tr"><i style="width:${(A.gcount[g] / gmax) * 100}%"></i></span><span>${A.gcount[g]}개</span></div><p class="note" style="margin:-4px 0 4px 52px">${TD.GROUP_EASY[g]}</p>`).join('');
  const gt = [];
  AN.GROUPS.forEach((g) => {
    if (A.gcount[g] >= 3) gt.push(TD.GROUP_TEXT[g].many);
    else if (A.gcount[g] === 0) gt.push(TD.GROUP_TEXT[g].none);
  });
  if (!gt.length) gt.push(['고르게 섞인 사주', '다섯 무리가 고르게 섞여 있어서 한쪽으로 치우치지 않아요. 상황 따라 역할을 바꿔 가며 쓰는 게 강점이에요.']);
  const un = AN.unseong(me, p.day[1]);
  gt.push([`마음 자리 12운성: ${un}`, `태어난 날 땅 글자(일지)에서 그대의 힘은 '${un}' 단계예요. ${TD.UNSEONG_TEXT[un]}`]);
  $('#gtexts').innerHTML = gt.map(([t, x]) => `<div class="gtx"><div class="area-t">${t}</div><p>${x}</p></div>`).join('');

  // 3장: 용신·개운
  const roles = [['용신', A.yong, '나를 살리는 기운'], ['희신', A.hee, '용신을 돕는 기운'], ['기신', A.gi, '조심할 기운']];
  $('#yong-box').innerHTML = roles.map(([n, e, d]) => `<div style="--c:${EL[e].color}"><small>${n}</small><b>${TD.EL_NAME[e]}(${e})</b><small>${d}</small></div>`).join('');
  $('#yong-why').textContent = `그대는 ${A.strength}${A.strength === '중화' ? '라' : '이라'} ${A.why}. 그래서 ${TD.EL_NAME[A.yong]}(${A.yong}) 기운, 십신으로는 '${A.yongG}'이 그대를 살리는 기운이에요.`;
  const L = TD.EL_LUCK[A.yong];
  $('#luck').innerHTML = `<div><small>행운 색</small>${L.color}</div><div><small>행운 방향</small>${L.dir}</div><div><small>행운 숫자</small>${L.num}</div><div><small>기운 채우는 습관</small>${L.tip}</div>`;

  // 4장: 신살
  const ss = AN.sinsal(p);
  const voids = (p.voids || []).join('·');
  $('#sinsal').innerHTML = (ss.length ? ss.map((s) => `<div class="sal"><b>${s.name}</b><small>${s.where.join(', ')}</small><p style="margin:4px 0 0">${TD.SINSAL_TEXT[s.name]}</p></div>`).join('') : '<p>대표 신살이 따로 붙지 않은 담백한 사주예요. 특별한 별 대신 기본기로 승부하는 타입!</p>')
    + (voids ? `<div class="sal"><b>공망</b><small>${voids}</small><p style="margin:4px 0 0">비어 있는 자리라는 뜻이에요. 이 글자가 들어오는 해·달엔 기대보다 결과가 덜 차거나, 반대로 집착을 내려놓기 좋다고 봐요.</p></div>` : '');

  // 5장: 대운
  renderDaeun(p, dt);

  // 6장: 2027 총운 보강
  const yS = AN.STEM_EL['정'], yB = AN.BRANCH_EL['미'];
  const rS = AN.elRole(A, yS), rB = AN.elRole(A, yB);
  const dnStem = last.daeunNow ? last.daeunNow.korean[0] : null;
  const yRaw = AN.yearScore2027(A, p, dnStem);
  const yScore = AN.toStars(yRaw);
  $('#y-score').innerHTML = stars(yScore);
  const more = [];
  more.push(`2027년 하늘 글자 정(丁)은 불 기운이라 그대에게 <b>${ROLE_NAME[rS]}</b>(${ROLE_EASY[rS]}), 땅 글자 미(未)는 흙 기운이라 <b>${ROLE_NAME[rB]}</b>(${ROLE_EASY[rB]})이에요.`);
  const yr = [];
  [['년', p.year], ['월', p.month], ['일', p.day], ['시', p.hour]].forEach(([n, v]) => {
    if (!v) return;
    const r = AN.branchRel('미', v[1]);
    if (r === '충') yr.push(`${n}지 ${v[1]}${josaI(v[1])} 2027년 미(未)와 부딪혀요(충) — ${n === '일' ? '마음과 가까운 관계에 변화가 생기기 쉬워요' : n === '월' ? '일터·환경이 바뀌기 쉬워요' : n === '년' ? '집안·바깥 환경에 변화가 생기기 쉬워요' : '계획이 바뀌기 쉬워요'}.`);
    if (r === '합' || r === '반합') yr.push(`${n}지 ${v[1]}${josaI(v[1])} 2027년 미(未)와 ${r === '합' ? '합' : '한 팀(반합)'}을 이뤄요 — ${n === '일' ? '인연과 관계 운이 붙어요' : n === '월' ? '일터에서 손발이 잘 맞아요' : '주변 도움이 들어오기 좋아요'}.`);
    if (AN.stemHap('정', v[0])) yr.push(`${n}간 ${v[0]}${josaI(v[0])} 2027년 정(丁)과 합을 이뤄요 — 끌리는 일이나 사람이 생기기 쉬워요.`);
  });
  if (yr.length) more.push(...yr); else more.push('2027년 글자가 그대 사주 글자와 크게 부딪히거나 합치지 않아요. 흐름이 잔잔한 편이라 계획대로 밀고 가기 좋아요.');
  const dn = last.daeunNow;
  if (dn) more.push(`지금(2027년) 그대는 <b>${dn.korean} 대운</b>(${dn.age}세~) 안에 있어요. ${TD.DAEUN_TEXT[sipsin(me, dn.korean[0])][1]} 위에 2027년 운이 겹치는 해예요.`);
  $('#y-more').innerHTML = more.map((x) => `<p class="xtra">${x}</p>`).join('');

  // 7장: 분야별 별점 + 덧붙임
  const has = (g) => [AN.sipsin(me, '정'), AN.sipsin(me, '기')].some((s) => AN.GROUP[s] === g);
  const yrHasChung = yr.some((x) => x.includes('충'));
  const area = (adds) => AN.toStars(yRaw + adds.reduce((t, [g, v]) => t + (has(g) ? v : 0), 0));
  $('#s-money').innerHTML = stars(area([['재성', 12], ['식상', 5], ['비겁', -8]]));
  $('#s-work').innerHTML = stars(area([['관성', 12], ['인성', 4], ['식상', -6]]));
  $('#s-study').innerHTML = stars(area([['인성', 12], ['재성', -6]]));
  const sx = last.sex;
  const loveG = sx === '남' ? '재성' : sx === '여' ? '관성' : null;
  const spouseRel = AN.branchRel('미', p.day[1]);
  const loveAdd = (loveG && has(loveG) ? 12 : 0) + (sx === '여' && has('식상') && AN.sipsin(me, '정') === '상관' ? -6 : 0) + (sx === '남' && has('비겁') ? -6 : 0) + (spouseRel === '합' || spouseRel === '반합' ? 8 : spouseRel === '충' ? -8 : 0);
  $('#s-love').innerHTML = stars(AN.toStars(yRaw + loveAdd));
  const xm = [];
  if (A.gcount.재성 === 0) xm.push('원래 사주에 돈 글자(재성)가 없는 편이라, 2027년에 들어오는 돈 기운이 더 크게 느껴질 수 있어요. 들어온 돈은 바로 묶어 두기!');
  else if (A.gcount.재성 >= 3) xm.push('원래 사주에 돈 글자(재성)가 많아요. 기회는 많은데 다 잡으려다 지칠 수 있으니 두세 개만 골라 집중하기.');
  if (A.yongG === '재성') xm.push('돈 기운(재성)이 그대를 살리는 용신이라, 재물 관리 자체가 운을 키우는 일이에요.');
  if (A.gcount.비겁 >= 3) xm.push('나와 같은 기운이 많아 돈이 사람 사이로 새기 쉬워요. 빌려주기·보증은 특히 조심!');
  $('#x-money').innerHTML = xm.join('<br>'); $('#x-money').hidden = !xm.length;
  const xw = [];
  if (A.gcount.관성 === 0) xw.push('원래 사주에 직장 글자(관성)가 없어서, 틀에 맞추기보다 내 방식으로 일할 때 성과가 나요.');
  else if (A.gcount.관성 >= 3) xw.push('원래 사주에 직장 글자(관성)가 많아 책임을 잘 떠안아요. 2027년엔 거절하는 연습도 운이에요.');
  if (A.gcount.식상 >= 2 && has('관성')) xw.push('표현하는 기운(식상)과 2027년 직장 기운이 부딪히기 쉬워요. 의견은 문서로 차분하게!');
  if (AN.sinsal(p).some((s) => s.name === '역마살')) xw.push('역마살이 있어서 이직·출장·부서 이동 같은 "움직임"이 기회가 되기 쉬워요.');
  $('#x-work').innerHTML = xw.join('<br>'); $('#x-work').hidden = !xw.length;
  const xl = [];
  if (AN.sinsal(p).some((s) => s.name === '도화살')) xl.push('도화살이 있어서 원래 사람을 끄는 매력이 있어요. 2027년엔 그 매력이 인연으로 이어지기 쉬워요.');
  if (sx === '남' && A.gcount.재성 === 0) xl.push('남자 사주에서 인연 글자(재성)가 원래 없는 편이라, 2027년처럼 인연 기운이 들어오는 해를 잘 잡는 게 중요해요.');
  if (sx === '여' && A.gcount.관성 === 0) xl.push('여자 사주에서 인연 글자(관성)가 원래 없는 편이라, 마음에 드는 사람에게 먼저 다가가는 게 좋아요.');
  $('#x-love').innerHTML = xl.join('<br>'); $('#x-love').hidden = !xl.length;
  const stS = AN.GROUP[AN.sipsin(me, '정')] === '인성' || AN.GROUP[AN.sipsin(me, '기')] === '인성' ? 'strong' : (AN.GROUP[AN.sipsin(me, '정')] === '재성' || AN.GROUP[AN.sipsin(me, '기')] === '재성') ? 'weak' : 'mid';
  const STD = TD.STUDY_TEXT[stS];
  $('#a-study-t').textContent = STD[0];
  $('#a-study').textContent = STD[1] + (AN.sinsal(p).some((s) => s.name === '문창귀인') ? ' 게다가 문창귀인(글·공부의 별)이 있어서 시험·글쓰기엔 더 유리해요.' : '') + (A.gcount.인성 === 0 ? ' 원래 사주에 공부 글자(인성)가 없어서, 혼자 하기보다 스터디·강의처럼 틀 안에서 할 때 효과가 커요.' : '');
  const cnt = AN.elCount(p);
  const els = ['목', '화', '토', '금', '수'];
  const lack = els.filter((e) => cnt[e] === 0)[0] || els.slice().sort((x, y) => cnt[x] - cnt[y])[0];
  const much = els.slice().sort((x, y) => cnt[y] - cnt[x])[0];
  $('#a-health-t').textContent = `${TD.EL_NAME[lack]} 기운 채우기, ${TD.EL_NAME[much]} 기운 덜어 내기`;
  $('#a-health').textContent = `${TD.HEALTH_TEXT[lack].lack} ${cnt[much] >= 3 ? TD.HEALTH_TEXT[much].much : ''} 2027년은 불(丁)과 흙(未) 기운이 들어오는 해라, ${cnt.화 + cnt.토 >= 4 ? '열과 흙 기운이 더 쌓이지 않게 물 마시기와 가벼운 운동을 챙겨요.' : '몸을 따뜻하게 하고 규칙적인 식사를 챙기면 좋아요.'}`;
  updateOpenCount();

  // 8장: 월별
  renderMonths(p, A);
}

function renderDaeun(p, dt) {
  const L = p.luck;
  last.daeunNow = null;
  if (!L) {
    $('#daeun').innerHTML = '';
    $('#daeun-sex').hidden = false;
    return;
  }
  $('#daeun-sex').hidden = true;
  const age27 = 2027 - dt.sy;   // 2027년 기준 대략 만 나이 (생일 전후로 1살 차이 가능)
  let nowI = -1;
  L.pillars.forEach((x, i) => { if (age27 >= x.age) nowI = i; });
  if (nowI >= 0) last.daeunNow = L.pillars[nowI];
  const me = p.day[0];
  const A = last.A;
  $('#daeun').innerHTML = `<p>대운이 ${L.forward ? '앞으로(순행)' : '거꾸로(역행)'} 흐르고, <b>${L.startAge}세</b>부터 시작해요.</p>
    <div class="dw">${L.pillars.slice(0, 9).map((x, i) => {
      const s = sipsin(me, x.korean[0]);
      const r = A ? AN.elRole(A, AN.STEM_EL[x.korean[0]]) : 'han';
      return `<div class="${i === nowI ? 'now' : ''}"><small>${x.age}세~</small><b>${x.korean}</b>${s}<br><small>${ROLE_NAME[r]}</small></div>`;
    }).join('')}</div>
    ${nowI >= 0 ? (() => { const x = L.pillars[nowI], s = sipsin(me, x.korean[0]), T = TD.DAEUN_TEXT[s], r = AN.elRole(A, AN.STEM_EL[x.korean[0]]); return `<div class="gtx"><div class="area-t">지금은 ${T[0]}</div><p>${x.age}세부터 10년은 ${x.korean} 대운, ${T[1]}예요. 이 대운의 하늘 글자는 그대에게 ${ROLE_NAME[r]}(${ROLE_EASY[r]})이라 ${r === 'yong' || r === 'hee' ? '힘을 받는 10년이에요. 이때 벌인 일이 오래 가요.' : r === 'gi' || r === 'gu' ? '버티면서 실력을 쌓는 10년이에요. 무리한 확장보다 내실!' : '큰 굴곡 없이 흘러가는 10년이에요.'}</p></div>`; })() : ''}
    ${nowI + 1 < L.pillars.length && nowI >= 0 ? `<p class="note">다음 대운: ${L.pillars[nowI + 1].age}세부터 ${L.pillars[nowI + 1].korean} (${TD.DAEUN_TEXT[sipsin(me, L.pillars[nowI + 1].korean[0])][0]})</p>` : ''}`;
}

function renderMonths(p, A) {
  const me = A.me;
  const ranges = AN.MONTH_RANGES_2027;
  const scores = AN.MONTHS_2027.map((m) => AN.monthScore(A, p, m));
  const best = scores.indexOf(Math.max(...scores));
  const color = (s) => s >= 65 ? '#2F7D5B' : s >= 45 ? '#C99A2E' : '#C2553F';
  $('#mchart').innerHTML = scores.map((s, i) => `<button type="button" class="${i === best ? 'best' : ''}" style="--h:${s}%;--c:${color(s)}" data-m="${i}" aria-label="${i + 1}월 ${s}점"></button>`).join('');
  $('#mlabels').innerHTML = scores.map((s, i) => `<span>${i + 1}</span>`).join('');
  $('#months').innerHTML = AN.MONTHS_2027.map((m, i) => {
    const sS = sipsin(me, m[0]), sB = AN.branchSipsin(me, m[1]);
    const role = AN.elRole(A, AN.STEM_EL[m[0]]);
    const fl = role === 'yong' || role === 'hee' ? 'good' : role === 'gi' || role === 'gu' ? 'bad' : 'mid';
    const T = TD.MONTH_THEME[sS];
    const rel = AN.branchRel(m[1], p.day[1]);
    const lines = [T[1][fl]];
    const TB = TD.MONTH_THEME[sB];
    if (sB !== sS) lines.push(`속 흐름은 '${TB[0]}' — ${TB[1][AN.elRole(A, AN.BRANCH_EL[m[1]]) === 'yong' || AN.elRole(A, AN.BRANCH_EL[m[1]]) === 'hee' ? 'good' : 'mid']}`);
    if (rel && TD.MONTH_REL[rel]) lines.push(TD.MONTH_REL[rel]);
    if (AN.stemHap(m[0], me)) lines.push('그 달 하늘 글자가 나(일간)와 합을 이뤄요. 끌리는 제안이나 사람이 생기기 쉬워요.');
    const s = scores[i];
    return `<details class="mcard" id="m${i}" ${i === best ? 'open' : ''}><summary><span><b>${i + 1}월 · ${T[0]}</b><br><small>${ranges[i]} · ${m}(${AN.HANJA_S[m[0]]}${AN.HANJA_B[m[1]]})월 · ${sS}/${sB}</small></span><span class="sc" style="--c:${color(s)}">${s}점</span></summary>${lines.map((x) => `<p>${x}</p>`).join('')}${i === best ? '<p class="xtra">★ 2027년 중 그대에게 가장 좋은 달이에요. 중요한 시작은 이 달에!</p>' : ''}</details>`;
  }).join('');
  const worst = scores.indexOf(Math.min(...scores));
  $('#month-sum').innerHTML = `가장 좋은 달은 <b>${best + 1}월</b>, 숨 고를 달은 <b>${worst + 1}월</b>이에요.`;
}

// ---------- 장 넘기기 ----------
let chNow = 1, chMax = 1;
const CH_N = 9;
function showChap(n) {
  chNow = n; chMax = Math.max(chMax, n);
  $$('.chap').forEach((c) => c.classList.toggle('on', +c.dataset.ch === n));
  $('#toc').innerHTML = $$('.chap').map((c) => `<button type="button" data-go="${c.dataset.ch}" class="${+c.dataset.ch === n ? 'on' : ''}" ${+c.dataset.ch > chMax ? 'disabled' : ''}>${+c.dataset.ch > chMax ? '🔒' : c.dataset.ch + '장'} ${c.dataset.t}</button>`).join('');
  $$('#toc button').forEach((b) => b.addEventListener('click', () => { showChap(+b.dataset.go); window.scrollTo({top: 0, behavior: 'smooth'}); }));
  $('#ch-prev').hidden = n === 1;
  const nx = $$('.chap').find((c) => +c.dataset.ch === n + 1);
  $('#ch-next').hidden = n === CH_N;
  if (nx) $('#ch-next').textContent = `${n + 1}장 넘기기 → ${nx.dataset.t}`;
  $('#ch-count').textContent = `${n} / ${CH_N}장`;
  const face = $(`.chap[data-ch="${n}"] .talk .face`);
  if (last && n > 1) say('', face, n === 2 ? IL_KEY[last.ilgan] : 'ch' + n);
}

// ---------- 하나씩 열어 보기 (10/5 사용자: "한 번에 다 나오면 재미가 없지") ----------
const AREA_SAY = {
  money: '재물운부터 열었구려! 돈 얘기는 늘 궁금하지 💰',
  work: '일·직장운이오! 올해 일복은 어떻소? 💼',
  love: '연애·결혼운이 제일 궁금했구려? 💕',
  study: '시험·계약운이오! 도장 찍을 일이 있소? 📚',
  health: '몸이 제일 중요하지! 잘 챙기시오 🌿',
};
function updateOpenCount() {
  const all = $$('#areas .seal'), open = all.filter((s) => s.classList.contains('open'));
  $('#open-count').textContent = `${all.length}개 중 ${open.length}개 열었어요`;
  return [open.length, all.length];
}
function openSeal(s) {
  if (s.classList.contains('open')) return;
  s.classList.add('open');
  if (s.dataset.k) {
    const [o, n] = updateOpenCount();
    $('#say-areas').textContent = o === n ? '다 열었소! 친구한테도 자랑해 보시오 😎' : AREA_SAY[s.dataset.k];
    say('', $('.chap[data-ch="7"] .talk .face'), o === n ? 'a_all' : 'a_' + s.dataset.k);
  }
}

function onSubmit(e) {
  e.preventDefault();
  $('#err').textContent = '';
  let dt, h, mi;
  try {
    dt = readDate('me');
    const unknown = $('#me-hunk').checked;
    h = unknown ? null : +$('#me-h').value;
    mi = unknown ? 0 : +$('#me-mi').value;
  } catch (err) {
    $('#err').textContent = /[가-힣]/.test(err.message || '') ? err.message : '계산하지 못했어요. 입력을 확인해 주세요.';
    return;
  }
  goStep(4);
  const wait = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 900;
  setTimeout(() => {
    try {
      lastIn = {dt, h, mi, corr: $('#me-corr').checked};
      render(pillarsOf(dt, h, mi, $('#me-corr').checked, sex()), dt);
    } catch (err) {
      goStep(3);
      $('#err').textContent = '계산하지 못했어요. 입력을 확인해 주세요.';
    }
  }, wait);
}

function onGunghap(e) {
  e.preventDefault();
  $('#gh-err').textContent = '';
  if (!last) return;
  try {
    const dt = readDate('you');
    const g = calculateFourPillars({year: dt.sy, month: dt.sm, day: dt.sd, hour: 12, minute: 0}).toObject();
    showGunghap(last.ilgan, g.day[0], '상대');
    $('#gh-result').scrollIntoView({behavior: 'smooth', block: 'start'});
  } catch (err) {
    $('#gh-err').textContent = /[가-힣]/.test(err.message || '') ? err.message : '계산하지 못했어요. 입력을 확인해 주세요.';
  }
}

// ---------- 공유 카드 (이미지) ----------
const W = 1080, H = 1350;
const NIGHT = '#1E1B3A', HANJI = '#F6EFE0', GOLD = '#D9A441', GOLD2 = '#F1C873', INK = '#2B2522', BAMBOO = '#2F5D4A';
const TF = '"Jua", sans-serif', BF = '"Pretendard", sans-serif';
function siteText() {
  const h = location.protocol.startsWith('http') ? location.host + location.pathname.replace(/index\.html$/, '') : '';
  return h ? ' · ' + h : '';
}
async function fontsReady() {
  try { await Promise.all([document.fonts.load(`60px ${TF}`), document.fonts.load(`40px ${BF}`)]); } catch (e) { /* 글꼴이 없으면 기본 글꼴로 그린다 */ }
  await document.fonts.ready;
}
function base() {
  const c = document.createElement('canvas');
  c.width = W; c.height = H;
  const g = c.getContext('2d');
  g.fillStyle = NIGHT; g.fillRect(0, 0, W, H);
  g.fillStyle = 'rgba(246,231,184,0.28)';
  for (let y = 19; y < H; y += 38) for (let x = 19; x < W; x += 38) { g.beginPath(); g.arc(x, y, 1.6, 0, Math.PI * 2); g.fill(); }
  g.fillStyle = '#F6E7B8'; g.beginPath(); g.arc(950, 110, 48, 0, Math.PI * 2); g.fill();
  g.fillStyle = NIGHT; g.beginPath(); g.arc(972, 96, 44, 0, Math.PI * 2); g.fill();
  return [c, g];
}
function wrap(g, text, x, y, maxW, lh, maxLines = 6) {
  const words = text.split(' ');
  let line = '', n = 0;
  for (const w of words) {
    const t = line ? line + ' ' + w : w;
    if (g.measureText(t).width > maxW && line) {
      g.fillText(line, x, y + n * lh); n++; line = w;
      if (n >= maxLines) return n;
    } else line = t;
  }
  if (line) { g.fillText(line, x, y + n * lh); n++; }
  return n;
}
function head(g, title) {
  g.textAlign = 'center'; g.fillStyle = GOLD2; g.font = `40px ${TF}`; g.fillText(SITE, W / 2, 110);
  g.fillStyle = '#CFC6E8'; g.font = `32px ${BF}`; g.fillText(title, W / 2, 165);
}
function foot(g) { g.textAlign = 'center'; g.font = `28px ${BF}`; g.fillStyle = '#CFC6E8'; g.fillText('재미로 보는 무료 사주' + siteText(), W / 2, 1300); }
function roundRect(g, x, y, w, h, r) {
  g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath();
}
const toBlob = (c) => new Promise((res) => c.toBlob(res, 'image/png'));

async function makeCard() {
  await fontsReady();
  const {ilgan, cnt} = last;
  const I = ILGAN[ilgan];
  const [c, g] = base();
  head(g, nick() ? `${nick()}님의 사주` : '내 사주');
  g.fillStyle = HANJI; roundRect(g, 70, 210, W - 140, 990, 40); g.fill();
  g.textAlign = 'center'; g.fillStyle = INK; g.font = `92px ${TF}`; g.fillText(`나는 ${I.name}`, W / 2, 340);
  g.fillStyle = BAMBOO; g.font = `48px ${TF}`; g.fillText(I.image, W / 2, 420);
  g.fillStyle = NIGHT; roundRect(g, 140, 462, W - 280, 70, 20); g.fill();
  g.fillStyle = GOLD2; g.font = `34px ${BF}`; g.fillText(I.key, W / 2, 509);
  g.textAlign = 'left'; g.fillStyle = INK; g.font = `40px ${TF}`; g.fillText('내 안의 다섯 기운', 130, 615);
  const max = Math.max(4, ...Object.values(cnt));
  ORDER.forEach((e, i) => {
    const y = 655 + i * 82;
    g.fillStyle = INK; g.font = `40px ${TF}`; g.textAlign = 'left'; g.fillText(EL[e].label, 130, y + 40);
    g.fillStyle = '#EDE2CB'; roundRect(g, 260, y, 600, 50, 25); g.fill();
    if (cnt[e]) { g.fillStyle = EL[e].color; roundRect(g, 260, y, Math.max(50, 600 * cnt[e] / max), 50, 25); g.fill(); }
    g.fillStyle = INK; g.font = `36px ${BF}`; g.textAlign = 'right'; g.fillText(`${cnt[e]}개`, 950, y + 38);
  });
  g.textAlign = 'center'; g.fillStyle = BAMBOO; g.font = `44px ${TF}`;
  g.fillText(`2027년: ${YEAR2027[ilgan].title}`, W / 2, 1140);
  foot(g);
  return toBlob(c);
}

async function make2027() {
  await fontsReady();
  const I = ILGAN[last.ilgan];
  const Y = YEAR2027[last.ilgan];
  const [c, g] = base();
  head(g, '2027 정미년(丁未年) 신년운');
  g.textAlign = 'center'; g.fillStyle = '#F6EFE0'; g.font = `72px ${TF}`;
  g.fillText(`${nick() ? nick() + '님' : I.name}의 2027년은`, W / 2, 300);
  g.fillStyle = GOLD; roundRect(g, 80, 350, W - 160, 170, 40); g.fill();
  g.fillStyle = '#3A2A0C'; g.font = `70px ${TF}`; g.fillText(Y.title, W / 2, 460);
  g.fillStyle = HANJI; roundRect(g, 70, 570, W - 140, 600, 40); g.fill();
  g.fillStyle = BAMBOO; roundRect(g, W / 2 - 110, 610, 220, 64, 32); g.fill();
  g.fillStyle = '#F6EFE0'; g.font = `36px ${TF}`; g.fillText(Y.rel, W / 2, 655);
  g.fillStyle = INK; g.font = `40px ${BF}`;
  wrap(g, Y.text, W / 2, 750, W - 220, 64, 6);
  g.fillStyle = '#CFC6E8'; g.font = `28px ${BF}`; g.fillText('사주에선 2027년 2월 4일 입춘부터 새해예요', W / 2, 1230);
  foot(g);
  return toBlob(c);
}

async function makeGh() {
  await fontsReady();
  const {me, you, who, r} = ghLast;
  const A = ILGAN[me], B = ILGAN[you];
  const [c, g] = base();
  head(g, '우리 사주 궁합');
  g.fillStyle = HANJI; roundRect(g, 80, 230, 400, 230, 36); g.fill(); roundRect(g, W - 480, 230, 400, 230, 36); g.fill();
  g.textAlign = 'center'; g.fillStyle = INK; g.font = `70px ${TF}`; g.fillText(A.name, 280, 345); g.fillText(B.name, W - 280, 345);
  g.fillStyle = '#6E6255'; g.font = `32px ${BF}`; g.fillText(nick() || '나', 280, 410); g.fillText(who === '상대' ? '상대' : who, W - 280, 410);
  g.fillStyle = '#E8A9B4'; g.font = `90px ${BF}`; g.fillText('♥', W / 2, 375);
  g.fillStyle = GOLD; roundRect(g, W / 2 - 140, 510, 280, 86, 43); g.fill();
  g.fillStyle = '#3A2A0C'; g.font = `52px ${TF}`; g.fillText(r.score, W / 2, 570);
  g.fillStyle = '#F6EFE0'; g.font = `66px ${TF}`; g.fillText(r.title, W / 2, 710);
  g.fillStyle = HANJI; roundRect(g, 70, 770, W - 140, 400, 40); g.fill();
  g.fillStyle = INK; g.font = `38px ${BF}`;
  wrap(g, r.text, W / 2, 850, W - 220, 62, 5);
  g.fillStyle = GOLD2; g.font = `34px ${TF}`; g.fillText('너랑 나는? 이불 속 사주방에서 확인 💌', W / 2, 1235);
  foot(g);
  return toBlob(c);
}

async function shareBlob(blob, name, text) {
  const file = new File([blob], name, {type: 'image/png'});
  try {
    if (navigator.canShare && navigator.canShare({files: [file]})) {
      await navigator.share({files: [file], title: SITE, text});
      return;
    }
  } catch (e) { if (e && e.name === 'AbortError') return; }
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = name; a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000);
}
async function onShare() { if (last) shareBlob(await makeCard(), 'my-saju.png', `나는 ${ILGAN[last.ilgan].name}! 너는?`); }
async function onShare2027() { if (last) shareBlob(await make2027(), 'my-2027.png', `내 2027년은 "${YEAR2027[last.ilgan].title}" 래`); }
async function onShareGh() { if (ghLast) shareBlob(await makeGh(), 'our-gunghap.png', `우리 궁합: ${ghLast.r.title}`); }

async function onMakeLink() {
  if (!last) return;
  const n = nick() || '친구';
  const url = location.origin + location.pathname + '#g=' + encodeURIComponent(last.ilgan) + '&n=' + encodeURIComponent(n);
  const text = `[${n}] 이불 속 사주방에서 우리 궁합 볼래? 생일만 넣으면 바로 나와 💌`;
  try {
    if (navigator.share) { await navigator.share({title: SITE, text, url}); $('#link-msg').textContent = '보냈어요! 친구 답장 기다리기 💌'; return; }
  } catch (e) { if (e && e.name === 'AbortError') return; }
  try {
    await navigator.clipboard.writeText(text + ' ' + url);
    $('#link-msg').textContent = '링크 복사 완료! 카톡이나 DM에 붙여넣어 보내요 💌';
  } catch (e) {
    $('#link-msg').textContent = '복사가 안 됐어요. 이 주소를 직접 보내 주세요: ' + url;
  }
}

function setCal(prefix, v) {
  $(`#${prefix}-cal`).value = v;
  $(`#${prefix}-leapwrap`).hidden = v !== 'lunar';
}

window.addEventListener('DOMContentLoaded', () => {
  inviter = readInvite();
  setupDate('me', 1997);
  setupDate('you', 1997);
  fillSelect($('#me-h'), 0, 23, '시', 12);
  fillSelect($('#me-mi'), 0, 59, '분', 0);
  $('#art-credit').textContent = ART.credit;

  $$('.seg.cal button').forEach((b) => b.addEventListener('click', () => {
    $$('.seg.cal button').forEach((x) => x.classList.toggle('on', x === b));
    setCal('me', b.dataset.cal);
  }));
  $$('.seg.sex button').forEach((b) => b.addEventListener('click', () => {
    $$('.seg.sex button').forEach((x) => x.classList.toggle('on', x === b));
  }));

  // 목소리 — 10/5 사용자: 기기 기본 목소리(여자·기계음)는 도령답지 않음 → 녹음한 도령 목소리가 준비될 때까지 버튼을 숨긴다
  const VOICE_READY = Object.keys(RECORDED).length > 0;   // 녹음이 있으면 목소리 버튼을 보인다
  $('#read-areas').hidden = true;
  if (!VOICE_READY) $('#voice').hidden = true;
  pickVoice();
  if ('speechSynthesis' in window) speechSynthesis.onvoiceschanged = pickVoice;
  $('#voice').addEventListener('click', () => {
    setVoice(!voice.on);
    if (voice.on) {
      if (!('speechSynthesis' in window) && !Object.keys(RECORDED).length) { $('#voice').textContent = '이 기기는 목소리가 안 돼요'; return; }
      const r = $('#result').hidden ? null : chNow;
      if (r) say('', $(`.chap[data-ch="${r}"] .talk .face`), r === 1 ? 'ch1' : r === 2 ? IL_KEY[last.ilgan] : 'ch' + r);
      else say('', $('.scene'), stepNow === 0 && inviter ? null : 'step' + stepNow);
    }
  });
  try { if (VOICE_READY && localStorage.getItem('ibul-voice') === '1') setVoice(true); } catch (e) { /* 무시 */ }
  const faces = () => $$('.talk .face');
  const talkBtns = [
    () => readOut([$('#say-type').textContent, $('#type-text').textContent, '이건 진짜 잘해요. ' + $('#type-good').textContent, '이건 조심. ' + $('#type-care').textContent], faces()[0]),
    () => readOut(['2027년은 ' + $('#y-title').textContent, $('#y-text').textContent], faces()[1]),
    () => readOut(['재물운. ' + $('#a-money-t').textContent, $('#a-money').textContent, '일, 취업, 직장운. ' + $('#a-work-t').textContent, $('#a-work').textContent, '연애, 결혼운. ' + $('#a-love-t').textContent, $('#a-love').textContent, last && last.sex ? $('#a-spouse').textContent : ''], faces()[2]),
    () => readOut(['친구랑 궁합도 보겠소? 링크 하나면 끝이오', $('#link-card p').textContent], faces()[3]),
  ];
  $$('.talk .say').forEach((s, i) => {
    if (true) return;   // 긴 풀이 읽기는 녹음이 없어서 뺌
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'say-btn'; b.textContent = '▶ 들려줘';
    b.addEventListener('click', talkBtns[i]);
    s.appendChild(document.createElement('br')); s.appendChild(b);
  });
  $('#read-areas').addEventListener('click', talkBtns[2]);
  setCal('me', 'solar');
  $('#you-cal').addEventListener('change', () => setCal('you', $('#you-cal').value));
  setCal('you', 'solar');

  $('#start').addEventListener('click', () => goStep(10));
  $$('.lv').forEach((b) => b.addEventListener('click', () => {
    LV = b.dataset.lv; document.body.dataset.lv = LV;
    goStep(LV === 'new' ? 11 : 1);
  }));
  $$('.guide .gnext').forEach((b) => b.addEventListener('click', () => {
    const n = +b.closest('.panel').dataset.step;
    goStep(n >= 14 ? 1 : n + 1);
  }));
  $$('.guide .gskip').forEach((b) => b.addEventListener('click', () => goStep(1)));
  $$('.seal .cover').forEach((b) => b.addEventListener('click', () => openSeal(b.closest('.seal'))));
  $('#ch-next').addEventListener('click', () => { showChap(Math.min(CH_N, chNow + 1)); window.scrollTo({top: 0, behavior: 'smooth'}); });
  $('#ch-prev').addEventListener('click', () => { showChap(Math.max(1, chNow - 1)); window.scrollTo({top: 0, behavior: 'smooth'}); });
  $$('.ds').forEach((b) => b.addEventListener('click', () => {
    if (!lastIn || !last) return;
    $$('.seg.sex button').forEach((x) => x.classList.toggle('on', x.dataset.sex === b.dataset.sex));
    render(pillarsOf(lastIn.dt, lastIn.h, lastIn.mi, lastIn.corr, b.dataset.sex), lastIn.dt);
    showChap(5); chMax = Math.max(chMax, 5); showChap(5);
  }));
  $('#mchart').addEventListener('click', (e) => { const b = e.target.closest('button[data-m]'); if (!b) return; const d = $('#m' + b.dataset.m); d.open = true; d.scrollIntoView({behavior: 'smooth', block: 'center'}); });
  $$('[data-step="1"] .next').forEach((b) => b.addEventListener('click', () => {
    if (b.dataset.skip) $('#nick').value = '';
    goStep(2);
  }));
  $('#next2').addEventListener('click', () => {
    $('#err2').textContent = '';
    try { readDate('me'); goStep(3); } catch (err) { $('#err2').textContent = err.message; }
  });
  $('#me-hunk').addEventListener('change', () => { const u = $('#me-hunk').checked; $('#me-h').disabled = u; $('#me-mi').disabled = u; $('#me-corr').disabled = u; });
  $('#form').addEventListener('submit', onSubmit);
  $('#gh-form').addEventListener('submit', onGunghap);
  $('#share').addEventListener('click', onShare);
  $('#share-2027').addEventListener('click', onShare2027);
  $('#share-gh').addEventListener('click', onShareGh);
  $('#make-link').addEventListener('click', onMakeLink);
  $('#again').addEventListener('click', () => {
    stopTalk(); chMax = 1; $('#result').hidden = true; $('#stage').hidden = false; goStep(0); window.scrollTo({top: 0});
  });
  document.body.dataset.lv = LV;
  goStep(0);
  // 사주 / 타로 탭
  let tarotReady = false;
  $$('.tabs .tab').forEach((b) => b.addEventListener('click', () => {
    const t = b.dataset.tab;
    $$('.tabs .tab').forEach((x) => x.classList.toggle('on', x === b));
    stopTalk();
    $('#voice').hidden = t === 'tarot' || !VOICE_READY;
    $('#tarot').hidden = t !== 'tarot';
    if (t === 'tarot') { $('#stage').hidden = true; $('#result').hidden = true; if (!tarotReady) { initTarot(); tarotReady = true; } $$('#tarot .face-img').forEach((im) => { im.src = ART.face; }); }
    else { if (last && last.p) { $('#result').hidden = false; } else { $('#stage').hidden = false; } }
    window.scrollTo({top: 0});
  }));
  if (location.hash === '#tarot') $('.tabs .tab[data-tab="tarot"]').click();
});

// 시험용 (자동 검사에서만 씀)
window.__saju = {pillarsOf, countEl, relation, readInvite, goStep, speakable, voice, sipsin, showChap: (n) => { chMax = 9; showChap(n); }};
