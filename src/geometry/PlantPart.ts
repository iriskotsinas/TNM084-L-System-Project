import {vec3, vec4, mat4} from 'gl-matrix';
import Drawable from '../rendering/gl/Drawable';
import {gl} from '../globals';

class PlantPart extends Drawable {
  indices: Uint32Array;
  positions: Float32Array;
  normals: Float32Array;
  colors: Float32Array;
  center: vec4;

  translations: Float32Array;
  quaternions: Float32Array;
  scales: Float32Array;

  instances: number = 0;

  meshes: any;
  plantPart: string;
  color: vec4;
  model: mat4;

  constructor(center: vec3, meshes: any, plantPart: string, color: vec4, model: mat4) {
    super(); // Call the constructor of the super class. This is required.
    this.center = vec4.fromValues(center[0], center[1], center[2], 1);
    this.isInstanced = true;
    this.meshes = meshes;
    this.plantPart = plantPart;
    this.color = color;
    this.model = model;
  }

  setInstanceProperties(translations: number[], quaternions: number[], scales: number[], numInstances: number) {
    this.translations = new Float32Array(translations);
    this.quaternions = new Float32Array(quaternions);
    this.scales = new Float32Array(scales);
    this.instances = numInstances;
  }

  create() {
    let mesh: any = this.meshes[this.plantPart];

    let tempIndices: number[] = [];
    let tempPositions: number[] = [];
    let tempNormals: number[] = [];
    let tempColors: number[] = [];

    for(let i: number = 0; i < mesh.indices.length; ++i) {
      tempIndices.push(mesh.indices[i]);

      tempNormals.push(mesh.vertexNormals[i * 3]);
      tempNormals.push(mesh.vertexNormals[i * 3 + 1]);
      tempNormals.push(mesh.vertexNormals[i * 3 + 2]);
      tempNormals.push(0);

      tempPositions.push(mesh.vertices[i * 3]);
      tempPositions.push(mesh.vertices[i * 3 + 1]);
      tempPositions.push(mesh.vertices[i * 3 + 2]);
      tempPositions.push(1);

      tempColors.push(this.color[0]);
      tempColors.push(this.color[1]);
      tempColors.push(this.color[2]);
      tempColors.push(this.color[3]);
    }

    this.indices = new Uint32Array(tempIndices);
    this.normals = new Float32Array(tempNormals);
    this.positions = new Float32Array(tempPositions);
    this.colors = new Float32Array(tempColors);

    this.generateIdx();
    this.generatePos();
    this.generateNor();
    this.generateCol();
    this.generateTranslations();
    this.generateQuaternions();
    this.generateScales();

    this.count = this.indices.length;
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.bufIdx);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, this.indices, gl.STATIC_DRAW);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.bufNor);
    gl.bufferData(gl.ARRAY_BUFFER, this.normals, gl.STATIC_DRAW);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.bufPos);
    gl.bufferData(gl.ARRAY_BUFFER, this.positions, gl.STATIC_DRAW);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.bufCol);
    gl.bufferData(gl.ARRAY_BUFFER, this.colors, gl.STATIC_DRAW);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.bufTranslations);
    gl.bufferData(gl.ARRAY_BUFFER, this.translations, gl.STATIC_DRAW);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.bufQuaternions);
    gl.bufferData(gl.ARRAY_BUFFER, this.quaternions, gl.STATIC_DRAW);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.bufScales);
    gl.bufferData(gl.ARRAY_BUFFER, this.scales, gl.STATIC_DRAW);
  }
};

export default PlantPart;