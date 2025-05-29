class HowToPlayScene extends Phaser.Scene {
    constructor() {
        super('HowToPlayScene');
    }

    preload() {
        // 배경 이미지
        this.load.image('howto_background', './assets/images/main_background.png');
        // 뒤로가기 버튼
        this.load.image('back_button', './assets/images/back.png');
        // 게임 방법 설명용 이미지들
        /*
        this.load.image('type1_guide', './assets/images/guide/type1_guide.png');
        this.load.image('type2_guide', './assets/images/guide/type2_guide.png');
        this.load.image('type3_guide', './assets/images/guide/type3_guide.png');
        */
    }

    create() {
        const { width, height } = this.sys.game.canvas;

        // 배경
        this.add.image(0, 0, 'howto_background')
            .setOrigin(0)
            .setDisplaySize(width, height);

        // 제목
        this.add.text(width / 2, 100, '게임 방법', {
            font: '32px "머니그라피"',
            fill: '#FFFFFF',
            align: 'center'
        }).setOrigin(0.5);

        // 설명 텍스트 스타일
        const textStyle = {
            font: '20px "머니그라피"',
            fill: '#FFFFFF',
            align: 'left',
            wordWrap: { width: width - 80 }
        };

        // 각 타입별 설명
        this.createTypeExplanation(width, 180, 'Type 1: 기본 분리수거', [
            '- 떨어지는 쓰레기를 올바른 분리수거함에 넣으세요',
            '- ← → 키로 좌우 이동',
            '- ↓ 키로 빠르게 낙하'
        ], textStyle);

        this.createTypeExplanation(width, 350, 'Type 2: 전처리 분리수거', [
            '- 쓰레기를 전처리한 후 분리수거해야 합니다',
            '- 화면의 지시에 따라 올바른 키를 입력하세요',
            '- 전처리 후 알맞은 분리수거함에 넣으세요'
        ], textStyle);

        this.createTypeExplanation(width, 520, 'Type 3: 퀴즈 분리수거', [
            '- 쓰레기의 올바른 분류를 선택하세요',
            '- ← → 키로 선택지 이동',
            '- 정답이 있는 쪽으로 쓰레기를 떨어뜨리세요'
        ], textStyle);

        // 점수 및 생명 시스템 설명
        this.createTypeExplanation(width, 690, '게임 규칙', [
            '- 올바른 분리수거 시 점수 획득',
            '- 틀릴 경우 생명이 줄어듭니다',
            '- 생명이 모두 없어지면 게임 오버'
        ], textStyle);

        // 뒤로가기 버튼
        const backButton = this.add.image(50, 50, 'back_button')
            .setDisplaySize(30, 34)
            .setInteractive();

        backButton.on('pointerdown', () => {
            this.scene.start('BootScene');
        });
    }

    createTypeExplanation(width, yPosition, title, textArray, style) {
        // 제목
        this.add.text(40, yPosition, title, {
            font: '24px "머니그라피"',
            fill: '#FFFFFF',
            align: 'left'
        });

        // 설명 텍스트들
        textArray.forEach((text, index) => {
            this.add.text(60, yPosition + 40 + (index * 30), text, style);
        });
    }
}