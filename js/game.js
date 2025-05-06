// js/game.js 파일 시작

// --- BootScene 클래스 정의: 게임 시작 화면 ---
class BootScene extends Phaser.Scene {
    constructor() {
        super('BootScene'); // 씬의 고유 이름 설정
        console.log('BootScene: Constructor 실행.');
    }

    preload() {
        // BootScene 자체에 필요한 자산 로드 (현재는 없음)
        // GameScene에 필요한 자산 로드 (사각형 사용하므로 여기도 비워둠)
        console.log('BootScene: preload 실행.');
        // TODO: 나중에 시작 화면 배경 이미지 등이 필요하면 여기에 로드 코드를 추가합니다.
    }

    create() {
        console.log('BootScene: create 실행.');

        // 화면 해상도 정보는 config 객체에서 가져옵니다.
        const { width, height } = this.sys.game.canvas;

        // 시작 화면 배경색
        this.cameras.main.setBackgroundColor('#4488aa');

        // 게임 제목 텍스트
        const titleStyle = { font: '48px Arial', fill: '#ffffff' };
        this.add.text(width / 2, height / 3, '분리수거 게임', titleStyle).setOrigin(0.5);

        // 게임 시작 버튼 텍스트 (클릭 가능한 텍스트)
        const startButtonStyle = { font: '32px Arial', fill: '#ffff00', backgroundColor: '#333333', padding: { x: 20, y: 10 } };
        const startButton = this.add.text(width / 2, height / 1.5, '게임 시작', startButtonStyle)
            .setOrigin(0.5)
            .setInteractive(); // 클릭/터치 가능하게 설정
            // .setCursor('pointer'); // 마우스 오버 시 커서 모양 변경 (이전 TypeError 방지를 위해 삭제 또는 주석 처리됨)

        // 시작 버튼 클릭/터치 이벤트 리스너 추가
        startButton.on('pointerdown', function () {
            console.log('BootScene: 게임 시작 버튼 클릭됨!');

            this.scene.stop('BootScene'); // 현재 BootScene 중지

            // 'GameScene' 키를 가진 기존 인스턴스를 다시 시작합니다.
            // GameScene의 create 함수 안에서 resetGameState가 호출되어 상태 초기화가 이루어집니다.
            this.scene.start('GameScene'); // <-- 'GameScene' 키로 다시 시작

        }, this);

        console.log('BootScene: create 완료.');
    }

    update(time, delta) {
        // BootScene에서는 보통 업데이트 로직이 필요 없습니다.
    }
}

class GameScene extends Phaser.Scene {
    constructor() {
        super('GameScene');
        console.log('GameScene: Constructor 실행.');

        // --- 게임 플레이 중 필요한 변수들 ---
        this.score = 0; // 현재 점수
        this.scoreText = null; // 점수 표시 텍스트 오브젝트
        this.health = 3; // 체력 변수 (하트 3개)
        console.log('GameScene: Constructor - 체력 초기화:', this.health);
        this.heartGraphics = []; // 하트 그래픽/스프라이트 배열

        this.level = 1; // <-- 레벨 변수 추가
        this.levelText = null; // <-- 레벨 표시 텍스트 오브젝트 추가

        this.itemTimeLimit = 3; // <-- 아이템별 시간 제한 (초)
        this.itemTimeRemaining = this.itemTimeLimit; // <-- 현재 아이템 남은 시간
        this.timeText = null; // <-- 시간 표시 텍스트 오브젝트 추가


        this.currentTrashItemGraphic = null; // 현재 쓰레기 아이템 사각형 오브젝트
        this.currentTrashItemData = null; // 현재 쓰레기 아이템의 규칙 데이터

        this.cursors = null; // 키보드 화살표 입력 객체
        this.spaceKey = null; // 스페이스bar 입력 객체

        this.fallSpeed = 50; // 쓰레기 기본 낙하 속도 (픽셀/초)
        this.fastFallMultiplier = 2.5; // 가속 배율

        this.currentLaneIndex = 0;
        this.isFalling = false; // 쓰레기가 현재 낙하 중인지 상태
        this.isProcessingResult = false; // 결과 처리 중인지 상태 (중복 충돌 방지)


        // --- 입력 상태 플래그 및 타이머 (칸 이동 반복 간격 제어용) ---
        this.moveLeft = false;
        this.moveRight = false;
        this.moveDownFast = false; // 아래 버튼 가속 플래그 (누르고 있는 동안 사용)

        this.keyboardMoveDelay = 150;
        this.lastKeyboardMoveTime = 0;

        this.lastLandedLaneIndex = 0;


        // --- 임시 쓰레기 아이템 규칙 데이터 (사각형 색상, 정답, 메시지) ---
        this.wasteRulesData = [
             { id: 'item_milkcarton', name: '우유팩', correctBin: 'bin_pack', messageInitial: '우유팩이 나타났어.\n어디에 분리배출 해야 할까?', messageCorrect: '정답이야! \n 우유팩은 종이팩으로 배출해야 해.', messageIncorrect: '오답이야! \n 우유팩의 배출 방법을 다시 생각해 볼까?' },
             { id: 'item_petbottle', name: '페트병', correctBin: 'bin_plastic', messageInitial: '페트병이 나타났어.\n어디에 분리배출 해야 할까?', messageCorrect: '정답!\n페트병은 플라스틱으로...', messageIncorrect: '오답!\n페트병 배출은...' },
             { id: 'item_newspaper', name: '신문지', correctBin: 'bin_paper', messageInitial: '신문지가 나타났어.\n어디에 분리배출 해야 할까?', messageCorrect: '정답!\n신문지는 종이로...', messageIncorrect: '오답!\n신문지 배출은...' },
             { id: 'item_can', name: '캔', correctBin: 'bin_can', messageInitial: '캔이 나타났어.\n어디에 분리배출 해야 할까?', messageCorrect: '정답!\n캔은 캔류로...', messageIncorrect: '오답!\n캔 배출은...' },
             { id: 'item_general', name: '일반쓰레기', correctBin: 'bin_general', messageInitial: '이건 일반쓰레기야.\n어디에 버려야 할까?', messageCorrect: '정답!\n이건 일반쓰레기야.', messageIncorrect: '오답!\n이건 재활용이 안돼...' },
        ];

        // 시간 초과 시 사용할 메시지
        this.messageTimeOut = '시간초과야 다시해볼까?';


        // --- 쓰레기통 키, 색상, 그리고 각 칸(Lane)의 중심 X 좌표 ---
        this.binKeys = ['bin_general', 'bin_paper', 'bin_pack', 'bin_plastic', 'bin_can'];
        this.binColors = {
            'bin_general': 0x808080, 'bin_paper': 0x0000ff, 'bin_pack': 0xff0000, 'bin_plastic': 0x008000, 'bin_can': 0xffff00
        };

        this.laneCenterXPositions = [];
        this.binTopLabelYPositions = [];
        this.binGraphics = [];
        this.commandButtons = {};

        // --- 화면 레이아웃 기준 좌표 ---
        this.panel = { x: 0, y: 0, width: 0, height: 0 };
        this.messageArea = { x: 0, y: 0, width: 0, height: 0 };
        this.commandButtonArea = { y: 0 };

        // --- 결과 표시 UI 오브젝트 ---
        this.messageAreaGraphic = null;
        this.messageTextObject = null;
        this.resultButton = null;
        this.resultButtonText = null;
        this.lastResultIsCorrect = false;
    }

