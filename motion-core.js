/* Tavi movement: gait follows travel distance; release and jumps use gravity. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.ChatAvatarMotion = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const WALK_FRAMES = 16;
  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  function dimensions(viewportWidth, viewportHeight = 1000) {
    const size = Math.max(72, Math.min(viewportWidth <= 540 ? 152 : 192, Math.max(72,viewportWidth - 16), Math.max(72,viewportHeight - 24)));
    return { width: size, height: size, ground: 10, stride: size * 0.43, speed: size * 0.62 };
  }
  function gaitPhaseAtDistance(distance, stride) {
    return ((Math.max(0, distance) / Math.max(1, stride)) % 1) * WALK_FRAMES;
  }
  function frameAtDistance(distance, stride) {
    return Math.floor(gaitPhaseAtDistance(distance,stride));
  }
  function walkStep({ x, target, velocity = 0, distance = 0 }, seconds, size) {
    const dt = clamp(seconds, 0, 0.05), remaining = Math.abs(target - x);
    const direction = Math.sign(target - x), acceleration = size.speed * 3.2;
    if (remaining < 0.6) return { x: target, target, velocity: 0, distance, arrived: true };
    const desired = Math.min(size.speed, Math.sqrt(2 * acceleration * remaining));
    const velocityNext = velocity + clamp(desired - velocity, -acceleration * dt, acceleration * dt);
    const travel = Math.min(remaining, Math.max(0, velocityNext) * dt);
    return { x: x + direction * travel, target, velocity: velocityNext, distance: distance + travel, arrived: remaining - travel < 0.6 };
  }
  function fallStep({ y, velocity = 0 }, seconds, ground = 10) {
    const dt = clamp(seconds, 0, 0.05), nextVelocity = velocity + 1100 * dt;
    const nextY = Math.max(ground, y - nextVelocity * dt);
    return { y: nextY, velocity: nextY === ground ? 0 : nextVelocity, landed: nextY === ground, impact: nextY === ground ? nextVelocity : 0 };
  }
  function jumpStep({ y, velocity }, seconds, ground = 10) {
    const dt = clamp(seconds, 0, 0.05), nextVelocity = velocity - 1100 * dt;
    const nextY = Math.max(ground, y + nextVelocity * dt);
    return { y: nextY, velocity: nextVelocity, landed: nextY === ground && nextVelocity < 0 };
  }
  const ease=value=>{const t=clamp(value,0,1);return t*t*(3-2*t);};
  // Convex silhouette of the fully illustrated cartwheel pose, around its center.
  const CARTWHEEL_HULL=[[-.3179,.4387],[-.3446,.4149],[-.2689,-.4407],[-.2495,-.4481],[.1411,-.4496],[.1961,-.4436],[.3476,.3837],[.3446,.4016],[.3194,.4283],[.2882,.4431],[-.2822,.4521]].map(([x,y])=>[x,y+.006]);
  function actionPlan(type,x,size,viewportWidth,viewportHeight,facing=1){
    const maxX=Math.max(0,viewportWidth-size.width),startX=clamp(x,0,maxX);
    if(type==='fly'){
      const maxRise=viewportHeight-size.height-22-size.ground;
      if(maxRise<size.height*.32)return null;
      return {type,startX,facing,peakY:size.ground+Math.min(Math.max(size.height*1.6,viewportHeight*.46),maxRise),duration:2.8,elapsed:0};
    }
    if(type!=='cartwheel'||viewportWidth<size.width*1.55||viewportHeight<size.height*1.18+16)return null;
    const margin=size.width*.08,safeStart=clamp(startX,margin,Math.max(margin,maxX-margin));
    const direction=safeStart>maxX/2?-1:1;
    return {type,startX,safeStart,targetX:clamp(safeStart+direction*size.width*.85,margin,Math.max(margin,maxX-margin)),facing:direction,duration:1.94,elapsed:0};
  }
  function actionFrame(plan,seconds,size,viewportWidth,viewportHeight){
    const t=clamp(seconds,0,plan.duration),progress=t/plan.duration,maxX=Math.max(0,viewportWidth-size.width);
    let x=plan.startX,y=size.ground,rotation=0,pose='crouch',frame=0;
    if(plan.type==='fly'){
      const peak=clamp(plan.peakY,size.ground,Math.max(size.ground,viewportHeight-size.height-22));
      if(t>=.2&&t<1.05){const p=ease((t-.2)/.85);y=size.ground+(peak-size.ground)*p;pose='fly';rotation=plan.facing*6*Math.sin(Math.PI*p);}
      else if(t>=1.05&&t<1.75){pose='hover';y=peak+Math.sin((t-1.05)/.7*Math.PI*2)*size.height*.012;}
      else if(t>=1.75){pose='fly';y=size.ground+(peak-size.ground)*(1-ease((t-1.75)/1.05));}
      x=plan.startX+plan.facing*size.width*.18*Math.sin(Math.PI*clamp((t-.2)/2.6,0,1));
    }else{
      if(t<.18)x=plan.startX+(plan.safeStart-plan.startX)*ease(t/.18);
      else if(t<.34){x=plan.safeStart;pose='cartwheel';}
      else if(t<1.80){
        const p=ease((t-.34)/1.46);x=plan.safeStart+(plan.targetX-plan.safeStart)*p;
        rotation=plan.facing*360*p;pose='cartwheel';frame=1;
        const radians=rotation*Math.PI/180,c=Math.cos(radians),s=Math.sin(radians);
        const support=Math.max(...CARTWHEEL_HULL.map(([hx,hy])=>hx*plan.facing*s+hy*c));
        y=size.ground+(support-.458)*size.height;
      }else{x=plan.targetX;pose='cartwheel';rotation=plan.facing*360;}
    }
    return {x:clamp(x,0,maxX),y:Math.min(y,Math.max(size.ground,viewportHeight-size.height-4)),rotation,pose,frame,progress,done:seconds>=plan.duration};
  }
  return { WALK_FRAMES, dimensions, clamp, frameAtDistance, gaitPhaseAtDistance, walkStep, fallStep, jumpStep,actionPlan,actionFrame,CARTWHEEL_HULL };
});

