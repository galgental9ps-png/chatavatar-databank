/* GPU motion interpolation. Each texture is moved into the intermediate pose first. */
(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.ChatAvatarWalkRenderer=api;
})(typeof window!=='undefined'?window:this,function(){
  'use strict';
  function framePlan(phase,count=16){
    const wrapped=((phase%count)+count)%count,current=Math.floor(wrapped);
    return {current,next:(current+1)%count,amount:wrapped-current};
  }
  function decode(data,decodeBase64){
    const raw=decodeBase64(data.vectors),count=data.frames*2*(data.grid+1)**2*2;
    if(raw.length!==count*2)throw Error('Invalid Tavi motion vectors');
    const values=new Float32Array(count);
    for(let i=0;i<count;i++){
      const value=raw.charCodeAt(i*2)|(raw.charCodeAt(i*2+1)<<8);
      values[i]=(value>32767?value-65536:value)/data.units;
    }
    return values;
  }
  function create(doc,data,decodeBase64){
    const canvas=doc.createElement('canvas');
    const gl=canvas.getContext('webgl',{alpha:true,premultipliedAlpha:true,antialias:false,depth:false,stencil:false,powerPreference:'low-power'});
    if(!gl||typeof gl.createShader!=='function')return null;
    const vertex=`attribute vec2 aPoint;attribute vec2 aMotion;
      uniform float uAmount;varying vec2 vPoint;
      void main(){vPoint=aPoint;vec2 p=aPoint+aMotion*uAmount;gl_Position=vec4(p.x*2.0-1.0,1.0-p.y*2.0,0.0,1.0);}`;
    const fragment=`precision mediump float;uniform sampler2D uAtlas;
      uniform vec2 uCell;uniform vec3 uAlign;uniform float uOpacity;uniform float uGrade;
      varying vec2 vPoint;
      void main(){vec2 p=(vPoint-uAlign.xy)/uAlign.z;
        if(p.x<0.002||p.y<0.002||p.x>0.998||p.y>0.998)discard;
        vec4 c=texture2D(uAtlas,(uCell+p)/4.0);
        if(uGrade>0.5){float l=dot(c.rgb,vec3(0.2126,0.7152,0.0722));c.rgb=clamp(((mix(vec3(l),c.rgb,1.18)-0.5)*1.08+0.5)*0.94,0.0,1.0);c.a=clamp((c.a-0.03)/0.84,0.0,1.0);}
        float alpha=c.a*uOpacity;gl_FragColor=vec4(c.rgb*alpha,alpha);}`;
    function shader(type,source){const s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error('Tavi shader compile failed');return s;}
    const program=gl.createProgram(),vs=shader(gl.VERTEX_SHADER,vertex),fs=shader(gl.FRAGMENT_SHADER,fragment);
    gl.attachShader(program,vs);gl.attachShader(program,fs);gl.linkProgram(program);
    if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error('Tavi shader link failed');
    gl.deleteShader(vs);gl.deleteShader(fs);gl.useProgram(program);
    const uniforms={};for(const name of ['uAtlas','uCell','uAlign','uAmount','uOpacity','uGrade'])uniforms[name]=gl.getUniformLocation(program,name);
    const pointAttribute=gl.getAttribLocation(program,'aPoint'),motionAttribute=gl.getAttribLocation(program,'aMotion');
    const grid=data.grid,vertices=(grid+1)**2,points=new Float32Array(vertices*2),indices=new Uint16Array(grid*grid*6);
    for(let y=0;y<=grid;y++)for(let x=0;x<=grid;x++){const p=(y*(grid+1)+x)*2;points[p]=x/grid;points[p+1]=y/grid;}
    let n=0;for(let y=0;y<grid;y++)for(let x=0;x<grid;x++){const a=y*(grid+1)+x,b=a+1,c=a+grid+1,d=c+1;indices.set([a,b,c,b,d,c],n);n+=6;}
    function buffer(type,values){const b=gl.createBuffer();gl.bindBuffer(type,b);gl.bufferData(type,values,gl.STATIC_DRAW);return b;}
    const pointBuffer=buffer(gl.ARRAY_BUFFER,points),indexBuffer=buffer(gl.ELEMENT_ARRAY_BUFFER,indices);
    const vectors=decode(data,decodeBase64),motionBuffers=[];
    for(let i=0;i<data.frames*2;i++)motionBuffers.push(buffer(gl.ARRAY_BUFFER,vectors.subarray(i*vertices*2,(i+1)*vertices*2)));
    const textures=new WeakMap();
    function texture(image){
      if(textures.has(image))return textures.get(image);
      const t=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,t);gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL,false);
      gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
      gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,image);textures.set(image,t);return t;
    }
    function render(image,phase,pixels,align,grade=false){
      const plan=framePlan(phase,data.frames);
      if(canvas.width!==pixels){canvas.width=canvas.height=pixels;}
      gl.viewport(0,0,pixels,pixels);gl.useProgram(program);gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT);
      gl.enable(gl.BLEND);gl.blendFunc(gl.ONE,gl.ONE_MINUS_SRC_ALPHA);
      gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,texture(image));gl.uniform1i(uniforms.uAtlas,0);gl.uniform1f(uniforms.uGrade,grade?1:0);
      gl.bindBuffer(gl.ARRAY_BUFFER,pointBuffer);gl.enableVertexAttribArray(pointAttribute);gl.vertexAttribPointer(pointAttribute,2,gl.FLOAT,false,0,0);
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,indexBuffer);
      function draw(index,motion,amount,opacity){
        gl.bindBuffer(gl.ARRAY_BUFFER,motionBuffers[motion]);gl.enableVertexAttribArray(motionAttribute);gl.vertexAttribPointer(motionAttribute,2,gl.FLOAT,false,0,0);
        gl.uniform2f(uniforms.uCell,index%4,Math.floor(index/4));gl.uniform3f(uniforms.uAlign,...align(index));
        gl.uniform1f(uniforms.uAmount,amount);gl.uniform1f(uniforms.uOpacity,opacity);gl.drawElements(gl.TRIANGLES,indices.length,gl.UNSIGNED_SHORT,0);
      }
      // A fully opaque base remains present throughout the morph.
      draw(plan.current,plan.current*2,plan.amount,1);
      if(plan.amount>0)draw(plan.next,plan.current*2+1,1-plan.amount,plan.amount);
      return canvas;
    }
    return {render};
  }
  return {create,framePlan,decode};
});
