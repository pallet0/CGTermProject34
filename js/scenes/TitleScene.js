import * as THREE from 'three';

// TitleScene - 타이틀 화면 scene
class TitleScene {
    constructor() {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0xf0e6d2); // 부드러운 베이지색 배경
        
        // 카메라 설정
        this.camera = new THREE.PerspectiveCamera(
            75,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );
        this.camera.position.set(0.1, 0.0, 0.9);
        this.camera.lookAt(0, 0, 0);

        console.log("FOREST LOADING");

        // 조명 설정
        this.setupLights();
        
        // 타이틀 화면 3D 요소 설정
        this.setup3DElements();
    }
    
    setupLights() {
        // 주변광 - 부드러운 전체 조명
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        this.scene.add(ambientLight);
        
        // 방향광 - 따뜻한 햇빛 효과
        const directionalLight = new THREE.DirectionalLight(0xffeecc, 0.8);
        directionalLight.position.set(5, 10, 5);
        directionalLight.castShadow = true;
        this.scene.add(directionalLight);
    }
    
    setup3DElements() {
        // 바다를 나타내는 평면
        const { group: forestGroup, skybox } = createForestScene({
            scene: this.scene,
            camera: this.camera
        });
        forestGroup.rotation.x = -Math.PI/2;
        forestGroup.position.set(0, 0, -15);

        this.scene.add(forestGroup);
        // 배경을 숲 하늘로 바꾸고 싶으면 아래 한 줄도 추가해주냥!
        this.scene.background = skybox;
        
        // 떠다니는 구름 효과 (몽글몽글한 분위기)
        this.clouds = [];
        for (let i = 0; i < 5; i++) {
            const cloudGeometry = new THREE.SphereGeometry(
                Math.random() * 2 + 1,
                8,
                6
            );
            const cloudMaterial = new THREE.MeshPhongMaterial({
                color: 0xffffff,
                transparent: true,
                opacity: 0.7
            });
            const cloud = new THREE.Mesh(cloudGeometry, cloudMaterial);
            cloud.position.set(
                Math.random() * 20 - 10,
                Math.random() * 5 + 3,
                Math.random() * 10
            );
            cloud.scale.x = 2;
            this.clouds.push(cloud);
            this.scene.add(cloud);
        }
    }
    
    activate() {
        // Scene 활성화 시 호출
        console.log('Title Scene 활성화');
    }
    
    deactivate() {
        // Scene 비활성화 시 호출
        console.log('Title Scene 비활성화');
    }
    
    update() {
        // 매 프레임 업데이트 - 구름 애니메이션
        this.clouds.forEach((cloud, index) => {
            cloud.position.x += 0.01 * (index + 1);
            if (cloud.position.x > 15) {
                cloud.position.x = -15;
            }
        });
    }
}

export default TitleScene;