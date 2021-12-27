import {vec2, vec3, vec4} from 'gl-matrix';
import * as Stats from 'stats-js';
import * as DAT from 'dat-gui';
import Square from './geometry/Square';
import Snow from './geometry/Snow';
import OpenGLRenderer from './rendering/gl/OpenGLRenderer';
import Camera from './Camera';
import ScreenQuad from './geometry/ScreenQuad';
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
    'leaf': 'src/objs/leaf.obj'
  }, function(m: any) {
    meshes = m;
    main();
  });
}

let axiom: string = "FF_F_F_[X]FFF+X";
// let axiom: string = "FFFF+FFFF+[X]FFFFF+X";
let grammar: { [key: string]: string; } = {};

const controls = {
  tesselations: 5,
  'Generate': loadScene,
  'Iterations': 2,
  'Axiom': axiom,
  'Grammar': "FF*[-FF-FF+F-FF*X[X[X]]FFF-FF*X][-FFF+F+FF*X[X[X]]]"
};

let n = 2;
let screenQuad: ScreenQuad;
let time: number = 0.0;
let newLSystem: LSystem;
let tree: Tree;
let branch: BranchLeaf;
let leaf: BranchLeaf;
let background: Square;
let plane: Plane;
let snow: Snow;

function loadScene() {
  background = new Square(vec3.fromValues(0, 0, 0));
  background.create();
  let center = vec4.fromValues(0, 0, 0, 1);
  
  screenQuad = new ScreenQuad();
  screenQuad.create();

  plane = new Plane(vec3.fromValues(0, 0, 0), vec2.fromValues(1000, 1000), 20);
  plane.create();

  grammar["X"] = controls.Grammar;

  newLSystem = new LSystem(controls.Axiom, grammar);
  tree = new Tree(newLSystem, meshes, n);
  tree.createTree();

  branch = new BranchLeaf(center, meshes, "branch", vec4.fromValues(0.3, 0.2, 0.2, 1),
           tree.translationBranch, tree.quaternionsBranch, tree.scalesBranch, tree.instanceCountBranch);
  branch.create();

  leaf = new BranchLeaf(center, meshes, "leaf", vec4.fromValues(0.5, 0.5, 0.3, 1),
         tree.translationsLeaf, tree.quaternionsLeaf, tree.scalesLeaf, tree.instanceCountLeaf);
  leaf.create();

  let snowNum = 5000;
  let snowPosArray = [];
  for(let i = 0;i<snowNum;i++){
    let rnd1 = 450*(Math.random()-0.5);
    let rnd2 = 300*Math.random();
    let rnd3 = 450*(Math.random()-0.5);
    snowPosArray.push(rnd1);
    snowPosArray.push(rnd2);
    snowPosArray.push(rnd3);
  }  

  let snowPos:Float32Array = new Float32Array(snowPosArray);
  snow = new Snow(.8, snowNum);
  snow.create();

  snow.setInstanceVBOs(snowPos);
  snow.setNumInstances(snowNum);
  console.log(snow.positions);
  
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

  gui.add(controls, 'Axiom');
  gui.add(controls, 'Grammar');
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

  const leafShader = new ShaderProgram([
    new Shader(gl.VERTEX_SHADER, require('./shaders/leaf-vert.glsl')),
    new Shader(gl.FRAGMENT_SHADER, require('./shaders/leaf-frag.glsl')),
  ]);

  const backgroundShader = new ShaderProgram([
    new Shader(gl.VERTEX_SHADER, require('./shaders/background-vert.glsl')),
    new Shader(gl.FRAGMENT_SHADER, require('./shaders/background-frag.glsl')),
  ]);

  const terrainShader = new ShaderProgram([
    new Shader(gl.VERTEX_SHADER, require('./shaders/ground-vert.glsl')),
    new Shader(gl.FRAGMENT_SHADER, require('./shaders/ground-frag.glsl')),
  ]);

  const snowShader = new ShaderProgram([
    new Shader(gl.VERTEX_SHADER, require('./shaders/snow-vert.glsl')),
    new Shader(gl.FRAGMENT_SHADER, require('./shaders/snow-frag.glsl')),
  ]);

  const flat = new ShaderProgram([
    new Shader(gl.VERTEX_SHADER, require('./shaders/flat-vert.glsl')),
    new Shader(gl.FRAGMENT_SHADER, require('./shaders/flat-frag.glsl')),
  ]);

  // This function will be called every frame
  function tick() {
    camera.update();
    stats.begin();
    snowShader.setTime(time++);
    // flat.setTime(time++);

    gl.viewport(0, 0, window.innerWidth, window.innerHeight);
    renderer.clear();

    // renderer.render(camera, flat, [screenQuad]);

    renderer.render(camera, flat, [
      background
    ]);

    renderer.render(camera, lambert, [
      branch
    ]);

    renderer.render(camera, leafShader, [
      leaf
    ]);

    renderer.render(camera, terrainShader, [
      plane
    ]);

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE); // Additive blending

    renderer.render(camera, snowShader, [
      // snow
    ]);

    gl.disable(gl.BLEND);

    stats.end();

    // Tell the browser to call `tick` again whenever it renders a new frame
    requestAnimationFrame(tick);
  }

  window.addEventListener('resize', function() {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.setAspectRatio(window.innerWidth / window.innerHeight);
    camera.updateProjectionMatrix();
    flat.setDimensions(window.innerWidth, window.innerHeight);
  }, false);

  renderer.setSize(window.innerWidth, window.innerHeight);
  camera.setAspectRatio(window.innerWidth / window.innerHeight);
  camera.updateProjectionMatrix();
  flat.setDimensions(window.innerWidth, window.innerHeight);

  // Start the render loop
  tick();
}