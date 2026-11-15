/* Chatavatar: one script, a walking mascot, curated knowledge. */
(function () {
  'use strict';
  if (window.ChatAvatar) return;
  const script = document.currentScript;
  const BASE = new URL('.', script.src).href;
  const deps = new Map();
  function loadScript(url) {
    if (!deps.has(url)) deps.set(url, new Promise((resolve, reject) => { const s = document.createElement('script'); s.src = url; s.onload = resolve; s.onerror = () => reject(Error('Datei konnte nicht geladen werden: ' + url)); document.head.append(s); }));
    return deps.get(url);
  }
  const engineReady = window.ChatAvatarKnowledge ? Promise.resolve() : loadScript(BASE + 'knowledge-core.js');
  function el(tag, cls, text) { const n = document.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; return n; }
  const frames = { idle: [0], wave: [1, 0, 1, 1], talk: [2, 0, 2], point: [3], walk: [4, 5, 6, 7], jump: [8, 9, 10, 11], celebrate: [12], think: [13], held: [14], rest: [15] };
  class Mascot {
    constructor(options = {}) {
      this.options = options; this.x = Math.max(12, innerWidth - 190); this.y = 18; this.state = 'idle'; this.facing = 1; this.opened = false; this.paused = false; this.voice = false; this.hidden = false; this.destroyed = false; this.category = ''; this.timers = new Set(); this.stepAt = 0; this.frame = 0; this.nextWalk = performance.now() + 5500; this.nextHop = performance.now() + 22000; this.last = 0;
      this.motion = matchMedia('(prefers-reduced-motion: reduce)');
      this.onMotion = () => { this.paused = this.motion.matches; this.setState('idle'); this.render(); };
      this.motion.addEventListener('change', this.onMotion); this.paused = this.motion.matches;
      this.host = el('div'); this.host.id = options.id || 'chatavatar-widget'; this.shadow = this.host.attachShadow({ mode: 'open' });
      const css = el('link'); css.rel = 'stylesheet'; css.href = BASE + 'avatar.css'; this.shadow.append(css);
      this.character = el('button', 'character'); this.character.type = 'button'; this.character.setAttribute('aria-label', 'Vereinsheldin öffnen. Zum Versetzen ziehen.'); this.character.setAttribute('aria-expanded', 'false');
      this.sprite = el('span', 'sprite'); this.sprite.setAttribute('aria-hidden', 'true'); this.character.append(this.sprite);
      this.host.style.setProperty('--ca-sprite', 'url("' + BASE + 'assets/tva-heldin.png")');
      this.tip = el('button', 'tip'); this.tip.hidden = true;
      this.panel = el('section', 'panel'); this.panel.hidden = true; this.panel.setAttribute('role', 'region'); this.panel.setAttribute('aria-label', 'Antworten der Vereinsheldin');
      this.launcher = el('button', 'launcher', 'Heldin rufen'); this.launcher.hidden = true;
      this.shadow.append(this.tip, this.character, this.panel, this.launcher); document.body.append(this.host);
      this.tip.addEventListener('click', () => { this.open(); if (this.tipEntry) this.answer(this.tipEntry); });
      this.launcher.addEventListener('click', () => { this.hidden = false; this.launcher.hidden = true; this.character.hidden = false; this.open(); });
      this.onKey = e => { if (e.key === 'Escape' && this.opened) this.close(); };
      this.onResize = () => this.position(); this.onVisibility = () => { this.last = 0; };
      document.addEventListener('keydown', this.onKey); window.addEventListener('resize', this.onResize); document.addEventListener('visibilitychange', this.onVisibility);
      this.bindDrag(); this.position(); this.ready = this.init();
      this.tick = this.tick.bind(this); this.raf = requestAnimationFrame(this.tick);
    }
    later(fn, delay) { const id = setTimeout(() => { this.timers.delete(id); if (!this.destroyed) fn(); }, delay); this.timers.add(id); return id; }
    async init() {
      try {
        await engineReady; if (this.destroyed) return;
        const K = window.ChatAvatarKnowledge; let data = this.options.knowledge;
        if (!data) {
          if (location.protocol === 'file:' && !this.options.knowledgeUrl) {
            if (!window.ChatAvatarDefaultKnowledge) await loadScript(BASE + 'knowledge/tva.bundle.js');
            data = window.ChatAvatarDefaultKnowledge; this.offline = true;
          } else {
            const url = this.options.knowledgeUrl || BASE + 'knowledge/tva.json';
            const response = await fetch(url, { cache: 'no-cache', credentials: 'omit', signal: AbortSignal.timeout(12000) });
            if (!response.ok) throw Error('Wissensdaten nicht erreichbar (HTTP ' + response.status + ').');
            const raw = await response.text(); if (raw.length > K.MAX_BYTES) throw Error('Wissenspaket ist zu groß.'); data = JSON.parse(raw);
          }
        }
        if (this.destroyed) return;
        this.setKnowledge(data); this.later(() => this.showTip(), 1800); return this;
      } catch (err) {
        if (this.destroyed) return;
        this.character.hidden = true; this.tip.hidden = true;
        this.error = el('div', 'error'); this.error.append(el('strong', '', 'Wissensdaten fehlen'), el('p', '', err.message));
        const close = el('button', 'back', 'Schließen'); close.onclick = () => this.destroy(); this.error.append(close); this.shadow.append(this.error);
        this.host.dispatchEvent(new CustomEvent('chatavatar:error', { detail: { message: err.message }, bubbles: true }));
      }
    }
    setKnowledge(input) {
      this.pack = window.ChatAvatarKnowledge.validate(input); this.host.style.setProperty('--ca-blue', this.pack.avatar.color); this.category = ''; this.current = '';
      this.character.setAttribute('aria-label', this.pack.avatar.name + ' öffnen. Zum Versetzen ziehen.'); this.launcher.textContent = this.pack.avatar.name + ' rufen';
      if (this.error) { this.error.remove(); this.error = null; this.character.hidden = this.hidden; }
      this.render(); this.host.dispatchEvent(new CustomEvent('chatavatar:ready', { bubbles: true })); return this;
    }
    bindDrag() {
      this.character.addEventListener('pointerdown', e => {
        if (e.button !== 0) return;
        this.drag = { pointer: e.pointerId, startX: e.clientX, startY: e.clientY, x: this.x, y: this.y, moved: false }; this.character.setPointerCapture(e.pointerId);
      });
      this.character.addEventListener('pointermove', e => {
        if (!this.drag || e.pointerId !== this.drag.pointer) return;
        const dx = e.clientX - this.drag.startX, dy = e.clientY - this.drag.startY;
        if (Math.hypot(dx, dy) > 6) this.drag.moved = true;
        if (this.drag.moved) { this.setState('held'); this.tip.hidden = true; this.x = this.drag.x + dx; this.y = this.drag.y - dy; this.position(); }
      });
      const release = e => {
        if (!this.drag || e.pointerId !== this.drag.pointer) return;
        this.ignoreClick = this.drag.moved; this.drag = null; this.setState('idle'); this.nextWalk = performance.now() + 6000;
      };
      this.character.addEventListener('pointerup', release); this.character.addEventListener('pointercancel', release);
      this.character.addEventListener('click', () => { if (this.ignoreClick) { this.ignoreClick = false; return; } this.opened ? this.close() : this.open(); });
    }
    setState(state) { if (state !== this.state) { this.state = state; this.frame = 0; this.stepAt = 0; } this.character.dataset.state = state; this.drawFrame(); }
    drawFrame() {
      const sequence = frames[this.state] || frames.idle, index = this.motion.matches ? 0 : this.frame % sequence.length, f = sequence[index];
      this.sprite.style.backgroundPosition = ((f % 4) * 100 / 3) + '% ' + (Math.floor(f / 4) * 100 / 3) + '%';
      this.sprite.style.scale = this.facing + ' 1';
    }
    position() {
      const size = innerWidth <= 540 ? 120 : 148;
      this.x = Math.max(0, Math.min(Math.max(0, innerWidth - size), this.x)); this.y = Math.max(5, Math.min(Math.max(5, innerHeight - size), this.y));
      this.character.style.transform = 'translate(' + this.x + 'px,' + (-this.y) + 'px)'; this.character.style.bottom = '0';
      this.tip.style.left = Math.max(10, Math.min(innerWidth - (innerWidth <= 540 ? 220 : 246), this.x - 45)) + 'px';
      this.tip.style.bottom = Math.min(innerHeight - 110, this.y + size - 12) + 'px';
    }
    tick(now) {
      if (this.destroyed) return;
      const dt = Math.min(.05, this.last ? (now - this.last) / 1000 : 0); this.last = now;
      if (!document.hidden && !this.paused && !this.opened && !this.hidden && !this.drag && this.pack && !this.character.matches(':focus-visible')) {
        if (this.y > 18 && this.state !== 'jump') { this.y = Math.max(18, this.y - 210 * dt); this.position(); }
        if (this.state === 'jump') {
          const progress = Math.min(1, (now - this.hopStart) / 900);
          this.y = 18 + Math.sin(progress * Math.PI) * 65; this.frame = Math.min(3, Math.floor(progress * 4)); this.drawFrame(); this.position();
          if (progress >= 1) { this.setState('idle'); this.y = 18; this.nextWalk = now + 4000; }
        } else if (now > this.nextHop && this.state === 'idle') {
          this.hopStart = now; this.nextHop = now + 28000 + Math.random() * 22000; this.setState('jump');
        } else if (now > this.nextWalk) {
          if (this.state !== 'walk') { this.targetX = 10 + Math.random() * Math.max(0, innerWidth - 170); this.facing = this.targetX < this.x ? -1 : 1; this.setState('walk'); this.tip.hidden = true; }
          this.x += this.facing * dt * 43;
          if (Math.abs(this.x - this.targetX) < 4 || this.x < 1 || this.x > innerWidth - 125) { this.setState('idle'); this.nextWalk = now + 6500 + Math.random() * 7000; this.tipCount = (this.tipCount || 0) + 1; if (this.tipCount % 3 === 0) this.showTip(); }
          this.position();
        }
      }
      if (!document.hidden && this.state !== 'jump' && !this.motion.matches && now - this.stepAt > (this.state === 'walk' ? 125 : 480)) { this.frame++; this.stepAt = now; this.drawFrame(); }
      this.raf = requestAnimationFrame(this.tick);
    }
    showTip() {
      if (!this.pack || this.opened || this.hidden || this.drag || this.paused) return;
      const ids = this.pack.suggested, id = ids[(this.tipIndex || 0) % Math.max(1, ids.length)]; this.tipIndex = (this.tipIndex || 0) + 1;
      const e = this.pack.entries.find(e => e.id === id && window.ChatAvatarKnowledge.active(e)); if (!e) return;
      this.tipEntry = e.id; this.tip.replaceChildren(el('div', '', e.question), el('span', '', 'Anklicken · Ich helfe Ihnen →')); this.tip.hidden = false; this.setState('wave'); this.position();
      this.later(() => { this.tip.hidden = true; if (!this.opened && !this.drag) this.setState('idle'); }, 9000);
    }
    open() { if (!this.pack) return; this.hidden = false; this.character.hidden = false; this.launcher.hidden = true; this.opened = true; this.tip.hidden = true; this.panel.hidden = false; this.character.setAttribute('aria-expanded', 'true'); this.setState('wave'); this.render(); this.panel.querySelector('.close')?.focus({ preventScroll: true }); }
    close() { this.opened = false; this.panel.hidden = true; this.character.setAttribute('aria-expanded', 'false'); this.nextWalk = performance.now() + 5000; this.setState('idle'); this.character.focus({ preventScroll: true }); }
    minimize() { this.opened = false; this.hidden = true; this.panel.hidden = true; this.tip.hidden = true; this.character.hidden = true; this.launcher.hidden = false; this.character.setAttribute('aria-expanded', 'false'); this.launcher.focus(); }
    buttonFor(entry) {
      const b = el('button', 'choice'); b.type = 'button'; b.append(el('span', '', entry.question), el('span', 'arrow', '↗')); b.onclick = () => this.answer(entry.id); return b;
    }
    answer(id) { const entry = this.pack?.entries.find(e => e.id === id && window.ChatAvatarKnowledge.active(e)); if (!entry) return; this.current = id; this.render(); this.setState('talk'); this.speak(entry.answer); this.panel.querySelector('.answer-title')?.focus({ preventScroll: true }); this.host.dispatchEvent(new CustomEvent('chatavatar:answer', { detail: { id }, bubbles: true })); }
    speak(text) { if (!this.voice || !('speechSynthesis' in window)) return; speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(text); u.lang = 'de-DE'; u.rate = .98; speechSynthesis.speak(u); }
    render() {
      if (!this.pack) return;
      const K = window.ChatAvatarKnowledge, pack = this.pack; this.panel.replaceChildren();
      const head = el('header', 'head'), who = el('div', 'who'); who.append(el('strong', '', pack.avatar.name), el('small', '', pack.avatar.subtitle)); head.append(el('div', 'badge', pack.organization.shortName.slice(0, 4)), who);
      const minimize = el('button', 'icon', '−'); minimize.title = 'Figur ausblenden'; minimize.setAttribute('aria-label', 'Figur ausblenden'); minimize.onclick = () => this.minimize();
      const close = el('button', 'icon close', '×'); close.setAttribute('aria-label', 'Antwortfenster schließen'); close.onclick = () => this.close(); head.append(minimize, close);
      const body = el('div', 'body');
      if (this.offline) body.append(el('div', 'warning', 'Lokale Dateiversion. Online-Änderungen sind hier erst nach erneutem Download enthalten.'));
      const current = pack.entries.find(e => e.id === this.current && K.active(e));
      if (current) {
        const back = el('button', 'back', '← Alle Themen'); back.onclick = () => { this.current = ''; this.render(); this.panel.querySelector('input')?.focus(); }; body.append(back);
        const h = el('h2', 'answer-title', current.question); h.tabIndex = -1; body.append(h);
        const content = el('div', 'answer', current.answer); content.setAttribute('aria-live', 'polite'); body.append(content);
        if (K.stale(current)) body.append(el('p', 'warning', 'Prüfung fällig: Diese Information kann sich geändert haben. Bitte prüfen Sie die verlinkte Vereinsseite.'));
        const links = el('div', 'links'); for (const l of current.links) { const a = el('a', '', l.label + ' ↗'); a.href = l.url; a.target = '_blank'; a.rel = 'noopener noreferrer'; links.append(a); } body.append(links);
        const source = el('div', 'source', current.verifiedAt ? 'Geprüft: ' + current.verifiedAt.split('-').reverse().join('.') + ' · ' : 'Noch ohne Prüfdatum · ');
        if (current.sourceUrl) { const a = el('a', '', 'Quelle ansehen'); a.href = current.sourceUrl; a.target = '_blank'; a.rel = 'noopener noreferrer'; source.append(a); } else source.append('Vom Betreiber hinterlegt'); body.append(source);
        const follow = current.suggestions.map(id => pack.entries.find(e => e.id === id && K.active(e))).filter(Boolean);
        if (follow.length) { body.append(el('p', 'eyebrow', 'Das könnte Sie auch interessieren')); const choices = el('div', 'choices'); follow.forEach(e => choices.append(this.buttonFor(e))); body.append(choices); }
      } else {
        body.append(el('p', 'greeting', pack.organization.greeting)); const cats = el('div', 'cats');
        const all = [{ id: '', label: 'Alle Themen', icon: '✦' }, ...pack.categories];
        for (const c of all) { if (c.id && !pack.entries.some(e => e.category === c.id && K.active(e))) continue; const b = el('button', 'cat', c.icon + ' ' + c.label); b.setAttribute('aria-pressed', String(this.category === c.id)); b.onclick = () => { this.category = c.id; this.render(); }; cats.append(b); } body.append(cats);
        const form = el('form', 'search'), input = el('input'); input.type = 'search'; input.placeholder = 'Thema suchen, z. B. Kinderkurse'; input.setAttribute('aria-label', 'Hinterlegtes Wissen durchsuchen'); input.maxLength = 200; const go = el('button', '', '→'); go.type = 'submit'; go.setAttribute('aria-label', 'Suchen'); form.append(input, go); body.append(form);
        const title = el('p', 'eyebrow', this.category ? 'Passende Antworten' : 'Wie kann ich helfen?'), choices = el('div', 'choices'); body.append(title, choices);
        const draw = query => { choices.replaceChildren(); let entries = !query && !this.category ? pack.suggested.map(id => pack.entries.find(e => e.id === id && K.active(e))).filter(Boolean) : K.search(pack, query, { category: this.category, limit: 20 }); if (!entries.length && !query) entries = K.search(pack, '', { category: this.category, limit: 12 }); entries.forEach(e => choices.append(this.buttonFor(e))); if (!entries.length) choices.append(el('p', 'empty', pack.organization.fallback)); title.textContent = query ? 'Gefundene Themen · ' + entries.length : this.category ? 'Passende Antworten' : 'Wie kann ich helfen?'; };
        form.onsubmit = e => { e.preventDefault(); draw(input.value); }; input.oninput = () => draw(input.value); draw('');
      }
      const foot = el('footer', 'foot'); foot.append(el('span', '', '✦ Hinterlegtes Vereinswissen'));
      const voice = el('button', '', this.voice ? 'Ton an' : 'Vorlesen'); voice.setAttribute('aria-label', 'Vorlesen ' + (this.voice ? 'ausschalten' : 'einschalten')); voice.setAttribute('aria-pressed', String(this.voice)); voice.disabled = !('speechSynthesis' in window); voice.onclick = () => { this.voice = !this.voice; if (!this.voice && 'speechSynthesis' in window) speechSynthesis.cancel(); if (this.voice && current) this.speak(current.answer); this.render(); };
      const pause = el('button', '', this.paused ? 'Weiterlaufen' : 'Pause'); pause.setAttribute('aria-pressed', String(this.paused)); pause.onclick = () => { this.paused = !this.paused; this.setState('idle'); this.nextWalk = performance.now() + 3000; this.render(); }; foot.append(voice, pause); this.panel.append(head, body, foot);
    }
    destroy() { this.destroyed = true; cancelAnimationFrame(this.raf); this.timers.forEach(clearTimeout); document.removeEventListener('keydown', this.onKey); window.removeEventListener('resize', this.onResize); document.removeEventListener('visibilitychange', this.onVisibility); this.motion.removeEventListener('change', this.onMotion); if (this.voice && 'speechSynthesis' in window) speechSynthesis.cancel(); this.host.remove(); }
  }
  window.ChatAvatar = { create: options => new Mascot(options), baseUrl: BASE, instance: null, ready: engineReady };
  const auto = () => { if (script.dataset.manual !== 'true') window.ChatAvatar.instance = new Mascot({ knowledgeUrl: script.dataset.knowledge || undefined }); };
  if (document.body) auto(); else document.addEventListener('DOMContentLoaded', auto, { once: true });
})();
