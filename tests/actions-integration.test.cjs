'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),M=require('../motion-core.js');
async function fixture(width=1400,height=900){
  class Element{
    constructor(){this.style={setProperty(){}};this.dataset={};this.children=[];this.listeners={};this.hidden=false;}
    append(...nodes){this.children.push(...nodes);}replaceChildren(...nodes){this.children=nodes;}
    setAttribute(name,value){this[name]=value;}addEventListener(name,fn){this.listeners[name]=fn;}
    attachShadow(){return new Element();}dispatchEvent(){}querySelector(){return null;}
    matches(){return false;}focus(){}remove(){}setPointerCapture(){}
  }
  const clock={now:0},motion={matches:false,addEventListener(){},removeEventListener(){}},pack={avatar:{name:'Tavi',color:'#165dde'},organization:{shortName:'TVA',greeting:'Hallo'},entries:[],categories:[],suggested:[]};
  const paints=[];
  const window={ChatAvatarMotion:M,ChatAvatarKnowledge:{validate:p=>p,active:()=>true,search:()=>[]},ChatAvatarArt:{preload:async()=>{},create:()=>new Element(),paint(...args){paints.push(args);}},addEventListener(){},removeEventListener(){}};
  const document={currentScript:{src:'https://example.invalid/avatar.js',dataset:{manual:'true'}},body:new Element(),hidden:false,createElement:()=>new Element(),addEventListener(){},removeEventListener(){}};
  const math=Object.create(Math);math.random=()=>.5;
  vm.runInNewContext(fs.readFileSync(require.resolve('../avatar.js'),'utf8'),{window,document,URL,innerWidth:width,innerHeight:height,performance:{now:()=>clock.now},Math:math,matchMedia:()=>motion,requestAnimationFrame:()=>1,cancelAnimationFrame(){},setTimeout:()=>1,clearTimeout(){},CustomEvent:class{},location:{protocol:'https:'}});
  const avatar=window.ChatAvatar.create({knowledge:pack});await avatar.ready;assert.equal(avatar.error,undefined);avatar.nextWalk=Infinity;
  function step(seconds){const count=Math.ceil(seconds/.02);for(let i=0;i<count;i++){clock.now+=20;avatar.tick(clock.now);}}
  return {avatar,motion,document,clock,step,paints};
}
test('Walking turns through real poses, starts gently, cruises at the same speed and settles before idle',async()=>{
  const {avatar,step,paints}=await fixture();
  avatar.setState('idle');assert.equal(avatar.walkTo(1000),true);
  assert.equal(paints.at(-1)[1],'walk-turn');assert.equal(paints.at(-1)[2],0);
  step(.3);assert.equal(paints.at(-1)[1],'walk-turn');assert.ok(paints.at(-1)[2]>.3&&paints.at(-1)[2]<.6);
  step(.4);assert.equal(paints.at(-1)[1],'walk');
  step(.6);assert.equal(avatar.velocity,avatar.size().speed);
  step(3);assert.ok(paints.some(p=>p[1]==='walk-stop'));
  assert.equal(avatar.state,'idle');assert.equal(avatar.x,1000);assert.equal(avatar.velocity,0);
  avatar.nextWalk=Infinity;assert.equal(avatar.walkTo(800),true);
  assert.equal(paints.at(-1)[1],'walk-start');
  step(.5);assert.equal(paints.at(-1)[1],'walk');
  avatar.setPaused(true);assert.equal(avatar.walkEntry,null);assert.equal(avatar.walkExit,null);
});
test('Manual flight completes once, lands safely and restores the normal sprite transform',async()=>{
  const {avatar,step}=await fixture();
  assert.equal(avatar.fly(),true);step(3.5);
  assert.equal(avatar.action,null);assert.equal(avatar.character.dataset.flightCount,'1');assert.equal(avatar.character.dataset.landingCount,'1');
  assert.equal(avatar.y,avatar.size().ground);assert.equal(avatar.sprite.style.transform,'none');
  assert.equal(avatar.cartwheel(),false);assert.equal(avatar.startAction('cartwheel'),false);step(2.8);
  assert.equal(avatar.action,null);assert.equal(avatar.character.dataset.cartwheelCount,undefined);assert.equal(avatar.character.dataset.landingCount,'1');
});
test('Chat and flight can interrupt the new walking transitions without leaving a delayed restart',async()=>{
  const {avatar,step}=await fixture();
  avatar.walkTo(800);step(.1);assert.ok(avatar.walkEntry);
  avatar.open();assert.equal(avatar.walkEntry,null);step(.8);assert.equal(avatar.opened,true);
  avatar.close();avatar.walkTo(800);step(.1);assert.ok(avatar.walkEntry);
  assert.equal(avatar.fly(),true);assert.equal(avatar.walkEntry,null);step(3.5);
  assert.equal(avatar.action,null);assert.equal(avatar.character.dataset.flightCount,'1');assert.equal(avatar.y,avatar.size().ground);
});
test('Automatic actions respect chat, dragging, pause, hidden pages and reduced motion',async()=>{
  const {avatar,motion,document,clock}=await fixture();
  for(const block of ['opened','paused','hidden','page','drag','reduced']){
    avatar.nextAction=0;avatar.nextWalk=Infinity;avatar.state='idle';
    avatar.opened=block==='opened';avatar.paused=block==='paused';avatar.hidden=block==='hidden';document.hidden=block==='page';avatar.drag=block==='drag'?{moved:false}:null;motion.matches=block==='reduced';
    clock.now+=100;avatar.tick(clock.now);assert.equal(avatar.action,null,block);
  }
  avatar.drag=null;motion.matches=false;avatar.nextAction=0;clock.now+=100;avatar.tick(clock.now);
  assert.equal(avatar.action.type,'fly');
});
test('Automatic flight waits before the next action and never schedules a cartwheel',async()=>{
  const {avatar,clock,step}=await fixture();avatar.nextAction=0;clock.now=20;avatar.tick(clock.now);step(6.4);
  assert.equal(avatar.character.dataset.flightCount,'1');assert.equal(avatar.character.dataset.cartwheelCount,undefined);
  assert.equal(avatar.action,null);assert.ok(avatar.nextAction>clock.now+40000);
});
test('Pausing cancels an airborne action immediately without leaving a rotated or floating avatar',async()=>{
  const {avatar,step}=await fixture();avatar.fly();step(.8);assert.ok(avatar.y>avatar.size().ground);
  avatar.setPaused(true);step(2);assert.equal(avatar.action,null);assert.equal(avatar.y,avatar.size().ground);
  assert.equal(avatar.sprite.style.transform,'none');assert.equal(avatar.character.dataset.flightCount,undefined);
});
test('Opening a chat during a flight cancels the action and lets the avatar land while the chat stays open',async()=>{
  const {avatar,step}=await fixture();avatar.fly();step(.8);avatar.open();
  assert.equal(avatar.action,null);assert.equal(avatar.opened,true);step(3);
  assert.equal(avatar.y,avatar.size().ground);assert.equal(avatar.opened,true);assert.equal(avatar.panel.hidden,false);
});
