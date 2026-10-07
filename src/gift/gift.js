// 이불 속 선물방 — 사주로 고르는 운 트이는 선물 (2026-10-07)
// 생일은 브라우저 안에서만 계산하고 어디에도 보내거나 저장하지 않아요.
// 조르기 링크에는 생일이 아니라 결과 유형(일간·기운·관계·예산)과 별명만 담겨요.
import {calculateFourPillars, lunarToSolar} from 'manseryeok';
import {analyze} from '../app/analysis.js';
import {ART} from '../app/art.js';
import {STEM_LIST, EL_LIST, TYPES, EL, REL, BUDGET, BUDGET_OF, GIFTS, LINES, DISCLOSURE} from './gift_texts.js';
import {LINKS} from './gift_links.js';

const $ = (s) => document.querySelector(s);
const $$ = (s) => [...document.querySelectorAll(s)];
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));

const S = {mode: 'give', rel: 'l', budget: 3, res: null};

// ---------- 화면 전환 ----------
function show(id) {
  $$('.screen').forEach((el) => { el.hidden = el.id !== id; });
  window.scrollTo({top: 0, behavior: 'instant' in window ? 'instant' : 'auto'});
}
function bubble(html, art) {
  $('#bubble-text').innerHTML = html;
  if (art !== undefined) $('#scene-img').src = ART.steps[art];
}

// ---------- 날짜 입력 ----------
function fillSelect(sel, from, to, suffix, def, placeholder) {
  sel.innerHTML = '';
  if (placeholder) { const o = document.createElement('option'); o.value = ''; o.textContent = placeholder; sel.appendChild(o); }
  for (let v = from; v <= to; v++) {
    const o = document.createElement('option');
    o.value = v; o.textContent = v + suffix;
    if (v === def) o.selected = true;
    sel.appendChild(o);
  }
  if (def === null || def === undefined) sel.value = '';
}
function setupDate() {
  const y = $('#f-y'), yt = $('#f-yt');
  fillSelect(y, 1900, 2050, '년', 1990, null);
  y.dataset.touched = '';
  y.addEventListener('change', () => { y.dataset.touched = '1'; yt.value = y.value; yt.classList.remove('bad'); });
  yt.addEventListener('input', () => {
    yt.value = yt.value.replace(/[^0-9]/g, '').slice(0, 4);
    const v = +yt.value;
    if (yt.value.length < 4) { yt.classList.remove('bad'); return; }
    if (v >= 1900 && v <= 2050) { y.value = String(v); y.dataset.touched = '1'; yt.classList.remove('bad'); }
    else yt.classList.add('bad');
  });
  fillSelect($('#f-m'), 1, 12, '월', null, '월');
  fillSelect($('#f-d'), 1, 31, '일', null, '일');
  $$('#f-cal button').forEach((b) => b.addEventListener('click', () => {
    $$('#f-cal button').forEach((x) => x.classList.toggle('on', x === b));
    $('#f-leapwrap').hidden = b.dataset.v !== 'lunar';
  }));
}
function readDate() {
  if ($('#f-yt').classList.contains('bad')) throw new Error('태어난 해는 1900년부터 2050년 사이로 써 주시오.');
  const y = +$('#f-y').value, m = +$('#f-m').value, d = +$('#f-d').value;
  if (!y || !m || !d) throw new Error('태어난 해·달·날을 모두 골라 주시오.');
  const lunar = $('#f-cal .on').dataset.v === 'lunar';
  if (lunar) {
    let r = null;
    try { r = lunarToSolar(y, m, d, $('#f-leap').checked); } catch (e) { r = null; }
    if (!r || !r.year) throw new Error('없는 음력 날짜요. 날짜나 윤달 여부를 확인해 주시오.');
    return {sy: r.year, sm: r.month, sd: r.day};
  }
  const dt = new Date(y, m - 1, d);
  if (dt.getMonth() !== m - 1) throw new Error('없는 날짜요. 날짜를 확인해 주시오.');
  return {sy: y, sm: m, sd: d};
}
// 시간은 묻지 않아요: 사주방과 같은 방식으로 낮 12시 기준 해·달·날 기둥만 써요
function pillarsOf(dt) {
  const o = calculateFourPillars({year: dt.sy, month: dt.sm, day: dt.sd, hour: 12, minute: 0}).toObject();
  return {year: o.year, month: o.month, day: o.day, hour: null};
}

