import {vec3, quat} from 'gl-matrix';
import LSystem from './LSystem';
import { Node } from './LSystem'
import Turtle from './Turtle';

var kdTree = require('k-d-tree');

var distance = function(a: any, b: any){
  return Math.sqrt(Math.pow(a.coordinates[0] - b.coordinates[0], 2) +  Math.pow(a.coordinates[1] - b.coordinates[1], 2) + Math.pow(a.coordinates[2] - b.coordinates[2], 2));
}

class Tree {
  translationBranch: number[] = [];
  quaternionsBranch: number[] = [];
  scalesBranch: number[] = [];
  instanceCountBranch: number = 0;

  translationsLeaf: number[] = [];
  quaternionsLeaf: number[] = [];
  scalesLeaf: number[] = [];
  instanceCountLeaf: number = 0;

  lSystem: LSystem;
  meshes: any;
  n: number;
  angle: number = 20;
  
  nearestTree = new kdTree([], distance);

  collisionCheck: boolean = false;

  constructor(lSystem: LSystem, meshes: any, n: number) {
    this.lSystem = lSystem;
    this.meshes = meshes;
    this.n = n;
  }

  generateRandomAngle() {
    var angle = Math.random() * 180 / Math.PI;
    console.log("angle", angle);
    return angle * 1.2;
}

  findStartHeight() {
    let minY = this.meshes["branch"].vertices[0];
    let maxY = this.meshes["branch"].vertices[0];

    for (let i: number = 0; i < this.meshes["branch"].vertices.length; i += 3) {
      if(this.meshes["branch"].vertices[i+1] < minY) {
        minY = this.meshes["branch"].vertices[i+1];
      }

      if(this.meshes["branch"].vertices[i+1] > maxY) {
        maxY = this.meshes["branch"].vertices[i+1];
      }
    }
    return maxY - minY;
  }

  createTree() {
    let lSystemNode: Node = this.lSystem.createLSystemString(this.n);
    let turtles: Array<Turtle> = [];
    let startHeight = this.findStartHeight();
    let turtle: Turtle = new Turtle(vec3.fromValues(0, 0, 0), vec3.fromValues(0, 1, 0), vec3.fromValues(5, 2.2, 5),
                         startHeight, vec3.fromValues(0, 1, 0), quat.fromValues(0, 0, 0, 1), 0);
    turtles.push(turtle);

    let node = lSystemNode;
    while(node != null) {
      let cur: string = node.value;
      node = node.next;

      if (cur === "F") {
        // Check if as small as can be
        if (turtle.movingScale[0] < 0.03) {
          continue;
        }

        if(turtle.movingScale[1] < 0 && turtle.level < 8) {
          turtle.reverseAimY();
        }

        this.translationBranch.push(turtle.position[0], turtle.position[1], turtle.position[2], 0);
        this.quaternionsBranch.push(turtle.quaternion[0], turtle.quaternion[1], turtle.quaternion[2], turtle.quaternion[3]);
        this.scalesBranch.push(turtle.movingScale[0], turtle.movingScale[1], turtle.movingScale[2], 1);
        this.instanceCountBranch += 1
        turtle.moveForward();

      } else if (cur === "-") {
        turtle.rotate(-30);

      } else if (cur === "+") {
        turtle.rotate(30);

      } else if (cur === "[") {
        let newTurtle: Turtle = turtle.copy();
        newTurtle.level += 1;
        turtles.push(newTurtle);

        turtle.movingScale[0] *= 0.7;
        turtle.movingScale[1] *= 1.0;
        turtle.movingScale[2] *= 0.7;

      } else if (cur == "]") {
        turtle = turtles.pop();

        // looks nice
        turtle.rotate(20);

      // Add leafs
      } else if(cur == "*") {

        // Should skip if at the end
        if (turtle.movingScale[0] < 0.02) {
          continue;
        }

        if(turtle.level > (1.0/3.0) * this.n) {
          var flowerCoord = {
            coordinates: [turtle.position[0], turtle.position[1], turtle.position[2]]
          };

          var nearest = this.nearestTree.nearest(flowerCoord, 1, 5.0);

          if(nearest.length == 0 || !this.collisionCheck) {
            this.translationsLeaf.push(turtle.position[0], turtle.position[1], turtle.position[2], 0);
            this.quaternionsLeaf.push(turtle.quaternion[0], turtle.quaternion[1], turtle.quaternion[2], turtle.quaternion[3]);
            this.scalesLeaf.push(0.5,0.5,0.5,1);
            this.instanceCountLeaf += 1;
  
            this.nearestTree.insert(flowerCoord);
          }
        }
      }
    }
  }
};

export default Tree;