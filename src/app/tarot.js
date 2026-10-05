import {TAROT, SPREADS, SYMBOL, TONE} from './tarot_texts.js';

// 이불 속 타로방 — 실제로 보는 순서대로 한 단계씩 (10/5 사용자: "실제로 보는 것처럼 스텝 바이 스텝, 모르는 거 다 설명")
// 단계: 30 처음/해봄 → 31 타로란? → 32 진행 순서 → 33 질문 → 34 마음 가라앉히기 → 35 섞기 → 36 커트 → 37 고르기 → 38 공개·풀이
const $ = (s) => document.querySelector(s);
const $$ = (s) => Array.from(document.querySelectorAll(s));
const READY = new Set([...Array(18).keys()]);   // 그림이 있는 카드 (18~21번은 그림 준비 중)
export const TOPIC = {
  today: {label: '오늘의 운세', spread: 'one', field: 3},
  love: {label: '연애·속마음', spread: 'love', field: 4},
  work: {label: '일·돈', spread: 'three', field: 5},
  ask: {label: '고민 한 가지', spread: 'one', field: 3},
};
const POS_DESC = {
  one: ['지금 그대에게 꼭 필요한 메시지예요.'],
  three: ['지금 상황을 만든 배경이에요.', '지금 가장 중요하게 작용하는 기운이에요.', '이대로 가면 펼쳐질 흐름이에요. 정해진 미래가 아니라 "지금 방향"이에요.'],
  love: ['내가 이 관계에서 바라는 것, 내 속마음이에요.', '상대가 보여 주는 기운이에요. 어디까지나 짐작이니 단정하지는 말기!', '둘 사이가 흘러가는 방향이에요.'],
};
let T = {topic: 'today', q: '', order: [], picks: [], shuffling: null, goStep: null, face: ''};

function rnd(n) { const a = new Uint32Array(1); crypto.getRandomValues(a); return a[0] % n; }
function shuffleOnce() {
  const o = T.order.length ? T.order.slice() : [...Array(22).keys()];
  for (let i = o.length - 1; i > 0; i--) { const j = rnd(i + 1); [o[i], o[j]] = [o[j], o[i]]; }
  T.order = o;
}
const pad = (k) => String(k).padStart(2, '0');
function faceHTML(k) {
  const [name, en] = TAROT[k];
  const art = READY.has(k) ? `<img src="tarot/card${pad(k)}.webp" alt="${name} 카드" loading="lazy">` : `<div class="t-wip"><span>🌙</span><small>그림 준비 중</small></div>`;
  return `${art}<div class="t-rib"><b>${name}</b><small>${k} · ${en}</small></div>`;
}
const spread = () => SPREADS[TOPIC[T.topic].spread];

