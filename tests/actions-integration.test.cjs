'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),M=require('../motion-core.js'),P=require('../personality-core.js');
async function fixture(width=1400,height=900){
  class Element{
    constructor(){this.style={setProperty(){}};this.dataset={};this.children=[];this.listeners={};this.hidden=false;}
    append(...nodes){this.children.push(...nodes);}replaceChildren(...nodes){this.children=nodes;}
    setAttribute(name,value){this[name]=value;}addEventListener(name,fn){this.listeners[name]=fn;}
    attachShadow(){return new Element();}dispatchEvent(){}querySelector(){return null;}
    matches(){return false;}focus(){}remove(){}setPointerCapture(){}removeEventListener(){}
  }
  const clock={now:0},motion={matches:false,addEventListener(){},removeEventListener(){}},pack={avatar:{name:'Tavi',color:'#165dde'},organization:{shortName:'TVA',greeting:'Hallo'},entries:[],categories:[],suggested:[]};
  const paints=[],spoken=[],timers=new Map();let timerId=0;
  const speech={speaking:false,cancel(){this.speaking=false;},speak(line){spoken.push(line);}};
  const window={ChatAvatarMotion:M,ChatAvatarPersonality:P,speechSynthesis:speech,ChatAvatarKnowledge:{validate:p=>p,active:()=>true,stale:()=>false,search:()=>[]},ChatAvatarArt:{preload:async()=>{},create:()=>new Element(),paint(...args){paints.push(args);}},addEventListener(){},removeEventListener(){}};
  const document={currentScript:{src:'https://example.invalid/avatar.js',dataset:{manual:'true'}},body:new Element(),hidden:false,createElement:()=>new Element(),addEventListener(){},removeEventListener(){}};
  const math=Object.create(Math);math.random=()=>.5;
  vm.runInNewContext(fs.readFileSync(require.resolve('../avatar.js'),'utf8'),{window,document,URL,innerWidth:width,innerHeight:height,performance:{now:()=>clock.now},Math:math,matchMedia:()=>motion,requestAnimationFrame:()=>1,cancelAnimationFrame(){},setTimeout:(fn,delay)=>{timers.set(++timerId,{fn,delay});return timerId;},clearTimeout:id=>timers.delete(id),speechSynthesis:speech,SpeechSynthesisUtterance:class{constructor(text){this.text=text;}},CustomEvent:class{},location:{protocol:'https:'}});
  const avatar=window.ChatAvatar.create({knowledge:pack});await avatar.ready;assert.equal(avatar.error,undefined);avatar.nextWalk=avatar.nextHop=avatar.nextGesture=avatar.nextChatter=Infinity;
  function step(seconds){const count=Math.ceil(seconds/.02);for(let i=0;i<count;i++){clock.now+=20;avatar.tick(clock.now);}}
  return {avatar,motion,document,clock,step,paints,timers,spoken,speech};
}
test('Walking turns through real poses, starts gently, cruises at the same speed and settles before idle',async()=>{
  const {avatar,step,paints}=await fixture();
  avatar.setState('idle');assert.equal(avatar.walkTo(1000),true);
  assert.equal(paints.at(-1)[1],'walk-turn');assert.equal(paints.at(-1)[2],0);
  step(.2);assert.equal(paints.at(-1)[1],'walk-turn');assert.ok(paints.at(-1)[2]>.3&&paints.at(-1)[2]<.6);
  step(.4);assert.equal(paints.at(-1)[1],'walk');
  step(.6);assert.equal(avatar.velocity,avatar.size().speed);
  step(3);assert.ok(paints.some(p=>p[1]==='walk-stop'));
  assert.equal(avatar.state,'idle');assert.equal(avatar.x,1000);assert.equal(avatar.velocity,0);
  avatar.nextWalk=Infinity;assert.equal(avatar.walkTo(800),true);
  assert.equal(paints.at(-1)[1],'walk-start');
  step(.5);assert.equal(paints.at(-1)[1],'walk');
  avatar.setPaused(true);assert.equal(avatar.walkEntry,null);assert.equal(avatar.walkExit,null);
});
test('Turning flows into the stride without a second stop or speed drop',async()=>{
  for(const facing of [1,-1]){
    const {avatar,step}=await fixture();avatar.x=300;avatar.facing=facing;avatar.walkTo(900);
    const samples=[];
    for(let i=0;i<40;i++){const x=avatar.x;step(.02);samples.push({entry:Boolean(avatar.walkEntry),travel:avatar.x-x,velocity:avatar.velocity});}
    const end=samples.findIndex((s,i)=>i>0&&!s.entry&&samples[i-1].entry);
    assert.ok(end>0);assert.ok(samples[end-1].travel>0,'Already moving while finishing the turn');
    assert.ok(samples[end].velocity>avatar.size().speed*.5,'No second acceleration from rest');
    assert.ok(samples[end+1].travel>=samples[end].travel*.95,'The first stride continues moving without a pause');
    assert.ok(samples[end+1].velocity>=samples[end].velocity);
  }
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
  assert.equal(avatar.action,null);assert.ok(avatar.nextAction>clock.now+30000);
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

test('A due little hop runs automatically, lands and gives the next hop a rest',async()=>{
  const {avatar,clock,step}=await fixture();avatar.nextAction=Infinity;avatar.nextHop=0;
  clock.now=20;avatar.tick(clock.now);assert.equal(avatar.state,'crouch');
  step(2);assert.equal(avatar.y,avatar.size().ground);assert.equal(avatar.character.dataset.landingCount,'1');
  assert.ok(avatar.nextHop>clock.now+8000);assert.equal(avatar.character.dataset.cartwheelCount,undefined);
  const tiny=await fixture(200,80);assert.equal(tiny.avatar.jump(),false);
});
test('Friendly asides stay quiet during reading, pause, dragging, hiding and reduced motion',async()=>{
  const {avatar,motion,document}=await fixture();
  for(const key of ['opened','paused','hidden','drag']){avatar[key]=true;assert.equal(avatar.showChatter(),false,key);avatar[key]=false;}
  document.hidden=true;assert.equal(avatar.showChatter(),false);document.hidden=false;
  motion.matches=true;assert.equal(avatar.showChatter(),false);motion.matches=false;
  avatar.chatterEnabled=false;assert.equal(avatar.showChatter(),false);
  avatar.nextChatter=0;avatar.nextAction=Infinity;avatar.nextHop=0;avatar.opened=true;avatar.tick(100000);
  assert.equal(avatar.tip.hidden,true);assert.equal(avatar.state,'idle');
});
test('Replacing a bubble removes old expiry and expiry never cancels a flight',async()=>{
  const {avatar,timers}=await fixture();avatar.showChatter('greeting');const old=avatar.bubbleTimer;
  avatar.showChatter('idle',{replace:true});assert.equal(timers.has(old),false);
  assert.equal(avatar.fly(),true);const plan=avatar.action;
  timers.get(avatar.bubbleTimer).fn();assert.equal(avatar.action,plan);assert.equal(avatar.tip.hidden,true);
});
test('Tapping a knowledge bubble still selects its topic after the bubble is cleared',async()=>{
  const {avatar}=await fixture();
  avatar.pack.entries=[{id:'kids',question:'Kinderkurse?',answer:'Ein Thema für kleine Entdecker.',links:[],suggestions:[]}];avatar.pack.suggested=['kids'];
  assert.equal(avatar.showTip(),true);avatar.tip.listeners.click();
  assert.equal(avatar.opened,true);assert.equal(avatar.current,'kids');assert.equal(avatar.tip.hidden,true);
});
test('Speech starts only after opting in, and automatic chatter does not interrupt current speech',async()=>{
  const {avatar,spoken,speech}=await fixture();
  avatar.showChatter('greeting');assert.equal(spoken.length,0);
  avatar.voice=true;avatar.hideTip();assert.equal(avatar.showChatter('encourage'),true);
  assert.equal(spoken.length,1);assert.equal(spoken[0].lang,'de-DE');assert.ok(spoken[0].rate<1);
  speech.speaking=true;assert.equal(avatar.showChatter('idle',{replace:true}),false);assert.equal(spoken.length,1);
  avatar.open();const voice=avatar.panel.children.at(-1).children[1];
  voice.onclick();assert.equal(avatar.voice,false);voice.onclick();assert.equal(avatar.voice,true);assert.ok(P.lines.greeting.includes(spoken.at(-1).text));
});
test('Ambient chatter can be switched off while a requested line still works without movement',async()=>{
  const {avatar}=await fixture();avatar.open();const chatter=avatar.panel.children.at(-1).children[2];
  chatter.onclick();assert.equal(avatar.chatterEnabled,false);avatar.opened=false;
  assert.equal(avatar.showChatter(),false);avatar.setPaused(true);
  assert.equal(avatar.showChatter('idle',{userInitiated:true}),true);assert.equal(avatar.state,'idle');
});
