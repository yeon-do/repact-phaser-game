import {rules} from "../../rules/wasteRules.js";
import {Type1Handler} from "./handlers/type1Handler.js";
import {Type3Handler} from "./handlers/type3Handler.js";
import {Preloader} from "./preloader/preloader.js";
import {UiManager} from "./managers/uiManager.js";
import {CommandHandler} from "./handlers/commandHandler.js";
import {Trigger} from "./handlers/trigger.js";
import {ItemManager} from "./managers/itemManager.js";

class GameScene extends Phaser.Scene {
    constructor() {
        super('GameScene');
        console.log('GameScene: Constructor 실행.');

        // === 게임 진행 관련 변수 ===
        this.level = 1; // 현재 레벨
        this.currentRound = 1; // 현재 라운드 (1-5)
        this.maxRounds = 5; // 레벨당 최대 라운드
        this.score = 0; // 현재 점수
        this.health = 3; // 체력 변수 (하트 3개)

        // === 라운드 구성 정의 ===
        this.roundData = [
            {round: 1, itemId: 'glass_bottle', type: 1},
            //{ round: 1, itemId: 'milk_carton', type: 2 },
            {round: 2, itemId: 'milk_carton', type: 2},
            {round: 3, itemId: 'newspaper', type: 1},
            {round: 4, itemId: 'plastic_bottle', type: 2},
            {round: 5, itemId: 'chicken_bone', type: 3},
        ];

        // === UI 요소들 ===
        this.scoreText = null;
        this.levelText = null;
        this.roundText = null; // 라운드 표시 텍스트
        this.timeText = null;
        this.heartGraphics = [];
        this.itemNameText = null;

        // 전처리 관련 변수
        this.preprocessingSteps = null;
        this.currentPreprocessingStep = 0;
        this.currentCommandIndex = 0; // 현재 단계 내에서 몇 번째 커맨드인지
        this.messageCommandImages = []; // 메시지 창에 표시할 커맨드 이미지들
        this.messageTexts = []; // 메시지 창에 표시할 텍스트들

        // 애니메이션 타이밍 상수 정의
        this.ANIMATION_TIMING = {
            BLINK_DURATION: 150,      // 깜박임 한 번 지속 시간 (ms)
            BLINK_COUNT: 3,           // 깜박임 횟수
            FADE_OUT_DURATION: 1000,   // 사라지는 효과 지속 시간 (ms)
            NEXT_ROUND_DELAY: 2500,   // 다음 라운드로 넘어가는 지연 시간 (ms)
            LINE_BLINK_DURATION: 200, // 라인 깜박임 지속 시간 (ms)
            LINE_BLINK_COUNT: 3       // 라인 깜박임 횟수
        };

        // === 게임 상태 변수 ===
        this.currentGameType = 1; // 현재 게임 타입
        this.gameState = 'playing'; // 'playing', 'preprocessing', 'quiz'
        this.itemTimeLimit = 10; // 아이템별 시간 제한 (초)
        this.itemTimeRemaining = this.itemTimeLimit;
        this.currentTrashItemGraphic = null;
        this.currentTrashItemData = null;
        this.cursors = null;
        this.spaceKey = null;
        this.fallSpeed = 50;
        this.fastFallMultiplier = 2.5;
        this.currentLaneIndex = 0;
        this.isFalling = false;
        this.isProcessingResult = false;

        // === 입력 상태 관리 ===
        this.moveLeft = false;
        this.moveRight = false;
        this.moveDownFast = false;
        this.keyboardMoveDelay = 150;
        this.lastKeyboardMoveTime = 0;
        this.lastLandedLaneIndex = 0;

        // === 쓰레기 아이템 데이터 ===
        this.wasteRulesData = rules

        this.messageTimeOut = '시간초과야 다시해볼까?';

        // === 쓰레기통 설정 ===
        this.binKeys = ['bin_glass', 'bin_paper', 'bin_pack', 'bin_can', 'bin_plastic'];
        this.binNames = ['유리병', '종이', '종이팩', '캔고철', '플라스틱'];
        this.binColors = {
            'bin_glass': 0x00ff00,    // 초록색 - 유리병
            'bin_paper': 0x0000ff,    // 파란색 - 종이
            'bin_pack': 0xff0000,     // 빨간색 - 종이팩
            'bin_can': 0xffff00,      // 노란색 - 캔고철
            'bin_plastic': 0x800080   // 보라색 - 플라스틱
        };
        this.laneCenterXPositions = [];
        this.binTopLabelYPositions = [];
        this.binImages = [];
        this.currentOpenBinIndex = -1;
        this.binGraphics = [];
        this.commandButtons = {};

        // === UI 컨테이너들 ===
        this.uiContainers = {};

        // === 전처리 관련 변수 ===
        this.currentPreprocessingStep = 0;
        this.isWaitingForCommand = false;
        this.preprocessingStepGraphics = [];

        // === 퀴즈 관련 변수 ===
        this.quizDropZones = [];
        this.selectedQuizAnswer = null;

        // === 화면 레이아웃 좌표 ===
        this.panel = {x: 0, y: 0, width: 0, height: 0};
        this.messageArea = {x: 0, y: 0, width: 0, height: 0};
        this.commandButtonArea = {y: 0};

        // === 결과 표시 UI ===
        this.messageAreaGraphic = null;
        this.messageTextObject = null;
        this.resultButton = null;
        this.resultButtonText = null;
        this.lastResultIsCorrect = false;

        this.type1Handler = new Type1Handler(this);
        this.type3Handler = new Type3Handler(this);
        this.commandHandler = new CommandHandler(this);
        this.itemManager = new ItemManager(this);
        this.trigger = new Trigger(this);
    }