// 35 섞기
function startShuffle() {
  if (T.shuffling) return;
  $('#t-stack').classList.add('mixing');
  $('#t-shuf').textContent = '이제 그만! ✋';
  T.shuffling = setInterval(shuffleOnce, 90);
}
function stopShuffle() {
  clearInterval(T.shuffling); T.shuffling = null;
  shuffleOnce();
  $('#t-stack').classList.remove('mixing');
  T.goStep(36);
}
// 36 커트: 세 더미 중 하나를 맨 위로
function cut(i) {
  const a = T.order.slice(0, 7), b = T.order.slice(7, 14), c = T.order.slice(14);
  const piles = [a, b, c];
  const top = piles[i];
  T.order = [...top, ...piles.filter((_, j) => j !== i).flat()];
  $$('.t-pile').forEach((p, j) => p.classList.toggle('chosen', j === i));
  setTimeout(() => { renderDeck(); T.goStep(37); }, 500);
}
// 37 고르기 (선택 표시, 다시 누르면 취소)
function renderDeck() {
  T.picks = [];
  const deck = $('#t-deck');
  deck.innerHTML = T.order.map((k, i) => `<button type="button" class="t-back" data-i="${i}" style="--d:${i * 22}ms" aria-pressed="false" aria-label="카드 ${i + 1}번"><span class="t-num"></span></button>`).join('');
  deck.classList.remove('dealt'); void deck.offsetWidth; deck.classList.add('dealt');
  updatePick();
}
function togglePick(i) {
  const n = spread().n;
  const at = T.picks.indexOf(i);
  if (at >= 0) T.picks.splice(at, 1);
  else if (T.picks.length < n) T.picks.push(i);
  else { $('#t-count').textContent = `이미 ${n}장을 골랐소! 바꾸려면 고른 카드를 한 번 더 눌러 취소하시오`; return; }
  updatePick();
}
function updatePick() {
  const sp = spread();
  $$('#t-deck .t-back').forEach((b) => {
    const at = T.picks.indexOf(+b.dataset.i);
    b.classList.toggle('picked', at >= 0);
    b.setAttribute('aria-pressed', at >= 0 ? 'true' : 'false');
    b.querySelector('.t-num').textContent = at >= 0 ? at + 1 : '';
  });
  const left = sp.n - T.picks.length;
  $('#t-count').textContent = left ? `${sp.n}장 중 ${T.picks.length}장 골랐어요 · ${T.picks.length ? '' : ''}${sp.pos[T.picks.length]} 자리 카드를 골라 주시오` : `${sp.n}장 다 골랐어요! 마음에 들면 아래 버튼을 누르시오 (취소하려면 카드를 다시 누르기)`;
  $('#t-confirm').disabled = !!left;
  $('#t-slots').innerHTML = sp.pos.map((p, j) => `<span class="${T.picks[j] !== undefined ? 'on' : ''}">${j + 1}. ${p}</span>`).join('');
}
// 38 상담 — 10/5 사용자: "타로도 세세하고 보기 편하게, 진짜 상담처럼. NPC 도령이 그래서 있는 건데"
// 도령이 한 마디씩 말하고(입력 중… 표시), 그대가 칩을 눌러 대답하며 한 장씩 뒤집고 읽는 대화형 풀이.
let RUN = 0;   // 다시 보기를 누르면 이전 대화를 멈추기 위한 번호
let skip = null;
const fast = () => reduceMotion();
function reduceMotion() { return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches; }
function wait(ms) {
  return new Promise((res) => { const t = setTimeout(done, fast() ? 0 : ms); function done() { clearTimeout(t); skip = null; res(); } skip = done; });
}
function scrollTo(el) { try { el.scrollIntoView({behavior: fast() ? 'auto' : 'smooth', block: 'nearest'}); } catch (e) { /* 무시 */ } }
const plainLen = (h) => h.replace(/<[^>]*>/g, '').length;
function audioDone(au) {   // 녹음이 끝날 때까지 기다림 (대화창을 누르면 건너뜀)
  return new Promise((res) => {
    let fin = false;
    const f = () => { if (fin) return; fin = true; clearTimeout(t); skip = null; res(); };
    const t = setTimeout(f, 40000);
    au.addEventListener('ended', f, {once: true}); au.addEventListener('nogo', f, {once: true});
    skip = () => { try { au.pause(); } catch (e) { /* 무시 */ } f(); };
  });
}
async function dl(html, cls = '', key = null) {   // 도령이 말하기 (key: 녹음 파일 이름, 있으면 소리와 함께)
  const run = RUN;
  const box = $('#t-chat');
  const m = document.createElement('div');
  m.className = 'msg d typing'; m.innerHTML = '<span class="av"><img alt="" src="' + (T.face || '') + '"></span><div class="tx"><i></i><i></i><i></i></div>';
  box.appendChild(m); scrollTo(m);
  const au = key && T.speak ? T.speak(key) : null;
  await wait(au ? 350 : Math.min(1300, 400 + plainLen(html) * 10));
  if (run !== RUN) throw new Error('stop');
  m.classList.remove('typing'); if (cls) m.classList.add(cls);
  m.querySelector('.tx').innerHTML = html;
  scrollTo(m);
  if (au) await audioDone(au); else await wait(250);
  if (run !== RUN) throw new Error('stop');
  return m;
}
function me(text) {
  const m = document.createElement('div');
  m.className = 'msg me'; m.innerHTML = `<div class="tx">${text}</div>`;
  $('#t-chat').appendChild(m); scrollTo(m);
}
function ask(opts) {   // 대답 칩: [{label, v}] → 고른 v
  const run = RUN;
  return new Promise((res, rej) => {
    const box = $('#t-reply');
    box.innerHTML = opts.map((o, i) => `<button type="button" class="chip${i ? ' sub' : ''}" data-i="${i}">${o.label}</button>`).join('');
    box.hidden = false; scrollTo(box);
    box.onclick = (e) => {
      const b = e.target.closest('.chip'); if (!b) return;
      box.onclick = null; box.hidden = true; box.innerHTML = '';
      if (run !== RUN) { rej(new Error('stop')); return; }
      const o = opts[+b.dataset.i];
      if (o.say !== false) me(o.label.replace(/<[^>]*>/g, ''));
      res(o.v);
    };
  });
}
function cardMsg(k, n) {   // 아직 뒤집지 않은 카드를 대화창에 놓는다
  const m = document.createElement('div');
  m.className = 'msg cardm';
  m.innerHTML = `<button type="button" class="t-card" data-k="${k}" aria-label="${spread().pos[n]} 카드 뒤집기"><span class="t-in"><span class="t-f">${faceHTML(k)}</span><span class="t-b"></span></span></button><small class="flip-hint">카드를 톡 눌러 뒤집으시오</small>`;
  $('#t-chat').appendChild(m); scrollTo(m);
  return m.querySelector('.t-card');
}
function flipWait(card) {
  return new Promise((res) => {
    const go = () => {
      if (card.classList.contains('open')) return;
      card.classList.add('open'); card.parentElement.classList.add('flipped');
      $('#t-reply').hidden = true; $('#t-reply').innerHTML = '';
      setTimeout(res, fast() ? 0 : 800);
    };
    card.addEventListener('click', go);
    const box = $('#t-reply');
    box.innerHTML = '<button type="button" class="chip">🃏 카드 뒤집기</button>'; box.hidden = false;
    box.onclick = (e) => { if (e.target.closest('.chip')) { box.onclick = null; go(); } };
  });
}
function mapHTML(ks, open) {
  const sp = spread();
  return sp.pos.map((p, j) => {
    const k = ks[j]; const on = open > j;
    return `<div class="tm${on ? ' on' : ''}">${on && READY.has(k) ? `<img src="tarot/card${pad(k)}.webp" alt="">` : '<i></i>'}<b>${on ? TAROT[k][0] : '?'}</b><small>${p}</small></div>`;
  }).join('');
}
const FIELD_NAME = {3: '기본 뜻으로', 4: '연애로', 5: '일·돈으로'};
const io = (w) => { const c = w.charCodeAt(w.length - 1) - 0xAC00; return w + (c >= 0 && c < 11172 && c % 28 ? '이오' : '요'); };
function topicLine(k, j) {
  const tp = TOPIC[T.topic], C = TAROT[k];
  if (T.topic === 'love' && j === 1) return `상대 쪽 자리라 어디까지나 짐작이오. 이 카드로 보면 상대는… ${C[4]}`;
  if (tp.field === 3) return `${T.topic === 'today' ? '오늘 하루에' : '그대 고민에'} 대 보면, ${C[6]}`;
  return C[tp.field];
}
function readFlow(ks) {
  const kw = (k) => `“${TAROT[k][2]}”`;
  const nm = (k) => `<b>${TAROT[k][0]}</b>`;
  if (ks.length === 1) return `한 장으로 보는 질문은 그 카드가 곧 답이오. ${nm(ks[0])}의 ${kw(ks[0])} 기운, 이것 하나만 기억해도 충분하오.`;
  if (T.topic === 'love') return `그대 마음엔 ${nm(ks[0])}의 ${kw(ks[0])}, 상대 쪽엔 ${nm(ks[1])}의 ${kw(ks[1])} 기운이 보이오. 두 기운이 만나 ${nm(ks[2])}, 곧 ${kw(ks[2])} 쪽으로 흘러가고 있소.`;
  return `지나온 ${nm(ks[0])}의 ${kw(ks[0])} 위에서, 지금은 ${nm(ks[1])}의 ${kw(ks[1])}에 힘을 싣는 게 열쇠요. 그러면 앞으로 ${nm(ks[2])}의 ${kw(ks[2])} 쪽으로 이어지기 쉽소.`;
}
function toneLine(ks) {
  const c = {1: 0, 0: 0, '-1': 0};
  ks.forEach((k) => { c[TONE[k]] += 1; });
  if (ks.length === 1) {
    const t = TONE[ks[0]];
    return t > 0 ? '밝은 기운의 카드가 나왔소. 망설이던 일이 있으면 한 발 내디뎌도 좋은 때요.' : t < 0 ? '숙제를 주는 카드가 나왔소. 겁낼 건 없소. "여기를 한 번 살펴보라"는 신호일 뿐이오.' : '차분한 카드가 나왔소. 서두르기보다 한 번 더 생각하고 움직이면 좋은 때요.';
  }
  const parts = [c[1] && `밝은 카드 ${c[1]}장`, c[0] && `차분한 카드 ${c[0]}장`, c['-1'] && `숙제를 주는 카드 ${c['-1']}장`].filter(Boolean).join(', ');
  const verdict = c['-1'] === 0 ? '걸리는 게 거의 없는 흐름이오. 마음 가는 대로 움직여도 좋소.' : c[1] > c['-1'] ? '좋은 기운이 더 크오. 숙제 카드가 가리키는 한 곳만 챙기면 되오.' : c[1] === c['-1'] ? '밝은 기운과 숙제가 팽팽하오. 숙제 카드 쪽을 먼저 챙기면 밝은 카드 기운이 살아나오.' : '지금은 살펴볼 게 있는 흐름이오. 서두르지 말고 숙제 카드부터 들여다보시오.';
  return `세 장을 나눠 보면 ${parts}이오. ${verdict}`;
}
async function consult() {
  const run = ++RUN;
  const sp = spread(), tp = TOPIC[T.topic];
  const ks = T.picks.map((i) => T.order[i]);
  const newbie = document.body.dataset.tl === 'new';
  $('#t-chat').innerHTML = ''; $('#t-reply').hidden = true; $('#t-end').hidden = true;
  $('#t-qshow').innerHTML = `<b>${tp.label}</b>${T.q ? ` · “${T.q}”` : ''}`;
  $('#t-map').innerHTML = mapHTML(ks, 0);
  try {
    await dl(T.q ? `그대가 가져온 질문은 이것이었소.<br><b>“${T.q}”</b>` : `오늘 주제는 <b>${io(tp.label)}</b>.`);
    await dl('자, 그대가 고른 카드를 같이 보겠소. 실제 상담처럼, 한 장씩 뒤집으며 읽어 보리다.', '', 'tc_start');
    await dl(sp.n === 1 ? '고른 카드는 한 장이오.' : `고른 카드는 세 장, 자리는 <b>${sp.pos.join(' → ')}</b> 순서요.`);
    if (newbie) await dl('💡 카드 읽는 순서를 알려 드리리다.<br>① 이 자리가 무슨 뜻인지 → ② 그림에 뭐가 있는지 → ③ 카드의 뜻 → ④ 그대 질문에 대 보기. 이 순서만 알면 타로 반은 아는 거요!', 'tip');
    for (let j = 0; j < ks.length; j += 1) {
      const k = ks[j], C = TAROT[k];
      await dl(`${sp.n > 1 ? `${j + 1}번째 자리는 <b>${sp.pos[j]}</b>요. ` : ''}${POS_DESC[tp.spread][j]}`);
      const card = cardMsg(k, j);
      T.say(`${sp.n > 1 ? `${j + 1}번째, "${sp.pos[j]}" 카드요.<br>` : ''}마음의 준비가 되면 뒤집으시오 🃏`);
      if (T.speak) T.speak('tc_flip');
      await flipWait(card);
      if (run !== RUN) return;
      $('#t-map').innerHTML = mapHTML(ks, j + 1);
      T.say(`<b>${C[0]}</b> 카드가 나왔소! ✨`);
      await dl(`나온 카드는… <b>${C[0]}</b>(${C[1]}) 카드! 22장 중 ${k}번이오.`, 'big', `tc_c${k}`);
      await dl(`🖼 그림부터 보시오. 전통 타로 그림에서는 ${SYMBOL[k]}`, '', `tc_s${k}`);
      await dl(`🔑 핵심어는 <b>${C[2]}</b>. ${C[3]}`);
      await dl(`🔮 ${topicLine(k, j)}`, 'key');
      const others = [3, 4, 5].filter((f) => f !== tp.field && !(f === 3 && tp.field !== 3));
      const more = await ask([{label: j < ks.length - 1 ? '다음 카드 볼래요 →' : '흐름 정리해 주세요 →', v: 'next'}, {label: '이 카드 더 알려 주세요', v: 'more'}]);
      if (more === 'more') {
        await dl('좋소, 이 카드를 다른 쪽으로도 읽어 드리리다.', '', 'tc_more');
        await dl(others.map((f) => `<b>${FIELD_NAME[f]}</b> 보면: ${C[f]}`).join('<br>') + `<br><b>오늘의 한마디</b>: ${C[6]}`);
        if (newbie) await dl('💡 같은 카드라도 무엇을 물었는지에 따라 읽는 쪽이 달라져요. 그래서 질문을 먼저 정하는 거요.', 'tip');
        await ask([{label: j < ks.length - 1 ? '좋아요, 다음 카드 →' : '좋아요, 흐름 정리해 주세요 →', v: 'next'}]);
      }
    }
    T.say('카드를 한데 놓고<br>흐름을 읽어 보겠소 📜');
    await dl(sp.n > 1 ? '자, 이제 카드를 한데 놓고 흐름을 읽겠소. 타로는 한 장 한 장보다 <b>"어디서 어디로 가는지"</b>가 핵심이오.' : '자, 이제 정리해 보겠소.', '', sp.n > 1 ? 'tc_flow' : null);
    await dl(readFlow(ks), 'key');
    await dl(`⚖️ ${toneLine(ks)}`);
    const keyK = ks.length === 1 ? ks[0] : T.topic === 'love' ? ks[2] : ks[1];
    await dl('마지막으로, 도령의 조언이오.', '', 'tc_advice');
    await dl(`🍀 <b>도령의 조언</b><br>${TAROT[keyK][6]}`, 'advice');
    await dl('타로는 정해진 미래가 아니라 <b>지금 마음을 비추는 거울</b>이오. 마음에 남은 한 줄만 챙겨 가시오. 또 고민이 생기면 언제든 문 두드리시오 🏮', '', 'tc_end');
    T.say('상담 끝! 마음에 남는 한 줄을<br>기억해 두시오 ✨');
    $('#t-end').hidden = false; scrollTo($('#t-end'));
  } catch (e) { /* 다시 보기로 멈춤 */ }
}

