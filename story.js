/* story.js - Our Story page only. Loaded after rd.js.
   Scrolling itself is NATIVE (wheel, trackpad, touch, keys, scrollbar), so scrolling down and scrolling up always behave the same
   and never wait for a script. This file adds:
   - words that write themselves in (hero, headings, every chapter card)
   - chapter cards that pop up and stack like pages
   - the floating arrows + chapter rail: one interruptible eased glide
   Performance rules: positions are measured ONCE (on load / resize / font + image changes); the scroll loop is pure arithmetic on
   scrollY and only writes to the few elements that actually change (no layout reads, no CSS variables inherited by big subtrees). */
(() => {
  'use strict';
  const body = document.body, root = document.documentElement;
  if (!body.classList.contains('rd-about')) return;
  const $ = (s, c = document) => c.querySelector(s), $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const hasIO = 'IntersectionObserver' in window;
  root.classList.add('story-page');                                   // CSS: this page does not use the global smooth-scroll (the glide below is the only programmatic motion)

  /* a CSS cubic-bezier() as a function of time */
  const bez = (x1, y1, x2, y2) => {
    const cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx, cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by;
    const X = t => ((ax * t + bx) * t + cx) * t, Y = t => ((ay * t + by) * t + cy) * t, dX = t => (3 * ax * t + 2 * bx) * t + cx;
    return x => {
      let t = x;
      for (let i = 0; i < 8; i++) { const e = X(t) - x; if (Math.abs(e) < 1e-6) return Y(t); const d = dX(t); if (Math.abs(d) < 1e-6) break; t -= e / d; }
      let lo = 0, hi = 1; t = x;
      for (let i = 0; i < 24; i++) { const v = X(t); if (Math.abs(v - x) < 1e-6) break; v < x ? lo = t : hi = t; t = (lo + hi) / 2; }
      return Y(t);
    };
  };
  const glideEase = bez(.42, 0, .28, 1);                              // gentle start, soft landing
  const outCubic = t => 1 - Math.pow(1 - t, 3);

  /* split an element's text into words that can be animated; screen readers still get the whole sentence */
  const words = (el, cls, startAt = 0) => {
    const text = el.textContent.replace(/\s+/g, ' ').trim();
    const sr = document.createElement('span'); sr.className = 'sr-only'; sr.textContent = text;
    const vis = document.createElement('span'); vis.setAttribute('aria-hidden', 'true');
    const list = text.split(' ');
    vis.innerHTML = list.map((w, i) => `<span class="${cls}" style="--wi:${Math.round(i + startAt)}">${w}</span>`).join(' ');
    el.textContent = ''; el.append(sr, vis);
    return { text, list, vis };
  };

  /* ---------- 1. intro paragraphs: words rise out of a mask ---------- */
  let swOffset = 0;                                                   // the second paragraph starts while the first is still arriving
  $$('.sw').forEach(p => {
    const text = p.textContent.replace(/\s+/g, ' ').trim();
    const sr = document.createElement('span'); sr.className = 'sr-only'; sr.textContent = text;
    const vis = document.createElement('span'); vis.setAttribute('aria-hidden', 'true');
    const list = text.split(' '), off = swOffset;
    vis.innerHTML = list.map((w, i) => `<span class="w"><span style="--wi:${Math.round(i + off)}">${w}</span></span>`).join(' ');
    swOffset += list.length * .7;
    p.textContent = ''; p.append(sr, vis);
    requestAnimationFrame(() => requestAnimationFrame(() => p.classList.add('go')));
  });

  /* ---------- 2. section headings: the same mask rise, once, when they scroll into view ---------- */
  $$('main h2').forEach(h => {
    const text = h.textContent.replace(/\s+/g, ' ').trim();
    const sr = document.createElement('span'); sr.className = 'sr-only'; sr.textContent = text;
    const vis = document.createElement('span'); vis.setAttribute('aria-hidden', 'true');
    vis.innerHTML = text.split(' ').map((w, i) => `<span class="w"><span style="--wi:${i}">${w}</span></span>`).join(' ');
    h.textContent = ''; h.append(sr, vis); h.classList.add('wr');
  });
  const wrs = $$('.wr');
  if (RM || !hasIO) wrs.forEach(h => h.classList.add('go'));
  else {
    const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('go'); io.unobserve(e.target); } }), { threshold: .5 });
    wrs.forEach(h => io.observe(h));
    setTimeout(() => wrs.forEach(h => h.classList.add('go')), 6000);  // safety net
  }

  /* ---------- 3. statement: grey words ignite as you scroll (words only; geometry is cached) ---------- */
  const st = $('.statement .big-line');
  let stWords = [], stTop = 0, stH = 1, stLast = [];
  if (st) {
    const hot = new Set(['leaves.', 'milk.', 'hand']);
    const { list, vis } = words(st, 'sc-w');
    stWords = $$('.sc-w', vis);
    stWords.forEach((w, i) => { if (hot.has(list[i])) w.classList.add('hot'); });
    stLast = stWords.map(() => -1);
    if (RM) stWords.forEach(w => w.style.opacity = 1);
  }

  /* ---------- 4. chapter cards: words write themselves in; the card pops up and stacks like a page ---------- */
  const tl = $('.timeline');
  const mq = matchMedia('(min-width: 861px) and (min-height: 621px)');
  const lis = tl ? $$('li', tl) : [];
  const rail = $$('.tl-rail a');
  lis.forEach((li, i) => {
    const n = document.createElement('span'); n.className = 'num'; n.setAttribute('aria-hidden', 'true'); n.textContent = '0' + (i + 1);
    const dim = document.createElement('i'); dim.className = 'dim'; dim.setAttribute('aria-hidden', 'true');
    li.prepend(n); li.append(dim); li.style.setProperty('--k', i);       // --k = this card's step down the stack (CSS sticky offset)
    const h = $('.tl-copy h3', li), p = $('.tl-copy p', li);
    if (h) words(h, 'cw', 0);
    if (p) words(p, 'cw', 4);                                         // the paragraph starts a beat after the title
  });

  /* ---------- geometry: measured once, then the scroll loop is only arithmetic ---------- */
  const STEP = 14;                                                    // each card rests this much lower than the one before (the stacked-pages look)
  let on = false, sceneOn = false, scene = null, sceneTop = 0, vh = innerHeight, mx = 0, tlTop = 0, tlBot = 0, stackTop = 170;
  let nat = [], hh = [], stuck = [], restYs = [], stopsList = [];
  let heroA = $('.page-top > div:first-child'), heroB = $('.page-top .intro'), heroH = 1;
  const topOf = el => { let y = 0; for (let e = el; e; e = e.offsetParent) y += e.offsetTop; return y; };   // offset chain: ignores transforms, so a card mid-animation measures the same as one at rest

  const measure = () => {
    vh = innerHeight; mx = Math.max(0, root.scrollHeight - vh);
    heroH = Math.max(1, vh * .6);
    if (st) { stTop = topOf(st); stH = st.offsetHeight; }
    if (sceneOn && scene) {
      scene.layout(vh);
      sceneTop = topOf(scene.root);
      restYs = [];
    } else if (tl && lis.length) {
      if (on) {                                                       // sticky and scaled cards report their moved position, so read them in a neutral layout
        stackTop = parseFloat(getComputedStyle(lis[0]).top) || 170;
        tl.classList.add('measuring');
        nat = lis.map(li => topOf(li)); hh = lis.map(li => li.offsetHeight);
        tlTop = topOf(tl); tlBot = tlTop + tl.offsetHeight;
        tl.classList.remove('measuring');
        stuck = lis.map((_, i) => stackTop + i * STEP);
        restYs = lis.map((_, i) => clamp(Math.round(nat[i] - stuck[i]), 0, mx));
      } else restYs = lis.map(li => clamp(Math.round(topOf(li) - 140), 0, mx));
    }
    /* where the arrows can take you */
    const NAV_H = 96, secTop = el => el ? clamp(Math.round(topOf(el) - NAV_H), 0, mx) : null;
    const heritage = $('#heritage-title'), steps = $('.steps'), vows = $('#promises-title') || $('.vows'), mvv = $('#mvv-title'), ing = $('.ing-grid');
    const list = [{ y: 0, name: 'Top of page' }];
    const add = (y, name) => { if (y !== null) list.push({ y, name }); };
    const heritageSec = heritage && heritage.closest('section');
    /* first stop after the hero = the "A craft handed down" heading itself (with the promise card under it), so the arrow never skips it;
       the next stop is the chapter pills with the player standing ready */
    add(heritage ? clamp(Math.round(topOf(heritage) - NAV_H - 24), 0, mx) : secTop(heritageSec), 'A craft handed down');
    const railEl = $('.tl-rail');
    add(sceneOn && scene ? clamp(Math.round(topOf(scene.wrap) - 104), 0, mx) : (railEl ? clamp(Math.round(topOf(railEl) - NAV_H - 16), 0, mx) : null), 'Our story chapters');
    add(vows ? clamp(Math.round(topOf(vows) - NAV_H - 24), 0, mx) : null, 'Our promises');
    add(secTop(steps && steps.closest('section')), 'The brewing craft');
    add(secTop(mvv && mvv.closest('section')), 'Mission, vision and values');
    add(secTop(ing && ing.closest('section')), 'What goes in your cup');
    add(mx, 'The footer');
    stopsList = [];
    list.sort((a, b) => a.y - b.y).forEach(s => { const last = stopsList[stopsList.length - 1]; if (!last || s.y - last.y > 48) stopsList.push(s); });
  };

  /* ---------- the one scroll loop ---------- */
  const cache = { hero: -1, sc: [], dim: [], live: [], act: -2, wrote: [] };
  const setLive = (li, v) => { li.classList.toggle('live', v); $$('svg', li).forEach(sv => { if (sv.pauseAnimations) v ? sv.unpauseAnimations() : sv.pauseAnimations(); }); };
  const frame = () => {
    const y = scrollY;
    /* hero lifts away as the page moves on */
    if (!RM) {
      const hp = clamp(y / heroH, 0, 1), q = Math.round(hp * 200) / 200;
      if (q !== cache.hero) {
        cache.hero = q;
        if (heroA) { heroA.style.transform = `translate3d(0,${(-q * 46).toFixed(1)}px,0)`; heroA.style.opacity = (1 - q * .75).toFixed(3); }
        cue.style.visibility = q > .5 ? 'hidden' : '';
        if (heroB) { heroB.style.transform = `translate3d(0,${(-q * 24).toFixed(1)}px,0)`; heroB.style.opacity = Math.max(0, 1 - q * 1.1).toFixed(3); }
      }
    }
    /* statement words */
    if (stWords.length && !RM) {
      const top = stTop - y, p = clamp((vh * .88 - top) / (vh * .88 - vh * .3 + stH * .5), 0, 1), n = stWords.length;
      for (let i = 0; i < n; i++) {
        const v = Math.round((.18 + .82 * clamp(p * (n + 2) - i, 0, 1)) * 50) / 50;
        if (v !== stLast[i]) { stLast[i] = v; stWords[i].style.opacity = v; }
      }
    }
    /* pinned scene (desktop): one cup assembling, scrubbed by scroll */
    if (sceneOn && scene) {
      scene.update(y, sceneTop, vh);
      const act = scene.index;
      if (act !== cache.act) {
        cache.act = act; syncPlay();
        lis.forEach((li, i) => li.classList.toggle('is-active', i === act));
        rail.forEach(x => { const a = act >= 0 && lis[act] && x.dataset.ch === lis[act].id; x.classList.toggle('on', a); if (a) x.setAttribute('aria-current', 'true'); else x.removeAttribute('aria-current'); });
      }
    }
    /* stacked chapter cards (fallback when the scene is unavailable) */
    if (on && lis.length) {
      const tops = lis.map((_, i) => Math.min(Math.max(nat[i] - y, stuck[i]), tlBot - hh[i] - y));     // where each card is on screen right now (sticky arithmetic)
      const cover = lis.map((_, i) => i === lis.length - 1 ? 0 : clamp((stuck[i] + hh[i] - tops[i + 1]) / Math.max(1, hh[i] - STEP), 0, 1));
      let depth = 0, act = -1;
      for (let i = lis.length - 1; i >= 0; i--) {
        depth += cover[i];
        const enter = outCubic(clamp((vh - tops[i]) / (vh * .6), 0, 1));                               // the pop as the card rises into view
        const sc = Math.round((1 - .045 * depth) * (.9 + .1 * enter) * 2000) / 2000;
        const dm = Math.round(Math.min(.3, .09 * depth) * 100) / 100;
        const li = lis[i];
        if (sc !== cache.sc[i]) { cache.sc[i] = sc; li.style.scale = sc; }
        if (dm !== cache.dim[i]) { cache.dim[i] = dm; li.lastElementChild.style.opacity = dm; }
        const live = tops[i] < vh + 120 && tops[i] + hh[i] > -120 && cover[i] < .92;               // buried or far-off cards stop animating their artwork
        if (live !== cache.live[i]) { cache.live[i] = live; setLive(li, live); }
        if (!cache.wrote[i] && tops[i] < vh * .68) { cache.wrote[i] = true; li.classList.add('wrote'); }   // the words write themselves in once the card has risen
        if (tops[i] <= stuck[i] + vh * .18 && act < i) act = i;
      }
      if (act !== cache.act) {
        cache.act = act;
        lis.forEach((li, i) => li.classList.toggle('is-active', i === act));
        rail.forEach(x => { const a = act >= 0 && x.dataset.ch === lis[act].id; x.classList.toggle('on', a); if (a) x.setAttribute('aria-current', 'true'); else x.removeAttribute('aria-current'); });
      }
    }
    paintNav();
  };
  let ticking = false;
  const kick = () => { if (!ticking) { ticking = true; requestAnimationFrame(() => { ticking = false; frame(); }); } };

  const apply = () => {
    const sceneWant = !!tl && mq.matches && !RM && !!window.gsap && !!window.StoryScene;
    if (sceneWant !== sceneOn) {
      try {
        if (sceneWant) { scene = scene || window.StoryScene.create({ lis, tl, rail: $('.tl-rail') }); scene.mount(); tl.classList.add('has-scene'); sceneOn = true; wireControls(); }
        else { sceneOn = false; if (scene) scene.unmount(); tl.classList.remove('has-scene'); }
      } catch (err) { sceneOn = false; tl.classList.remove('has-scene'); if (scene) { try { scene.unmount(); } catch (e) {} } scene = null; if (window.console) console.warn('story scene unavailable, using stacked cards', err); }
      cache.act = -2;
    }
    const want = !!tl && mq.matches && !RM && !sceneOn;
    if (want !== on) {
      on = want; tl.classList.toggle('stack-on', on);
      if (!on) lis.forEach((li, i) => {
        li.style.removeProperty('scale'); li.lastElementChild.style.opacity = '';
        li.classList.remove('live'); li.classList.add('wrote');
        $$('svg', li).forEach(sv => sv.unpauseAnimations && sv.unpauseAnimations());
      });
      cache.sc = []; cache.dim = []; cache.live = []; cache.act = -2;
    }
    measure(); kick();
  };
  let measuring = 0;
  const remeasure = () => { if (!measuring) measuring = requestAnimationFrame(() => { measuring = 0; measure(); kick(); }); };
  mq.addEventListener ? mq.addEventListener('change', apply) : mq.addListener(apply);
  addEventListener('scroll', kick, { passive: true });
  addEventListener('resize', remeasure, { passive: true });
  addEventListener('load', remeasure);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(remeasure);
  if ('ResizeObserver' in window) { const ro = new ResizeObserver(remeasure); ro.observe($('main')); if (tl) ro.observe(tl); }
  if (RM) lis.forEach(li => li.classList.add('wrote'));
  /* safety net: a card must never stay blank */
  setTimeout(() => lis.forEach(li => { if (!on) li.classList.add('wrote'); }), 4000);

  /* ---------- 5. spotlight: cards glow where the pointer is (throttled to one write per frame) ---------- */
  let spotRaf = 0, spotEl = null, spotX = 0, spotY = 0;
  const spotWrite = () => { spotRaf = 0; if (!spotEl) return; const r = spotEl.getBoundingClientRect(); spotEl.style.setProperty('--mx', (spotX - r.left).toFixed(0) + 'px'); spotEl.style.setProperty('--my', (spotY - r.top).toFixed(0) + 'px'); };
  $$('.vows>div, .steps>div, .mvv-grid>.card, .values-grid>.card, .card.ing').forEach(c => {
    c.classList.add('spot');
    if (c.matches('.mvv-grid>.card:nth-child(2)')) c.classList.add('dark');
    if (RM) return;
    c.addEventListener('pointermove', e => {
      if (e.pointerType === 'touch') return;
      spotEl = c; spotX = e.clientX; spotY = e.clientY; if (!spotRaf) spotRaf = requestAnimationFrame(spotWrite);
    }, { passive: true });
  });

  /* ---------- a gentle scroll cue under the first screen ---------- */
  const heroBox = $('.page-top'), cue = document.createElement('button');
  cue.type = 'button'; cue.className = 'hero-cue'; cue.setAttribute('aria-label', 'Scroll to the story'); cue.innerHTML = '<i aria-hidden="true"></i><span>Scroll to explore</span>';
  if (heroBox) heroBox.append(cue);

  /* ---------- 6. the floating arrows + chapter rail: one eased glide that any real input interrupts ---------- */
  const nav = document.createElement('aside');
  nav.className = 'scrollnav'; nav.setAttribute('aria-label', 'Move between sections');
  const chev = d => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${d}"/></svg>`;
  nav.innerHTML = `<button type="button" class="sn sn-up" aria-label="Previous section" data-tip="">${chev('M6 15l6-6 6 6')}</button><button type="button" class="sn sn-down" aria-label="Next section" data-tip="">${chev('M6 9l6 6 6-6')}</button>`;
  body.append(nav);
  const up = $('.sn-up', nav), down = $('.sn-down', nav);

  let anim = 0, goal = null;
  const stopGlide = () => { if (anim) cancelAnimationFrame(anim); anim = 0; goal = null; root.classList.remove('gliding'); };
  const glide = (target, jump, done) => {                                   // jump = an explicit long skip (Home / End / a far chapter in the rail): capped at about 3 s
    const y1 = clamp(Math.round(target), 0, mx), y0 = scrollY, d = y1 - y0;
    if (Math.abs(d) < 2) { stopGlide(); if (done) done(); return; }
    if (RM) { stopGlide(); scrollTo({ top: y1, behavior: 'instant' }); if (done) done(); return; }
    if (anim) cancelAnimationFrame(anim);
    goal = y1; root.classList.add('gliding');                          // CSS: no hover work while the page is travelling
    const dur = clamp(520 + Math.abs(d) * .42, 700, 2200), t0 = performance.now();
    const f = now => {
      const p = clamp((now - t0) / dur, 0, 1);
      scrollTo({ top: y0 + d * glideEase(p), behavior: 'instant' });
      if (p < 1) anim = requestAnimationFrame(f); else { anim = 0; goal = null; root.classList.remove('gliding'); kick(); if (done) done(); }
    };
    anim = requestAnimationFrame(f);
  };

  /* ---------- moving between PAGE SECTIONS: the floating arrows, Home / End, the scroll cue ---------- */
  /* The page scroll never touches the story. The mouse wheel, the keyboard and touch just move the page; the story answers only to its own
     controls (play, the arrows inside the player, the chapter pills and dots, and the draggable timeline). */
  const sectionIndex = from => { let k = 0; stopsList.forEach((st, i) => { if (st.y <= from + 8) k = i; }); return k; };
  const navTarget = dir => {
    const from = goal !== null ? goal : scrollY, k = sectionIndex(from), here = stopsList[k];
    if (!here) return undefined;
    if (dir > 0) return stopsList[k + 1];
    if (from > here.y + 8) return here;                                            // part-way down a section: up goes to the top of that section
    return stopsList[k - 1];
  };
  const step = dir => { const t = navTarget(dir); if (t) glide(t.y, false); };
  up.addEventListener('click', () => { halt(); step(-1); }); down.addEventListener('click', () => { halt(); step(1); });
  cue.addEventListener('click', () => step(1));

  /* any real scroll input hands control straight back to the page (a running glide stops); the story keeps doing whatever the player is doing */
  addEventListener('wheel', stopGlide, { passive: true });
  addEventListener('touchstart', stopGlide, { passive: true });
  addEventListener('pointerdown', e => { if (anim && !(e.target.closest && e.target.closest('.scrollnav, .tl-rail, .sc-foot'))) stopGlide(); }, { passive: true });
  addEventListener('keydown', e => {
    if (e.altKey || e.ctrlKey || e.metaKey || (e.target.closest && e.target.closest('input,textarea,select,[contenteditable],[role=slider]'))) return;
    if (e.key === 'Home' || e.key === 'End') { e.preventDefault(); halt(); glide(e.key === 'Home' ? 0 : mx, true); return; }
    if (anim && /^(ArrowUp|ArrowDown|PageUp|PageDown| |Spacebar)$/.test(e.key)) stopGlide();
  });

  /* ---------- the story player: a clock per chapter drives the picture and the progress line together ---------- */
  const NCH = 5, DUR = [10000, 12000, 12000, 16000, 14000], BUILD = .7;     // chapter lengths (ms); the picture builds for the first 70%, then holds while you read
  let playing = false, run = null, runRaf = 0, wired = false;
  const sceneEl = () => scene && scene.root;
  const stopRun = () => { if (runRaf) cancelAnimationFrame(runRaf); runRaf = 0; run = null; };
  function halt() {
    const was = !!run || playing;
    stopRun(); playing = false;
    if (was) syncPlay();
  }
  function syncPlay() {
    const root_ = sceneEl(); if (!root_ || !scene) return;
    const b = root_.querySelector('.sc-play'), sk = root_.querySelector('.sc-down span'); if (!b) return;
    const atEnd = scene.fill >= .999;
    const running = !!run;
    b.classList.toggle('on', running); b.setAttribute('aria-pressed', String(running));
    b.querySelector('span').textContent = running ? 'Pause' : atEnd ? 'Replay story' : 'Watch the story';
    if (sk) sk.textContent = atEnd && !running ? 'Continue' : 'Skip story';
  }
  /* one chapter: t0/u0 = where the picture and the line start (so Pause -> Play carries on exactly where it stopped) */
  const runChapter = (i, t0, u0, chain) => {
    stopRun(); playing = !!chain;
    const D = DUR[i], v0 = clamp((t0 - i) / .98, 0, 1), remBuild = BUILD * D * (1 - v0), total = remBuild + (1 - BUILD) * D, T0 = performance.now();
    run = { i, chain }; syncPlay();
    const f = now => {
      const el = now - T0;
      const t = i + .98 * (remBuild > 0 ? v0 + (1 - v0) * clamp(el / remBuild, 0, 1) : 1);      // the picture builds, then holds at the finished state
      const u = u0 + (1 - u0) * clamp(el / total, 0, 1);                                         // the line moves steadily for the WHOLE chapter and arrives as it ends
      scene.drive(t, (i + u) / NCH);
      if (el < total) { runRaf = requestAnimationFrame(f); return; }
      runRaf = 0; run = null;
      scene.drive(t, (i + 1) / NCH);                                                             // lands on this chapter's node: it fills with a ring
      if (chain && i < NCH - 1) { runChapter(i + 1, i + 1, 0, true); return; }
      playing = false; syncPlay();
    };
    runRaf = requestAnimationFrame(f);
  };
  const startPlay = () => {
    if (!scene) return;
    if (scene.fill >= .999) { scene.drive(0, 0, true); runChapter(0, 0, 0, true); return; }          // play it again from the beginning
    const t = scene.t, i = Math.min(NCH - 1, Math.floor(t)), u0 = clamp(scene.fill * NCH - i, 0, 1);
    if (u0 >= .995) { runChapter(i + 1, i + 1, 0, true); return; }                                  // this chapter was already finished
    runChapter(i, Math.min(t, i + .98), u0, true);
  };
  /* a chapter pill, dot, < or >: an instant, clean jump to the START of that chapter (the picture is rebuilt from the timeline, so nothing from other steps lingers), then it builds */
  const playFrom = (i, keepChain) => {
    if (!scene || !sceneOn) return;
    const chain = keepChain && (playing || (!!run && run.chain));
    stopRun();
    scene.drive(i, i / NCH, true);
    runChapter(i, i, 0, chain);
  };
  const exitStory = dir => {                                                                       // Skip story / Continue / Back to top: scroll out at once, never play the rest
    halt();
    const target = dir > 0 ? (stopsList.find(x => x.name === 'Our promises') || {}).y : 0;
    if (target !== undefined) glide(target, false);
  };
  const currentChapter = () => (scene && scene.index >= 0) ? scene.index : clamp(Math.floor(scene ? scene.t : 0), 0, NCH - 1);

  /* dragging the timeline scrubs the story: the picture, the words and the line follow your pointer exactly */
  let scrubbing = false;
  const scrubTo = (clientX, trackEl) => {
    const r = trackEl.getBoundingClientRect();
    scene.scrub(clamp((clientX - r.left) / Math.max(1, r.width), 0, 1)); syncPlay();
  };
  function wireControls() {
    if (wired || !sceneEl()) return; wired = true;
    const rootEl = sceneEl(), trackEl = rootEl.querySelector('.sc-track');
    rootEl.addEventListener('click', e => {
      const b = e.target.closest('button'); if (!b || !rootEl.contains(b)) return;
      const keep = playing || (!!run && run.chain);
      if (b.classList.contains('sc-play')) { if (run) halt(); else startPlay(); return; }
      if (b.classList.contains('sc-prev')) { playFrom(Math.max(0, currentChapter() - 1), keep); return; }
      if (b.classList.contains('sc-next')) { const i = currentChapter(); if (i >= NCH - 1) exitStory(1); else playFrom(i + 1, keep); return; }
      if (b.classList.contains('sc-down')) { exitStory(1); return; }
      if (b.classList.contains('sc-up')) { exitStory(-1); return; }
      if (b.classList.contains('sc-dot')) { const i = +b.dataset.i; if (i >= 0) playFrom(i, keep); }
    });
    trackEl.addEventListener('pointerdown', e => {
      if (e.button !== undefined && e.button !== 0) return;
      halt(); scrubbing = true; rootEl.classList.add('is-scrubbing'); trackEl.setPointerCapture(e.pointerId); scrubTo(e.clientX, trackEl); e.preventDefault();
    });
    trackEl.addEventListener('pointermove', e => { if (scrubbing) scrubTo(e.clientX, trackEl); });
    const endScrub = e => { if (!scrubbing) return; scrubbing = false; rootEl.classList.remove('is-scrubbing'); try { trackEl.releasePointerCapture(e.pointerId); } catch (err) {} };
    trackEl.addEventListener('pointerup', endScrub); trackEl.addEventListener('pointercancel', endScrub);
    trackEl.addEventListener('keydown', e => {                                                    // the timeline also works from the keyboard
      const f = scene.fill, big = e.shiftKey ? .2 : .02;
      let to = null;
      if (e.key === 'ArrowRight' || e.key === 'ArrowUp') to = f + big; else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') to = f - big;
      else if (e.key === 'Home') to = 0; else if (e.key === 'End') to = 1;
      if (to === null) return;
      e.preventDefault(); e.stopPropagation(); halt(); scene.scrub(clamp(to, 0, 1)); syncPlay();
    });
    /* leaving the screen pauses the story so it never plays to nobody */
    if ('IntersectionObserver' in window) new IntersectionObserver(es => es.forEach(en => { if (!en.isIntersecting) halt(); }), { threshold: 0 }).observe(rootEl);
  }

  const nvState = { n: '', p: '' };
  function paintNav() {
    const n = navTarget(1), p = navTarget(-1), nk = n ? n.y + n.name : '', pk = p ? p.y + p.name : '';
    if (nk === nvState.n && pk === nvState.p) return;
    nvState.n = nk; nvState.p = pk;
    down.setAttribute('aria-disabled', String(!n)); up.setAttribute('aria-disabled', String(!p));
    down.dataset.tip = n ? n.name : ''; up.dataset.tip = p ? p.name : '';
    down.setAttribute('aria-label', n ? 'Next section: ' + n.name : 'Next section (end of page)');
    up.setAttribute('aria-label', p ? 'Previous section: ' + p.name : 'Previous section (top of page)');
  }

  /* chapter pills at the top: an instant jump to that chapter (with the cup scene), or a plain scroll on small screens */
  const railBox = $('.tl-rail');
  if (railBox) railBox.addEventListener('click', e => {
    const a = e.target.closest('a[data-ch]'); if (!a) return;
    e.preventDefault(); e.stopPropagation();
    const i = lis.findIndex(li => li.id === a.dataset.ch); if (i < 0) return;
    if (sceneOn && scene) { const keep = playing || (!!run && run.chain); playFrom(i, keep); return; }
    halt(); glide(restYs[i], Math.abs(restYs[i] - scrollY) > 1500);
  }, true);

  apply();
})();

