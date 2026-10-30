export const ELBOW = [0, -.65, 0];
export function forearmPoint(point, degrees) {
  const a = degrees * Math.PI / 180, c = Math.cos(a), s = Math.sin(a);
  return [point[0]*c-point[1]*s, ELBOW[1]+point[0]*s+point[1]*c, point[2]];
}
export function curvePoint(control, t) {
  const u=1-t;
  return [0,1,2].map(i=>u*u*u*control[0][i]+3*u*u*t*control[1][i]+3*u*t*t*control[2][i]+t*t*t*control[3][i]);
}
export function curveLength(control) {
  let total=0, previous=control[0];
  for(let i=1;i<=40;i++){const p=curvePoint(control,i/40);total+=Math.hypot(...p.map((v,j)=>v-previous[j]));previous=p}
  return total;
}
export function armPose(degrees) {
  if(!Number.isFinite(degrees)||degrees<0||degrees>135)throw new RangeError('Model angle must be 0–135 degrees');
  const biceps=[[.18,1.9,.18],[.58,1.35,.18],[.58,0,.18],forearmPoint([.16,-.42,.15],degrees)];
  const triceps=[[-.25,1.63,-.04],[-.55,1,-.04],[-.55,-.35,-.04],forearmPoint([-.18,.16,-.04],degrees)];
  return {degrees, wrist:forearmPoint([0,-2.12,0],degrees), biceps, triceps, bicepsLength:curveLength(biceps), tricepsLength:curveLength(triceps)};
}
