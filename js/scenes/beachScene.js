import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

export function createBeachScene({ renderer, camera, canvas, scene, stats }) {
  // -------------------- 기본 상수 --------------------
  const waterPosition = new THREE.Vector3(0, 0, 1);
  const near = 0.;
  const far = 2.;
  const waterSize = 512;
  const width = canvas.width;
  const height = canvas.height;

  // 클럭
  const clock = new THREE.Clock();

  // 임시 렌더타겟 (굴절 맵용)
  const temporaryRenderTarget = new THREE.WebGLRenderTarget(width, height);

  // 그룹 생성 후 root scene 에 추가
  const group = new THREE.Group();
  scene.add(group);

  // 색상
  const black = new THREE.Color('black');
  const white = new THREE.Color('white');

  // 라이트
  const light = [0., 0., -1.];
  const lightCamera = new THREE.OrthographicCamera(-2, 2, 2, -2, near, far);
  lightCamera.position.set(0., 0., 0.5);
  lightCamera.lookAt(0, 0, 0);

  // 지면 (바닥)
  const floorGeometry = new THREE.PlaneGeometry(4, 4, 1, 1);
  const floorMaterial = new THREE.MeshBasicMaterial({ color: 0x00aaff, transparent: true, opacity: 0 });
  const floor = new THREE.Mesh(floorGeometry, floorMaterial);
  group.add(floor);

  //해변
  const loader = new GLTFLoader();
  loader.load('glsl/beach.glb', (gltf) => {
    const beachSet = gltf.scene;

    // 필요하면 스케일·위치 조정
    beachSet.rotation.x = Math.PI / 2;
    beachSet.scale.set(0.5, 0.5, 0.5);      // 전체 크기
    beachSet.position.set(0, 0, 0);   // 바닥 기준 위치

    // 그림자 옵션
    beachSet.traverse(obj => {
      if (obj.isMesh) {
        obj.castShadow = true;
        obj.receiveShadow = true;
        // 과도한 금속 광택 제거
        if (obj.material && obj.material.isMeshStandardMaterial) {
          obj.material.metalness = 0.1;   // 금속성 제거
          obj.material.needsUpdate = true;
        }
      }
    });

    group.add(beachSet);
  }, undefined, (err) => {
    console.error('beachSet 로드 실패', err);
  });



  // Skybox
  const cubetextureloader = new THREE.CubeTextureLoader();
  const skybox = cubetextureloader.load([
    'js/assets/ocean/TropicalSunnyDay_px.jpg', 'js/assets/ocean/TropicalSunnyDay_nx.jpg',
    'js/assets/ocean/TropicalSunnyDay_py.jpg', 'js/assets/ocean/TropicalSunnyDay_ny.jpg',
    'js/assets/ocean/TropicalSunnyDay_pz.jpg', 'js/assets/ocean/TropicalSunnyDay_nz.jpg',
  ]);
  scene.background = skybox;

  // 기존 AmbientLight 제거 후 동화풍 HemisphereLight 추가
  const ambient = new THREE.HemisphereLight(0xfff1e0, 0xadd8ff, 0.3); // intensity 0.7로 살짝 감소
  group.add(ambient);

  // 태양 역할의 PointLight 추가 (그림자용)
  const sun = new THREE.PointLight(0xfff7c0, 1.0, 50); // 노란빛, 강도 1.0, 거리 50
  sun.position.set(5, 5, 10);   // 빛의 위치
  sun.castShadow = true;
  sun.shadow.mapSize.set(4096, 4096); // 해상도 2배
  sun.shadow.bias = -0.002; // 그림자 경계 더 선명하게
  sun.shadow.camera.near = 0.5;
  // 그림자 카메라 범위 확대(필요 시 조정)
  const d = 8;
  sun.shadow.camera.left   = -d;
  sun.shadow.camera.right  = d;
  sun.shadow.camera.top    = d;
  sun.shadow.camera.bottom = -d;
  group.add(sun);

  // 수조 벽 생성
  const textureLoader = new THREE.TextureLoader();
  const tankSize = 4;
  const tankHeight = 1;
  let wall1, wall2, wall3, wall4;
  textureLoader.load('js/assets/ocean/ocean2.png', (tileTexture) => {
    tileTexture.wrapS = tileTexture.wrapT = THREE.RepeatWrapping;
    tileTexture.repeat.set(1, 1);
    const wallMaterial = new THREE.MeshPhysicalMaterial({ map: tileTexture, transparent: true, opacity: 0.8, roughness: 0.1, metalness: 0, side: THREE.DoubleSide });
    const waterMaterial = new THREE.MeshPhysicalMaterial({ color: 0x4DB3E6, transparent: true, opacity: 0.2, roughness: 0.1, metalness: 0 });

    wall1 = new THREE.Mesh(new THREE.PlaneGeometry(tankSize, tankHeight), wallMaterial);
    wall1.position.set(0, tankSize / 2, tankHeight / 2);
    wall1.rotation.x = Math.PI / 2;
    group.add(wall1);

    wall2 = wall1.clone();
    wall2.position.set(tankSize / 2, 0, tankHeight / 2);
    wall2.rotation.y = -Math.PI / 2;
    group.add(wall2);

    wall3 = new THREE.Mesh(new THREE.PlaneGeometry(tankHeight, tankSize), waterMaterial);
    wall3.position.set(0, -tankSize / 2, tankHeight / 2);
    wall3.rotation.x = Math.PI / 2;
    wall3.rotation.z = Math.PI / 2;
    group.add(wall3);

    wall4 = wall3.clone();
    wall4.position.set(-tankSize / 2, 0, tankHeight / 2);
    wall4.rotation.y = Math.PI / 2;
    group.add(wall4);
  });

  // -------------------- 수면 시뮬레이션 관련 클래스들 --------------------

  function loadFileLocal(filename) {
    return new Promise((resolve) => {
      const loader = new THREE.FileLoader();
      loader.load(filename, (data) => resolve(data));
    });
  }

  class WaterSimulation {
    constructor() {
      this._camera = new THREE.OrthographicCamera(0, 1, 1, 0, 0, 2000);
      this._geometry = new THREE.PlaneGeometry(2, 2);
      this._targetA = new THREE.WebGLRenderTarget(waterSize, waterSize, { type: THREE.FloatType });
      this._targetB = new THREE.WebGLRenderTarget(waterSize, waterSize, { type: THREE.FloatType });
      this.target = this._targetA;

      const shadersPromises = [
        loadFileLocal('js/shaders/simulation/vertex.glsl'),
        loadFileLocal('js/shaders/simulation/drop_fragment.glsl'),
        loadFileLocal('js/shaders/simulation/update_fragment.glsl'),
      ];

      this.loaded = Promise.all(shadersPromises).then(([vertexShader, dropFragmentShader, updateFragmentShader]) => {
        const dropMaterial = new THREE.RawShaderMaterial({ uniforms: { center: { value: [0, 0] }, radius: { value: 0 }, strength: { value: 0 }, texture: { value: null } }, vertexShader, fragmentShader: dropFragmentShader });
        const updateMaterial = new THREE.RawShaderMaterial({ uniforms: { delta: { value: [1 / 216, 1 / 216] }, texture: { value: null } }, vertexShader, fragmentShader: updateFragmentShader });
        this._dropMesh = new THREE.Mesh(this._geometry, dropMaterial);
        this._updateMesh = new THREE.Mesh(this._geometry, updateMaterial);
      });
    }

    addDrop(renderer, x, y, radius, strength) {
      this._dropMesh.material.uniforms['center'].value = [x, y];
      this._dropMesh.material.uniforms['radius'].value = radius;
      this._dropMesh.material.uniforms['strength'].value = strength;
      this._render(renderer, this._dropMesh);
    }

    stepSimulation(renderer) { this._render(renderer, this._updateMesh); }

    _render(renderer, mesh) {
      const _oldTarget = this.target;
      const _newTarget = this.target === this._targetA ? this._targetB : this._targetA;
      const oldTarget = renderer.getRenderTarget();
      renderer.setRenderTarget(_newTarget);
      mesh.material.uniforms['texture'].value = _oldTarget.texture;
      renderer.render(mesh, this._camera);
      renderer.setRenderTarget(oldTarget);
      this.target = _newTarget;
    }
  }

  class Water {
    constructor() {
      this.geometry = new THREE.PlaneGeometry(4, 4, waterSize, waterSize);
      const shadersPromises = [loadFileLocal('js/shaders/water/vertex.glsl'), loadFileLocal('js/shaders/water/fragment.glsl')];
      this.loaded = Promise.all(shadersPromises).then(([vertexShader, fragmentShader]) => {
        this.material = new THREE.ShaderMaterial({
          uniforms: { light: { value: light }, water: { value: null }, envMap: { value: null }, skybox: { value: skybox } },
          vertexShader,
          fragmentShader,
        });
        this.material.extensions = { derivatives: true };
        this.mesh = new THREE.Mesh(this.geometry, this.material);
        this.mesh.position.copy(waterPosition);
        group.add(this.mesh);
      });
    }

    setHeightTexture(tex) { this.material.uniforms['water'].value = tex; }
    setEnvMapTexture(tex) { this.material.uniforms['envMap'].value = tex; }
  }

  // EnvironmentMap, Caustics, Environment classes are copied from 기존 코드 (축약)
  class EnvironmentMap {
    constructor() {
      this.size = 1024;
      this.target = new THREE.WebGLRenderTarget(this.size, this.size, { type: THREE.FloatType });
      const shaderProm = [loadFileLocal('js/shaders/environment_mapping/vertex.glsl'), loadFileLocal('js/shaders/environment_mapping/fragment.glsl')];
      this._meshes = [];
      this.loaded = Promise.all(shaderProm).then(([v, f]) => { this._material = new THREE.ShaderMaterial({ vertexShader: v, fragmentShader: f }); });
    }
    setGeometries(geoms) { this._meshes = geoms.map(g => new THREE.Mesh(g, this._material)); }
    render(renderer) {
      const old = renderer.getRenderTarget();
      renderer.setRenderTarget(this.target);
      renderer.setClearColor(black, 0);
      renderer.clear();
      this._meshes.forEach(m => renderer.render(m, lightCamera));
      renderer.setRenderTarget(old);
    }
  }

  class Caustics {
    constructor() {
      this.target = new THREE.WebGLRenderTarget(waterSize * 3, waterSize * 3, { type: THREE.FloatType });
      this._waterGeometry = new THREE.PlaneGeometry(4, 4, waterSize, waterSize);
      const prom = [loadFileLocal('js/shaders/caustics/water_vertex.glsl'), loadFileLocal('js/shaders/caustics/water_fragment.glsl')];
      this.loaded = Promise.all(prom).then(([v, f]) => {
        this._waterMaterial = new THREE.ShaderMaterial({ uniforms: { light: { value: light }, env: { value: null }, water: { value: null }, deltaEnvTexture: { value: null } }, vertexShader: v, fragmentShader: f, transparent: true });
        this._waterMaterial.blending = THREE.CustomBlending;
        this._waterMaterial.blendEquation = THREE.AddEquation;
        this._waterMaterial.blendSrc = THREE.OneFactor;
        this._waterMaterial.blendDst = THREE.OneFactor;
        this._waterMaterial.blendEquationAlpha = THREE.AddEquation;
        this._waterMaterial.blendSrcAlpha = THREE.OneFactor;
        this._waterMaterial.blendDstAlpha = THREE.ZeroFactor;
        this._waterMaterial.side = THREE.DoubleSide;
        this._waterMaterial.extensions = { derivatives: true };
        this._waterMesh = new THREE.Mesh(this._waterGeometry, this._waterMaterial);
      });
    }
    setDeltaEnvTexture(d) { this._waterMaterial.uniforms['deltaEnvTexture'].value = d; }
    setTextures(waterTex, envTex) { this._waterMaterial.uniforms['env'].value = envTex; this._waterMaterial.uniforms['water'].value = waterTex; }
    render(renderer) {
      const old = renderer.getRenderTarget();
      renderer.setRenderTarget(this.target);
      renderer.setClearColor(black, 0);
      renderer.clear();
      renderer.render(this._waterMesh, lightCamera);
      renderer.setRenderTarget(old);
    }
  }

  class Environment {
    constructor() {
      const p = [loadFileLocal('js/shaders/environment/vertex.glsl'), loadFileLocal('js/shaders/environment/fragment.glsl')];
      this._meshes = [];
      this.loaded = Promise.all(p).then(([v, f]) => {
        this._material = new THREE.ShaderMaterial({ uniforms: { light: { value: light }, caustics: { value: null }, lightProjectionMatrix: { value: lightCamera.projectionMatrix }, lightViewMatrix: { value: lightCamera.matrixWorldInverse } }, vertexShader: v, fragmentShader: f });
      });
    }
    setGeometries(geoms) { this._meshes = geoms.map(g => new THREE.Mesh(g, this._material)); }
    updateCaustics(tex) { this._material.uniforms['caustics'].value = tex; }
    addTo(g) { this._meshes.forEach(m => g.add(m)); }
  }

  // 디버그용 (필요시)
  class Debug {
    constructor() {
      this._camera = new THREE.OrthographicCamera(0, 1, 1, 0, 0, 1);
      this._geometry = new THREE.PlaneGeometry();
      const prom = [loadFileLocal('js/shaders/debug/vertex.glsl'), loadFileLocal('js/shaders/debug/fragment.glsl')];
      this.loaded = Promise.all(prom).then(([v, f]) => { this._material = new THREE.RawShaderMaterial({ uniforms: { texture: { value: null } }, vertexShader: v, fragmentShader: f, transparent: true }); this._mesh = new THREE.Mesh(this._geometry, this._material); });
    }
    draw(renderer, tex) {
      this._material.uniforms['texture'].value = tex;
      const old = renderer.getRenderTarget();
      renderer.setRenderTarget(null);
      renderer.render(this._mesh, this._camera);
      renderer.setRenderTarget(old);
    }
  }

  // 객체 생성
  const waterSimulation = new WaterSimulation();
  const water = new Water();
  const environmentMap = new EnvironmentMap();
  const environment = new Environment();
  const caustics = new Caustics();
  const debug = new Debug();

  // 마우스 드롭 이벤트
  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();
  const targetgeometry = new THREE.PlaneGeometry(4, 4);
  const posAttr = targetgeometry.attributes.position;
  for (let i = 0; i < posAttr.count; i++) posAttr.setZ(i, waterPosition.z);
  posAttr.needsUpdate = true;
  const targetmesh = new THREE.Mesh(targetgeometry);

  function onMouseMove(e) {
    const rect = canvas.getBoundingClientRect();
    mouse.x = (e.clientX - rect.left) * 2 / width - 1;
    mouse.y = -(e.clientY - rect.top) * 2 / height + 1;
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObject(targetmesh);
    intersects.forEach(intersect => waterSimulation.addDrop(renderer, intersect.point.x, intersect.point.y, 0.03, 0.02));
  }

  canvas.addEventListener('mousemove', onMouseMove);

  // 로딩 Promise
  const loaded = [waterSimulation.loaded, water.loaded, environmentMap.loaded, environment.loaded, caustics.loaded, debug.loaded];

  Promise.all(loaded).then(() => {
    const envGeometries = [floorGeometry];
    environmentMap.setGeometries(envGeometries);
    environment.setGeometries(envGeometries);
    environment.addTo(group);
    caustics.setDeltaEnvTexture(1 / environmentMap.size);

    // 초기 잔물결
    for (let i = 0; i < 5; i++) {
      waterSimulation.addDrop(renderer, Math.random() * 4 - 2, Math.random() * 4 - 2, 0.03, (i & 1) ? 0.02 : -0.02);
    }
  });

  // -------------------- per-frame 업데이트 --------------------
  function update() {
    // 초기화가 아직 안되었으면 skip
    if (!water.mesh) return;

    // 물 시뮬레이션 스텝 (약 30fps)
    if (clock.getElapsedTime() > 0.032) {
      waterSimulation.stepSimulation(renderer);
      const waterTexture = waterSimulation.target.texture;
      water.setHeightTexture(waterTexture);
      environmentMap.render(renderer);
      const envTexture = environmentMap.target.texture;
      caustics.setTextures(waterTexture, envTexture);
      caustics.render(renderer);
      environment.updateCaustics(caustics.target.texture);
      clock.start();
    }

    // 굴절용 : 물 제거 후 장면 렌더
    renderer.setRenderTarget(temporaryRenderTarget);
    renderer.setClearColor(white, 1);
    renderer.clear();
    water.mesh.visible = false;
    renderer.render(scene, camera);
    water.setEnvMapTexture(temporaryRenderTarget.texture);
    water.mesh.visible = true;
    renderer.setRenderTarget(null);
  }

  return { group, update };
} 