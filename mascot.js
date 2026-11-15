/* Tavi: decoded atlases, aligned gait anchors and short additive frame blending. */
(function () {
  'use strict';
  const base=new URL('.',document.currentScript.src).href;
  const images={poses:base+'assets/tva-poses-v2.webp',walk:base+'assets/tva-walk-v2.webp'};
  const decoded={};
  const poses={idle:0,wave:1,talk:2,point:3,crouch:4,fall:7,land:8,recover:9,celebrate:10,think:11,held:12,rest:14,surprised:15};
  const standing={
    0:{height:.955,bottom:.994},1:{height:.952,bottom:.997},
    2:{height:.943,bottom:.997},3:{height:.946,bottom:.994},
    10:{height:.930,bottom:.958},11:{height:.920,bottom:.955},15:{height:.936,bottom:.968}
  };
  // Subpixel anchor differences in the artwork should not shake the whole body.
  const headX=[.6180,.6170,.6192,.6203,.6187,.6204,.6270,.6290];
  const floorY=[.957,.959,.962,.957,.957,.957,.957,.957];
  let loaded;
  function paint(element,state='idle',phase=0,facing=1) {
    const sheet=state==='walk'?'walk':'poses', rows=sheet==='walk'?2:4;
    const plan=sheet==='walk'?window.ChatAvatarMotion.walkFramePlan(phase):null;
    const index=plan?plan.current:state==='jump'?[5,6][Math.min(1,Math.floor(phase))]:state==='held'?[12,13][Math.floor(phase)%2]:poses[state]??0;
    const blend=plan?Math.round(plan.blend*32)/32:0;
    const key=[state,index,blend,facing].join(':');
    if(element._taviPaintKey===key)return;
    const image=decoded[sheet];if(!image)return;
    const ctx=element.getContext('2d');if(!ctx)return;
    const pixels=element.width,cellWidth=image.naturalWidth/4,cellHeight=image.naturalHeight/rows;
    const draw=frame=>{
      const dx=sheet==='walk'?(.62-headX[frame])*pixels:0;
      const dy=sheet==='walk'?(.958-floorY[frame])*pixels:0;
      ctx.drawImage(image,(frame%4)*cellWidth,Math.floor(frame/4)*cellHeight,cellWidth,cellHeight,dx,dy,pixels,pixels);
    };
    ctx.clearRect(0,0,pixels,pixels);
    ctx.globalCompositeOperation='source-over';
    ctx.globalAlpha=1-blend;draw(index);
    if(blend>0){
      // Add premultiplied contributions: overlapping pixels stay fully opaque.
      ctx.globalCompositeOperation='lighter';ctx.globalAlpha=blend;draw(plan.next);
    }
    ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over';
    const reference=sheet==='poses'?standing[index]:null;
    const scaleY=reference?.height ? .915/reference.height : 1,scaleX=reference?scaleY*.98:1;
    const shiftY=reference?.height ? .958-(.94+scaleY*(reference.bottom-.94)) : 0;
    if(element.dataset.pose!==state||element._taviFacing!==facing){
      element.style.scale=(facing*scaleX)+' '+scaleY;element.style.translate='0 '+shiftY*100+'%';
      element._taviFacing=facing;
    }
    if(element.dataset.sheet!==sheet)element.dataset.sheet=sheet;
    if(element.dataset.frame!==String(index))element.dataset.frame=String(index);
    if(element.dataset.pose!==state)element.dataset.pose=state;
    element.dataset.blend=String(blend);element._taviPaintKey=key;
  }
  window.ChatAvatarArt={
    images,
    preload(){
      if(!loaded)loaded=Promise.all(Object.entries(images).map(([key,url])=>new Promise((resolve,reject)=>{
        const image=new Image(),timer=setTimeout(()=>reject(Error('Die Tavi-Grafik konnte nicht geladen werden. Bitte erneut laden.')),15000);
        image.onload=async()=>{
          try{if(typeof image.decode==='function')await image.decode();decoded[key]=image;clearTimeout(timer);resolve();}
          catch(err){clearTimeout(timer);reject(err);}
        };
        image.onerror=()=>{clearTimeout(timer);reject(Error('Tavi-Grafik nicht erreichbar.'));};image.src=url;
      })));
      return loaded;
    },
    create(){
      const element=document.createElement('canvas');element.className='tavi-frame';element.width=element.height=192*Math.min(2,window.devicePixelRatio||1);
      element.setAttribute('aria-hidden','true');paint(element);return element;
    },
    paint
  };
})();