export function initTarot(goStep, say, face, speak) {
  T.goStep = goStep; T.say = say; T.face = face || ''; T.speak = speak || null;
  $('#t-chat').addEventListener('click', (e) => { if (!e.target.closest('.t-card') && skip) skip(); });   // 대화창을 누르면 빨리 넘김
  $$('.tlv').forEach((b) => b.addEventListener('click', () => { document.body.dataset.tl = b.dataset.tl; goStep(b.dataset.tl === 'new' ? 31 : 33); }));
  $$('[data-tnext]').forEach((b) => b.addEventListener('click', () => goStep(+b.dataset.tnext)));
  $$('.t-topic').forEach((b) => b.addEventListener('click', () => {
    T.topic = b.dataset.t;
    $$('.t-topic').forEach((x) => x.classList.toggle('on', x === b));
    const sp = spread();
    $('#t-spread-note').textContent = `${sp.n}장을 뽑아요: ${sp.pos.join(' → ')}`;
  }));
  $('#t-q-next').addEventListener('click', () => { T.q = ($('#t-q').value || '').replace(/[<>&"']/g, '').trim().slice(0, 40); goStep(34); });
  $('#t-shuf').addEventListener('click', () => (T.shuffling ? stopShuffle() : startShuffle()));
  $$('.t-pile').forEach((p, i) => p.addEventListener('click', () => cut(i)));
  $('#t-deck').addEventListener('click', (e) => { const b = e.target.closest('.t-back'); if (b) togglePick(+b.dataset.i); });
  $('#t-confirm').addEventListener('click', () => { if (T.picks.length === spread().n) { goStep(38); consult(); } });
  $('#t-again').addEventListener('click', () => { RUN += 1; T.order = []; $('#t-shuf').textContent = '카드 섞기 시작 🔀'; $$('.t-pile').forEach((p) => p.classList.remove('chosen')); goStep(33); });
}
export function enterTarot() {
  RUN += 1; T.order = []; T.picks = [];
  const sp = spread();
  $('#t-spread-note').textContent = `${sp.n}장을 뽑아요: ${sp.pos.join(' → ')}`;
  $('#t-shuf').textContent = '카드 섞기 시작 🔀';
}
export function tarotBubble(n) {
  const sp = spread();
  return {
    30: '타로방에 온 걸 환영하오! 🃏<br>그대, 타로는 처음이시오?',
    31: '좋소! 타로가 어디서 왔는지부터<br>들려 드리리다 📜',
    32: '타로는 이런 순서로 본다오.<br>어렵지 않으니 따라만 오시오!',
    33: '먼저 무엇이 궁금한지 정하시오.<br>질문이 또렷할수록 카드도 또렷하오 🔮',
    34: '눈을 감고 질문을 떠올리며<br>숨을 세 번 깊게 쉬어 보시오…',
    35: '이제 카드를 섞겠소! 🔀<br>마음이 됐다 싶을 때 "그만"을 누르시오',
    36: '섞은 카드를 세 더미로 나눴소.<br>끌리는 더미 하나를 골라 보시오 ✋',
    37: `카드를 펼쳤소! 끌리는 카드 ${sp.n}장을 골라 보시오.<br>잘못 골랐으면 다시 눌러 취소하면 되오`,
    38: '좋소, 이제 상담을 시작하겠소.<br>아래 대화를 따라오시오 🏮',
  }[n];
}
