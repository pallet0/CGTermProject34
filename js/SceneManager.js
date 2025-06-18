import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import TransitionEffect from './utils/TransitionEffect.js';
import TitleScene from './scenes/TitleScene.js';
import { StoryScene } from './scenes/StoryScenes.js';

// SceneManager - 모든 scene을 관리하고 전환을 처리
class SceneManager {
    constructor(container) {
        this.container = container;
        this.currentSceneIndex = 0;
        this.scenes = [];
        this.transitionEffect = new TransitionEffect();
        this.controls = null;
        
        // Three.js 기본 설정
        this.setupThreeJS();
        
        // 모든 scene 초기화
        this.initializeScenes();
        
        // 이벤트 리스너 설정
        this.setupEventListeners();
    }
    
    setupThreeJS() {
        // 렌더러 설정
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.container.appendChild(this.renderer.domElement);
        
        // 기본 카메라 설정
        this.camera = new THREE.PerspectiveCamera(
            75,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );
    }
    
    initializeScenes() {
        // 타이틀 scene
        this.scenes.push(new TitleScene());
        
        // 스토리 scenes (1-9)
        for (let i = 1; i <= 9; i++) {
            this.scenes.push(new StoryScene(i, this.renderer, this.renderer.domElement));
        }
    }
    
    setupEventListeners() {
        // 다음 버튼 클릭 이벤트
        const nextBtn = document.getElementById('next-btn');
        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                // 타이틀(0) ~ Scene 6까지만 next로 이동
                if (this.currentSceneIndex >= 0 && this.currentSceneIndex <= 9) {
                    this.nextScene();
                }
            });
        }
        
        // Scene 5의 선택지 버튼 이벤트
        document.getElementById('choice-a').addEventListener('click', () => {
            this.goToScene(6); // Scene 6로 이동
        });
        
        document.getElementById('choice-b').addEventListener('click', () => {
            this.goToScene(7); // Scene 7로 이동
        });
    }
    
    start() {
        // 첫 번째 scene 활성화
        this.activateScene(0);
        
        // 애니메이션 루프 시작
        this.animate();
    }
    
    animate() {
        requestAnimationFrame(() => this.animate());
        if (this.controls) this.controls.update();
        
        // 현재 scene 업데이트
        const currentScene = this.scenes[this.currentSceneIndex];
        if (currentScene) {
            currentScene.update();
            this.renderer.render(currentScene.scene, currentScene.camera);
        }
    }
    
    nextScene() {
        // 다음 scene으로 전환

        if (this.currentSceneIndex === 6){
            this.transitionToScene(8);
            return;
        }

        if (this.currentSceneIndex === 7){
            this.transitionToScene(9);
            return;
        }

        const nextIndex = this.currentSceneIndex + 1;
        if (nextIndex < this.scenes.length) {
            this.transitionToScene(nextIndex);
        }
    }
    
    goToScene(index) {
        // 특정 scene으로 전환
        if (index >= 0 && index < this.scenes.length) {
            this.transitionToScene(index);
        }
    }
    
    goToTitle() {
        // 타이틀 화면으로 돌아가기
        this.hideAllUI();
        this.transitionToScene(0);
    }
    
    transitionToScene(newIndex) {
        // 화면 전환 효과와 함께 scene 변경
        this.transitionEffect.fadeToWhite(() => {
            this.deactivateScene(this.currentSceneIndex);
            this.currentSceneIndex = newIndex;
            this.activateScene(newIndex);
            this.transitionEffect.fadeFromWhite();
        });
    }
    
    activateScene(index) {
        const scene = this.scenes[index];
        if (scene) {
            scene.activate();

            this.controls = new OrbitControls(scene.camera, this.renderer.domElement);
            this.controls.enableDamping = true;
            this.controls.dampingFactor = 0.008;
            this.controls.minPolarAngle = Math.PI * 0.1;
            this.controls.maxPolarAngle = Math.PI * 0.5;
            this.controls.enableZoom = true;
            this.controls.enablePan = true;

            const savedLookAt = scene.camera.userData?.lookAt;
            if (savedLookAt) {
                this.controls.target.set(...savedLookAt);
                this.controls.update();
            }

            // UI 표시 처리
            if (index === 0) {
                // 타이틀 화면 UI 표시
                document.getElementById('title-ui').style.display = 'block';
                document.getElementById('next-btn').style.display = 'block';
                document.getElementById('next-btn').disabled = false; // 타이틀에서는 활성화
            } else if (index === 5) {
                // Scene 5: 선택지만 (대화 끝나면 표시됨)
                document.getElementById('next-btn').style.display = 'none';
            } else if (index === 8 || index === 9) {
                // Scene 8, 9: 엔딩 (대화 끝나면 엔딩 카드 표시됨)
                document.getElementById('next-btn').style.display = 'none';
            } else {
                // 일반 스토리 scene들
                document.getElementById('next-btn').style.display = 'block';
                document.getElementById('next-btn').disabled = true; // 처음엔 비활성화
            }

            // 디버깅용 이벤트 리스너
            this.controls.addEventListener('change', () => {
                const pos = scene.camera.position;
                const target = this.controls.target;
                const yawRad = this.controls.getAzimuthalAngle();
                const polar = this.controls.getPolarAngle();  
                console.log('카메라 Position:', `[${pos.x.toFixed(1)}, ${pos.y.toFixed(1)}, ${pos.z.toFixed(1)}]`);
                console.log('카메라 LookAt:', `[${target.x.toFixed(1)}, ${target.y.toFixed(1)}, ${target.z.toFixed(1)}]`);
                console.log('카메라 Global 기준 Rotation Y:', `[${yawRad.toFixed(1)}]`);
                console.log('카메라 Global 기준 Rotation Z:', `[${(polar - Math.PI/2).toFixed(1)}]`)
            });
        }
    }
    
    deactivateScene(index) {
        const scene = this.scenes[index];
        if (scene) {
            scene.deactivate();
            
            // UI 숨기기 처리
            if (index === 0) {
                document.getElementById('title-ui').style.display = 'none';
                document.getElementById('next-btn').style.display = 'none';
            } else {
                document.getElementById('choice-buttons').style.display = 'none';
                document.getElementById('choice-buttons').style.display = 'none';                
            }
        }
    }
    

    hideAllUI() {
        // 모든 UI 요소 숨기기
        document.getElementById('title-ui').style.display = 'none';
        document.getElementById('choice-buttons').style.display = 'none';
        document.getElementById('ending-a').style.display = 'none';
        document.getElementById('ending-b').style.display = 'none';
        document.getElementById('next-btn').style.display = 'none';
        document.getElementById('dialogue-tip').style.display = 'none';
        
        // 대화 관련 UI 초기화
        document.getElementById('dialogue-container').innerHTML = '';
        document.getElementById('dialogue-click-area').style.display = 'none';
        document.getElementById('dialogue-click-area').classList.remove('active');
    }
    
    onWindowResize() {
        // 창 크기 변경 시 처리
        const width = window.innerWidth;
        const height = window.innerHeight;
        
        this.renderer.setSize(width, height);
        
        // 모든 scene의 카메라 업데이트
        this.scenes.forEach(scene => {
            if (scene.camera) {
                scene.camera.aspect = width / height;
                scene.camera.updateProjectionMatrix();
            }
        });
    }
}

export default SceneManager;