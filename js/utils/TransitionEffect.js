// TransitionEffect - 부드러운 화면 전환 효과 처리
class TransitionEffect {
    constructor() {
        this.overlay = document.getElementById('transition-overlay');
    }
    
    fadeToWhite(callback) {
        // 화면을 하얗게 페이드아웃
        this.overlay.classList.add('active');
        
        // 페이드 완료 후 콜백 실행
        setTimeout(() => {
            if (callback) callback();
        }, 800); // 전환 시간의 절반
    }
    
    fadeFromWhite() {
        // 화면을 다시 보이게 페이드인
        setTimeout(() => {
            this.overlay.classList.remove('active');
        }, 500);
    }
}