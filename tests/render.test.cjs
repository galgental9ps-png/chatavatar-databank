'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const M=require('../motion-core.js');
async function artFixture(options={}){
  const canvases=[];
  function canvas(){
    const calls=[],transforms=[],context={globalAlpha:1,globalCompositeOperation:'source-over',clearRect(){calls.push({clear:true});},drawImage(...args){calls.push({alpha:this.globalAlpha,composite:this.globalCompositeOperation,args});},save(){transforms.push(['save']);},restore(){transforms.push(['restore']);},translate(...args){transforms.push(['translate',...args]);},scale(...args){transforms.push(['scale',...args]);}};
    if(!options.noPixels){
      context.getImageData=()=>({data:new Uint8ClampedArray([21,55,133,253,200,180,160,1,245,245,245,255,80,130,210,128])});
      context.putImageData=pixels=>{context.prepared=Array.from(pixels.data);};
    }
    const result={style:{},dataset:{},width:0,height:0,setAttribute(){},getContext(){return context;},calls,context,transforms};canvases.push(result);return result;
  }
  class Image {
    set src(value){this.srcValue=value;this.naturalWidth=400;this.naturalHeight=400;queueMicrotask(()=>this.onload());}
    async decode(){}
  }
  const window={devicePixelRatio:1,ChatAvatarMotion:M,...options.globals};
  vm.runInNewContext(fs.readFileSync(require.resolve('../mascot.js'),'utf8'),{window,document:{currentScript:{src:'https://example.invalid/widget/mascot.js'},createElement:canvas},Image,URL,setTimeout,clearTimeout,atob});
  await window.ChatAvatarArt.preload();
  return {art:window.ChatAvatarArt,canvas:window.ChatAvatarArt.create(),canvases};
}
test('Subframe gait progression is retained instead of rounding every step to one picture',()=>{
  const s=M.dimensions(1400);
  const a=M.gaitPhaseAtDistance(s.stride*.2625,s.stride),b=M.gaitPhaseAtDistance(s.stride*.265,s.stride);
  assert.ok(b>a);assert.ok(b-a<1);assert.equal(Math.floor(a),Math.floor(b));
  assert.equal(M.frameAtDistance(s.stride*.99999,s.stride),15);
  assert.equal(M.gaitPhaseAtDistance(s.stride,s.stride),0);
});
test('Every fractional walking phase draws exactly one full-opacity pose in either direction',async()=>{
  const {art,canvas}=await artFixture();
  for(const facing of [1,-1])for(let frame=0;frame<16;frame++)for(const part of [0,.25,.5,.75,.98]){
    canvas.calls.length=0;art.paint(canvas,'idle',0,facing);canvas.calls.length=0;
    art.paint(canvas,'walk',frame+part,facing);
    const draws=canvas.calls.filter(c=>!c.clear);
    assert.equal(draws.length,1);assert.equal(draws[0].alpha,1);
    assert.equal(draws[0].composite,'source-over');
    assert.deepEqual(draws[0].args.slice(1,3),[frame%4*100,Math.floor(frame/4)*100]);
    assert.equal(canvas.dataset.blend,'0');
  }
});
test('Unchanged pictures are cached while consecutive walking poses still advance',async()=>{
  const {art,canvas}=await artFixture();const count=canvas.calls.length;
  for(let i=0;i<100;i++)art.paint(canvas,'idle',0,1);
  assert.equal(canvas.calls.length,count);
  art.paint(canvas,'walk',2.2,1);const walking=canvas.calls.length;
  for(let i=0;i<100;i++)art.paint(canvas,'walk',2.2,1);
  assert.equal(canvas.calls.length,walking);
  art.paint(canvas,'walk',3.2,1);assert.ok(canvas.calls.length>walking);
});
test('Source alpha is made solid without warming or darkening the original palette',async()=>{
  const {canvas,canvases}=await artFixture();
  const source=canvases.find(c=>c.context.prepared).context.prepared;
  assert.equal(source[3],255);assert.equal(source[7],0);assert.equal(source[11],255);
  assert.deepEqual(source.slice(0,3),[21,55,133]);
  assert.equal(canvas.context.filter,'none');
});
test('Only walking colors and edges are strengthened; standing artwork keeps its source colors',async()=>{
  const {canvases}=await artFixture();
  const source=word=>canvases.find(c=>c.context.prepared&&c.calls.some(d=>d.args?.[0]?.srcValue?.includes(word))).context.prepared;
  const idle=source('poses'),walk=source('walk');
  assert.deepEqual(idle.slice(0,3),[21,55,133]);
  assert.ok(walk[0]<idle[0]&&walk[1]<idle[1]);
  assert.ok(walk[2]>120);assert.equal(walk[3],255);assert.equal(walk[7],0);
  assert.ok(walk[15]>idle[15]);
});
test('Cached rig globals cannot replace the complete illustrated character',async()=>{
  const rendered=[];
  const globals={ChatAvatarRig:{paint(...args){rendered.push(args);}}};
  const {art,canvas}=await artFixture({globals});
  for(const state of ['idle','walk','held','fall','wave']){
    canvas.calls.length=0;art.paint(canvas,state,0,1);
    const draws=canvas.calls.filter(c=>!c.clear);assert.ok(draws.length<=1);
    assert.equal(canvas.dataset.renderer,'frames');assert.notEqual(canvas.dataset.sheet,'rig');
  }
  assert.equal(rendered.length,0);assert.deepEqual(Object.keys(art.images),['poses','walk']);
});
test('A device without motion interpolation still receives solid colored poses',async()=>{
  const globals={ChatAvatarWalkFlow:{frames:16},ChatAvatarWalkRenderer:{create(){return null;}}};
  const {art,canvas}=await artFixture({globals});art.paint(canvas,'walk',4.5,1);
  assert.equal(canvas.dataset.renderer,'frames');assert.equal(canvas.dataset.frame,'4');
  assert.equal(canvas.calls.at(-1).alpha,1);
});
test('The smoother renderer retains the corrected standing height and returns to sharp idle',async()=>{
  const {art,canvas}=await artFixture();art.paint(canvas,'walk',15.9,-1);art.paint(canvas,'idle',0,-1);
  const [sx,sy]=canvas.style.scale.split(' ').map(Number);
  assert.ok(sx<0);assert.ok(Math.abs(.955*sy-.915)<.0001);
  assert.equal(canvas.dataset.sheet,'poses');assert.equal(canvas.dataset.blend,'0');
  assert.equal(canvas.dataset.pose,'idle');
});
test('Left-facing poses counter-reflect just the logo and reuse the corrected atlas',async()=>{
  const {art,canvas,canvases}=await artFixture();
  const rightImage=canvas.calls.find(c=>!c.clear).args[0];
  art.paint(canvas,'idle',0,-1);
  const leftImage=canvas.calls.at(-1).args[0];
  assert.notEqual(leftImage,rightImage);assert.ok(canvases.includes(leftImage));
  assert.equal(canvas.dataset.facing,'left');assert.ok(Number(canvas.style.scale.split(' ')[0])<0);
  assert.equal(leftImage.transforms.filter(t=>t[0]==='scale'&&t[1]===-1&&t[2]===1).length,16);
  const corrections=leftImage.calls.slice(1);
  assert.equal(corrections.length,16);
  for(let i=0;i<16;i++){
    const [image,x,y,w,h,dx,dy,dw,dh]=corrections[i].args;
    assert.equal(image,rightImage);assert.ok(x>=i%4*100&&x+w<(i%4+1)*100);
    assert.ok(y>=Math.floor(i/4)*100&&y+h<(Math.floor(i/4)+1)*100);
    assert.ok(w<20&&h<12);assert.deepEqual([dx,dy,dw,dh],[x,y,w,h]);
  }
  const count=canvases.length;art.paint(canvas,'talk',0,-1);
  assert.equal(canvases.length,count);assert.equal(canvas.calls.at(-1).args[0],leftImage);
  art.paint(canvas,'idle',0,1);assert.equal(canvas.calls.at(-1).args[0],rightImage);
});
test('The walking loop changes from pose sixteen to one with full opacity and the corrected logo',async()=>{
  const {art,canvas}=await artFixture();canvas.calls.length=0;
  art.paint(canvas,'walk',15.99,-1);art.paint(canvas,'walk',16,-1);
  const draws=canvas.calls.filter(c=>!c.clear);
  assert.equal(draws.length,2);assert.equal(draws[0].args[0],draws[1].args[0]);
  assert.deepEqual(draws.map(d=>d.args.slice(1,3)),[[300,300],[0,0]]);
  assert.equal(draws[0].alpha,1);assert.equal(draws[1].alpha,1);
});