// ---------- 관계·예산 고르기 ----------
function renderChips() {
  $('#f-rel').innerHTML = Object.entries(REL).map(([k, v]) => `<button type="button" data-v="${k}" class="${k === S.rel ? 'on' : ''}">${v.name}</button>`).join('');
  const bs = BUDGET_OF[S.rel];
  if (!bs.includes(S.budget)) S.budget = bs[bs.length - 1];
  $('#f-budget').innerHTML = bs.map((b) => `<button type="button" data-v="${b}" class="${b === S.budget ? 'on' : ''}">${BUDGET[b]}</button>`).join('');
  $$('#f-rel button').forEach((b) => b.addEventListener('click', () => { S.rel = b.dataset.v; renderChips(); }));
  $$('#f-budget button').forEach((b) => b.addEventListener('click', () => { S.budget = +b.dataset.v; renderChips(); }));
  $('#f-relq').textContent = S.mode === 'beg' ? '누구한테 조를 거요?' : '누구에게 줄 선물이오?';
}

// ---------- 선물 고르기 ----------
function hash(str) { let h = 2166136261; for (const c of str) { h ^= c.codePointAt(0); h = Math.imul(h, 16777619); } return h >>> 0; }
function rng(seed) { let s = seed || 1; return () => { s ^= s << 13; s ^= s >>> 17; s ^= s << 5; return ((s >>> 0) % 100000) / 100000; }; }
function shuffle(arr, r) { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
export function pickGifts(el, rel, budget, seedStr) {
  const r = rng(hash(seedStr));
  const ok = GIFTS[el].filter((g) => g.r.includes(rel) && g.b <= budget);
  const bands = [...new Set(ok.map((g) => g.b))].sort((a, b) => (a === budget ? -1 : b === budget ? 1 : b - a));
  let out = [];
  bands.forEach((b) => { out = out.concat(shuffle(ok.filter((g) => g.b === b), r)); });
  return out.slice(0, 3);
}
const linkOf = (g) => LINKS[g.id] || `https://www.coupang.com/np/search?q=${encodeURIComponent(g.k)}`;
const hasPartner = () => Object.values(LINKS).some(Boolean);

// 결과 코드: 일간(0~9) + 용신(0~4) + 기신(0~4) + 관계(l/p/c) + 예산(1/3/5/9)
function encode(res) { return `${STEM_LIST.indexOf(res.stem)}${EL_LIST.indexOf(res.yong)}${EL_LIST.indexOf(res.gi)}${res.rel}${res.budget === 10 ? 9 : res.budget}`; }
function decode(j) {
  const m = /^([0-9])([0-4])([0-4])([lpc])([1359])$/.exec(j || '');
  if (!m) return null;
  const budget = m[5] === '9' ? 10 : +m[5];
  const rel = m[4];
  if (!BUDGET_OF[rel].includes(budget) || m[2] === m[3]) return null;
  return {stem: STEM_LIST[+m[1]], yong: EL_LIST[+m[2]], gi: EL_LIST[+m[3]], rel, budget};
}

// ---------- 결과 ----------
function renderResult(res, view) {
  const T = TYPES[res.stem], Y = EL[res.yong], G = EL[res.gi];
  const code = encode(res);
  const gifts = pickGifts(res.yong, res.rel, res.budget, code);
  const who = view ? `<b>${esc(res.nick)}</b>님` : S.mode === 'beg' ? '그대' : '이 사람';
  $('#r-disc').hidden = !hasPartner();
  $('#r-disc').textContent = DISCLOSURE;
  $('#r-type').innerHTML = `
    <div class="kicker">${who}의 타고난 선물 성향</div>
    <div class="type-row"><span class="big-emoji">${T.emoji}</span><div><div class="type-name">${T.name}</div><div class="type-sub">${T.hanja} · <b>${T.style}</b></div></div></div>
    <p>${T.line}</p><p class="tip">💡 ${T.tip}</p>`;
  $('#r-el').style.setProperty('--c', Y.color);
  $('#r-el').style.setProperty('--soft', Y.soft);
  $('#r-el').innerHTML = `
    <div class="kicker">${who}에게 모자란 기운</div>
    <div class="el-big">${Y.emoji} ${Y.name}(${Y.hanja}) 기운</div>
    <p>이 기운을 채우면 <b>${Y.luck}</b>이 살아난다 하오.<br>어울리는 것: ${Y.look}</p>`;
  $('#r-gifts').innerHTML = gifts.map((g, i) => `
    <a class="gift" style="--i:${i}" href="${esc(linkOf(g))}" target="_blank" rel="sponsored noopener" data-id="${g.id}">
      <span class="g-no">${i + 1}</span>
      <span class="g-body"><b>${esc(g.n)}</b><span class="g-why">${esc(g.why)}</span><span class="g-price">보통 ${BUDGET[g.b]} · 가격은 쿠팡에서 확인</span></span>
      <span class="g-go">쿠팡에서<br>보기 ›</span>
    </a>`).join('');
  $('#r-avoid').innerHTML = `<b>🙅 이건 피하시오:</b> ${G.avoid}. ${who === '이 사람' ? '이 사람' : who}에겐 ${G.name}(${G.hanja}) 기운이 맞지 않소.`;
  $('#r-note').textContent = hasPartner() ? '' : '지금은 쿠팡 검색 화면으로 연결돼요.';
  // 공유 영역
  const url = `${location.origin}${location.pathname}`;
  if (view) {
    $('#r-share').innerHTML = `<p class="share-q">나도 조르고 싶소? 🙏</p>
      <button id="go-beg" class="dark">나도 조르기 링크 만들기</button>
      <button id="go-give" class="ghost">내가 줄 선물 고르기</button>`;
  } else if (S.mode === 'beg') {
    const link = `${url}?j=${code}&n=${encodeURIComponent(res.nick)}`;
    $('#r-share').innerHTML = `<p class="share-q">이 링크를 ${REL[res.rel].short}에게 보내시오! 열면 이 선물 목록이 바로 보이오.</p>
      <div class="linkbox" id="r-link">${esc(link)}</div>
      <button id="share-link">${REL[res.rel].call} 조르기 링크 보내기</button>
      <button id="copy-link" class="ghost">링크만 복사하기</button>
      <p class="hint">링크에는 생일이 들어가지 않아요. 결과 유형과 별명만 담겨요.</p>`;
    $('#share-link').addEventListener('click', () => share(link, `${res.nick}님이 선물을 조르고 있어요 🙏`));
    $('#copy-link').addEventListener('click', () => copy(link));
  } else {
    $('#r-share').innerHTML = `<p class="share-q">받을 사람한테 슬쩍 보여 줘도 재밌소 😏</p>
      <button id="share-site">선물방 친구에게 알려 주기</button>
      <button id="go-beg" class="ghost">나도 받고 싶은 선물 조르기</button>`;
    $('#share-site').addEventListener('click', () => share(url, '사주로 고르는 운 트이는 선물 🎁'));
  }
  $('#r-again').hidden = !!view;
  $('#go-beg')?.addEventListener('click', () => startForm('beg'));
  $('#go-give')?.addEventListener('click', () => startForm('give'));
  // 선물 상자는 닫힌 채로 시작
  $('#r-box').classList.remove('open');
  $('#r-open').hidden = true;
  $('#r-box').hidden = false;
}
function openBox() {
  const box = $('#r-box');
  if (box.classList.contains('open')) return;
  box.classList.add('open');
  confetti();
  setTimeout(() => { box.hidden = true; $('#r-open').hidden = false; bubble(S.view ? LINES.beg_view(esc(S.res.nick), S.res.rel) : '짜잔~ 이 세 가지가 운을 채워 주는 선물이오! 🎉', 2); }, 650);
}
function confetti() {
  const host = $('#confetti');
  const parts = ['🎉', '✨', '🎁', '💛', '🌟'];
  host.innerHTML = Array.from({length: 18}, (_, i) => `<i style="--x:${Math.round((Math.random() - 0.5) * 320)}px;--y:${Math.round(-120 - Math.random() * 200)}px;--r:${Math.round(Math.random() * 360)}deg;--d:${i * 18}ms">${parts[i % parts.length]}</i>`).join('');
  host.classList.remove('go'); void host.offsetWidth; host.classList.add('go');
}
async function share(url, text) {
  if (navigator.share) {
    try { await navigator.share({title: '이불 속 선물방', text, url}); return; } catch (e) { if (e && e.name === 'AbortError') return; }
  }
  copy(url);
}
async function copy(text) {
  try { await navigator.clipboard.writeText(text); toast('링크를 복사했소! 붙여넣기 하시오 📋'); }
  catch (e) { toast('복사가 안 되오. 위 링크를 길게 눌러 복사하시오.'); }
}
function toast(msg) { const t = $('#toast'); t.textContent = msg; t.hidden = false; clearTimeout(t._h); t._h = setTimeout(() => { t.hidden = true; }, 2600); }

// ---------- 흐름 ----------
function startForm(mode) {
  S.mode = mode; S.view = false;
  history.replaceState(null, '', location.pathname);
  $('#f-title').textContent = mode === 'beg' ? '🙏 선물 조르기' : '🎁 선물 주기';
  $('#f-nickwrap').hidden = mode !== 'beg';
  $('#f-dateq').textContent = mode === 'beg' ? '그대의 생일' : '받을 사람의 생일';
  $('#f-go').textContent = mode === 'beg' ? '조르기 링크 만들기' : '도령, 골라 주시오!';
  $('#f-err').textContent = '';
  renderChips();
  bubble(mode === 'beg' ? LINES.beg_intro : LINES.give_intro, 1);
  show('s-form');
}
function onSubmit() {
  const err = $('#f-err');
  err.textContent = '';
  let nick = '';
  if (S.mode === 'beg') {
    nick = $('#f-nick').value.trim().slice(0, 10);
    if (!nick) { err.textContent = '친구가 누군지 알아보게 별명을 써 주시오.'; $('#f-nick').focus(); return; }
  }
  const y = $('#f-y');
  if (!y.dataset.touched && y.value === '1990' && !y.dataset.asked) {
    y.dataset.asked = '1';
    err.textContent = '태어난 해가 정말 1990년이오? 기본으로 골라 둔 해라 한 번 더 묻소. 맞으면 버튼을 한 번 더 누르시오!';
    y.classList.add('ask'); setTimeout(() => y.classList.remove('ask'), 2400);
    return;
  }
  let dt;
  try { dt = readDate(); } catch (e) { err.textContent = e.message; return; }
  const A = analyze(pillarsOf(dt));
  S.res = {stem: A.me, yong: A.yong, gi: A.gi, rel: S.rel, budget: S.budget, nick};
  bubble(LINES.loading, 2);
  show('s-load');
  setTimeout(() => { renderResult(S.res, false); bubble(LINES.open_box, 4); show('s-result'); }, 1600);
}

function init() {
  $('#scene-img').src = ART.steps[0];
  $('#credit').textContent = ART.credit;
  setupDate();
  $('#h-give').addEventListener('click', () => startForm('give'));
  $('#h-beg').addEventListener('click', () => startForm('beg'));
  $('#f-go').addEventListener('click', onSubmit);
  $('#f-back').addEventListener('click', () => { bubble(HOME, 0); show('s-home'); });
  $('#r-box').addEventListener('click', openBox);
  $('#r-again').addEventListener('click', () => startForm(S.view ? 'give' : S.mode));
  // 조르기 링크로 들어온 경우
  const q = new URLSearchParams(location.search);
  const res = decode(q.get('j'));
  if (res) {
    res.nick = (q.get('n') || '친구').slice(0, 10);
    S.res = res; S.view = true; S.mode = 'view';
    renderResult(res, true);
    bubble(`<b>${esc(res.nick)}</b>님이 보낸 선물 상자가 도착했소! <b>툭 눌러서</b> 열어 보시오 🎁`, 4);
    show('s-result');
    return;
  }
  bubble(HOME, 0);
  show('s-home');
}
const HOME = '어서 오시오~ <b>이불 속 선물방</b>이오 🎁<br>사주로 <b>운 트이는 선물</b>을 골라 드리리다. 줄 거요, 조를 거요?';

window.__gift = {pickGifts, encode, decode, S, calc: (y, m, d) => { const A = analyze(pillarsOf({sy: y, sm: m, sd: d})); return {stem: A.me, yong: A.yong, gi: A.gi}; }};
init();
