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
test('Starting a walk eases out of standing for a quarter-second without changing cruising speed',async()=>{
  const {avatar,step,paints}=await fixture();
  avatar.setState('idle');assert.equal(avatar.walkTo(200),true);
  assert.equal(paints.at(-1)[5].from,'idle');assert.equal(paints.at(-1)[5].progress,0);
  step(.12);assert.ok(paints.at(-1)[5].progress>.4&&paints.at(-1)[5].progress<.6);
  step(.14);assert.equal(paints.at(-1)[5],null);
  step(.6);assert.equal(avatar.velocity,avatar.size().speed);assert.equal(paints.at(-1)[5],null);
  avatar.setPaused(true);assert.equal(avatar.walkEntry,null);
});
test('Manual flight completes once, lands safely and restores the normal sprite transform',async()=>{
  const {avatar,step}=await fixture();
  assert.equal(avatar.fly(),true);step(3.5);
  assert.equal(avatar.action,null);assert.equal(avatar.character.dataset.flightCount,'1');assert.equal(avatar.character.dataset.landingCount,'1');
  assert.equal(avatar.y,avatar.size().ground);assert.equal(avatar.sprite.style.transform,'none');
  assert.equal(avatar.cartwheel(),false);assert.equal(avatar.startAction('cartwheel'),false);step(2.8);
  assert.equal(avatar.action,null);assert.equal(avatar.character.dataset.cartwheelCount,undefined);assert.equal(avatar.character.dataset.landingCount,'1');
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