    preload() {
        console.log('GameScene: preload 실행.');
        // TODO: 나중에 이미지 에셋 로드
    }

    create() {
        console.log('GameScene: create 실행.');

        const { width, height } = this.sys.game.canvas;

        // --- 배경색 설정 ---
        this.cameras.main.setBackgroundColor('#4CAF50');

        // --- 중앙 큰 패널 배치 ---
        this.panel.width = width * 0.9; this.panel.height = height * 0.6; this.panel.x = width / 2; this.panel.y = height * 0.4;
         this.add.graphics().fillStyle(0x333333).fillRect(this.panel.x - this.panel.width / 2, this.panel.y - this.panel.height / 2, this.panel.width, this.panel.height);

        // --- UI 요소 배치: 레벨, 점수, 시간 (화면 최상단 영역) ---
        const topUfY = 30; const topUIPaddingX = 40; const topUISpacing = 100;

        // 레벨 표시 (텍스트 오브젝트 저장)
        this.levelText = this.add.text(topUIPaddingX, topUfY, '레벨 1', { font: '18px Arial', fill: '#ffffff' }).setOrigin(0, 0.5); // <-- this.levelText 저장

        // 점수 표시 (텍스트 오브젝트 저장)
        this.scoreText = this.add.text(topUIPaddingX + topUISpacing, topUfY, '점수: ' + this.score, { font: '18px Arial', fill: '#ffffff' }).setOrigin(0, 0.5); // <-- this.scoreText 저장

        // 시간 표시 (텍스트 오브젝트 저장)
        // 위치 조정 (점수 옆에 배치)
        this.timeText = this.add.text(topUIPaddingX + topUISpacing * 2, topUfY, '시간 ' + this.itemTimeLimit, { font: '18px Arial', fill: '#ffffff' }).setOrigin(0, 0.5); // <-- this.timeText 저장

        // TODO: 일시정지/메뉴 버튼
        const menuButtonSize = 20;
        this.add.rectangle(width - topUIPaddingX, topUfY, menuButtonSize, menuButtonSize, 0xcccccc).setOrigin(0.5);


        // --- UI 요소 배치: 하트 ---
        const heartsPanelY = this.panel.y - this.panel.height / 2 + 30; const heartsPanelRightX = this.panel.x + this.panel.width / 2 - 30;
        const heartSize = 20; const heartSpacing = 30; const firstHeartPanelX = heartsPanelRightX - heartSize / 2;
        this.heartGraphics = []; // 배열 초기화
        for (let i = 0; i < 3; i++) {
            const heartX = firstHeartPanelX - heartSpacing * i;
            const heartRect = this.add.rectangle(heartX, heartsPanelY, heartSize, heartSize, 0xff0000).setOrigin(0.5);
            this.heartGraphics.push(heartRect);
        }

        // --- 쓰레기통 사각형 배치 및 칸(Lane) 위치, 라벨 위치 저장 ---
        const binAreaY = this.panel.y + this.panel.height / 2 - 38; const binWidth = 50; const binHeight = 70; const numberOfBins = this.binKeys.length; const binAreaPaddingX = 40;
        const binAreaWidth = this.panel.width - binAreaPaddingX * 2;
        const binSpacing = (numberOfBins > 1) ? binAreaWidth / (numberOfBins - 1) : 0;
        const binAreaStartX = (this.panel.x - this.panel.width / 2) + binAreaPaddingX;
        const labelYOffset = 5;
        const binTopLabelBottomY = binAreaY - binHeight / 2 - labelYOffset;
        this.binGraphics = []; this.laneCenterXPositions = []; this.binTopLabelYPositions = [];
        this.binKeys.forEach((key, index) => {
             let binX;
             if (numberOfBins === 1) { binX = this.panel.x; } else { binX = binAreaStartX + (binSpacing * index); }
             this.add.graphics().fillStyle(this.binColors[key]).fillRect(binX - binWidth / 2, binAreaY - binHeight / 2, binWidth, binHeight);
             this.laneCenterXPositions.push(binX);
             this.binTopLabelYPositions[index] = binTopLabelBottomY;
              this.binGraphics.push({ key: key, x: binX, y: binAreaY, width: binWidth, height: binHeight, left: binX - binWidth / 2, right: binX + binWidth / 2 });
              const nameStyle = { font: '14px Arial', fill: 0xFFFFFF, align: 'center' };
              this.add.text(binX, binTopLabelBottomY, key.replace('bin_', '').toUpperCase(), nameStyle).setOrigin(0.5, 1);
        });

        // --- 메시지/말풍선 영역 배치 ---
        this.messageArea.width = width * 0.7; this.messageArea.height = 60; this.messageArea.x = width / 2;
        this.messageArea.y = this.panel.y + this.panel.height / 2 + this.messageArea.height / 2 + 20;
        this.messageAreaGraphic = this.add.graphics()
             .fillStyle(0xffffff).fillRect(this.messageArea.x - this.messageArea.width/2, this.messageArea.y - this.messageArea.height/2, this.messageArea.width, this.messageArea.height)
             .setVisible(true); // <-- 항상 보이게

        const messageStyle = { font: '16px Arial', fill: '#000000', align: 'center', wordWrap: { width: this.messageArea.width - 20 } };
        this.messageTextObject = this.add.text(this.messageArea.x, this.messageArea.y, '', messageStyle)
            .setOrigin(0.5).setDepth(1).setVisible(true); // <-- 항상 보이게

        // --- 커맨드 버튼(좌, 우, 아래) ---
        const commandButtonY = this.messageArea.y + this.messageArea.height / 2 + 50; const buttonSize = 50; const buttonSpacing = 80;
        this.cursors = this.input.keyboard.createCursorKeys(); this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

        // 왼쪽 버튼
        this.commandButtons.left = this.add.rectangle(width / 2 - buttonSpacing, commandButtonY, buttonSize, buttonSize, 0xff0000).setInteractive();
        this.add.text(width / 2 - buttonSpacing, commandButtonY, '←', { font: '30px Arial', fill: '#ffffff' }).setOrigin(0.5);
        this.commandButtons.left.on('pointerdown', () => { this.moveLeft = true; }); this.commandButtons.left.on('pointerup', () => { this.moveLeft = false; }); this.commandButtons.left.on('pointerout', () => { this.moveLeft = false; });

        // 아래쪽 버튼
        this.commandButtons.down = this.add.rectangle(width / 2, commandButtonY, buttonSize, buttonSize, 0x0000ff).setInteractive();
        this.add.text(width / 2, commandButtonY, '↓', { font: '30px Arial', fill: '#ffffff' }).setOrigin(0.5);
        // 아래 버튼 리스너 (누르고 있는 동안 가속 플래그 설정)
        this.commandButtons.down.on('pointerdown', () => { this.moveDownFast = true; });
        this.commandButtons.down.on('pointerup', () => { this.moveDownFast = false; });
        this.commandButtons.down.on('pointerout', () => { this.moveDownFast = false; });


        // 오른쪽 버튼
        this.commandButtons.right = this.add.rectangle(width / 2 + buttonSpacing, commandButtonY, buttonSize, buttonSize, 0xff0000).setInteractive();
        this.add.text(width / 2 + buttonSpacing, commandButtonY, '→', { font: '30px Arial', fill: '#ffffff' }).setOrigin(0.5);
        this.commandButtons.right.on('pointerdown', () => { this.moveRight = true; }); this.commandButtons.right.on('pointerup', () => { this.moveRight = false; }); this.commandButtons.right.on('pointerout', () => { this.moveRight = false; });

        // --- 결과 버튼들 ---
        const resultButtonWidth = 80; const resultButtonHeight = 40; const resultButtonPaddingX = 10; const resultButtonPaddingY = 10;
        const resultButtonX = (this.messageArea.x + this.messageArea.width / 2) - resultButtonWidth / 2 - resultButtonPaddingX;
        const resultButtonY = (this.messageArea.y + this.messageArea.height / 2) - resultButtonHeight / 2 - resultButtonPaddingY;
        this.resultButton = this.add.rectangle(resultButtonX, resultButtonY, resultButtonWidth, resultButtonHeight, 0x00ff00).setInteractive().setVisible(false); // <-- 버튼은 초기 숨김
        const resultButtonStyle = { font: '18px Arial', fill: '#ffffff', align: 'center' };
        this.resultButtonText = this.add.text(resultButtonX, resultButtonY, '', resultButtonStyle).setOrigin(0.5).setDepth(1).setVisible(false); // <-- 버튼 텍스트 초기 숨김
        this.resultButton.on('pointerdown', () => { this.hideResultUIAndProceed(); }, this);


        // --- create 함수 완료 후 게임 상태 초기화 및 첫 아이템 생성 ---
        this.resetGameState();

        console.log('GameScene: create 완료.');
    }

