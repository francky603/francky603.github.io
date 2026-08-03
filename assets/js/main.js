/* Portfolio JS — interactions légères */
(function () {
  'use strict';

  /* ---------- Année dynamique du footer ---------- */
  var yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---------- Nav : état "scrolled" ---------- */
  var nav = document.querySelector('.nav');
  var onScroll = function () {
    if (window.scrollY > 30) nav.classList.add('scrolled');
    else nav.classList.remove('scrolled');
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- Menu mobile ---------- */
  var toggle = document.getElementById('navToggle');
  var menu = document.getElementById('navMenu');

  if (toggle && menu) {
    toggle.addEventListener('click', function () {
      var isOpen = menu.classList.toggle('open');
      toggle.classList.toggle('open', isOpen);
      toggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    });

    menu.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        menu.classList.remove('open');
        toggle.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  /* ---------- Compteur animé (0 → target) ---------- */
  function animateCounter(el) {
    var target = parseInt(el.getAttribute('data-count'), 10) || 0;
    var suffix = el.getAttribute('data-suffix') || '';
    var duration = 1400;
    var start = null;

    function step(ts) {
      if (!start) start = ts;
      var p = Math.min((ts - start) / duration, 1);
      // easing: ease-out cubic
      var eased = 1 - Math.pow(1 - p, 3);
      var val = Math.round(target * eased);
      el.textContent = val + suffix;
      if (p < 1) requestAnimationFrame(step);
      else el.textContent = target + suffix;
    }
    requestAnimationFrame(step);
  }

  /* ---------- Barres de progression (largeur animée) ---------- */
  function animateBar(bar) {
    var pct = bar.getAttribute('data-width') || bar.style.getPropertyValue('--pct') || '100%';
    // force reflow puis applique la largeur -> transition CSS animée
    void bar.offsetWidth;
    bar.style.width = pct;
  }

  /* ---------- IntersectionObserver : reveal + compteurs + barres + radar ---------- */
  var revealEls = document.querySelectorAll('.reveal');
  var counters = document.querySelectorAll('[data-count]');
  var fills = document.querySelectorAll('.bar__fill, .lang__fill');
  var radarCanvas = document.getElementById('radarChart');
  var radarDone = false;

  function drawRadar() {
    if (!radarCanvas || radarDone) return;
    radarDone = true;
    var ctx = radarCanvas.getContext('2d');
    var W = radarCanvas.width;
    var H = radarCanvas.height;
    var cx = W / 2;
    var cy = H / 2;
    var R = Math.min(W, H) / 2 - 40;

    var labels = ['Réseaux', 'Sécurité', 'Cloud', 'Dev & IA', 'Systèmes', 'Automatisation'];
    var series = [
      { color: '#4f8cff', values: [0.9, 0.85, 0.75, 0.85, 0.85, 0.9] },
      { color: '#22d3ee', values: [0.75, 0.7, 0.85, 0.8, 0.7, 0.8] },
      { color: '#34d399', values: [0.8, 0.75, 0.8, 0.95, 0.75, 0.85] },
      { color: '#7c5cff', values: [0.85, 0.8, 0.75, 0.85, 0.95, 0.9] }
    ];
    var N = labels.length;
    var anim = { p: 0 };
    var last = null;

    function drawFrame(ts) {
      if (!last) last = ts;
      anim.p = Math.min(anim.p + 0.035, 1);
      var eased = 1 - Math.pow(1 - anim.p, 3);

      ctx.clearRect(0, 0, W, H);
      drawGrid(ctx, cx, cy, R, N, eased);
      drawLabels(ctx, cx, cy, R, N, labels, eased);

      series.forEach(function (s) {
        drawPolygon(ctx, cx, cy, R, N, s.values, s.color, eased, anim.p < 1);
      });

      if (anim.p < 1) requestAnimationFrame(drawFrame);
    }

    requestAnimationFrame(drawFrame);
  }

  function angle(i, N) {
    return -Math.PI / 2 + (2 * Math.PI * i) / N;
  }

  function point(cx, cy, R, N, i, value, p) {
    var a = angle(i, N);
    var r = R * value * p;
    return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
  }

  function drawGrid(ctx, cx, cy, R, N, p) {
    ctx.strokeStyle = 'rgba(148, 184, 255, 0.15)';
    ctx.lineWidth = 1;
    for (var ring = 1; ring <= 4; ring++) {
      var r = (R * ring) / 4 * p;
      ctx.beginPath();
      for (var i = 0; i <= N; i++) {
        var pt = point(cx, cy, r, N, i % N, 1, 1);
        if (i === 0) ctx.moveTo(pt.x, pt.y);
        else ctx.lineTo(pt.x, pt.y);
      }
      ctx.stroke();
    }
    ctx.beginPath();
    for (var j = 0; j < N; j++) {
      var a = angle(j, N);
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + R * Math.cos(a), cy + R * Math.sin(a));
    }
    ctx.stroke();
  }

  function drawLabels(ctx, cx, cy, R, N, labels, p) {
    ctx.fillStyle = '#93a4bd';
    ctx.font = '13px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (var i = 0; i < N; i++) {
      var a = angle(i, N);
      var lx = cx + (R + 26) * Math.cos(a);
      var ly = cy + (R + 26) * Math.sin(a);
      ctx.globalAlpha = p;
      ctx.fillText(labels[i], lx, ly);
      ctx.globalAlpha = 1;
    }
  }

  function drawPolygon(ctx, cx, cy, R, N, values, color, p, partial) {
    ctx.beginPath();
    for (var i = 0; i <= N; i++) {
      var pt = point(cx, cy, R, N, i % N, values[i % N], p);
      if (i === 0) ctx.moveTo(pt.x, pt.y);
      else ctx.lineTo(pt.x, pt.y);
    }
    ctx.closePath();
    ctx.fillStyle = hexToRgba(color, 0.18);
    ctx.fill();
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.stroke();
    // dots
    for (var j = 0; j < N; j++) {
      var dpt = point(cx, cy, R, N, j, values[j], p);
      ctx.beginPath();
      ctx.arc(dpt.x, dpt.y, 3.5, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
    }
  }

  function hexToRgba(hex, alpha) {
    var r = parseInt(hex.slice(1, 3), 16);
    var g = parseInt(hex.slice(3, 5), 16);
    var b = parseInt(hex.slice(5, 7), 16);
    return 'rgba(' + r + ',' + g + ',' + b + ',' + alpha + ')';
  }

  if ('IntersectionObserver' in window) {
    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          var el = entry.target;
          observer.unobserve(el);
          if (el.classList.contains('reveal')) el.classList.add('visible');
          if (el.hasAttribute('data-count')) animateCounter(el);
          if (el.classList.contains('bar__fill') || el.classList.contains('lang__fill')) animateBar(el);
          if (el === radarCanvas) drawRadar();
        });
      },
      { threshold: 0.15, rootMargin: '0px 0px -60px 0px' }
    );

    revealEls.forEach(function (el) { observer.observe(el); });
    counters.forEach(function (el) { observer.observe(el); });
    fills.forEach(function (el) { observer.observe(el); });
    if (radarCanvas) observer.observe(radarCanvas);
  } else {
    revealEls.forEach(function (el) { el.classList.add('visible'); });
    counters.forEach(function (el) {
      el.textContent = (el.getAttribute('data-count') || '0') + (el.getAttribute('data-suffix') || '');
    });
    fills.forEach(function (el) {
      el.style.width = el.getAttribute('data-width') || el.style.getPropertyValue('--pct') || '100%';
    });
    drawRadar();
  }
})();
