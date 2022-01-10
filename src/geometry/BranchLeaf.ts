import {mat4, vec4} from 'gl-matrix';
import Draw from '../gl/Draw';
import {gl} from '../globals';

class BranchLeaf extends Draw {
    indices: Uint32Array;
    positions: Float32Array;
    normals: Float32Array;
    colors: Float32Array;
    center: vec4;
    trans: Float32Array;
    quats: Float32Array;
    scales: Float32Array;
    instances: number = 0;
    meshes: any;
    part: string;
    color: vec4;
    model: mat4;

    constructor(center: vec4, meshes: any, part: string, color: vec4, translations: number[],
                quaternions: number[], scales: number[], numInstances: number) {
        super();
        this.center = vec4.fromValues(center[0], center[1], center[2], center[3]);
        this.isInstanced = true;
        this.meshes = meshes;
        this.part = part;
        this.color = color;
        this.model = mat4.create();

        // instance props
        this.trans = new Float32Array(translations);
        this.quats = new Float32Array(quaternions);
        this.scales = new Float32Array(scales);
        this.instances = numInstances;
    }

    create() {
      let mesh: any = this.meshes[this.part];
      let pos = [];
      let norm = [];
      let ind = [];
      let col = [];

      for (let i = 0; i < mesh.indices.length; i++) { 
        // vertices: an array containing the vertex values that correspond to each unique face index
        // (webgl-obj-loader documentation)
        pos.push(mesh.vertices[i * 3]);
        pos.push(mesh.vertices[i * 3 + 1]);
        pos.push(mesh.vertices[i * 3 + 2]);
        pos.push(1);

        col.push(this.color[0]);
        col.push(this.color[1]);
        col.push(this.color[2]);
        col.push(this.color[3]);

        // vertexNormals: an array containing the vertex normals that correspond
        // to each unique face index (webgl-obj-loader documentation)
        norm.push(mesh.vertexNormals[i * 3]);
        norm.push(mesh.vertexNormals[i * 3 + 1]);
        norm.push(mesh.vertexNormals[i * 3 + 2]);
        norm.push(0);

        // an array containing the indicies to be used in conjunction with
        // vertexNormals and vertices in order to draw the triangles that make up faces
        // (webgl-obj-loader documentation)
        ind.push(mesh.indices[i]);
      }

        this.indices = new Uint32Array(ind);
        this.positions = new Float32Array(pos);
        this.normals = new Float32Array(norm);
        this.colors = new Float32Array(col);

        this.generateIdx();
        this.generatePos();
        this.generateCol();
        this.generateNor();
        this.generateTranslations();
        this.generateQuaternions();
        this.generateScales();

        this.count = this.indices.length;
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.bufIdx);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, this.indices, gl.STATIC_DRAW);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.bufPos);
        gl.bufferData(gl.ARRAY_BUFFER, this.positions, gl.STATIC_DRAW);

        gl.bindBuffer(gl.ARRAY_BUFFER,this.bufNor);
        gl.bufferData(gl.ARRAY_BUFFER,this.normals,gl.STATIC_DRAW);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.bufCol);
        gl.bufferData(gl.ARRAY_BUFFER, this.colors, gl.STATIC_DRAW);
    
        gl.bindBuffer(gl.ARRAY_BUFFER, this.bufTranslations);
        gl.bufferData(gl.ARRAY_BUFFER, this.trans, gl.STATIC_DRAW);
    
        gl.bindBuffer(gl.ARRAY_BUFFER, this.bufQuaternions);
        gl.bufferData(gl.ARRAY_BUFFER, this.quats, gl.STATIC_DRAW);
    
        gl.bindBuffer(gl.ARRAY_BUFFER, this.bufScales);
        gl.bufferData(gl.ARRAY_BUFFER, this.scales, gl.STATIC_DRAW);
    
    }
};

export default BranchLeaf;