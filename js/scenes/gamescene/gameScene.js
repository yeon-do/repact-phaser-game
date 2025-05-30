import {rules} from "../../rules/wasteRules.js";
import {Type1Handler} from "./handlers/type1Handler.js";
import {Type3Handler} from "./handlers/type3Handler.js";
import {Preloader} from "./preloader/preloader.js";
import {UiManager} from "./managers/uiManager.js";
import {CommandHandler} from "./handlers/commandHandler.js";
import {Trigger} from "./handlers/trigger.js";

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
        this.trigger = new Trigger(this);
    }

    preload() {
        const preLoader = new Preloader(this)
        preLoader.preload();
    }

    init(data) {
        this.fromBlackOverlay = data.fromBlackOverlay || false;
    }

    create() {
        const uiManager = new UiManager(this);
        uiManager.create()

        // 입력 설정
        this.setupInput();
        // 게임 상태 초기화 및 첫 라운드 시작 (즉시 시작)
        this.resetGameState();
    }

    displayItemName(itemData) {
        const {width} = this.sys.game.canvas;

        // 디버깅 로그 추가
        console.log('displayItemName 호출됨');
        console.log('itemData:', itemData);
        console.log('itemData.type:', itemData.type);
        console.log('itemData.preprocessedName:', itemData.preprocessedName);
        console.log('currentTrashItemGraphic:', this.currentTrashItemGraphic);
        console.log('texture key:', this.currentTrashItemGraphic ? this.currentTrashItemGraphic.texture.key : 'null');

        // 기존 텍스트가 있으면 제거
        if (this.itemNameText) {
            this.itemNameText.destroy();
        }

        // 아이템 이름 결정
        let itemName = itemData.name;

        // TYPE2 아이템인 경우에만 특별 처리
        if (itemData.type === 2) {
            // 전처리된 이미지인지 확인
            if (this.currentTrashItemGraphic &&
                this.currentTrashItemGraphic.texture.key.includes('_preprocessed')) {
                // 전처리 후: preprocessedName 사용
                if (itemData.preprocessedName) {
                    itemName = itemData.preprocessedName;
                    console.log('TYPE2 전처리 후 이름 (preprocessedName):', itemName);
                } else {
                    itemName = itemData.name;
                    console.log('TYPE2 전처리 후 이름 (기본 name):', itemName);
                }
            } else {
                // 전처리 전: 이름 뒤에 ? 추가
                itemName = itemData.name + '?';
                console.log('TYPE2 전처리 전 이름:', itemName);
            }
        } else {
            // TYPE1, TYPE3는 기본 이름 사용
            itemName = itemData.name;
            console.log('TYPE1/TYPE3 기본 이름:', itemName);
        }

        // 새 텍스트 생성
        this.itemNameText = this.add.text(width / 2, 210, itemName, {
            font: '24px "머니그라피"',
            fill: '#FFFFFF',
            align: 'center',
            letterSpacing: 5 // 글자 간격 5로 설정
        })
            .setOrigin(0.5)
            .setDepth(15); // 다른 요소보다 앞에 표시

        // 공통 UI 컨테이너에 추가
        if (this.uiContainers && this.uiContainers.common) {
            this.uiContainers.common.add(this.itemNameText);
        }

        console.log('최종 아이템 이름 표시:', itemName);
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
                this.handlePreprocessingCommand('left');
            } else if (this.rightKey.isDown) {
                this.handlePreprocessingCommand('right');
            } else if (this.downKey.isDown) {
                this.handlePreprocessingCommand('down');
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

    spawnWasteItem() {
        console.log('GameScene: 아이템 생성 시작, 현재 라운드:', this.currentRound);

        // 쓰레기통 상태 확인 및 리셋
        this.currentLaneIndex = 0; // 첫 번째 라인에서 시작
        this.currentOpenBinIndex = -1; // 열린 쓰레기통 인덱스 초기화

        // 모든 쓰레기통 닫힌 상태로 리셋
        this.resetAllBins();

        // 모든 타입별 UI 정리
        this.cleanupType3UI();

        // 현재 라운드에 맞는 아이템 가져오기
        const currentRoundData = this.roundData.find(round => round.round === this.currentRound);
        if (!currentRoundData) {
            console.error('GameScene: 현재 라운드 데이터를 찾을 수 없음:', this.currentRound);
            return;
        }

        const itemData = this.wasteRulesData.find(item => item.id === currentRoundData.itemId);
        if (!itemData) {
            console.error('GameScene: 아이템 데이터를 찾을 수 없음:', currentRoundData.itemId);
            return;
        }

        console.log('GameScene: 생성할 아이템:', itemData.name, '타입:', itemData.type);

        this.updateBinVisuals(this.currentLaneIndex);

        // 난이도 표시 업데이트
        if (this.difficultyText) {
            this.difficultyText.setText(`${itemData.difficulty}`);
        }

        this.currentTrashItemData = itemData;
        this.currentGameType = itemData.type;

        // 메인 패널 이미지 변경
        this.updateMainPanelForGameType(this.currentGameType);

        // 타입별 스폰 처리
        if (this.currentGameType === 1) {
            this.spawnType1Item(itemData);
        } else if (this.currentGameType === 2) {
            this.spawnType2Item(itemData);
        } else if (this.currentGameType === 3) {
            this.spawnType3Item(itemData);
        }
    }


    // 이 함수 추가
    updateMainPanelForGameType(gameType) {
        console.log('GameScene: 메인 패널 업데이트, 게임 타입:', gameType);

        // 저장된 메인 패널 참조 사용
        if (!this.mainPanelImage) {
            console.error('GameScene: 메인 패널 참조가 없음!');
            return;
        }

        // 게임 타입에 따라 이미지 변경
        if (gameType === 3) {
            // Type 3용 이미지로 변경
            if (this.textures.exists('type3_panel_img')) {
                // 메인 패널 이미지를 Type 3 패널 이미지로 변경
                this.mainPanelImage.setTexture('type3_panel_img');
                console.log('GameScene: 메인 패널 이미지를 Type 3로 변경 성공');
            } else {
                console.error('GameScene: type3_panel_img 텍스처가 존재하지 않음!');
            }

            // Type 1 요소는 보이지 않게 처리 (쓰레기통 등)
            this.binImages.forEach(bin => bin.setVisible(false));

            // 쓰레기통 이름도 숨김
            if (this.binNameTexts) {
                this.binNameTexts.forEach(text => text.setVisible(false));
            }
            // 검정 라인 숨김
            if (this.laneIndicatorLine) {
                this.laneIndicatorLine.setVisible(false);
            }

            console.log('GameScene: Type 3 - 쓰레기통과 이름 숨김, 커맨드 버튼 유지');
        } else {
            // 기본 이미지로 변경
            this.mainPanelImage.setTexture('panel_img');
            console.log('GameScene: 메인 패널 이미지를 기본으로 변경');

            // Type 3 이지선다 텍스트 숨김
            if (this.leftChoiceText) this.leftChoiceText.setVisible(false);
            if (this.rightChoiceText) this.rightChoiceText.setVisible(false);

            // Type 1 쓰레기통 다시 표시
            this.binImages.forEach(bin => bin.setVisible(true));

            // 쓰레기통 이름도 다시 표시
            if (this.binNameTexts) {
                this.binNameTexts.forEach(text => text.setVisible(true));
            }

            console.log('GameScene: Type 1 UI 복원 완료');
        }
    }

    spawnType1Item(itemData) {
        const itemWidth = 60;
        const itemHeight = 60;
        const firstLaneX = 70;  // 왼쪽에서 70px
        const startY = 300;     // 위에서 300px

        // 레인 위치 계산 (각 라인 60px 간격)
        this.currentLaneIndex = 0; // 항상 첫 번째 레인에서 시작
        const lanePositions = [];
        for (let i = 0; i < this.binKeys.length; i++) {
            lanePositions.push(firstLaneX + (i * 60));
        }
        this.laneCenterXPositions = lanePositions; // 레인 중앙 위치 업데이트

        const startX = this.laneCenterXPositions[this.currentLaneIndex];

        // 아이템 이미지 키 결정 (itemData.id + "_img")
        const itemImageKey = `${itemData.id}_img`;

        // 이미지로 생성
        this.currentTrashItemGraphic = this.add.image(startX, startY, itemImageKey)
            .setDisplaySize(itemWidth, itemHeight)
            .setOrigin(0, 0) // 왼쪽 상단 기준점
            .setDepth(10);   // 다른 요소들보다 앞에 표시

        // 중요: 아이템이 실제로 생성되었는지 확인
        console.log('아이템 생성 확인:', this.currentTrashItemGraphic.texture.key,
            'x:', this.currentTrashItemGraphic.x,
            'y:', this.currentTrashItemGraphic.y);

        this.currentTrashItemGraphic.itemData = itemData;
        this.currentTrashItemGraphic.setActive(true);

        // 메시지 업데이트
        if (this.messageTextObject && itemData.messageInitial) {
            this.messageTextObject.setText(itemData.messageInitial);
        }
        // 아이템 이름 표시 추가
        console.log('spawnType1Item에서 displayItemName 호출');
        this.displayItemName(itemData);


        // 시간 타이머 리셋
        this.itemTimeRemaining = this.itemTimeLimit;
        this.isFalling = true;
        this.isProcessingResult = false; // 중요: 결과 처리 상태 초기화
        this.lastFallTime = this.game.getTime(); // 픽셀 단위 낙하를 위한 타이머 초기화

        // 시작 레인의 쓰레기통 열기
        this.updateBinVisuals(this.currentLaneIndex);

        console.log('GameScene: Type 1 아이템 생성 완료:', itemData.name);
    }

    spawnType2Item(itemData) {
        // 게임 상태 명시적 초기화
        this.gameState = 'playing';
        this.isProcessingResult = false;
        this.preprocessingInputEnabled = false;
        this.currentPreprocessingStep = 0;
        this.fallCount = 0;

        // Type1과 거의 동일하게 처리
        const itemWidth = 60;
        const itemHeight = 60;
        const firstLaneX = 70;
        const startY = 300;

        // 레인 위치 계산
        this.currentLaneIndex = 0;
        const lanePositions = [];
        for (let i = 0; i < this.binKeys.length; i++) {
            lanePositions.push(firstLaneX + (i * 60));
        }
        this.laneCenterXPositions = lanePositions;

        const startX = this.laneCenterXPositions[this.currentLaneIndex];

        // 경고 아이콘이 있는 아이템 이미지 키
        const warningImageKey = `${itemData.id}_warning_img`;

        // 이미지로 생성
        this.currentTrashItemGraphic = this.add.image(startX, startY, warningImageKey)
            .setDisplaySize(itemWidth, itemHeight)
            .setOrigin(0, 0)
            .setDepth(10)
            .setInteractive();

        // 아이템 데이터 설정
        this.currentTrashItemGraphic.itemData = itemData;
        this.currentTrashItemGraphic.setActive(true);

        // 아이템 이름 표시 (TYPE2인 경우 ? 추가되어야 함)
        console.log('spawnType2Item에서 displayItemName 호출');
        this.displayItemName(itemData);

        /*/ '터치!' 텍스트 추가 (아이템 위 2픽셀 위치)
        this.touchText = this.add.text(
            startX + itemWidth / 2,
            startY - 2,
            '터 치!',
            {
                font: '16px 머니그라피',
                fill: '#E2250E',
                stroke: '#FFFFFF',
                strokeThickness: 2,
                align: 'center'
            }
        )
            .setOrigin(0.5, 1) // 텍스트 중앙 하단 기준
            .setDepth(11); // 아이템보다 위에 표시*/

        // Type 2 아이템에만 클릭 핸들러 추가
        this.currentTrashItemGraphic.on('pointerdown', this.onType2ItemClick, this);

        // 아이템 데이터 설정
        this.currentTrashItemGraphic.itemData = itemData;
        this.currentTrashItemGraphic.setActive(true);

        // 메시지 업데이트
        if (this.messageTextObject && itemData.messageInitial) {
            this.messageTextObject.setText(itemData.messageInitial);
        }

        // 시간 타이머 리셋
        this.itemTimeRemaining = this.itemTimeLimit;
        this.isFalling = true;
        this.lastFallTime = this.game.getTime();

        // Type1과 동일하게 시작 레인의 쓰레기통 열기
        this.updateBinVisuals(this.currentLaneIndex);

        console.log('GameScene: Type 2 아이템 생성:', itemData.name);
    }


    // spawnType3Item 함수 수정
    spawnType3Item(itemData) {
        console.log('GameScene: Type 3 아이템 생성');

        const {width, height} = this.sys.game.canvas;

        // 아이템 크기
        const itemWidth = 60;
        const itemHeight = 60;

        // 왼쪽 레인에 아이템 배치
        const startX = 110; // 왼쪽에서 110px
        const startY = 300; // 위에서 300px

        // 패널 바닥 위치 정의 (여기서 정의!)
        const panelBottom = 555; // 패널 바닥 y좌표

        // 아이템 이미지 키
        const itemImageKey = `${itemData.id}_img`;

        // 이미지로 생성
        this.currentTrashItemGraphic = this.add.image(startX, startY, itemImageKey)
            .setDisplaySize(itemWidth, itemHeight)
            .setOrigin(0, 0)
            .setDepth(10);

        this.currentTrashItemGraphic.itemData = itemData;

        // 초기 레인 인덱스는 왼쪽(0)
        this.currentLaneIndex = 0;

        // 메시지 업데이트
        if (this.messageTextObject) {
            this.messageTextObject.setText(itemData.quizQuestion || '닭뼈는 어떤 종류의 쓰레기일까?\n왼쪽은 일반쓰레기, 오른쪽은 음식물쓰레기!');
        }

        // 이지선다 선택지 텍스트 업데이트
        if (!this.leftChoiceText) {
            this.leftChoiceText = this.add.text(
                94,
                570, //width / 2 - 82,590,
                itemData.quizOptions?.left || '일반쓰레기',
                {font: '20px 머니그라피', fill: '#000000', align: 'center', fontStyle: 'bold'}
            ).setOrigin(0, 0);
        } else {
            this.leftChoiceText.setText(itemData.quizOptions?.left || '일반쓰레기');
            this.leftChoiceText.setVisible(true);
        }

        if (!this.rightChoiceText) {
            this.rightChoiceText = this.add.text(
                245, 570,
                itemData.quizOptions?.right || '음식물쓰레기',
                {font: '20px 머니그라피', fill: '#000000', align: 'center', fontStyle: 'bold'}
            ).setOrigin(0, 0);
        } else {
            this.rightChoiceText.setText(itemData.quizOptions?.right || '음식물쓰레기');
            this.rightChoiceText.setVisible(true);
        }
        // 아이템 이름 표시 추가 (TYPE3는 기본 name 사용)
        console.log('spawnType3Item에서 displayItemName 호출');
        this.displayItemName(itemData);

        // 시간 타이머 리셋
        this.itemTimeRemaining = this.itemTimeLimit;
        this.isFalling = true;
        this.lastFallTime = this.game.getTime();

        console.log('GameScene: Type 3 아이템 생성 완료');
    }


    // 충돌 처리 함수 추가
    // handleType3Collision() {
    //     if (!this.isFalling || this.isProcessingResult) return;
    //
    //     this.isFalling = false;
    //     this.isProcessingResult = true;
    //
    //     // 정답 확인
    //     const isCorrect = (this.currentLaneIndex === 0 && this.currentTrashItemGraphic.itemData.correctAnswer === 'left') ||
    //         (this.currentLaneIndex === 1 && this.currentTrashItemGraphic.itemData.correctAnswer === 'right');
    //
    //     this.triggerResultState(this.currentLaneIndex, 'collision', isCorrect);
    // }


    cleanupType3UI() {
        // Type 3 관련 UI 요소 숨김
        if (this.leftChoiceText) this.leftChoiceText.setVisible(false);
        if (this.rightChoiceText) this.rightChoiceText.setVisible(false);

        // 쓰레기통 이름이 숨겨진 경우 다시 표시
        if (this.binNameTexts && !this.binNameTexts[0].visible) {
            this.binNameTexts.forEach(text => text.setVisible(true));
        }

        // 쓰레기통이 숨겨진 경우 다시 표시
        if (this.binImages && !this.binImages[0].visible) {
            this.binImages.forEach(bin => bin.setVisible(true));
        }
    }

    // === Type 2 관련 함수들 ===
    showPreprocessingPopup() {
        // 이미지로 팝업 배경 생성
        this.preprocessingPopupBg = this.add.image(60, 240, 'popup_bg_img')
            .setDisplaySize(320, 375)
            .setOrigin(0, 0)
            .setAlpha(0)
            .setDepth(25);

        // 경고 메시지 설정 (전처리 유도)
        if (this.messageTextObject && this.currentTrashItemData.messageWarning) {
            this.messageTextObject.setText(this.currentTrashItemData.messageWarning);
        }

        // 서서히 나타나는 애니메이션 (2초 동안)
        this.tweens.add({
            targets: this.preprocessingPopupBg,
            alpha: 1,
            duration: 1000,
            ease: 'Linear',
            onComplete: () => {
                console.log('GameScene: 팝업 배경 표시 완료');
                // 배경 표시 완료 후 경고 슬라이드 애니메이션 시작
                this.showWarningSlideAnimation();
            }
        });
    }

    onType2ItemClick() {
        // Type2가 아니거나 이미 처리 중인 경우 무시
        if (this.currentGameType !== 2 || this.isProcessingResult) return;

        console.log('GameScene: Type 2 아이템 클릭됨');

        // 클릭 시 깜빡임 애니메이션 중지
        this.tweens.killTweensOf(this.currentTrashItemGraphic);

        if (this.touchText) {
            this.tweens.killTweensOf(this.touchText);
            this.touchText.destroy(); // '터치!' 텍스트 제거
            this.touchText = null;
        }
        this.currentTrashItemGraphic.alpha = 1;

        this.isFalling = false;

        // 전처리 시작
        this.isProcessingResult = true;
        this.showPreprocessingPopup();
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

    activateNextCommandKey() {
        // 현재 활성화할 커맨드 키 인덱스 계산
        let currentKeyIndex = 0;
        let found = false;

        for (let i = 0; i < this.commandKeyImages.length; i++) {
            const key = this.commandKeyImages[i];
            if (!key.active) {
                currentKeyIndex = i;
                found = true;
                break;
            }
        }

        // 모든 키가 이미 활성화되었으면 완료
        if (!found) {
            this.completePreprocessing();
            return;
        }

        // 현재 키 활성화
        const currentKey = this.commandKeyImages[currentKeyIndex];

        // 활성화 이미지 키 결정
        let activeKeyImageKey;
        switch (currentKey.action) {
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

        // 키 이미지 변경
        if (currentKey.image && !currentKey.image.destroyed) {
            try {
                currentKey.image.setTexture(activeKeyImageKey);
                currentKey.active = true;
            } catch (error) {
                console.error('텍스처 설정 중 오류:', error);
            }
        }
    }


    activateCommandKey(stepIndex, commandIndex) {
        // 모든 단계가 완료되었는지 확인
        if (stepIndex >= this.preprocessingSteps.length) {
            this.completePreprocessing();
            return;
        }

        // 현재 단계 및 커맨드 인덱스 설정
        this.currentPreprocessingStep = stepIndex;
        this.currentCommandIndex = commandIndex;

        // 현재 커맨드 키 찾기
        const currentKeyObj = this.commandKeyImages.find(key =>
            key.stepIndex === stepIndex && key.commandIndex === commandIndex);

        if (currentKeyObj) {
            // 활성화 이미지로 변경
            let activeKeyImageKey;
            switch (currentKeyObj.command.action) {
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

            currentKeyObj.image.setTexture(activeKeyImageKey);
            currentKeyObj.active = true;
        }

        // 메시지 창은 첫 커맨드 입력 후에만 표시
    }


    activateNextCommandKey() {
        if (this.currentPreprocessingStep >= this.preprocessingSteps.length) {
            // 모든 단계 완료
            this.completePreprocessing();
            return;
        }

        // 현재 단계의 커맨드 키 활성화
        const currentKeyObj = this.commandKeyImages[this.currentPreprocessingStep];
        const step = this.preprocessingSteps[this.currentPreprocessingStep];
        let activeKeyImageKey;

        // 밝은 이미지 키 결정
        switch (step.action) {
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

        // 1초 후 키 이미지 변경 (흐린 이미지 -> 밝은 이미지)
        this.time.delayedCall(700, () => {
            currentKeyObj.image.setTexture(activeKeyImageKey);
            currentKeyObj.image.setDisplaySize(40, 43);
            currentKeyObj.image.setAlpha(1);
            currentKeyObj.active = true;

            // 메시지 창 업데이트 (현재 커맨드 이미지 추가)
            this.updateMessageWithCommand(step);
        });
    }

    /*
        updateMessageWithCommand() {
            try {
                // 기존 커맨드 키 이미지와 텍스트 제거
                if (this.messageCommandImages && this.messageCommandImages.length > 0) {
                    this.messageCommandImages.forEach(img => {
                        if (img && !img.destroyed) img.destroy();
                    });
                }
                this.messageCommandImages = [];

                if (this.messageTexts && this.messageTexts.length > 0) {
                    this.messageTexts.forEach(txt => {
                        if (txt && !txt.destroyed) txt.destroy();
                    });
                }
                this.messageTexts = [];

                // 메시지 텍스트 객체 숨기기
                if (this.messageTextObject) {
                    this.messageTextObject.setVisible(false);
                }

                // 시작 위치 설정
                let currentX = 87;
                let currentY = 665;
                let lineCount = 0;
                const maxStepsPerLine = 2; // 한 줄에 최대 2개 상황

                // 현재까지 진행된 모든 단계 표시
                const processedSteps = new Set();

                // 완료된 단계와 현재 진행 중인 단계 찾기
                for (const key of this.commandKeyImages) {
                    if (!key.image || key.image.destroyed) {
                        // 완료된 커맨드의 단계 추가
                        processedSteps.add(key.stepIndex);
                    } else if (key.active) {
                        // 현재 활성화된 커맨드의 단계 추가
                        processedSteps.add(key.stepIndex);
                    }
                }

                // 단계별로 그룹화하여 표시
                const sortedSteps = Array.from(processedSteps).sort((a, b) => a - b);

                for (const stepIndex of sortedSteps) {
                    // 한 줄에 2개 상황이 이미 있으면 다음 줄로
                    if (lineCount >= maxStepsPerLine && stepIndex > 0) {
                        currentX = 87;
                        currentY += 30; // 다음 줄로 이동
                        lineCount = 0;
                    }

                    // 해당 단계의 모든 커맨드 가져오기
                    const stepCommands = this.commandKeyImages.filter(key => key.stepIndex === stepIndex);

                    if (stepCommands.length === 0) continue;

                    // 단계 완료 여부 확인 (모든 커맨드가 완료되었는지)
                    const isStepCompleted = stepCommands.every(cmd => !cmd.image || cmd.image.destroyed);

                    // 현재 진행 중인 단계이고 단일 커맨드인 경우 즉시 진하게 표시
                    const isCurrentStepWithSingleCommand = stepCommands.some(cmd => cmd.active) && stepCommands.length === 1;

                    // 텍스트 스타일 결정
                    const textStyle = {
                        font: '16px Arial',
                        fill: (isStepCompleted || isCurrentStepWithSingleCommand) ? '#000000' : '#666666',
                        fontStyle: (isStepCompleted || isCurrentStepWithSingleCommand) ? 'bold' : 'normal'
                    };

                    // 각 커맨드 키 이미지 추가
                    for (const command of stepCommands) {
                        let keyImageKey;

                        // 이미지 키 결정
                        if (!command.image || command.image.destroyed) {
                            // 완료된 커맨드
                            switch (command.action) {
                                case 'left': keyImageKey = 'left_key_img'; break;
                                case 'down': keyImageKey = 'down_key_img'; break;
                                case 'right': keyImageKey = 'right_key_img'; break;
                                default: keyImageKey = 'down_key_img';
                            }
                        } else {
                            // 진행 중인 커맨드
                            switch (command.action) {
                                case 'left': keyImageKey = command.active ? 'left_key_img' : 'left_key_dim_img'; break;
                                case 'down': keyImageKey = command.active ? 'down_key_img' : 'down_key_dim_img'; break;
                                case 'right': keyImageKey = command.active ? 'right_key_img' : 'right_key_dim_img'; break;
                                default: keyImageKey = command.active ? 'down_key_img' : 'down_key_dim_img';
                            }
                        }

                        // 키 이미지 생성 (20x20 크기)
                        const keyImage = this.add.image(currentX, currentY, keyImageKey)
                            .setDisplaySize(20, 20)
                            .setOrigin(0, 0.5)
                            .setDepth(20);

                        // 색상 설정 (있는 경우)
                        if (command.color) {
                            try {
                                const colorValue = parseInt(command.color.replace('#', '0x'));
                                keyImage.setTint(colorValue);
                            } catch (e) {
                                console.error('색상 설정 오류:', e);
                            }
                        }

                        this.messageCommandImages.push(keyImage);

                        // X 위치 업데이트
                        currentX += 25; // 키 이미지 너비(20) + 간격(5)
                    }

                    // 텍스트 추가
                    const stepText = this.add.text(currentX, currentY, stepCommands[0].text, textStyle)
                        .setOrigin(0, 0.5)
                        .setDepth(20);

                    this.messageTexts.push(stepText);

                    // X 위치 업데이트
                    currentX += stepText.width + 10; // 텍스트 너비 + 간격(10)

                    // 라인 카운트 증가
                    lineCount++;
                }

                console.log('메시지 창 업데이트 완료');
            } catch (error) {
                console.error('메시지 창 업데이트 중 오류:', error);
            }
        }*/
    updateMessageWithCommand() {
        try {
            // 기존 커맨드 키 이미지와 텍스트 제거
            if (this.messageCommandImages && this.messageCommandImages.length > 0) {
                this.messageCommandImages.forEach(img => {
                    if (img && !img.destroyed) img.destroy();
                });
            }
            this.messageCommandImages = [];

            if (this.messageTexts && this.messageTexts.length > 0) {
                this.messageTexts.forEach(txt => {
                    if (txt && !txt.destroyed) txt.destroy();
                });
            }
            this.messageTexts = [];

            // 메시지 텍스트 객체 숨기기
            if (this.messageTextObject) {
                this.messageTextObject.setVisible(false);
            }

            // 시작 위치 설정
            let currentX = 87;
            let currentY = 665;
            let lineCount = 0;
            const maxStepsPerLine = 2; // 한 줄에 최대 2개 상황

            // 현재까지 진행된 모든 단계 표시
            const processedSteps = new Set();

            // 완료된 단계와 현재 진행 중인 단계 찾기
            for (const key of this.commandKeyImages) {
                if (!key.image || key.image.destroyed) {
                    // 완료된 커맨드의 단계 추가
                    processedSteps.add(key.stepIndex);
                } else if (key.active) {
                    // 현재 활성화된 커맨드의 단계 추가
                    processedSteps.add(key.stepIndex);
                }
            }

            // 단계별로 그룹화하여 표시
            const sortedSteps = Array.from(processedSteps).sort((a, b) => a - b);

            for (const stepIndex of sortedSteps) {
                // 한 줄에 2개 상황이 이미 있으면 다음 줄로
                if (lineCount >= maxStepsPerLine && stepIndex > 0) {
                    currentX = 87;
                    currentY += 32; // 다음 줄로 이동
                    lineCount = 0;
                }

                // 해당 단계의 모든 커맨드 가져오기
                const stepCommands = this.commandKeyImages.filter(key => key.stepIndex === stepIndex);

                if (stepCommands.length === 0) continue;

                // 단계 완료 여부 확인 (모든 커맨드가 완료되었는지)
                const isStepCompleted = stepCommands.every(cmd => !cmd.image || cmd.image.destroyed);

                // 현재 진행 중인 단계이고 단일 커맨드인 경우 즉시 진하게 표시
                const isCurrentStepWithSingleCommand = stepCommands.some(cmd => cmd.active) && stepCommands.length === 1;

                // 텍스트 스타일 결정
                const textStyle = {
                    font: '16px 머니그라피',
                    fill: (isStepCompleted || isCurrentStepWithSingleCommand) ? '#303030' : '#C8C8C8',
                    fontStyle: (isStepCompleted || isCurrentStepWithSingleCommand) ? 'bold' : 'normal'
                };

                // 각 커맨드 키 이미지 추가 (패널과 동일한 이미지 사용)
                for (const command of stepCommands) {
                    let keyImageKey;

                    // 이미지 키 결정 (패널과 동일한 이미지 키 사용)
                    if (!command.image || command.image.destroyed) {
                        // 완료된 커맨드 (패널과 동일한 활성화 이미지)
                        switch (command.action) {
                            case 'left':
                                keyImageKey = 'left_key_img';
                                break;
                            case 'down':
                                keyImageKey = 'down_key_img';
                                break;
                            case 'right':
                                keyImageKey = 'right_key_img';
                                break;
                            default:
                                keyImageKey = 'down_key_img';
                        }
                    } else {
                        // 진행 중인 커맨드 (패널과 동일한 이미지)
                        switch (command.action) {
                            case 'left':
                                keyImageKey = command.active ? 'left_key_img' : 'left_key_dim_img';
                                break;
                            case 'down':
                                keyImageKey = command.active ? 'down_key_img' : 'down_key_dim_img';
                                break;
                            case 'right':
                                keyImageKey = command.active ? 'right_key_img' : 'right_key_dim_img';
                                break;
                            default:
                                keyImageKey = command.active ? 'down_key_img' : 'down_key_dim_img';
                        }
                    }

                    // 키 이미지 생성 (20x20 크기)
                    const keyImage = this.add.image(currentX, currentY, keyImageKey)
                        .setDisplaySize(20, 20)
                        .setOrigin(0, 0)
                        .setDepth(20);

                    // 색상 설정은 제거 (패널과 동일하게)
                    // if (command.color) {
                    //     try {
                    //         const colorValue = parseInt(command.color.replace('#', '0x'));
                    //         keyImage.setTint(colorValue);
                    //     } catch (e) {
                    //         console.error('색상 설정 오류:', e);
                    //     }
                    // }

                    this.messageCommandImages.push(keyImage);

                    // X 위치 업데이트
                    currentX += 20; // 키 이미지 너비(20) + 간격(5)
                }

                // 텍스트 추가
                const stepText = this.add.text(currentX, currentY, stepCommands[0].text, textStyle)
                    .setOrigin(0, 0)
                    .setDepth(20);

                this.messageTexts.push(stepText);

                // X 위치 업데이트
                currentX += stepText.width + 10; // 텍스트 너비 + 간격(10)

                // 라인 카운트 증가
                lineCount++;
            }

            console.log('메시지 창 업데이트 완료');

        } catch (error) {
            console.error('메시지 창 업데이트 중 오류:', error);
        }
    }

    /*
        handlePreprocessingCommand(action) {
            try {
                // 활성화된 첫 번째 커맨드 키 찾기
                const currentKeyIndex = this.commandKeyImages.findIndex(key => key.active);

                if (currentKeyIndex === -1) {
                    console.log('활성화된 커맨드 키가 없음');
                    return;
                }

                const currentKey = this.commandKeyImages[currentKeyIndex];

                // 액션 일치 확인
                if (currentKey.action === action) {
                    console.log('올바른 키 입력:', action);

                    // 새로운 상황의 첫 번째 커맨드인지 확인
                    const isFirstCommandOfNewStep = currentKeyIndex === 0 ||
                        (currentKeyIndex > 0 &&
                            this.commandKeyImages[currentKeyIndex].stepIndex !==
                            this.commandKeyImages[currentKeyIndex - 1].stepIndex);

                    // 새로운 상황 시작 시 이미지 변경
                    if (isFirstCommandOfNewStep) {
                        // 상황 시작 시 이미지 변경 (stepIndex + 2로 계산)
                        this.updateItemImage(currentKey.stepIndex + 2);
                        console.log(`새로운 상황 시작: "${currentKey.text}" - step${currentKey.stepIndex + 2} 이미지로 변경`);
                    }

                    // 마지막 커맨드인지 확인
                    const isLastCommand = currentKeyIndex === this.commandKeyImages.length - 1;

                    this.updateMessageWithCommand();

                    // 키 이미지 날아가는 애니메이션
                    this.tweens.add({
                        targets: currentKey.image,
                        y: currentKey.image.y - 50,
                        alpha: 0,
                        duration: 500,
                        onComplete: () => {
                            // 이미지 제거
                            if (currentKey.image) {
                                currentKey.image.destroy();
                                currentKey.image = null; // 참조 제거
                            }

                            // 다음 커맨드 키들 앞으로 당기기
                            for (let i = currentKeyIndex + 1; i < this.commandKeyImages.length; i++) {
                                const key = this.commandKeyImages[i];
                                if (key.image) {
                                    this.tweens.add({
                                        targets: key.image,
                                        x: 240 + ((i - currentKeyIndex - 1) * 24),
                                        duration: 300
                                    });
                                }
                            }

                            // 현재 키 비활성화
                            currentKey.active = false;

                            // 마지막 커맨드인 경우 특별 처리
                            if (isLastCommand) {
                                // 마지막 상황도 메시지 창 업데이트
                                this.updateMessageWithCommand();

                                // 잠시 후 전처리 완료 이미지로 변경하고 완료 시퀀스 시작
                                this.time.delayedCall(500, () => {
                                    this.updateToPreprocessedImage();

                                    // 1초 후 완료 시퀀스 시작
                                    this.time.delayedCall(1000, () => {
                                        this.startCompletionSequence();
                                    });
                                });
                            } else {

                                // 다음 키 활성화
                                const nextKey = this.commandKeyImages[currentKeyIndex + 1];
                                nextKey.active = true;

                                // 다음 키 활성화 이미지로 변경
                                if (nextKey.image) {
                                    let activeKeyImageKey;
                                    switch (nextKey.action) {
                                        case 'left': activeKeyImageKey = 'left_key_img'; break;
                                        case 'down': activeKeyImageKey = 'down_key_img'; break;
                                        case 'right': activeKeyImageKey = 'right_key_img'; break;
                                        default: activeKeyImageKey = 'down_key_img';
                                    }

                                    if (this.textures.exists(activeKeyImageKey)) {
                                        nextKey.image.setTexture(activeKeyImageKey);
                                        nextKey.image.setDisplaySize(40, 43);
                                    }
                                }
                            }
                        }
                    });
                } else {
                    // 잘못된 키 입력 - 흔들림 효과
                    if (currentKey.image) {
                        this.tweens.add({
                            targets: currentKey.image,
                            x: currentKey.image.x + 5,
                            duration: 50,
                            yoyo: true,
                            repeat: 3
                        });
                    }
                }
            } catch (error) {
                console.error('커맨드 처리 중 오류:', error);
            }
        }*/



    updateToPreprocessedImage() {
        try {
            // preprocessed 이미지로 변경 (기존 step 변경과 동일한 방식)
            const itemId = this.currentTrashItemGraphic.itemData.id;
            const preprocessedImageKey = `${itemId}_preprocessed_img`;

            // 원본 이미지 크기 저장
            const originalWidth = this.preprocessingItemImage.displayWidth;
            const originalHeight = this.preprocessingItemImage.displayHeight;

            // preprocessed 이미지가 있으면 변경 (step 변경과 동일한 방식)
            if (this.textures.exists(preprocessedImageKey)) {
                this.preprocessingItemImage.setTexture(preprocessedImageKey);
                // 원본 크기 유지
                this.preprocessingItemImage.setDisplaySize(originalWidth, originalHeight);
                console.log(`전처리 완료 이미지로 변경: ${preprocessedImageKey}`);
            } else {
                console.log(`전처리 완료 이미지 없음: ${preprocessedImageKey} (기본 이미지 유지)`);
            }
        } catch (error) {
            console.error('전처리 완료 이미지 업데이트 중 오류:', error);
        }
    }


    updateItemImage(stepNumber) {
        try {
            // 상황 단위로 이미지 업데이트 (step1, step2, step3, step4)
            const itemId = this.currentTrashItemGraphic.itemData.id;
            const stepImageKey = `${itemId}_step${stepNumber}_img`;

            // 원본 이미지 크기 저장
            const originalWidth = this.preprocessingItemImage.displayWidth;
            const originalHeight = this.preprocessingItemImage.displayHeight;

            // 해당 단계 이미지가 있으면 변경, 없으면 그대로
            if (this.textures.exists(stepImageKey)) {
                this.preprocessingItemImage.setTexture(stepImageKey);
                // 원본 크기 유지
                this.preprocessingItemImage.setDisplaySize(originalWidth, originalHeight);
                console.log(`전처리 이미지 업데이트: ${stepImageKey}`);
            } else {
                console.log(`전처리 이미지 없음: ${stepImageKey} (기본 이미지 유지)`);
            }
        } catch (error) {
            console.error('전처리 이미지 업데이트 중 오류:', error);
        }
    }

    startCompletionSequence() {
        try {
            // 누적된 텍스트 제거
            this.clearMessageBoard();

            // 전처리 완료 메시지 표시
            if (this.messageTextObject && this.currentTrashItemData.messagePreprocessingComplete) {
                this.messageTextObject.setVisible(true);
                this.messageTextObject.setText(this.currentTrashItemData.messagePreprocessingComplete);
            }

            // 동시에 전처리 이미지 서서히 사라지게 하기
            if (this.preprocessingItemImage) {
                this.tweens.add({
                    targets: this.preprocessingItemImage,
                    alpha: 0,
                    duration: 2000, // 2초에 걸쳐 서서히 사라짐
                    onComplete: () => {
                        // 이미지가 완전히 사라진 후 다음 단계로
                        this.time.delayedCall(500, () => {
                            this.startCleanupAnimation();
                        });
                    }
                });
            } else {
                // 이미지가 없는 경우 바로 다음 단계로
                this.time.delayedCall(2000, () => {
                    this.startCleanupAnimation();
                });
            }

            console.log('전처리 완료 시퀀스 시작');
        } catch (error) {
            console.error('완료 시퀀스 중 오류:', error);
        }
    }

    // 메시지 보드 정리 함수 추가 (completePreprocessing 함수 앞에 추가)
    clearMessageBoard() {
        try {
            // 메시지 커맨드 이미지들 제거
            if (this.messageCommandImages && this.messageCommandImages.length > 0) {
                this.messageCommandImages.forEach(img => {
                    if (img && !img.destroyed) img.destroy();
                });
            }
            this.messageCommandImages = [];

            // 메시지 텍스트들 제거
            if (this.messageTexts && this.messageTexts.length > 0) {
                this.messageTexts.forEach(txt => {
                    if (txt && !txt.destroyed) txt.destroy();
                });
            }
            this.messageTexts = [];

            console.log('메시지 보드 정리 완료');
        } catch (error) {
            console.error('메시지 보드 정리 중 오류:', error);
        }
    }

    // completePreprocessing 함수는 더 이상 사용하지 않으므로 제거하고
    // startCleanupAnimation 함수를 수정

    startCleanupAnimation() {
        // 1. 먼저 warning_animation 이미지가 있다면 왼쪽으로 밀어내기
        if (this.warningSlide) {
            this.tweens.add({
                targets: this.warningSlide,
                x: -1500, // 화면 왼쪽 바깥으로 더 멀리 이동
                duration: 1500,
                ease: 'Power2',
                onComplete: () => {
                    // warning_animation 이미지 제거
                    this.warningSlide.destroy();

                    // 2. 회색 배경 페이드 아웃
                    this.fadeOutBackground();
                }
            });
        } else {
            // warning_animation이 없는 경우 바로 배경 페이드 아웃
            this.fadeOutBackground();
        }

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
        this.displayItemName(itemData);

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

        this.spawnWasteItem();
    }

    completeLevel() {
        console.log('GameScene: 레벨 완료!');

        // 레벨 완료 메시지
        if (this.messageTextObject) {
            this.messageTextObject.setText('축하합니다!\n1레벨을 완료했습니다!');
        }

        // 결과 버튼
        if (this.resultButton) {
            this.resultButton.setFillStyle(0x00ff00);
            this.resultButton.setVisible(true);
        }
        if (this.resultButtonText) {
            this.resultButtonText.setText('게임 완료');
            this.resultButtonText.setVisible(true);
        }

        // 완료 버튼 클릭 시 시작 화면으로
        this.resultButton.removeAllListeners('pointerdown');
        this.resultButton.on('pointerdown', () => {
            this.scene.stop('GameScene');
            this.scene.start('BootScene');
        }, this);

        this.setGameInputEnabled(false);
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

    // resetItemForRetry() {
    //     console.log('GameScene: 같은 아이템으로 다시 출제.');
    //     this.hideResultUI();
    //
    //     // 현재 게임 타입에 따라 다시 스폰
    //     if (this.currentGameType === 1) {
    //         this.spawnType1Item(this.currentTrashItemData);
    //     } else if (this.currentGameType === 2) {
    //         this.spawnType2Item(this.currentTrashItemData);
    //     } else if (this.currentGameType === 3) {
    //         this.spawnType3Item(this.currentTrashItemData);
    //     }
    // }

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
        this.spawnWasteItem();

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