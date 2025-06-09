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
        this.howtoImage = this.add.image(width/2, height/2, 'howtoplay1')
            .setOrigin(0.5);

        // 이전 버튼 (back.png 그대로 사용)
        this.prevButton = this.add.image(50, height/2, 'back_button')
            .setInteractive()
            .setOrigin(0.5)
            .setDisplaySize(50, 50)
            .on('pointerdown', () => this.changePage(-1));

        // 다음 버튼 (back.png를 180도 회전)
        this.nextButton = this.add.image(width - 50, height/2, 'back_button')
            .setInteractive()
            .setOrigin(0.5)
            .setDisplaySize(50, 50)
            .setRotation(Math.PI) // 180도 회전
            .on('pointerdown', () => this.changePage(1));

        // 뒤로가기 버튼 (상단)
        const backButton = this.add.image(50, 50, 'back_button')
            .setDisplaySize(30, 34)
            .setInteractive()
            .on('pointerdown', () => {
                // 씬 매니저를 통한 직접 전환
                this.scene.stop('HowToPlayScene');
                this.scene.run('BootScene');
            });

        // 첫 페이지에서는 이전 버튼 숨김
        this.updateButtons();
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