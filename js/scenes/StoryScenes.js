import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

// StoryScene - 각 스토리 scene (1-9)
class StoryScene {
    constructor(sceneNumber, renderer, canvas) {
        this.sceneNumber = sceneNumber;
        this.renderer = renderer;
        this.canvas = canvas;
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0xf5f5f5);
        
        this.mixers = []; 
        this.clock = new THREE.Clock(); 
        this.animationSpeed = 0.5; 

        // 카메라 설정
        this.setupCamera();
        
        // 조명 설정
        this.setupLights();
        
        // Scene별 환경 설정
        this.setupEnvironment();

        // GLTF 로더 생성
        this.loader = new GLTFLoader();
        
        // 캐릭터 설정 (나중에 GLTF로 대체)
        this.setupCharacters();
    }
    
    setupCamera() {
        this.camera = new THREE.PerspectiveCamera(
            60,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );

        this.camera.up.set(0, 0, 1);
        
        // Scene별 카메라 위치 설정
        const cameraPositions = {
            1: { pos: [-1.8, 1.4, 1.1], lookAt: [1.4, 0, 0.7] },      // S1(용궁) - 용왕님 원생부족
            2: { pos: [-2.0, -1.5, 3.0], lookAt: [0, 0, 2] },     // S2(해안) - 거북이 토끼 조우
            3: { pos: [1.0, -3.5, 0.8], lookAt: [-0.9, 0.3, 0.7] },     // S3(용궁) - 토끼 인턴 시작
            4: { pos: [1.8, -1.2, 1.3], lookAt: [-0.9, 0.3, 0.7] },      // S4(용궁) - 용왕이 토끼에 석사 전환 권유, 토끼 친구 핑계
            5: { pos: [-5.3, -4.1, -2.5], lookAt: [-5.4, 2.8, -2.5] },     // S5(숲속) - 거북이가 토끼 에스코트해 땅으로 옴, 나무 위 동방에서 친구 데려오기
            6: { pos: [-2.5, -1.1, 3.4], lookAt: [7.3, -0.5, 0.7] },     // S6-1(숲속) - 친구를 진짜 데려옴
            7: { pos: [-16.2, 2.4, 3.6], lookAt: [-5.4, 2.8, -2.5] },      // S6-2(숲속, 한 나무 근처) - 토끼가 나무 위로 올라감(대학원생은 동아리 가입 금지)
            8: { pos: [0.6, 0.0, 2.0], lookAt: [-1.7, 0.5, 0.8] },     // S7-1(용궁) - 거1토2 행복한 대학원 라이프
            9: { pos: [-1.4, -1.6, 0.6], lookAt: [0, 0, 0] }     // S7-2(용궁) - 거북이 홀로 돌아와 용궁과 대면
        };
        
        const config = cameraPositions[this.sceneNumber];
        this.camera.position.set(...config.pos);
        this.camera.lookAt(...config.lookAt);

        this.camera.userData = this.camera.userData || {};
        this.camera.userData.lookAt = [...config.lookAt];
    }
    
    setupLights() {
        // 기본 조명
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        this.scene.add(ambientLight);
        
        // Scene별 특별 조명
        if (this.sceneNumber === 1 || this.sceneNumber === 3 || this.sceneNumber === 4 || 
            this.sceneNumber === 8 || this.sceneNumber === 9) {
            // 용궁 scenes - 신비로운 파란 조명
            // const blueLight = new THREE.PointLight(0x4488ff, 0.5);
            // blueLight.position.set(0, 15, 0);
            // this.scene.add(blueLight);
        } else if (this.sceneNumber === 2) {
            // 해안 scenes - 밝은 햇빛
            const sunLight = new THREE.DirectionalLight(0xFFFFFF, 1.0);
            sunLight.position.set(50, 50, 50);
            sunLight.castShadow = true;
            this.scene.add(sunLight);
        } else {
            // 숲속 scenes - 초록빛 조명
            // const greenLight = new THREE.PointLight(0x88ff88, 0.3);
            // const greenLight = new THREE.PointLight(0x88ff88, 0.3);
            // greenLight.position.set(0, 15, 0);
            // this.scene.add(greenLight);

            // // 디버그용 라이트 헬퍼
            // const pointHelper = new THREE.PointLightHelper(greenLight, 0.3, 0x00ff00);
            // this.scene.add(pointHelper);

            // 태양광 설정
            const sun = new THREE.DirectionalLight(0xFFFFFF, 0.7);
            sun.position.set(23, -45, 60);
            sun.castShadow = true;

            // 그림자 설정
            sun.shadow.mapSize.set(2048, 2048);
            sun.shadow.camera.near = 0.5;
            sun.shadow.camera.far = 200;
            sun.shadow.camera.left = -100;
            sun.shadow.camera.right = 100;
            sun.shadow.camera.top = 100;
            sun.shadow.camera.bottom = -100;
            sun.shadow.radius = 8;
            sun.shadow.bias = -0.0001;

            sun.target.position.set(0, 0, 0);
            this.scene.add(sun.target);
            this.scene.add(sun);

            // 그림자 디버그용 카메라 헬퍼 추가
            const helper = new THREE.CameraHelper(sun.shadow.camera);
            this.scene.add(helper);
        }
    }
    
    setupEnvironment() {
        // 외부 환경 Scene (forest / beach / ocean)을 로드하여 사용
        if ([1,6].includes(this.sceneNumber)) { 
            // 용궁 : 바다/수중 환경
            console.log("OCEAN LOADING");
            const { group, update } = window.createOceanScene({
                renderer: this.renderer,
                camera: this.camera,
                canvas: this.canvas,
                scene: this.scene,
            });

            this.environmentGroup = group;
            this.environmentUpdate = update;  
        } else if ([2].includes(this.sceneNumber)) {
            // 해안 환경
            console.log("BEACH LOADING");
            const { group, update } = window.createBeachScene({
                renderer: this.renderer,
                camera: this.camera,
                canvas: this.canvas,
                scene: this.scene,
            });
            this.environmentGroup = group;
            this.environmentUpdate = update;
        } else if ([5, 7].includes(this.sceneNumber)) {
            // 숲속 환경
            console.log("FOREST LOADING");
            const forestEnv = window.createForestScene({
                renderer: this.renderer,
                scene: this.scene,
                camera: this.camera,
            });
            this.environmentGroup = forestEnv.group;
            this.environmentUpdate = forestEnv.update; // forestScene 은 update 가 없을 수 있음

            // skybox, fog 설정 반영
            if (forestEnv.skybox) this.scene.background = forestEnv.skybox;
            if (forestEnv.fog)    this.scene.fog       = forestEnv.fog;
        } else if ([3, 4, 8, 9].includes(this.sceneNumber)) {
            // 연구실
            console.log("LAB LOADING");
            this.scene.background = new THREE.Color(0x222222);
            const { group, update } = window.createLabScene({
                renderer: this.renderer,
                camera: this.camera,
                canvas: this.canvas,
                scene: this.scene,
                SCI: this.sceneNumber==8
            });
            this.environmentGroup = group;
            this.environmentUpdate = update;
        }
    }
    
    setupCharacters() {
        // 캐릭터 GLB 파일 경로 맵
        const models = {
            forest: './glsl/forest.glb',
            grassMoving: './glsl/grass_moving.glb',
            dragonKing: './glsl/dragonking.glb',
            dragonKingMoving: './glsl/dragonking_moving.glb',
            scienceLab: './glsl/lab.glb',
            turtle: './glsl/turtle.glb',
            turtleMoving: './glsl/turtle_moving.glb',
            rabbit: './glsl/rabbit.glb',
            rabbitMoving: './glsl/rabbit_moving.glb',
            rabbit2: './glsl/rabbit2.glb',
            rabbit2Moving: './glsl/rabbit2_moving.glb'
        };
        
        // 용왕 설정
        const dragonKingPositions = {
            1: [1  , 1,  0.3],
            3: [0.4, -1.4, 0.4],
            4: [0.6, 0.3, 0.4],
            8: [-0.7, 1.3, 0.25],
            9: [0.7, 0, 0.25]
        };
        const dragonKingScales = {
            1: 0.15,
            3: 0.15,
            4: 0.15,
            8: 0.15,
            9: 0.15
        };
        const dragonKingRotationYZ = {
            1: [0.3, 0],
            3: [3.3, 0],
            4: [4.1, 0],
            8: [3.9, 0],
            9: [0.3, 0]
        };

        // 조교 설정
        const turtlePositions = {
            1: [1.1,-0.9,0.5],
            2: [0, -1, 2.2],
            3: [-0.9, 0.3, 0.4],
            4: [-1, 1.3, 0.5],
            5: [-4, -1.6, -3.7],
            6: [5.2, 0.6, 0.3],
            7: [-6.1, 1.5, -3.6],
            8: [-0.7, -0.3, 0.25],
            9: [-1, 1, 0.5]
        };
        const turtleScales = {
            1: 0.2,
            2: 0.1,
            3: 0.25,
            4: 0.2,
            5: 0.3,
            6: 0.2 ,
            7: 0.4,
            8: 0.2,
            9: 0.1
        };
        const turtleRotationYZ = {
            1: [2, 0],
            2: [1.6, 0.2],
            3: [3.0, 0],
            4: [1, 0],
            5: [2, 0],
            6: [0, 0],
            7: [2.5, 0.3],
            8: [2.5, 0],
            9: [1, 0]
        };

        // 토끼 설정        
        const rabbitPositions = {
            2: [-0.1, 0.6, 2.3],
            3: [-0.9, 0.3, 0.4],
            4: [0.1, -1, 0.4],
            5: [-5.9, 1, -3.7],
            6: [6.8, -0.5, 0.3],
            7: [-12.3, 5, 1.8],
            8: [-1, 0, 0.5]
        };
        const rabbitScales = {
            2: 0.1,
            3: 0.2,
            4: 0.2,
            5: 0.3,
            6: 0.2,
            7: 0.4,
            8: 0.2
        };
        const rabbitRotationYZ = {
            2: [4.8, -0.1],
            3: [0.7, 0],
            4: [1, 0],
            5: [-1, 0],
            6: [2, 0],
            7: [5.5, -0.4],
            8: [2, 0]
        };

        // 토끼친구 설정        
        const rabbit2Positions = {
            6: [6.3, 0.4, 0.4],
            8: [-0.8, 0.4, 0.5]
        };
        const rabbit2Scales = {
            6: 0.2,
            8: 0.2
        };
        const rabbit2RotationYZ = {
            6: [4.2, 0],
            8: [3.5, 0]
        };

        // 용왕 로드
        if ([1,3,4,8,9].includes(this.sceneNumber)) {
            this.loader.load(models.dragonKingMoving, (gltf) => {
                const model = gltf.scene;
                model.rotation.x = Math.PI/2;
                model.rotation.y = dragonKingRotationYZ[this.sceneNumber][0];
                model.rotation.z = dragonKingRotationYZ[this.sceneNumber][1];

                console.log("TEST ", `${dragonKingPositions[this.sceneNumber]}`)
                model.position.set(...dragonKingPositions[this.sceneNumber]);
                model.scale.set(dragonKingScales[this.sceneNumber], dragonKingScales[this.sceneNumber], dragonKingScales[this.sceneNumber]);
                model.traverse(node => { if (node.isMesh) node.castShadow = true; });

                const mixer = new THREE.AnimationMixer(model);
                gltf.animations.forEach(clip => {
                    const action = mixer.clipAction(clip);
                    action.play();                     // 무한 루프
                });
                mixer.timeScale = this.animationSpeed;
                this.mixers.push(mixer);

                this.scene.add(model);
            });
        }

        // 거북이 로드
        if ([1,2,3,4,5,6,7,8,9].includes(this.sceneNumber)) {
            this.loader.load(models.turtleMoving, (gltf) => {
                const model = gltf.scene;
                model.rotation.x = Math.PI/2;
                model.rotation.y = turtleRotationYZ[this.sceneNumber][0];
                model.rotation.z = turtleRotationYZ[this.sceneNumber][1];

                model.position.set(...turtlePositions[this.sceneNumber]);
                model.scale.set(turtleScales[this.sceneNumber], turtleScales[this.sceneNumber], turtleScales[this.sceneNumber]);
                model.traverse(node => { if (node.isMesh) node.castShadow = true; });

                const mixer = new THREE.AnimationMixer(model);
                gltf.animations.forEach(clip => {
                    const action = mixer.clipAction(clip);
                    action.play();                     // 무한 루프
                });
                mixer.timeScale = this.animationSpeed;
                this.mixers.push(mixer);

                this.scene.add(model);
            });
        }

        // 토끼 로드
        if ([2,3,4,5,6,7,8].includes(this.sceneNumber)) {
            this.loader.load(models.rabbitMoving, (gltf) => {
                const model = gltf.scene;
                model.rotation.x = Math.PI/2;
                model.rotation.y = rabbitRotationYZ[this.sceneNumber][0];
                model.rotation.z = rabbitRotationYZ[this.sceneNumber][1];

                model.position.set(...rabbitPositions[this.sceneNumber]);
                model.scale.set(rabbitScales[this.sceneNumber], rabbitScales[this.sceneNumber], rabbitScales[this.sceneNumber]);
                model.traverse(node => { if (node.isMesh) node.castShadow = true; });

                const mixer = new THREE.AnimationMixer(model);
                gltf.animations.forEach(clip => {
                    const action = mixer.clipAction(clip);
                    action.play();                     // 무한 루프
                });
                mixer.timeScale = this.animationSpeed;
                this.mixers.push(mixer);

                this.scene.add(model);
            });
        }
        
        // 토끼친구 로드
        if ([6, 8].includes(this.sceneNumber)) {
            this.loader.load(models.rabbit2Moving, (gltf) => {
                const model = gltf.scene;
                model.rotation.x = Math.PI/2;
                model.rotation.y = rabbit2RotationYZ[this.sceneNumber][0];
                model.rotation.z = rabbit2RotationYZ[this.sceneNumber][1];

                model.position.set(...rabbit2Positions[this.sceneNumber]);
                model.scale.set(rabbit2Scales[this.sceneNumber], rabbit2Scales[this.sceneNumber], rabbit2Scales[this.sceneNumber]);
                model.traverse(node => { if (node.isMesh) node.castShadow = true; });

                const mixer = new THREE.AnimationMixer(model);
                gltf.animations.forEach(clip => {
                    const action = mixer.clipAction(clip);
                    action.play();                     // 무한 루프
                });
                mixer.timeScale = this.animationSpeed;
                this.mixers.push(mixer);

                this.scene.add(model);
            });
        }
    }
    
    activate() {
        console.log(`Story Scene ${this.sceneNumber} 활성화`);
    }
    
    deactivate() {
        console.log(`Story Scene ${this.sceneNumber} 비활성화`);
    }
    
    update() {
        // 환경 Scene 업데이트 (예: 물 시뮬레이션)
        if (this.environmentUpdate) {
            this.environmentUpdate();
        }

        const delta = this.clock.getDelta();
        this.mixers.forEach(mixer => mixer.update(delta));
    }
}

export { StoryScene };