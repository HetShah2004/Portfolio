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
  const REDUCE = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const SMALL = matchMedia('(max-width: 900px)');
  const FINE = matchMedia('(pointer: fine)').matches;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const RICH = FINE && !REDUCE;

  const navH = () =>
    parseInt(getComputedStyle(root).getPropertyValue('--nav-h'), 10) || 98;

  const pointer = { x: -9999, y: -9999, has: false };
  if (RICH) {
    addEventListener('pointermove', (e) => {
      pointer.x = e.clientX;
      pointer.y = e.clientY;
      pointer.has = true;
    }, { passive: true });
  }

  /* Effects that depend on the accent colour re-read it through these. */
  const themeHooks = [];


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
      REDUCE ? done() : setTimeout(done, 520);
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

    if (REDUCE || Math.abs(dist) < 2) {
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

  if (REDUCE) {
    revealables.forEach((el) => el.classList.add('in'));
  } else if (revealables.length) {
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
    if (REDUCE) {
      counters.forEach((el) => {
        el.textContent = `${el.dataset.count}${el.dataset.suffix || ''}`;
      });
    } else {
      const cio = new IntersectionObserver((entries, obs) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const el = entry.target;
          obs.unobserve(el);

          const target = parseFloat(el.dataset.count) || 0;
          const suffix = el.dataset.suffix || '';
          const t0 = performance.now();

          const tick = (now) => {
            const p = Math.min((now - t0) / 1300, 1);
            const eased = 1 - Math.pow(1 - p, 3);
            el.textContent = Math.round(target * eased) + (p === 1 ? suffix : '');
            if (p < 1) requestAnimationFrame(tick);
          };
          requestAnimationFrame(tick);
        }
      }, { threshold: 0.5 });
      counters.forEach((el) => cio.observe(el));
    }
  }


  /* ------------------------------------------------- project empty state */
  $$('.proj-media img').forEach((img) => {
    const mark = () => img.closest('.proj-media')?.classList.add('is-empty');
    if (img.complete) {
      if (!img.naturalWidth) mark();
    } else {
      img.addEventListener('error', mark, { once: true });
    }
  });


  /* --------------------------------------------------- hero signal field */
  const field = $('#signal');
  if (field && !REDUCE) {
    const ctx = field.getContext('2d');
    const GAP = 54;
    const REACH = 240;

    let w = 0, h = 0, nodes = [], live = true;
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
      requestAnimationFrame(draw);
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
    requestAnimationFrame(draw);
  }


  /* ---------------------------------------------------- magnetic controls */
  /* Rects are read in one pass and styles written in a second, so a frame
     never interleaves reads and writes and forces synchronous layout. */
  const magnets = $$('.btn, .icon-btn, .to-top');
  if (RICH && magnets.length) {
    const items = magnets.map((el) => ({ el, x: 0, y: 0, tx: 0, ty: 0 }));

    const tick = () => {
      requestAnimationFrame(tick);

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
    requestAnimationFrame(tick);
  }


  /* -------------------------------------------------------- hero 3D stage */
  const stage = $('#stage3d');
  const stageInner = stage && $('.stage3d-inner', stage);
  if (stageInner && RICH) {
    let rx = 0, ry = 0, tx = 0, ty = 0, inView = true;

    new IntersectionObserver((e) => { inView = e[0].isIntersecting; },
      { rootMargin: '140px' }).observe(stage);

    const spin = () => {
      requestAnimationFrame(spin);
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
    spin();
  }


  /* -------------------------------------------- project tilt and spotlight */
  /* Per card, and the loop only runs while a pointer is actually over one,
     so an idle Work screen costs nothing. */
  if (RICH) {
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

    if (REDUCE) {
      TALK.slice(-3).forEach(addTalk);
      REQS.forEach(addReq);
      FILES.forEach(addFile);
      setStep(6);
    } else {
      let started = false;
      new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && !started) {
          started = true;
          run();
        }
      }, { threshold: 0.25 }).observe(rail);
    }
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
