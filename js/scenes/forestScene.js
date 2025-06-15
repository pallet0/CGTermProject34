import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

// Skybox loader for forest background (cubemap)
// assets/forest 폴더에 px / nx / py / ny / pz / nz 파일이 준비돼 있어야 합니다.
const cubeLoader = new THREE.CubeTextureLoader();
const tex = cubeLoader.load([
  'js/assets/forest/FS000_Day_04_4.png', // 앞
  'js/assets/forest/FS000_Day_04_2.png', // 뒤
  'js/assets/forest/FS000_Day_04_1.png', // 왼
  'js/assets/forest/FS000_Day_04_3.png', // 오 
  'js/assets/forest/FS000_Day_04_5.png', // 위
  'js/assets/forest/FS000_Day_04_6.png', // 아래
]);
tex.colorSpace = THREE.SRGBColorSpace ?? THREE.LinearSRGBColorSpace;

export function createForestScene({ renderer, scene, camera }) {
  const forestGroup = new THREE.Group();



  // 안개(Fog) 생성 (엷은 푸른빛)
  // const fog = new THREE.FogExp2(0xFFFFFF, 0.05);

  // 부드러운 노란 AmbientLight 추가
  const ambient = new THREE.AmbientLight(0xFFFFFF, 0.1);
  forestGroup.add(ambient);

  // ---- scene에 그룹 추가 ----
  if (scene) scene.add(forestGroup);

//   // ---- Fog/빛입자 파티클 ----
//   const smokeTex = new THREE.TextureLoader().load('assets/textures/smoke.png');
//   const spriteMat = new THREE.SpriteMaterial({ map: smokeTex, transparent: true, opacity: 0.15, depthWrite: false });

//   for (let i = 0; i < 30; i++) {
//     const sprite = new THREE.Sprite(spriteMat);
//     sprite.position.set(
//       Math.random() * 50 - 25,
//       1 + Math.random() * 5,
//       Math.random() * 50 - 25
//     );
//     sprite.scale.set(10, 10, 1);
//     forestGroup.add(sprite);
//   }

  // ---- Forest 전체 세트(glb) 로드 ----
  const loader = new GLTFLoader();
  loader.load('glsl/forest.glb', (gltf) => {
    const forestSet = gltf.scene;

    // 필요하면 스케일·위치 조정
    forestSet.rotation.x = Math.PI / 2;
    forestSet.scale.set(0.5, 0.5, 0.5);      // 전체 크기
    forestSet.position.set(0, 0, -15);   // 바닥 기준 위치

    // 그림자 옵션
    forestSet.traverse(obj => {
      if (obj.isMesh) {
        obj.castShadow = true;
        obj.receiveShadow = true;
      }
    });

    forestGroup.add(forestSet);
  }, undefined, (err) => {
    console.error('forestSet 로드 실패', err);
  });



  return { group: forestGroup, skybox: tex };//,fog
} 