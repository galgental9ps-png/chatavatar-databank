/* Tavi: a complete arm-swing cycle and readable chest lettering in both directions. */
(function () {
  'use strict';
  const base=new URL('.',document.currentScript.src).href;
  const images={poses:base+'assets/tva-poses-v2.webp',walk:base+'assets/tva-walk-v4.webp',actions:base+'assets/tva-actions-v1.webp'};
  const decoded={},leftAtlases={},normalized=new WeakSet();
  function dimensions(image){return [image.naturalWidth||image.width,image.naturalHeight||image.height];}
  function prepare(image,sheet){
    const atlas=document.createElement('canvas');[atlas.width,atlas.height]=dimensions(image);
    const ctx=atlas.getContext('2d');if(!ctx||typeof ctx.getImageData!=='function')return sheet==='actions'?actionAtlas(image):image;
    try{
      ctx.drawImage(image,0,0);const pixels=ctx.getImageData(0,0,atlas.width,atlas.height),p=pixels.data;
      for(let i=0;i<p.length;i+=4){
        // Clear the old low-alpha matte without tinting the new artwork.
        const alpha=Math.max(0,Math.min(1,(p[i+3]/255-(sheet==='walk'?.08:.03))/(sheet==='walk'?.78:.84)));p[i+3]=Math.round(alpha*255);
      }
      ctx.putImageData(pixels,0,0);normalized.add(atlas);return sheet==='actions'?actionAtlas(atlas):atlas;
    }catch{return sheet==='actions'?actionAtlas(image):image;}
  }
  function actionAtlas(image){
    const atlas=document.createElement('canvas'),cell=512;atlas.width=cell*4;atlas.height=cell;
    const ctx=atlas.getContext('2d');
    const regions=[[154,7,349,555],[760,9,375,553],[158,594,328,639],[678,616,476,616]];
    regions.forEach(([x,y,w,h],index)=>{
      const height=.915*cell,width=w/h*height,centerX=(index+.5)*cell,centerY=(.049+.915/2)*cell;
      ctx.save();ctx.translate(centerX,centerY);if(index>=2)ctx.rotate(Math.PI);
      ctx.drawImage(image,x,y,w,h,-width/2,-height/2,width,height);ctx.restore();
    });
    if(normalized.has(image))normalized.add(atlas);return atlas;
  }
  const poses={idle:0,wave:1,talk:2,point:3,crouch:4,fall:7,land:8,recover:9,celebrate:10,think:11,held:12,rest:14,surprised:15};
  const standing={
    0:{height:.955,bottom:.994},1:{height:.952,bottom:.997},
    2:{height:.943,bottom:.997},3:{height:.946,bottom:.994},
    10:{height:.930,bottom:.958},11:{height:.920,bottom:.955},15:{height:.936,bottom:.968}
  };
  // Subpixel anchor differences in the artwork should not shake the whole body.
  const headX=[.6051,.6070,.6070,.6083,.6051,.6038,.6070,.6051,.6051,.6070,.6070,.6051,.6051,.6038,.6070,.6051];
  const floorY=[.9682,.9682,.9713,.9745,.9744,.9744,.9776,.9681,.9712,.9712,.9744,.9744,.9713,.9713,.9713,.9713];
  const walkScale=.962792;
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
    actions:[[.5651,.3969,.0874,.0412],[.5157,.3965,.0827,.0381],[.4585,.4199,.0845,.0372],[.4436,.4307,.0891,.0371]],
    walk:[
      [.5987,.4363,.0796,.0414],[.6006,.4363,.0767,.0414],
      [.6006,.4363,.0799,.0414],[.6019,.4363,.0796,.0414],
      [.6019,.4345,.0764,.0415],[.6006,.4345,.0831,.0447],
      [.6006,.4345,.0831,.0447],[.6051,.4345,.0796,.0447],
      [.6019,.4377,.0796,.0415],[.6038,.4377,.0799,.0415],
      [.6038,.4377,.0799,.0415],[.6051,.4377,.0796,.0415],
      [.6019,.4395,.0764,.0414],[.6006,.4395,.0831,.0414],
      [.6006,.4395,.0799,.0414],[.6019,.4363,.0828,.0446]
    ]
  };
  function leftAtlas(sheet){
    if(leftAtlases[sheet])return leftAtlases[sheet];
    const image=decoded[sheet],atlas=document.createElement('canvas');
    [atlas.width,atlas.height]=dimensions(image);
    const ctx=atlas.getContext('2d'),cellWidth=atlas.width/4,cellHeight=atlas.height/(sheet==='actions'?1:4);
    ctx.drawImage(image,0,0);
    logos[sheet].forEach(([x,y,width,height],index)=>{
      const sx=(index%4+x)*cellWidth,sy=(Math.floor(index/4)+y)*cellHeight;
      const sw=width*cellWidth,sh=height*cellHeight;
      // Counter-reflect only the logo before the complete character faces left.
      ctx.save();ctx.translate(2*sx+sw,0);ctx.scale(-1,1);
      ctx.drawImage(image,sx,sy,sw,sh,sx,sy,sw,sh);ctx.restore();
    });
    if(normalized.has(image))normalized.add(atlas);
    leftAtlases[sheet]=atlas;return atlas;
  }
  let loaded;
  function paint(element,state='idle',phase=0,facing=1,still=false) {
    const sheet=state==='walk'?'walk':['fly','hover','cartwheel'].includes(state)?'actions':'poses',rows=sheet==='actions'?1:4;
    const walkPhase=((phase%16)+16)%16,walkIndex=Math.floor(walkPhase);
    const index=sheet==='walk'?walkIndex:state==='fly'?0:state==='hover'?1:state==='cartwheel'?(phase>=1?3:2):state==='jump'?[5,6][Math.min(1,Math.floor(phase))]:state==='held'?[12,13][Math.floor(phase)%2]:poses[state]??0;
    const key=[state,index,facing].join(':');
    if(element._taviPaintKey===key)return;
    const original=decoded[sheet];if(!original)return;
    const image=facing<0?leftAtlas(sheet):original;
    const ctx=element.getContext('2d');if(!ctx)return;
    const pixels=element.width,[width,height]=dimensions(original),cellWidth=width/4,cellHeight=height/rows;
    const draw=frame=>{
      const scale=sheet==='walk'?walkScale:1;
      const dx=sheet==='walk'?(.62-headX[frame]*scale)*pixels:0;
      const dy=sheet==='walk'?(.958-floorY[frame]*scale)*pixels:0;
      ctx.drawImage(image,(frame%4)*cellWidth,Math.floor(frame/4)*cellHeight,cellWidth,cellHeight,dx,dy,pixels*scale,pixels*scale);
    };
    ctx.clearRect(0,0,pixels,pixels);
    ctx.globalCompositeOperation='source-over';
    // Draw one complete illustrated character, keeping its original anatomy and colors.
    ctx.globalAlpha=1;ctx.filter='none';
    draw(index);if(!normalized.has(image))draw(index);
    ctx.filter='none';
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
    element.dataset.renderer='frames';
    element.dataset.phase=String(walkPhase);
    element.dataset.blend='0';element._taviPaintKey=key;
  }
  window.ChatAvatarArt={
    images,
    preload(){
      if(!loaded)loaded=Promise.all(Object.entries(images).map(([key,url])=>new Promise((resolve,reject)=>{
        const image=new Image(),timer=setTimeout(()=>reject(Error('Die Tavi-Grafik konnte nicht geladen werden. Bitte erneut laden.')),15000);
        image.onload=async()=>{
          try{if(typeof image.decode==='function')await image.decode();decoded[key]=prepare(image,key);clearTimeout(timer);resolve();}
          catch(err){clearTimeout(timer);reject(err);}
        };
        image.onerror=()=>{clearTimeout(timer);reject(Error('Tavi-Grafik nicht erreichbar.'));};if(/^https?:/.test(url))image.crossOrigin='anonymous';image.src=url;
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

