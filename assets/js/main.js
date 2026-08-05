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

  /* ---------- Terminal interactif ---------- */
  var shellBody = document.getElementById('shellBody');
  var shellForm = document.getElementById('shellForm');
  var shellInput = document.getElementById('shellInput');

  if (shellBody && shellForm && shellInput) {
    var helpText =
      '<strong>Commandes disponibles :</strong><br>' +
      '<span class="t-prompt">help</span> — cette aide<br>' +
      '<span class="t-prompt">whoami</span> — qui je suis<br>' +
      '<span class="t-prompt">about</span> — en savoir plus<br>' +
      '<span class="t-prompt">skills</span> — mes expertises<br>' +
      '<span class="t-prompt">projects</span> — mes projets<br>' +
      '<span class="t-prompt">contact</span> — mes coordonnées<br>' +
      '<span class="t-prompt">cv</span> — télécharger mon CV<br>' +
      '<span class="t-prompt">github</span> — mes dépôts<br>' +
      '<span class="t-prompt">clear</span> — vider le terminal<br>' +
      '<span class="t-prompt">matrix</span> — activer le mode Matrix';

    function printLine(text, cls) {
      var p = document.createElement('p');
      p.classList.add('t-line');
      p.innerHTML = '<span class="t-prompt">visitor@portfolio:~$</span> <span class="t-typed">' + text + '</span>';
      shellBody.appendChild(p);
      shellBody.scrollTop = shellBody.scrollHeight;
    }

    function printOut(text, cls) {
      var p = document.createElement('p');
      p.classList.add('t-out', 't-out--block');
      if (cls) p.classList.add(cls);
      p.innerHTML = text;
      shellBody.appendChild(p);
      shellBody.scrollTop = shellBody.scrollHeight;
    }

    function runCommand(cmd) {
      var c = cmd.trim().toLowerCase();
      if (!c) return;
      printLine(cmd.trim());
      var out = '';
      var cls = '';
      switch (c) {
        case 'help':
          out = helpText;
          break;
        case 'whoami':
          out = 'ASSOUMANE DJIMRAOU MAHAMADOU<br>Security & Cloud Engineer (in progress) — ESMT Dakar';
          break;
        case 'about':
          out = 'Étudiant en Master Sécurité des Systèmes d\'Information. Rigoureux et orienté résultats : architecture réseau, cloud computing, automatisation et développement logiciel sécurisé.';
          break;
        case 'skills':
          out = '[Réseaux Cisco CCNP] [RHCSA] [AWS] [Rust/Python] [Docker] [IA Offline] [Cryptographie]';
          break;
        case 'projects':
          out = '<strong>6 projets :</strong> Automatisation de Systèmes · Implémentation de Cryptographie · Gestion de Stock Full-Stack · Franky (IA Offline) · Mixnet TLS · Crypto Post-Quantique. Voir la section <a href="#projets" class="inline-link">#projets</a>.';
          break;
        case 'contact':
          out = 'Email : <a href="mailto:mahamadouassoumanedjimraou@gmail.com" class="inline-link">mahamadouassoumanedjimraou@gmail.com</a><br>LinkedIn : <a href="https://www.linkedin.com/in/assoumane-djimraou-mahamadou-19126b3a4" target="_blank" rel="noopener" class="inline-link">assoumane-djimraou-mahamadou</a><br>Téléphone : +221 78 140 8835';
          break;
        case 'cv':
          out = 'Téléchargement : <a href="assets/CV_A.pdf" download="Cv-Assoumane-Djimraou.pdf" class="inline-link">CV_A.pdf</a>';
          break;
        case 'github':
          out = '<a href="https://github.com/francky603" target="_blank" rel="noopener" class="inline-link">github.com/francky603</a> — 5 dépôts publics';
          break;
        case 'clear':
          shellBody.innerHTML = '';
          return;
        case 'matrix':
          startMatrix();
          out = 'Wake up, Neo... La matrice est activée.';
          cls = 't-out--ok';
          break;
        case 'sudo':
          out = 'Accès refusé : privilèges root requis. (Il n\'y a pas de barrière ici, mais c\'est plus fun ainsi.)';
          cls = 't-out--err';
          break;
        case 'ls':
          out = 'home/&nbsp;&nbsp;skills/&nbsp;&nbsp;projects/&nbsp;&nbsp;blog/&nbsp;&nbsp;parcours/&nbsp;&nbsp;contact/';
          break;
        case 'date':
          out = new Date().toString();
          break;
        case 'neofetch':
          out = 'assoumane@portfolio<br>OS : Portfolio v2.0<br>Role : Security & Cloud Engineer<br>Kernel : Rust + Python + React<br>Uptime : ' + Math.floor(performance.now() / 60000) + ' min<br>Shell : interactif (vous y êtes)';
          break;
        default:
          out = 'Commande inconnue : <span class="t-typed">' + cmd.trim() + '</span>. Tapez <span class="t-prompt">help</span> pour la liste des commandes.';
          cls = 't-out--err';
      }
      printOut(out, cls);
    }

    shellForm.addEventListener('submit', function (e) {
      e.preventDefault();
      runCommand(shellInput.value);
      shellInput.value = '';
    });

    // focus sur clic
    shellBody.addEventListener('click', function () { shellInput.focus(); });
    var shellHome = document.querySelector('.hero__terminal');
    if (shellHome) {
      shellHome.addEventListener('click', function () { shellInput.focus(); });
    }
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

  /* ---------- Dashboard SOC : animation temps réel ---------- */
  var socEl = document.getElementById('socDashboard');
  if (socEl) {
    var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var socCpuFill = document.getElementById('socCpuFill');
    var socCpuVal = document.getElementById('socCpuVal');
    var socMemFill = document.getElementById('socMemFill');
    var socMemVal = document.getElementById('socMemVal');
    var socNetFill = document.getElementById('socNetFill');
    var socNetVal = document.getElementById('socNetVal');
    var socThreat = document.getElementById('socThreat');
    var socClock = document.getElementById('socClock');
    var socScanline = document.getElementById('socScanline');
    var socThreats = socEl.querySelector('.soc__footer span:first-child');

    var socCpu = 42, socMem = 67, socNet = 0;
    var threats = ['0 menaces actives', '1 alerte mineure', '0 menaces actives', '0 menaces actives'];
    var ti = 0;

    function tickClock() {
      if (!socClock) return;
      var d = new Date();
      var p = function (n) { return (n < 10 ? '0' : '') + n; };
      socClock.textContent = p(d.getHours()) + ':' + p(d.getMinutes()) + ':' + p(d.getSeconds());
    }

    function tickSoc() {
      if (reduceMotion) return;
      socCpu += (Math.random() - 0.5) * 8;
      socCpu = Math.min(95, Math.max(12, socCpu));
      socMem += (Math.random() - 0.5) * 4;
      socMem = Math.min(92, Math.max(45, socMem));
      socNet += (Math.random() - 0.5) * 20;
      socNet = Math.min(80, Math.max(0, socNet));
      if (socCpuFill) socCpuFill.style.width = socCpu.toFixed(0) + '%';
      if (socCpuVal) socCpuVal.textContent = socCpu.toFixed(0) + '%';
      if (socMemFill) socMemFill.style.width = socMem.toFixed(0) + '%';
      if (socMemVal) socMemVal.textContent = socMem.toFixed(0) + '%';
      if (socNetFill) socNetFill.style.width = (socNet / 80 * 100).toFixed(0) + '%';
      if (socNetVal) socNetVal.textContent = socNet.toFixed(0) + ' Mb/s';
      if (socThreat) {
        var tl = socCpu > 78 ? 'HIGH' : socCpu > 60 ? 'MEDIUM' : 'LOW';
        socThreat.textContent = tl;
        socThreat.style.background = tl === 'LOW' ? 'rgba(61,220,151,0.14)' : tl === 'MEDIUM' ? 'rgba(255,178,92,0.16)' : 'rgba(255,82,82,0.18)';
        socThreat.style.color = tl === 'LOW' ? 'var(--success)' : tl === 'MEDIUM' ? '#ffb25c' : 'var(--accent)';
        socThreat.style.borderColor = tl === 'LOW' ? 'rgba(61,220,151,0.35)' : tl === 'MEDIUM' ? 'rgba(255,178,92,0.4)' : 'rgba(255,82,82,0.45)';
      }
      if (socThreats) {
        ti = (ti + 1) % threats.length;
        socThreats.innerHTML = '<i class="fa-solid fa-robot"></i> ' + threats[ti];
      }
    }

    tickClock();
    setInterval(tickClock, 1000);
    if (!reduceMotion) setInterval(tickSoc, 1800);

    var socObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          socObs.disconnect();
          if (socCpuFill) socCpuFill.style.width = socCpu + '%';
          if (socMemFill) socMemFill.style.width = socMem + '%';
        }
      });
    }, { threshold: 0.2 });
    socObs.observe(socEl);
  }

  /* ---------- Carte réseau : infobulles au survol ---------- */
  var netmap = document.getElementById('netmap');
  var netmapTooltip = document.getElementById('netmapTooltip');
  if (netmap && netmapTooltip) {
    var roleTexts = {
      'Internet': 'Point d\'entrée : accès WAN, opérateurs, DDoS possible.',
      'Firewall': 'Filtre le trafic entrant/sortant : règles, ACL, NAT.',
      'Web Server': 'Sert les applications exposées (DMZ).',
      'Mail Server': 'Gère la messagerie entrante/sortante (DMZ).',
      'Poste utilisateur': 'Accès interne au réseau d\'entreprise.',
      'Serveur fichiers': 'Stockage centralisé des données métier.',
      'SOC': 'Supervision de sécurité : détection et réponse aux incidents.'
    };
    netmap.querySelectorAll('.netmap__node').forEach(function (node) {
      node.addEventListener('mouseenter', function () {
        netmapTooltip.textContent = roleTexts[node.getAttribute('data-role')] || '';
        netmapTooltip.style.color = 'var(--accent-2)';
      });
      node.addEventListener('mouseleave', function () {
        netmapTooltip.textContent = 'Survolez un équipement';
        netmapTooltip.style.color = '';
      });
    });
  }

  /* ---------- Easter egg : Konami + Matrix ---------- */
  var matrixRunning = false;
  var matrixCanvas = null;
  var matrixCtx = null;
  var matrixAnimId = null;
  var matrixDrops = [];

  function initMatrix() {
    if (!matrixCanvas) {
      matrixCanvas = document.createElement('canvas');
      matrixCanvas.id = 'matrixCanvas';
      document.body.appendChild(matrixCanvas);
    }
    matrixCtx = matrixCanvas.getContext('2d');
    var W = (matrixCanvas.width = window.innerWidth);
    var H = (matrixCanvas.height = window.innerHeight);
    var fontSize = 14;
    var cols = Math.floor(W / fontSize);
    matrixDrops = [];
    for (var i = 0; i < cols; i++) matrixDrops[i] = Math.floor(Math.random() * -H / fontSize);
  }

  function matrixFrame() {
    if (!matrixCtx) return;
    var H = matrixCanvas.height;
    matrixCtx.fillStyle = 'rgba(0, 0, 0, 0.08)';
    matrixCtx.fillRect(0, 0, matrixCanvas.width, H);
    matrixCtx.fillStyle = '#3ddc97';
    matrixCtx.font = '14px monospace';
    for (var i = 0; i < matrixDrops.length; i++) {
      var ch = String.fromCharCode(0x30A0 + Math.floor(Math.random() * 96));
      matrixCtx.fillText(ch, i * 14, matrixDrops[i] * 14);
      if (matrixDrops[i] * 14 > H && Math.random() > 0.975) matrixDrops[i] = 0;
      matrixDrops[i]++;
    }
    matrixAnimId = requestAnimationFrame(matrixFrame);
  }

  function startMatrix() {
    if (matrixRunning) return;
    matrixRunning = true;
    initMatrix();
    matrixFrame();
    document.body.classList.add('matrix-mode');
  }

  function stopMatrix() {
    if (!matrixRunning) return;
    matrixRunning = false;
    document.body.classList.remove('matrix-mode');
    if (matrixAnimId) cancelAnimationFrame(matrixAnimId);
    if (matrixCanvas) matrixCanvas.remove();
    matrixCanvas = null;
    matrixCtx = null;
  }

  // Konami code
  var konami = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
  var konamiIdx = 0;
  window.addEventListener('keydown', function (e) {
    var key = e.key;
    if (key === konami[konamiIdx]) {
      konamiIdx++;
      if (konamiIdx === konami.length) {
        startMatrix();
        konamiIdx = 0;
      }
    } else {
      konamiIdx = key === 'ArrowUp' ? 1 : 0;
    }
  });

  // Clics répétés sur le logo -> matrix
  var logo = document.querySelector('.nav__logo');
  var logoClicks = 0;
  var logoTimer = null;
  if (logo) {
    logo.addEventListener('click', function (e) {
      e.preventDefault();
      logoClicks++;
      if (logoTimer) clearTimeout(logoTimer);
      logoTimer = setTimeout(function () { logoClicks = 0; }, 1200);
      if (logoClicks >= 5) {
        if (matrixRunning) stopMatrix();
        else startMatrix();
        logoClicks = 0;
      }
    });
  }

  // Pause des animations quand l'onglet est caché + réduction des animations
  var hidden = 'hidden';
  document.addEventListener('visibilitychange', function () {
    if (document[hidden]) {
      if (matrixRunning) stopMatrix();
      if (particleRunning) particleRunning = false;
    } else {
      if (!matrixRunning) startParticles();
    }
  });
})();