/* ---------- 7. writing animation: card and section text is written out, letter by letter with a soft pen caret, the first time it scrolls into view ----------
   Covers the four vow tiles, the brewing steps, mission / vision, "What we value" and the ingredient cards. The headings, intro, promise statement and the
   chapter scene keep their own animations above. Layout never shifts (letters are only faded in), screen readers get the whole sentence at once,
   and reduced-motion visitors simply see the text. */
(() => {
  'use strict';
  if (!document.body.classList.contains('rd-about')) return;
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  if (matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) return;

  const split = el => {
    const text = el.textContent.replace(/\s+/g, ' ').trim();
    if (!text) return null;
    const sr = document.createElement('span'); sr.className = 'sr-only'; sr.textContent = text;
    const vis = document.createElement('span'); vis.setAttribute('aria-hidden', 'true');
    const chars = [];
    const list = text.split(' ');
    list.forEach((w, wi) => {
      const ws = document.createElement('span'); ws.className = 'wt-w';                // a word never breaks across lines while it is being written
      [...w].forEach(ch => { const c = document.createElement('span'); c.className = 'wt-c'; c.textContent = ch; ws.append(c); chars.push(c); });
      vis.append(ws); if (wi < list.length - 1) vis.append(' ');
    });
    el.textContent = ''; el.append(sr, vis);
    return chars;
  };

  const jobs = [];
  const add = (host, targets) => {
    const parts = targets.map(split).filter(Boolean);
    if (parts.length) jobs.push({ host, parts });
  };
  $$('.vows>div').forEach(h => add(h, $$(':scope>b, :scope>span:not(.ic3d)', h)));
  $$('.steps>div, .mvv-grid>.card, .values-grid>.card, .ing-grid>.card').forEach(h => add(h, $$(':scope>h3, :scope>p', h)));
  $$('.mvv-sub').forEach(h => add(h, [h]));
  if (!jobs.length) return;

  const write = (job, delay) => {
    const flat = [], times = [];
    const total = job.parts.reduce((n, p) => n + p.length, 0);
    const per = clamp(1900 / total, 9, 26);                                            // a whole card is written in roughly two seconds, short or long
    let t = delay;
    job.parts.forEach((chars, pi) => {
      if (pi) t += per * 7;                                                            // a beat between the title and its paragraph
      chars.forEach(c => {
        t += per * (.8 + Math.random() * .4);
        const ch = c.textContent;
        if (ch === '.') t += per * 5; else if (/[,:;!?]/.test(ch)) t += per * 2.5;
        flat.push(c); times.push(t);
      });
    });
    const caret = document.createElement('span'); caret.className = 'wt-caret'; caret.setAttribute('aria-hidden', 'true');
    let k = 0, lastK = -1;
    const t0 = performance.now();
    const tick = () => {
      const now = performance.now() - t0;
      while (k < flat.length && times[k] <= now) { flat[k].classList.add('on'); k++; }
      if (k !== lastK && k > 0) { flat[k - 1].after(caret); lastK = k; }
      if (k < flat.length) requestAnimationFrame(tick);
      else { caret.classList.add('off'); setTimeout(() => caret.remove(), 450); }
    };
    requestAnimationFrame(tick);
  };

  const byHost = new Map(jobs.map(j => [j.host, j]));
  const io = new IntersectionObserver(es => {
    let k = 0;
    es.forEach(e => {
      if (!e.isIntersecting) return;
      const job = byHost.get(e.target); io.unobserve(e.target); if (!job) return;
      write(job, 220 + Math.min(k++, 4) * 170);                                        // cards that arrive together are written one after another
    });
  }, { threshold: .35, rootMargin: '0px 0px -8% 0px' });
  jobs.forEach(j => io.observe(j.host));
})();
