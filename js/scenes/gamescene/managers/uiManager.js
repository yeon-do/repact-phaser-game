export class UiManager{
    constructor(scene) {
        this.scene = scene;
    }
    
    create() {
        console.log('GameScene: create 실행.');

        // 배경색 설정
        this.scene.cameras.main.setBackgroundColor('#3cbb89');

        // UI 컨테이너 생성
        this.createUIContainers();

        // 공통 UI 생성
        this.createCommonUI();

        // 각 타입별 UI 생성
        this.createType1UI();
        this.createType2UI();
        this.createType3UI();

        // ★ 명시적으로 모든 타입 UI 숨기기
        this.scene.uiContainers.type1.setVisible(false);
        this.scene.uiContainers.type2.setVisible(false);
        this.scene.uiContainers.type3.setVisible(false);
        this.scene.uiContainers.type2Popup.setVisible(false);

        // 검은색 오버레이 생성 (처음에는 완전히 불투명하게)
        const {width, height} = this.scene.sys.game.canvas;
        this.scene.blackOverlay = this.scene.add.rectangle(0, 0, width, height, 0x3cbb89)
            .setOrigin(0, 0)
            .setAlpha(1)
            .setDepth(100);

        // 페이드 인 효과 (검은색 -> 투명)
        this.scene.tweens.add({
            targets: this.scene.blackOverlay,
            alpha: 0,
            duration: 500,
            onComplete: () => {
                this.scene.blackOverlay.destroy();
                // 아이템 낙하 시작
                this.scene.isFalling = true;
                this.scene.lastFallTime = this.scene.game.getTime();
            }
        });

        console.log('GameScene: create 완료.');
    }


    createUIContainers() {
        // 각 게임 타입별 UI 컨테이너 생성
        this.scene.uiContainers.common = this.scene.add.container(); // 공통 UI (항상 표시)
        this.scene.uiContainers.type1 = this.scene.add.container();  // Type 1 UI
        this.scene.uiContainers.type2 = this.scene.add.container();  // Type 2 UI
        this.scene.uiContainers.type3 = this.scene.add.container();  // Type 3 UI
        this.scene.uiContainers.type2Popup = this.scene.add.container(); // Type 2 전처리 팝업

        this.scene.uiContainers.type1.setVisible(false);
        this.scene.uiContainers.type2.setVisible(false);
        this.scene.uiContainers.type3.setVisible(false);
        this.scene.uiContainers.type2Popup.setVisible(false);
    }

    createCommonUI() {
        const {width, height} = this.scene.sys.game.canvas;

        // 배경색 설정
        this.scene.cameras.main.setBackgroundColor('#3CBB89'); // 초록색 배경

        // 메인 패널 배치 (330*445px, 위에서 200px 아래)
        this.scene.panel.width = 330;
        this.scene.panel.height = 445;
        this.scene.panel.x = width / 2;
        this.scene.panel.y = 180 + (this.scene.panel.height * 0.5);

        // 메인 패널 이미지
        this.scene.mainPanelImage = this.scene.add.image(this.scene.panel.x, this.scene.panel.y, 'panel_img')
            .setDisplaySize(this.scene.panel.width, this.scene.panel.height)
            .setOrigin(0.5);
        this.scene.uiContainers.common.add(this.scene.mainPanelImage);

        // 메시지 영역 (330*105px, 위에서 640px 아래)
        this.scene.messageArea.width = 330;
        this.scene.messageArea.height = 105;
        this.scene.messageArea.x = width / 2;
        this.scene.messageArea.y = 640 + this.scene.messageArea.height / 2; // 위에서 640px + 높이 절반

        this.scene.messageAreaGraphic = this.scene.add.image(this.scene.messageArea.x, this.scene.messageArea.y, 'message_area_img')
            .setDisplaySize(this.scene.messageArea.width, this.scene.messageArea.height)
            .setOrigin(0.5)
            .setVisible(true);
        this.scene.uiContainers.common.add(this.scene.messageAreaGraphic);

        const messageStyle = {
            font: '16px "머니그라피"',  // 폰트 변경
            fill: '#303030',
            align: 'left',  // 왼쪽 정렬
            wordWrap: {width: this.scene.messageArea.width - 20},
            letterSpacing: 1,    // 글자 간격
            lineSpacing: 16       // 줄 간격
        };

        // 메시지 위치 변경 (왼쪽 정렬, x: 80, y: 660)
        this.scene.messageTextObject = this.scene.add.text(80, 663, '', messageStyle)
            .setOrigin(0, 0)  // 왼쪽 상단 기준점으로 변경
            .setDepth(1)
            .setVisible(true);
        this.scene.uiContainers.common.add(this.scene.messageTextObject);

        // 상단 UI: 레벨, 점수, 시간
        const topY = 120;

        // 레벨 표시 (왼쪽 버튼과 중앙 사이)
        this.scene.add.text(width * 0.35, topY - 5, '레벨', {
            font: '12px 머니그라피',
            fill: '#FFFFFF',
            align: 'center'
        }).setOrigin(0.5, 0);

        this.scene.levelText = this.scene.add.text(width * 0.35, topY + 12, '레벨 1', {
            font: '20px 머니그라피',
            fill: '#FFFFFF',
            align: 'center'
        }).setOrigin(0.5, 0);
        this.scene.uiContainers.common.add(this.scene.levelText);

        // 점수 표시 (중앙)
        this.scene.add.text(width * 0.5, topY - 5, '환경 점수', {
            font: '12px 머니그라피',
            fill: '#FFFFFF',
            align: 'center'
        }).setOrigin(0.5, 0);

        this.scene.scoreText = this.scene.add.text(width * 0.5, topY + 12, '점수: 0', {
            font: '20px 머니그라피',
            fill: '#FFFFFF',
            align: 'center'
        }).setOrigin(0.5, 0);
        this.scene.uiContainers.common.add(this.scene.scoreText);

        // 시간 표시 (오른쪽 버튼과 중앙 사이)
        this.scene.add.text(width * 0.65, topY - 5, '난이도', {
            font: '12px 머니그라피',
            fill: '#FFFFFF',
            align: 'center'
        }).setOrigin(0.5, 0);

        this.scene.difficultyText = this.scene.add.text(width * 0.65, topY + 12, '난이도 1', {
            font: '20px 머니그라피',
            fill: '#FFFFFF',
            align: 'center'
        }).setOrigin(0.5, 0);
        this.scene.uiContainers.common.add(this.scene.difficultyText);


        const backButton = this.scene.add.image(80, 120, 'back_button_img')
            .setDisplaySize(29, 33)  // 크기 설정
            .setInteractive()
            .setOrigin(0, 0)
            .on('pointerdown', () => this.scene.handleBackButton());  // 클릭 이벤트 핸들러 추가
        this.scene.uiContainers.common.add(backButton);

        // 상단 버튼: 메뉴 (30*33px)
        const menuButton = this.scene.add.image(330, 120, 'menu_button_img')
            .setDisplaySize(30, 33)  // 크기 설정
            .setInteractive()
            .setOrigin(0, 0)
            .on('pointerdown', () => this.scene.handleMenuButton());  // 클릭 이벤트 핸들러 추가
        this.scene.uiContainers.common.add(menuButton);

        this.scene.createRoundsUI();

        // 하트 UI (위에서 260px)
        this.scene.createHeartsUI();

        // 커맨드 버튼 생성
        this.createCommandButtons();

        // 결과 버튼들
        this.createResultButtons();
    }

    createType1UI() {
        // Type 1용 쓰레기통 및 관련 UI
        this.createBinsUI();
        this.scene.laneIndicatorLine = this.scene.add.image(0, 0, 'lane_line_img')
            .setDepth(1)
            .setVisible(false);
        this.scene.uiContainers.type1.add(this.scene.laneIndicatorLine);
    }

    createBinsUI() {
        const binY = 581;
        const firstBinX = 75; // 왼쪽에서 75px (첫 번째 쓰레기통)
        const binWidth = 50;
        const binHeight = 34;
        const binSpacing = 10
        const labelYOffset = 16;

        this.scene.binGraphics = [];
        this.scene.laneCenterXPositions = [];
        this.scene.binTopLabelYPositions = [];
        this.scene.binImages = [];
        this.scene.binNameTexts = []; // 쓰레기통 이름 텍스트 배열 추가

        this.scene.binKeys.forEach((key, index) => {
            // 왼쪽부터 첫 번째 쓰레기통 위치에 간격을 더해 배치
            const binX = firstBinX + (index * (binWidth + binSpacing));
            const binCenterX = binX + (binWidth / 2); // 중앙 위치 (텍스트 정렬용)

            // 쓰레기통 이미지 추가 (왼쪽 상단 기준점)
            const binImageKey = `${key}_img`;
            const binImg = this.scene.add.image(binX, binY, binImageKey)
                .setDisplaySize(binWidth, binHeight)
                .setOrigin(0, 0) // 왼쪽 상단이 기준점
                .setDepth(5);
            this.scene.binImages.push(binImg);
            this.scene.uiContainers.type1.add(binImg);

            // 쓰레기통 중앙 X 좌표 저장 (판정이나 떨어지는 아이템 정렬용)
            this.scene.laneCenterXPositions.push(binCenterX);

            // 라벨 위치 계산 (쓰레기통 위)
            const labelY = binY - labelYOffset;
            this.scene.binTopLabelYPositions[index] = labelY;

            // 쓰레기통 정보 저장 (판정용) - 왼쪽 상단 기준으로 좌표 조정
            this.scene.binGraphics.push({
                key: key,
                x: binX, // 왼쪽 상단 X
                y: binY, // 왼쪽 상단 Y
                width: binWidth,
                height: binHeight,
                left: binX, // 왼쪽 가장자리
                right: binX + binWidth // 오른쪽 가장자리
            });

            // 쓰레기통 이름 텍스트
            const nameStyle = {font: '14px 머니그라피', fill: '#303030', align: 'center'};
            const binName = this.scene.binNames[index];
            // 텍스트는 쓰레기통의 상단 중앙에 배치
            const nameText = this.scene.add.text(binCenterX, labelY, binName, nameStyle).setOrigin(0.5, 1);
            this.scene.uiContainers.type1.add(nameText);
            this.scene.binNameTexts.push(nameText);
        });
    }

    createCommandButtons() {
        const {width} = this.scene.sys.game.canvas;

        // this.scene.commandButtons가 객체가 아니면 초기화
        if (!this.scene.commandButtons) {
            this.scene.commandButtons = {};
        }

        // 커맨드 버튼 크기 및 위치
        const buttonSize = 80;
        const buttonHeight = 85;

        // 왼쪽 버튼 (위 760px, 왼쪽 70px)
        this.scene.commandButtons.left = this.scene.add.image(70, 760, 'button_left_img')
            .setDisplaySize(buttonSize, buttonHeight)
            .setOrigin(0, 0)
            .setInteractive();
        this.scene.commandButtons.left.on('pointerdown', () => {
            this.scene.moveLeft = true;
            this.scene.commandButtons.left.setTexture('button_left_pressed_img');
        });
        this.scene.commandButtons.left.on('pointerup', () => {
            this.scene.moveLeft = false;
            this.scene.commandButtons.left.setTexture('button_left_img');
        });
        this.scene.commandButtons.left.on('pointerout', () => {
            this.scene.moveLeft = false;
            this.scene.commandButtons.left.setTexture('button_left_img');
        });
        // 중요: common 컨테이너에 추가
        this.scene.uiContainers.common.add(this.scene.commandButtons.left);

        // 가운데 버튼 (위 760px, 왼쪽 180px)
        this.scene.commandButtons.down = this.scene.add.image(180, 760, 'button_down_img')
            .setDisplaySize(buttonSize, buttonHeight)
            .setOrigin(0, 0)
            .setInteractive();
        this.scene.commandButtons.down.on('pointerdown', () => {
            this.scene.moveDownFast = true;
            this.scene.commandButtons.down.setTexture('button_down_pressed_img');
        });
        this.scene.commandButtons.down.on('pointerup', () => {
            this.scene.moveDownFast = false;
            this.scene.commandButtons.down.setTexture('button_down_img');
        });
        this.scene.commandButtons.down.on('pointerout', () => {
            this.scene.moveDownFast = false;
            this.scene.commandButtons.down.setTexture('button_down_img');
        });
        // 중요: common 컨테이너에 추가
        this.scene.uiContainers.common.add(this.scene.commandButtons.down);

        // 오른쪽 버튼 (위 760px, 왼쪽 290px)
        this.scene.commandButtons.right = this.scene.add.image(290, 760, 'button_right_img')
            .setDisplaySize(buttonSize, buttonHeight)
            .setOrigin(0, 0)
            .setInteractive();
        this.scene.commandButtons.right.on('pointerdown', () => {
            this.scene.moveRight = true;
            this.scene.commandButtons.right.setTexture('button_right_pressed_img');
        });
        this.scene.commandButtons.right.on('pointerup', () => {
            this.scene.moveRight = false;
            this.scene.commandButtons.right.setTexture('button_right_img');
        });
        this.scene.commandButtons.right.on('pointerout', () => {
            this.scene.moveRight = false;
            this.scene.commandButtons.right.setTexture('button_right_img');
        });


        this.scene.commandButtons.left.on('pointerdown', () => {
            this.scene.moveLeft = true;
            this.scene.commandButtons.left.setTexture('button_left_pressed_img');
            if (this.scene.isProcessingResult) {
                this.scene.handlePreprocessingCommand('left');
            }
        });

        this.scene.commandButtons.down.on('pointerdown', () => {
            this.scene.moveDownFast = true;
            this.scene.commandButtons.down.setTexture('button_down_pressed_img');
            if (this.scene.isProcessingResult) {
                this.scene.handlePreprocessingCommand('down');
            }
        });

        this.scene.commandButtons.right.on('pointerdown', () => {
            this.scene.moveRight = true;
            this.scene.commandButtons.right.setTexture('button_right_pressed_img');
            if (this.scene.isProcessingResult) {
                this.scene.handlePreprocessingCommand('right');
            }
        });

        // 중요: common 컨테이너에 추가
        this.scene.uiContainers.common.add(this.scene.commandButtons.right);
    }

    createType2UI() {
        // Type 2는 기본적으로 Type 1과 같은 UI를 사용
        // 전처리 팝업만 별도로 생성
        this.scene.preprocessingInputEnabled = false;
        this.scene.preprocessingSteps = null;
        this.scene.currentPreprocessingStep = 0;

        // 여기서 createPreprocessingPopup 호출 제거
        // 팝업은 아이템 클릭 시에만 생성됨

        console.log('GameScene: Type 2 UI 초기화 완료');
    }

    createType3UI() {
        const {width, height} = this.scene.sys.game.canvas;

        // 기존 UI 컨테이너가 비어있는지 확인 (재생성 방지)
        if (this.scene.uiContainers.type3.list.length > 0) {
            console.log('GameScene: Type 3 UI가 이미 생성됨');
            return;
        }

        console.log('GameScene: Type 3 UI 생성 시작');

        // 패널이 텍스처로 존재하는지 확인
        if (this.scene.textures.exists('type3_panel_img')) {
            // 이미지로 패널 생성
            this.scene.type3Panel = this.scene.add.image(
                width / 2,
                height / 2,
                'type3_panel_img'
            ).setDisplaySize(width * 0.8, height * 0.6);
            this.scene.uiContainers.type3.add(this.scene.type3Panel);
        } else {
            console.log('GameScene: type3_panel_img가 없음, 임시 패널 생성');
            // 임시 패널 생성 (텍스처가 없을 경우)
            this.scene.type3TempPanel = this.scene.add.rectangle(
                width / 2,
                height / 2,
                width * 0.8,
                height * 0.6,
                0xffffff, // 흰 배경
                1
            ).setOrigin(0.5);
            this.scene.uiContainers.type3.add(this.scene.type3TempPanel);

            // 좌우 색상 구분
            this.scene.type3LeftPanel = this.scene.add.rectangle(
                width / 2 - width * 0.8 / 4,
                height / 2,
                width * 0.8 / 2,
                height * 0.6,
                0xffeebb, // 왼쪽 패널 색상 (연한 노란색)
                1
            ).setOrigin(0.5);
            this.scene.uiContainers.type3.add(this.scene.type3LeftPanel);

            this.scene.type3RightPanel = this.scene.add.rectangle(
                width / 2 + width * 0.8 / 4,
                height / 2,
                width * 0.8 / 2,
                height * 0.6,
                0xccffdd, // 오른쪽 패널 색상 (연한 초록색)
                1
            ).setOrigin(0.5);
            this.scene.uiContainers.type3.add(this.scene.type3RightPanel);
        }

        // 질문 텍스트 (메시지 박스 위에 표시)
        this.scene.type3QuestionText = this.scene.add.text(
            width / 2,
            this.scene.messageArea.y - this.scene.messageArea.height / 2 - 15,
            '', // 기본값은 비워두고 spawnType3Item에서 설정
            {
                font: '20px Arial',
                fill: '#ffffff',
                align: 'center',
                stroke: '#000000',
                strokeThickness: 2
            }
        ).setOrigin(0.5);
        this.scene.uiContainers.type3.add(this.scene.type3QuestionText);

        // 좌/우 선택지 텍스트
        this.scene.type3LeftText = this.scene.add.text(
            width / 2 - width * 0.8 / 4,
            height / 2 + height * 0.3 / 2,
            '일반쓰레기',
            {
                font: '22px Arial',
                fill: '#000000',
                align: 'center',
                fontStyle: 'bold'
            }
        ).setOrigin(0.5);
        this.scene.uiContainers.type3.add(this.scene.type3LeftText);

        this.scene.type3RightText = this.scene.add.text(
            width / 2 + width * 0.8 / 4,
            height / 2 + height * 0.3 / 2,
            '음식물쓰레기',
            {
                font: '22px Arial',
                fill: '#000000',
                align: 'center',
                fontStyle: 'bold'
            }
        ).setOrigin(0.5);
        this.scene.uiContainers.type3.add(this.scene.type3RightText);

        // 초기에는 숨김
        this.scene.uiContainers.type3.setVisible(false);

        console.log('GameScene: Type 3 UI 생성 완료');
    }

    createResultButtons() {
        const resultButtonWidth = 100;
        const resultButtonHeight = 40;
        const resultButtonX = this.scene.messageArea.x + this.scene.messageArea.width / 2 - resultButtonWidth - 10;
        const resultButtonY = this.scene.messageArea.y + this.scene.messageArea.height / 2 - resultButtonHeight - 10;

        this.scene.resultButton = this.scene.add.rectangle(resultButtonX, resultButtonY, resultButtonWidth, resultButtonHeight, 0x00ff00)
            .setInteractive()
            .setVisible(false);
        this.scene.uiContainers.common.add(this.scene.resultButton);

        const resultButtonStyle = {font: '18px Arial', fill: '#ffffff', align: 'center'};
        this.scene.resultButtonText = this.scene.add.text(resultButtonX, resultButtonY, '', resultButtonStyle)
            .setOrigin(0.5)
            .setDepth(1)
            .setVisible(false);
        this.scene.uiContainers.common.add(this.scene.resultButtonText);

        this.scene.resultButton.on('pointerdown', () => {
            this.hideResultUIAndProceed();
        }, this.scene);
    }

    hideResultUIAndProceed() {
        console.log('GameScene: 결과 UI 숨김 및 다음 진행.');

        if (this.scene.health <= 0) {
            console.log('GameScene: 이미 게임 오버 상태이므로 다음 진행하지 않음.');
            return;
        }

        // 결과 UI 숨김
        this.scene.hideResultUI();

        // 쓰레기 아이템 제거
        if (this.scene.currentTrashItemGraphic) {
            this.scene.currentTrashItemGraphic.destroy();
            this.scene.currentTrashItemGraphic = null;
        }

        // 점수 및 라운드 처리
        this.scene.handleResult(this.scene.lastResultIsCorrect);

        // 게임 플레이 입력 다시 활성화
        this.scene.setGameInputEnabled(true);

        this.scene.resetCurrentRound();
    }
}