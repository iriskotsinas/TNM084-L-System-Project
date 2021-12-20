import {vec3, quat} from 'gl-matrix';

class Turtle {
  position: vec3;
  heading: vec3;
  movingScale: vec3;
  height: number;
  up: vec3;
  quaternion: quat;
  level: number;

  constructor(position: vec3, heading: vec3, movingScale: vec3, height: number, up: vec3, quaternion: quat, level: number) {
    this.position = position;
    this.heading = heading;

    // to make branches smaller and smaller
    this.movingScale = movingScale;

    this.height = height;
    this.up = up;
    this.quaternion = quaternion;
    this.level = level;
  }

  toRadians(angle: number) {
    return Math.PI * angle / 180.0;
  }

  moveForward() {
    let moveAmount: vec3 = vec3.create();
    vec3.copy(moveAmount, this.heading);
    vec3.scale(moveAmount, moveAmount, this.height * this.movingScale[1]);

    this.movingScale[0] *= 0.95;
    this.movingScale[1] *= 0.95;
    this.movingScale[2] *= 0.95;

    vec3.add(this.position, this.position, moveAmount);
  }

  rotateVecByQuat(q: quat) {
    let result: vec3 = vec3.create();
    vec3.transformQuat(result, this.heading, q);
    return result;
  }

  // + and - rotation
  rotate(angle: number) {
    // quat - axis and angle to rotate
    let q: quat = quat.create();
    let rotAxis = vec3.fromValues(0.0, 0.0, 1.0);
    let rad = this.toRadians(angle);
    let randomChance = Math.random(); // random number between 0 and 1

    if (randomChance < 0.5){
        rotAxis = vec3.fromValues(0.0, 1.0, 0.0);  
    }

    vec3.normalize(rotAxis, rotAxis);

    quat.setAxisAngle(q, rotAxis, rad);
    quat.normalize(q, q);

    // Rotate turtle heading by the quaternion
    this.heading = this.rotateVecByQuat(q);
    vec3.normalize(this.heading, this.heading);

    // rotationTo: Sets a quaternion to represent the shortest rotation from one vector to another
    quat.rotationTo(this.quaternion, vec3.fromValues(0, 1, 0), this.heading);    
  }

  reverseAimY() {
    this.heading[1] = -this.heading[1];
    quat.rotationTo(this.quaternion, this.up, this.heading);
    quat.normalize(this.quaternion, this.quaternion);
  }

  copy() {
    let newPosition: vec3 = vec3.create();
    vec3.copy(newPosition, this.position);
    let newHeading: vec3 = vec3.create();
    vec3.copy(newHeading, this.heading);
    let newMovingScale: vec3 = vec3.create();
    vec3.copy(newMovingScale, this.movingScale);
    let newUp = vec3.create();
    vec3.copy(newUp, this.up);
    let newQuat = quat.create();
    quat.copy(newQuat, this.quaternion);

    let newTurtle: Turtle = new Turtle(newPosition, newHeading, newMovingScale, this.height, newUp, newQuat, this.level);
    return newTurtle;
  }
}

export default Turtle;