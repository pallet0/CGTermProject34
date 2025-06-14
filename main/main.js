import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { initStats } from './util.js';
import { createOceanScene } from './oceanScene.js';
import { createForestScene } from './forestScene.js';
import { EffectComposer }   from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass }       from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass }  from 'three/addons/postprocessing/UnrealBloomPass.js';

// Canvas & Renderer
const canvas = document.getElementById('canvas');
canvas.width = 1024;
canvas.height = 800;

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
renderer.setSize(canvas.width, canvas.height);
renderer.autoClear = false;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

// Scene & Camera
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, canvas.width / canvas.height, 0.01, 100);
camera.position.set(-6, -6, 4);
camera.up.set(0, 0, 1);
scene.add(camera);

// Controls
const controls = new OrbitControls(camera, canvas);
controls.minPolarAngle = 0;
controls.maxPolarAngle = Math.PI / 2. - 0.1;
controls.minDistance = 2.0;
controls.maxDistance = 6.0;

// Stats
const stats = initStats();

// Skybox placeholders
let oceanSkybox = null;
let forestSkybox = null;

// Scenes
const oceanScene = createOceanScene({ renderer, camera, canvas, scene, stats });
// oceanScene 생성 후 설정된 skybox 저장
oceanSkybox = scene.background;
const forestScene = createForestScene({ renderer, scene, camera });
const forestGroup = forestScene.group;
forestGroup.visible = false;
scene.add(forestGroup);
forestSkybox = forestScene.skybox;

let current = 'ocean';

// --- Postprocessing Composer & Bloom ---
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
const bloomPass = new UnrealBloomPass(
  new THREE.Vector2(canvas.width, canvas.height),
  0.5, 0.4, 0.85
);
composer.addPass(bloomPass);

document.addEventListener('keydown', (e) => {
  if (e.code === 'Space') {
    if (current === 'ocean') {
      current = 'forest';
      forestGroup.visible = true;
      oceanScene.group.visible = false;
      scene.background = forestSkybox;
      scene.fog = forestScene.fog;
    } else {
      current = 'ocean';
      forestGroup.visible = false;
      oceanScene.group.visible = true;
      scene.background = oceanSkybox;
      scene.fog = null;
    }
  }
});



// resize 대응
window.addEventListener('resize', () => {
  composer.setSize(canvas.clientWidth, canvas.clientHeight);
});

function animate() {
  requestAnimationFrame(animate);
  stats.begin();

  if (current === 'ocean') oceanScene.update();

  controls.update();
  if (current === 'forest') {
    bloomPass.enabled = true;
    bloomPass.strength = 0.5;
    bloomPass.threshold = 0.9;
    scene.fog = forestScene.fog;
  } else {
    bloomPass.enabled = false;
    scene.fog = null;
  }
  composer.render();
  stats.end();
}

animate(); 