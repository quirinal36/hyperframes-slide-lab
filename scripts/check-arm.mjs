import assert from 'node:assert/strict';
import {armPose,ELBOW} from '../public/assets/arm-model.mjs';
const start=armPose(0),middle=armPose(90),end=armPose(135);
for(const angle of [0,15,30,60,90,120,135]){
 const pose=armPose(angle);assert.ok(Math.abs(Math.hypot(pose.wrist[0],pose.wrist[1]-ELBOW[1],pose.wrist[2])-2.12)<1e-10,'Forearm bone length must remain constant');
 assert.ok(pose.bicepsLength>0&&pose.tricepsLength>0);
 if(angle>0){const previous=armPose(angle-1);assert.ok(pose.bicepsLength<previous.bicepsLength,'Flexion must shorten the modeled biceps path');assert.ok(pose.tricepsLength>previous.tricepsLength,'Flexion must lengthen the modeled triceps path')}
}
assert.ok(Math.abs(middle.wrist[1]-ELBOW[1])<1e-10);assert.ok(end.bicepsLength<start.bicepsLength);
for(const angle of [-1,136,NaN,Infinity])assert.throws(()=>armPose(angle),RangeError);
console.log('PASS: fixed forearm bone length, 90-degree geometry, opposing muscle path changes, angle validation.');
