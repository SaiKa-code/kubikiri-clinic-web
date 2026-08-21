'use strict';
/* クビを回避せよ！！ 公式サイト
   依存ライブラリなし。 */

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ============ フッターの年号 ============ */
$('#yr').textContent = String(new Date().getFullYear());

/* ============ スクロールで出現 ============ */
{
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      e.target.classList.add('in');
      io.unobserve(e.target);
    }
  }, { threshold: 0.15 });
  $$('.reveal, .checks li, .stamp-line').forEach((el, i) => {
    el.classList.add('reveal');
    el.style.transitionDelay = (Math.min(i % 6, 5) * 60) + 'ms';
    io.observe(el);
  });
}

/* ============ クビのリスクゲージ ============
   スクロール進捗＝勤務時間の経過。下に行くほどリスクが上がる。 */
{
  const root = document.documentElement;
  let raf = 0;
  const update = () => {
    raf = 0;
    const max = document.body.scrollHeight - innerHeight;
    const p = max > 0 ? Math.min(1, scrollY / max) : 0;
    root.style.setProperty('--risk', (p * p).toFixed(3)); // 終盤で一気に効く
  };
  addEventListener('scroll', () => { if (!raf) raf = requestAnimationFrame(update); }, { passive: true });
  update();
}

/* ============ ヒーローの行列 ============ */
{
  const track = $('#queueTrack');
  const total = 28;
  const order = Array.from({ length: total }, (_, i) => i + 1);
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  const line = order.slice(0, 14);
  // アニメーションが -50% でループするので、同じ並びを2回敷く
  const frag = document.createDocumentFragment();
  for (let pass = 0; pass < 2; pass++) {
    for (const n of line) {
      const img = document.createElement('img');
      img.src = `assets/img/patient/p${String(n).padStart(2, '0')}.webp`;
      img.alt = '';
      img.loading = pass === 0 ? 'eager' : 'lazy';
      img.decoding = 'async';
      frag.appendChild(img);
    }
  }
  track.appendChild(frag);

  // 待ち人数は減らない
  const label = $('#queueCount');
  let waiting = 32;
  if (!reduceMotion) {
    setInterval(() => {
      waiting += Math.random() < 0.55 ? 1 : -1;
      waiting = Math.max(28, Math.min(48, waiting));
      label.textContent = String(waiting);
    }, 2600);
  }
}

/* ============ 業務フローの渋滞 ============ */
{
  const pipeline = $('#pipeline');
  const note = $('#jamNote');
  const fill = $('.belt-fill', pipeline);
  const stations = $$('.stations li', pipeline);
  const messages = [
    ['受付', '保険証の確認に手間取り、待合室が溢れました'],
    ['情報入力', '紙の保険証の手入力が終わらず、後続が停止'],
    ['カルテ探索', '該当のカルテが棚から見つかりません'],
    ['監査', '処方ミスの見落ちが発覚。全工程を差し戻し'],
    ['会計', '請求額の入力ミス。患者が窓口から動けません'],
  ];
  let flow = 0.35;
  let timer = 0;

  const tick = () => {
    if (pipeline.classList.contains('jam')) return;
    flow = Math.min(1, flow + 0.12);
    fill.style.width = (flow * 100) + '%';
    if (flow >= 1) {
      const i = Math.floor(Math.random() * stations.length);
      pipeline.classList.add('jam');
      stations[i].classList.add('jam-src');
      note.textContent = `⚠ ${messages[i][0]}で渋滞：${messages[i][1]}`;
      setTimeout(() => {
        pipeline.classList.remove('jam');
        stations[i].classList.remove('jam-src');
        note.textContent = 'ライン復旧。次の患者が来ます';
        flow = 0.2;
        fill.style.width = '20%';
      }, 2800);
    }
  };

  // 画面内にある間だけ動かす
  const io = new IntersectionObserver(([e]) => {
    if (e.isIntersecting && !timer && !reduceMotion) {
      timer = setInterval(tick, 900);
    } else if (!e.isIntersecting && timer) {
      clearInterval(timer);
      timer = 0;
    }
  }, { threshold: 0.3 });
  io.observe(pipeline);
}

