import * as THREE from 'three';

// Skybox loader for forest background (cubemap)
// assets/forest 폴더에 px / nx / py / ny / pz / nz 파일이 준비돼 있어야 합니다.
const cubeLoader = new THREE.CubeTextureLoader();
const tex = cubeLoader.load([
  'assets/forest/FS000_Day_04_4.png', // 앞
  'assets/forest/FS000_Day_04_2.png', // 뒤
  'assets/forest/FS000_Day_04_1.png', // 왼
  'assets/forest/FS000_Day_04_3.png', // 오 
  'assets/forest/FS000_Day_04_5.png', // 위
  'assets/forest/FS000_Day_04_6.png', // 아래
]);
tex.colorSpace = THREE.SRGBColorSpace ?? THREE.LinearSRGBColorSpace;

// 간단한 나무 생성 함수
function createTree() {
  const trunkGeometry = new THREE.CylinderGeometry(0.05, 0.05, 0.6, 8);
  const trunkMaterial = new THREE.MeshStandardMaterial({ color: 0xC8A77A });
  const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
  trunk.rotation.x = Math.PI / 2;
  trunk.position.z = 0.3;

  const leavesGeometry = new THREE.SphereGeometry(0.3, 16, 16);
  const pastelLeafColors = [0xcbea88, 0x99bb1d, 0x1b823b, 0xb5d99f, 0x53b450];
  const chosen = pastelLeafColors[Math.floor(Math.random() * pastelLeafColors.length)];
  const leavesMaterial = new THREE.MeshStandardMaterial({ color: chosen });

  const leaves = new THREE.Mesh(leavesGeometry, leavesMaterial);
  // 길쭉하게 변형
  leaves.scale.set(1.2, 1.2, 1.5); // 약간 두껍고 길쭉한 타원체
  leaves.position.z = 0.9;

  const tree = new THREE.Group();
  tree.add(trunk);
  tree.add(leaves);

  // 그림자 설정
  trunk.castShadow = true;
  leaves.castShadow = true;
  tree.receiveShadow = false;

  return tree;
}

export function createForestScene({ renderer, scene, camera }) {
  const forestGroup = new THREE.Group();

  // 잔디 평면
  const grassGeometry = new THREE.PlaneGeometry(8, 8, 64, 64);

  // 지면을 약간 울퉁불퉁하게 만들기 위해 랜덤 높이값 부여
  const pos = grassGeometry.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const offset = (Math.random() - 0.5) * 0.1; // -0.05 ~ 0.05 m 높낮이
    pos.setZ(i, offset);
  }
  grassGeometry.computeVertexNormals();

  const grassMaterial = new THREE.MeshStandardMaterial({
    color: 0xe8e787,
    roughness: 1.0,
    metalness: 0.0
  });
  grassMaterial.color.convertSRGBToLinear(); // sRGB → Linear 변환

  // 기본 잔디 메쉬
  const grass = new THREE.Mesh(grassGeometry, grassMaterial);
  grass.receiveShadow = true;
  forestGroup.add(grass);



  // 무작위 위치에 나무 추가
  for (let i = 0; i < 8; i++) {
    const tree = createTree();
    tree.position.set(Math.random() * 6 - 3, Math.random() * 6 - 3, 0);
    forestGroup.add(tree);
  }

  // --- Lighting ---

  const sun = new THREE.DirectionalLight(0xFFFFFF, 1.0);
  sun.position.set(3, 5, 5);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.left = -10;
  sun.shadow.camera.right = 10;
  sun.shadow.camera.top = 10;
  sun.shadow.camera.bottom = -10;
  sun.shadow.radius = 8;
  forestGroup.add(sun);

  const pointLight = new THREE.PointLight(0xFFFFFF, 1.0);
  pointLight.position.set(3, 5, 5);
  pointLight.castShadow = true;
  forestGroup.add(pointLight);

  // 안개(Fog) 생성 (엷은 푸른빛)
  const fog = new THREE.FogExp2(0xFFFFFF, 0.05);

  // 부드러운 노란 AmbientLight 추가
  const ambient = new THREE.AmbientLight(0xFFFFFF, 0.1);
  forestGroup.add(ambient);

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

  return { group: forestGroup, skybox: tex, fog };
} 