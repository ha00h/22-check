(function () {
  'use strict';
  // 비밀키는 메모리에만 두고, 저장하거나 코드에 넣지 않습니다. 검증·차단(5회 실패 → 15분)은 서버가 합니다.
  var BASE = (window.CONFIG.ADMIN_API_BASE || '').replace(/\/$/, '');
  var $ = function (id) { return document.getElementById(id); };
  var key = '';
  function show(id) { ['login', 'list', 'blocked', 'off'].forEach(function (s) { $(s).hidden = s !== id; }); }
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function fmt(t) { var d = new Date(t); return d.getFullYear() + '.' + pad(d.getMonth() + 1) + '.' + pad(d.getDate()) + ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes()); }

  function render(items) {
    items.sort(function (a, b) { return new Date(b.createdAt) - new Date(a.createdAt); });
    var box = $('items'); box.textContent = '';
    items.forEach(function (it) {
      var el = document.createElement('div'); el.className = 'memo';
      var m = document.createElement('div'); m.className = 'meta'; m.textContent = fmt(it.createdAt);
      var p = document.createElement('p'); p.textContent = it.text;
      el.append(m, p); box.append(el);
    });
    if (!items.length) { var e = document.createElement('div'); e.className = 'empty'; e.textContent = '아직 받은 의견이 없어요.'; box.append(e); }
    $('count').textContent = items.length;
    show('list');
  }

  function blocked(retryAfter) {
    var min = retryAfter ? Math.max(1, Math.ceil(retryAfter / 60)) : 15;
    $('blockedWait').textContent = min + '분 후 다시 시도할 수 있어요.';
    show('blocked');
  }

  function fetchList() {
    if (!BASE) { show('off'); return; }
    $('loginBtn').disabled = true;
    fetch(BASE + '/api/feedback', { headers: { 'X-Admin-Key': key }, cache: 'no-store' })
      .then(function (r) {
        if (r.status === 429 || r.status === 423) { key = ''; return blocked(parseInt(r.headers.get('Retry-After'), 10)); }
        if (r.status === 401 || r.status === 403) {
          key = ''; show('login');
          return r.json().catch(function () { return {}; }).then(function (j) {
            var msg = '비밀키가 올바르지 않아요.';
            if (typeof j.remaining === 'number') msg += ' (남은 시도 ' + j.remaining + '회)';
            $('loginErr').textContent = msg; $('loginErr').hidden = false;
          });
        }
        if (!r.ok) { show('off'); return; }
        return r.json().then(function (j) { render(Array.isArray(j) ? j : (j.items || [])); });
      })
      .catch(function () { show('off'); })
      .finally(function () { $('loginBtn').disabled = false; });
  }

  $('login').addEventListener('submit', function (e) {
    e.preventDefault();
    key = $('key').value; $('key').value = '';
    if (!key) { $('loginErr').textContent = '비밀키를 입력해 주세요.'; $('loginErr').hidden = false; return; }
    $('loginErr').hidden = true;
    fetchList();
  });
  $('logout').addEventListener('click', function () { key = ''; $('items').textContent = ''; show('login'); });
  $('blockedBack').addEventListener('click', function () { show('login'); });
  $('retry').addEventListener('click', function () { if (BASE) show('login'); else show('off'); });

  show(BASE ? 'login' : 'off');
})();