    update(time, delta) {
        const deltaInSeconds = delta / 1000;
        const currentTime = time;

        // --- 시간 타이머 업데이트 ---
        // 아이템이 낙하 중이고 결과 처리 중이 아닐 때만 시간 감소
        if (this.isFalling && !this.isProcessingResult) {
             this.itemTimeRemaining -= deltaInSeconds;

             // 시간 표시 업데이트 (초 단위, 0 이하로 내려가지 않게)
             this.timeText.setText('시간 ' + Math.max(0, Math.ceil(this.itemTimeRemaining))); // <-- 초 단위 시간 업데이트

             // --- 시간 초과 판정 ---
             if (this.itemTimeRemaining <= 0) {
                 console.log('GameScene: 시간 초과!');
                 // 시간 초과 시 오답 처리 플로우 시작
                 this.isFalling = false; // 낙하 중지
                 this.isProcessingResult = true; // 결과 처리 시작 플래그

                 // 시간 초과 처리 함수 호출 (오답 플로우로 연결)
                 this.triggerResultState(this.currentLaneIndex, 'timeout'); // <-- 시간 초과 이유 전달
             }
        }


        // --- 쓰레기 아이템 낙하 로직 ---
        if (this.currentTrashItemGraphic && this.isFalling) {
            // 낙하 속도 계산 (누르고 있는 동안 가속)
            let currentFallSpeed = this.fallSpeed; // 기본 속도
            if (this.cursors.down.isDown || this.moveDownFast) { // 아래 키가 눌려있거나 아래 버튼 플래그가 true이면
                 currentFallSpeed = this.fallSpeed * this.fastFallMultiplier; // 가속 속도 적용
             }

            // 쓰레기 아이템 Y 위치 업데이트
            this.currentTrashItemGraphic.y += currentFallSpeed * deltaInSeconds;


            // --- 쓰레기 좌우 칸 이동 (키보드 또는 버튼 플래그 사용) ---
            if (this.cursors.left.isDown || this.moveLeft || this.cursors.right.isDown || this.moveRight) {
                 if (currentTime - this.lastKeyboardMoveTime > this.keyboardMoveDelay) {
                     const direction = (this.cursors.left.isDown || this.moveLeft) ? -1 : 1;
                      this.moveLaneHorizontal(direction);
                      this.lastKeyboardMoveTime = currentTime;
                 }
            } else {
                 this.lastKeyboardMoveTime = currentTime - this.keyboardMoveDelay;
            }

            // --- 쓰레기 아이템과 쓰레기 라벨 충돌 판정 ---
            const labelBottomY = this.binTopLabelYPositions[this.currentLaneIndex];
            const collisionY = labelBottomY - 17;
            const itemBottomY = this.currentTrashItemGraphic.y + (this.currentTrashItemGraphic.height * this.currentTrashItemGraphic.scaleY / 2);

            if (itemBottomY >= collisionY && !this.isProcessingResult) {
                console.log('GameScene: 쓰레기 라벨 근처 높이에 도달! 결과 처리 시작.');
                this.isFalling = false;
                this.isProcessingResult = true;
                this.currentTrashItemGraphic.y = collisionY - (this.currentTrashItemGraphic.height * this.currentTrashItemGraphic.scaleY / 2);

                // 충돌 시 결과 상태 트리거 (정답/오답 이유 전달)
                this.triggerResultState(this.currentLaneIndex, 'collision'); // <-- 충돌 이유 전달
            }
        }

         // --- 쓰레기 아이템이 화면 맨 아래(게임 영역 밖)로 떨어졌을 때 처리 ---
         const gameHeight = this.sys.game.canvas.height;
          if (this.currentTrashItemGraphic && !this.isProcessingResult && this.currentTrashItemGraphic.y > gameHeight) {
             console.log('GameScene: 쓰레기통 높이를 지나 화면 밖으로 완전히 떨어짐!');
             this.isFalling = false;
             this.isProcessingResult = true;

             // 바닥 낙하 시 결과 상태 트리거 (오답 이유 전달)
             this.triggerResultState(null, 'floor'); // <-- 바닥 낙하 이유 전달 (null은 레인 아님)
         }
    }

