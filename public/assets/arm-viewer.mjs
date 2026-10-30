import * as THREE from './vendor/three-0.160.0.module.min.js';
import { ELBOW, armPose, curvePoint } from './arm-model.mjs';

const canvas=document.querySelector('#arm'),box=document.querySelector('#model'),slider=document.querySelector('#angle'),play=document.querySelector('#play');
let renderer;
try{renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:true})}catch{document.querySelector('#error').style.display='block';throw new Error('WebGL unavailable')}
renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.outputColorSpace=THREE.SRGBColorSpace;
const scene=new THREE.Scene(),camera=new THREE.OrthographicCamera(-4,4,3,-3,.1,40);
camera.position.set(.55,-.4,10);camera.lookAt(.55,-.4,0);
scene.add(new THREE.HemisphereLight(0xd9e9ff,0x27354b,2.4));
const light=new THREE.DirectionalLight(0xffffff,3.1);light.position.set(3,5,6);scene.add(light);
const rim=new THREE.DirectionalLight(0x83adff,2);rim.position.set(-4,0,-3);scene.add(rim);
const root=new THREE.Group();scene.add(root);root.rotation.y=-.22;
const boneMaterial=new THREE.MeshStandardMaterial({color:0xe8dfcd,roughness:.52});
const tendonMaterial=new THREE.MeshStandardMaterial({color:0xf4c57c,roughness:.65});
const jointMaterial=new THREE.MeshStandardMaterial({color:0x91b6ff,roughness:.4});
const muscles=new THREE.Group();root.add(muscles);
const sphereGeometry=new THREE.SphereGeometry(1,24,16),cylinderGeometry=new THREE.CylinderGeometry(1,1,1,20);
function ball(parent,point,radius,material=boneMaterial){const mesh=new THREE.Mesh(sphereGeometry,material);mesh.position.set(...point);mesh.scale.setScalar(radius);parent.add(mesh);return mesh}
function bone(parent,a,b,radius){const mesh=new THREE.Mesh(cylinderGeometry,boneMaterial),from=new THREE.Vector3(...a),to=new THREE.Vector3(...b);mesh.position.copy(from).add(to).multiplyScalar(.5);mesh.scale.set(radius,from.distanceTo(to),radius);mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),to.sub(from).normalize());parent.add(mesh)}
bone(root,[0,1.8,0],ELBOW,.115);ball(root,[0,1.8,0],.22);ball(root,ELBOW,.22,jointMaterial);
const scapula=new THREE.BufferGeometry();scapula.setAttribute('position',new THREE.Float32BufferAttribute([-.8,2.1,-.18,.24,2.08,-.18,-.6,1.12,-.18],3));scapula.computeVertexNormals();
const plate=new THREE.Mesh(scapula,new THREE.MeshStandardMaterial({color:0xcfc9ba,side:THREE.DoubleSide,roughness:.7}));root.add(plate);
const forearm=new THREE.Group();forearm.position.set(...ELBOW);root.add(forearm);
bone(forearm,[.12,-.08,.08],[.13,-2.08,.08],.075);bone(forearm,[-.11,-.02,-.08],[-.1,-2.08,-.08],.07);
ball(forearm,[.12,-.09,.08],.12);ball(forearm,[-.11,.04,-.08],.14);
const hand=new THREE.Mesh(new THREE.BoxGeometry(.4,.48,.15),boneMaterial);hand.position.set(.02,-2.31,0);forearm.add(hand);
for(let i=0;i<4;i++){const x=-.13+i*.10;bone(forearm,[x,-2.5,0],[x,-2.77+Math.abs(i-1.5)*.04,0],.035);ball(forearm,[x,-2.5,0],.045)}
bone(forearm,[.22,-2.15,0],[.37,-2.38,0],.045);
const arcGeometry=new THREE.BufferGeometry();arcGeometry.setAttribute('position',new THREE.BufferAttribute(new Float32Array(43*3),3));
const arc=new THREE.Line(arcGeometry,new THREE.LineBasicMaterial({color:0x91b6ff,transparent:true,opacity:.7}));root.add(arc);
const guideGeometry=new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(...ELBOW),new THREE.Vector3(0,-1.95,0)]);
const guide=new THREE.Line(guideGeometry,new THREE.LineDashedMaterial({color:0x91b6ff,dashSize:.08,gapSize:.06,transparent:true,opacity:.35}));guide.computeLineDistances();root.add(guide);

