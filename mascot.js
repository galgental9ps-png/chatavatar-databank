/* Tavi's original blue-and-white identity with dedicated movement artwork. */
(function () {
  'use strict';
  const base = new URL('.',document.currentScript.src).href;
  const images = { poses: base + 'assets/tva-poses-v2.webp', walk: base + 'assets/tva-walk-v2.webp' };
  const poses = { idle:0, wave:1, talk:2, point:3, crouch:4, fall:7, land:8, recover:9, celebrate:10, think:11, held:12, rest:14, surprised:15 };
  let loaded;
  function paint(element,state='idle',frame=0,facing=1) {
    const sheet=state==='walk'?'walk':'poses', rows=sheet==='walk'?2:4;
    const index=sheet==='walk'?frame%8:state==='jump'?[5,6][Math.min(1,frame)]:state==='held'?[12,13][frame%2]:poses[state]??0;
    if(element.dataset.sheet!==sheet) {
      element.style.backgroundImage='url("'+images[sheet]+'")';
      element.style.backgroundSize='400% '+rows*100+'%';
      element.dataset.sheet=sheet;
    }
    element.style.backgroundPosition=((index%4)*100/3)+'% '+(Math.floor(index/4)*100/(rows-1))+'%';
    element.style.scale=facing+' 1';element.dataset.frame=String(index);element.dataset.pose=state;
  }
  window.ChatAvatarArt={
    images,
    preload(){
      if(!loaded)loaded=Promise.all(Object.values(images).map(url=>new Promise((resolve,reject)=>{
        const image=new Image(),timer=setTimeout(()=>reject(Error('Die Tavi-Grafik konnte nicht geladen werden. Bitte erneut laden.')),15000);
        image.onload=()=>{clearTimeout(timer);resolve();};image.onerror=()=>{clearTimeout(timer);reject(Error('Tavi-Grafik nicht erreichbar.'));};image.src=url;
      })));
      return loaded;
    },
    create(){const element=document.createElement('span');element.className='tavi-frame';element.setAttribute('aria-hidden','true');paint(element);return element;},
    paint
  };
})();