    preload() {
        new Preloader(this).preload();
    }

    init(data) {
        this.fromBlackOverlay = data.fromBlackOverlay || false;
    }

    create() {
        new UiManager(this).create();

        // 입력 설정
        this.setupInput();
        // 게임 상태 초기화 및 첫 라운드 시작 (즉시 시작)
        this.resetGameState();
    }

    handleBackButton() {
        // 뒤로가기 버튼 기능
        console.log('뒤로가기 버튼 클릭됨');
        // 예: 이전 씬으로 이동
        this.scene.start('PreviousScene');
    }

    handleMenuButton() {
        // 메뉴 버튼 기능
        console.log('메뉴 버튼 클릭됨');
        // 예: 메뉴 팝업 표시
        this.showMenu(); // todo 없는 함수?
    }

    setupInput() {
        this.cursors = this.input.keyboard.createCursorKeys();
        this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

        // Type 2 커맨드 키 설정
        this.leftKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.LEFT);
        this.rightKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.RIGHT);
        this.downKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.DOWN);

        // 키보드 이벤트에 전처리 커맨드 처리 추가
        this.input.keyboard.on('keydown', (event) => {
            if (this.preprocessingInputEnabled) {
                switch (event.keyCode) {
                    case Phaser.Input.Keyboard.KeyCodes.LEFT:
                        this.commandHandler.handlePreprocessingCommand('left');
                        break;
                    case Phaser.Input.Keyboard.KeyCodes.DOWN:
                        this.commandHandler.handlePreprocessingCommand('down');
                        break;
                    case Phaser.Input.Keyboard.KeyCodes.RIGHT:
                        this.commandHandler.handlePreprocessingCommand('right');
                        break;
                }
            }
        });
    }

    update(time, delta) {
        const deltaInSeconds = delta / 1000;

        // 매 120프레임마다 팝업 객체 확인 (약 2초마다)
        if (time % 120 === 0) {
            // 'popup_bg_img' 텍스처를 사용하는 객체 수 확인
            const popupCount = this.children.list.filter(
                obj => obj.texture && obj.texture.key === 'popup_bg_img'
            ).length;

            if (popupCount > 0) {
                console.log('현재 팝업 배경 객체 수:', popupCount);
            }
        }

        // 아이템 상태 로깅 (매 60프레임마다)
        if (time % 60 === 0 && this.currentTrashItemGraphic) {
            console.log('아이템 상태:',
                'visible:', this.currentTrashItemGraphic.visible,
                'active:', this.currentTrashItemGraphic.active,
                'y:', this.currentTrashItemGraphic.y);
        }

        // 게임 타입별 업데이트
        switch (this.currentGameType) {
            case 1:
                this.type1Handler.update(time, delta);
                break;
            case 2:
                if (this.gameState === 'preprocessing') {
                    this.updateType2Preprocessing();
                } else {
                    this.type1Handler.update(time, delta); // Type 2는 기본적으로 Type 1과 같음
                }
                break;
            case 3:
                this.type3Handler.update(time, delta);
                break;
        }
    }

    updateType2Preprocessing() {
        // 키보드 입력 체크
        if (this.isWaitingForCommand) {
            if (this.leftKey.isDown) {
                this.commandHandler.handlePreprocessingCommand('left');
            } else if (this.rightKey.isDown) {
                this.commandHandler.handlePreprocessingCommand('right');
            } else if (this.downKey.isDown) {
                this.commandHandler.handlePreprocessingCommand('down');
            }
        }
    }

    // GameScene 클래스 내에 다음 함수 추가
    switchGameTypeUI(gameType) {
        console.log('GameScene: UI 전환 - 타입', gameType);

        // 기존 아이템 제거 (혹시라도 있다면)
        if (this.currentTrashItemGraphic) {
            this.currentTrashItemGraphic.destroy();
            this.currentTrashItemGraphic = null;
        }

        // 모든 UI 컨테이너 숨김
        this.uiContainers.type1.setVisible(false);
        this.uiContainers.type2.setVisible(false);
        this.uiContainers.type3.setVisible(false);
        this.uiContainers.type2Popup.setVisible(false);

        // 공통 UI는 항상 표시
        this.uiContainers.common.setVisible(true);

        // 해당 타입 UI만 표시
        switch (gameType) {
            case 1:
                console.log('GameScene: Type 1 UI 표시');
                this.uiContainers.type1.setVisible(true);
                break;
            case 2:
                console.log('GameScene: Type 2 UI 표시');
                this.uiContainers.type1.setVisible(true); // Type 2는 Type 1 UI 사용
                break;
            case 3:
                console.log('GameScene: Type 3 UI 표시');
                this.uiContainers.type3.setVisible(true);
                break;
        }

        // 메인 패널 제어 (Type 3에서만 숨김)
        const mainPanel = this.children.getByName('main_panel');
        if (mainPanel) {
            mainPanel.setVisible(gameType !== 3);
            console.log('GameScene: 메인 패널 표시 여부:', gameType !== 3);
        }

        this.gameState = 'playing';
    }

    showWarningSlideAnimation() {
        const {width, height} = this.sys.game.canvas;

        // 경고 이미지 생성 (처음에는 화면 오른쪽 바깥에 위치)
        // 크기: 1417x556, 위치: 위에서 167px
        this.warningSlide = this.add.image(width + 700, 167, 'warning_slide_img')
            .setOrigin(0, 0) // 왼쪽 상단이 기준점
            .setDepth(26);   // 배경보다 위에 표시

        // 이미지 크기 설정 (원본 크기 그대로 사용)
        this.warningSlide.setDisplaySize(1417, 556);

        // 왼쪽으로 밀어내기 애니메이션
        this.tweens.add({
            targets: this.warningSlide,
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
        const itemId = this.currentTrashItemGraphic.itemData.id;

        // STEP1 이미지로 시작
        const step1ImageKey = `${itemId}_step1_img`;
        const fallbackImageKey = this.currentTrashItemGraphic.texture.key;

        // 이미지 키 존재 여부 확인
        const imageKey = this.textures.exists(step1ImageKey) ? step1ImageKey : fallbackImageKey;

        this.preprocessingItemImage = this.add.image(80, 400, imageKey)
            .setDisplaySize(120, 120)
            .setOrigin(0, 0)
            .setDepth(26);

        // 전처리 단계 정보 가져오기
        this.preprocessingSteps = this.currentTrashItemGraphic.itemData.preprocessingSteps || [];
        this.currentPreprocessingStep = 0;
        this.currentCommandIndex = 0;

        // 커맨드 키 배열 초기화
        this.commandKeyImages = [];

        // 메시지 창 초기화 (처음에는 빈 상태로)
        if (this.messageTextObject) {
            this.messageTextObject.setText("분리수거가 가능하게 바꿔보자!\n화면에 맞는 커맨드를 입력해봐");
        }

        // 메시지 텍스트 배열 초기화
        if (this.messageTexts && this.messageTexts.length > 0) {
            this.messageTexts.forEach(txt => txt.destroy());
            this.messageTexts = [];
        }

        // 메시지 커맨드 이미지 초기화
        if (this.messageCommandImages && this.messageCommandImages.length > 0) {
            this.messageCommandImages.forEach(img => img.destroy());
            this.messageCommandImages = [];
        }

        // 커맨드 키 초기 설정
        this.setupCommandKeys();

        // 메시지 창 초기화 (처음에는 안내 메시지만)
        if (this.messageTextObject) {
            this.messageTextObject.setText("분리수거가 가능하게 바꿔보자!\n화면에 맞는 커맨드를 입력해봐");
            this.messageTextObject.setVisible(true);
        }

        // 첫 번째 커맨드 키는 사용자 입력 후 활성화되도록 함
        // 첫 번째 커맨드 키만 입력 가능하도록 설정
        if (this.commandKeyImages.length > 0) {
            this.commandKeyImages[0].active = true;
        }
    }


    setupCommandKeys() {
        // 기존 커맨드 키 이미지 제거
        this.commandKeyImages.forEach(key => {
            if (key.image) key.image.destroy();
        });
        this.commandKeyImages = [];

        // 모든 단계의 모든 커맨드를 순서대로 배열로 변환
        let allCommands = [];
        for (let i = 0; i < this.preprocessingSteps.length; i++) {
            const step = this.preprocessingSteps[i];
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
            const keyImage = this.add.image(keyX, 440, keyImageKey)
                .setDisplaySize(40, 43) // 명시적 크기 설정
                .setOrigin(0, 0)
                .setDepth(26 + (allCommands.length - i));

            this.commandKeyImages.push({
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
        if (this.commandKeyImages.length > 0) {
            const firstKey = this.commandKeyImages[0]
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

            if (this.textures.exists(activeKeyImageKey)) {
                firstKey.image.setTexture(activeKeyImageKey);
                firstKey.image.setDisplaySize(40, 43);
            }
        }

        console.log(`총 ${this.commandKeyImages.length}개의 커맨드 키 생성됨`);
    }


    // completePreprocessing 함수는 더 이상 사용하지 않으므로 제거하고
    // startCleanupAnimation 함수를 수정
    startCleanupAnimation() {
        // 1. 먼저 아이템 이미지 페이드 아웃
        this.tweens.add({
            targets: this.preprocessingItemImage,
            alpha: 0,
            duration: 500,
            onComplete: () => {
                // 아이템 이미지 제거
                this.preprocessingItemImage.destroy();

                // 2. warning_animation 이미지가 있다면 왼쪽으로 밀어내기
                if (this.warningSlide) {
                    this.tweens.add({
                        targets: this.warningSlide,
                        x: -1500, // 화면 왼쪽 바깥으로 더 멀리 이동
                        duration: 1500,
                        ease: 'Power2',
                        onComplete: () => {
                            // warning_animation 이미지 제거
                            this.warningSlide.destroy();

                            // 3. 회색 배경 페이드 아웃
                            this.fadeOutBackground();
                        }
                    });
                } else {
                    // warning_animation이 없는 경우 바로 배경 페이드 아웃
                    this.fadeOutBackground();
                }
            }
        });

        // 남아있는 커맨드 키 이미지들도 함께 페이드 아웃
        this.commandKeyImages.forEach(keyObj => {
            if (keyObj.image && keyObj.image.active !== null) {
                this.tweens.add({
                    targets: keyObj.image,
                    alpha: 0,
                    duration: 500,
                    onComplete: () => {
                        keyObj.image.destroy();
                    }
                });
            }
        });
    }

    fadeOutBackground() {
        // 회색 배경 페이드 아웃
        this.tweens.add({
            targets: this.preprocessingPopupBg,
            alpha: 0,
            duration: 1000,
            onComplete: () => {
                // 배경 제거
                this.preprocessingPopupBg.destroy();

                // 게임 재개 준비
                this.restartGameWithPreprocessedItem();
            }
        });
    }

    restartGameWithPreprocessedItem() {
        console.log('GameScene: 전처리 완료 후 게임 재시작 시작');

        // 중요: 현재 게임 타입을 Type 1으로 변경
        this.currentGameType = 1;

        // 이전 아이템 참조 저장
        const oldItem = this.currentTrashItemGraphic;
        const itemData = oldItem ? {...oldItem.itemData} : null; // 데이터 깊은 복사

        // 이전 아이템 제거 (참조 정리)
        if (oldItem) {
            oldItem.setVisible(false);
            oldItem.destroy();
            this.currentTrashItemGraphic = null; // 참조 제거
        }

        // 전처리된 이미지 키 확인
        const itemId = itemData ? itemData.id : null;
        const preprocessedImageKey = itemId ? `${itemId}_preprocessed_img` : null;

        if (!preprocessedImageKey || !this.textures.exists(preprocessedImageKey)) {
            console.error('전처리된 이미지를 찾을 수 없음:', preprocessedImageKey);
            return;
        }

        // 새 아이템 생성 위치 설정 (더 높은 위치에서 시작)
        const firstLaneX = 70;
        const startY = 300; // 더 높은 위치에서 시작 (기존 300)

        // 완전히 새로운 아이템 객체 생성
        this.currentTrashItemGraphic = this.add.sprite(firstLaneX, startY, preprocessedImageKey)
            .setDisplaySize(60, 60)
            .setOrigin(0, 0)
            .setDepth(10);

        // 아이템 데이터 설정
        this.currentTrashItemGraphic.itemData = itemData;

        // 디스플레이 리스트에 명시적으로 추가
        this.currentTrashItemGraphic.addToDisplayList();

        // 현재 레인 인덱스 초기화
        this.currentLaneIndex = 0;
        this.currentOpenBinIndex = -1;

        this.resetAllBins();

        // 게임 상태 재설정
        this.isFalling = true;
        this.isProcessingResult = false;
        this.lastFallTime = this.game.getTime();

        // 라인 UI 업데이트
        this.updateBinVisuals(this.currentLaneIndex);

        // 전처리 후 고정 메시지 표시
        if (this.messageTextObject) {
            this.messageTextObject.setText("자, 이제 그럼 다시 분리배출 해볼까?");
            this.messageTextObject.setVisible(true);
        }

        // 전처리 후 이름으로 업데이트 (아이템이 생성된 후에 호출)
        console.log('restartGameWithPreprocessedItem에서 displayItemName 호출');
        console.log('preprocessed 이미지 키:', preprocessedImageKey);
        this.itemManager.displayItemName(itemData);

        console.log('전처리 완료 후 Type 1 게임으로 재개 완료');
    }


    // === 공통 게임 로직 함수들 ===
    updateBinVisuals(newLaneIndex) {
        console.log('updateBinVisuals 호출:', newLaneIndex, '현재 게임 타입:', this.currentGameType);

        // Type 3 처리
        if (this.currentGameType === 3) {
            if (this.laneIndicatorLine) {
                this.laneIndicatorLine.setVisible(false);
            }
            return;
        }

        // 열린 쓰레기통과 닫힌 쓰레기통의 크기 및 위치 설정
        const closedBinSize = {width: 50, height: 34};
        const closedBinY = 581;

        const openBinSize = {width: 51.14, height: 46.47};
        const openBinY = 568.53;
        const openBinXOffset = -2; // 열린 상태일 때 X 좌표 오프셋

        // 이전 열린 쓰레기통 닫기
        if (this.currentOpenBinIndex !== -1 && this.currentOpenBinIndex !== newLaneIndex) {
            const prevBinImg = this.binImages[this.currentOpenBinIndex];
            const prevBinKey = this.binKeys[this.currentOpenBinIndex];
            const prevBinX = this.binGraphics[this.currentOpenBinIndex].x;

            if (prevBinImg) {
                // 텍스처 변경
                prevBinImg.setTexture(`${prevBinKey}_img`);

                // 닫힌 쓰레기통 크기와 위치로 복원
                prevBinImg.setDisplaySize(closedBinSize.width, closedBinSize.height);
                prevBinImg.setPosition(prevBinX, closedBinY);
            }
        }

        // 새로운 레인의 쓰레기통 열기
        if (newLaneIndex !== -1 && newLaneIndex >= 0 && newLaneIndex < this.binImages.length) {
            const currentBinImg = this.binImages[newLaneIndex];
            const currentBinKey = this.binKeys[newLaneIndex];
            const currentBinX = this.binGraphics[newLaneIndex].x;

            if (currentBinImg) {
                // 텍스처 변경
                currentBinImg.setTexture(`${currentBinKey}_open_img`);

                // 열린 쓰레기통 크기와 위치로 변경
                currentBinImg.setDisplaySize(openBinSize.width, openBinSize.height);
                currentBinImg.setPosition(currentBinX + openBinXOffset, openBinY);

                // 검정 라인 이미지 표시
                if (this.laneIndicatorLine) {
                    // 라인 위치 계산
                    const lineX = 70; // 왼쪽에서 70px
                    const lineY = 280; // 위에서 280px
                    const lineXAdjusted = lineX + (newLaneIndex * 60); // 60px 간격으로 조정

                    // 라인 텍스처 설정 및 표시
                    this.laneIndicatorLine
                        .setTexture('lane_line_img') // 항상 검정색 라인으로 시작
                        .setPosition(lineXAdjusted, lineY)
                        .setDisplaySize(60, 335)
                        .setVisible(true)
                        .setOrigin(0, 0);

                    console.log('라인 표시:', lineXAdjusted, lineY);
                } else {
                    console.log('라인 객체가 없음');
                }
            }
        }

        this.currentOpenBinIndex = newLaneIndex;
    }



    hideResultUI() {
        console.log('GameScene: 결과 UI 숨김.');
        if (this.resultButton) {
            this.resultButton.setVisible(false);
        }
        if (this.resultButtonText) {
            this.resultButtonText.setVisible(false);
        }
        this.isProcessingResult = false;
    }

    setGameInputEnabled(enabled) {
        console.log('GameScene: 게임 입력 상태 변경 -', enabled ? '활성화' : '비활성화');
        if (this.input && this.input.keyboard) {
            this.input.keyboard.enabled = enabled;
        }
        if (this.commandButtons.left) {
            this.commandButtons.left.setInteractive(enabled);
            this.commandButtons.down.setInteractive(enabled);
            this.commandButtons.right.setInteractive(enabled);
        }
    }

    handleResult(isCorrect) {
        console.log('GameScene: 최종 판정 결과 처리 시작! 정답:', isCorrect);

        if (isCorrect) {
            // 정답 처리 - 난이도에 따른 점수 부여
            const difficulty = this.currentTrashItemData.difficulty || 1;
            const baseScore = 100;
            const earnedScore = baseScore * difficulty;

            this.score += earnedScore;
            if (this.scoreText) {
                this.scoreText.setText(`${this.score}`);
            }
            console.log(`GameScene: 점수 업데이트 완료. 획득: ${earnedScore} (난이도 ${difficulty})`);
        } else {
            console.log('GameScene: 오답 처리 완료 (체력 감소됨).');
        }
    }

    // resetCurrentRound 함수 수정
    resetCurrentRound() {
        console.log('GameScene: 현재 라운드 다시 시작');

        // 모든 트윈 중지
        this.tweens.killAll();

        // 게임 상태 초기화
        this.isFalling = false;
        this.isProcessingResult = false;
        this.gameState = 'playing';

        // 타이머 초기화
        this.itemTimeRemaining = this.itemTimeLimit;
        this.lastFallTime = 0;

        // 전처리 관련 변수 초기화
        this.preprocessingSteps = null;
        this.currentPreprocessingStep = 0;
        this.commandKeyImages = [];

        // 낙하 횟수 초기화
        this.fallCount = 0;

        // '터치!' 텍스트 제거
        if (this.touchText) {
            this.touchText.destroy();
            this.touchText = null;
        }

        // 기존 아이템 제거
        if (this.currentTrashItemGraphic) {
            this.currentTrashItemGraphic.destroy();
            this.currentTrashItemGraphic = null;
        }

        // 아이템 이름 텍스트 제거
        if (this.itemNameText) {
            this.itemNameText.destroy();
            this.itemNameText = null;
        }

        // 라인 초기화
        if (this.laneIndicatorLine) {
            this.laneIndicatorLine.setTexture('lane_line_img');
            this.laneIndicatorLine.setVisible(false);
        }

        // 현재 레인 인덱스 초기화
        this.currentLaneIndex = 0;
        this.currentOpenBinIndex = -1;

        this.itemManager.spawnWasteItem();
    }

    updateHealthUI() {
        console.log('GameScene: 체력 UI 업데이트. 현재 체력:', this.health);

        // 하트의 총 개수
        const totalHearts = this.heartGraphics.length;

        for (let i = 0; i < totalHearts; i++) {
            // i가 0이면 첫 번째(왼쪽) 하트, 값이 클수록 오른쪽 하트
            const heartImg = this.heartGraphics[i];

            if (i < this.health) {
                // 체력이 남아있는 경우 채워진 하트
                heartImg.setTexture('heart_full_img');
            } else {
                // 체력이 없는 경우 빈 하트
                heartImg.setTexture('heart_empty_img');
            }
        }
    }


    // resetGameState 함수에서 첫 아이템 생성 부분 분리
    resetGameState() {
        console.log('GameScene: 게임 상태 초기화 시작.');

        // 팝업 객체가 있으면 제거
        if (this.incorrectPopupBg) {
            this.incorrectPopupBg.destroy();
            this.incorrectPopupBg = null;
        }
        // 게임 변수 초기화
        this.score = 0;
        this.health = 3;
        this.level = 1;
        this.currentRound = 1;
        this.currentLaneIndex = 0;
        this.isFalling = false;
        this.isProcessingResult = false;
        this.moveLeft = false;
        this.moveRight = false;
        this.moveDownFast = false;
        this.lastKeyboardMoveTime = 0;
        this.lastLandedLaneIndex = 0;
        this.itemTimeRemaining = this.itemTimeLimit;
        this.currentOpenBinIndex = -1;
        this.gameState = 'playing';
        this.currentGameType = 1;
        this.fallCount = 0;

        // UI 전환
        this.switchGameTypeUI(this.currentGameType);

        // UI 오브젝트 초기화
        if (this.scoreText) {
            this.scoreText.setText(this.score);
        }
        if (this.levelText) {
            this.levelText.setText(this.level);
        }
        if (this.roundText) {
            this.roundText.setText(this.currentRound);
        }
        if (this.timeText) {
            this.timeText.setText(this.itemTimeLimit);
        }

        // 하트 UI 업데이트
        if (this.heartGraphics.length > 0) {
            this.updateHealthUI();
        }

        // 결과 버튼 숨김
        this.hideResultUI();

        // 쓰레기 아이템 제거
        if (this.currentTrashItemGraphic) {
            this.currentTrashItemGraphic.destroy();
            this.currentTrashItemGraphic = null;
        }

        this.currentLaneIndex = 0;
        this.currentOpenBinIndex = -1; // 중요: 열린 쓰레기통 인덱스 초기화

        // 모든 쓰레기통을 닫힌 상태로 리셋
        this.resetAllBins();

        // 첫 번째 라운드 아이템 생성
        this.itemManager.spawnWasteItem();

        console.log('GameScene: 게임 상태 초기화 완료. 첫 아이템 생성.');
    }

    resetAllBins() {
        console.log('모든 쓰레기통 리셋 시작');

        if (!this.binImages || this.binImages.length === 0) {
            console.log('쓰레기통 이미지가 초기화되지 않음');
            return;
        }

        // 원래 updateBinVisuals의 로직을 참고하여 리셋
        const closedBinSize = {width: 50, height: 34};
        const closedBinY = 581;

        this.binImages.forEach((bin, index) => {
            if (bin && this.binKeys && this.binKeys[index] && this.binGraphics && this.binGraphics[index]) {
                // binKeys를 기반으로 닫힌 이미지 키 생성
                const closedImageKey = `${this.binKeys[index]}_img`;
                const originalBinX = this.binGraphics[index].x;

                if (this.textures.exists(closedImageKey)) {
                    // 텍스처 변경
                    bin.setTexture(closedImageKey);

                    // 닫힌 쓰레기통 크기와 위치로 복원 (updateBinVisuals와 동일한 로직)
                    bin.setDisplaySize(closedBinSize.width, closedBinSize.height);
                    bin.setPosition(originalBinX, closedBinY);

                    console.log(`쓰레기통 ${index} (${this.binKeys[index]}) 닫힌 상태로 리셋`);
                } else {
                    console.warn(`쓰레기통 이미지 없음: ${closedImageKey}`);
                }
            }
        });

        // 라인 인디케이터 숨기기
        if (this.laneIndicatorLine) {
            this.laneIndicatorLine.setVisible(false);
        }

        console.log('모든 쓰레기통 리셋 완료');
    }


    // GameScene 클래스에 shutdown 함수 추가
    shutdown() {
        // 모든 트윈 중지
        this.tweens.killAll();

        // 팝업 객체 제거
        if (this.incorrectPopupBg) {
            this.incorrectPopupBg.destroy();
            this.incorrectPopupBg = null;
        }

        // 기타 객체 정리
        if (this.currentTrashItemGraphic) {
            this.currentTrashItemGraphic.destroy();
            this.currentTrashItemGraphic = null;
        }

        console.log('GameScene: 씬 종료 및 객체 정리 완료');
    }
}

export default GameScene