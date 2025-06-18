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
        this.camera.position.set(-0.1, 0.0, 2.4);
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

        // 그림자 해상도 향상
        directionalLight.shadow.mapSize.set(4096, 4096);

        // 그림자 투영 카메라 범위 확대 (더 넓은 영역에 그림자 투영)
        const d = 50; // 값이 클수록 범위 넓음
        directionalLight.shadow.camera.left = -d;
        directionalLight.shadow.camera.right = d;
        directionalLight.shadow.camera.top = d;
        directionalLight.shadow.camera.bottom = -d;
        directionalLight.shadow.camera.near = 0.5;
        directionalLight.shadow.camera.far = 200;

        this.scene.add(directionalLight);

        directionalLight.shadow.mapSize.set(1024, 1024);
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
        // 배경을 숲 하늘로 바꾸고 싶으면 아래 한 줄도 추가
        const canvas = document.createElement('canvas');
        canvas.width = 16;
        canvas.height = 256;
        const ctx = canvas.getContext('2d');
        // 위(0)에서 남색, 아래(1)에서 하늘색으로 그라디언트
        const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
        grad.addColorStop(0.3, '#0077b6'); // navy
        grad.addColorStop(0, '#caf0f8'); // skyblue
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        // THREE.CanvasTexture로 변환해서 배경에 설정
        const bgTexture = new THREE.CanvasTexture(canvas);
        bgTexture.magFilter = THREE.LinearFilter;
        bgTexture.minFilter = THREE.LinearFilter;
        this.scene.background = bgTexture;
        
        // 떠다니는 구름 효과 (몽글몽글한 분위기)
        this.clouds = [];
        for (let i = 0; i < 8; i++) {
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
                Math.random() * 5 + 5,
                Math.random() * 10-15
            );
            cloud.scale.x = 2;
            forestGroup.rotation.x = -Math.PI/2;
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