    // --- 게임 상태 초기화 함수 ---
    // 게임 시작 시 (create 완료 후) 또는 다시 시작할 때 호출됩니다.
    resetGameState() {
        console.log('GameScene: 게임 상태 초기화 시작.');

        // --- 게임 변수 초기화 ---
        this.score = 0; // 점수 초기화
        this.health = 3; // 체력 초기값으로 리셋
        this.level = 1; // <-- 레벨 초기값으로 리셋
        this.currentLaneIndex = 0;
        this.isFalling = false;
        this.isProcessingResult = false;
        this.moveLeft = false;
        this.moveRight = false;
        this.moveDownFast = false;
        this.lastKeyboardMoveTime = 0;
        this.lastLandedLaneIndex = 0;
        this.itemTimeRemaining = this.itemTimeLimit; // <-- 시간 초기값으로 리셋


        // --- UI 오브젝트 초기화 ---
        // scoreText 오브젝트가 생성된 후 (create 완료 후)에만 업데이트
        if (this.scoreText) { this.scoreText.setText('점수: ' + this.score); }
        if (this.levelText) { this.levelText.setText('레벨 ' + this.level); } // <-- 레벨 텍스트 업데이트
        if (this.timeText) { this.timeText.setText('시간 ' + this.itemTimeLimit); } // <-- 시간 텍스트 업데이트


        // 하트 UI 업데이트 (하트 오브젝트가 생성된 후)
        if (this.heartGraphics.length > 0) {
             this.updateHealthUI(); // 초기 체력(3)에 맞춰 하트 UI 업데이트
        }

        // 메시지 창 내용은 spawnWasteItem에서 업데이트
        // 결과 버튼만 숨김
        this.hideResultUI(); // 결과 버튼 숨김 및 isProcessingResult = false 설정

        // 쓰레기 아이템 제거 (만약 남아 있다면)
        if (this.currentTrashItemGraphic) {
            this.currentTrashItemGraphic.destroy();
            this.currentTrashItemGraphic = null;
        }

        // --- 첫 쓰레기 아이템 생성 ---
        this.spawnWasteItem();

        console.log('GameScene: 게임 상태 초기화 완료. 첫 아이템 생성.');
    }


