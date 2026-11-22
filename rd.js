/* rd.js - Our Story, Menu and Contact only. Loaded after main.js. Home never loads this file. */
(() => {
  'use strict';
  const $ = (s, c = document) => c.querySelector(s), $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const EASE = 'cubic-bezier(0.22, 1, 0.36, 1)';
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const body = document.body;

  /* ---------- headline: words rise out of a mask, once ---------- */
  $$('.rd-split').forEach(h => {
    const text = h.textContent.trim();
    h.setAttribute('aria-label', text);
    h.innerHTML = text.split(/\s+/).map((w, i) => `<span class="w" aria-hidden="true"><span style="--wi:${i}">${w}</span></span>`).join(' ');
    requestAnimationFrame(() => h.classList.add('rd-ready'));
  });

  /* ---------- story timeline: the line fills as you scroll, the chapter in view lights up, the rail jumps between chapters ---------- */
  const tline = $('.timeline');
  if (tline) {
    const items = $$('li', tline), rail = $$('.tl-rail a');
    let ticking = false;
    const update = () => {
      ticking = false;
      if (tline.classList.contains('stack-on') || tline.classList.contains('has-scene')) return;
      const vh = innerHeight, mid = vh * .55;
      let act = null, best = 1e9;
      items.forEach(li => {
        const b = li.getBoundingClientRect(), d = Math.abs(b.top + b.height / 2 - mid);
        if (b.top < vh && b.bottom > 0 && d < best) { best = d; act = li; }
      });
      items.forEach(li => li.classList.toggle('is-active', li === act));
      rail.forEach(x => { const on = !!act && x.dataset.ch === act.id; x.classList.toggle('on', on); if (on) x.setAttribute('aria-current', 'true'); else x.removeAttribute('aria-current'); });
    };
    const tick = () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } };
    addEventListener('scroll', tick, { passive: true }); addEventListener('resize', tick); update();
    rail.forEach(x => x.addEventListener('click', e => {
      e.preventDefault(); const t = document.getElementById(x.dataset.ch);
      if (t) scrollTo({ top: t.getBoundingClientRect().top + scrollY + t.offsetHeight / 2 - innerHeight * .55, behavior: RM ? 'auto' : 'smooth' });   // centre the chapter on the reading line
    }));
  }

  /* ---------- scroll reveal: whatever enters together cascades 0, 90, 180ms... ---------- */
  const revealers = () => $$('[data-rv]:not(.in)');
  if (RM || !('IntersectionObserver' in window)) {
    revealers().forEach(el => el.classList.add('in'));
  } else {
    const io = new IntersectionObserver(es => {
      let k = 0;
      es.forEach(e => {
        if (!e.isIntersecting) return;
        e.target.style.setProperty('--rv', Math.min(k++, 6));
        e.target.classList.add('in');
        io.unobserve(e.target);
      });
    }, { threshold: .12, rootMargin: '0px 0px -6% 0px' });
    revealers().forEach(el => io.observe(el));
    window.__rdReveal = el => io.observe(el);   // used by the menu once its cards exist
  }

  /* ==========================================================================
     OUR STORY: the timeline line draws itself as you scroll
     ========================================================================== */
  const tl = $('.timeline');
  if (tl) {
    const lis = $$('li', tl);
    let railTop = 0, railH = 1, dots = [], target = 0, cur = 0, raf = 0, near = false;
    const head = document.createElement('span'); head.className = 'tl-head'; head.setAttribute('aria-hidden', 'true'); tl.append(head);   // a small glowing bead rides the leading edge of the line
    const rem = () => parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
    const measure = () => {
      railTop = rem() * .6; railH = Math.max(1, tl.offsetHeight - rem() * 1.2);
      dots = lis.map(li => li.offsetTop + rem() * 1.55 + 8);          // vertical centre of each node, from the top of the list
    };
    const paint = () => {
      tl.style.setProperty('--p', cur.toFixed(4));
      const y = railTop + cur * railH;
      lis.forEach((li, i) => li.classList.toggle('lit', y >= dots[i] - 2));
      head.style.transform = `translateY(${y.toFixed(1)}px)`; head.classList.toggle('on', cur > .004 && cur < .996);
    };
    const aim = () => {
      const r = tl.getBoundingClientRect();
      target = clamp((innerHeight * .62 - (r.top + railTop)) / railH, 0, 1);
    };
    const tick = () => {
      raf = 0;
      if (tl.classList.contains('stack-on') || tl.classList.contains('has-scene')) return;
      aim();
      cur += (target - cur) * .1;                                  // a softer follow, so the line seems to pour down the track
      if (Math.abs(target - cur) < .0005) cur = target;
      paint();
      if (near && cur !== target) raf = requestAnimationFrame(tick);
    };
    const kick = () => { if (!raf) raf = requestAnimationFrame(tick); };
    measure();
    if (RM) { cur = target = 1; lis.forEach(li => li.classList.add('lit')); tl.style.setProperty('--p', 1); }
    else {
      new IntersectionObserver(([e]) => { near = e.isIntersecting; if (near) { measure(); kick(); } }, { rootMargin: '30% 0px 30% 0px' }).observe(tl);
      addEventListener('scroll', () => { if (near) kick(); }, { passive: true });
      addEventListener('resize', () => { measure(); kick(); }, { passive: true });
      if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { measure(); kick(); });
      if ('ResizeObserver' in window) new ResizeObserver(() => { measure(); kick(); }).observe(tl);
      aim(); cur = target; paint();
    }
  }

  /* ==========================================================================
     OUR STORY (round 2): typewriter intro, animated visuals, floating section arrows
     ========================================================================== */
  if (body.classList.contains('rd-about')) {

    /* ---------- typewriter: the two intro paragraphs are written out quickly, letter by letter ---------- */
    const paras = $$('.tw');
    if (paras.length) {
      const runs = paras.map(p => {
        const text = p.textContent.replace(/\s+/g, ' ').trim();
        p.textContent = '';
        const sr = document.createElement('span'); sr.className = 'sr'; sr.textContent = text;   // screen readers get the whole sentence at once
        const vis = document.createElement('span'); vis.setAttribute('aria-hidden', 'true');
        const chars = [];
        text.split(' ').forEach((w, wi, all) => {
          const ws = document.createElement('span'); ws.className = 'tw-w';                      // a word never breaks across lines while it is being typed
          [...w].forEach(ch => { const c = document.createElement('span'); c.className = 'tw-c'; c.textContent = ch; ws.append(c); chars.push(c); });
          vis.append(ws); if (wi < all.length - 1) vis.append(' ');
        });
        p.append(sr, vis);
        /* ~8-12ms per character (spaces included) with only the faintest beat at a full stop: the whole intro is written in roughly four seconds */
        const times = []; let t = 0;
        chars.forEach(c => {
          t += 8 + Math.random() * 4; times.push(t);
          if (!c.nextSibling) t += 8 + Math.random() * 4;                                        // the space after a word
          if (/[.:?!]/.test(c.textContent)) t += 40;
        });
        const caret = document.createElement('span'); caret.className = 'tw-caret'; caret.setAttribute('aria-hidden', 'true');
        return { vis, chars, times, caret, k: 0 };
      });
      const showAll = r => { r.chars.forEach(c => c.classList.add('on')); r.caret.remove(); r.k = r.chars.length; };
      let skipped = false;
      const play = (r, done) => {
        const t0 = performance.now();
        const tick = () => {
          if (skipped) { showAll(r); return done(); }
          const el = performance.now() - t0;
          while (r.k < r.chars.length && r.times[r.k] <= el) r.chars[r.k++].classList.add('on');
          if (r.k < r.chars.length) { r.chars[r.k].before(r.caret); requestAnimationFrame(tick); }
          else { r.chars[r.chars.length - 1].after(r.caret); r.caret.classList.add('out'); setTimeout(() => r.caret.remove(), 600); done(); }   // the caret fades out cleanly
        };
        requestAnimationFrame(tick);
      };
      if (RM) runs.forEach(showAll);
      else {
        runs.forEach(r => r.vis.addEventListener('click', () => { skipped = true; runs.forEach(showAll); }));   // a click finishes the writing at once
        const chain = i => { if (i < runs.length && !skipped) play(runs[i], () => setTimeout(() => chain(i + 1), 160)); };
        setTimeout(() => chain(0), 450);                                                                        // right behind the headline
      }
    }

    /* ---------- animated visuals only run while they are on screen ---------- */
    const motion = $$('.tl-art, .ic3d');
    if (RM) $$('animateMotion').forEach(a => a.remove());
    if ('IntersectionObserver' in window && !RM) {
      const vio = new IntersectionObserver(es => es.forEach(e => {
        e.target.classList.toggle('on', e.isIntersecting);
        $$('svg', e.target).forEach(sv => { if (sv.pauseAnimations) e.isIntersecting ? sv.unpauseAnimations() : sv.pauseAnimations(); });
      }), { rootMargin: '120px 0px' });
      motion.forEach(m => vio.observe(m));
    } else motion.forEach(m => m.classList.add('on'));

    /* ---------- badge tilt: the circular visuals lean towards the pointer, art and disc drifting at different depths ---------- */
    if (!RM) $$('.timeline li').forEach(li => {
      const art = $('.tl-art', li); if (!art) return;
      li.addEventListener('pointermove', e => {
        if (e.pointerType === 'touch') return;
        const r = art.getBoundingClientRect();
        art.style.setProperty('--tx', clamp((e.clientX - (r.left + r.width / 2)) / (r.width * 1.6), -1, 1).toFixed(3));
        art.style.setProperty('--ty', clamp((e.clientY - (r.top + r.height / 2)) / (r.height * 1.6), -1, 1).toFixed(3));
      }, { passive: true });
      li.addEventListener('pointerleave', () => { art.style.setProperty('--tx', 0); art.style.setProperty('--ty', 0); });
    });

    /* Scrolling on the Our Story page is native (wheel, trackpad, touch, keys, scrollbar). The floating arrows, the chapter rail and the
       scroll-linked motion all live in story.js, which reads cached positions instead of the layout on every frame. */
  }

  /* ==========================================================================
     MENU: category tabs with animated layout, hover cards, quick view
     ========================================================================== */
  const grid = $('#menuGrid');
  if (grid) {
    const M = window.BobaMenu;
    if (!M) return;
    const D = M.drinks, ORDER = M.display;

    /* which tab each drink lives under: edit here to move a drink */
    const CAT_OF = {
      brownsugar: 'Milk Teas', classic: 'Milk Teas', hojicha: 'Milk Teas',
      taro: 'Specialty Clouds', strawberry: 'Specialty Clouds',
      peach: 'Fruit Teas', mango: 'Fruit Teas',
      jasmine: 'Fresh Brews', matcha: 'Fresh Brews'
    };
    const TABS = ['All', 'Milk Teas', 'Specialty Clouds', 'Fruit Teas', 'Fresh Brews'];
    /* quick-view options. Sugar values match the contact form exactly. Toppings are not priced in the order total. */
    const ICE = ['Regular ice', 'Less ice', 'No ice'];
    const SUGAR = [['0%', '0% (No sugar)'], ['25%', '25% (Quarter sugar)'], ['50%', '50% (Half sugar)'], ['75%', '75% (Less sweet)'], ['100%', '100% (Normal)']];
    const TOPS = ['Extra pearls', 'Coconut jelly', 'Grass jelly', 'Pudding'];

    const money = n => 'S$' + n.toFixed(2);
    const fb = src => (typeof IMG_FB !== 'undefined') ? IMG_FB[String(src).split('/').pop().replace(/\.\w+$/, '')] : undefined;
    const fixImg = im => im.addEventListener('error', () => { const f = fb(im.getAttribute('src')); if (f) im.src = f; }, { once: true });
    const tagsHTML = d => `${d.pb ? '<span class="pb">Plant-based</span>' : ''}${d.tags.map(t => `<span>${t}</span>`).join('')}`;

    /* --- cards: the 9 drink cards are written in products.html; they are enhanced here --- */
    $$('.dcard', grid).forEach(a => fixImg($('img', a)));
    const cards = [...grid.children];
    if (window.__rdReveal) cards.forEach(c => window.__rdReveal(c));

    /* --- tabs: counts, sliding pill, FLIP layout transition --- */
    const tabs = $('.tabs'), pill = $('.tab-pill'), btns = $$('button', tabs), countEl = $('#menuCount');
    btns.forEach(b => {
      const n = b.dataset.f === 'All' ? cards.length : cards.filter(c => c.dataset.cat === b.dataset.f).length;
      b.insertAdjacentHTML('beforeend', `<span class="n">${n}</span>`);
    });
    const movePill = b => { pill.style.setProperty('--x', b.offsetLeft + 'px'); pill.style.setProperty('--w', b.offsetWidth + 'px'); };
    const activeBtn = () => btns.find(b => b.getAttribute('aria-pressed') === 'true');
    movePill(activeBtn());
    requestAnimationFrame(() => requestAnimationFrame(() => pill.classList.add('go')));
    addEventListener('resize', () => movePill(activeBtn()), { passive: true });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => movePill(activeBtn()));
    const say = n => { countEl.textContent = `${n} ${n === 1 ? 'drink' : 'drinks'}`; };
    say(cards.length);

    let token = 0, current = 'All';
    const keep = (c, cat) => cat === 'All' || c.dataset.cat === cat;
    function applyFilter(cat) {
      if (cat === current) return;
      current = cat;
      const my = ++token;
      cards.forEach(c => { c.getAnimations().forEach(a => a.cancel()); c.classList.add('in'); });
      const before = cards.filter(c => !c.hidden);
      const out = before.filter(c => !keep(c, cat)), stay = before.filter(c => keep(c, cat)), enter = cards.filter(c => c.hidden && keep(c, cat));
      say(cards.filter(c => keep(c, cat)).length);
      if (RM) { cards.forEach(c => { c.hidden = !keep(c, cat); }); return; }

      const h0 = grid.offsetHeight;
      const leaving = out.map(c => c.animate(
        [{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'translateY(10px) scale(.96)' }],
        { duration: 280, easing: EASE, fill: 'forwards' }
      ).finished.catch(() => { }));
      Promise.all(leaving).then(() => {
        if (my !== token) return;
        const first = new Map(stay.map(c => [c, c.getBoundingClientRect()]));
        grid.style.transition = 'none'; grid.style.height = h0 + 'px';
        out.forEach(c => { c.hidden = true; c.getAnimations().forEach(a => a.cancel()); });
        enter.forEach(c => { c.hidden = false; });
        grid.style.height = 'auto'; const h1 = grid.offsetHeight; grid.style.height = h0 + 'px';
        stay.forEach(c => {                                                  // FLIP: glide from the old spot to the new one
          const f = first.get(c), l = c.getBoundingClientRect(), dx = f.left - l.left, dy = f.top - l.top;
          if (dx || dy) c.animate([{ transform: `translate(${dx}px,${dy}px)` }, { transform: 'none' }], { duration: 760, easing: EASE });
        });
        enter.forEach((c, i) => c.animate(
          [{ opacity: 0, transform: 'translateY(20px) scale(.95)' }, { opacity: 1, transform: 'none' }],
          { duration: 780, delay: 140 + i * 70, easing: EASE, fill: 'backwards' }
        ));
        void grid.offsetHeight;
        grid.style.transition = `height .76s ${EASE}`;
        requestAnimationFrame(() => { grid.style.height = h1 + 'px'; });
        setTimeout(() => { if (my === token) { grid.style.height = ''; grid.style.transition = ''; } }, 840);
      });
    }
    btns.forEach(b => b.addEventListener('click', () => {
      btns.forEach(x => x.setAttribute('aria-pressed', x === b));
      movePill(b);
      b.scrollIntoView({ inline: 'center', block: 'nearest', behavior: RM ? 'auto' : 'smooth' });
      applyFilter(b.dataset.f);
    }));

    /* --- quick view dialog --- */
    const dlg = document.createElement('dialog');
    dlg.className = 'qv'; dlg.setAttribute('aria-labelledby', 'qvTitle');
    dlg.innerHTML = `<div class="qv-card"><div class="qv-pic"><img alt="" width="1254" height="1254"></div>
<div class="qv-body"><button class="qv-x" type="button" aria-label="Close quick view"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg></button>
<div class="dtags" id="qvTags"></div><h2 id="qvTitle"></h2><p class="qv-price" id="qvPrice"></p><p class="qv-desc" id="qvDesc"></p>
<fieldset class="qv-set"><legend>Ice</legend><div class="chips" id="qvIce" role="radiogroup" aria-label="Ice level"></div></fieldset>
<fieldset class="qv-set"><legend>Sugar</legend><div class="chips" id="qvSugar" role="radiogroup" aria-label="Sugar level"></div><p class="qv-hint" id="qvHint" aria-live="polite"></p></fieldset>
<fieldset class="qv-set"><legend>Toppings</legend><div class="chips" id="qvTop"></div></fieldset>
<p class="qv-sum" id="qvSum" aria-live="polite"></p>
<div class="qv-act"><a class="btn" id="qvOrder" href="contactus.html">Order this cup</a></div></div></div>`;
    document.body.append(dlg);
    fixImg($('.qv-pic img', dlg));

    const prefs = {}, pref = k => prefs[k] || (prefs[k] = { ice: ICE[0], sugar: SUGAR[4][1], top: [] });
    let curKey = null, lastFocus = null;
    const chip = (type, name, value, label, on) => `<label class="chip"><input type="${type}" name="${name}" value="${value}"${on ? ' checked' : ''}><span>${label}</span></label>`;
    const sync = () => {
      const d = D[curKey], p = pref(curKey), s = SUGAR.find(x => x[1] === p.sugar);
      $('#qvHint').textContent = (/\((.*)\)/.exec(p.sugar) || [])[1] || '';
      $('#qvSum').textContent = [p.ice, s[0] + ' sugar', ...p.top].join(', ');
      const u = new URLSearchParams({ drink: d.n, ice: p.ice, sugar: p.sugar }); if (p.top.length) u.set('top', p.top.join(', '));
      $('#qvOrder').href = 'contactus.html?' + u.toString();
    };
    const fill = () => {
      const d = D[curKey], p = pref(curKey), im = $('.qv-pic img', dlg);
      im.src = d.images[0].src; im.alt = d.images[0].alt || `${d.n}: iced drink in a tall glass`;
      $('#qvTags').innerHTML = tagsHTML(d); $('#qvTitle').textContent = d.n; $('#qvPrice').textContent = money(d.p); $('#qvDesc').textContent = d.d;
      $('#qvIce').innerHTML = ICE.map(v => chip('radio', 'qv-ice', v, v, v === p.ice)).join('');
      $('#qvSugar').innerHTML = SUGAR.map(([s, v]) => chip('radio', 'qv-sugar', v, s, v === p.sugar)).join('');
      $('#qvTop').innerHTML = TOPS.map(v => chip('checkbox', 'qv-top', v, v, p.top.includes(v))).join('');
      sync();
    };
    dlg.addEventListener('change', e => {
      const p = pref(curKey), t = e.target;
      if (t.name === 'qv-ice') p.ice = t.value;
      else if (t.name === 'qv-sugar') p.sugar = t.value;
      else if (t.name === 'qv-top') p.top = $$('input[name="qv-top"]:checked', dlg).map(i => i.value);
      sync();
    });
    const lock = on => {
      if (on) { const sb = innerWidth - document.documentElement.clientWidth; body.classList.add('qv-lock'); if (sb > 0) body.style.paddingRight = sb + 'px'; }
      else { body.classList.remove('qv-lock'); body.style.paddingRight = ''; }
    };
    const openQV = (k, opener) => {
      curKey = k; lastFocus = opener; fill(); dlg.classList.remove('closing'); lock(true);
      if (typeof dlg.showModal === 'function') dlg.showModal(); else dlg.setAttribute('open', '');
    };
    const closeQV = () => {
      if (!dlg.open || dlg.classList.contains('closing')) return;
      const done = () => { dlg.close(); dlg.classList.remove('closing'); lock(false); if (lastFocus) lastFocus.focus({ preventScroll: true }); };
      if (RM) return done();
      dlg.classList.add('closing'); setTimeout(done, 320);
    };
    $('.qv-x', dlg).addEventListener('click', closeQV);
    dlg.addEventListener('cancel', e => { e.preventDefault(); closeQV(); });
    dlg.addEventListener('click', e => { if (e.target === dlg) closeQV(); });
    grid.addEventListener('click', e => {
      if (e.target.closest('a')) return;                                   // links (Order / Quick order) navigate as normal
      const b = e.target.closest('[data-qv], .dpic'); if (!b) return;      // the Customise buttons, or a tap anywhere on the photo
      openQV(b.closest('.dcard').dataset.key, b);
    });
    /* a warm spotlight follows the pointer around the card's edge */
    grid.addEventListener('pointermove', e => {
      const c = e.target.closest('.dcard'); if (!c) return;
      const r = c.getBoundingClientRect();
      c.style.setProperty('--mx', (e.clientX - r.left) + 'px'); c.style.setProperty('--my', (e.clientY - r.top) + 'px');
    }, { passive: true });
  }

  /* ==========================================================================
     CONTACT: open status, tactile send button, drink options arriving from the menu
     ========================================================================== */
  const form = $('#mailform');
  if (form) {
    /* opening hours are daily 11am to 10pm, Singapore time */
    const st = $('#openStatus');
    if (st) {
      const hr = +new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Singapore', hour: 'numeric', hour12: false }).format(new Date()) % 24;
      const open = hr >= 11 && hr < 22;
      st.classList.toggle('open', open);
      st.textContent = open ? 'Open now, until 10pm' : 'Closed now, opens 11am';
    }

    const btn = $('button[type="submit"]', form);
    if (btn) {
      btn.addEventListener('pointerdown', e => {
        if (RM) return;
        const r = btn.getBoundingClientRect(), s = Math.max(r.width, r.height) * 2;
        const rip = document.createElement('span'); rip.className = 'rip';
        rip.style.cssText = `width:${s}px;height:${s}px;left:${e.clientX - r.left - s / 2}px;top:${e.clientY - r.top - s / 2}px`;
        btn.append(rip); rip.addEventListener('animationend', () => rip.remove());
      });
      let t = 0;
      form.addEventListener('submit', () => {                          // only fires once the form is valid
        btn.classList.add('sent'); clearTimeout(t); t = setTimeout(() => btn.classList.remove('sent'), 2400);
      });
    }

    /* the menu's quick view sends the sugar level along; it is selected here (ice and toppings become that drink's note in main.js) */
    const q = new URLSearchParams(location.search);
    if (q.get('drink')) {
      const sugar = q.get('sugar');
      if (sugar) { const r = $$('#sugarAll input[name="sugar"]', form).find(i => i.value === sugar); if (r) r.checked = true; }
    }
  }
})();
