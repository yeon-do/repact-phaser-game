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
        this.howtoImage = this.add.image(width / 2, height / 2, 'howtoplay1')
            .setOrigin(0.5);

        // 이전 버튼 (back.png 그대로 사용)
        this.prevButton = this.add.image(50, height / 2, 'back_button')
            .setInteractive()
            .setOrigin(0.5)
            .setDisplaySize(50, 50)
            .on('pointerdown', () => this.changePage(-1));

        // 다음 버튼 (back.png를 180도 회전)
        this.nextButton = this.add.image(width - 50, height / 2, 'back_button')
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

        // 게임 시작 버튼(임시) 생성 및 숨김
        this.startButton = this.add.container(width / 2, height / 2 + 200);
        const buttonBg = this.add.rectangle(0, 0, 180, 60, 0x4caf50, 1).setStrokeStyle(2, 0xffffff);
        const buttonText = this.add.text(0, 0, '게임 시작', {
            fontSize: '28px',
            color: '#fff',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        this.startButton.add([buttonBg, buttonText]);
        this.startButton.setSize(180, 60);
        this.startButton.setInteractive(new Phaser.Geom.Rectangle(-90, -30, 180, 60), Phaser.Geom.Rectangle.Contains);
        this.startButton.on('pointerdown', () => {
            // 검은색 오버레이 생성 (한 번만 생성)
            if (!this.blackOverlay) {
                const { width, height } = this.sys.game.canvas;
                this.blackOverlay = this.add.rectangle(width / 2, height / 2, width, height, 0x3cbb89, 1)
                    .setAlpha(0)
                    .setDepth(1000);
            } else {
                this.blackOverlay.setAlpha(0).setVisible(true);
            }

            // 페이드 아웃 효과
            this.tweens.add({
                targets: this.blackOverlay,
                alpha: 1,
                duration: 700,
                onComplete: () => {
                    this.scene.stop('HowToPlayScene');
                    this.scene.start('GameScene'); // 실제 게임 씬 이름에 맞게 수정
                }
            });
        });
        this.startButton.setVisible(false);


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

        // 마지막 페이지에서만 게임 시작 버튼 표시
        if (this.currentPage === this.totalPages) {
            this.startButton.setVisible(true);
        } else {
            this.startButton.setVisible(false);
        }
    }

}