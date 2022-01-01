import {vec3, vec4, mat4, mat3} from 'gl-matrix';
import Drawable from './Drawable';
import {gl} from '../globals';

var activeProgram: WebGLProgram = null;

export class Shader {
  shader: WebGLShader;

  constructor(type: number, source: string) {
    this.shader = gl.createShader(type);
    gl.shaderSource(this.shader, source);
    gl.compileShader(this.shader);

    if (!gl.getShaderParameter(this.shader, gl.COMPILE_STATUS)) {
      throw gl.getShaderInfoLog(this.shader);
    }
  }
};

class ShaderProgram {
  prog: WebGLProgram;

  attrPos: number;
  attrNor: number;
  attrCol: number;
  attrSnowPos : number;

  attrTranslation: number;
  attrQuaternion: number;
  attrScale: number;

  unifModel: WebGLUniformLocation;
  unifModelInvTr: WebGLUniformLocation;
  unifViewProj: WebGLUniformLocation;
  unifColor: WebGLUniformLocation;
  unifTime: WebGLUniformLocation;
  unifCameraAxes: WebGLUniformLocation;
  unifRef: WebGLUniformLocation;
  unifEye: WebGLUniformLocation;
  unifUp: WebGLUniformLocation;
  unifDimensions: WebGLUniformLocation;

  unifIsInstance: WebGLUniformLocation;

  constructor(shaders: Array<Shader>) {
    this.prog = gl.createProgram();

    for (let shader of shaders) {
      gl.attachShader(this.prog, shader.shader);
    }
    gl.linkProgram(this.prog);
    if (!gl.getProgramParameter(this.prog, gl.LINK_STATUS)) {
      throw gl.getProgramInfoLog(this.prog);
    }

    this.attrPos = gl.getAttribLocation(this.prog, "vs_Pos");
    this.attrNor = gl.getAttribLocation(this.prog, "vs_Nor");
    this.attrCol = gl.getAttribLocation(this.prog, "vs_Col");
    this.attrSnowPos = gl.getAttribLocation(this.prog,"vs_SnowPos");

    this.attrTranslation = gl.getAttribLocation(this.prog, "vs_Translation");
    this.attrQuaternion = gl.getAttribLocation(this.prog, "vs_Quaternion");
    this.attrScale = gl.getAttribLocation(this.prog, "vs_Scale");

    this.unifModel      = gl.getUniformLocation(this.prog, "u_Model");
    this.unifModelInvTr = gl.getUniformLocation(this.prog, "u_ModelInvTr");
    this.unifViewProj   = gl.getUniformLocation(this.prog, "u_ViewProj");
    this.unifColor      = gl.getUniformLocation(this.prog, "u_Color");
    this.unifTime      = gl.getUniformLocation(this.prog, "u_Time");
    this.unifCameraAxes      = gl.getUniformLocation(this.prog, "u_CameraAxes");
    this.unifEye   = gl.getUniformLocation(this.prog, "u_Eye");
    this.unifRef   = gl.getUniformLocation(this.prog, "u_Ref");
    this.unifUp   = gl.getUniformLocation(this.prog, "u_Up");
    this.unifDimensions = gl.getUniformLocation(this.prog,"u_Dimensions");

    this.unifIsInstance = gl.getUniformLocation(this.prog, "u_IsInstance");
  }

  use() {
    if (activeProgram !== this.prog) {
      gl.useProgram(this.prog);
      activeProgram = this.prog;
    }
  }

  setModelMatrix(model: mat4) {
    this.use();
    if (this.unifModel !== -1) {
      gl.uniformMatrix4fv(this.unifModel, false, model);
    }

    if (this.unifModelInvTr !== -1) {
      let modelinvtr: mat4 = mat4.create();
      mat4.transpose(modelinvtr, model);
      mat4.invert(modelinvtr, modelinvtr);
      gl.uniformMatrix4fv(this.unifModelInvTr, false, modelinvtr);
    }
  }

  setViewProjMatrix(vp: mat4) {
    this.use();
    if (this.unifViewProj !== -1) {
      gl.uniformMatrix4fv(this.unifViewProj, false, vp);
    }
  }

  setGeometryColor(color: vec4) {
    this.use();
    if (this.unifColor !== -1) {
      gl.uniform4fv(this.unifColor, color);
    }
  }

