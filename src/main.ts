import {vec2, vec3, vec4} from 'gl-matrix';
import * as Stats from 'stats-js';
import * as DAT from 'dat-gui';
import Square from './geometry/Square';
import OpenGLRenderer from './rendering/gl/OpenGLRenderer';
import Camera from './Camera';
import BranchLeaf from './geometry/Cylinder';
import { setGL } from './globals';
import ShaderProgram, { Shader } from './rendering/gl/ShaderProgram';
import { LSystem } from './LSystem/LSystem';
import Tree from './lsystem/Tree';
import Plane from './geometry/Plane';

var OBJ = require('webgl-obj-loader');
var meshes: any;
window.onload = function() {
  OBJ.downloadMeshes({
    'branch': 'src/objs/cylinder.obj',
    'leaf': 'src/objs/leaf.obj',
    'rock': 'src/objs/rock.obj'
  }, function(m: any) {
    meshes = m;
    main();
  });
}

// Define an object with application parameters and button callbacks
// This will be referred to by dat.GUI's functions that add GUI elements.
const controls = {
  tesselations: 5,
  'Generate': loadScene,
  'Iterations': 6,
};

let n = 6;
let newLSystem: LSystem;
let tree: Tree;
let branch: BranchLeaf;
let leaf: BranchLeaf;
let background: Square;
let plane: Plane;

let axiom: string = "FFFFF+F+[X]FFFFF+X";
// let axiom: string = "FFFF+FFFF+[X]FFFFF+X";
let grammar: { [key: string]: string; } = {};
//grammar["X"] = "FFF[+F+X][-FFFFFX][+FFFF-+XFFFF]";
// grammar["X"] = "FFF*[+FFF+FFF+FF+FF*X[X[X]]FFFF-FF*X][-FFF+F+FF*X[X[X]]]"
grammar["X"] = "FFF*[-FFF-FFF-FF-FF*X[X[X]]FFFF-FF*X][-FFF+F+FF*X[X[X]]]"

function loadScene() {
  background = new Square(vec3.fromValues(0, 0, 0));
  background.create();
  let center = vec4.fromValues(0, 0, 0, 1);
  
  plane = new Plane(vec3.fromValues(0, 0, 0), vec2.fromValues(1000, 1000), 20);
  plane.create();

  newLSystem = new LSystem(axiom, grammar);
  tree = new Tree(newLSystem, meshes, n);
  tree.createTree();

  branch = new BranchLeaf(center, meshes, "branch", vec4.fromValues(0.3, 0.2, 0.2, 1),
           tree.translationBranch, tree.quaternionsBranch, tree.scalesBranch, tree.instanceCountBranch);
  branch.create();

  leaf = new BranchLeaf(center, meshes, "leaf", vec4.fromValues(0.5, 0.5, 0.3, 1),
         tree.translationsLeaf, tree.quaternionsLeaf, tree.scalesLeaf, tree.instanceCountLeaf);
  leaf.create();
}

function main() {
  // Initial display for framerate
  const stats = Stats();
  stats.setMode(0);
  stats.domElement.style.position = 'absolute';
  stats.domElement.style.left = '0px';
  stats.domElement.style.top = '0px';
  document.body.appendChild(stats.domElement);

  // Add controls to the gui
  const gui = new DAT.GUI();
  gui.add(controls, 'Iterations').min(1).max(7).step(1).onChange(
    function(iter: number) {
      n = iter;
    }
  )
  // gui.addColor
  gui.add(controls, 'Generate');

  // get canvas and webgl context
  const canvas = <HTMLCanvasElement> document.getElementById('canvas');
  const gl = <WebGL2RenderingContext> canvas.getContext('webgl2');
  if (!gl) {
    alert('WebGL 2 not supported!');
  }
  // `setGL` is a function imported above which sets the value of `gl` in the `globals.ts` module.
  // Later, we can import `gl` from `globals.ts` to access it
  setGL(gl);

  // Initial call to load scene
  loadScene();

  let cameraPos: vec3 = vec3.fromValues(0, 25, -275);
  vec3.rotateY(cameraPos, cameraPos, vec3.fromValues(0,0,0), 290 * Math.PI / 180.0);
  const camera = new Camera(cameraPos, vec3.fromValues(0, 35, 0));

  const renderer = new OpenGLRenderer(canvas);
  gl.enable(gl.DEPTH_TEST);

  const lambert = new ShaderProgram([
    new Shader(gl.VERTEX_SHADER, require('./shaders/lambert-vert.glsl')),
    new Shader(gl.FRAGMENT_SHADER, require('./shaders/lambert-frag.glsl')),
  ]);

  const backgroundShader = new ShaderProgram([
    new Shader(gl.VERTEX_SHADER, require('./shaders/background-vert.glsl')),
    new Shader(gl.FRAGMENT_SHADER, require('./shaders/background-frag.glsl')),
  ]);

  const terrainShader = new ShaderProgram([
    new Shader(gl.VERTEX_SHADER, require('./shaders/ground-vert.glsl')),
    new Shader(gl.FRAGMENT_SHADER, require('./shaders/ground-frag.glsl')),
  ]);

  // This function will be called every frame
  function tick() {
    camera.update();
    stats.begin();
    gl.viewport(0, 0, window.innerWidth, window.innerHeight);
    renderer.clear();

    renderer.render(camera, backgroundShader, [
      background
    ]);

    renderer.render(camera, lambert, [
      branch,
      leaf
    ]);

    renderer.render(camera, terrainShader, [
      plane
    ]);

    stats.end();

    // Tell the browser to call `tick` again whenever it renders a new frame
    requestAnimationFrame(tick);
  }

  window.addEventListener('resize', function() {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.setAspectRatio(window.innerWidth / window.innerHeight);
    camera.updateProjectionMatrix();
  }, false);

  renderer.setSize(window.innerWidth, window.innerHeight);
  camera.setAspectRatio(window.innerWidth / window.innerHeight);
  camera.updateProjectionMatrix();

  // Start the render loop
  tick();
}