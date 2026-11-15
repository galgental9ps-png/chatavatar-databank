/* One textured character, continuous joints, grounded feet and shared colors in every pose. */
(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.ChatAvatarRig=api;
})(typeof window!=='undefined'?window:this,function(){
  'use strict';
  const TAU=Math.PI*2,GROUND=.958,UPPER_LEG=.15,LOWER_LEG=.145;
  const upperArm=.11,forearm=.085,torsoHeight=.24,torsoWidth=torsoHeight*210/310*1.16,footHeight=.102;
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),ease=v=>{v=clamp(v,0,1);return v*v*(3-2*v);};
  const regions={
    head:[9,6,340,307],body:[385,4,210,310],cape:[628,19,307,281],
    upperNear:[1024,11,153,297],lowerNear:[81,320,140,305],
    upperFar:[392,329,159,292],lowerFar:[719,317,148,306],
    thighNear:[1015,319,160,304],calfNear:[93,632,133,299],footNear:[325,700,295,203],
    thighFar:[705,634,167,299],calfFar:[1036,632,120,298],footFar:[9,1010,299,205],
    excited:[308,938,317,307],closed:[624,941,319,307]
  };
  const anchors={
    upperNear:[[.55,.16],[.40,.86]],lowerNear:[[.67,.12],[.47,.59]],
    upperFar:[[.40,.16],[.60,.86]],lowerFar:[[.36,.12],[.52,.59]],
    thighNear:[[.50,.12],[.52,.88]],calfNear:[[.50,.12],[.50,1.24]],
    thighFar:[[.51,.12],[.49,.88]],calfFar:[[.50,.12],[.50,1.24]]
  };
  function rotate(p,angle){const c=Math.cos(angle),s=Math.sin(angle);return {x:p.x*c-p.y*s,y:p.x*s+p.y*c};}
  function add(a,b){return {x:a.x+b.x,y:a.y+b.y};}
  function footAt(phase,center,stride=.43){
    const p=((phase%1)+1)%1,stance=.56,extent=stance*stride/2;
    let x,pitch,lift=0;
    if(p<stance){
      const u=p/stance;x=extent*(1-2*u);
      pitch=u<.18?-.16*(1-ease(u/.18)):u>.78?.32*ease((u-.78)/.22):0;
    }else{
      const u=(p-stance)/(1-stance);x=-extent+2*extent*ease(u);
      lift=.075*Math.sin(Math.PI*u);pitch=.32*(1-ease(u/.35))-.16*ease((u-.35)/.65);
    }
    const width=footHeight*295/203,soleY=footHeight*.36;
    const sole=Math.max(rotate({x:-width*.28,y:soleY},pitch).y,rotate({x:width*.72,y:soleY},pitch).y);
    return {x:center+x,y:GROUND-sole-lift,pitch,grounded:p<stance};
  }
  function leg(hip,ankle){
    const dx=ankle.x-hip.x,dy=ankle.y-hip.y,d=Math.hypot(dx,dy);
    const length=clamp(d,.001,UPPER_LEG+LOWER_LEG-.00001);
    const a=(UPPER_LEG**2-LOWER_LEG**2+length**2)/(2*length),h=Math.sqrt(Math.max(0,UPPER_LEG**2-a*a));
    const end={...ankle,x:hip.x+dx*length/d,y:hip.y+dy*length/d};
    return {hip,knee:{x:hip.x+dx/d*a+dy/d*h,y:hip.y+dy/d*a-dx/d*h},ankle:end};
  }
  function controlsAt(state,phase,elapsed=0,clock=0){
    const cycle=phase/16,angle=cycle*TAU,walking=state==='walk';
    const c={bob:walking?-.018+.026*Math.cos(angle)**2:-.018+Math.sin(clock*1.5)*.001,lean:walking?.035:0,head:0,face:'head',capeWidth:walking?1:.62,
      nearFoot:{x:.543,y:GROUND-footHeight*.36,pitch:0,grounded:true},farFoot:{x:.652,y:GROUND-footHeight*.36,pitch:0,grounded:true},
      nearUpper:-1.0,nearLower:1.0,farUpper:.95,farLower:-1.0};
    if(walking){
      c.nearFoot=footAt(cycle,.543);c.farFoot=footAt(cycle+.5,.652);
      c.nearUpper=-.44*Math.cos(angle);c.nearLower=c.nearUpper+.40;
      c.farUpper=.44*Math.cos(angle);c.farLower=c.farUpper+.40;c.head=-.015*Math.sin(angle);
    }else if(state==='wave'){
      c.face='excited';c.farUpper=2.05;c.farLower=2.85+Math.sin(clock*8)*.18;
    }else if(state==='talk'||state==='point'){
      c.face='excited';c.farUpper=1.2;c.farLower=1.15+Math.sin(clock*3)*.07;
    }else if(state==='celebrate'){
      c.face='excited';c.nearUpper=-2.1;c.nearLower=-2.85;c.farUpper=2.1;c.farLower=2.85;
    }else if(state==='think'){
      c.head=-.06;c.farUpper=.4;c.farLower=-2.7;
    }else if(state==='rest'){
      c.face='closed';c.nearUpper=-.12;c.nearLower=.12;c.farUpper=.12;c.farLower=.12;
    }else if(state==='held'||state==='fall'||state==='jump'){
      c.face='excited';c.nearUpper=-2.15;c.nearLower=-2.8;c.farUpper=2.15;c.farLower=2.8;
      c.nearFoot={x:.47,y:.84,pitch:.25,grounded:false};c.farFoot={x:.72,y:.85,pitch:-.20,grounded:false};
      c.bob=-.005;c.head=Math.sin(clock*3)*.025;c.capeWidth=.8;
    }else if(state==='crouch'||state==='land'||state==='recover'){
      c.bob=state==='recover'?.065*(1-ease(elapsed/.24)):state==='land'?.065:.045;
      c.nearUpper=-.65;c.nearLower=.25;c.farUpper=.65;c.farLower=.25;
    }
    return c;
  }
  function skeleton(c){
    const hipCenter={x:.595,y:.645+c.bob};
    const bodyPoint=(u,v)=>add(hipCenter,rotate({x:(u-.5)*torsoWidth,y:(v-.90)*torsoHeight},c.lean));
    // Keep the planted feet fixed; resolve tiny reach limits through the pelvis.
    let adjustment=0;
    for(const [u,foot] of [[.22,c.nearFoot],[.80,c.farFoot]]){
      const hip=bodyPoint(u,.90),dx=foot.x-hip.x,reach=UPPER_LEG+LOWER_LEG-.00002;
      const needed=foot.y-Math.sqrt(Math.max(.0001,reach*reach-dx*dx));
      adjustment=Math.max(adjustment,needed-hip.y);
    }
    hipCenter.y+=adjustment;
    function arm(which){
      const near=which==='near',shoulder=bodyPoint(near?.18:.88,.25),a=c[which+'Upper'],b=c[which+'Lower'];
      const elbow=add(shoulder,{x:Math.sin(a)*upperArm,y:Math.cos(a)*upperArm});
      const wrist=add(elbow,{x:Math.sin(b)*forearm,y:Math.cos(b)*forearm});
      return {shoulder,elbow,wrist};
    }
    return {hipCenter,neck:bodyPoint(.55,-.01),bodyPoint,
      near:leg(bodyPoint(.22,.90),c.nearFoot),far:leg(bodyPoint(.80,.90),c.farFoot),
      nearArm:arm('near'),farArm:arm('far')};
  }
  function poseAt(state,phase,elapsed=0,clock=0){const controls=controlsAt(state,phase,elapsed,clock);return {...skeleton(controls),controls};}
  function interpolate(a,b,t){
    const c={};
    for(const key of ['bob','lean','head','capeWidth','nearUpper','nearLower','farUpper','farLower'])c[key]=a[key]+(b[key]-a[key])*t;
    for(const key of ['nearFoot','farFoot']){
      c[key]={};for(const p of ['x','y','pitch'])c[key][p]=a[key][p]+(b[key][p]-a[key][p])*t;
      c[key].grounded=a[key].grounded&&b[key].grounded;
    }
    c.face=b.face;return c;
  }
  const cache=new WeakMap();
  function partsFor(image,doc){
    if(cache.has(image))return cache.get(image);
    const parts={};
    for(const [name,[x,y,w,h]] of Object.entries(regions)){
      const canvas=doc.createElement('canvas');canvas.width=w;canvas.height=h;
      const ctx=canvas.getContext('2d');ctx.drawImage(image,x,y,w,h,0,0,w,h);
      if(typeof ctx.createLinearGradient==='function'){
        const bottom=/^(thigh|upper)/.test(name),top=/^(calf|lower)/.test(name);
        if(bottom||top){
          const gradient=ctx.createLinearGradient(0,0,0,h);
          if(bottom){gradient.addColorStop(0,'#fff');gradient.addColorStop(.77,'#fff');gradient.addColorStop(1,'#fff0');}
          else {gradient.addColorStop(0,'#fff0');gradient.addColorStop(.24,'#fff');gradient.addColorStop(1,'#fff');}
          ctx.globalCompositeOperation='destination-in';ctx.fillStyle=gradient;ctx.fillRect(0,0,w,h);ctx.globalCompositeOperation='source-over';
        }
      }
      if(name==='body'&&typeof ctx.ellipse==='function'){
        ctx.globalCompositeOperation='destination-out';
        for(const [u,rx] of [[.22,.14],[.82,.12]]){ctx.beginPath();ctx.ellipse(u*w,.905*h,rx*w,.030*h,0,0,TAU);ctx.fill();}
        ctx.globalCompositeOperation='source-over';
      }
      parts[name]=canvas;
    }
    const body=parts.body,mirrored=doc.createElement('canvas');mirrored.width=body.width;mirrored.height=body.height;
    const ctx=mirrored.getContext('2d');ctx.drawImage(body,0,0);
    const x=body.width*.42,y=body.height*.23,w=body.width*.44,h=body.height*.13;
    ctx.save();ctx.translate(2*x+w,0);ctx.scale(-1,1);ctx.drawImage(body,x,y,w,h,x,y,w,h);ctx.restore();
    parts.bodyLeft=mirrored;cache.set(image,parts);return parts;
  }
  function paint(element,image,state,phase,facing,{document:doc,now=0,still=false}={}){
    const ctx=element.getContext('2d'),pixels=element.width,parts=partsFor(image,doc);
    if(element._rigState!==state){
      element._rigFrom=element._rigControls;element._rigState=state;element._rigStarted=now;
    }
    const elapsed=Math.max(0,(now-element._rigStarted)/1000),clock=still?0:now/1000;
    let c=controlsAt(state,phase,elapsed,clock);
    if(!still&&element._rigFrom&&elapsed<.18)c=interpolate(element._rigFrom,c,ease(elapsed/.18));
    element._rigControls=c;
    const s=skeleton(c);
    ctx.clearRect(0,0,pixels,pixels);ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over';ctx.filter='none';ctx.save();ctx.scale(pixels,pixels);
    function imageAt(name,point,height,anchor=[.5,.5],angle=0,widthScale=1){
      const img=parts[name],width=height*img.width/img.height*widthScale;
      ctx.save();ctx.translate(point.x,point.y);ctx.rotate(angle);ctx.drawImage(img,-width*anchor[0],-height*anchor[1],width,height);ctx.restore();
    }
    function segment(name,a,b){
      const img=parts[name],[start,end]=anchors[name],sx=start[0]*img.width,sy=start[1]*img.height;
      const dx=(end[0]-start[0])*img.width,dy=(end[1]-start[1])*img.height;
      const scale=Math.hypot(b.x-a.x,b.y-a.y)/Math.hypot(dx,dy),targetAngle=Math.atan2(b.y-a.y,b.x-a.x),sourceAngle=Math.atan2(dy,dx);
      const widthScale=name.startsWith('thigh')?.72:name.startsWith('calf')?.88:.9;
      ctx.save();ctx.translate(a.x,a.y);ctx.rotate(targetAngle);ctx.scale(scale,scale*widthScale);ctx.rotate(-sourceAngle);ctx.drawImage(img,-sx,-sy);ctx.restore();
    }
    function drawLeg(which){
      const l=s[which],suffix=which==='near'?'Near':'Far';
      bridge(l.hip,l.knee,l.ankle,.044);
      segment('calf'+suffix,l.knee,l.ankle);segment('thigh'+suffix,l.hip,l.knee);
      imageAt('foot'+suffix,l.ankle,footHeight,[.28,.64],c[which+'Foot'].pitch);
    }
    function bridge(a,joint,b,width){
      if(typeof ctx.createLinearGradient!=='function')return;
      const da=Math.hypot(a.x-joint.x,a.y-joint.y),db=Math.hypot(b.x-joint.x,b.y-joint.y);
      const gradient=ctx.createLinearGradient(joint.x-width/2,joint.y,joint.x+width/2,joint.y);
      gradient.addColorStop(0,'#d39263');gradient.addColorStop(.5,'#f1b78b');gradient.addColorStop(1,'#e5a476');
      ctx.save();ctx.strokeStyle=gradient;ctx.lineWidth=width;ctx.lineCap='round';ctx.lineJoin='round';ctx.beginPath();
      ctx.moveTo(joint.x+(a.x-joint.x)/da*.024,joint.y+(a.y-joint.y)/da*.024);ctx.lineTo(joint.x,joint.y);
      ctx.lineTo(joint.x+(b.x-joint.x)/db*.024,joint.y+(b.y-joint.y)/db*.024);ctx.stroke();ctx.restore();
    }
    function drawArm(which){const a=s[which+'Arm'],suffix=which==='near'?'Near':'Far';bridge(a.shoulder,a.elbow,a.wrist,.034);segment('upper'+suffix,a.shoulder,a.elbow);segment('lower'+suffix,a.elbow,a.wrist);}
    imageAt('cape',s.bodyPoint(.57,.18),.375,[.91,.08],c.lean+(still?0:Math.sin(clock*3.3)*.035),c.capeWidth);
    drawArm('far');drawLeg('far');drawLeg('near');
    imageAt(facing<0?'bodyLeft':'body',s.hipCenter,torsoHeight,[.5,.90],c.lean,1.16);
    drawArm('near');imageAt(c.face,s.neck,.415,[.68,.90],c.lean+c.head);
    ctx.restore();ctx.globalAlpha=1;
    element.style.scale=facing+' 1';element.style.translate='0 0';
    element.dataset.sheet='rig';element.dataset.pose=state;element.dataset.facing=facing<0?'left':'right';
    element.dataset.renderer='joints';element.dataset.frame=String(Math.floor(phase));element.dataset.phase=String(phase);element.dataset.blend='0';
  }
  return {paint,poseAt,footAt,leg,GROUND,UPPER_LEG,LOWER_LEG,regions};
});
