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

// 전역 함수 - 다시하기 버튼 클릭 시 호출
function restartStory() {
    sceneManager.goToTitle();
}