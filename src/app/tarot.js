import {TAROT, SPREADS} from './tarot_texts.js';

// 이불 속 타로 (2026-10-05 사용자: "타로도 만들어 보려고") — 메이저 22장, 정방향만, 브라우저 안에서만 뽑는다
const $ = (s) => document.querySelector(s);
const $$ = (s) => Array.from(document.querySelectorAll(s));
const READY = new Set([...Array(18).keys()]);   // 그림이 있는 카드 번호 (18~21번은 그림 준비 중)
const TOPIC = {
  today: {label: '오늘의 운세', spread: 'one', field: 3, say: '오늘 하루를 비춰 줄 카드를 한 장 골라 보시오 🃏'},
  love: {label: '연애·속마음', spread: 'love', field: 4, say: '그 사람을 떠올리면서 세 장을 골라 보시오 💕'},
  work: {label: '일·돈', spread: 'three', field: 5, say: '일과 돈의 흐름을 세 장으로 보겠소 💼'},
  ask: {label: '고민 한 가지', spread: 'one', field: 3, say: '고민 하나를 마음속으로 또렷하게 떠올리시오 🔮'},
};
let topic = 'today', picks = [], order = [];

function rnd(n) { const a = new Uint32Array(1); crypto.getRandomValues(a); return a[0] % n; }
function shuffle() {
  order = [...Array(22).keys()];
  for (let i = order.length - 1; i > 0; i--) { const j = rnd(i + 1); [order[i], order[j]] = [order[j], order[i]]; }
}
const pad = (k) => String(k).padStart(2, '0');
function faceHTML(k) {
  const [name, en] = TAROT[k];
  const art = READY.has(k) ? `<img src="tarot/card${pad(k)}.webp" alt="${name} 카드" loading="lazy">` : `<div class="t-wip"><span>🌙</span><small>그림 준비 중</small></div>`;
  return `${art}<div class="t-rib"><b>${name}</b><small>${k} · ${en}</small></div>`;
}

function renderDeck() {
  const sp = SPREADS[TOPIC[topic].spread];
  picks = []; shuffle();
  $('#t-say').textContent = TOPIC[topic].say;
  $('#t-count').textContent = `${sp.n}장 중 0장 골랐어요`;
  $('#t-result').innerHTML = '';
  $('#t-again').hidden = true;
  const deck = $('#t-deck');
  deck.hidden = false;
  deck.innerHTML = order.map((k, i) => `<button type="button" class="t-back" data-i="${i}" style="--d:${i * 25}ms" aria-label="카드 ${i + 1}번"></button>`).join('');
  deck.classList.remove('dealt'); void deck.offsetWidth; deck.classList.add('dealt');
}

function pick(i) {
  const sp = SPREADS[TOPIC[topic].spread];
  if (picks.length >= sp.n || picks.includes(i)) return;
  picks.push(i);
  const b = $(`#t-deck [data-i="${i}"]`);
  b.classList.add('picked'); b.disabled = true;
  $('#t-count').textContent = `${sp.n}장 중 ${picks.length}장 골랐어요`;
  if (picks.length === sp.n) setTimeout(reveal, 450);
}

function reveal() {
  const T = TOPIC[topic], sp = SPREADS[T.spread];
  $('#t-deck').hidden = true;
  $('#t-count').textContent = '카드를 눌러 한 장씩 뒤집어 보시오!';
  $('#t-result').innerHTML = picks.map((i, n) => {
    const k = order[i];
    return `<div class="t-slot"><div class="t-pos">${sp.pos[n]}</div>
      <button type="button" class="t-card" data-k="${k}" aria-label="${sp.pos[n]} 카드 뒤집기"><span class="t-in"><span class="t-f">${faceHTML(k)}</span><span class="t-b"></span></span></button>
      <div class="t-read" hidden></div></div>`;
  }).join('');
  $$('#t-result .t-card').forEach((c) => c.addEventListener('click', () => flip(c)));
}

function flip(c) {
  if (c.classList.contains('open')) return;
  c.classList.add('open');
  const k = +c.dataset.k, T = TOPIC[topic], C = TAROT[k];
  const read = c.parentElement.querySelector('.t-read');
  const main = T.field === 3 ? C[3] : C[T.field];
  read.innerHTML = `<div class="area-t">${C[0]} — ${C[2]}</div><p>${main}</p>${T.field !== 3 && T.field !== 6 ? `<p class="note">${C[3]}</p>` : ''}${topic === 'ask' || topic === 'today' ? `<p class="xtra">도령의 한마디: ${C[6]}</p>` : ''}`;
  setTimeout(() => { read.hidden = false; }, 380);
  const all = $$('#t-result .t-card'), done = all.filter((x) => x.classList.contains('open')).length;
  if (done === all.length) {
    $('#t-count').textContent = '다 뒤집었소! 마음에 남는 한 줄을 기억해 두시오 ✨';
    $('#t-again').hidden = false;
    const ks = all.map((x) => +x.dataset.k);
    if (ks.length === 3) $('#t-say').textContent = `${TAROT[ks[0]][0]} → ${TAROT[ks[1]][0]} → ${TAROT[ks[2]][0]}… 흐름이 보이오? 👀`;
    else $('#t-say').textContent = `그대의 카드는 ${TAROT[ks[0]][0]}! ${TAROT[ks[0]][2]}의 기운이오 ✨`;
  }
}

export function initTarot() {
  $$('.t-topic').forEach((b) => b.addEventListener('click', () => {
    topic = b.dataset.t;
    $$('.t-topic').forEach((x) => x.classList.toggle('on', x === b));
    renderDeck();
  }));
  $('#t-deck').addEventListener('click', (e) => { const b = e.target.closest('.t-back'); if (b) pick(+b.dataset.i); });
  $('#t-again').addEventListener('click', () => { renderDeck(); window.scrollTo({top: 0, behavior: 'smooth'}); });
  renderDeck();
}