    // --- 쓰레기 아이템을 랜덤으로 선택하고 화면에 사각형으로 표시하는 함수 ---
    spawnWasteItem () {
        // 이전 결과 UI 숨김 및 플래그 초기화 (resetGameState 또는 hideResultUIAndProceed에서 이미 호출)
        // hideResultUI() // 이미 resetGameState에서 호출됨

        // 쓰레기 아이템 제거는 hideResultUIAndProceed 또는 resetItemForRetry에서 처리
        // if (this.currentTrashItemGraphic) { ... }

        // 1. wasteRulesData 배열에서 랜덤으로 아이템 하나 선택
        const randomItemData = Phaser.Math.RND.pick(this.wasteRulesData);
        this.currentTrashItemData = randomItemData; // 현재 쓰레기 아이템 데이터 저장

        // 2. 쓰레기 아이템 사각형 오브젝트 생성
        const itemWidth = 40; const itemHeight = 40; const startY = this.panel.y - this.panel.height / 2 + 80;

        // --- 시작 칸(Lane) 설정 ---
        this.currentLaneIndex = 0; // 시작 칸 인덱스 (첫 번째 레인)
        const startX = this.laneCenterXPositions[this.currentLaneIndex];


        // add.rectangle()으로 사각형 오브젝트 생성
        const correctBinColor = this.binColors[randomItemData.correctBin];
        this.currentTrashItemGraphic = this.add.rectangle(startX, startY, itemWidth, itemHeight, correctBinColor);
        this.currentTrashItemGraphic.itemData = randomItemData;
        this.currentTrashItemGraphic.setActive(true);

        // --- 새로운 아이템 등장 시 메시지 업데이트 ---
        // 메시지 창이 항상 보이므로 여기서 메시지 내용만 업데이트합니다.
        if (this.messageTextObject && randomItemData.messageInitial) {
             this.messageTextObject.setText(randomItemData.messageInitial);
        }

        // --- 시간 타이머 리셋 ---
        this.itemTimeRemaining = this.itemTimeLimit; // <-- 아이템 등장 시 타이머 리셋


        this.isFalling = true; // 새로운 아이템 생성 후 낙하 시작
        // isProcessingResult 플래그는 hideResultUI에서 false로 이미 설정됨

        console.log('GameScene: 새 쓰레기 아이템 사각형 생성:', randomItemData.name, '시작 칸:', this.currentLaneIndex);
    }


