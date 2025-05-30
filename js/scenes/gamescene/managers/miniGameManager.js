export class MiniGameManager {
    constructor(scene) {
        this.scene = scene;
    }

    showWarningSlideAnimation() {
        const {width, height} = this.scene.sys.game.canvas;

        // 경고 이미지 생성 (처음에는 화면 오른쪽 바깥에 위치)
        // 크기: 1417x556, 위치: 위에서 167px
        this.scene.warningSlide = this.scene.add.image(width + 700, 167, 'warning_slide_img')
            .setOrigin(0, 0) // 왼쪽 상단이 기준점
            .setDepth(26);   // 배경보다 위에 표시

        // 이미지 크기 설정 (원본 크기 그대로 사용)
        this.scene.warningSlide.setDisplaySize(1417, 556);

        // 왼쪽으로 밀어내기 애니메이션
        this.scene.tweens.add({
            targets: this.scene.warningSlide,
            x: -448, // 왼쪽으로 448px 이동 (화면 왼쪽 바깥으로)
            duration: 2000, //2초
            ease: 'Power2',
            onComplete: () => {
                console.log('GameScene: 경고 슬라이드 애니메이션 완료');
                // 경고 슬라이드 애니메이션 완료 후 미니게임 요소 표시
                this.startPreprocessingMiniGame();
            }
        });
    }


    startPreprocessingMiniGame() {
        // 아이템 이미지 생성
        const itemId = this.scene.currentTrashItemGraphic.itemData.id;

        // STEP1 이미지로 시작
        const step1ImageKey = `${itemId}_step1_img`;
        const fallbackImageKey = this.scene.currentTrashItemGraphic.texture.key;

        // 이미지 키 존재 여부 확인
        const imageKey = this.scene.textures.exists(step1ImageKey) ? step1ImageKey : fallbackImageKey;

        this.scene.preprocessingItemImage = this.scene.add.image(80, 400, imageKey)
            .setDisplaySize(120, 120)
            .setOrigin(0, 0)
            .setDepth(26);

        // 전처리 단계 정보 가져오기
        this.scene.preprocessingSteps = this.scene.currentTrashItemGraphic.itemData.preprocessingSteps || [];
        this.scene.currentPreprocessingStep = 0;
        this.scene.currentCommandIndex = 0;

        // 커맨드 키 배열 초기화
        this.scene.commandKeyImages = [];

        // 메시지 창 초기화 (처음에는 빈 상태로)
        if (this.scene.messageTextObject) {
            this.scene.messageTextObject.setText("분리수거가 가능하게 바꿔보자!\n화면에 맞는 커맨드를 입력해봐");
        }

        // 메시지 텍스트 배열 초기화
        if (this.scene.messageTexts && this.scene.messageTexts.length > 0) {
            this.scene.messageTexts.forEach(txt => txt.destroy());
            this.scene.messageTexts = [];
        }

        // 메시지 커맨드 이미지 초기화
        if (this.scene.messageCommandImages && this.scene.messageCommandImages.length > 0) {
            this.scene.messageCommandImages.forEach(img => img.destroy());
            this.scene.messageCommandImages = [];
        }

        // 커맨드 키 초기 설정
        this.setupCommandKeys();

        // 메시지 창 초기화 (처음에는 안내 메시지만)
        if (this.scene.messageTextObject) {
            this.scene.messageTextObject.setText("분리수거가 가능하게 바꿔보자!\n화면에 맞는 커맨드를 입력해봐");
            this.scene.messageTextObject.setVisible(true);
        }

        // 첫 번째 커맨드 키는 사용자 입력 후 활성화되도록 함
        // 첫 번째 커맨드 키만 입력 가능하도록 설정
        if (this.scene.commandKeyImages.length > 0) {
            this.scene.commandKeyImages[0].active = true;
        }
    }


    setupCommandKeys() {
        // 기존 커맨드 키 이미지 제거
        this.scene.commandKeyImages.forEach(key => {
            if (key.image) key.image.destroy();
        });
        this.scene.commandKeyImages = [];

        // 모든 단계의 모든 커맨드를 순서대로 배열로 변환
        let allCommands = [];
        for (let i = 0; i < this.scene.preprocessingSteps.length; i++) {
            const step = this.scene.preprocessingSteps[i];
            const commands = step.commands || [];

            for (let j = 0; j < commands.length; j++) {
                allCommands.push({
                    stepIndex: i,
                    commandIndex: j,
                    action: commands[j].action,
                    color: commands[j].color,
                    text: step.text
                });
            }
        }

        console.log('전체 커맨드 수:', allCommands.length);

        // 모든 커맨드 키 생성 (순서대로)
        for (let i = 0; i < allCommands.length; i++) {
            const command = allCommands[i];
            let keyImageKey;

            // 흐린 이미지 키 결정
            switch (command.action) {
                case 'left':
                    keyImageKey = 'left_key_dim_img';
                    break;
                case 'down':
                    keyImageKey = 'down_key_dim_img';
                    break;
                case 'right':
                    keyImageKey = 'right_key_dim_img';
                    break;
                default:
                    keyImageKey = 'down_key_dim_img';
            }

            // 키 이미지 생성 (크기 명시적 지정)
            const keyX = 240 + (i * 24);
            const keyImage = this.scene.add.image(keyX, 440, keyImageKey)
                .setDisplaySize(40, 43) // 명시적 크기 설정
                .setOrigin(0, 0)
                .setDepth(26 + (allCommands.length - i));

            this.scene.commandKeyImages.push({
                image: keyImage,
                stepIndex: command.stepIndex,
                commandIndex: command.commandIndex,
                action: command.action,
                text: command.text,
                color: command.color,
                active: i === 0 // 첫 번째 키만 활성화
            });
        }

        // 첫 번째 키 활성화 이미지로 변경
        if (this.scene.commandKeyImages.length > 0) {
            const firstKey = this.scene.commandKeyImages[0]
            let activeKeyImageKey;

            switch (firstKey.action) {
                case 'left':
                    activeKeyImageKey = 'left_key_img';
                    break;
                case 'down':
                    activeKeyImageKey = 'down_key_img';
                    break;
                case 'right':
                    activeKeyImageKey = 'right_key_img';
                    break;
                default:
                    activeKeyImageKey = 'down_key_img';
            }

            if (this.scene.textures.exists(activeKeyImageKey)) {
                firstKey.image.setTexture(activeKeyImageKey);
                firstKey.image.setDisplaySize(40, 43);
            }
        }

        console.log(`총 ${this.scene.commandKeyImages.length}개의 커맨드 키 생성됨`);
    }

}