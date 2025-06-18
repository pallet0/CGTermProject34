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

        // 대화 데이터 초기화
        this.dialogues = this.getDialoguesForScene();
        this.currentDialogueIndex = 0;
        this.dialogueContainer = document.getElementById('dialogue-container');
        this.clickArea = document.getElementById('dialogue-click-area');
        this.isDialogueComplete = false;
        
        // 클릭 이벤트 바인딩
        this.handleClick = this.handleClick.bind(this);
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
            1: { pos: [-2.0, -0.7, 1.9], lookAt: [1.4, 0.1, 0.8] },      // S1(용궁) - 용왕님 원생부족
            2: { pos: [-2.1, -1.2, 2.8], lookAt: [0.4, 0.5, 2.0] },     // S2(해안) - 거북이 토끼 조우
            3: { pos: [0.9, -3.2, 1.4], lookAt: [-1.2, 0.1, 0.6] },     // S3(용궁) - 토끼 인턴 시작
            4: { pos: [1.8, -1.2, 1.3], lookAt: [-0.9, 0.3, 0.7] },      // S4(용궁) - 용왕이 토끼에 석사 전환 권유, 토끼 친구 핑계
            5: { pos: [-5.3, -4.1, -2.5], lookAt: [-5.4, 2.8, -2.5] },     // S5(숲속) - 거북이가 토끼 에스코트해 땅으로 옴, 나무 위 동방에서 친구 데려오기
            6: { pos: [0.5, -2.2, 3.9], lookAt: [6.8, 0.3, 0.6] },     // S6-1(숲속) - 친구를 진짜 데려옴
            7: { pos: [-16.2, 2.4, 3.6], lookAt: [-5.4, 2.8, -2.5] },      // S6-2(숲속, 한 나무 근처) - 토끼가 나무 위로 올라감(대학원생은 동아리 가입 금지)
            8: { pos: [0.6, 0.0, 2.0], lookAt: [-1.7, 0.5, 0.8] },     // S7-1(용궁) - 거1토2 행복한 대학원 라이프
            9: { pos: [0.4, -0.8, 2.5], lookAt: [-1.1, 0.7, 1.0] }     // S7-2(용궁) - 거북이 홀로 돌아와 용궁과 대면
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
            const sunLight = new THREE.DirectionalLight(0xFFFFFF, 0.4);
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
            9: [-0.9, 1.3, 0.4]
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
            9: [2.0, 0.05]
        };

        // 조교 설정
        const turtlePositions = {
            1: [1.1,-0.9,0.5],
            2: [0, -1, 2.2],
            3: [-0.6, -2, 0.4],
            4: [-1, 1.3, 0.5],
            5: [-4, -1.6, -3.7],
            6: [5.2, 0.6, 0.3],
            7: [-6.1, 1.5, -3.6],
            8: [-0.7, -0.3, 0.25],
            9: [-0.4, 0.8, 0.4]
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
            9: 0.25
        };
        const turtleRotationYZ = {
            1: [1.6, 0],
            2: [1.6, 0.2],
            3: [0.8, 0],
            4: [1, 0],
            5: [2, 0],
            6: [0, 0],
            7: [2.5, 0.3],
            8: [2.5, 0],
            9: [2, 0]
        };

        // 토끼 설정        
        const rabbitPositions = {
            2: [-0.1, 0.6, 2.3],
            3: [-1.1, -0.2, 0.4],
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
            3: [2.7, 0],
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

    getDialoguesForScene() {
        // Scene별 대화 데이터 - position 속성 추가 ('left' 또는 'right')
        const dialogueData = {
            1: [
                { speaker: 'none', text: '어느 날, 공학원 건물 앞', profile: './glsl/propic_none.png', position: 'middle' },
                { speaker: 'turtle', text: '용왕님, 인턴이 또 학사 졸업을 해버렸습니다…', profile: './glsl/propic_turtleR.png', position: 'right' },
                { speaker: 'turtle', text: '분명 석사 전환을 희망한다 해서 뽑았는데…', profile: './glsl/propic_turtleR.png', position: 'right' },
                { speaker: 'dragonKing', text: '요즘 학부생들은 의지가 박약하구만…', profile: './glsl/propic_dragonkingL.png', position: 'left' },
                { speaker: 'dragonKing', text: '별 조교, 쓸만한 인턴 한 마리만 데려오게.', profile: './glsl/propic_dragonkingL.png', position: 'left' },
                { speaker: 'turtle', text: '이번엔… 꼭 살아남을 녀석으로 골라보겠습니다.', profile: './glsl/propic_turtleR.png', position: 'right' },
            ],
            2: [
                { speaker: 'turtle', text: '거기, 지나가는 똑똑한 토끼분.', profile: './glsl/propic_turtleR.png', position: 'right' },
                { speaker: 'rabbit', text: '네? 저, 저요?', profile: './glsl/propic_rabbitL.png', position: 'left' },
                { speaker: 'turtle', text: '이번 학기 기말과제, 정말 인상깊게 봤습니다.', profile: './glsl/propic_turtleR.png', position: 'right' },
                { speaker: 'turtle', text: '한 번 랩실에서 보다 수준있는 연구와 경력을 쌓지 않겠어요?', profile: './glsl/propic_turtleR.png', position: 'right' },
                { speaker: 'rabbit', text: '어? 음… 잠깐만 해도 괜찮은 거죠?', profile: './glsl/propic_rabbitL.png', position: 'left' }
            ],
            3: [
                { speaker: 'none', text: '몇 달 뒤, 연구실', profile: './glsl/propic_none.png', position: 'middle' },
                { speaker: 'dragonKing', text: '별 조교, 이번엔 좀 어떤가?', profile: './glsl/propic_dragonkingR.png', position: 'right' },
                { speaker: 'turtle', text: '아, 용왕님. 그게… 이걸 한 번 읽어보시겠습니까?', profile: './glsl/propic_turtleL.png', position: 'left' },
                { speaker: 'dragonKing', text: '이건…!', profile: './glsl/propic_dragonkingR.png', position: 'right' },
                { speaker: 'turtle', text: '인턴 한 달 동안 저 토끼가 직접 연구해온 거라고 합니다.', profile: './glsl/propic_turtleL.png', position: 'left' },
                { speaker: 'dragonKing', text: '그게 정말인가? 허, 참… 한 번 따로 이야기를 해봐야곘군.', profile: './glsl/propic_dragonkingR.png', position: 'right' },
            ],
            4: [
                { speaker: 'rabbit', text: '교수님, 어떤 일로 부르셨나요?', profile: './glsl/propic_rabbitL.png', position: 'left' },
                { speaker: 'dragonKing', text: '토끼 학생, 지난 몇 달 간 지켜봤지만 토끼 분같이 성실한 인턴은 처음이에요.', profile: './glsl/propic_dragonkingR.png', position: 'right' },
                { speaker: 'dragonKing', text: '이번 기회에 석사 과정을 밟아보는 건 어떤가요?.', profile: './glsl/propic_dragonkingR.png', position: 'right' },
                { speaker: 'rabbit', text: '아, 그게… 어…', profile: './glsl/propic_rabbitL.png', position: 'left' },
                { speaker: 'rabbit', text: '제가 가입한 동아리에 저보다도 유능한 학부생이 있습니다.', profile: './glsl/propic_rabbitL.png', position: 'left' },
                { speaker: 'rabbit', text: '지금 동아리방에 있을텐데, 함께 석사를 하자고 하면 흔쾌히 수락할 것입니다.', profile: './glsl/propic_rabbitL.png', position: 'left' },
                { speaker: 'dragonKing', text: '그럼, 그 친구에게도 한 번 물어보고 오세요!', profile: './glsl/propic_dragonkingR.png', position: 'right' }
            ],
            5: [
                { speaker: 'rabbit', text: '이 학생회관 나무를 타고 올라가면 저희 동아리방이에요.', profile: './glsl/propic_rabbitL.png', position: 'left' },
                { speaker: 'rabbit', text: '근데 동아리가 원칙상 대학원생 출입 금지라… 혼자 가서 데려올게요.', profile: './glsl/propic_rabbitL.png', position: 'left' },
                { speaker: 'turtle', text: '알겠습니다. 여기서 기다릴테니 잘 부탁드립니다.', profile: './glsl/propic_turtleR.png', position: 'right' }
            ],
            6: [
                { speaker: 'rabbit2', text: '그, 파랑토끼야… 여기가 정말 학사 채용 설명회하는 곳 맞아?', profile: './glsl/propic_rabbit2L.png', position: 'left' },
                { speaker: 'rabbit', text: '들어올 땐 마음대로지만 나갈 땐 아니란다.', profile: './glsl/propic_rabbitR.png', position: 'right' },
                { speaker: 'rabbit2', text: '뭐?! 이, 이게 무슨 소리야! 말도 안된다고…!', profile: './glsl/propic_rabbit2L.png', position: 'left' },
                { speaker: 'turtle', text: '두 분 모두 환영합니다!', profile: './glsl/propic_turtleR.png', position: 'right' },
                { speaker: 'rabbit', text: '이런 귀한 경험의 기회를 나만 누릴 순 없지!', profile: './glsl/propic_rabbitR.png', position: 'right' },
            ],
            7: [
                { speaker: 'turtle', text: '토끼 학생, 도대체 언제 내려오시는 건가요?!', profile: './glsl/propic_turtleR.png', position: 'right' },
                { speaker: 'rabbit', text: '조교님은 그걸 믿으셨어요?', profile: './glsl/propic_rabbitL.png', position: 'left' },
                { speaker: 'turtle', text: '네?', profile: './glsl/propic_turtleR.png', position: 'right' },
                { speaker: 'rabbit', text: '그렇게 똑똑한 학생이 있었다면 저보다 더 눈에 띄었겠죠.', profile: './glsl/propic_rabbitL.png', position: 'left' },
                { speaker: 'turtle', text: '그런…! 토끼 학생! 제발 다시 한 번만 생각을…!', profile: './glsl/propic_turtleR.png', position: 'right' },
                { speaker: 'rabbit', text: '이만 포기하고 돌아가요. 저 오늘 동아리방에서 절대 안 나갈 거니까.', profile: './glsl/propic_rabbitL.png', position: 'left' },
            ],
            8: [
                { speaker: 'none', text: '수 개월 후…', profile: './glsl/propic_none.png', position: 'middle' },
                { speaker: 'rabbit2', text: '파랑토끼야, 정말… 정말 고마워. 그 때 너가 아니었다면…', profile: './glsl/propic_rabbit2R.png', position: 'right' },
                { speaker: 'rabbit', text: '정신 차려보니 SCI 등재… 단톡방도 조용하고, 내가 제1저자라니…', profile: './glsl/propic_rabbitL.png', position: 'left' },
                { speaker: 'dragonKing', text: '수고했어요. 두 분은 우리 랩실의 전설로 남을 겁니다.', profile: './glsl/propic_dragonkingR.png', position: 'right' },
                { speaker: 'turtle', text: '훌쩍… 처음이야… 우리 랩실에서 이런 업적을…!', profile: './glsl/propic_turtleL.png', position: 'left' }
            ],
            9: [
                { speaker: 'turtle', text: '용왕님… 그게…', profile: './glsl/propic_turtleR.png', position: 'right' },
                { speaker: 'dragonKing', text: '…설마 이번에도…', profile: './glsl/propic_dragonkingL.png', position: 'left' },
                { speaker: 'turtle', text: '토끼 학생이… 동아리 방에서 나오질 않습니다.', profile: './glsl/propic_turtleR.png', position: 'right' },
                { speaker: 'turtle', text: '그… 혹시 저도 이번에 휴학ㅇ…', profile: './glsl/propic_turtleR.png', position: 'right' },
                { speaker: 'dragonKing', text: '그럼… 다음 토끼에겐 랩을 \'게임 그래픽 연구실\'이라고 소개하게.', profile: './glsl/propic_dragonkingL.png', position: 'left' },
                { speaker: 'dragonKing', text: '토끼들이 특히나 좋아하더군.', profile: './glsl/propic_dragonkingL.png', position: 'left' }
            ]
        };
        
        return dialogueData[this.sceneNumber] || [];
    }
    
    handleClick(event) {
        // UI 요소 클릭은 무시
        if (event.target.tagName === 'BUTTON' || 
            event.target.classList.contains('dialogue-tip')) {
            return;
        }
        
        this.showNextDialogue();
    }

    handleClick(event) {
        // UI 요소 클릭은 무시
        if (event.target.classList.contains('choice-button') || 
            event.target.classList.contains('next-button')) {
            return;
        }
        
        this.showNextDialogue();
    }

    showNextDialogue() {
        if (this.currentDialogueIndex < this.dialogues.length) {
            const dialogue = this.dialogues[this.currentDialogueIndex];
            
            // 말풍선 생성
            const wrapper = document.createElement('div');
            wrapper.className = `dialogue-wrapper ${dialogue.position}`;
            
            // 프로필 이미지
            const profile = document.createElement('div');
            profile.className = 'dialogue-profile';
            profile.style.backgroundImage = `url('${dialogue.profile}')`;
            
            // 말풍선
            const bubble = document.createElement('div');
            bubble.className = 'dialogue-bubble';
            bubble.textContent = dialogue.text;
            
            wrapper.appendChild(profile);
            wrapper.appendChild(bubble);
            
            this.dialogueContainer.appendChild(wrapper);
            
            // 스크롤을 최하단으로
            setTimeout(() => {
                this.dialogueContainer.scrollTop = this.dialogueContainer.scrollHeight;
            }, 100);
            
            this.currentDialogueIndex++;
            
            // 대화가 모두 끝났는지 확인
            if (this.currentDialogueIndex >= this.dialogues.length) {
                this.onDialogueComplete();
            }
        }
    }

    onDialogueComplete() {
        this.isDialogueComplete = true;
        
        // 대화 완료 시 클릭 영역 비활성화 (OrbitControls 활성화)
        this.clickArea.style.display = 'none';
        this.clickArea.classList.remove('active');
        this.clickArea.removeEventListener('click', this.handleClick);
        
        // Scene에 따른 처리
        if (this.sceneNumber === 1) {
            console.log("DIALOGUE 1 COMPLETE");
            document.getElementById('dialogue-tip').textContent = 'Tip: 대화 끝! 주위를 드래그하여 주변을 둘러보세요! (OrbitControls 활성화)';
        } else if (this.sceneNumber === 5) {
            // Scene 5: 선택지 버튼 표시
            document.getElementById('choice-buttons').style.display = 'flex';
        } else if (this.sceneNumber === 8) {
            // Scene 8: 엔딩 A 표시
            setTimeout(() => {
                document.getElementById('ending-a').style.display = 'block';
            }, 1500);
        } else if (this.sceneNumber === 9) {
            // Scene 9: 엔딩 B 표시
            setTimeout(() => {
                document.getElementById('ending-b').style.display = 'block';
            }, 1500);
        } 
        
        if (![5, 8, 9].includes(this.sceneNumber)) {
            // 그 외 Scene: 다음 버튼 활성화
            const nextBtn = document.getElementById('next-btn');
            if (nextBtn) {
                nextBtn.disabled = false;
            }
        }
    }

    activate() {
        console.log(`Story Scene ${this.sceneNumber} 활성화`);
        
        // 대화 초기화
        this.dialogueContainer.innerHTML = '';
        this.currentDialogueIndex = 0;
        this.isDialogueComplete = false;
        
        // 클릭 영역 활성화
        this.clickArea.style.display = 'block';
        this.clickArea.classList.add('active');
        this.clickArea.addEventListener('click', this.handleClick);
        
        // Scene 1에서 툴팁 표시
        if (this.sceneNumber === 1) {
            document.getElementById('dialogue-tip').textContent = 'Tip: 화면 아무 곳이나 눌러 대화를 진행하세요!';
            document.getElementById('dialogue-tip').style.display = 'block';
        }
        
        // 첫 대화 표시
        setTimeout(() => {
            this.showNextDialogue();
        }, 500);
    }
    
    deactivate() {
        console.log(`Story Scene ${this.sceneNumber} 비활성화`);
        
        // 클릭 영역 비활성화
        this.clickArea.style.display = 'none';
        this.clickArea.classList.remove('active');
        this.clickArea.removeEventListener('click', this.handleClick);
        
        // 대화 내용 제거
        this.dialogueContainer.innerHTML = '';
        
        // 툴팁 숨기기
        document.getElementById('dialogue-tip').style.display = 'none';
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