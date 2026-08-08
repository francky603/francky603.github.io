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
      ctx.fillStyle = 'rgba(129, 140, 248, 0.6)';
      ctx.fill();
      for (var j = i + 1; j < particles.length; j++) {
        var q = particles[j];
        var dx = p.x - q.x;
        var dy = p.y - q.y;
        var d2 = dx * dx + dy * dy;
        if (d2 < linkDist * linkDist) {
          var a = 1 - Math.sqrt(d2) / linkDist;
          ctx.strokeStyle = 'rgba(129, 140, 248, ' + (a * 0.16).toFixed(3) + ')';
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
          out = 'home/&nbsp;&nbsp;arch/&nbsp;&nbsp;reseau/&nbsp;&nbsp;ia/&nbsp;&nbsp;crypto/&nbsp;&nbsp;projets/&nbsp;&nbsp;lab/&nbsp;&nbsp;contact/';
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
    var raw = (el.getAttribute('data-count') || '0').replace(',', '.');
    var target = parseFloat(raw);
    if (isNaN(target)) target = 0;
    var suffix = el.getAttribute('data-suffix') || '';
    var decimals = parseInt(el.getAttribute('data-decimals'), 10) || 0;
    var duration = 1400;
    var start = null;

    function step(ts) {
      if (!start) start = ts;
      var p = Math.min((ts - start) / duration, 1);
      // easing: ease-out cubic
      var eased = 1 - Math.pow(1 - p, 3);
      var val = decimals > 0 ? (target * eased).toFixed(decimals) : String(Math.round(target * eased));
      el.textContent = val + suffix;
      if (p < 1) requestAnimationFrame(step);
      else el.textContent = (decimals > 0 ? target.toFixed(decimals) : String(target)) + suffix;
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
      { color: '#818cf8', values: [0.9, 0.85, 0.75, 0.85, 0.85, 0.9] },
      { color: '#60a5fa', values: [0.75, 0.7, 0.85, 0.8, 0.7, 0.8] },
      { color: '#a78bfa', values: [0.8, 0.75, 0.8, 0.95, 0.75, 0.85] },
      { color: '#10b981', values: [0.85, 0.8, 0.75, 0.85, 0.95, 0.9] }
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
      { threshold: 0, rootMargin: '0px' }
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

  /* Filet de sécurité : si un compteur ou un reveal est encore à l'état
     initial (0 / invisible) peu après le chargement, on affiche la vraie
     valeur. Garantit qu'aucun "0" ne traîne même si l'IntersectionObserver
     ne s'est pas déclenché. */
  setTimeout(function () {
    revealEls.forEach(function (el) { if (!el.classList.contains('visible')) el.classList.add('visible'); });
    counters.forEach(function (el) {
      var target = (el.getAttribute('data-count') || '').replace(',', '.');
      var suffix = el.getAttribute('data-suffix') || '';
      var decimals = parseInt(el.getAttribute('data-decimals'), 10) || 0;
      var val = decimals > 0 ? parseFloat(target).toFixed(decimals).replace('NaN', '0') : String(Math.round(parseFloat(target) || 0));
      el.textContent = val + suffix;
    });
    fills.forEach(function (el) {
      var p = el.getAttribute('data-width') || el.style.getPropertyValue('--pct') || '100%';
      if (p.indexOf('%') === -1) p += '%';
      el.style.width = p;
    });
  }, 3500);

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

  /* ---------- Architecture : simulateur de déploiement ---------- */
  var archLog = document.getElementById('archLog');
  var archBtn = document.getElementById('archDeploy');
  if (archLog && archBtn) {
    var archSteps = [
      'terraform plan — 24 ressources, 0 à détruire ✓',
      'aws ecr push — image api:1.2.0 (scan ok) ✓',
      'kubectl/ECS rolling deploy — 3 réplicas, ha ✓',
      'migration PostgreSQL — 0 erreur, indices rebuilt ✓',
      'refresh cache Redis — hit ratio 92% ✓',
      'healthcheck /healthz — 200 OK, observabilité connectée ✓'
    ];
    var archRunning = false;
    archBtn.addEventListener('click', function () {
      if (archRunning) return;
      archRunning = true;
      var delay = 0;
      archSteps.forEach(function (step) {
        setTimeout(function () {
          var p = document.createElement('p');
          p.className = 'arch__log-line';
          p.textContent = step;
          archLog.appendChild(p);
          archLog.scrollTop = archLog.scrollHeight;
          if (archLog.childElementCount > 8) archLog.removeChild(archLog.firstElementChild);
          if (step === archSteps[archSteps.length - 1]) archRunning = false;
        }, delay);
        delay += 420;
      });
    });
  }

  /* ---------- Web app scalable : auto-scaling sous charge ---------- */
  var scaleSlider = document.getElementById('scaleSlider');
  var scaleRack = document.getElementById('scaleRack');
  if (scaleSlider && scaleRack) {
    var scaleRps = document.getElementById('scaleRps');
    var scaleReplicas = document.getElementById('scaleReplicas');
    var scaleConn = document.getElementById('scaleConn');
    var scaleCpu = document.getElementById('scaleCpu');
    var scaleCpuVal = document.getElementById('scaleCpuVal');
    var scaleSliderVal = document.getElementById('scaleSliderVal');
    var scaleHint = document.getElementById('scaleHint');

        var maxReps = 8;
    var repByLoad = 400;

    function rebuildRack(target) {
      var count = scaleRack.children.length;
      while (count < target) {
        var d = document.createElement('div');
        d.className = 'scale__rep';
        d.innerHTML = '<i class="fa-solid fa-server"></i><span>API-inst ' + (count + 1) + '</span>';
        scaleRack.appendChild(d);
        count++;
      }
      while (count > target) {
        scaleRack.removeChild(scaleRack.lastChild);
        count--;
      }
    }

    function updateScale(load) {
      load = parseInt(load, 10);
      var reps = Math.max(2, Math.ceil(load / repByLoad));
      reps = Math.min(maxReps, reps);
      var cpuPer = load === 0 ? 0 : Math.min(100, (load / (reps * repByLoad)) * 100);
      cpuPer = Math.round(cpuPer);
      var conns = Math.round(reps * 5 + cpuPer / 10);

      if (scaleRps) scaleRps.textContent = load;
      if (scaleReplicas) scaleReplicas.textContent = reps;
      if (scaleConn) scaleConn.textContent = conns;
      if (scaleSliderVal) scaleSliderVal.innerHTML = load + ' <small>req/s</small>';
      if (scaleCpu) scaleCpu.style.width = cpuPer + '%';
      if (scaleCpuVal) scaleCpuVal.textContent = cpuPer + '%';
      if (scaleHint) {
        scaleHint.textContent = cpuPer >= 70
          ? 'Haute charge : montée en échelle horizontale déclenchée (' + reps + ' réplicas).'
          : (cpuPer <= 30 && reps > 2
            ? 'Charge faible : réduction progressive du nombre de réplicas.'
            : 'Auto-scaling actif · seuil CPU 70%, ' + repByLoad + ' req/s par réplica.');
      }

      rebuildRack(reps);
      for (var i = 0; i < reps; i++) {
        var r = scaleRack.children[i];
        if (r) r.classList.toggle('scale__rep--on', i < reps - (cpuPer >= 70 ? 1 : 0) || i < 2);
      }
      if (reps > 0) scaleRack.children[reps - 1].classList.add('scale__rep--on');
    }

    rebuildRack(2);
    updateScale(scaleSlider.value);
    scaleSlider.addEventListener('input', function () {
      updateScale(this.value);
    });
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
    matrixCtx.fillStyle = '#10b981';
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

  /* ---------- Réseau de neurones : propagation avant animée ---------- */
  var nnCanvas = document.getElementById('nnCanvas');
  var nnRun = document.getElementById('nnRun');
  var nnActive = document.getElementById('nnActive');
  var nnMapping = document.getElementById('nnMapping');

  var NN = { layers: [4, 6, 2], nodeR: 16, gaps: { x: 150, y: 34 } };

  function sigmoid(x) { return 1 / (1 + Math.exp(-x)); }
  function relu(x) { return Math.max(0, x); }

  function nnLayout() {
    var cols = [];
    var colXs = [];
    var totalW = NN.layers.length * NN.gaps.x;
    var x0 = (nnCanvas.width - totalW) / 2 + NN.nodeR;
    for (var L = 0; L < NN.layers.length; L++) {
      var n = NN.layers[L];
      var startY = (nnCanvas.height - (n - 1) * NN.gaps.y) / 2;
      var col = [];
      for (var i = 0; i < n; i++) {
        col.push({ x: x0 + L * NN.gaps.x, y: startY + i * NN.gaps.y });
      }
      cols.push(col);
    }
    return cols;
  }

  function nnDraw(act, t) {
    if (!nnCanvas) return;
    var ctx = nnCanvas.getContext('2d');
    var W = nnCanvas.width, H = nnCanvas.height;
    ctx.clearRect(0, 0, W, H);
    t = t || 0;
    var pts = act && act.pts || nnLayout();
    for (var L2 = 0; L2 < pts.length - 1; L2++) {
      var prev = pts[L2], next = pts[L2 + 1];
      for (var i = 0; i < prev.length; i++) {
        for (var j = 0; j < next.length; j++) {
          var a = prev[i], b = next[j];
          var strength = act ? 0.1 + 0.9 * act.links[L2][j][i] : 0.18;
          var c = 'rgba(77,159,255,' + (0.08 + strength * 0.5) + ')';
          ctx.strokeStyle = c;
          ctx.lineWidth = 0.6 + strength * 2;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
          // impulsion circulant le long de la connexion
          var seg = 0.12 + 0.76 * strength;
          var pulseT = (t * (0.5 + strength) + (i + j) * 0.13) % 1;
          var px = a.x + (b.x - a.x) * pulseT;
          var py = a.y + (b.y - a.y) * pulseT;
          if (pulseT < seg) {
            ctx.beginPath();
            ctx.arc(px, py, 1.6 + strength * 1.4, 0, Math.PI * 2);
            ctx.fillStyle = act && strength > 0.4
              ? 'rgba(61,220,151,' + (0.3 + 0.6 * strength) + ')'
              : 'rgba(255,255,255,' + (0.12 + 0.5 * strength) + ')';
            ctx.fill();
          }
        }
      }
    }
    for (var L2 = 0; L2 < pts.length; L2++) {
      for (var i2 = 0; i2 < pts[L2].length; i2++) {
        var p = pts[L2][i2];
        var actv = act ? act.acts[L2][i2] : 0;
        var breathe = 0.75 + 0.25 * Math.sin(t * 2 + L2 * 0.8 + i2 * 0.5);
        var grad = actv > 0 ? 'rgba(61,220,151,' + (0.35 + actv * 0.6) + ')' : 'rgba(77,159,255,' + (0.1 + 0.12 * breathe) + ')';
        ctx.beginPath();
        ctx.arc(p.x, p.y, NN.nodeR * breathe, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,0.2)';
        ctx.lineWidth = 1;
        ctx.stroke();
        if (actv > 0.02) {
          ctx.fillStyle = 'rgba(255,255,255,0.95)';
          ctx.font = '700 11px "JetBrains Mono", monospace';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(actv.toFixed(1), p.x, p.y);
        }
      }
    }
  }

  function nnActivate() {
    var pts = nnLayout();
    var acts = [];
    var links = [];
    // couche d'entrée : valeurs d'excitation aléatoires stabilisées
    var inp = [];
    for (var i = 0; i < NN.layers[0]; i++) inp.push(0.25 + Math.random() * 0.75);
    acts.push(inp);
    // couches suivantes
    for (var L = 1; L < NN.layers.length; L++) {
      var prev = acts[L - 1];
      var cur = [];
      var link = [];
      for (var j = 0; j < NN.layers[L]; j++) {
        var sum = 0;
        var row = [];
        for (var k = 0; k < prev.length; k++) {
          var w = Math.random() * 2 - 1; // poids simulé
          var contrib = prev[k] * Math.max(0, w);
          row.push(contrib);
          sum += contrib;
        }
        var bias = Math.random() * 0.5;
        var out;
        if (L === NN.layers.length - 1) { out = relu(sum) + bias; }
        else { out = relu(sum + bias); }
        cur.push(out);
        link.push(row);
      }
      // softmax sur la sortie
      if (L === NN.layers.length - 1) {
        var ex = cur.map(function (v) { return Math.exp(v); });
        var se = ex.reduce(function (a, b) { return a + b; }, 0);
        cur = ex.map(function (v) { return v / (se || 1); });
      }
      acts.push(cur);
      links.push(link);
    }
    return { pts: pts, acts: acts, links: links };
  }

  function normalizeLinks(acts) {
    var max = 0;
    for (var l = 0; l < acts.links.length; l++) {
      for (var i = 0; i < acts.links[l].length; i++) {
        for (var j = 0; j < acts.links[l][i].length; j++) {
          if (acts.links[l][i][j] > max) max = acts.links[l][i][j];
        }
      }
    }
    for (var l2 = 0; l2 < acts.links.length; l2++) {
      for (var i2 = 0; i2 < acts.links[l2].length; i2++) {
        for (var j2 = 0; j2 < acts.links[l2][i2].length; j2++) {
          acts.links[l2][i2][j2] = (max > 0) ? acts.links[l2][i2][j2] / max : 0;
        }
      }
    }
    return acts;
  }

  function nnUpdateMapping(acts) {
    if (!nnMapping) return;
    var labels = ['attaque', 'normale'];
    var out = acts.acts[acts.acts.length - 1];
    nnMapping.innerHTML = '';
    for (var i = 0; i < out.length; i++) {
      var item = document.createElement('div');
      item.className = 'ai__nn-map-item' + (out[i] > 0.5 ? ' nn-map--on' : '');
      var nm = document.createElement('span');
      nm.className = 'nm';
      nm.textContent = i === 0 ? '⚠' : '✓';
      var tx = document.createElement('span');
      tx.textContent = labels[i] + '  ' + (out[i] * 100).toFixed(0) + '%';
      item.appendChild(nm);
      item.appendChild(tx);
      nnMapping.appendChild(item);
    }
  }

  if (nnCanvas) {
    var nnReduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var nnAct = null;
    var nnT = 0;
    nnDraw();

    function nnFrame() {
      nnT += 0.016;
      nnDraw(nnAct, nnT);
      nnAnimId = requestAnimationFrame(nnFrame);
    }

    var nnAnimId = 0;
    if (!nnReduce) nnAnimId = requestAnimationFrame(nnFrame);

    if (nnRun) nnRun.addEventListener('click', function () {
      var acts = nnActivate();
      acts = normalizeLinks(acts);
      nnAct = acts;
      nnDraw(nnAct, nnT);
      nnUpdateMapping(acts);
      var peak = 0;
      for (var i = 0; i < 3; i++) {
        var v = acts.acts[acts.acts.length - 1];
        peak = Math.max(peak, v[0] > v[1] ? v[0] : v[1]);
      }
      if (nnActive) nnActive.style.width = Math.round(peak * 100) + '%';
    });
  }

  /* ---------- Messagerie post-quantique : démo chiffrée ---------- */
  var mqMessage = document.getElementById('mqMessage');
  var mqSend = document.getElementById('mqSend');
  var mqTrace = document.getElementById('mqTrace');

  function mqHex(bytes) {
    return Array.prototype.map.call(bytes, function (b) {
      return ('0' + b.toString(16)).slice(-2);
    }).join('').slice(0, 96);
  }

  function mqLogSteps() {
    if (!mqTrace) return;
    var steps = mqTrace.querySelectorAll('.mq__step');
    steps.forEach(function (s, idx) {
      setTimeout(function () {
        s.classList.add('mq__step--on');
        s.classList.remove('mq__step--done');
        steps.forEach(function (o, oi) {
          if (oi !== idx) o.classList.remove('mq__step--on');
          if (oi < idx) o.classList.add('mq__step--done');
        });
      }, (idx + 1) * 320);
    });
  }

  function mqSendMsg() {
    if (!mqSend || !mqMessage || !mqTrace) return;
    var plain = mqMessage.value || 'message vide';
    var cryptoObj = window.crypto;

    function toHex(buf) { return mqHex(new Uint8Array(buf)); }

    function reportCt(ct) {
      var c = mqTrace.querySelector('.mq__ct');
      if (c) c.textContent = 'ciphertext = ' + ct;
    }

    function fallbackAes(plain) {
      // repli démo si WebCrypto indisponible
      var out = '';
      for (var i = 0; i < plain.length; i++) { out += ('0' + (plain.charCodeAt(i) ^ (0x5a + i)).toString(16)).slice(-2); }
      return Promise.resolve('AES-GCM[sim]·' + out.slice(0, 64));
    }

    mqLogSteps();
    var enc = new TextEncoder();
    var te = new TextEncoder();
    if (cryptoObj && cryptoObj.subtle && cryptoObj.getRandomValues) {
      // 1. Clé de session AES-GCM (issue du KEM Kyber-768 simulé)
      var keyPromise = cryptoObj.subtle.generateKey({ name: 'AES-GCM', length: 256 }, true, ['encrypt', 'decrypt']);
      var iv = cryptoObj.getRandomValues(new Uint8Array(12));
      keyPromise.then(function (key) {
        return cryptoObj.subtle.encrypt({ name: 'AES-GCM', iv: iv }, key, te.encode(plain));
      }).then(function (ct) {
        reportCt('0x' + toHex(ct) + ' · iv=' + toHex(iv) + ' · Kyber768+1·Dilithium2');
      }).catch(function () {
        reportCt(fallbackAes(plain));
      });
    } else {
      reportCt(fallbackAes(plain));
    }
  }

  if (mqSend) mqSend.addEventListener('click', mqSendMsg);

  /* ---------- Homelab : démos de sécurité applicative ---------- */
  function labAppend(el, text, cls) {
    if (!el) return;
    var p = document.createElement('p');
    p.className = 'arch__log-line' + (cls ? ' ' + cls : '');
    p.textContent = text;
    el.appendChild(p);
    el.scrollTop = el.scrollHeight;
    if (el.childElementCount > 6) el.removeChild(el.firstElementChild);
  }

  /* 1 · Injection SQL */
  var sqlInput = document.getElementById('sqlInput');
  var sqlRun = document.getElementById('sqlRun');
  var sqlLog = document.getElementById('sqlLog');
  if (sqlInput && sqlRun && sqlLog) {
    sqlRun.addEventListener('click', function () {
      var raw = sqlInput.value;
      var hostile = /('|--|;|OR\s+\d|UNION|DROP|SELECT\s+\*)/i.test(raw);
      labAppend(sqlLog, 'requête reçue : SELECT * FROM users WHERE email = ?' + (hostile ? ' (entrée suspecte : « ' + raw + ' »)' : ''), hostile ? '' : 'xss-ok');
      if (hostile) {
        labAppend(sqlLog, 'BLOQUÉE — requête préparée : le paramètre est lié à la valeur, jamais concaténé.');
        labAppend(sqlLog, 'résultat : 0 ligne renvoyée — injection neutralisée ✓');
      } else {
        labAppend(sqlLog, 'requête préparée : paramètre lié → 0 ligne renvoyée — OK');
      }
    });
  }

  /* 2 · XSS : échappement de sortie */
  var xssInput = document.getElementById('xssInput');
  var xssRun = document.getElementById('xssRun');
  var xssText = document.getElementById('xssText');
  if (xssInput && xssRun && xssText) {
    var esc = function (s) {
      var d = document.createElement('div');
      d.textContent = s;
      return d.innerHTML;
    };
    xssRun.addEventListener('click', function () {
      var raw = xssInput.value;
      var hasHtml = /<[a-z\/]/i.test(raw);
      xssText.textContent = esc(raw); // innerText ⇒ affiché en texte, jamais exécuté
      if (hasHtml) {
        labAppend(document.getElementById('xssLog') || sqlLog, 'HTML brut détecté : sortie échappée (HTML-encode) — aucun script exécuté ✓');
      }
    });
  }

  /* 3 · DDoS : rate-limit */
  var ddosRun = document.getElementById('ddosRun');
  var ddosLog = document.getElementById('ddosLog');
  if (ddosRun && ddosLog) {
    ddosRun.addEventListener('click', function () {
      var burst = 200;
      var allowed = Math.floor(burst * 0.15); // 30 req/s autorisées, le reste bloqué
      var blocked = burst - allowed;
      labAppend(ddosLog, 'rafale : ' + burst + ' requêtes en ~1 s');
      labAppend(ddosLog, 'rate-limit : ' + allowed + ' servies · ' + blocked + ' bloquées (HTTP 429)');
      labAppend(ddosLog, 'IP bannie temporairement (fail2ban) — API toujours disponible ✓');
    });
  }

  /* 4 · Reprise automatique (healthcheck) */
  var crashRun = document.getElementById('crashRun');
  var procs = document.getElementById('procs');
  var crashLog = document.getElementById('crashLog');
  if (crashRun && procs && crashLog) {
    var procEls = function () { return Array.prototype.slice.call(procs.querySelectorAll('.proc')); };
    crashRun.addEventListener('click', function () {
      if (crashRun._busy) return;
      crashRun._busy = true;
      var list = procEls();
      var victim = Math.floor(Math.random() * list.length);
      var v = list[victim];
      labAppend(crashLog, 'crash détecté : ' + (v.textContent || 'api') + ' → EXIT (code 1)');
      v.classList.add('proc--down');
      v.querySelector('.proc__dot').className = 'proc__dot proc__dot--down';
      setTimeout(function () {
        labAppend(crashLog, 'healthcheck : 2/3 en ligne — redémarrage automatique du process…');
        v.classList.remove('proc--down');
        v.classList.add('proc--boot');
        v.querySelector('.proc__dot').className = 'proc__dot proc__dot--boot';
        setTimeout(function () {
          labAppend(crashLog, 'process redémarré (PM2 · policy restart) — uptime 00:01, service rétabli ✓');
          v.classList.remove('proc--boot');
          v.querySelector('.proc__dot').className = 'proc__dot proc__dot--on';
          labAppend(crashLog, 'healthcheck — 3/3 conteneurs opérationnels ✓');
          crashRun._busy = false;
        }, 900);
      }, 900);
    });
  }

  /* ---------- Fin ---------- */
})();