    // --- 쓰레기 좌우 한 칸 이동 함수 ---
    moveLaneHorizontal(direction) {
        // ... 생략 ... (이전 답변 코드와 동일)
        if (!this.currentTrashItemGraphic || !this.isFalling) return;
        const numberOfBins = this.binKeys.length;
        let nextLaneIndex = this.currentLaneIndex + direction;
        if (nextLaneIndex < 0 || nextLaneIndex >= numberOfBins) { console.log('GameScene: 경계입니다.'); return; }
        this.currentLaneIndex = nextLaneIndex;
        const targetX = this.laneCenterXPositions[this.currentLaneIndex];
        this.currentTrashItemGraphic.x = targetX;
        console.log('GameScene: 칸 이동 ->', this.currentLaneIndex);
    }


    // --- 결과 상태 트리거 함수 (충돌, 바닥 낙하, 시간 초과 시 호출) ---
    // itemLaneIndex: 아이템이 최종 도달한 칸 인덱스 (null이면 바닥 낙하)
    // reason: 결과 발생 이유 ('collision', 'floor', 'timeout')
    triggerResultState(itemLaneIndex, reason = 'incorrect') { // 기본 이유를 'incorrect' 또는 'collision'으로 설정 가능
         console.log('GameScene: 결과 상태 트리거 시작! 이유:', reason);

        // 쓰레기 아이템이 없으면 무시
         if (!this.currentTrashItemGraphic) { console.log('GameScene: 처리할 아이템이 없습니다.'); return; }

         // isProcessingResult 플래그는 update에서 이미 true로 설정됨

        // 쓰레기 아이템 활성 상태 비활성화
         if(this.currentTrashItemGraphic) this.currentTrashItemGraphic.setActive(false);

        // 마지막으로 아이템이 도달했던 레인 인덱스 저장 (오답 시 다시 출제용)
        // 시간 초과의 경우 itemLaneIndex는 충돌 시 레인 인덱스
        this.lastLandedLaneIndex = (itemLaneIndex !== null) ? itemLaneIndex : this.currentLaneIndex;


        let isCorrect = false;
        const itemData = this.currentTrashItemData;
        let message = '';

        // --- 결과 이유에 따라 판정 및 메시지 설정 ---
        if (reason === 'collision') {
            // 쓰레기통 충돌
            let landedBinKey = null;
            if (itemLaneIndex !== null && itemLaneIndex >= 0 && itemLaneIndex < this.binKeys.length) {
                landedBinKey = this.binKeys[itemLaneIndex]; // 칸 인덱스로 쓰레기통 키 찾기
            }
            isCorrect = (landedBinKey !== null && itemData.correctBin === landedBinKey);
            message = isCorrect ? itemData.messageCorrect : itemData.messageIncorrect; // 정답/오답 메시지 사용

        } else if (reason === 'floor') {
            // 바닥 낙하 (무조건 오답)
            isCorrect = false;
            message = itemData.messageIncorrect; // 오답 메시지 사용

        } else if (reason === 'timeout') {
            // 시간 초과 (무조건 오답)
            isCorrect = false;
            message = this.messageTimeOut; // <-- 시간 초과 전용 메시지 사용
        }

        this.lastResultIsCorrect = isCorrect; // 판정 결과 저장 (showResultUI, hideAndProceed에서 사용)

        // 결과 UI 표시 함수 호출
        this.showResultUI(isCorrect, message); // <-- 판정 결과와 메시지 전달

        // --- 오답 시 체력 감소 및 하트 UI 업데이트 ---
        // (충돌 오답, 바닥 낙하, 시간 초과 모두 해당)
         if (!isCorrect) {
             console.log('GameScene: 오답 처리 플로우 (체력 감소 등).');
             this.health--; // 체력 감소
             this.updateHealthUI(); // 하트 UI 업데이트

             // --- 게임 오버 조건 판단 (체력이 0 이하가 되면) ---
             if (this.health <= 0) {
                 console.log('GameScene: 체력 0! 게임 오버.');
                 this.gameOver(); // 게임 오버 처리
                 // 게임 오버 시 다음 진행 막기 (hideAndProceed는 gameOver에서 호출되지 않도록 함)
                 return;
             }
         }

         // TODO: 게임 오버가 아닐 경우 다음 진행 (결과 버튼 클릭 대기)
         // showResultUI에서 입력 비활성화 -> 결과 버튼 클릭 시 hideAndProceed 호출
    }


