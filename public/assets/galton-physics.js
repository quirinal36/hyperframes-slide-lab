/* Matter.js Galton board. Counts come from physical arrivals, never preset bins. */
(function(root){
 const M=typeof module==='object'&&module.exports?require('./vendor/matter-0.20.0.min.js'):root.Matter;
 class GaltonExperiment {
  constructor(seed=20261028,total=1200){
   if(!Number.isInteger(total)||total<1||total>1800)throw new RangeError('Ball count must be an integer from 1 to 1800.');
   this.total=total;this.ballRadius=2.2;
   this.seed=seed>>>0;this.tick=0;this.balls=[];this.counts=Array(14).fill(0);this.arrived=0;this.completeAt=null;this.done=false;
   this.engine=M.Engine.create({enableSleeping:true});this.engine.gravity.y=1;
   this.center=1200;this.spacing=42;this.left=906;this.binTop=564;this.floor=812;
   this.pins=[];this.walls=[];this.caps=[];
   const statics=[];
   for(let row=0;row<13;row++)for(let col=0;col<=row;col++){
    const pin={x:this.center+(col-row/2)*this.spacing,y:200+row*28};this.pins.push(pin);
    statics.push(M.Bodies.circle(pin.x,pin.y,6,{isStatic:true,friction:0,restitution:.25}));
   }
   const wall=(x1,y1,x2,y2,width=4)=>{
    this.walls.push({x1,y1,x2,y2});statics.push(M.Bodies.rectangle((x1+x2)/2,(y1+y2)/2,Math.hypot(x2-x1,y2-y1),width,{isStatic:true,angle:Math.atan2(y2-y1,x2-x1),friction:.05,restitution:.15}));
   };
   wall(1178,145,906,564);wall(1222,145,1494,564);
   // Sloped caps prevent balls from resting on the flat tops of bin dividers.
   for(let col=0;col<=14;col++){
    const x=this.left+col*42;wall(x,this.binTop,x,this.floor,3);
    const cap=M.Bodies.fromVertices(x,this.binTop-1,[{x:-3,y:4},{x:3,y:4},{x:1,y:-6}],{isStatic:true,friction:0,restitution:.1});
    this.caps.push(cap);statics.push(cap);
   }
   wall(this.left,this.floor,1494,this.floor,6);
   M.Composite.add(this.engine.world,statics);
  }
  random(){let x=this.seed+=0x6D2B79F5;x=Math.imul(x^x>>>15,x|1);x^=x+Math.imul(x^x>>>7,x|61);return ((x^x>>>14)>>>0)/4294967296}
  // Keep balls awake on pins; enable sleeping only after they enter a collection bin.
  spawn(){
   const body=M.Bodies.circle(this.center+(this.random()-.5)*18,145,this.ballRadius,{restitution:.25,friction:.015,frictionAir:.035,density:.002,sleepThreshold:Infinity});
   M.Body.setVelocity(body,{x:(this.random()-.5)*.4,y:0});
   this.balls.push({body,bin:null});M.Composite.add(this.engine.world,body);
  }
  step(){
   if(this.done)return;
   if(this.tick%4===0&&this.balls.length<this.total)this.spawn();
   M.Engine.update(this.engine,1000/120);this.tick++;
   for(const ball of this.balls)if(ball.bin===null&&ball.body.position.y>this.binTop+18){
    const bin=Math.floor((ball.body.position.x-this.left)/this.spacing);
    if(bin>=0&&bin<14){ball.body.sleepThreshold=45;ball.bin=bin;this.counts[bin]++;this.arrived++}
   }
   if(this.arrived===this.total){if(this.completeAt===null)this.completeAt=this.tick;this.done=this.tick-this.completeAt>=360}
  }
  summary(){
   const mean=this.arrived?this.counts.reduce((sum,n,i)=>sum+n*i,0)/this.arrived:null;
   const variance=this.arrived?this.counts.reduce((sum,n,i)=>sum+n*(i-mean)**2,0)/this.arrived:null;
   return {released:this.balls.length,arrived:this.arrived,counts:[...this.counts],mean,variance,done:this.done};
  }
 }
 if(typeof module==='object'&&module.exports)module.exports=GaltonExperiment;else root.GaltonExperiment=GaltonExperiment;
})(typeof globalThis!=='undefined'?globalThis:this);
