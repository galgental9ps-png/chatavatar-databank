'use strict';
(async function () {
  const instance = ChatAvatar.create(); window.tavi = instance; await instance.ready;
  if (!instance.pack) return;
  const pack = instance.pack, K = ChatAvatarKnowledge;
  document.getElementById('entry-count').textContent = pack.entries.filter(e => K.active(e)).length;
  document.getElementById('source-count').textContent = new Set(pack.entries.map(e => e.sourceUrl).filter(Boolean)).size;
  document.getElementById('knowledge-date').textContent = '· Wissensstand ' + pack.updatedAt.split('-').reverse().join('.');
  document.getElementById('open-avatar').onclick = () => instance.open();
  const walk=document.getElementById('demo-walk'),jump=document.getElementById('demo-jump'),fly=document.getElementById('demo-fly'),cartwheel=document.getElementById('demo-cartwheel');
  if(instance.motion.matches){for(const button of [walk,jump,fly,cartwheel])button.disabled=true;}
  function resume(){if(instance.paused&&!instance.motion.matches)instance.setPaused(false);if(instance.hidden){instance.hidden=false;instance.character.hidden=false;instance.launcher.hidden=true;}}
  walk.onclick=()=>{resume();const max=Math.max(0,innerWidth-instance.size().width-8);instance.walkTo(instance.x>max/2?8:max);};
  jump.onclick=()=>{resume();instance.jump();};
  fly.onclick=()=>{resume();instance.fly();};
  cartwheel.onclick=()=>{resume();instance.cartwheel();};
  for (const button of document.querySelectorAll('[data-question]')) button.onclick = () => { instance.open(); instance.answer(button.dataset.question); };
  const descriptions = { service: 'Öffnungszeiten, Kontakt & Anfahrt', kinder: 'Kurse, Schnuppern & Geburtstage', fitness: 'Studio, Group Fitness & Cycling', mitglied: 'Beitritt, Beiträge & Verwaltung', sport: 'Abteilungen & sportliche Vielfalt', gesundheit: 'REHA Sport, Wellness & Firmensport', verein: 'Menschen & Verein' };
  for (const c of pack.categories) {
    if (c.id === 'verein') continue;
    const button = document.createElement('button'); button.className = 'topic';
    const icon = document.createElement('span'); icon.className = 'topic-icon'; icon.textContent = c.icon;
    const title = document.createElement('strong'); title.textContent = c.label;
    const small = document.createElement('small'); small.textContent = descriptions[c.id] || 'Passende Antworten entdecken';
    const arrow = document.createElement('span'); arrow.className = 'arrow'; arrow.textContent = '↗'; button.append(icon, title, small, arrow);
    button.onclick = () => { instance.current = ''; instance.category = c.id; instance.open(); }; document.getElementById('topics').append(button);
  }
  const base = location.protocol === 'file:' ? 'https://galgental9ps-png.github.io/chatavatar-databank/' : new URL('.', location.href).href;
  const code = '<script src="' + base + 'avatar.js" defer><' + '/script>';
  document.getElementById('embed-code').textContent = code;
  document.getElementById('copy-code').onclick = async () => {
    try { await navigator.clipboard.writeText(code); document.getElementById('copy-code').textContent = 'Kopiert ✓'; }
    catch { const selection = getSelection(), range = document.createRange(); range.selectNodeContents(document.getElementById('embed-code')); selection.removeAllRanges(); selection.addRange(range); document.getElementById('copy-code').textContent = 'Markiert – bitte kopieren'; }
  };
})();


