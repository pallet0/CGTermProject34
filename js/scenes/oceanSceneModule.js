import * as THREE from 'three';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { mergeBufferGeometries } from 'three/addons/utils/BufferGeometryUtils.js';


export function createOceanScene({ renderer, camera, canvas, scene, stats }) {
  // -------------------- 기본 상수 --------------------
  const waterPosition = new THREE.Vector3(0, 0, 10);
  const near = 0.;
  const far = 2.;
  const waterSize = 512;
  const width = canvas.width;
  const height = canvas.height;
  const GLTFloader = new GLTFLoader();

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
  const lightCamera = new THREE.OrthographicCamera(-10, 10, 10, -10, near, far); //1.2
  lightCamera.position.set(0., 0., 0.5);//1.5
  lightCamera.lookAt(0, 0, 0);

  // 지면 (바닥)
  const floorGeometry = new THREE.PlaneGeometry(20, 20, 1, 1);
  const floorMaterial = new THREE.MeshBasicMaterial({ color: 0x00aaff, transparent: true, opacity: 0 });
  const floor = new THREE.Mesh(floorGeometry, floorMaterial);
  group.add(floor);

  // ---------------- 땅바닥 ----------------
  GLTFloader.load('glsl/seaground.glb', (gltf) => {
    const seaground = gltf.scene;
 
    // 필요하면 스케일·위치 조정
    seaground.rotation.x = Math.PI / 2;
    seaground.scale.set(0.08, 0.08, 0.08);      // 전체 크기
    seaground.position.set(0, 0, 0.5);   // 바닥 기준 위치

    // 그림자 옵션
    seaground.traverse(obj => {
      if (obj.isMesh) {
        obj.castShadow = true;
        obj.receiveShadow = true;
      }
    });

    group.add(seaground);
  }, undefined, (err) => {
    console.error('seaground 로드 실패', err);
  });

  // ---------------- 대학원 ----------------
  GLTFloader.load('glsl/college.glb', (gltf) => {
    const college = gltf.scene;

    // 필요하면 스케일·위치 조정
    college.rotation.x = Math.PI / 2;
    college.rotation.y = -2;
    college.scale.set(0.25, 0.25, 0.25);      // 전체 크기
    college.position.set(4.5, 4.5, 1.55);   // 바닥 기준 위치

    // 그림자 옵션
    college.traverse(obj => {
      if (obj.isMesh) {
        obj.castShadow = true;
        obj.receiveShadow = true;
      }
    });

    group.add(college);
  }, undefined, (err) => {
    console.error('college 로드 실패', err);
  });


  // ---------------- 산호초1 ----------------
  GLTFloader.load('glsl/coralreef1.glb', (gltf) => {
    const positions = [
      [-1, 2, -0.05],
      [3, -4, -0.1],
      [-5, 5, -0.05],
      [5, 5, -0.05]
    ];
    for(const pos of positions){

      console.log("ADDED CORALREEF1");
      const coralreef1 = gltf.scene.clone();
  
      // 필요하면 스케일·위치 조정
      coralreef1.rotation.x = Math.PI / 2;
      coralreef1.scale.set(1, 1, 1);      // 전체 크기
      coralreef1.position.set(...pos);   // 바닥 기준 위치

      // 그림자 옵션
      coralreef1.traverse(obj => {
        if (obj.isMesh) {
          obj.castShadow = true;
          obj.receiveShadow = true;
        }
      });

      group.add(coralreef1);
    }
  }, undefined, (err) => {
    console.error('coralreef1 로드 실패', err);
  });


  // ---------------- 산호초2 ----------------
  GLTFloader.load('glsl/coralreef2.glb', (gltf) => {
    const positions = [
      [-1, -2, -0.2],
      [8, -6, 0]
    ];
    for(const pos of positions){

      console.log("ADDED CORALREEF2");
      const coralreef2 = gltf.scene.clone();
  
      // 필요하면 스케일·위치 조정
      coralreef2.rotation.x = Math.PI / 2;
      coralreef2.scale.set(0.7, 0.7, 0.7);      // 전체 크기
      coralreef2.position.set(...pos);   // 바닥 기준 위치

      // 그림자 옵션
      coralreef2.traverse(obj => {
        if (obj.isMesh) {
          obj.castShadow = true;
          obj.receiveShadow = true;
        }
      });

      group.add(coralreef2);
    }
  }, undefined, (err) => {
    console.error('coralreef2 로드 실패', err);
  });

  //돌 추가
  let rock1;
  let rock2;
  const rockLoaded = new Promise((resolve) => {
    const objLoader = new OBJLoader();
    objLoader.load('js/assets/rock.obj', (rockGeometry) => {
      rockGeometry = rockGeometry.children[0].geometry;
      rockGeometry.computeVertexNormals();

      rock1 = new THREE.BufferGeometry().copy(rockGeometry);
      rock1.scale(0.05, 0.05, 0.02);
      rock1.translate(0.2, 0., 0.1);

      rock2 = new THREE.BufferGeometry().copy(rockGeometry);
      rock2.scale(0.05, 0.05, 0.05);
      rock2.translate(-0.5, 0.5, 0.2);
      rock2.rotateZ(Math.PI / 2.);

      resolve();
    });
  });

  let plant;
  const plantLoaded = new Promise((resolve) => {
    const objLoader = new OBJLoader();
    objLoader.load('js/assets/plant.obj', (plantGeometry) => {
      plantGeometry = plantGeometry.children[0].geometry;
      plantGeometry.computeVertexNormals();

      plant = plantGeometry;
      plant.rotateX(Math.PI / 6.);
      plant.scale(0.03, 0.03, 0.03);
      plant.translate(-0.5, 0.5, 0.);

      resolve();
    });
  });

  let ocean_bottom;
  const ocean_bottomLoaded = new Promise((resolve) => {
    const objLoader = new OBJLoader();
    objLoader.load('js/assets/ocean_bottom.obj', (obj) => {
      // 모든 geometry를 하나로 합치기
      const geometries = [];
      obj.traverse((child) => {
        if (child.isMesh) {
          geometries.push(child.geometry);
        }
      });
      
      // geometry들을 하나로 병합
      ocean_bottom = mergeBufferGeometries(geometries);
      ocean_bottom.computeVertexNormals();
      ocean_bottom.rotateX(Math.PI / 2.);
      ocean_bottom.scale(0.3, 0.3, 0.3);
      ocean_bottom.translate(0, 0, -0.4);

      resolve();
    });
  });

  // Skybox
  const cubetextureloader = new THREE.CubeTextureLoader();
  const skybox = cubetextureloader.load([
    'js/assets/ocean/TropicalSunnyDay_px.jpg', 'js/assets/ocean/TropicalSunnyDay_nx.jpg',
    'js/assets/ocean/TropicalSunnyDay_py.jpg', 'js/assets/ocean/TropicalSunnyDay_ny.jpg',
    'js/assets/ocean/TropicalSunnyDay_pz.jpg', 'js/assets/ocean/TropicalSunnyDay_nz.jpg',
  ]);
  scene.background = skybox;

  const ambient = new THREE.AmbientLight(0xffffff, 0.5);
  group.add(ambient);

  // 수조 벽 생성
  const textureLoader = new THREE.TextureLoader();
  const tankSize = 20;
  const tankHeight = 10;
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
      if (!this._dropMesh || !this._dropMesh.material) return;
      this._dropMesh.material.uniforms['center'].value = [x, y];
      this._dropMesh.material.uniforms['radius'].value = radius;
      this._dropMesh.material.uniforms['strength'].value = strength;
      this._render(renderer, this._dropMesh);
    }

    stepSimulation(renderer) { 
      if (!this._updateMesh || !this._updateMesh.material) return;
      this._render(renderer, this._updateMesh); 
    }

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
      this.geometry = new THREE.PlaneGeometry(20, 20, waterSize, waterSize);
      const shadersPromises = [loadFileLocal('js/shaders/water/vertex2.glsl'), loadFileLocal('js/shaders/water/fragment.glsl')];
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

  // EnvironmentMap, Caustics, Environment classes는 원본과 동일 (축약하지 않음)
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
      this._waterGeometry = new THREE.PlaneGeometry(20, 20, waterSize, waterSize);
      const prom = [loadFileLocal('js/shaders/caustics/water_vertex2.glsl'), loadFileLocal('js/shaders/caustics/water_fragment.glsl')];
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
    setTextures(waterTex, envTex) {
      this._waterMaterial.uniforms['env'].value = envTex;
      this._waterMaterial.uniforms['water'].value = waterTex;
    }
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

  const waterSimulation = new WaterSimulation();
  const water = new Water();
  const environmentMap = new EnvironmentMap();
  const environment = new Environment();
  const caustics = new Caustics();

  // 마우스 드롭 이벤트
  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();
  const targetgeometry = new THREE.PlaneGeometry(20, 20);
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
    const scaleFactor = 4 / 20; // 시뮬레이션 좌표(-2~2) 대비 실제 수면(20) 크기 비율
    intersects.forEach(intersect => {
      const sx = intersect.point.x * scaleFactor;
      const sy = intersect.point.y * scaleFactor;
      waterSimulation.addDrop(renderer, sx, sy, 0.03, 0.02);
    });
  }

  //load한거 넣기
  const loaded = [waterSimulation.loaded, water.loaded, environmentMap.loaded, environment.loaded, caustics.loaded, rockLoaded, plantLoaded, ocean_bottomLoaded];

  Promise.all(loaded).then(() => {
    const envGeometries = [rock1, rock2, plant, ocean_bottom, floorGeometry];  
    environmentMap.setGeometries(envGeometries);
    environment.setGeometries(envGeometries);
    environment.addTo(group);
    caustics.setDeltaEnvTexture(1 / environmentMap.size);

    // 초기 잔물결
    for (let i = 0; i < 35; i++) {
      waterSimulation.addDrop(renderer, Math.random() * 4 - 2, Math.random() * 4 - 2, 0.12, (i & 1) ? 0.08 : -0.08);
    }

    // 마우스 이벤트 리스너 등록
    canvas.addEventListener('mousemove', onMouseMove);
  });

  // 자동 물방울 효과를 위한 변수들
  let lastAutoDropTime = 0;
  const AUTO_DROP_INTERVAL = 50; // 50ms 마다 물방울 생성 (더 빈번하게)

  function createRandomDrop() {
    const x = Math.random() * 4 - 2;
    const y = Math.random() * 4 - 2;
    const radius = 0.03 + Math.random() * 0.05; // 더 큰 물방울
    const strength = (Math.random() > 0.5 ? 1 : -1) * (0.04 + Math.random() * 0.03); // 더 강한 효과
    waterSimulation.addDrop(renderer, x, y, radius, strength);
  }

  function update() {
    if (!water.mesh) return;

    // 자동 물방울 생성
    const currentTime = Date.now();
    if (currentTime - lastAutoDropTime > AUTO_DROP_INTERVAL) {
      createRandomDrop();
      lastAutoDropTime = currentTime;
    }

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