// Fixed ring buffers avoid allocating new muscle geometry on every animation frame.
function muscle(color){
 const rings=48,sides=16,geometry=new THREE.BufferGeometry(),indices=[];
 geometry.setAttribute('position',new THREE.BufferAttribute(new Float32Array((rings+1)*(sides+1)*3),3));
 for(let i=0;i<rings;i++)for(let j=0;j<sides;j++){const a=i*(sides+1)+j,b=a+sides+1;indices.push(a,b,a+1,b,b+1,a+1)}geometry.setIndex(indices);
 const material=new THREE.MeshStandardMaterial({color,roughness:.55,metalness:.02,side:THREE.DoubleSide});
 const mesh=new THREE.Mesh(geometry,material);mesh.frustumCulled=false;muscles.add(mesh);
 const tendonGeometry=new THREE.BufferGeometry();tendonGeometry.setAttribute('position',new THREE.BufferAttribute(new Float32Array(49*3),3));
 const tendon=new THREE.Line(tendonGeometry,new THREE.LineBasicMaterial({color:0xf4c57c}));muscles.add(tendon);
 return {mesh,geometry,tendonGeometry,rings,sides};
}
const biceps=muscle(0xef8877),triceps=muscle(0xa88bdc),rest=armPose(0);
const shoulderAnchor=ball(root,[.18,1.9,.18],.065,tendonMaterial);
const radialAnchor=ball(forearm,[.16,-.42,.15],.065,tendonMaterial);
function updateMuscle(shape,control,radius){
 const positions=shape.geometry.attributes.position,tendons=shape.tendonGeometry.attributes.position;
 for(let i=0;i<=shape.rings;i++){
  const t=i/shape.rings,p=curvePoint(control,t),a=curvePoint(control,Math.max(0,t-.002)),b=curvePoint(control,Math.min(1,t+.002));
  const tangent=new THREE.Vector3(...b).sub(new THREE.Vector3(...a)).normalize();
  const normal=new THREE.Vector3(-tangent.y,tangent.x,0).normalize(),binormal=new THREE.Vector3().crossVectors(tangent,normal).normalize();
  const belly=Math.sin(Math.PI*Math.max(0,Math.min(1,(t-.12)/.70))),r=.025+radius*Math.pow(Math.max(0,belly),.8);
  tendons.setXYZ(i,...p);
  for(let j=0;j<=shape.sides;j++){const theta=j/shape.sides*Math.PI*2,offset=normal.clone().multiplyScalar(Math.cos(theta)*r).addScaledVector(binormal,Math.sin(theta)*r*.8);positions.setXYZ(i*(shape.sides+1)+j,p[0]+offset.x,p[1]+offset.y,p[2]+offset.z)}
 }
 positions.needsUpdate=true;tendons.needsUpdate=true;shape.geometry.computeVertexNormals();
}
let degrees=60,playing=false,phase=0,frame,previous=performance.now(),lastDirection=0;
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
function update(value){
 degrees=Math.max(0,Math.min(135,value));const pose=armPose(degrees);forearm.rotation.z=degrees*Math.PI/180;
 updateMuscle(biceps,pose.biceps,.245*Math.sqrt(rest.bicepsLength/pose.bicepsLength));
 updateMuscle(triceps,pose.triceps,.215*Math.sqrt(rest.tricepsLength/pose.tricepsLength));
 const arcPositions=arcGeometry.attributes.position;
 for(let i=0;i<43;i++){const a=degrees*Math.PI/180*i/42;arcPositions.setXYZ(i,.72*Math.sin(a),ELBOW[1]-.72*Math.cos(a),.30)}arcPositions.needsUpdate=true;
 slider.value=String(Math.round(degrees));document.querySelector('#degrees').textContent=Math.round(degrees)+'°';
 for(const [id,length,baseline] of [['bi',pose.bicepsLength,rest.bicepsLength],['tri',pose.tricepsLength,rest.tricepsLength]]){const ratio=length/baseline;document.querySelector('#'+id+'-length').textContent=Math.round(ratio*100)+'%';document.querySelector('#'+id+'-bar').style.transform=`scaleX(${Math.min(ratio/1.35,1)})`}
 canvas.dataset.angle=String(Math.round(degrees));return pose;
}
function stop(){playing=false;play.setAttribute('aria-pressed','false');play.textContent='자동 반복'}
function manual(value){stop();update(value);document.querySelector('#motion').textContent='각도 조절 중 · 두 근육의 모형 경로 길이를 비교해보세요.'}
slider.oninput=()=>manual(Number(slider.value));
document.querySelectorAll('[data-angle]').forEach(button=>button.onclick=()=>manual(Number(button.dataset.angle)));
play.onclick=()=>{if(playing){stop();return}phase=Math.acos(1-degrees/67.5);playing=true;lastDirection=0;play.setAttribute('aria-pressed','true');play.textContent='반복 정지';previous=performance.now()};
document.querySelector('#bones').onclick=event=>{muscles.visible=!muscles.visible;radialAnchor.visible=muscles.visible;shoulderAnchor.visible=muscles.visible;event.currentTarget.setAttribute('aria-pressed',String(!muscles.visible));document.querySelectorAll('.tag.bi,.tag.tri').forEach(tag=>tag.hidden=!muscles.visible);for(const id of ['humerus-tag','radius-tag','ulna-tag'])document.querySelector('#'+id).hidden=muscles.visible};
document.querySelector('#reset').onclick=()=>{root.rotation.set(0,-.22,0)};
let pointer;
canvas.onpointerdown=event=>{pointer={id:event.pointerId,x:event.clientX,y:event.clientY};canvas.setPointerCapture(event.pointerId)};
canvas.onpointermove=event=>{if(!pointer||event.pointerId!==pointer.id)return;const scale=canvas.getBoundingClientRect().width;root.rotation.y+=(event.clientX-pointer.x)/scale*5;root.rotation.x=THREE.MathUtils.clamp(root.rotation.x+(event.clientY-pointer.y)/scale*3,-.65,.65);pointer.x=event.clientX;pointer.y=event.clientY};
canvas.onpointerup=canvas.onpointercancel=()=>{pointer=undefined};
canvas.onkeydown=event=>{if(event.key==='ArrowLeft')root.rotation.y-=.15;else if(event.key==='ArrowRight')root.rotation.y+=.15;else if(event.key==='ArrowUp')manual(degrees+5);else if(event.key==='ArrowDown')manual(degrees-5);else return;event.preventDefault();event.stopPropagation()};
function fit(){const w=box.clientWidth,h=box.clientHeight;renderer.setSize(w,h,false);camera.left=-3.15*w/h;camera.right=3.15*w/h;camera.top=3.15;camera.bottom=-3.15;camera.updateProjectionMatrix()}
const observer=new ResizeObserver(fit);observer.observe(box);fit();update(60);
function label(id,point,offset,yOffset=-15,parent=root){const v=parent.localToWorld(new THREE.Vector3(...point)).project(camera),tag=document.querySelector(id);tag.style.left=Math.max(8,Math.min(box.clientWidth-130,(v.x*.5+.5)*box.clientWidth+offset))+'px';tag.style.top=Math.max(65,Math.min(box.clientHeight-65,(-v.y*.5+.5)*box.clientHeight+yOffset))+'px'}
function draw(now){
 const dt=Math.min((now-previous)/1000,.06);previous=now;
 if(playing&&!document.hidden){phase+=dt*(reduced.matches ? .4 : 1);update(67.5*(1-Math.cos(phase)));const direction=Math.sin(phase)>=0?1:-1;if(direction!==lastDirection){lastDirection=direction;document.querySelector('#motion').textContent=direction>0?'굽힘 · 이두근 경로는 짧아지고, 삼두근 경로는 길어집니다.':'폄 · 삼두근 경로는 짧아지고, 이두근 경로는 길어집니다.'}}
 root.updateMatrixWorld(true);label('#bi-tag',[.58,.85,.35],38);label('#tri-tag',[-.55,.85,0],-110);if(!muscles.visible){label('#humerus-tag',[0,1,0],35);label('#radius-tag',[.12,-1,.08],20,-38,forearm);label('#ulna-tag',[-.11,-1,-.08],20,24,forearm)}renderer.render(scene,camera);frame=requestAnimationFrame(draw);
}
frame=requestAnimationFrame(draw);
reduced.addEventListener('change',()=>{stop()});document.addEventListener('visibilitychange',()=>{if(document.hidden)stop()});
window.addEventListener('pagehide',()=>{cancelAnimationFrame(frame);observer.disconnect();scene.traverse(object=>{object.geometry?.dispose();if(object.material)for(const material of Array.isArray(object.material)?object.material:[object.material])material.dispose()});renderer.dispose()});
