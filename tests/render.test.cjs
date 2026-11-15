'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const M=require('../motion-core.js');
async function artFixture(){
  const canvases=[];
  function canvas(){
    const calls=[],context={globalAlpha:1,globalCompositeOperation:'source-over',clearRect(){calls.push({clear:true});},drawImage(...args){calls.push({alpha:this.globalAlpha,composite:this.globalCompositeOperation,args});}};
    const result={style:{},dataset:{},width:0,height:0,setAttribute(){},getContext(){return context;},calls,context};canvases.push(result);return result;
  }
  class Image {
    set src(value){this.naturalWidth=400;this.naturalHeight=value.includes('walk')?200:400;queueMicrotask(()=>this.onload());}
    async decode(){}
  }
  const window={devicePixelRatio:1,ChatAvatarMotion:M};
  vm.runInNewContext(fs.readFileSync(require.resolve('../mascot.js'),'utf8'),{window,document:{currentScript:{src:'https://example.invalid/widget/mascot.js'},createElement:canvas},Image,URL,setTimeout,clearTimeout});
  await window.ChatAvatarArt.preload();
  return {art:window.ChatAvatarArt,canvas:window.ChatAvatarArt.create(),canvases};
}
test('Subframe gait progression is retained instead of rounding every step to one picture',()=>{
  const s=M.dimensions(1400);
  const a=M.gaitPhaseAtDistance(s.stride*.275,s.stride),b=M.gaitPhaseAtDistance(s.stride*.28,s.stride);
  assert.ok(b>a);assert.ok(b-a<1);assert.equal(Math.floor(a),Math.floor(b));
  const last=M.walkFramePlan(7.99999),first=M.walkFramePlan(0);
  assert.equal(last.next,first.current);assert.ok(last.blend>.999);assert.equal(first.blend,0);
});
test('Intermediate frames preserve opacity and use the following gait picture',async()=>{
  const {art,canvas}=await artFixture();canvas.calls.length=0;
  art.paint(canvas,'walk',2.9,1);
  const draws=canvas.calls.filter(c=>!c.clear);
  assert.equal(draws.length,2);assert.ok(draws.every(d=>d.alpha>0&&d.alpha<1));
  assert.equal(draws[0].alpha+draws[1].alpha,1);assert.equal(draws[1].composite,'lighter');
  assert.equal(draws[0].args[1],200);assert.equal(draws[1].args[1],300);
  assert.equal(canvas.context.globalAlpha,1);assert.equal(canvas.context.globalCompositeOperation,'source-over');
});
test('Unchanged standing and walking pictures are not repainted on every animation tick',async()=>{
  const {art,canvas}=await artFixture();const count=canvas.calls.length;
  for(let i=0;i<100;i++)art.paint(canvas,'idle',0,1);
  assert.equal(canvas.calls.length,count);
  art.paint(canvas,'walk',2.2,1);const walking=canvas.calls.length;
  for(let i=0;i<100;i++)art.paint(canvas,'walk',2.3,1);
  assert.equal(canvas.calls.length,walking);
});
test('The smoother renderer retains the corrected standing height and returns to sharp idle',async()=>{
  const {art,canvas}=await artFixture();art.paint(canvas,'walk',7.9,-1);art.paint(canvas,'idle',0,-1);
  const [sx,sy]=canvas.style.scale.split(' ').map(Number);
  assert.ok(sx<0);assert.ok(Math.abs(.955*sy-.915)<.0001);
  assert.equal(canvas.dataset.sheet,'poses');assert.equal(canvas.dataset.blend,'0');
  assert.equal(canvas.dataset.pose,'idle');
});

