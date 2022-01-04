import {vec2, vec3, vec4} from 'gl-matrix';
import * as Stats from 'stats-js';
import * as DAT from 'dat-gui';
import Square from './geometry/Square';
import Snow from './geometry/Snow';
import OpenGLRenderer from './gl/OpenGLRenderer';
import Camera from './Camera';
import BranchLeaf from './geometry/BranchLeaf';
import { setGL } from './globals';
import ShaderProgram, { Shader } from './gl/ShaderProgram';
import { LSystem, Node } from './LSystem/LSystem';
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

let axiom: string = "FF~F~F~[X]FFF+X";
let grammar: { [key: string]: string; } = {};
let n = 4;
let time: number = 0.0;
let newLSystem: LSystem;
let tree: Tree;
let branch: BranchLeaf;
let leaf: BranchLeaf;
let background: Square;
let plane: Plane;
let snow: Snow;
let snowNum = 5000;

const controls = {
  tesselations: 5,
  'Generate': loadScene,
  'Iterations': 4,
  'Axiom': axiom,
  'Grammar': "FF*[-FF-FF+F-FF*X[X[X]]FFF-FF*X][-FFF+F+FF*X[X[X]]]",
  'Snowflake count': snowNum
};

function generateSnowflakes(n: number) {
  let snowflakePositions = [];
  for (let i = 0; i < n; i++) {
    let r1 = 800 * (Math.random() - 0.5);
    let r2 = 600 * Math.random();
    let r3 = 800 * (Math.random() - 0.5);
    snowflakePositions.push(r1);
    snowflakePositions.push(r2);
    snowflakePositions.push(r3);
  }  
  
  return new Float32Array(snowflakePositions);
}

function loadScene() {
  background = new Square(vec3.fromValues(0, 0, 0));
  background.create();
  let center = vec4.fromValues(0, 0, 0, 1);

  plane = new Plane(vec3.fromValues(0, 0, 0), vec2.fromValues(800, 800), 20);
  plane.create();

  grammar["X"] = controls.Grammar;

  // Create L-System
  newLSystem = new LSystem(controls.Axiom, grammar);
  let lSystemNode: Node = newLSystem.createLSystemString(n);

  // Create tree
  tree = new Tree(newLSystem, meshes, n);
  tree.createTree(lSystemNode);

  // Generate branches
  branch = new BranchLeaf(center, meshes, "branch", vec4.fromValues(0.3, 0.2, 0.2, 1),
           tree.translationBranch, tree.quaternionsBranch, tree.scalesBranch, tree.instanceCountBranch);
  branch.create();

  // Generate leaves
  leaf = new BranchLeaf(center, meshes, "leaf", vec4.fromValues(0.5, 0.5, 0.3, 1),
         tree.translationsLeaf, tree.quaternionsLeaf, tree.scalesLeaf, tree.instanceCountLeaf);
  leaf.create();

  // Generate snow
  let snowPositions: Float32Array = generateSnowflakes(snowNum);
  snow = new Snow(5, snowNum, snowPositions);
  snow.create();
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
  );

  gui.add(controls, 'Axiom');
  gui.add(controls, 'Grammar');
  gui.add(controls, 'Snowflake count').min(0).max(6000).step(500).onChange(
    function(num: number) {
      snowNum = num;
    }
  );
  gui.add(controls, 'Generate');

  // get canvas and webgl context
  const canvas = <HTMLCanvasElement> document.getElementById('canvas');
  const gl = <WebGL2RenderingContext> canvas.getContext('webgl2');
  if (!gl) {
    alert('WebGL 2 not supported!');
  }
  // `setGL` is a function imported above which sets the value of `gl` in the `globals.ts` module.
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

  // This function will be called every frame
  function tick() {
    camera.update();
    stats.begin();
    snowShader.setTime(time++);

    gl.viewport(0, 0, window.innerWidth, window.innerHeight);
    renderer.clear();

    renderer.render(camera, backgroundShader, [
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
      snow
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
  }, false);

  renderer.setSize(window.innerWidth, window.innerHeight);
  camera.setAspectRatio(window.innerWidth / window.innerHeight);
  camera.updateProjectionMatrix();

  // Start the render loop
  tick();
}