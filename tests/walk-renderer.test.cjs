'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const R=require('../walk-renderer.js');
function flowData(){const window={};vm.runInNewContext(fs.readFileSync(require.resolve('../walk-flow.js'),'utf8'),{window});return window.ChatAvatarWalkFlow;}
test('Walking interpolation traverses the final pose into the first continuously',()=>{
  assert.deepEqual(R.framePlan(15.75),{current:15,next:0,amount:.75});
  assert.deepEqual(R.framePlan(16),{current:0,next:1,amount:0});
  assert.deepEqual(R.framePlan(-.25),{current:15,next:0,amount:.75});
});
test('The shipped movement data covers both directions of every transition with bounded finite vectors',()=>{
  const data=flowData(),vectors=R.decode(data,atob),points=(data.grid+1)**2;
  assert.equal(data.frames,16);assert.equal(vectors.length,16*2*points*2);
  assert.ok(vectors.some(v=>Math.abs(v)>.02));
  assert.ok(vectors.every(v=>Number.isFinite(v)&&Math.abs(v)<=40/256));
  for(let frame=0;frame<32;frame++)for(let x=0;x<=data.grid;x++){
    assert.equal(vectors[(frame*points+x)*2],0);
    assert.equal(vectors[(frame*points+data.grid*(data.grid+1)+x)*2],0);
  }
  assert.throws(()=>R.decode({...data,vectors:data.vectors.slice(4)},atob),/Invalid/);
});
test('No WebGL support leaves the regular canvas renderer available',()=>{
  assert.equal(R.create({createElement(){return {getContext(){return null;}};}},flowData(),atob),null);
});
test('The GPU keeps a full-opacity base while both images move into the same intermediate pose',()=>{
  const uniforms=[],draws=[],gl={};let current={};
  for(const name of ['createShader','createProgram','createBuffer','createTexture'])gl[name]=()=>({});
  for(const name of ['shaderSource','compileShader','attachShader','linkProgram','deleteShader','useProgram','bindBuffer','bufferData','bindTexture','pixelStorei','texParameteri','texImage2D','viewport','clearColor','clear','enable','blendFunc','activeTexture','uniform1i','enableVertexAttribArray','vertexAttribPointer'])gl[name]=()=>{};
  gl.getShaderParameter=gl.getProgramParameter=()=>true;gl.getUniformLocation=(_,n)=>n;gl.getAttribLocation=(_,n)=>n;
  gl.uniform1f=(name,value)=>{uniforms.push([name,value]);current[name]=value;};gl.uniform2f=gl.uniform3f=()=>{};
  gl.drawElements=()=>draws.push({...current});
  const canvas={getContext(){return gl;}},renderer=R.create({createElement(){return canvas;}},flowData(),atob);
  renderer.render({},3.25,192,()=>[0,0,1]);
  assert.equal(draws.length,2);assert.equal(draws[0].uOpacity,1);assert.equal(draws[1].uOpacity,.25);
  assert.equal(draws[0].uAmount,.25);assert.equal(draws[1].uAmount,.75);
  assert.ok(uniforms.every(([,v])=>Number.isFinite(v)));
});