    // --- 결과 UI (메시지, 버튼) 표시 함수 ---
    // isCorrect: 정답 여부 (버튼 색상 결정)
    // message: 메시지 창에 표시할 텍스트
    showResultUI(isCorrect, message) {
         console.log('GameScene: 결과 UI 표시 시작. 정답:', isCorrect, '메시지:', message);

         // 메시지 내용 설정 (전달받은 메시지 사용)
         if (this.messageTextObject) {
             this.messageTextObject.setText(message); // <-- 전달받은 메시지 사용
         }

         // 결과 버튼 텍스트 및 색상 설정
         const buttonText = isCorrect ? '다음 레벨' : '다시 하기';
         const buttonColor = isCorrect ? 0x00ff00 : 0xff0000; // 초록색 또는 빨간색 버튼

         if (this.resultButton) {
             this.resultButton.setFillStyle(buttonColor);
             this.resultButton.setVisible(true); // <-- 버튼 보이게
         }
         if (this.resultButtonText) {
             this.resultButtonText.setText(buttonText);
             this.resultButtonText.setVisible(true); // <-- 버튼 텍스트 보이게
         }
         // 메시지 배경 사각형과 텍스트는 항상 보이므로 여기서 별도 처리 안 함


         // 게임 플레이 입력 막기
         this.setGameInputEnabled(false);
    }

    // --- 결과 UI 숨김 및 다음 진행 함수 (결과 버튼 클릭 시 호출됨) ---
    hideResultUIAndProceed() {
         console.log('GameScene: 결과 UI 숨김 및 다음 진행.');

         // 게임 오버 상태가 아닐 때만 진행
         if (this.health <= 0) {
             console.log('GameScene: 이미 게임 오버 상태이므로 다음 진행하지 않음.');
             return;
         }

         // 결과 UI 숨김 (결과 버튼 숨김) 및 플래그 초기화
         this.hideResultUI();

         // 쓰레기 아이템 제거
         if (this.currentTrashItemGraphic) {
            this.currentTrashItemGraphic.destroy();
            this.currentTrashItemGraphic = null;
         }

         // 최종 판정 결과를 바탕으로 점수 업데이트 및 레벨 증가
         this.handleResult(this.lastResultIsCorrect); // 점수 업데이트 및 레벨 증가

         // 게임 플레이 입력 다시 활성화
         this.setGameInputEnabled(true);

         // 다음 단계 결정 (게임 오버가 아닐 때만 - 위에 체크 추가)
         if (this.lastResultIsCorrect) {
             // 정답: 잠시 후 다음 쓰레기 아이템 생성
             this.time.delayedCall(200, this.spawnWasteItem, [], this);
         } else {
             // 오답 또는 시간 초과: 잠시 후 같은 쓰레기 아이템 다시 출제
             this.time.delayedCall(200, this.resetItemForRetry, [], this);
         }
    }

     // --- 결과 UI 오브젝트 숨김 (결과 버튼만 숨김) ---
     hideResultUI() {
         console.log('GameScene: 결과 UI 숨김.');
         // 메시지 내용은 spawnWasteItem 등에서 업데이트하므로 여기서 초기화/숨김 안 함

         if (this.resultButton) { this.resultButton.setVisible(false); }
         if (this.resultButtonText) { this.resultButtonText.setVisible(false); }
         // 메시지 배경과 텍스트는 항상 보이도록 create에서 설정됨.

         this.isProcessingResult = false; // 결과 처리 플래그 초기화
     }

     // --- 게임 플레이 입력 활성화/비활성화 함수 ---
     setGameInputEnabled(enabled) {
          console.log('GameScene: 게임 입력 상태 변경 -', enabled ? '활성화' : '비활성화');
          if (this.input && this.input.keyboard) { this.input.keyboard.enabled = enabled; }
          if (this.commandButtons.left) {
              this.commandButtons.left.setInteractive(enabled);
              this.commandButtons.down.setInteractive(enabled);
              this.commandButtons.right.setInteractive(enabled);
          }
     }

    // --- 판정 결과 처리 함수 (점수 업데이트 및 레벨 증가) ---
    // 이 함수는 hideResultUIAndProceed 함수에서 호출됩니다.
    handleResult(isCorrect) {
        console.log('GameScene: 최종 판정 결과 처리 시작! 정답:', isCorrect);
        // 체력 감소는 triggerResultState에서 이미 처리

        if (isCorrect) {
            // --- 정답 처리 ---
            this.score += 100; // 점수 증가
            if (this.scoreText) { this.scoreText.setText('점수: ' + this.score); }
            console.log('GameScene: 점수 업데이트 완료.');

            // --- 레벨 증가 ---
            this.level++; // <-- 레벨 증가
            if (this.levelText) { this.levelText.setText('레벨 ' + this.level); } // <-- 레벨 텍스트 업데이트
            console.log('GameScene: 레벨 증가 ->', this.level);

            // TODO: 정답 시각/청각 효과
        } else {
            // --- 오답/실패 처리 ---
            // 체력 감소 및 하트 UI 업데이트는 triggerResultState에서 이미 처리됨
            console.log('GameScene: 오답 처리 완료 (체력 감소됨).');
            // TODO: 오답 시각/청각 효과
        }
    }

