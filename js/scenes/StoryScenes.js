import * as THREE from 'three';

// StoryScene - 각 스토리 scene (1-9)
class StoryScene {
    constructor(sceneNumber, renderer, canvas) {
        this.sceneNumber = sceneNumber;
        this.renderer = renderer;
        this.canvas = canvas;
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0xf5f5f5);
        
        // 카메라 설정
        this.setupCamera();
        
        // 조명 설정
        this.setupLights();
        
        // Scene별 환경 설정
        this.setupEnvironment();
        
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
            1: { pos: [0, 10, 20], lookAt: [0, 0, 0] },      // S1(용궁) - 용왕님 원생부족
            2: { pos: [10, 5, 10], lookAt: [0, 0, 0] },     // S2(해안) - 거북이 토끼 조우
            3: { pos: [-5, 8, 15], lookAt: [0, 2, 0] },     // S3(용궁) - 토끼 인턴 시작
            4: { pos: [0, 5, 15], lookAt: [0, 2, 0] },      // S4(용궁) - 용왕이 토끼에 석사 전환 권유, 토끼 친구 핑계
            5: { pos: [-9.4, -10.0, -10], lookAt: [-2, 2, 0] },     // S5(숲속) - 거북이가 토끼 에스코트해 땅으로 옴, 나무 위 동방에서 친구 데려오기
            6: { pos: [-3.3, -11.2, 0.0], lookAt: [-2, 2, 0] },     // S6-1(숲속) - 친구를 진짜 데려옴
            7: { pos: [-3.3, -11.2, 0.0], lookAt: [0,0, 0] },      // S6-2(숲속, 한 나무 근처) - 토끼가 나무 위로 올라감(대학원생은 동아리 가입 금지)
            8: { pos: [5, 7, 12], lookAt: [0, 2, -2] },     // S7-1(용궁) - 거1토2 행복한 대학원 라이프
            9: { pos: [-5, 10, 15], lookAt: [0, 0, 0] }     // S7-2(용궁) - 거북이 홀로 돌아와 용궁과 대면
        };
        
        const config = cameraPositions[this.sceneNumber];
        this.camera.position.set(...config.pos);
        this.camera.lookAt(...config.lookAt);
    }
    
    setupLights() {
        // 기본 조명
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        this.scene.add(ambientLight);
        
        // Scene별 특별 조명
        if (this.sceneNumber === 1 || this.sceneNumber === 3 || this.sceneNumber === 4 || 
            this.sceneNumber === 8 || this.sceneNumber === 9) {
            // 용궁 scenes - 신비로운 파란 조명
            const blueLight = new THREE.PointLight(0x4488ff, 0.5);
            blueLight.position.set(0, 15, 0);
            this.scene.add(blueLight);
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
        if ( this.sceneNumber === 1 ||this.sceneNumber === 3 || this.sceneNumber === 4 || 
            this.sceneNumber === 8 || this.sceneNumber === 9) { 
            // 용궁 : 바다/수중 환경
            const { group, update } = window.createOceanScene({
                renderer: this.renderer,
                camera: this.camera,
                canvas: this.canvas,
                scene: this.scene,
            });
            this.environmentGroup = group;
            this.environmentUpdate = update;
        } else if (this.sceneNumber === 2) {
            // 해안 환경
            const { group, update } = window.createBeachScene({
                renderer: this.renderer,
                camera: this.camera,
                canvas: this.canvas,
                scene: this.scene,
            });
            this.environmentGroup = group;
            this.environmentUpdate = update;
        } else {
            // 숲속 환경
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
        }
    }
    
    setupCharacters() {
        // 임시 캐릭터 (나중에 GLTF로 대체)
        // 용왕
        if ([1, 2, 8].includes(this.sceneNumber)) {
            const dragonKing = this.createCharacter(0xff0000, 2/10);
            dragonKing.position.set(0, 3, -5);
            // this.scene.add(dragonKing);
        }
        
        // 거북이
        if ([1, 2, 3, 4, 5, 6, 7, 8, 9].includes(this.sceneNumber)) {
            const turtle = this.createCharacter(0x00ff00, 1.5/10);
            const turtlePositions = {
                1: [3,1,0],
                2: [2, 1, -3],
                3: [0, 1, 5],
                4: [-2, 1, 3],
                5: [-5, -3, -2],
                6: [-7,2, -3],
                7: [-7,2, -3],
                8: [2, 1, 0],
                9: [-2, 1, -2]
            };
            turtle.position.set(...turtlePositions[this.sceneNumber]);
            this.scene.add(turtle);
        }
        
        // 토끼
        if ([4, 5, 6, 7, 8].includes(this.sceneNumber)) {
            const rabbit = this.createCharacter(0xffffff, 1/10);
            const rabbitPositions = {
                4: [3, 1, 5],
                5: [-5, -1, -3],
                6: [-8,3, -3],
                7: [-8,3, -3],
                8: [0, 1, -3]
            };
            rabbit.position.set(...rabbitPositions[this.sceneNumber]);
            this.scene.add(rabbit);
        }
    }
    
    createCharacter(color, size) {
        // 임시 캐릭터 생성 (구체로 표현)
        const geometry = new THREE.SphereGeometry(size, 16, 12);
        const material = new THREE.MeshPhongMaterial({ color: color });
        const character = new THREE.Mesh(geometry, material);
        character.castShadow = true;
        return character;
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

        // 추가 캐릭터/애니메이션 업데이트가 필요하면 여기에 작성
    }
}

export { StoryScene };