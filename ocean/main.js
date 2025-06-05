import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { Water } from 'three/addons/objects/Water.js';
import { Sky } from 'three/addons/objects/Sky.js';

let camera, scene, renderer;
let controls, water, sun;
let isUnderwater = false;
let fishGroup;

init();
animate();


function init() {
    // 렌더러 설정
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.5;
    document.body.appendChild(renderer.domElement);

    // 씬 설정
    scene = new THREE.Scene();

    // 카메라 설정
    camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 1, 20000);
    camera.position.set(30, 30, 100);

    // 태양 설정
    sun = new THREE.Vector3();

    // 바닥 설정
    const groundGeometry = new THREE.PlaneGeometry(10000, 10000);
    const groundMaterial = new THREE.MeshStandardMaterial({
        color: 0x1a472a,
        roughness: 0.8,
        metalness: 0.2
    });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -10;
    scene.add(ground);

    // 물 설정
    const waterGeometry = new THREE.PlaneGeometry(10000, 10000);
    water = new Water(
        waterGeometry,
        {
            textureWidth: 512,
            textureHeight: 512,
            waterNormals: new THREE.TextureLoader().load('https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/waternormals.jpg', function (texture) {
                texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
            }),
            sunDirection: new THREE.Vector3(),
            sunColor: 0x0909ff,
            waterColor: 0x0000ff,
            distortionScale: 3.7,
            fog: scene.fog !== undefined,
            alpha: 0.7
        }
    );
    water.rotation.x = -Math.PI / 2;
    water.position.y = 0;
    scene.add(water);

    // 하늘 설정
    const sky = new Sky();
    sky.scale.setScalar(10000);
    scene.add(sky);

    const skyUniforms = sky.material.uniforms;
    skyUniforms['turbidity'].value = 10;
    skyUniforms['rayleigh'].value = 2;
    skyUniforms['mieCoefficient'].value = 0.005;
    skyUniforms['mieDirectionalG'].value = 0.8;

    const parameters = {
        elevation: 2,
        azimuth: 180
    };

    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    let renderTarget;

    function updateSun() {
        const phi = THREE.MathUtils.degToRad(90 - parameters.elevation);
        const theta = THREE.MathUtils.degToRad(parameters.azimuth);

        sun.setFromSphericalCoords(1, phi, theta);

        sky.material.uniforms['sunPosition'].value.copy(sun);
        water.material.uniforms['sunDirection'].value.copy(sun).normalize();

        if (renderTarget !== undefined) renderTarget.dispose();

        renderTarget = pmremGenerator.fromScene(sky);
        scene.environment = renderTarget.texture;
    }

    updateSun();

    // 조명 설정
    const ambientLight = new THREE.AmbientLight(0x404040, 2);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(1, 1, 1);
    scene.add(directionalLight);

    // 물속 조명
    const underwaterLight = new THREE.PointLight(0x0066ff, 1, 100);
    underwaterLight.position.set(0, -5, 0);
    scene.add(underwaterLight);

    // 컨트롤 설정
    controls = new OrbitControls(camera, renderer.domElement);
    controls.maxPolarAngle = Math.PI * 0.495;
    controls.target.set(0, 10, 0);
    controls.minDistance = 40.0;
    controls.maxDistance = 200.0;
    controls.update();

    // 카메라 전환 이벤트
    window.addEventListener('keydown', (event) => {
        if (event.code === 'Space') {
            isUnderwater = !isUnderwater;
            if (isUnderwater) {
                camera.position.set(0, -5, 0);
                controls.target.set(0, -5, 0);
            } else {
                camera.position.set(30, 30, 100);
                controls.target.set(0, 10, 0);
            }
            controls.update();
        }
    });

    // 창 크기 조절 이벤트
    window.addEventListener('resize', onWindowResize);
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
    requestAnimationFrame(animate);
    render();
}

function render() {
    const time = performance.now() * 0.001;
    water.material.uniforms['time'].value = time;
    renderer.render(scene, camera);
} 