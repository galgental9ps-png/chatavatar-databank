/* Tavi: a complete arm-swing cycle and readable chest lettering in both directions. */
(function () {
  'use strict';
  const base=new URL('.',document.currentScript.src).href;
  const images={poses:base+'assets/tva-poses-v2.webp',walk:base+'assets/tva-walk-v3.webp'};
  const decoded={},leftAtlases={};
  const poses={idle:0,wave:1,talk:2,point:3,crouch:4,fall:7,land:8,recover:9,celebrate:10,think:11,held:12,rest:14,surprised:15};
  const standing={
    0:{height:.955,bottom:.994},1:{height:.952,bottom:.997},
    2:{height:.943,bottom:.997},3:{height:.946,bottom:.994},
    10:{height:.930,bottom:.958},11:{height:.920,bottom:.955},15:{height:.936,bottom:.968}
  };
  // Subpixel anchor differences in the artwork should not shake the whole body.
  const headX=[.6115,.6102,.6102,.6115,.6115,.6102,.6102,.6115,.6115,.6102,.6102,.6115,.6115,.6102,.6134,.6115];
  const floorY=[.9650,.9618,.9650,.9682,.9712,.9681,.9712,.9617,.9681,.9681,.9744,.9712,.9682,.9682,.9682,.9682];
  const walkScale=.98;
  // Tight bounds include the lettering and a small blue margin, never the body outline.
  const logos={
    poses:[
      [.554,.481,.100,.041],[.5463,.4809,.099,.0414],
      [.5623,.4809,.0958,.0414],[.5573,.4809,.1019,.0414],
      [.570,.649,.092,.057],[.5815,.4665,.0703,.0415],
      [.5974,.4089,.0927,.0415],[.532,.518,.080,.045],
      [.573,.568,.084,.049],[.594,.479,.074,.049],
      [.543,.419,.100,.045],[.629,.422,.044,.042],
      [.586,.449,.092,.045],[.591,.433,.092,.042],
      [.5719,.6146,.1022,.0541],[.557,.433,.096,.045]
    ],
    walk:[
      [.5987,.4363,.0796,.0382],[.6006,.4363,.0767,.0382],
      [.6006,.4363,.0799,.0382],[.6019,.4331,.0764,.0414],
      [.6019,.4345,.0732,.0415],[.6006,.4345,.0767,.0415],
      [.6006,.4345,.0799,.0415],[.6019,.4345,.0764,.0415],
      [.6019,.4377,.0732,.0415],[.6038,.4377,.0735,.0415],
      [.6070,.4377,.0735,.0415],[.6051,.4377,.0732,.0415],
      [.6019,.4395,.0732,.0414],[.6006,.4395,.0767,.0414],
      [.6038,.4395,.0735,.0414],[.6019,.4395,.0796,.0414]
    ]
  };
  function leftAtlas(sheet){
    if(leftAtlases[sheet])return leftAtlases[sheet];
    const image=decoded[sheet],atlas=document.createElement('canvas');
    atlas.width=image.naturalWidth;atlas.height=image.naturalHeight;
    const ctx=atlas.getContext('2d'),cellWidth=atlas.width/4,cellHeight=atlas.height/4;
    ctx.drawImage(image,0,0);
    logos[sheet].forEach(([x,y,width,height],index)=>{
      const sx=(index%4+x)*cellWidth,sy=(Math.floor(index/4)+y)*cellHeight;
      const sw=width*cellWidth,sh=height*cellHeight;
      // Counter-reflect only the logo before the complete character faces left.
      ctx.save();ctx.translate(2*sx+sw,0);ctx.scale(-1,1);
      ctx.drawImage(image,sx,sy,sw,sh,sx,sy,sw,sh);ctx.restore();
    });
    leftAtlases[sheet]=atlas;return atlas;
  }
  let loaded;
  function paint(element,state='idle',phase=0,facing=1) {
    const sheet=state==='walk'?'walk':'poses',rows=4;
    const plan=sheet==='walk'?window.ChatAvatarMotion.walkFramePlan(phase):null;
    const index=plan?plan.current:state==='jump'?[5,6][Math.min(1,Math.floor(phase))]:state==='held'?[12,13][Math.floor(phase)%2]:poses[state]??0;
    const blend=plan?Math.round(plan.blend*64)/64:0;
    const key=[state,index,blend,facing].join(':');
    if(element._taviPaintKey===key)return;
    const original=decoded[sheet];if(!original)return;
    const image=facing<0?leftAtlas(sheet):original;
    const ctx=element.getContext('2d');if(!ctx)return;
    const pixels=element.width,cellWidth=original.naturalWidth/4,cellHeight=original.naturalHeight/rows;
    const draw=frame=>{
      const scale=sheet==='walk'?walkScale:1;
      const dx=sheet==='walk'?(.62-headX[frame]*scale)*pixels:0;
      const dy=sheet==='walk'?(.958-floorY[frame]*scale)*pixels:0;
      ctx.drawImage(image,(frame%4)*cellWidth,Math.floor(frame/4)*cellHeight,cellWidth,cellHeight,dx,dy,pixels*scale,pixels*scale);
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
    element.dataset.facing=facing<0?'left':'right';
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

