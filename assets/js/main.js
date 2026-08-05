/* Portfolio JS — interactions légères */
(function () {
  'use strict';

  /* ---------- Barre de progression du scroll ---------- */
  var progressBar = document.getElementById('scrollProgress');
  if (progressBar) {
    var onScrollProgress = function () {
      var max = document.documentElement.scrollHeight - window.innerHeight;
      var p = max > 0 ? (window.scrollY / max) * 100 : 0;
      progressBar.style.width = p + '%';
    };
    window.addEventListener('scroll', onScrollProgress, { passive: true });
    onScrollProgress();
  }

  /* ---------- Curseur à halo ---------- */
  var glow = document.getElementById('cursorGlow');
  if (glow && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    var gx = 0, gy = 0, tx = 0, ty = 0;
    window.addEventListener('mousemove', function (e) {
      tx = e.clientX;
      ty = e.clientY;
    }, { passive: true });
    (function glowLoop() {
      gx += (tx - gx) * 0.08;
      gy += (ty - gy) * 0.08;
      glow.style.transform = 'translate(' + (gx - 170) + 'px,' + (gy - 170) + 'px)';
      requestAnimationFrame(glowLoop);
    })();
  }

  /* ---------- Tilt 3D sur les cartes projets ---------- */
  if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    document.querySelectorAll('.project[data-tilt]').forEach(function (card) {
      card.addEventListener('mousemove', function (e) {
        var r = card.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width;
        var py = (e.clientY - r.top) / r.height;
        card.style.setProperty('--tilt-x', ((py - 0.5) * -10).toFixed(2));
        card.style.setProperty('--tilt-y', ((px - 0.5) * 10).toFixed(2));
        card.style.setProperty('--tilt-xp', (px * 100).toFixed(1) + '%');
        card.style.setProperty('--tilt-yp', (py * 100).toFixed(1) + '%');
      });
      card.addEventListener('mouseleave', function () {
        card.style.setProperty('--tilt-x', '0');
        card.style.setProperty('--tilt-y', '0');
      });
    });
  }

  /* ---------- Scrollspy : lien actif dans la nav ---------- */
  var navLinks = Array.prototype.slice.call(document.querySelectorAll('.nav__link'));
  var spySections = navLinks
    .map(function (a) {
      var id = a.getAttribute('href');
      return id && id.charAt(0) === '#' ? document.querySelector(id) : null;
    })
    .filter(Boolean);

  var onSpy = function () {
    var pos = window.scrollY + 120;
    var current = '';
    spySections.forEach(function (sec) {
      if (sec.offsetTop <= pos) current = '#' + sec.id;
    });
    navLinks.forEach(function (a) {
      a.classList.toggle('active', a.getAttribute('href') === current);
    });
  };
  window.addEventListener('scroll', onSpy, { passive: true });
  onSpy();

  /* ---------- Réseau de particules (hero) ---------- */
  var particleCanvas = document.getElementById('particleCanvas');
  var particleCtx = null;
  var particles = [];
  var particleRunning = false;

  function initParticles() {
    if (!particleCanvas) return;
    if (!particleCtx) particleCtx = particleCanvas.getContext('2d');
    var W = (particleCanvas.width = particleCanvas.offsetWidth);
    var H = (particleCanvas.height = particleCanvas.offsetHeight);
    var count = Math.min(Math.floor((W * H) / 16000), 90);
    particles = [];
    for (var i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * W,
        y: Math.random() * H,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        r: Math.random() * 1.8 + 0.6
      });
    }
  }

  function drawParticles() {
    var ctx = particleCtx;
    var W = particleCanvas.width;
    var H = particleCanvas.height;
    ctx.clearRect(0, 0, W, H);
    var linkDist = 120;
    for (var i = 0; i < particles.length; i++) {
      var p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      if (p.x < 0 || p.x > W) p.vx *= -1;
      if (p.y < 0 || p.y > H) p.vy *= -1;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(77, 159, 255, 0.55)';
      ctx.fill();
      for (var j = i + 1; j < particles.length; j++) {
        var q = particles[j];
        var dx = p.x - q.x;
        var dy = p.y - q.y;
        var d2 = dx * dx + dy * dy;
        if (d2 < linkDist * linkDist) {
          var a = 1 - Math.sqrt(d2) / linkDist;
          ctx.strokeStyle = 'rgba(77, 159, 255, ' + (a * 0.16).toFixed(3) + ')';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(q.x, q.y);
          ctx.stroke();
        }
      }
    }
    if (particleRunning) requestAnimationFrame(drawParticles);
  }

  function startParticles() {
    if (!particleCanvas) return;
    particleRunning = true;
    initParticles();
    drawParticles();
    window.addEventListener('resize', initParticles, { passive: true });
  }

  /* ---------- Terminal typé ---------- */
  var typedTerminal = document.getElementById('typedTerminal');
  if (typedTerminal) {
    var termLines = [
      { type: 'cmd', text: 'whoami' },
      { type: 'out', text: 'assoumane-djimraou — Security & Cloud Engineer (in progress)' },
      { type: 'cmd', text: 'cat specialties.txt' },
      { type: 'out', text: '[Cisco CCNP] [RHCSA] [AWS] [Rust/Python] [Docker]' },
      { type: 'cmd', text: './open-to-opportunities --stage --devops --security' }
    ];
    var typingStarted = false;

    function startTyping() {
      if (typingStarted) return;
      typingStarted = true;
      var idx = 0;
      var line = 0;
      var cursorP = document.querySelector('#typedTerminal .t-blink');

      function typeChar() {
        if (idx >= termLines.length) return;
        var item = termLines[idx];
        if (line === 0) typedTerminal.innerHTML = '';

        var p = document.createElement('p');
        p.classList.add('t-line');
        if (item.type === 'cmd') {
          p.innerHTML = '<span class="t-prompt">$</span> <span class="t-typing"></span>';
          var span = p.querySelector('.t-typing');
          var ci = 0;
          (function typeWord() {
            if (ci < item.text.length) {
              span.textContent = item.text.slice(0, ++ci);
              setTimeout(typeWord, 28);
            } else {
              insertLine(idx, item, p);
            }
          })();
        } else {
          p.innerHTML = '<span class="t-out"></span>';
          insertLine(idx, item, p, true);
        }
      }

      function insertLine(i, item, p, instant) {
        var afterTyping = false;
        if (item.type === 'cmd') {
          var span = p.querySelector('.t-typing');
          var textEl = document.createElement('span');
          textEl.className = 't-typed';
          textEl.textContent = item.text;
          span.parentNode.replaceChild(textEl, span);
          afterTyping = true;
        } else if (item.type === 'out') {
          p.querySelector('.t-out').textContent = item.text;
        }
        typedTerminal.appendChild(p);
        // on garde le curseur clignotant en fin
        if (cursorP) {
          if (cursorP.parentNode) cursorP.parentNode.removeChild(cursorP);
          typedTerminal.appendChild(cursorP);
        }
        line++;
        idx++;
        if (idx < termLines.length) {
          setTimeout(typeChar, instant ? 240 : 160);
        }
      }

      typeChar();
    }

    var terminalObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          startTyping();
          terminalObs.disconnect();
        }
      });
    }, { threshold: 0.3 });
    terminalObs.observe(typedTerminal);
  }

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
    if (pct.indexOf('%') === -1) pct += '%';
    // force reflow puis applique la largeur -> transition CSS animée
    void bar.offsetWidth;
    bar.style.width = pct;
  }

  /* ---------- IntersectionObserver : reveal + compteurs + barres + radar ---------- */
  var revealEls = document.querySelectorAll('.reveal');
  var counters = document.querySelectorAll('[data-count]');
  var fills = document.querySelectorAll('.bar__fill, .lang__fill, .ghlang__fill');
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
      { color: '#ff5252', values: [0.9, 0.85, 0.75, 0.85, 0.85, 0.9] },
      { color: '#4d9fff', values: [0.75, 0.7, 0.85, 0.8, 0.7, 0.8] },
      { color: '#ff8a5c', values: [0.8, 0.75, 0.8, 0.95, 0.75, 0.85] },
      { color: '#3ddc97', values: [0.85, 0.8, 0.75, 0.85, 0.95, 0.9] }
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
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.14)';
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
    ctx.fillStyle = '#9fb0c8';
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
          if (el.classList.contains('bar__fill') || el.classList.contains('lang__fill') || el.classList.contains('ghlang__fill')) animateBar(el);
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
      var p = el.getAttribute('data-width') || el.style.getPropertyValue('--pct') || '100%';
      if (p.indexOf('%') === -1) p += '%';
      el.style.width = p;
    });
    drawRadar();
  }

  /* ---------- Démarrage des particules quand le hero est visible ---------- */
  var heroEl = document.querySelector('.hero');
  if (heroEl) {
    if ('IntersectionObserver' in window) {
      var heroObs = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (en) {
            if (en.isIntersecting) {
              startParticles();
              heroObs.disconnect();
            }
          });
        },
        { threshold: 0.1 }
      );
      heroObs.observe(heroEl);
    } else {
      startParticles();
    }
  }
})();