/* ============ 3点照合デモ ============
   本編の監査シーンの簡略版。薬剤名・適応はすべて架空。 */
{
  const root = $('#demoRoot');
  const msg = $('#demoMsg');
  const turnLabel = $('#demoTurn');
  const riskLabel = $('#demoRisk');
  const restart = $('#demoRestart');
  const buttons = $$('[data-act]', root);

  const cases = [
    {
      chartId: 'A-10428', chartName: 'サトウ ハナコ', chartDx: '不眠症（再診）',
      rxName: 'サトウ ハナコ', rxDrug: 'ネムリオン', rxFor: '不眠症',
      insName: 'サトウ ハナコ', insNo: '0721・3384', insKind: '社保（本人）',
      bad: null,
      why: '氏名・適応ともに一致。押印して会計へ回すのが正解です。',
    },
    {
      chartId: 'B-20973', chartName: 'タナカ ケンジ', chartDx: '高血圧（再診）',
      rxName: 'タナカ ケンジ', rxDrug: 'エシスカ', rxFor: '骨粗鬆症',
      insName: 'タナカ ケンジ', insNo: '1180・6402', insKind: '国保',
      bad: ['rxDrug', 'rxFor', 'chartDx'],
      why: 'カルテの通院理由は高血圧なのに、処方薬の適応が骨粗鬆症。適応が一致しません。',
    },
    {
      chartId: 'C-33150', chartName: 'ヤマモト アキ', chartDx: 'アレルギー（新規）',
      rxName: 'ヤマモト アオイ', rxDrug: 'ハナスカイ', rxFor: 'アレルギー',
      insName: 'ヤマモト アキ', insNo: '2249・0517', insKind: '後期高齢者',
      bad: ['rxName', 'chartName', 'insName'],
      why: '処方箋の氏名が「アオイ」。カルテと保険証は「アキ」。別人の処方箋です。',
    },
  ];

  const order = [0, 1, 2].sort(() => Math.random() - 0.5);
  let turn = 0;
  let risk = 0;
  let locked = false;

  const paint = () => {
    const c = cases[order[turn]];
    $$('.doc', root).forEach((d) => d.classList.remove('hit'));
    $$('[data-f]', root).forEach((el) => {
      el.textContent = c[el.dataset.f];
      delete el.dataset.hit;
    });
    turnLabel.textContent = String(turn + 1);
    riskLabel.textContent = String(risk);
    msg.className = 'demo-msg';
    msg.textContent = '氏名3枚と、通院理由・適応の噛み合いを確認してください。';
    buttons.forEach((b) => { b.disabled = false; });
    locked = false;
  };

  const finish = () => {
    buttons.forEach((b) => { b.disabled = true; });
    restart.hidden = false;
    msg.className = 'demo-msg ' + (risk === 0 ? 'ok' : 'ng');
    msg.textContent = risk === 0
      ? '3件すべて正解。この調子なら、今日はクビを回避できそうです。—— 本編では、これを制限時間付きで何十人分も捌きます。'
      : `クビのリスク ${risk}。本編では、これが積み上がると解雇エンディングに直行します。`;
  };

  const answer = (act) => {
    if (locked) return;
    locked = true;
    buttons.forEach((b) => { b.disabled = true; });
    const c = cases[order[turn]];
    const correct = (act === 'ng') === Boolean(c.bad);
    if (c.bad) {
      for (const f of c.bad) {
        const el = $(`[data-f="${f}"]`, root);
        el.dataset.hit = '1';
        el.closest('.doc').classList.add('hit');
      }
    }
    if (!correct) risk += 12;
    riskLabel.textContent = String(risk);
    msg.className = 'demo-msg ' + (correct ? 'ok' : 'ng');
    msg.textContent = (correct ? '○ 正解。' : '× 不正解。クビのリスク +12。') + c.why;

    setTimeout(() => {
      turn += 1;
      if (turn >= cases.length) finish();
      else paint();
    }, correct ? 2300 : 3400);
  };

  buttons.forEach((b) => b.addEventListener('click', () => answer(b.dataset.act)));
  restart.addEventListener('click', () => {
    order.sort(() => Math.random() - 0.5);
    turn = 0; risk = 0; restart.hidden = true;
    paint();
  });
  paint();
}

