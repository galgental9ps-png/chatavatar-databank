'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),M=require('../motion-core.js');
test('A full travel stride advances all sixteen poses and loops without skipping',()=>{
 const s=M.dimensions(1400),frames=Array.from({length:16},(_,i)=>M.frameAtDistance(s.stride*(i+.05)/16,s.stride));
 assert.deepEqual(frames,Array.from({length:16},(_,i)=>i));assert.equal(M.frameAtDistance(s.stride,s.stride),0);
});
test('Walking accelerates, decelerates and stops before either screen edge',()=>{
 const size=M.dimensions(1400);let state={x:300,target:600,velocity:0,distance:0},peak=0;
 assert.ok(M.walkStep(state,1/60,size).velocity<size.speed/4);
 for(let i=0;i<1200;i++){state=M.walkStep(state,1/60,size);peak=Math.max(peak,state.velocity);assert.ok(state.x>=300&&state.x<=600);if(state.arrived)break;}
 assert.ok(state.arrived);assert.ok(Math.abs(state.x-600)<.6);assert.ok(state.velocity<peak);
 state={x:150,target:0,velocity:0,distance:0};
 for(let i=0;i<1000;i++){state=M.walkStep(state,1/60,size);assert.ok(state.x>=0);if(state.arrived)break;}
 assert.ok(state.arrived);
});
test('An avatar standing at its destination never advances the gait',()=>{
 let state={x:20,target:20,velocity:0,distance:0};
 for(let i=0;i<100;i++)state=M.walkStep(state,i%2?1/60:1/120,M.dimensions(390));
 assert.equal(state.x,20);assert.equal(state.distance,0);assert.equal(state.velocity,0);assert.equal(M.frameAtDistance(state.distance,80),0);
});
test('The walking distance is stable across different display refresh rates',()=>{
 function simulate(fps){let s={x:0,target:1000,velocity:0,distance:0};for(let i=0;i<fps*3;i++)s=M.walkStep(s,1/fps,M.dimensions(1400));return s;}
 assert.ok(Math.abs(simulate(60).distance-simulate(120).distance)<1);
});
test('Dropping accelerates downward, lands exactly on the floor and reports impact',()=>{
 let s={y:350,velocity:0};const a=M.fallStep(s,1/60),b=M.fallStep(a,1/60);assert.ok(b.velocity>a.velocity);assert.ok(b.y<a.y);
 for(let i=0;i<180;i++){s=M.fallStep(s,1/60);assert.ok(s.y>=10);if(s.landed)break;}
 assert.equal(s.y,10);assert.equal(s.velocity,0);assert.ok(s.landed);assert.ok(s.impact>0);
});
test('Jumping rises before falling and returns to the floor without sinking',()=>{
 let s={y:10,velocity:440},peak=10,ascending=false,descending=false;
 for(let i=0;i<180;i++){s=M.jumpStep(s,1/60);peak=Math.max(peak,s.y);ascending ||= s.velocity>0;descending ||= s.velocity<0;assert.ok(s.y>=10);if(s.landed)break;}
 assert.ok(ascending&&descending);assert.ok(peak>70&&peak<110);assert.ok(s.landed);assert.equal(s.y,10);
});
test('Avatar dimensions adapt to phones and short embed windows',()=>{
 const full=M.dimensions(1400,1000),phone=M.dimensions(390,844),short=M.dimensions(300,160);
 assert.ok(phone.width<full.width);assert.ok(short.height+short.ground<=160);assert.equal(phone.width,phone.height);assert.ok(short.stride<full.stride);
});