    // --- 체력 UI (하트) 업데이트 함수 ---
    updateHealthUI() {
        console.log('GameScene: 체력 UI 업데이트. 현재 체력:', this.health);
        for (let i = 0; i < this.heartGraphics.length; i++) {
            const heartIndex = this.heartGraphics.length - 1 - i;
            if (this.heartGraphics[heartIndex] && this.heartGraphics[heartIndex].setFillStyle) {
                if (i < this.health) {
                    this.heartGraphics[heartIndex].setFillStyle(0xff0000); // 빨간색 (꽉 찬 하트)
                } else {
                    this.heartGraphics[heartIndex].setFillStyle(0x808080); // 회색 (빈 하트)
                }
            }
        }
    }

    // --- 오답 시 동일한 아이템으로 다시 출제 ---
    resetItemForRetry() {
        console.log('GameScene: 같은 아이템으로 다시 출제.');
        this.hideResultUI(); // isProcessingResult = false 됨

        // 쓰레기 아이템 다시 생성 (데이터는 this.currentTrashItemData 사용)
        // 위치는 마지막 레인으로 설정
        const itemWidth = 40; const itemHeight = 40; const startY = this.panel.y - this.panel.height / 2 + 80;
        this.currentLaneIndex = this.lastLandedLaneIndex; // 마지막 레인에서 시작
        const startX = this.laneCenterXPositions[this.currentLaneIndex];
        const correctBinColor = this.binColors[this.currentTrashItemData.correctBin];
        this.currentTrashItemGraphic = this.add.rectangle(startX, startY, itemWidth, itemHeight, correctBinColor);
        this.currentTrashItemGraphic.itemData = this.currentTrashItemData;
        this.currentTrashItemGraphic.setActive(true);

        this.isFalling = true;

        // 메시지 내용 업데이트 (초기 메시지 다시 표시)
        if (this.messageTextObject && this.currentTrashItemData.messageInitial) {
            this.messageTextObject.setText(this.currentTrashItemData.messageInitial);
        }

        // --- 시간 타이머 리셋 ---
        this.itemTimeRemaining = this.itemTimeLimit; // <-- 아이템 다시 출제 시 타이머 리셋


        console.log('GameScene: 동일 아이템 사각형 다시 생성:', this.currentTrashItemData.name, '시작 칸:', this.currentLaneIndex);
    }

    // --- 게임 오버 처리 함수 ---
    gameOver() {
        console.log('GameScene: Game Over!');
        // 게임 오버 메시지 표시 (메시지 창은 항상 보이므로 내용만 변경)
        if (this.messageTextObject) {
             this.messageTextObject.setText('게임 오버!\n다음에 다시 도전하세요!');
             // 결과 버튼 숨김 (더 이상 다시 하거나 다음 레벨 없음)
             if (this.resultButton) this.resultButton.setVisible(false);
             if (this.resultButtonText) this.resultButtonText.setVisible(false);
        }

        // 게임 플레이 입력 비활성화
        this.setGameInputEnabled(false);

        // GameScene 상태를 리셋합니다. (변수 초기화, UI 초기 상태 업데이트)
        // resetGameState 안에서 spawnWasteItem 호출하여 새 게임 준비
        // this.resetGameState(); // <--- 이 함수 호출은 3초 지연 후 BootScene에서 GameScene 시작 시 create의 마지막에서 처리


        // 일정 시간 대기 후 시작 화면(BootScene)으로 전환합니다.
        this.time.delayedCall(3000, () => { // 3초 대기
             console.log('GameScene: 3초 지연 후 BootScene 시작 시도.');
             // GameScene을 멈춘 후 BootScene으로 전환합니다.
             this.scene.stop('GameScene'); // <-- 현재 GameScene 멈추기
             this.scene.start('BootScene'); // <-- BootScene으로 전환
        }, [], this);
    }
}


    // TODO: 라운드/레벨 클리어 처리 함수 (다음 라운드 준비 등)
    // levelComplete() { console.log('Level Complete!'); this.scene.start('NextLevelScene'); }


// --- 게임 설정 (config) ---
// 이 부분이 모든 클래스 정의보다 아래에 위치해야 합니다.
const config = {
    type: Phaser.AUTO, // Canvas 또는 WebGL 자동 선택
    width: 480, // 게임 내부 해상도 (설계 기준)
    height: 640, // 게임 내부 해상도 (설계 기준)
    parent: 'game-container', // 게임 Canvas가 삽입될 HTML 요소의 ID
    scale: {
        mode: Phaser.Scale.FIT, // 부모 컨테이너에 맞춰 비율 유지하며 스케일링
        autoCenter: Phaser.Scale.CENTER_BOTH // 화면 중앙에 배치
    },
    // 사용할 씬들을 배열로 등록 (순서 중요: BootScene -> GameScene)
    scene: [
        BootScene, // 게임 시작 시 처음 실행될 씬
        GameScene  // BootScene에서 시작 버튼 클릭 시 전환될 씬
    ]
};

// Phaser 게임 인스턴스 생성
// 이 코드가 실행되면서 config에 따라 게임이 초기화되고 첫 번째 씬(BootScene)이 시작됩니다.
const game = new Phaser.Game(config);

// --- 이 아래에는 추가적인 게임 관련 코드가 오지 않도록 합니다 ---

// js/game.js 파일 끝

