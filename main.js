(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Header: ombra allo scroll ---------- */
  var header = document.querySelector('.site-header');
  function onHeaderScroll() { header.classList.toggle('is-scrolled', window.scrollY > 8); }
  onHeaderScroll();
  window.addEventListener('scroll', onHeaderScroll, { passive: true });

  /* ---------- Menu burger (solo sotto i 1200px) ---------- */
  var toggle = document.querySelector('.menu-toggle');
  var nav = document.getElementById('main-nav');
  var toggleLabel = toggle.querySelector('.sr-only');

  function setMenu(open) {
    toggle.setAttribute('aria-expanded', String(open));
    nav.classList.toggle('is-open', open);
    toggleLabel.textContent = open ? 'Chiudi il menu' : 'Apri il menu';
  }
  toggle.addEventListener('click', function () { setMenu(toggle.getAttribute('aria-expanded') !== 'true'); });
  nav.addEventListener('click', function (e) { if (e.target.closest('a')) setMenu(false); });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && nav.classList.contains('is-open')) { setMenu(false); toggle.focus(); }
  });
  window.matchMedia('(min-width: 1200px)').addEventListener('change', function (mq) { if (mq.matches) setMenu(false); });

  /* ---------- Voce di menu attiva ---------- */
  var links = Array.prototype.slice.call(document.querySelectorAll('.main-nav ul a'));
  if ('IntersectionObserver' in window) {
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        links.forEach(function (a) {
          var active = a.getAttribute('href') === '#' + entry.target.id;
          a.classList.toggle('is-active', active);
          if (active) a.setAttribute('aria-current', 'location'); else a.removeAttribute('aria-current');
        });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    links.forEach(function (a) { var s = document.querySelector(a.getAttribute('href')); if (s) spy.observe(s); });
  }

  /* ---------- Reveal in ingresso ---------- */
  var reveals = document.querySelectorAll('.reveal');
  if (reduceMotion || !('IntersectionObserver' in window)) {
    reveals.forEach(function (el) { el.classList.add('is-visible'); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) { entry.target.classList.add('is-visible'); io.unobserve(entry.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    reveals.forEach(function (el) {
      var siblings = el.parentElement ? el.parentElement.querySelectorAll(':scope > .reveal') : [];
      var idx = Array.prototype.indexOf.call(siblings, el);
      if (idx > 0) el.style.transitionDelay = Math.min(idx, 5) * 90 + 'ms';
      io.observe(el);
    });
  }

  /* ---------- Come funziona: linea che si disegna allo scroll ---------- */
  var steps = document.getElementById('steps');
  if (steps) {
    var track = steps.querySelector('.steps-track');
    var items = Array.prototype.slice.call(steps.querySelectorAll('.step'));
    var dots = items.map(function (li) { return li.querySelector('.step-dot'); });
    var vertical = false, span = 1;

    function layoutTrack() {
      var base = steps.getBoundingClientRect();
      var a = dots[0].getBoundingClientRect(), b = dots[dots.length - 1].getBoundingClientRect();
      vertical = window.matchMedia('(max-width: 760px)').matches;
      var ax = a.left + a.width / 2 - base.left, ay = a.top + a.height / 2 - base.top;
      var bx = b.left + b.width / 2 - base.left, by = b.top + b.height / 2 - base.top;
      if (vertical) {
        span = by - ay;
        track.style.cssText = 'left:' + ax + 'px;top:' + ay + 'px;height:' + span + 'px;right:auto;width:1px';
      } else {
        span = bx - ax;
        track.style.cssText = 'left:' + ax + 'px;top:' + ay + 'px;width:' + span + 'px;right:auto;height:1px';
      }
    }

    function setProgress(p) {
      steps.style.setProperty('--p', p.toFixed(4));
      var n = items.length;
      items.forEach(function (li, i) { li.classList.toggle('is-active', p >= (i / (n - 1)) - 0.001); });
    }

    function update() {
      var vh = window.innerHeight;
      var first = dots[0].getBoundingClientRect();
      var p;
      if (vertical) {
        p = (vh * 0.62 - (first.top + first.height / 2)) / span;
      } else {
        p = (vh * 0.8 - first.top) / (vh * 0.38);
      }
      setProgress(Math.max(0, Math.min(1, p)));
    }

    layoutTrack();
    if (reduceMotion) {
      setProgress(1);
      window.addEventListener('resize', layoutTrack);
    } else {
      steps.classList.add('is-animated');
      var ticking = false;
      var onScroll = function () {
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(function () { update(); ticking = false; });
      };
      window.addEventListener('scroll', onScroll, { passive: true });
      window.addEventListener('resize', function () { layoutTrack(); update(); });
      if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { layoutTrack(); update(); });
      update();
    }
  }

  /* ---------- FAQ accordion (tutte chiuse all'avvio) ---------- */
  document.querySelectorAll('.accordion').forEach(function (acc) {
    var single = acc.hasAttribute('data-single-open');
    var triggers = Array.prototype.slice.call(acc.querySelectorAll('.acc-trigger'));

    function setItem(btn, open) {
      var panel = document.getElementById(btn.getAttribute('aria-controls'));
      btn.setAttribute('aria-expanded', String(open));
      if (open) {
        panel.hidden = false;
        void panel.offsetHeight;
        panel.classList.add('is-open');
      } else {
        panel.classList.remove('is-open');
        var done = function () { if (btn.getAttribute('aria-expanded') === 'false') panel.hidden = true; };
        if (reduceMotion) done(); else setTimeout(done, 460);
      }
    }

    triggers.forEach(function (btn, i) {
      btn.addEventListener('click', function () {
        var open = btn.getAttribute('aria-expanded') !== 'true';
        if (open && single) triggers.forEach(function (o) { if (o !== btn && o.getAttribute('aria-expanded') === 'true') setItem(o, false); });
        setItem(btn, open);
      });
      btn.addEventListener('keydown', function (e) {
        var n = triggers.length, t = null;
        if (e.key === 'ArrowDown') t = triggers[(i + 1) % n];
        else if (e.key === 'ArrowUp') t = triggers[(i - 1 + n) % n];
        else if (e.key === 'Home') t = triggers[0];
        else if (e.key === 'End') t = triggers[n - 1];
        if (t) { e.preventDefault(); t.focus(); }
      });
    });
  });

  /* ---------- Modulo contatti ---------- */
  var form = document.getElementById('contact-form');
  if (form) {
    var status = document.getElementById('form-status');
    var fields = [
      { el: form.querySelector('#cf-name'), err: '#cf-name-err', ok: function (v) { return v.trim().length > 1; } },
      { el: form.querySelector('#cf-email'), err: '#cf-email-err', ok: function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()); } },
      { el: form.querySelector('#cf-msg'), err: '#cf-msg-err', ok: function (v) { return v.trim().length > 4; } },
      { el: form.querySelector('#cf-privacy'), err: '#cf-privacy-err', ok: function () { return form.querySelector('#cf-privacy').checked; } }
    ];

    function validate(f) {
      var valid = f.ok(f.el.value);
      var err = form.querySelector(f.err);
      err.hidden = valid;
      f.el.setAttribute('aria-invalid', String(!valid));
      var ids = (f.el.getAttribute('aria-describedby') || '').split(' ').filter(function (x) { return x && x !== err.id; });
      if (!valid) ids.push(err.id);
      if (ids.length) f.el.setAttribute('aria-describedby', ids.join(' ')); else f.el.removeAttribute('aria-describedby');
      return valid;
    }
    fields.forEach(function (f) {
      f.el.addEventListener(f.el.type === 'checkbox' ? 'change' : 'blur', function () {
        if (f.el.getAttribute('aria-invalid') !== null) validate(f);
      });
    });

    function setStatus(msg, cls) { status.className = 'form-status' + (cls ? ' ' + cls : ''); status.textContent = msg; }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      setStatus('');
      var firstInvalid = null;
      fields.forEach(function (f) { if (!validate(f) && !firstInvalid) firstInvalid = f.el; });
      if (firstInvalid) { firstInvalid.focus(); return; }
      if (form.querySelector('#cf-web').value) return;

      var endpoint = (form.getAttribute('data-endpoint') || '').trim();
      if (!endpoint) {
        // Nessun sistema di invio configurato: nessun falso messaggio di successo.
        setStatus('Il modulo online non è ancora attivo e la tua richiesta non è stata inviata. Per ricevere informazioni puoi utilizzare i recapiti telefonici indicati in fondo alla pagina.', 'is-info');
        return;
      }

      var btn = form.querySelector('button[type="submit"]');
      btn.disabled = true;
      setStatus('Invio in corso…');
      fetch(endpoint, { method: 'POST', body: new FormData(form), headers: { 'Accept': 'application/json' } })
        .then(function (res) {
          if (!res.ok) throw new Error('HTTP ' + res.status);
          form.reset();
          fields.forEach(function (f) { f.el.removeAttribute('aria-invalid'); });
          setStatus('Grazie, la tua richiesta è stata inviata. Ti ricontatteremo appena possibile.', 'is-info');
        })
        .catch(function () {
          setStatus('Non è stato possibile inviare la richiesta. Riprova più tardi oppure utilizza i recapiti telefonici indicati in fondo alla pagina.', 'is-info');
        })
        .finally(function () { btn.disabled = false; });
    });
  }

  var y = document.getElementById('year');
  if (y) y.textContent = new Date().getFullYear();
})();
