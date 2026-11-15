'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),M=require('../motion-core.js');
test('A superhero flight rises high, hovers and returns gently to the same ground position',()=>{
  const size=M.dimensions(1400,900),plan=M.actionPlan('fly',700,size,1400,900,1),poses=new Set();let peak=0;
  for(let i=0;i<=560;i++){
    const frame=M.actionFrame(plan,i/200,size,1400,900);poses.add(frame.pose);peak=Math.max(peak,frame.y);
    assert.ok(frame.y>=size.ground);assert.ok(frame.x>=0&&frame.x+size.width<=1400);
    assert.ok(900-frame.y-size.height>=0);
  }
  assert.ok(peak>size.height*2);assert.ok(poses.has('crouch')&&poses.has('fly')&&poses.has('hover'));
  const end=M.actionFrame(plan,plan.duration,size,1400,900),near=M.actionFrame(plan,plan.duration-.001,size,1400,900);
  assert.ok(end.done);assert.equal(end.y,size.ground);assert.ok(Math.abs(end.x-plan.startX)<1e-9);assert.ok(near.y-size.ground<.01);
});
test('A cartwheel makes one complete side rotation and keeps its silhouette on the floor',()=>{
  for(const [width,height,start] of [[1400,900,0],[1400,900,1200],[390,844,200]]){
    const size=M.dimensions(width,height),plan=M.actionPlan('cartwheel',start,size,width,height);
    assert.ok(plan);let last=0;
    for(let i=0;i<=500;i++){
      const seconds=.34+(1.8-.34)*(i/501),f=M.actionFrame(plan,seconds,size,width,height);
      assert.ok(Math.abs(f.rotation)>=last);last=Math.abs(f.rotation);
      const radians=f.rotation*Math.PI/180,c=Math.cos(radians),s=Math.sin(radians);
      const points=M.CARTWHEEL_HULL.map(([x,y])=>({x:f.x+size.width*.5+(x*plan.facing*c-y*s)*size.width,y:height-f.y-size.height*.5+(x*plan.facing*s+y*c)*size.height}));
      assert.ok(Math.min(...points.map(p=>p.x))>=0);assert.ok(Math.max(...points.map(p=>p.x))<=width);
      assert.ok(Math.min(...points.map(p=>p.y))>=0);
      assert.ok(Math.abs(Math.max(...points.map(p=>p.y))-(height-size.ground-size.height*.042))<1e-8);
    }
    const end=M.actionFrame(plan,plan.duration,size,width,height);assert.ok(end.done);assert.equal(Math.abs(end.rotation),360);assert.equal(end.y,size.ground);
  }
});
test('Small or short embeds skip actions that do not fit',()=>{
  const size=M.dimensions(200,170);
  assert.equal(M.actionPlan('fly',0,size,200,170),null);
  assert.equal(M.actionPlan('cartwheel',0,size,200,170),null);
  assert.equal(M.actionPlan('unknown',0,size,1400,900),null);
});
