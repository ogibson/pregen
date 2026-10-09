/* PreGen — interacciones del sitio (sin dependencias) */
(function () {
  'use strict';
  var doc = document.documentElement;
  var lang = doc.lang === 'en' ? 'en' : 'es';
  var T = {
    es: {
      sending: 'Enviando…',
      ok: '¡Gracias! Recibimos tu mensaje y te respondemos a la brevedad.',
      invalid: 'Revisá los campos marcados con * y que el email sea válido.',
      error: 'No pudimos enviar el mensaje. Probá de nuevo o escribinos a oliver@pregen.tech.'
    },
    en: {
      sending: 'Sending…',
      ok: 'Thank you! We received your message and will get back to you shortly.',
      invalid: 'Please check the fields marked with * and make sure the email is valid.',
      error: 'We couldn’t send your message. Please try again or email oliver@pregen.tech.'
    }
  }[lang];

  /* Header: fondo al hacer scroll */
  var header = document.querySelector('.site-header');
  function onScroll() {
    if (!header || header.classList.contains('is-solid')) return;
    header.classList.toggle('is-scrolled', window.scrollY > 40);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* Menú móvil */
  var toggle = document.querySelector('.menu-toggle');
  if (toggle) {
    toggle.addEventListener('click', function () {
      var open = !document.body.classList.contains('menu-open');
      document.body.classList.toggle('menu-open', open);
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    document.querySelectorAll('.main-nav a').forEach(function (a) {
      a.addEventListener('click', function () {
        document.body.classList.remove('menu-open');
        toggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  /* Pestañas (Prensa / Premios científicos) */
  document.querySelectorAll('[role="tablist"]').forEach(function (list) {
    var tabs = Array.prototype.slice.call(list.querySelectorAll('[role="tab"]'));
    function select(tab) {
      tabs.forEach(function (t) {
        var on = t === tab;
        t.setAttribute('aria-selected', on ? 'true' : 'false');
        t.tabIndex = on ? 0 : -1;
        var panel = document.getElementById(t.getAttribute('aria-controls'));
        if (panel) panel.hidden = !on;
      });
    }
    tabs.forEach(function (t, i) {
      t.addEventListener('click', function () { select(t); });
      t.addEventListener('keydown', function (e) {
        var k = e.key, n = null;
        if (k === 'ArrowRight') n = tabs[(i + 1) % tabs.length];
        if (k === 'ArrowLeft') n = tabs[(i - 1 + tabs.length) % tabs.length];
        if (n) { e.preventDefault(); select(n); n.focus(); }
      });
    });
  });

  /* Formulario de contacto */
  var form = document.querySelector('form.form');
  if (form) {
    var status = form.querySelector('.form-status');
    var btn = form.querySelector('button[type="submit"]');
    var ts = form.querySelector('input[name="ts"]');
    if (ts) ts.value = String(Date.now());

    function show(kind, msg) {
      status.className = 'form-status ' + kind;
      status.textContent = msg;
    }

    var q = new URLSearchParams(window.location.search).get('contacto');
    if (q) show(q === 'ok' ? 'ok' : 'err', q === 'ok' ? T.ok : (q === 'invalid' ? T.invalid : T.error));

    form.addEventListener('submit', function (e) {
      if (!window.fetch || !window.FormData) return; // sin JS moderno: envío normal
      e.preventDefault();
      if (!form.checkValidity()) { form.reportValidity(); show('err', T.invalid); return; }
      var label = btn.textContent;
      btn.disabled = true;
      btn.textContent = T.sending;
      status.className = 'form-status';
      status.textContent = '';
      fetch(form.action, {
        method: 'POST',
        body: new FormData(form),
        headers: { 'X-Requested-With': 'fetch', 'Accept': 'application/json' }
      })
        .then(function (r) { return r.json().catch(function () { return { ok: false, code: 'error' }; }); })
        .then(function (data) {
          if (data && data.ok) {
            show('ok', T.ok);
            form.reset();
            if (ts) ts.value = String(Date.now());
          } else {
            show('err', data && data.code === 'invalid' ? T.invalid : T.error);
          }
        })
        .catch(function () { show('err', T.error); })
        .then(function () { btn.disabled = false; btn.textContent = label; });
    });
  }
})();
