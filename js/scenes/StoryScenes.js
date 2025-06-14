// StoryScene - 각 스토리 scene (1-9)
class StoryScene {
    constructor(sceneNumber) {
        this.sceneNumber = sceneNumber;
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
        
        // Scene별 카메라 위치 설정
        const cameraPositions = {
            1: { pos: [0, 10, 20], lookAt: [0, 0, 0] },      // 용궁 전경
            2: { pos: [10, 5, 10], lookAt: [0, 0, 0] },     // 용왕과 거북이
            3: { pos: [-5, 8, 15], lookAt: [0, 2, 0] },     // 해안가
            4: { pos: [0, 5, 15], lookAt: [0, 2, 0] },      // 토끼 등장
            5: { pos: [8, 6, 12], lookAt: [-2, 2, 0] },     // 대화 장면
            6: { pos: [0, 12, 18], lookAt: [0, 0, 0] },     // 숲속 이동
            7: { pos: [0, 8, 15], lookAt: [0, 2, 0] },      // 선택의 순간
            8: { pos: [5, 7, 12], lookAt: [0, 2, -2] },     // 엔딩 A 경로
            9: { pos: [-5, 10, 15], lookAt: [0, 0, 0] }     // 엔딩 B 경로
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
        if (this.sceneNumber <= 2 || this.sceneNumber >= 8) {
            // 용궁 scenes - 신비로운 파란 조명
            const blueLight = new THREE.PointLight(0x4488ff, 0.5);
            blueLight.position.set(0, 10, 0);
            this.scene.add(blueLight);
        } else if (this.sceneNumber >= 3 && this.sceneNumber <= 5) {
            // 해안 scenes - 따뜻한 햇빛
            const sunLight = new THREE.DirectionalLight(0xffeeaa, 0.8);
            sunLight.position.set(10, 20, 10);
            sunLight.castShadow = true;
            this.scene.add(sunLight);
        } else {
            // 숲속 scenes - 초록빛 조명
            const greenLight = new THREE.PointLight(0x88ff88, 0.3);
            greenLight.position.set(0, 15, 0);
            this.scene.add(greenLight);
        }
    }
    
    setupEnvironment() {
        // 바닥 생성
        const groundGeometry = new THREE.PlaneGeometry(50, 50);
        let groundMaterial;
        
        if (this.sceneNumber <= 2 || this.sceneNumber >= 8) {
            // 용궁 - 파란 바닥
            groundMaterial = new THREE.MeshPhongMaterial({ color: 0x2255aa });
        } else if (this.sceneNumber >= 3 && this.sceneNumber <= 5) {
            // 해안 - 모래색 바닥
            groundMaterial = new THREE.MeshPhongMaterial({ color: 0xf4d03f });
        } else {
            // 숲속 - 초록 바닥
            groundMaterial = new THREE.MeshPhongMaterial({ color: 0x3d7e3d });
        }
        
        const ground = new THREE.Mesh(groundGeometry, groundMaterial);
        ground.rotation.x = -Math.PI / 2;
        ground.receiveShadow = true;
        this.scene.add(ground);
        
        // 환경 요소 추가
        this.addEnvironmentDetails();
    }
    
    addEnvironmentDetails() {
        if (this.sceneNumber <= 2 || this.sceneNumber >= 8) {
            // 용궁 - 기둥들
            for (let i = 0; i < 4; i++) {
                const pillarGeometry = new THREE.CylinderGeometry(1, 1.2, 10);
                const pillarMaterial = new THREE.MeshPhongMaterial({ color: 0x6699cc });
                const pillar = new THREE.Mesh(pillarGeometry, pillarMaterial);
                pillar.position.set(
                    Math.cos(i * Math.PI / 2) * 8,
                    5,
                    Math.sin(i * Math.PI / 2) * 8
                );
                this.scene.add(pillar);
            }
        } else if (this.sceneNumber >= 3 && this.sceneNumber <= 5) {
            // 해안 - 바위들
            for (let i = 0; i < 3; i++) {
                const rockGeometry = new THREE.DodecahedronGeometry(
                    Math.random() * 2 + 1
                );
                const rockMaterial = new THREE.MeshPhongMaterial({ color: 0x808080 });
                const rock = new THREE.Mesh(rockGeometry, rockMaterial);
                rock.position.set(
                    Math.random() * 10 - 5,
                    Math.random() * 1,
                    Math.random() * 10 - 5
                );
                this.scene.add(rock);
            }
        } else {
            // 숲속 - 나무들
            for (let i = 0; i < 6; i++) {
                const treeGroup = new THREE.Group();
                
                // 나무 줄기
                const trunkGeometry = new THREE.CylinderGeometry(0.5, 0.7, 4);
                const trunkMaterial = new THREE.MeshPhongMaterial({ color: 0x8b4513 });
                const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
                trunk.position.y = 2;
                treeGroup.add(trunk);
                
                // 나뭇잎
                const leavesGeometry = new THREE.SphereGeometry(2, 8, 6);
                const leavesMaterial = new THREE.MeshPhongMaterial({ color: 0x228b22 });
                const leaves = new THREE.Mesh(leavesGeometry, leavesMaterial);
                leaves.position.y = 5;
                treeGroup.add(leaves);
                
                treeGroup.position.set(
                    Math.random() * 20 - 10,
                    0,
                    Math.random() * 20 - 10
                );
                this.scene.add(treeGroup);
            }
        }
    }
    
    setupCharacters() {
        // 임시 캐릭터 (나중에 GLTF로 대체)
        // 용왕
        if ([1, 2, 8].includes(this.sceneNumber)) {
            const dragonKing = this.createCharacter(0xff0000, 2);
            dragonKing.position.set(0, 3, -5);
            this.scene.add(dragonKing);
        }
        
        // 거북이
        if ([1, 2, 3, 4, 5, 6, 7, 8, 9].includes(this.sceneNumber)) {
            const turtle = this.createCharacter(0x00ff00, 1.5);
            const turtlePositions = {
                1: [3, 1, 0],
                2: [2, 1, -3],
                3: [0, 1, 5],
                4: [-2, 1, 3],
                5: [-3, 1, 2],
                6: [0, 1, 0],
                7: [0, 1, 2],
                8: [2, 1, 0],
                9: [-2, 1, -2]
            };
            turtle.position.set(...turtlePositions[this.sceneNumber]);
            this.scene.add(turtle);
        }
        
        // 토끼
        if ([4, 5, 6, 7, 8].includes(this.sceneNumber)) {
            const rabbit = this.createCharacter(0xffffff, 1);
            const rabbitPositions = {
                4: [3, 1, 5],
                5: [0, 1, 3],
                6: [2, 1, -2],
                7: [3, 1, 0],
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
        // 필요시 애니메이션 업데이트
        // 예: 물결 효과, 바람에 흔들리는 나무 등
    }
}