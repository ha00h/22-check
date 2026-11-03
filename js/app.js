(function () {
  'use strict';
  var C = window.CONFIG;
  var MEMO_KEY = '22check.memos.v1';
  var OUTBOX_KEY = '22check.outbox.v1';
  var $ = function (id) { return document.getElementById(id); };

  // 슬라임 이미지 (config 한 곳에서만 지정)
  document.querySelectorAll('img.slime').forEach(function (img) { img.src = C.SLIME_SRC; });

  function load(key) { try { return JSON.parse(localStorage.getItem(key)) || []; } catch (e) { return []; } }
  function save(key, v) { localStorage.setItem(key, JSON.stringify(v)); }
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function dot(d) { return d.getFullYear() + '.' + pad(d.getMonth() + 1) + '.' + pad(d.getDate()); }
  function uid() {
    if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
    return Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 10);
  }

  // 날짜
  var now = new Date();
  $('today').textContent = now.getFullYear() + '년 ' + (now.getMonth() + 1) + '월 ' + now.getDate() + '일 (' + '일월화수목금토'[now.getDay()] + ')';
  $('autoDate').textContent = '📅 날짜: ' + dot(now) + ' (자동 입력)';

  // 메모
  function renderMemos() {
    var memos = load(MEMO_KEY).sort(function (a, b) { return b.createdAt - a.createdAt; });
    var list = $('memoList');
    list.textContent = '';
    memos.forEach(function (m) {
      var el = document.createElement('div'); el.className = 'memo';
      var meta = document.createElement('div'); meta.className = 'meta';
      meta.append(dot(new Date(m.createdAt)) + ' · ');
      if (m.title) { var b = document.createElement('b'); b.textContent = m.title; meta.append(b); }
      else meta.append('책 제목 없음');
      var p = document.createElement('p'); p.textContent = m.content;
      el.append(meta, p); list.append(el);
    });
    $('memoCount').textContent = memos.length;
    $('memoEmpty').hidden = memos.length > 0;
  }
  $('memoForm').addEventListener('submit', function (e) {
    e.preventDefault();
    var content = $('content').value.trim();
    if (!content) { $('memoErr').hidden = false; $('content').focus(); return; }
    $('memoErr').hidden = true;
    var memos = load(MEMO_KEY);
    memos.push({ id: uid(), title: $('title').value.trim(), content: content, createdAt: Date.now() });
    save(MEMO_KEY, memos);
    $('title').value = ''; $('content').value = '';
    renderMemos();
  });
  renderMemos();

  // 20분 타이머 (실제 시간 기준, 새로고침하면 종료 → 상태를 저장하지 않음)
  var ov = $('overlay'), endAt = 0, tick = null, wakeLock = null;
  function requestWake() {
    if ('wakeLock' in navigator) navigator.wakeLock.request('screen').then(function (l) { wakeLock = l; }).catch(function () {});
  }
  function startTimer() {
    endAt = Date.now() + C.TIMER_MINUTES * 60 * 1000;
    ov.hidden = false;
    document.body.style.overflow = 'hidden';
    requestWake();
    tick = setInterval(check, 1000);
  }
  function stopTimer() {
    endAt = 0; clearInterval(tick); tick = null;
    ov.hidden = true; document.body.style.overflow = '';
    if (wakeLock) { wakeLock.release().catch(function () {}); wakeLock = null; }
  }
  function check() { if (endAt && Date.now() >= endAt) stopTimer(); }
  $('startBtn').addEventListener('click', startTimer);
  ov.addEventListener('click', stopTimer);
  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState !== 'visible' || !endAt) return;
    check();
    if (endAt) requestWake(); // 화면 복귀 시 Wake Lock 재요청
  });

  // 의견: 로컬 보관함(outbox) + 재전송
  var sending = false;
  function renderOutbox() { $('fbPending').hidden = load(OUTBOX_KEY).length === 0; }
  function flushOutbox() {
    if (!C.FEEDBACK_API_BASE || sending) { renderOutbox(); return Promise.resolve(); }
    var box = load(OUTBOX_KEY);
    if (!box.length) { renderOutbox(); return Promise.resolve(); }
    sending = true;
    var sent = [];
    return box.reduce(function (p, item) {
      return p.then(function () {
        return fetch(C.FEEDBACK_API_BASE.replace(/\/$/, '') + '/api/feedback', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: item.id, text: item.text, createdAt: item.createdAt })
        }).then(function (r) {
          // 2xx 또는 409(이미 받은 id) → 전송 완료로 처리 (서버가 id로 중복 제거)
          if (r.ok || r.status === 409) sent.push(item.id);
          else if (r.status === 400 || r.status === 413) sent.push(item.id); // 내용이 잘못된 요청만 폐기, 나머지는 보관 후 재시도
        }).catch(function () {});
      });
    }, Promise.resolve()).then(function () {
      var rest = load(OUTBOX_KEY).filter(function (i) { return sent.indexOf(i.id) < 0; });
      save(OUTBOX_KEY, rest);
      sending = false;
      renderOutbox();
      if (sent.length && !rest.length) { $('fbOk').hidden = false; setTimeout(function () { $('fbOk').hidden = true; }, 3000); }
    });
  }
  $('fbForm').addEventListener('submit', function (e) {
    e.preventDefault();
    var text = $('fbText').value.trim();
    if (!text) { $('fbText').focus(); return; }
    var box = load(OUTBOX_KEY);
    box.push({ id: uid(), text: text, createdAt: Date.now() });
    save(OUTBOX_KEY, box);
    $('fbText').value = '';
    renderOutbox();
    flushOutbox();
  });
  flushOutbox();
  setInterval(flushOutbox, C.RETRY_INTERVAL_MS);
})();
