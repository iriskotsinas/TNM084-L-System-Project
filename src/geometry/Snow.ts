import Draw from '../gl/Draw';
import {gl} from '../globals';

class Snow extends Draw {
  indices: Uint32Array;
  positions: Float32Array;
  snowPos: Float32Array;
  distance: number = 10;
  normals: Float32Array;

  constructor(distance: number, numInstances: number, offsets: Float32Array) {
    super();
    this.distance = distance;
    this.instances = numInstances;
    this.isInstanced = true;
    this.snowPos = offsets;
  }

  create() {
    this.indices = new Uint32Array([0, 1, 2,
                                    0, 2, 3]);

    this.positions = new Float32Array([-this.distance, 0, -this.distance, 1,
                                        this.distance, 0, -this.distance, 1,
                                          this.distance, 0, this.distance, 1,
                                      -this.distance, 0, this.distance, 1]);

    this.normals = new Float32Array([0, 0, 1, 0,
                                    0, 0, 1, 0,
                                    0, 0, 1, 0,
                                    0, 0, 1, 0]);

    this.generateIdx();
    this.generatePos();
    this.generateSnowPos();
    this.generateNor();

    this.count = this.indices.length;
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.bufIdx);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, this.indices, gl.STATIC_DRAW);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.bufPos);
    gl.bufferData(gl.ARRAY_BUFFER, this.positions, gl.STATIC_DRAW);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.bufNor);
    gl.bufferData(gl.ARRAY_BUFFER, this.normals, gl.STATIC_DRAW);

    // Set instance VBOs
    gl.bindBuffer(gl.ARRAY_BUFFER, this.bufSnowPos);
    gl.bufferData(gl.ARRAY_BUFFER, this.snowPos, gl.STATIC_DRAW);

    console.log(`Created snow`);
  }
};

export default Snow;