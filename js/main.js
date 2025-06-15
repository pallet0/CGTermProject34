import SceneManager from './SceneManager.js';

// 메인 진입점 - 전체 애플리케이션 초기화
let sceneManager;

window.addEventListener('DOMContentLoaded', () => {
    // 캔버스 컨테이너 설정
    const container = document.getElementById('canvas-container');
    
    // SceneManager 초기화
    sceneManager = new SceneManager(container);
    
    // 애플리케이션 시작
    sceneManager.start();
    
    // 윈도우 리사이즈 처리
    window.addEventListener('resize', () => {
        sceneManager.onWindowResize();
    });
});

export function restartStory() {
    if (sceneManager) sceneManager.goToTitle();
}

window.restartStory = restartStory;