/* ============ スクリーンショットの拡大 ============ */
{
  const box = $('#lightbox');
  const img = $('#lightboxImg');
  const cap = $('#lightboxCap');
  const close = $('#lightboxClose');
  let lastFocus = null;

  const open = (fig) => {
    const thumb = $('img', fig);
    lastFocus = thumb;
    img.src = thumb.dataset.full || thumb.src;
    img.alt = thumb.alt;
    cap.textContent = $('figcaption', fig)?.textContent || '';
    box.classList.add('show');
    close.focus();
  };
  const hide = () => {
    box.classList.remove('show');
    img.src = '';
    lastFocus?.focus();
  };

  $$('#shots .shot').forEach((fig) => {
    const thumb = $('img', fig);
    thumb.tabIndex = 0;
    thumb.addEventListener('click', () => open(fig));
    thumb.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(fig); }
    });
  });
  close.addEventListener('click', hide);
  box.addEventListener('click', (e) => { if (e.target === box) hide(); });
  addEventListener('keydown', (e) => { if (e.key === 'Escape' && box.classList.contains('show')) hide(); });
}

/* ============ 実績ウォール ============ */
{
  const wall = $('#achWall');
  // [APIネーム, 表示名, 区分]  区分: a=実績 / e=エンディング（伏せる） / t=称号
  const ACHIEVEMENTS = [
    ['first_play', '初勤務', 'a'], ['play_10', '継続は力なり', 'a'], ['play_50', '常連さん', 'a'],
    ['tutorial_clear', 'チュートリアル卒業', 'a'], ['tutorial_3', '熱心な生徒', 'a'], ['tutorial_5', '復習の達人', 'a'],
    ['speed_3sec', 'スピードスター', 'a'], ['speed_2sec', '電光石火', 'a'],
    ['score_500', '高得点射手', 'a'], ['score_800', 'スコアマスター', 'a'], ['score_1000', '破壊者', 'a'],
    ['first_s_rank', '初Sランク', 'a'],
    ['combo_5', 'ウォームアップ', 'a'], ['combo_10', 'コンボマスター', 'a'],
    ['combo_20', '無敵の受付', 'a'], ['combo_30', 'コンボ神', 'a'],
    ['patients_10', '出会いの始まり', 'a'], ['patients_50', 'ベテラン受付', 'a'],
    ['patients_100', '院長の右腕', 'a'], ['patients_200', '大ベテラン', 'a'], ['patients_500', '伝説の受付師', 'a'],
    ['hard_clear', 'ハードモードクリア', 'a'], ['hard_10', 'ハード常連', 'a'],
    ['hard_s_rank', 'ハードモードS', 'a'], ['hard_ss_rank', '伝説の受付', 'a'],
    ['no_damage', 'ノーダメージ', 'a'], ['clear_rate_high', '安定のプロ', 'a'],
    ['ending_dissatisfaction', 'エンディングA', 'e'], ['ending_absent', 'エンディングB', 'e'],
    ['ending_deadline', 'エンディングC', 'e'], ['ending_money', 'エンディングD', 'e'],
    ['ending_credit_default', 'エンディングE', 'e'], ['ending_cp_quota', 'エンディングF', 'e'],
    ['ending_contract_complete', 'エンディングG', 'e'], ['ending_contract_regular', 'エンディングH', 'e'],
    ['ending_contract_dx_leader', 'エンディングI', 'e'], ['ending_gamble_addict', 'エンディングJ', 'e'],
    ['ending_baito_warrior', 'エンディングK', 'e'], ['ending_neet', 'エンディングL', 'e'],
    ['typing_master', 'DX化の申し子', 't'], ['title_pro', '受付プロ', 't'],
    ['title_dx_pioneer', 'DX推進者', 't'], ['title_local_hero', '地域の名士', 't'],
    ['title_iron', '鉄人', 't'], ['title_legend', '伝説のスタッフ', 't'],
    ['money_solver', 'お金で解決', 't'], ['title_cp_master', '報酬上手', 't'],
    ['title_salary_up', '出世払い', 't'],
  ];
  const KIND = { a: '実績', e: 'エンディング', t: '称号' };

  const cells = ACHIEVEMENTS.map(([key, name, kind]) => {
    const cell = document.createElement('div');
    cell.className = 'ach' + (kind === 'e' ? ' secret' : '');
    const img = document.createElement('img');
    img.src = `assets/img/ach/${key}_locked.webp`;
    img.dataset.unlocked = `assets/img/ach/${key}.webp`;
    img.alt = '';
    img.loading = 'lazy';
    img.decoding = 'async';
    const tip = document.createElement('span');
    tip.className = 'ach-tip';
    tip.textContent = kind === 'e' ? `${KIND[kind]}・???` : `${KIND[kind]}・${name}`;
    cell.append(img, tip);
    return cell;
  });
  wall.append(...cells);

  // 画面に入ったら、いくつかを順番に解除していく
  const io = new IntersectionObserver(([e]) => {
    if (!e.isIntersecting) return;
    io.disconnect();
    const pick = cells
      .map((c, i) => [c, i])
      .filter(() => Math.random() < 0.42)
      .slice(0, 16);
    pick.forEach(([cell], n) => {
      setTimeout(() => {
        const img = $('img', cell);
        img.src = img.dataset.unlocked;
        cell.classList.add('unlocked');
      }, reduceMotion ? 0 : 220 + n * 170);
    });
  }, { threshold: 0.25 });
  io.observe(wall);
}

