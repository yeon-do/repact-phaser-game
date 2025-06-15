class HowToPlayScene extends Phaser.Scene {
    constructor() {
        super('HowToPlayScene');
        this.currentPage = 1;
        this.totalPages = 8;
    }

    preload() {
        // 배경 이미지
        this.load.image('howto_background', './assets/images/main_background.png');
        // 뒤로가기 버튼 (이전/다음 버튼으로도 사용)
        this.load.image('back_button', './assets/images/back.png');
        this.load.image('right', './assets/startscene/right.png');
        this.load.image('left', './assets/startscene/left.png');


        // 게임 방법 이미지들
        for (let i = 1; i <= 8; i++) {
            this.load.image(`howtoplay${i}`, `./assets/startscene/howtoplay${i}.png`);
        }
    }

    create() {
        const { width, height } = this.sys.game.canvas;

        // 배경
        this.add.image(0, 0, 'howto_background')
            .setOrigin(0)
            .setDisplaySize(width, height);

        // 현재 페이지 이미지 생성
        this.howtoImage = this.add.image(width / 2, height / 2, 'howtoplay1')
            .setOrigin(0.5);

        // 이전 버튼
        this.prevButton = this.add.image(12, 377, 'left')
            .setInteractive()
            .setOrigin(0, 0)
            .setDisplaySize(80, 85)
            .on('pointerdown', () => this.changePage(-1));

        // 다음 버튼 
        this.nextButton = this.add.image(348, 377, 'right')
            .setInteractive()
            .setOrigin(0, 0)
            .setDisplaySize(80, 85)
            .on('pointerdown', () => this.changePage(1));

        // 뒤로가기 버튼 (상단)
        const backButton = this.add.image(50, 50, 'back_button')
            .setDisplaySize(30, 34)
            .setInteractive()
            .on('pointerdown', () => {
                // 씬 매니저를 통한 직접 전환
                this.scene.stop('HowToPlayScene');
                this.scene.run('BootScene', { skipAnimation: true });
            });

        // 첫 페이지에서는 이전 버튼 숨김
        this.updateButtons();

        // === 페이드 인 오버레이 효과 추가 ===
        this.blackOverlay = this.add.rectangle(0, 0, width, height, 0x3cbb89)
            .setOrigin(0, 0)
            .setAlpha(1)
            .setDepth(100);

        this.tweens.add({
            targets: this.blackOverlay,
            alpha: 0,
            duration: 150,
            onComplete: () => {
                this.blackOverlay.destroy();
            }
        });
    }

    changePage(delta) {
        this.currentPage += delta;

        // 페이지 범위 제한
        if (this.currentPage < 1) this.currentPage = 1;
        if (this.currentPage > this.totalPages) this.currentPage = this.totalPages;

        // 이미지 업데이트
        this.howtoImage.setTexture(`howtoplay${this.currentPage}`);

        // 버튼 상태 업데이트
        this.updateButtons();
    }

    updateButtons() {
        // 첫 페이지에서는 이전 버튼 비활성화
        this.prevButton.setVisible(this.currentPage > 1);

        // 마지막 페이지에서는 다음 버튼 비활성화
        this.nextButton.setVisible(this.currentPage < this.totalPages);
    }
}