  setIsInstanced(isInstanced: boolean) {
    this.use();
    if (this.unifIsInstance !== -1) {
      if(isInstanced) {
        gl.uniform1f(this.unifIsInstance, 1);
      } else {
        gl.uniform1f(this.unifIsInstance, 0);
      }
    }
  }

  setCameraAxes(axes: mat3) {
    this.use();
    if (this.unifCameraAxes !== -1) {
      gl.uniformMatrix3fv(this.unifCameraAxes, false, axes);
    }
  }

  setEyeRefUp(eye: vec3, ref: vec3, up: vec3) {
    this.use();
    if(this.unifEye !== -1) {
      gl.uniform3f(this.unifEye, eye[0], eye[1], eye[2]);
    }
    if(this.unifRef !== -1) {
      gl.uniform3f(this.unifRef, ref[0], ref[1], ref[2]);
    }
    if(this.unifUp !== -1) {
      gl.uniform3f(this.unifUp, up[0], up[1], up[2]);
    }
  }

  setDimensions(width: number, height: number) {
    this.use();
    if(this.unifDimensions !== -1) {
      gl.uniform2f(this.unifDimensions, width, height);
    }
  }

  setTime(t: number) {
    this.use();
    if (this.unifTime !== -1) {
      gl.uniform1f(this.unifTime, t);
    }
  }

  draw(d: Drawable) {
    this.use();

    if (this.attrPos != -1 && d.bindPos()) {
      gl.enableVertexAttribArray(this.attrPos);
      gl.vertexAttribPointer(this.attrPos, 4, gl.FLOAT, false, 0, 0);
      gl.vertexAttribDivisor(this.attrPos, 0);
    }

    if (this.attrNor != -1 && d.bindNor()) {
      gl.enableVertexAttribArray(this.attrNor);
      gl.vertexAttribPointer(this.attrNor, 4, gl.FLOAT, false, 0, 0);
      gl.vertexAttribDivisor(this.attrNor, 0);
    }

    if (this.attrCol != -1 && d.bindCol()) {
      gl.enableVertexAttribArray(this.attrCol);
      gl.vertexAttribPointer(this.attrCol, 4, gl.FLOAT, false, 0, 0);
      gl.vertexAttribDivisor(this.attrCol, 0);

    }

    if (d.isInstanced) {
      if (this.attrTranslation != -1 && d.bindTranslations()) {
        gl.enableVertexAttribArray(this.attrTranslation);
        gl.vertexAttribPointer(this.attrTranslation, 4, gl.FLOAT, false, 16, 0);
        gl.vertexAttribDivisor(this.attrTranslation, 1);
      }

      if (this.attrQuaternion != -1 && d.bindQuaternions()) {
        gl.enableVertexAttribArray(this.attrQuaternion);
        gl.vertexAttribPointer(this.attrQuaternion, 4, gl.FLOAT, false, 16, 0);
        gl.vertexAttribDivisor(this.attrQuaternion, 1);
      }

      if (this.attrScale != -1 && d.bindScales()) {
        gl.enableVertexAttribArray(this.attrScale);
        gl.vertexAttribPointer(this.attrScale, 4, gl.FLOAT, false, 16, 0);
        gl.vertexAttribDivisor(this.attrScale, 1);
      }

      if (this.attrSnowPos != -1 && d.bindSnowPos()) {
        gl.enableVertexAttribArray(this.attrSnowPos);
        gl.vertexAttribPointer(this.attrSnowPos, 3, gl.FLOAT, false, 0, 0);
        gl.vertexAttribDivisor(this.attrSnowPos, 1);
      }

      d.bindIdx();
      gl.drawElementsInstanced(d.drawMode(), d.elemCount(), gl.UNSIGNED_INT, 0, d.instances);
    } else {
      d.bindIdx();
      gl.drawElements(d.drawMode(), d.elemCount(), gl.UNSIGNED_INT, 0);
    }

    if (this.attrPos != -1) gl.disableVertexAttribArray(this.attrPos);
    if (this.attrNor != -1) gl.disableVertexAttribArray(this.attrNor);
    if (this.attrCol != -1) gl.disableVertexAttribArray(this.attrCol);
    if (this.attrSnowPos!= -1) gl.disableVertexAttribArray(this.attrSnowPos);

    if (this.attrTranslation != -1) gl.disableVertexAttribArray(this.attrTranslation);
    if (this.attrQuaternion != -1) gl.disableVertexAttribArray(this.attrQuaternion);
    if (this.attrScale != -1) gl.disableVertexAttribArray(this.attrScale);
  }
};

export default ShaderProgram;