/* セリフが差し替わった合図に、小さく跳ねさせる。
   同じクラスの付け直しではアニメが再生されないので、一度剥がして再フローを挟む。 */
function hopGuide() {
  if (reduceMotion) return;
  [$('#guideBalloon'), $('#guideImg')].forEach((el) => {
    if (!el) return;
    el.classList.remove('hop');
    void el.offsetWidth;
    el.classList.add('hop');
  });
}

/* ============ 案内役 ============
   受付課の店番の学生。セクションに応じて表情が変わる。 */
{
  const guide = $('#guide');
  const img = $('#guideImg');
  const balloon = $('#guideBalloon');
  const SCRIPT = {
    pv: ['03_wink', '映像で見ると、忙しさが伝わると思います。'],
    chart: ['02_smile', 'ここから先が、本編の中身です。'],
    flow: ['01_normal', '1工程でも詰まると、全部止まります。'],
    demo: ['03_wink', '実際にやってみるのが、いちばん早いです。'],
    depth: ['02_smile', '受付以外にも、いろいろあります。'],
    records: ['05_surprised', 'エンディング、こんなにあるんですよ。'],
    shots: ['01_normal', 'ゲーム画面はこちらです。'],
    buy: ['06_worried', '……今日も、クビを回避してくださいね。'],
  };
  const CASINO = new Set(['depth']); // このセクションだけ衣装が違う
  let current = '';
  let hideTimer = 0;

  const show = (id) => {
    if (id === current || !SCRIPT[id]) return;
    current = id;
    const [face, line] = SCRIPT[id];
    const dir = CASINO.has(id) ? 'suggestion_casino' : 'suggestion';
    img.src = `assets/img/${dir}/${face}.webp`;
    guide.hidden = false;
    requestAnimationFrame(() => guide.classList.add('show'));
    balloon.textContent = line;
    balloon.classList.add('show');
    hopGuide();
    clearTimeout(hideTimer);
    hideTimer = setTimeout(() => balloon.classList.remove('show'), 5200);
  };

  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (e.isIntersecting && e.intersectionRatio > 0.35) show(e.target.id);
    }
  }, { threshold: [0.35, 0.6] });
  Object.keys(SCRIPT).forEach((id) => {
    const el = document.getElementById(id);
    if (el) io.observe(el);
  });

  // ヒーローに戻ったら引っ込む
  const heroIo = new IntersectionObserver(([e]) => {
    if (e.isIntersecting && e.intersectionRatio > 0.7) {
      guide.classList.remove('show');
      balloon.classList.remove('show');
      current = '';
    }
  }, { threshold: [0.7] });
  const hero = $('.hero');
  if (hero) heroIo.observe(hero);
}

/* ============ サボり検知 ============ */
{
  let idle = 0;
  const reset = () => { idle = 0; };
  ['scroll', 'pointerdown', 'keydown', 'pointermove'].forEach((ev) => {
    addEventListener(ev, reset, { passive: true });
  });
  setInterval(() => {
    idle += 5;
    if (idle === 75) {
      const el = $('#guideBalloon');
      if (el && !$('#guide').hidden) {
        el.textContent = '手が止まっていますが……サボりですか？';
        el.classList.add('show');
        hopGuide();
        setTimeout(() => el.classList.remove('show'), 5000);
      }
    }
  }, 5000);
}
