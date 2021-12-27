import {mat4, vec4, mat3} from 'gl-matrix';
import Drawable from './Drawable';
import Camera from '../../Camera';
import {gl} from '../../globals';
import ShaderProgram from './ShaderProgram';

// In this file, `gl` is accessible because it is imported above
class OpenGLRenderer {
  constructor(public canvas: HTMLCanvasElement) {
  }

  setClearColor(r: number, g: number, b: number, a: number) {
    gl.clearColor(r, g, b, a);
  }

  setSize(width: number, height: number) {
    this.canvas.width = width;
    this.canvas.height = height;
  }

  clear() {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  }

  render(camera: Camera, prog: ShaderProgram, drawables: Array<Drawable>) {
    let model = mat4.create();
    let viewProj = mat4.create();
    // let color = vec4.fromValues(1, 1, 0, 1);
    let invViewProj = mat4.create();
    let invProj = mat4.create();
    let invView = mat4.create();

    let color = vec4.fromValues(1, 0, 0, 1);
    // Each column of the axes matrix is an axis. Right, Up, Forward.
    let axes = mat3.fromValues(camera.right[0], camera.right[1], camera.right[2],
                               camera.up[0], camera.up[1], camera.up[2],
                               camera.forward[0], camera.forward[1], camera.forward[2]);

    mat4.identity(model);
    mat4.multiply(viewProj, camera.projectionMatrix, camera.viewMatrix);

    mat4.invert(invProj, camera.projectionMatrix);
    mat4.invert(invView, camera.viewMatrix);
    mat4.multiply(invViewProj, invView, invProj);

    prog.setGeometryColor(color);
    prog.setInvViewProjMatrix(invViewProj);

    prog.setModelMatrix(model);
    prog.setViewProjMatrix(viewProj);
    prog.setGeometryColor(color);

    prog.setEyeRefUp(camera.controls.eye, camera.controls.center, camera.controls.up);
    prog.setCameraAxes(axes);

    for (let drawable of drawables) {
      if(drawable.isInstanced) {
        prog.setIsInstanced(true);
      } else {
        prog.setIsInstanced(false);
      }
      prog.draw(drawable);
    }
  }
};

export default OpenGLRenderer;