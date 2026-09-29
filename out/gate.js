/* Школа амбассадоров ТАРКОС — доступ к учебным материалам по PIN.
   Ограничение прототипа: сайт статический, проверка идёт в браузере,
   поэтому это заслон от посторонних, а не криптографическая защита. */
(function (w, d) {
  'use strict';
  var SALT = 'tarkos-amb-2026::';
  var HASH = '142slaz-icn5lg';   // хеш действующего PIN
  var KEY = 'tarkos-access';
  var TTL = 12 * 60 * 60 * 1000; // доступ живёт 12 часов
  var mem = null;                // запасное хранилище, если localStorage недоступен

  function hash(s) {
    var x = 5381, y = 2166136261, i;
    for (i = 0; i < s.length; i++) x = ((x << 5) + x + s.charCodeAt(i)) >>> 0;
    for (i = 0; i < s.length; i++) { y ^= s.charCodeAt(i); y = (y * 16777619) >>> 0; }
    return x.toString(36) + '-' + y.toString(36);
  }
  function load() {
    try { var v = w.localStorage.getItem(KEY); if (v) return JSON.parse(v); } catch (e) {}
    try { var s = w.sessionStorage.getItem(KEY); if (s) return JSON.parse(s); } catch (e) {}
    return mem;
  }
  function save(o) {
    mem = o;
    try { w.localStorage.setItem(KEY, JSON.stringify(o)); return; } catch (e) {}
    try { w.sessionStorage.setItem(KEY, JSON.stringify(o)); } catch (e) {}
  }
  function drop() {
    mem = null;
    try { w.localStorage.removeItem(KEY); } catch (e) {}
    try { w.sessionStorage.removeItem(KEY); } catch (e) {}
  }
  function unlocked() {
    var o = load();
    return !!(o && o.k === HASH && o.t && Date.now() - o.t < TTL);
  }

  var CSS = '#tg-ov{position:fixed;inset:0;z-index:2147483647;visibility:visible;background:#0A0908;'
    + 'display:flex;align-items:center;justify-content:center;padding:24px;'
    + 'font-family:Inter,"Helvetica Neue",Arial,sans-serif;color:#F3EDE2;-webkit-font-smoothing:antialiased}'
    + '#tg-ov *{box-sizing:border-box;visibility:visible}'
    + '#tg-bx{width:100%;max-width:420px;text-align:center}'
    + '#tg-bx img{height:54px;margin-bottom:26px;opacity:.95}'
    + '#tg-k{font:600 12px/1 Inter,Arial,sans-serif;letter-spacing:.22em;text-transform:uppercase;color:#E39A2D}'
    + '#tg-h{font-family:Oswald,Impact,Arial,sans-serif;font-weight:700;font-size:34px;line-height:1.12;'
    + 'text-transform:uppercase;margin:14px 0 0;letter-spacing:.01em}'
    + '#tg-bars{display:flex;gap:6px;justify-content:center;margin:18px 0 0}'
    + '#tg-bars i{display:block;width:44px;height:3px;background:#E39A2D}'
    + '#tg-bars u{display:block;width:14px;height:3px;background:#9C2F25}'
    + '#tg-p{color:rgba(243,237,226,.62);font-size:15px;line-height:1.55;margin:18px 0 26px}'
    + '#tg-in{width:100%;background:transparent;border:1px solid rgba(243,237,226,.28);color:#F3EDE2;'
    + 'font-family:Oswald,Arial,sans-serif;font-size:30px;letter-spacing:.42em;text-align:center;'
    + 'padding:16px 10px 16px 22px;outline:0;transition:border-color .2s}'
    + '#tg-in:focus{border-color:#E39A2D}'
    + '#tg-btn{width:100%;margin-top:14px;background:#E39A2D;color:#0A0908;border:0;cursor:pointer;'
    + 'font:600 15px/1 Inter,Arial,sans-serif;letter-spacing:.06em;text-transform:uppercase;'
    + 'padding:17px 20px;transition:opacity .2s}'
    + '#tg-btn:hover{opacity:.87}#tg-btn:disabled{opacity:.4;cursor:default}'
    + '#tg-err{color:#e0786e;font-size:14px;min-height:20px;margin-top:14px}'
    + '#tg-note{color:rgba(243,237,226,.38);font-size:13px;line-height:1.5;margin-top:26px}'
    + '#tg-back{display:inline-block;margin-top:16px;color:rgba(243,237,226,.55);font-size:14px;'
    + 'text-decoration:none;border-bottom:1px solid rgba(243,237,226,.25)}'
    + '#tg-back:hover{color:#E39A2D;border-color:#E39A2D}'
    + '@keyframes tg-sh{0%,100%{transform:none}20%,60%{transform:translateX(-7px)}40%,80%{transform:translateX(7px)}}'
    + '.tg-shake{animation:tg-sh .4s}'
    + 'html.tg-locked body>*:not(#tg-ov){visibility:hidden!important}'
    + 'html.tg-locked{overflow:hidden}';

  function styles() {
    if (d.getElementById('tg-css')) return;
    var s = d.createElement('style');
    s.id = 'tg-css';
    s.textContent = CSS;
    (d.head || d.documentElement).appendChild(s);
  }

  var tries = 0;

  /* Убрать экран ввода, не открывая доступ (отмена, уход на публичную страницу). */
  function close() {
    var ov = d.getElementById('tg-ov');
    if (ov && ov.parentNode) ov.parentNode.removeChild(ov);
    d.documentElement.classList.remove('tg-locked');
  }

  /* Экран ввода PIN. onOk — что сделать после успеха, back — ссылка «назад». */
  function ask(onOk, back) {
    styles();
    if (d.getElementById('tg-ov')) return;
    var logo = /\/(block\d|int)\//.test(location.pathname) ? '../../logo_m.png' : '../logo_m.png';
    var ov = d.createElement('div');
    ov.id = 'tg-ov';
    ov.innerHTML = '<div id="tg-bx">'
      + '<img src="' + logo + '" alt="ТАРКОС" onerror="this.style.display=&quot;none&quot;">'
      + '<div id="tg-k">Закрытый раздел</div>'
      + '<h1 id="tg-h">Школа амбассадоров</h1>'
      + '<div id="tg-bars"><i></i><u></u></div>'
      + '<p id="tg-p">Учебные материалы и демонстрационные кабинеты открываются по коду доступа.</p>'
      + '<form id="tg-f" autocomplete="off">'
      + '<input id="tg-in" type="password" inputmode="numeric" maxlength="8" placeholder="••••" '
      + 'autocomplete="off" aria-label="Код доступа">'
      + '<button id="tg-btn" type="submit">Войти</button>'
      + '<div id="tg-err"></div></form>'
      + '<div id="tg-note">Код выдаёт координатор школы.</div>'
      + (back ? (back.cancel
        ? '<a id="tg-back" href="#" data-cancel="1">' + back.text + '</a>'
        : '<a id="tg-back" href="' + back.href + '">' + back.text + '</a>') : '')
      + '</div>';
    (d.body || d.documentElement).appendChild(ov);

    var cancel = ov.querySelector('[data-cancel]');
    if (cancel) cancel.addEventListener('click', function (e) { e.preventDefault(); close(); });

    var inp = d.getElementById('tg-in');
    var btn = d.getElementById('tg-btn');
    var err = d.getElementById('tg-err');
    var box = d.getElementById('tg-bx');
    setTimeout(function () { try { inp.focus(); } catch (e) {} }, 60);
    inp.addEventListener('input', function () {
      inp.value = inp.value.replace(/\D/g, '');
      err.textContent = '';
    });
    d.getElementById('tg-f').addEventListener('submit', function (e) {
      e.preventDefault();
      if (btn.disabled) return;
      if (hash(SALT + inp.value) === HASH) {
        save({ k: HASH, t: Date.now() });
        ov.parentNode.removeChild(ov);
        d.documentElement.classList.remove('tg-locked');
        if (onOk) onOk();
        return;
      }
      tries++;
      inp.value = '';
      box.classList.remove('tg-shake');
      void box.offsetWidth;
      box.classList.add('tg-shake');
      if (tries >= 5) {                       // притормаживаем перебор
        var left = 10;
        btn.disabled = true;
        err.textContent = 'Слишком много попыток. Подождите ' + left + ' с.';
        var t = setInterval(function () {
          left--;
          err.textContent = left > 0 ? 'Слишком много попыток. Подождите ' + left + ' с.' : '';
          if (left <= 0) { clearInterval(t); btn.disabled = false; tries = 0; try { inp.focus(); } catch (e) {} }
        }, 1000);
      } else {
        err.textContent = 'Неверный код доступа';
        try { inp.focus(); } catch (e) {}
      }
    });
  }

  /* Полная блокировка страницы — для уроков и интерактивов. */
  function guard() {
    if (unlocked()) return;
    d.documentElement.classList.add('tg-locked');
    styles();
    var start = function () {
      if (unlocked()) { d.documentElement.classList.remove('tg-locked'); return; }
      var site = /\/(block\d|int)\//.test(location.pathname) ? '../site.html' : 'site.html';
      ask(function () { d.documentElement.classList.remove('tg-locked'); },
        { href: site, text: 'Вернуться на сайт школы' });
    };
    if (d.readyState === 'loading') d.addEventListener('DOMContentLoaded', start);
    else start();
  }

  w.TG = { unlocked: unlocked, ask: ask, guard: guard, lock: drop, close: close };

  var me = d.currentScript;
  if (me && me.hasAttribute('data-guard')) guard();
})(window, document);
