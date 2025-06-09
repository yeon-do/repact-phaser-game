class LoginScene extends Phaser.Scene {
    constructor() {
        super('LoginScene');
        this.isTransitioning = false; // 전환 중인지 여부
    }

    preload() {
        this.load.image('login_background', './assets/images/main_background.png');
        this.load.image('white_bar', './assets/images/white_bar.png');
    }

    create() {
        // 씬이 시작될 때마다 전환 상태 초기화
        this.isTransitioning = false;
        
        const { width, height } = this.sys.game.canvas;

        // 배경 이미지
        this.add.image(0, 0, 'login_background')
            .setOrigin(0)
            .setDisplaySize(width, height);

        // 로그인 텍스트와 바
        const loginBar = this.add.image(width * 0.5, height * 0.56, 'white_bar')
            .setOrigin(0.5)
            .setAlpha(0)
            .setDepth(0);

        const loginText = this.add.text(width * 0.75, height * 0.56, '로그인', {
            fontFamily: '머니그라피',
            fontSize: '28px',
            color: '#FFFFFF'
        }).setOrigin(0.5)
            .setInteractive()
            .setDepth(1);

        // 회원가입 텍스트와 바
        const signupBar = this.add.image(width * 0.5, height * 0.62, 'white_bar')
            .setOrigin(0.5)
            .setAlpha(0)
            .setDepth(0);

        const signupText = this.add.text(width * 0.75, height * 0.62, '회원가입', {
            fontFamily: '머니그라피',
            fontSize: '28px',
            color: '#FFFFFF'
        }).setOrigin(0.5)
            .setInteractive()
            .setDepth(1);

        // 검은색 오버레이 생성 (처음에는 투명하게)
        this.blackOverlay = this.add.rectangle(0, 0, width, height, 0x3cbb89)
            .setOrigin(0, 0)
            .setAlpha(0)
            .setDepth(100) // 가장 위에 표시
            .setVisible(false);

        // 텍스트 호버 효과
        [loginText, signupText].forEach((text, index) => {
            const bar = index === 0 ? loginBar : signupBar;
            
            text.on('pointerover', () => {
                if (!this.isTransitioning) {
                    bar.setAlpha(1);
                    text.setColor('#4EB883'); // 배경색과 동일한 녹색으로 변경
                }
            });
            
            text.on('pointerout', () => {
                if (!this.isTransitioning) {
                    bar.setAlpha(0);
                    text.setColor('#FFFFFF');
                }
            });

            text.on('pointerdown', () => {
                if (!this.isTransitioning) {
                    this.showSelectionAndTransition(text, bar, index === 0 ? 'LoginInputScene' : 'SignupScene');
                }
            });
        });
    }

    showSelectionAndTransition(selectedText, selectedBar, targetScene) {
        // 전환 중 상태로 설정
        this.isTransitioning = true;

        // 선택된 텍스트와 바를 유지하고 나머지는 초기화
        selectedBar.setAlpha(1);
        selectedText.setColor('#4EB883');

        // 선택 효과를 잠시 보여준 후 전환
        this.time.delayedCall(500, () => {
            this.startSelectedScene(targetScene);
        });
    }

    startSelectedScene(targetScene) {
        // 검은색 오버레이 표시
        this.blackOverlay.setVisible(true);

        // 페이드 아웃 효과
        this.tweens.add({
            targets: this.blackOverlay,
            alpha: 1,
            duration: 700,
            onComplete: () => {
                // 페이드 아웃 완료 후 씬 전환
                this.scene.start(targetScene, { fromBlackOverlay: true });
            }
        });
    }
}