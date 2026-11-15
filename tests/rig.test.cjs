'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),R=require('../rig.js'),M=require('../motion-core.js');
const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
test('Hips, knees and ankles stay connected with constant bone lengths throughout both steps',()=>{
  for(let i=0;i<2000;i++){
    const pose=R.poseAt('walk',i*16/2000);
    for(const side of ['near','far']){
      const leg=pose[side];assert.ok(Math.abs(distance(leg.hip,leg.knee)-R.UPPER_LEG)<1e-9);
      assert.ok(Math.abs(distance(leg.knee,leg.ankle)-R.LOWER_LEG)<1e-9);
      assert.ok(distance(leg.ankle,pose.controls[side+'Foot'])<1e-8);
    }
  }
});
test('A planted foot stays at a fixed world position while the character advances',()=>{
  const ratio=M.dimensions(1400).stride/M.dimensions(1400).width;
  const positions=[.04,.10,.20,.30,.45].map(p=>R.footAt(p,.543).x+p*ratio);
  assert.ok(Math.max(...positions)-Math.min(...positions)<1e-10);
  for(let i=0;i<1000;i++){
    const foot=R.footAt(i/1000,.543),w=.102*295/203;
    const sole=Math.max(-w*.28*Math.sin(foot.pitch)+.102*.36*Math.cos(foot.pitch),w*.72*Math.sin(foot.pitch)+.102*.36*Math.cos(foot.pitch));
    assert.ok(foot.y+sole<=R.GROUND+1e-10);
    if(foot.grounded)assert.ok(Math.abs(foot.y+sole-R.GROUND)<1e-10);
  }
});
test('The gait closes smoothly and advances between the former sprite frame boundaries',()=>{
  const a=R.poseAt('walk',15.99999),b=R.poseAt('walk',0),c=R.poseAt('walk',2.1),d=R.poseAt('walk',2.2);
  assert.ok(distance(a.near.knee,b.near.knee)<1e-5);assert.ok(distance(a.far.ankle,b.far.ankle)<1e-5);
  assert.ok(distance(c.near.knee,d.near.knee)>1e-5);
  const front=R.poseAt('walk',0).controls;assert.ok(front.nearUpper<0&&front.farUpper>0);
});
test('The superhero moves faster while keeping travel and gait in sync',()=>{
  const s=M.dimensions(1400);assert.ok(s.speed/s.width>=.60);assert.ok(s.speed/s.width<.8);
  assert.ok(Math.abs(s.stride/s.width-.43)<1e-10);
});
test('Stand and walk use the same textures, body scale and fully opaque palette',()=>{
  const doc={createElement(){const calls=[],ctx={globalAlpha:1,filter:'none',save(){},restore(){},scale(){},rotate(){},translate(){},clearRect(){},drawImage(image){calls.push({image,alpha:this.globalAlpha,filter:this.filter});}};return {width:0,height:0,style:{},dataset:{},getContext(){return ctx;},calls};}};
  const image={width:1254,height:1254},canvas=doc.createElement('canvas');canvas.width=384;
  R.paint(canvas,image,'idle',0,1,{document:doc,now:0,still:true});const idle=new Set(canvas.calls.map(c=>c.image));canvas.calls.length=0;
  R.paint(canvas,image,'walk',4.5,1,{document:doc,now:1000,still:true});
  assert.deepEqual(new Set(canvas.calls.map(c=>c.image)),idle);assert.ok(canvas.calls.every(c=>c.alpha===1&&c.filter==='none'));
  assert.equal(canvas.style.scale,'1 1');assert.equal(canvas.dataset.renderer,'joints');
  assert.equal(canvas.dataset.phase,'4.5');
});
