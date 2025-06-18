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

export function createLabScene({ renderer, scene, camera, SCI }) {
  const labGroup = new THREE.Group();
  const textureLoader = new THREE.TextureLoader();

  if(SCI){
  const sciTexture = textureLoader.load(
    'glsl/sci.png',
    () => { console.log('sci 텍스처 로드 완료'); },
    undefined,
    err => { console.error('텍스처 로드 실패:', err); }
  );
  const width  = 16;
  const height = 9;
  const planeGeo = new THREE.PlaneGeometry(width, height);

  const planeMat = new THREE.MeshBasicMaterial({
    map: sciTexture,
    transparent: true  // PNG 알파 채널 있으면 투명 허용
  });

  const sciPlane = new THREE.Mesh(planeGeo, planeMat);

  sciPlane.rotation.x = Math.PI / 2;  // 평면을 수평으로 세우는 예시
  sciPlane.rotation.y = Math.PI / 2;  // 평면을 수평으로 세우는 예시
  sciPlane.scale.set(0.025, 0.025, 0.025);
  sciPlane.position.set(-1.82, 0.34, 0.95);       // 원하는 위치로 변경 가능

  labGroup.add(sciPlane);
  }

  
  const oceanTexture = textureLoader.load(
    'js/assets/ocean/ocean2.png',
    () => { console.log('ocean2 텍스처 로드 완료'); },
    undefined,
    err => { console.error('텍스처 로드 실패:', err); }
  );
  const width  = 10;
  const height = 2;
  const planeGeo = new THREE.PlaneGeometry(width, height);

  const planeMat = new THREE.MeshBasicMaterial({
    map: oceanTexture,
    transparent: true  // PNG 알파 채널 있으면 투명 허용
  });

  const oceanPlane = new THREE.Mesh(planeGeo, planeMat);

  oceanPlane.rotation.x = Math.PI / 2;  // 평면을 수평으로 세우는 예시
  oceanPlane.position.set(0, 2.7, 1);       // 원하는 위치로 변경 가능

  labGroup.add(oceanPlane);

  const fog = new THREE.FogExp2(0xFFFFFF, 0.05);

  // 부드러운 노란 AmbientLight 추가
  const ambient = new THREE.AmbientLight(0x010101, 0.01);
  labGroup.add(ambient);

  const dirLight = new THREE.DirectionalLight(0x1111ff, 0.6);
  dirLight.position.set(-2.1, 4.6, 2.1);
  dirLight.target.position.set(0, 2, 0);
  dirLight.castShadow = true;
  dirLight.shadow.mapSize.set(1024, 1024);

  labGroup.add(dirLight);
  labGroup.add(dirLight.target);

  // ---- scene에 그룹 추가 ----
  if (scene) scene.add(labGroup);

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
//     labGroup.add(sprite);
//   }

  // ---- Forest 전체 세트(glb) 로드 ----
  const loader = new GLTFLoader();
  loader.load('glsl/lab.glb', (gltf) => {
    const forestSet = gltf.scene;

    // 필요하면 스케일·위치 조정
    forestSet.rotation.x = Math.PI / 2;
    forestSet.scale.set(1, 1, 1);      // 전체 크기
    forestSet.position.set(0, 0, 0);   // 바닥 기준 위치

    // 그림자 옵션
    forestSet.traverse(obj => {
      if (obj.isMesh) {
        obj.castShadow = true;  
        obj.receiveShadow = true;
      }
    });

    labGroup.add(forestSet);
  }, undefined, (err) => {
    console.error('labSet 로드 실패', err);
  });



  return { group: labGroup, skybox: tex };//,fog
} 