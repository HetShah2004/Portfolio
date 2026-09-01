/* ==========================================================================
   Het Shah, portfolio

   There is deliberately no scroll event listener in this file. Anything that
   depends on scroll position is an IntersectionObserver, or a CSS scroll or
   view timeline in styles.css. The only code that reads window.scrollY is the
   eased anchor scroll, and it does so inside its own rAF loop for the
   duration of one animation.

   Every pointer-driven effect reads from one shared `pointer` object fed by a
   single pointermove handler, so a mouse move costs one listener no matter
   how many things are reacting to it.
   ========================================================================== */

(() => {
  'use strict';

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  const root = document.documentElement;
  const SMALL = matchMedia('(max-width: 900px)');
  const FINE = matchMedia('(pointer: fine)').matches;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, t) => a + (b - a) * t;

  const navH = () =>
    parseInt(getComputedStyle(root).getPropertyValue('--nav-h'), 10) || 98;

  /* ----------------------------------------------------- motion switch */
  /*
     The inline script in the document head has already set data-motion from
     the visitor's saved choice, or from prefers-reduced-motion when there is
     none. This reads that decision rather than the media query directly, so
     the switch below is genuinely able to override the OS preference.

     Motion is not read once at load: every animated part registers a
     start/stop pair here, so flipping the switch takes effect immediately
     and nothing has to be reloaded.
  */
  const MOTION_KEY = 'hs-motion';
  let motionOn = root.getAttribute('data-motion') !== 'off';
  const parts = [];

  /* `pointer: fine` still gates the pointer effects independently: a touch
     screen has no hovering cursor to follow, so those stay off there whatever
     the switch says. */
  const registerMotion = (part) => {
    parts.push(part);
    /* Put the part into a defined state either way. Registering while motion
       is off still has to run stop(), or anything that paints its own static
       fallback (the assembly stage, the pipeline diagram) never draws at
       all and the panel is left blank. */
    (motionOn ? part.start : part.stop).call(part);
  };

  const pointer = { x: -9999, y: -9999, has: false };
  addEventListener('pointermove', (e) => {
    pointer.x = e.clientX;
    pointer.y = e.clientY;
    pointer.has = true;
  }, { passive: true });

  /* Effects that depend on the accent colour re-read it through these. */
  const themeHooks = [];

  const motionBtn = document.getElementById('motionToggle');

  const setMotion = (on, persist) => {
    motionOn = on;
    root.setAttribute('data-motion', on ? 'on' : 'off');

    if (motionBtn) {
      motionBtn.setAttribute('aria-pressed', String(on));
      motionBtn.setAttribute('aria-label',
        on ? 'Turn animations off' : 'Turn animations on');
      const icon = motionBtn.querySelector('i');
      if (icon) icon.className = on ? 'ph-light ph-sparkle' : 'ph-light ph-pause';
    }

    parts.forEach((p) => (on ? p.start() : p.stop()));

    if (persist) {
      try {
        localStorage.setItem(MOTION_KEY, on ? 'on' : 'off');
      } catch {
        /* Private mode or blocked site data. The choice will not persist. */
      }
    }
  };

  motionBtn?.addEventListener('click', () => setMotion(!motionOn, true));


  /* ------------------------------------------------------------- theme */
  const THEME_KEY = 'hs-theme';
  const toggle = $('#themeToggle');

  const readStored = () => {
    try {
      return localStorage.getItem(THEME_KEY);
    } catch {
      return null;
    }
  };

  const applyTheme = (t) => {
    root.setAttribute('data-theme', t);
    const meta = $('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', t === 'light' ? '#f2f1ed' : '#050506');
    if (toggle) {
      const icon = toggle.querySelector('i');
      if (icon) icon.className = t === 'light' ? 'ph-light ph-moon' : 'ph-light ph-sun';
      toggle.setAttribute('aria-label',
        t === 'light' ? 'Switch to dark theme' : 'Switch to light theme');
    }
    themeHooks.forEach((fn) => fn(t));
  };

  applyTheme(readStored() ||
    (matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'));

  toggle?.addEventListener('click', () => {
    const next = root.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
    applyTheme(next);
    try {
      localStorage.setItem(THEME_KEY, next);
    } catch {
      /* Private mode or blocked site data. The choice just will not persist. */
    }
  });


  /* --------------------------------------------------- full screen menu */
  const menu = $('#menu');
  const burger = $('#burger');
  const menuLinks = $$('.menu-link span');

  menuLinks.forEach((s, i) => s.style.setProperty('--d', `${80 + i * 55}ms`));

  let menuOpen = false;

  function setMenu(open) {
    if (!menu || open === menuOpen) return;
    menuOpen = open;
    burger?.setAttribute('aria-expanded', String(open));
    burger?.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    document.body.classList.toggle('locked', open);

    if (open) {
      menu.hidden = false;
      /* One frame between unhiding and animating, so the transition runs. */
      requestAnimationFrame(() => menu.classList.add('open'));
    } else {
      menu.classList.remove('open');
      const done = () => { if (!menuOpen) menu.hidden = true; };
      motionOn ? setTimeout(done, 520) : done();
    }
  }

  const closeMenu = () => setMenu(false);

  burger?.addEventListener('click', () => setMenu(!menuOpen));
  addEventListener('keydown', (e) => { if (e.key === 'Escape') closeMenu(); });
  SMALL.addEventListener('change', closeMenu);


  /* ------------------------------------------------- eased anchor scroll */
  /*
     Nav clicks animate the page rather than jumping it. Snapping is switched
     off while the animation is in flight, otherwise the browser tries to snap
     to an intermediate screen and fights the tween. Any real scroll gesture
     cancels it immediately and hands control back, which is what keeps this
     from feeling like scroll hijacking.
  */
  const EASE = (t) => 1 - Math.pow(1 - t, 4);
  const SCROLL_KEYS = new Set(
    ['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', ' ', 'Spacebar']);

  let abortCurrent = null;

  const smoothScrollTo = (targetY) => {
    if (abortCurrent) abortCurrent();

    const maxY = Math.max(0, root.scrollHeight - innerHeight);
    const to = clamp(targetY, 0, maxY);
    const from = scrollY;
    const dist = to - from;

    if (!motionOn || Math.abs(dist) < 2) {
      scrollTo(0, to);
      return;
    }

    /* Longer trips take longer, but never so long that it drags. */
    const duration = clamp(440 + Math.abs(dist) * 0.36, 500, 1250);
    const t0 = performance.now();
    let raf = 0;

    root.classList.add('snap-off');

    function end() {
      cancelAnimationFrame(raf);
      removeEventListener('wheel', end);
      removeEventListener('touchstart', end);
      removeEventListener('keydown', onKey);
      /* Restore snapping a frame later, so it cannot grab the final position
         while this animation's last scrollTo is still settling. */
      requestAnimationFrame(() => root.classList.remove('snap-off'));
      abortCurrent = null;
    }

    function onKey(e) {
      if (SCROLL_KEYS.has(e.key)) end();
    }

    abortCurrent = end;
    addEventListener('wheel', end, { passive: true });
    addEventListener('touchstart', end, { passive: true });
    addEventListener('keydown', onKey);

    const step = (now) => {
      const p = Math.min((now - t0) / duration, 1);
      scrollTo(0, from + dist * EASE(p));
      if (p < 1) raf = requestAnimationFrame(step);
      else end();
    };
    raf = requestAnimationFrame(step);
  };

  /* One delegated handler covers the island, the rail, the menu, the hero
     buttons and the skip link. */
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href^="#"]');
    if (!a || a.hasAttribute('download')) return;

    const hash = a.getAttribute('href');
    if (!hash || hash === '#') return;

    const target = document.getElementById(hash.slice(1));
    if (!target) return;

    e.preventDefault();
    closeMenu();

    let y = 0;
    if (hash !== '#top') {
      /* A snapping screen sits flush with the viewport top, so the floating
         island overlays its own padding. The pan needs the island cleared. */
      const flush = target.classList.contains('section--snap') && !SMALL.matches;
      y = target.getBoundingClientRect().top + scrollY - (flush ? 0 : navH());
    }

    smoothScrollTo(y);
    history.replaceState(null, '', hash);

    target.setAttribute('tabindex', '-1');
    target.focus({ preventScroll: true });
  });

  $('#toTop')?.addEventListener('click', () => smoothScrollTo(0));


  /* -------------------------------------------------------- section spy */
  const sections = $$('main section[id]');
  const marks = new Map();

  for (const el of $$('.nav-link, .rail-item')) {
    const id = el.getAttribute('href').slice(1);
    if (!marks.has(id)) marks.set(id, []);
    marks.get(id).push(el);
  }

  if (sections.length) {
    /* Whichever screen crosses the middle band of the viewport owns the
       highlight, in both the island and the rail. */
    const spy = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        marks.forEach((els) => els.forEach((el) => el.classList.remove('active')));
        marks.get(entry.target.id)?.forEach((el) => el.classList.add('active'));
      }
    }, { rootMargin: '-45% 0px -45% 0px', threshold: 0 });
    sections.forEach((s) => spy.observe(s));
  }


  /* ------------------------------------------------------------ reveals */
  const revealables = $$('.reveal');

  if (revealables.length) {
    const io = new IntersectionObserver((entries, obs) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        const el = entry.target;
        /* Stagger against reveal siblings, so a group arrives in sequence
           rather than all at once. */
        const sibs = [...(el.parentElement?.children || [])]
          .filter((c) => c.classList.contains('reveal'));
        const i = Math.max(0, sibs.indexOf(el));
        el.style.setProperty('--d', `${Math.min(i, 6) * 80}ms`);
        el.classList.add('in');
        obs.unobserve(el);
      }
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    revealables.forEach((el) => io.observe(el));
  }

  /* Headline and island resolve on first paint, not on scroll. */
  const heroTitle = $('.hero-title');
  if (heroTitle) {
    $$('.l > span', heroTitle).forEach((s, i) =>
      s.style.setProperty('--d', `${180 + i * 130}ms`));
    requestAnimationFrame(() => heroTitle.classList.add('in'));
  }

  const island = $('#island');
  if (island) {
    $$('.island-core > *', island).forEach((el, i) =>
      el.style.setProperty('--d', `${100 + i * 70}ms`));
    requestAnimationFrame(() => island.classList.add('in'));
  }


  /* ----------------------------------------------------------- counters */
  const counters = $$('.snum[data-count]');
  if (counters.length) {
    const cio = new IntersectionObserver((entries, obs) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        const el = entry.target;
        obs.unobserve(el);

        const target = parseFloat(el.dataset.count) || 0;
        const suffix = el.dataset.suffix || '';

        if (!motionOn) {
          el.textContent = `${target}${suffix}`;
          continue;
        }

        const t0 = performance.now();
        const tick = (now) => {
          const p = Math.min((now - t0) / 1300, 1);
          const eased = 1 - Math.pow(1 - p, 3);
          el.textContent = Math.round(target * eased) + (p === 1 ? suffix : '');
          if (p < 1 && motionOn) requestAnimationFrame(tick);
          else el.textContent = `${target}${suffix}`;
        };
        requestAnimationFrame(tick);
      }
    }, { threshold: 0.5 });
    counters.forEach((el) => cio.observe(el));
  }


  /* --------------------------------------------------- hero signal field */
  const field = $('#signal');
  if (field) {
    const ctx = field.getContext('2d');
    const GAP = 54;
    const REACH = 240;

    let w = 0, h = 0, nodes = [], live = true, raf = 0;
    const start = performance.now();

    const readInk = () =>
      getComputedStyle(root).getPropertyValue('--accent').trim() || '#c9f24d';
    let ink = readInk();
    themeHooks.push(() => { ink = readInk(); });

    const build = () => {
      const r = field.getBoundingClientRect();
      if (!r.width || !r.height) return;

      const dpr = Math.min(devicePixelRatio || 1, 2);
      w = r.width;
      h = r.height;
      field.width = Math.round(w * dpr);
      field.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      nodes = [];
      for (let x = 0; x <= w + GAP; x += GAP) {
        for (let y = 0; y <= h + GAP; y += GAP) nodes.push({ x, y, a: 0 });
      }
    };

    const draw = (now) => {
      raf = requestAnimationFrame(draw);
      if (!live || !nodes.length) return;

      const box = field.getBoundingClientRect();
      const px = pointer.has ? pointer.x - box.left : -9999;
      const py = pointer.has ? pointer.y - box.top : -9999;
      const t = (now - start) / 1000;

      ctx.clearRect(0, 0, w, h);
      ctx.strokeStyle = ink;
      ctx.lineWidth = 1;

      for (const n of nodes) {
        const dx = px - n.x;
        const dy = py - n.y;
        const dist = Math.hypot(dx, dy);
        const near = dist < REACH ? 1 - dist / REACH : 0;

        /* Ambient wave when the cursor is far, cursor angle when it is near. */
        const wave = Math.sin((n.x + n.y) * 0.008 + t * 0.55) * 0.9;
        const target = near > 0 ? Math.atan2(dy, dx) : wave;

        /* Shortest way round, so a stroke never spins the long way. */
        let diff = target - n.a;
        while (diff > Math.PI) diff -= Math.PI * 2;
        while (diff < -Math.PI) diff += Math.PI * 2;
        n.a += diff * 0.08;

        const len = 5 + near * 11;
        const cos = Math.cos(n.a) * len;
        const sin = Math.sin(n.a) * len;

        ctx.globalAlpha = 0.09 + near * 0.55;
        ctx.beginPath();
        ctx.moveTo(n.x - cos, n.y - sin);
        ctx.lineTo(n.x + cos, n.y + sin);
        ctx.stroke();
      }

      ctx.globalAlpha = 1;
      field.classList.add('on');
    };

    build();
    addEventListener('resize', build, { passive: true });
    new IntersectionObserver((e) => { live = e[0].isIntersecting; }).observe(field);

    registerMotion({
      start() {
        /* Rebuild on every start. While motion is off the canvas is
           display:none, so it measures zero and holds no nodes; without this
           it would stay blank after the switch is turned on. */
        build();
        if (!raf) raf = requestAnimationFrame(draw);
      },
      stop() {
        cancelAnimationFrame(raf);
        raf = 0;
        field.classList.remove('on');
        ctx.clearRect(0, 0, w, h);
      }
    });
  }


  /* ----------------------------------------------------- assembly stage */
  /*
     The hero visual, and the argument the headline is making: a loose cloud
     of points is a client talking, and it resolves into a built system as
     the first screen scrolls away.

     Progress comes from `--assemble`, which a view timeline in the
     stylesheet drives from scroll position. Reading the computed value once
     per frame keeps this honest: no scroll listener, and the picture cannot
     drift out of step with the page.
  */
  const asm = $('#assembly');
  const asmCore = $('#assemblyCore');
  const asmStep = $('#assemblyStep');

  if (asm && asmCore) {
    const ctx = asm.getContext('2d');

    /* Four bands of a small system: what comes in, what reasons about it,
       what serves it, what ships. Counts differ so it reads as architecture
       rather than as a grid. */
    const BANDS = [
      { y: 0.17, n: 5 },
      { y: 0.39, n: 3 },
      { y: 0.61, n: 4 },
      { y: 0.83, n: 6 }
    ];
    const STEPS = ['Raw call', 'Requirements', 'Architecture', 'Shipped'];

    let w = 0, h = 0, nodes = [], edges = [], dust = [];
    let raf = 0, live = true, lastStep = -1;
    const born = performance.now();

    const readInk = () =>
      getComputedStyle(root).getPropertyValue('--accent').trim() || '#c9f24d';
    let ink = readInk();
    themeHooks.push(() => { ink = readInk(); });

    const build = () => {
      const r = asm.getBoundingClientRect();
      if (!r.width || !r.height) return false;

      const dpr = Math.min(devicePixelRatio || 1, 2);
      w = r.width;
      h = r.height;
      asm.width = Math.round(w * dpr);
      asm.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      nodes = [];
      edges = [];

      BANDS.forEach((band, bi) => {
        band.first = nodes.length;
        for (let i = 0; i < band.n; i++) {
          /* Even spread inside the safe area, nudged so the rows do not
             line up into columns. */
          const t = band.n === 1 ? 0.5 : i / (band.n - 1);
          const jitter = (((bi * 7 + i * 13) % 5) - 2) * 0.012;

          nodes.push({
            tx: (0.17 + t * 0.66 + jitter) * w,
            ty: band.y * h,
            /* Chaos before assembly: scattered wide, each with its own slow
               orbit so the cloud breathes instead of sitting still. */
            ox: (0.06 + Math.random() * 0.88) * w,
            oy: (0.06 + Math.random() * 0.88) * h,
            ph: Math.random() * Math.PI * 2,
            sp: 0.5 + Math.random() * 0.7,
            amp: 6 + Math.random() * 12,
            /* Staggered arrival, earlier bands first, so the system builds
               top down rather than snapping into place all at once. */
            lag: Math.min(0.42, bi * 0.1 + Math.random() * 0.08),
            x: 0,
            y: 0
          });
        }
      });

      /* Each node reaches to the two nearest in the band below. */
      for (let bi = 0; bi < BANDS.length - 1; bi++) {
        const a = BANDS[bi], b = BANDS[bi + 1];
        for (let i = a.first; i < a.first + a.n; i++) {
          const ranked = [];
          for (let j = b.first; j < b.first + b.n; j++) {
            ranked.push([Math.abs(nodes[i].tx - nodes[j].tx), j]);
          }
          ranked.sort((m, n) => m[0] - n[0]);
          for (const pair of ranked.slice(0, 2)) edges.push([i, pair[1]]);
        }
      }

      dust = Array.from({ length: 46 }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        r: 0.6 + Math.random() * 1.1,
        ph: Math.random() * Math.PI * 2,
        sp: 0.3 + Math.random() * 0.5
      }));

      return true;
    };

    /* Scroll drives this. If the browser cannot interpolate the custom
       property, fall back to a one-off timed assembly so the visual still
       resolves rather than sitting as permanent noise. */
    const progress = (now) => {
      const raw = parseFloat(
        getComputedStyle(asmCore).getPropertyValue('--assemble'));
      if (Number.isFinite(raw)) return clamp(raw, 0, 1);
      return clamp((now - born - 400) / 2200, 0, 1);
    };

    const ease = (t) => 1 - Math.pow(1 - t, 3);

    const paint = (now, forced) => {
      if (!nodes.length) return;

      const p = forced != null ? forced : progress(now);
      const t = (now - born) / 1000;
      const box = asm.getBoundingClientRect();
      const px = pointer.has ? pointer.x - box.left : -9999;
      const py = pointer.has ? pointer.y - box.top : -9999;

      ctx.clearRect(0, 0, w, h);

      for (const n of nodes) {
        const local = ease(clamp((p - n.lag) / (1 - n.lag), 0, 1));

        /* The orbit fades out as the node locks into position. */
        const wob = forced != null ? 0 : (1 - local) * n.amp;
        const ox = n.ox + Math.cos(t * n.sp + n.ph) * wob;
        const oy = n.oy + Math.sin(t * n.sp * 0.8 + n.ph) * wob;

        n.x = ox + (n.tx - ox) * local;
        n.y = oy + (n.ty - oy) * local;

        /* An assembled system still answers to the cursor, but only just:
           it should read as settled, not as jelly. */
        if (px > -9000) {
          const dx = n.x - px, dy = n.y - py;
          const d = Math.hypot(dx, dy);
          if (d < 90 && d > 0.5) {
            const push = (1 - d / 90) * 14;
            n.x += (dx / d) * push;
            n.y += (dy / d) * push;
          }
        }
      }

      /* Connections only mean anything once there is a structure. */
      const wire = p * p;
      if (wire > 0.01) {
        ctx.strokeStyle = ink;
        ctx.lineWidth = 1;
        ctx.globalAlpha = wire * 0.42;
        ctx.beginPath();
        for (const e of edges) {
          ctx.moveTo(nodes[e[0]].x, nodes[e[0]].y);
          ctx.lineTo(nodes[e[1]].x, nodes[e[1]].y);
        }
        ctx.stroke();
      }

      /* Residual noise, thinning out as the system comes together. */
      if (p < 0.98) {
        ctx.fillStyle = ink;
        for (const d of dust) {
          const dy = forced != null ? 0 : Math.sin(t * d.sp + d.ph) * 5;
          ctx.globalAlpha = (1 - p) * 0.45;
          ctx.beginPath();
          ctx.arc(d.x, d.y + dy, d.r, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      ctx.fillStyle = ink;
      for (const n of nodes) {
        const local = ease(clamp((p - n.lag) / (1 - n.lag), 0, 1));
        ctx.globalAlpha = 0.5 + local * 0.45;
        ctx.beginPath();
        ctx.arc(n.x, n.y, 2.4 + local * 1.4, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.globalAlpha = 1;

      const step = Math.min(STEPS.length - 1, Math.floor(p * STEPS.length));
      if (step !== lastStep && asmStep) {
        lastStep = step;
        asmStep.textContent = STEPS[step];
      }
    };

    const frame = (now) => {
      raf = requestAnimationFrame(frame);
      if (live) paint(now);
    };

    /* Rebuilding on resize keeps the target lattice proportional. */
    addEventListener('resize', () => {
      if (build()) paint(performance.now(), motionOn ? undefined : 1);
    }, { passive: true });

    new IntersectionObserver((e) => { live = e[0].isIntersecting; },
      { rootMargin: '120px' }).observe(asm);

    registerMotion({
      start() {
        build();
        if (!raf) raf = requestAnimationFrame(frame);
      },
      stop() {
        cancelAnimationFrame(raf);
        raf = 0;
        /* Static, but finished: the point of the picture survives with the
           motion switched off. */
        if (build()) paint(performance.now(), 1);
        if (asmStep) {
          lastStep = STEPS.length - 1;
          asmStep.textContent = STEPS[lastStep];
        }
      }
    });
  }


  /* ---------------------------------------------------- magnetic controls */
  /* Rects are read in one pass and styles written in a second, so a frame
     never interleaves reads and writes and forces synchronous layout. */
  const magnets = $$('.btn, .icon-btn, .to-top');
  if (FINE && magnets.length) {
    const items = magnets.map((el) => ({ el, x: 0, y: 0, tx: 0, ty: 0 }));
    let magRaf = 0;

    const tick = () => {
      magRaf = requestAnimationFrame(tick);

      for (const m of items) {
        const r = m.el.getBoundingClientRect();
        if (!r.width || r.bottom < 0 || r.top > innerHeight) {
          m.tx = m.ty = 0;
          continue;
        }
        const dx = pointer.x - (r.left + r.width / 2);
        const dy = pointer.y - (r.top + r.height / 2);
        const reach = Math.max(r.width, r.height) * 0.85 + 42;
        const dist = Math.hypot(dx, dy);

        if (dist < reach) {
          const pull = (1 - dist / reach) * 0.3;
          m.tx = dx * pull;
          m.ty = dy * pull;
        } else {
          m.tx = m.ty = 0;
        }
      }

      for (const m of items) {
        m.x = lerp(m.x, m.tx, 0.16);
        m.y = lerp(m.y, m.ty, 0.16);
        m.el.style.setProperty('--mx-off', `${m.x.toFixed(2)}px`);
        m.el.style.setProperty('--my-off', `${m.y.toFixed(2)}px`);
      }
    };

    registerMotion({
      start() {
        if (!magRaf) magRaf = requestAnimationFrame(tick);
      },
      stop() {
        cancelAnimationFrame(magRaf);
        magRaf = 0;
        for (const m of items) {
          m.x = m.y = m.tx = m.ty = 0;
          m.el.style.removeProperty('--mx-off');
          m.el.style.removeProperty('--my-off');
        }
      }
    });
  }


  /* -------------------------------------------------------- hero 3D stage */
  const stage = $('#stage3d');
  const stageInner = stage && $('.stage3d-inner', stage);
  if (stageInner && FINE) {
    let rx = 0, ry = 0, tx = 0, ty = 0, inView = true, spinRaf = 0;

    new IntersectionObserver((e) => { inView = e[0].isIntersecting; },
      { rootMargin: '140px' }).observe(stage);

    const spin = () => {
      spinRaf = requestAnimationFrame(spin);
      if (!inView) return;

      if (pointer.has) {
        /* Measured against the viewport, so moving anywhere across the hero
           turns the stage, not only passing over the photo itself. */
        ty = clamp((pointer.x / innerWidth - 0.5) * 2, -1, 1) * 12;
        tx = clamp((pointer.y / innerHeight - 0.5) * 2, -1, 1) * -9;
      }

      rx = lerp(rx, tx, 0.07);
      ry = lerp(ry, ty, 0.07);
      stageInner.style.transform =
        `rotateX(${rx.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg)`;
    };

    registerMotion({
      start() {
        if (!spinRaf) spinRaf = requestAnimationFrame(spin);
      },
      stop() {
        cancelAnimationFrame(spinRaf);
        spinRaf = 0;
        rx = ry = tx = ty = 0;
        stageInner.style.transform = '';
      }
    });
  }


  /* -------------------------------------------- project tilt and spotlight */
  /* Per card, and the loop only runs while a pointer is actually over one,
     so an idle Work screen costs nothing. */
  if (FINE) {
    for (const card of $$('.proj')) {
      let raf = 0, rx = 0, ry = 0, tx = 0, ty = 0, over = false;

      const run = () => {
        rx = lerp(rx, tx, 0.12);
        ry = lerp(ry, ty, 0.12);

        if (!over && Math.abs(rx) < 0.02 && Math.abs(ry) < 0.02) {
          card.style.transform = '';
          raf = 0;
          return;
        }
        card.style.transform =
          `rotateX(${rx.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg)`;
        raf = requestAnimationFrame(run);
      };

      card.addEventListener('pointermove', (e) => {
        if (!motionOn) return;
        const r = card.getBoundingClientRect();
        const nx = (e.clientX - r.left) / r.width;
        const ny = (e.clientY - r.top) / r.height;

        card.style.setProperty('--px', `${(nx * 100).toFixed(1)}%`);
        card.style.setProperty('--py', `${(ny * 100).toFixed(1)}%`);

        ty = (nx - 0.5) * 8;
        tx = (ny - 0.5) * -8;
        over = true;
        if (!raf) raf = requestAnimationFrame(run);
      }, { passive: true });

      card.addEventListener('pointerleave', () => {
        over = false;
        tx = ty = 0;
        if (!raf) raf = requestAnimationFrame(run);
      }, { passive: true });

      /* Switching motion off mid-hover has to clear the card itself: its
         loop only settles while a pointer is driving it. */
      registerMotion({
        start() { },
        stop() {
          cancelAnimationFrame(raf);
          raf = 0;
          rx = ry = tx = ty = 0;
          over = false;
          card.style.transform = '';
        }
      });
    }
  }


  /* --------------------------------------------------- protomind pipeline */
  const transcriptEl = $('#transcript');
  const reqsEl = $('#reqs');
  const filesEl = $('#files');
  const rail = $('#pipeRail');

  if (transcriptEl && reqsEl && filesEl && rail) {
    const TALK = [
      { who: 'client', text: 'toh basically ek dashboard chahiye jisme stock aur sales dono dikhe.' },
      { who: 'client', text: 'બંને એક જ જગ્યાએ track થાય તો સારું.' },
      { who: 'het', text: 'Got it. Who needs access, admin only or the sales team too?' },
      { who: 'client', text: 'sales team ko bhi, but edit sirf admin kare.' },
      { who: 'client', text: 'monthly report export કરી શકાય એવું જોઈએ.' }
    ];

    const REQS = [
      'Unified dashboard with live stock and sales in one view',
      'Role-based access: sales reads, admin writes',
      'Monthly report export to CSV or PDF',
      'Audit trail on every stock adjustment'
    ];

    const FILES = [
      'backend/app/main.py',
      'backend/app/models/inventory.py',
      'backend/app/api/routes_sales.py',
      'web/app/(dashboard)/page.tsx',
      'web/components/StockTable.tsx',
      'docker-compose.yml'
    ];

    const pipes = $$('.pipe', rail);
    let timers = [];
    const later = (fn, ms) => timers.push(setTimeout(fn, ms));
    const clearAll = () => { timers.forEach(clearTimeout); timers = []; };
    const setStep = (i) => pipes.forEach((p, n) => p.classList.toggle('on', n <= i));

    const addTalk = (item) => {
      const div = document.createElement('div');
      div.className = 't-line';
      const who = document.createElement('em');
      who.textContent = item.who === 'het' ? 'het' : 'client';
      div.append(who, document.createTextNode(item.text));
      transcriptEl.appendChild(div);
      $$('.t-line', transcriptEl).forEach((l, n, arr) =>
        l.classList.toggle('now', n === arr.length - 1));
      while (transcriptEl.children.length > 3) {
        transcriptEl.removeChild(transcriptEl.firstChild);
      }
    };

    const addReq = (text, i) => {
      const li = document.createElement('li');
      const tag = document.createElement('b');
      tag.textContent = `R${String(i + 1).padStart(2, '0')}`;
      const span = document.createElement('span');
      span.textContent = text;
      li.append(tag, span);
      reqsEl.appendChild(li);
    };

    const addFile = (path) => {
      const li = document.createElement('li');
      const icon = document.createElement('i');
      icon.className = 'ph-light ph-check';
      icon.setAttribute('aria-hidden', 'true');
      const span = document.createElement('span');
      span.textContent = path;
      li.append(icon, span);
      filesEl.appendChild(li);
    };

    const run = () => {
      clearAll();
      transcriptEl.replaceChildren();
      reqsEl.replaceChildren();
      filesEl.replaceChildren();
      pipes.forEach((p) => p.classList.remove('on'));

      let t = 400;
      setStep(0);
      TALK.forEach((item) => {
        later(() => addTalk(item), t);
        t += 1100;
      });

      later(() => setStep(1), t);
      REQS.forEach((r, i) => later(() => addReq(r, i), t + i * 400));
      t += REQS.length * 400 + 300;

      later(() => setStep(2), t); t += 500;
      later(() => setStep(3), t); t += 500;
      later(() => setStep(4), t);

      FILES.forEach((f, i) => later(() => addFile(f), t + i * 290));
      t += FILES.length * 290 + 300;

      later(() => setStep(5), t); t += 700;
      later(() => setStep(6), t); t += 2800;
      later(run, t);
    };

    /* With motion off the diagram still has to communicate: it renders its
       finished state rather than animating toward it. */
    const settle = () => {
      clearAll();
      transcriptEl.replaceChildren();
      reqsEl.replaceChildren();
      filesEl.replaceChildren();
      TALK.slice(-3).forEach(addTalk);
      REQS.forEach(addReq);
      FILES.forEach(addFile);
      setStep(6);
    };

    let inView = false, started = false;

    new IntersectionObserver((entries) => {
      inView = entries[0].isIntersecting;
      if (inView && motionOn && !started) {
        started = true;
        run();
      }
    }, { threshold: 0.25 }).observe(rail);

    registerMotion({
      start() {
        if (inView && !started) {
          started = true;
          run();
        }
      },
      stop() {
        started = false;
        settle();
      }
    });

  }


  /* --------------------------------------------------------------- form */
  const form = $('#contactForm');
  if (form) {
    const note = $('#formNote');
    const btn = $('#submitBtn');
    const btnLabel = btn?.querySelector('span');
    const DEFAULT_NOTE = note?.textContent || '';
    const ENDPOINT =
      'https://script.google.com/macros/s/AKfycbzsg_j4en9A7b4F2Sqrcx6v748cJWIqjqwJyeDps0p_t1o_qWOa4wsLPeh2mAkRJSjs/exec';

    const setNote = (msg, cls) => {
      if (!note) return;
      note.textContent = msg;
      note.classList.remove('ok', 'err');
      if (cls) note.classList.add(cls);
    };

    const clearError = (fieldEl) => {
      fieldEl.classList.remove('invalid');
      fieldEl.querySelector('.field-error')?.remove();
      fieldEl.querySelector('input, textarea')?.removeAttribute('aria-invalid');
    };

    const setError = (fieldEl, msg) => {
      fieldEl.classList.add('invalid');
      fieldEl.querySelector('input, textarea')?.setAttribute('aria-invalid', 'true');
      let el = fieldEl.querySelector('.field-error');
      if (!el) {
        el = document.createElement('p');
        el.className = 'field-error';
        fieldEl.appendChild(el);
      }
      el.textContent = msg;
    };

    $$('.field input, .field textarea', form).forEach((el) => {
      el.addEventListener('input', () => {
        const fieldEl = el.closest('.field');
        if (fieldEl?.classList.contains('invalid')) clearError(fieldEl);
      });
    });

    const validate = () => {
      let firstBad = null;
      $$('.field', form).forEach((fieldEl) => {
        const el = fieldEl.querySelector('[required]');
        if (!el) return;
        const empty = el.value.trim() === '';
        const badFormat = !empty && !el.checkValidity();

        if (empty) setError(fieldEl, 'This field is required.');
        else if (badFormat) {
          setError(fieldEl, el.type === 'email'
            ? 'Enter a valid email address.' : 'Check this value.');
        } else {
          clearError(fieldEl);
          return;
        }
        if (!firstBad) firstBad = el;
      });
      return firstBad;
    };

    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const bad = validate();
      if (bad) {
        bad.focus();
        setNote('Fix the highlighted fields.', 'err');
        return;
      }

      const data = new FormData(form);
      if (data.get('honeypot')) {
        form.reset();
        setNote('Message sent. Thanks.', 'ok');
        return;
      }

      btn.disabled = true;
      if (btnLabel) btnLabel.textContent = 'Sending';
      setNote('Sending.', '');

      try {
        await fetch(ENDPOINT, { method: 'POST', body: data });
        form.reset();
        if (btnLabel) btnLabel.textContent = 'Sent';
        setNote("Message received. I'll reply within a day.", 'ok');
      } catch {
        if (btnLabel) btnLabel.textContent = 'Retry';
        setNote('That did not go through. Email hetshahworks@gmail.com instead.', 'err');
      } finally {
        setTimeout(() => {
          btn.disabled = false;
          if (btnLabel) btnLabel.textContent = 'Send message';
          setNote(DEFAULT_NOTE, '');
        }, 4500);
      }
    });
  }


  /* -------------------------------------------------------- footer year */
  const footNote = $('#footNote');
  if (footNote) {
    footNote.textContent =
      footNote.textContent.replace('2026', String(new Date().getFullYear()));
  }
})();
