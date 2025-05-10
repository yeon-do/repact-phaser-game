// js/game.js 파일 시작

// 임의의 게임 시작 화면 구성을 위한 코드(실제 사용 X)
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
        this.cameras.main.setBackgroundColor('#3cbb89');

        // 게임 제목 텍스트
        const titleStyle = { font: '48px Verdana', fill: '#ffffff' };
        this.add.text(width / 2, height / 3, '분리수거 게임', titleStyle).setOrigin(0.5);

        // 게임 시작 버튼 텍스트 (클릭 가능한 텍스트)
        const startButtonStyle = { font: '32px Verdana', fill: '#ffff00', backgroundColor: '#333333', padding: { x: 20, y: 10 } };
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

// --- 백엔드 DB에서 데이터를 받아오는 실제 비동기 함수 (fetch 사용) ---
// TODO: 이 URL을 실제 백엔드 API 엔드포인트 URL로 변경하세요!
const WASTE_RULES_API_URL = 'YOUR_BACKEND_API_ENDPOINT_HERE'; // 예: 'https://your-backend.com/api/waste-rules'

async function fetchWasteRulesFromBackend() {
    console.log(`Workspaceing waste rules from ${WASTE_RULES_API_URL}...`);
    try {
        const response = await fetch(WASTE_RULES_API_URL);

        // HTTP 상태 코드가 200-299 범위가 아니면 오류로 간주
        if (!response.ok) {
            console.error(`HTTP error! status: ${response.status}`);
            throw new Error(`Failed to fetch data: HTTP status ${response.status}`);
        }

        // 응답 본문을 JSON으로 파싱
        const data = await response.json();
        console.log('Waste rules data fetched successfully.');
        // console.log('Fetched data:', data); // Optional: 받아온 데이터 로그 출력

        // 백엔드가 약속된 데이터 구조의 배열을 반환한다고 가정
        // 반환된 데이터가 예상과 다를 경우 여기서 추가적인 유효성 검사 필요
        if (!Array.isArray(data) || data.length === 0) {
             console.warn('Fetched data is not an array or is empty.');
             // 빈 배열 또는 유효하지 않은 데이터인 경우에도 오류 발생 또는 빈 배열 반환 처리 가능
             // throw new Error('Fetched data is empty or invalid.');
             return []; // 빈 배열 반환하여 게임은 시작하되 아이템이 없게 처리
         }


        // 데이터 유효성 검사 (예: 각 아이템에 필요한 필드가 있는지)
         const requiredFields = ['id', 'name', 'nickname', 'correctBin', 'specificBin', 'imageKey', 'imagePath'];
         const isValid = data.every(item => requiredFields.every(field => item.hasOwnProperty(field)));

         if (!isValid) {
             console.error('Fetched data is in an unexpected format.');
             throw new Error('Fetched data format is invalid.');
         }


        return data; // 성공적으로 데이터를 받아와 반환

    } catch (error) {
        console.error('Error fetching waste rules:', error);
        // GameScene.create에서 오류를 잡을 수 있도록 오류를 다시 던집니다.
        throw error;
    }
}


// 1라운드 게임 초안
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

        // wasteRulesData는 생성자에서 초기화하지 않고, create에서 비동기로 로드합니다.
        this.wasteRulesData = null; // <-- 데이터 로드 전에는 null

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

        // 시간 초과 시 사용할 메시지 (변경 없음)
        this.messageTimeOut = '시간초과야 다시해볼까?';


        // --- 쓰레기통 키, 색상, 그리고 각 칸(Lane)의 중심 X 좌표 ---
        // 쓰레기통 자체의 종류와 순서는 현재 하드코딩되어 있습니다.
        // 만약 이것도 백엔드에서 받아와야 한다면 별도의 로딩 로직이 필요합니다.
        this.binKeys = ['bin_general', 'bin_paper', 'bin_pack', 'bin_plastic', 'bin_can'];
        this.binColors = { // 사각형 아이템 색상 지정에 사용 (이미지 사용 시에는 불필요)
            'bin_general': 0x808080, 'bin_paper': 0x0000ff, 'bin_pack': 0xff0000, 'bin_plastic': 0x008000, 'bin_can': 0xffff00
        };

        // 쓰레기통 위치 정보는 create에서 UI 배치 후 계산
        this.laneCenterXPositions = [];
        this.binTopLabelYPositions = [];

        // 쓰레기통 이미지 오브젝트 배열 (여기에 실제 Phaser Image 오브젝트를 저장)
        this.binImages = [];
        // 현재 '열린' 상태로 표시된 쓰레기통의 레인 인덱스 (-1은 없음)
        this.currentOpenBinIndex = -1;

        this.binGraphics = []; // 판정용 쓰레기통 영역 정보

        this.commandButtons = {}; // 커맨드 버튼 오브젝트

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


    //UI 이미지 가져올 때 사용
    preload() {
        console.log('GameScene: preload 실행.');
        // --- 기본 UI 에셋 로드 ---
        this.load.image('panel_img', 'assets/images/game_board.png'); // 게임 패널 이미지
        this.load.image('message_area_img', 'assets/images/message_board.png'); // 메시지 영역 이미지
        this.load.image('heart_full_img', 'assets/images/heart_full.png'); // 꽉 찬 하트 이미지
        this.load.image('heart_empty_img', 'assets/images/heart_empty.png'); // 빈 하트 이미지

        // --- 커맨드 버튼 이미지 로드 ---
        this.load.image('button_left_img', 'assets/images/button_left.png');
        this.load.image('button_down_img', 'assets/images/button_down.png');
        this.load.image('button_right_img', 'assets/images/button_right.png');


        // --- 쓰레기통 이미지 로드 (닫힌 상태 및 열린 상태) ---
        this.binKeys.forEach(key => {
            // 닫힌 상태 이미지 로드
            const binImageKey = `${key}_img`; // 예: bin_general_img
            const binImagePath = `assets/images/${key}.png`; // 예: assets/images/bin_general.png
            this.load.image(binImageKey, binImagePath);

            // 열린 상태 이미지 로드
            const binOpenImageKey = `${key}_open_img`; // 예: bin_general_open_img
            const binOpenImagePath = `assets/images/${key}_open.png`; // 예: assets/images/bin_general_open.png
            this.load.image(binOpenImageKey, binOpenImagePath);
        });

        // TODO: wasteRulesData 로드 후, 해당 데이터에 있는 imageKey/imagePath를 사용하여
        // 실제 쓰레기 아이템 이미지를 로드해야 합니다.
        // 이 로딩은 preload에서 비동기로 처리하거나, create에서 데이터 로드 후 수행할 수 있습니다.
        // 지금은 아이템 이미지를 사용하지 않으므로 여기서 로드하지 않습니다.

    }


    // 실제 화면 구성을 위한 함수 (화면 위 요소 배치, 데이터 로딩 대기, 게임 초기화)
    async create() { // create 함수를 비동기(async)로 만듭니다.
        console.log('GameScene: create 실행.');

        const { width, height } = this.sys.game.canvas;

        // --- 배경색 설정 ---
        this.cameras.main.setBackgroundColor('#3cbb89');

        // --- 중앙 큰 패널 배치 ---
        this.panel.width = width * 0.8; this.panel.height = height * 0.6; this.panel.x = width / 2; this.panel.y = height * 0.4;
        //this.add.graphics().fillStyle(0x333333).fillRect(this.panel.x - this.panel.width / 2, this.panel.y - this.panel.height / 2, this.panel.width, this.panel.height);
        this.add.image(this.panel.x, this.panel.y, 'panel_img')
            .setDisplaySize(this.panel.width, this.panel.height) // <-- 패널 크기에 맞춰 표시
            .setOrigin(0.5); // <-- 중앙 정렬

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

        // --- UI 요소 배치: 하트 (이미지 사용) ---
        const heartsPanelY = this.panel.y - this.panel.height / 2 + 65; const heartsPanelRightX = this.panel.x + this.panel.width / 2 - 25;
        const heartSize = 22; const heartSpacing = 35;
        this.heartGraphics = []; // 배열 초기화
         // 하트를 오른쪽부터 배치하기 위해 역순으로 생성
        for (let i = 0; i < 3; i++) {
             const heartX = heartsPanelRightX - heartSpacing * i; // 오른쪽에서부터 i번째 하트 X 위치
            // ↓↓↓ 하트 이미지 추가 (꽉 찬 하트 이미지 사용) ↓↓↓
            // updateHealthUI 함수에서 이 이미지들의 가시성이나 프레임을 변경하여 체력 표시
            const heartImg = this.add.image(heartX, heartsPanelY, 'heart_full_img') // <-- 꽉 찬 하트 이미지 키 사용
                                         .setDisplaySize(heartSize, heartSize) // <-- 하트 크기 설정
                                         .setOrigin(0.5); // <-- 중앙 정렬
            this.heartGraphics.push(heartImg); // 배열에 저장
            // ↑↑↑ 하트 이미지 추가 ↑↑↑
        }
        // 체력 UI 업데이트는 resetGameState에서 호출 (데이터 로드 후)

        // --- 쓰레기통 이미지 배치 (이미지 사용) ---
        // 쓰레기통 배치는 wasteRulesData에 의존하지 않으므로 데이터 로드 전에 수행 가능
        const binAreaY = this.panel.y + this.panel.height / 2 - 32; const binWidth = 65; const binHeight = 45; const numberOfBins = this.binKeys.length; const binAreaPaddingX = 50;
        const binAreaWidth = this.panel.width - binAreaPaddingX * 2;
        const binSpacing = (numberOfBins > 1) ? binAreaWidth / (numberOfBins - 1) : 0;
        const binAreaStartX = (this.panel.x - this.panel.width / 2) + binAreaPaddingX;
        const labelYOffset = 5;
        const binTopLabelBottomY = binAreaY - binHeight / 2 - labelYOffset;

        // 배열 초기화 (create가 다시 실행될 때마다 비워져야 함)
        this.binGraphics = [];
        this.laneCenterXPositions = [];
        this.binTopLabelYPositions = [];
        this.binImages = []; // <-- 쓰레기통 이미지 오브젝트 배열도 여기서 초기화

        this.binKeys.forEach((key, index) => {
            let binX;
            if (numberOfBins === 1) { binX = this.panel.x; } else { binX = binAreaStartX + (binSpacing * index); }

            // ↓↓↓ 쓰레기통 이미지 추가 (닫힌 상태 이미지 사용) ↓↓↓
            const binImageKey = `${key}_img`; // 예: bin_general_img
            const binImg = this.add.image(binX, binAreaY, binImageKey) // <-- 닫힌 상태 이미지 키 사용
                 .setDisplaySize(binWidth, binHeight)
                 .setOrigin(0.5);

            this.binImages.push(binImg); // <-- 생성된 이미지 오브젝트를 배열에 저장
            // ↑↑↑ 쓰레기통 이미지 추가 ↑↑↑


            // 쓰레기통 (칸)의 중심 X 좌표 저장 (변함 없음)
            this.laneCenterXPositions.push(binX);
            // 쓰레기통 라벨 텍스트의 하단 Y 좌표 저장 (변함 없음)
            this.binTopLabelYPositions[index] = binTopLabelBottomY;

            // 쓰레기 정보와 영역 기준 저장 (판정용 - 변함 없음)
             this.binGraphics.push({ key: key, x: binX, y: binAreaY, width: binWidth, height: binHeight, left: binX - binWidth / 2, right: binX + binWidth / 2 });

            // 쓰레기통 이름 텍스트 (위치 조정 - 변함 없음)
             const nameStyle = { font: '14px Arial', fill: 0xFFFFFF, align: 'center' }; // 폰트는 나중에 변경 가능
             this.add.text(binX, binTopLabelBottomY, key.replace('bin_', '').toUpperCase(), nameStyle).setOrigin(0.5, 1);
        });

        // --- 메시지/말풍선 영역 이미지 배치 (이미지 사용) ---
        this.messageArea.width = width * 0.85; this.messageArea.height = 70; this.messageArea.x = width / 2;
        this.messageArea.y = this.panel.y + this.panel.height / 2 + this.messageArea.height / 2 + 20;

        // this.messageAreaGraphic = this.add.graphics().fillStyle(0xffffff).fillRect(...).setVisible(true); // <-- 이 줄은 제거
        // ↓↓↓ 메시지 영역 이미지 추가 ↓↓↓
        this.messageAreaGraphic = this.add.image(this.messageArea.x, this.messageArea.y, 'message_area_img') // <-- 메시지 영역 이미지 키 사용
            .setDisplaySize(this.messageArea.width, this.messageArea.height) // <-- 메시지 영역 크기에 맞춰 표시
            .setOrigin(0.5) // <-- 중앙 정렬
            .setVisible(true); // <-- 항상 보이게
        // ↑↑↑ 메시지 영역 이미지 추가 ↑↑↑

        const messageStyle = { font: '16px Arial', fill: '#000000', align: 'center', wordWrap: { width: this.messageArea.width - 20 } };
        this.messageTextObject = this.add.text(this.messageArea.x, this.messageArea.y, '', messageStyle)
            .setOrigin(0.5).setDepth(1).setVisible(true); // <-- 항상 보이게

        // --- 커맨드 버튼 이미지 배치 (이미지 사용) ---
        const commandButtonY = this.messageArea.y + this.messageArea.height / 2 + 50; const buttonSize = 70; const buttonSpacing = 95;
        this.cursors = this.input.keyboard.createCursorKeys(); this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

        // 왼쪽 버튼 이미지
        // this.commandButtons.left = this.add.rectangle(...).setInteractive(); // <-- 이 줄은 제거
        // ↓↓↓ 왼쪽 버튼 이미지 추가 ↓↓↓
        this.commandButtons.left = this.add.image(width / 2 - buttonSpacing, commandButtonY, 'button_left_img') // <-- 왼쪽 버튼 이미지 키
            .setDisplaySize(buttonSize, buttonSize) // <-- 버튼 크기
            .setOrigin(0.5) // <-- 중앙 정렬
            .setInteractive(); // <-- 인터랙티브 설정 유지
        // ↑↑↑ 왼쪽 버튼 이미지 추가 ↑↑↑
        // 왼쪽 버튼 텍스트 (위치 조정 필요)
        //this.add.text(width / 2 - buttonSpacing, commandButtonY, '←', { font: '30px Arial', fill: '#ffffff' }).setOrigin(0.5);
        // 왼쪽 버튼 리스너 (변함 없음)
        this.commandButtons.left.on('pointerdown', () => { this.moveLeft = true; }); this.commandButtons.left.on('pointerup', () => { this.moveLeft = false; }); this.commandButtons.left.on('pointerout', () => { this.moveLeft = false; });

        // 아래쪽 버튼 이미지
        // this.commandButtons.down = this.add.rectangle(...).setInteractive(); // <-- 이 줄은 제거
        // ↓↓↓ 아래 버튼 이미지 추가 ↓↓↓
        this.commandButtons.down = this.add.image(width / 2, commandButtonY, 'button_down_img') // <-- 아래 버튼 이미지 키
             .setDisplaySize(buttonSize, buttonSize)
             .setOrigin(0.5)
             .setInteractive();
        // ↑↑↑ 아래 버튼 이미지 추가 ↑↑↑
        // 아래쪽 버튼 텍스트 (위치 조정 필요)
        //this.add.text(width / 2, commandButtonY, '↓', { font: '30px Arial', fill: '#ffffff' }).setOrigin(0.5);
        // 아래 버튼 리스너 (변함 없음)
        this.commandButtons.down.on('pointerdown', () => { this.moveDownFast = true; });
        this.commandButtons.down.on('pointerup', () => { this.moveDownFast = false; });
        this.commandButtons.down.on('pointerout', () => { this.moveDownFast = false; });


        // 오른쪽 버튼 이미지
        // this.commandButtons.right = this.add.rectangle(...).setInteractive(); // <-- 이 줄은 제거
        // ↓↓↓ 오른쪽 버튼 이미지 추가 ↓↓↓
        this.commandButtons.right = this.add.image(width / 2 + buttonSpacing, commandButtonY, 'button_right_img') // <-- 오른쪽 버튼 이미지 키
             .setDisplaySize(buttonSize, buttonSize)
             .setOrigin(0.5)
             .setInteractive();
        // ↑↑↑ 오른쪽 버튼 이미지 추가 ↑↑↑
        // 오른쪽 버튼 텍스트 (위치 조정 필요)
        //this.add.text(width / 2 + buttonSpacing, commandButtonY, '→', { font: '30px Arial', fill: '#ffffff' }).setOrigin(0.5);
        // 오른쪽 버튼 리스너 (변함 없음)
        this.commandButtons.right.on('pointerdown', () => { this.moveRight = true; }); this.commandButtons.right.on('pointerup', () => { this.moveRight = false; }); this.commandButtons.right.on('pointerout', () => { this.moveRight = false; });


        // --- 결과 버튼들 ---
        const resultButtonWidth = 80; const resultButtonHeight = 40; const resultButtonPaddingX = 10; const resultButtonPaddingY = 10;
        const resultButtonX = (this.messageArea.x + this.messageArea.width / 2) - resultButtonWidth / 2 - resultButtonPaddingX;
        const resultButtonY = (this.messageArea.y + this.messageArea.height / 2) - resultButtonHeight / 2 - resultButtonPaddingY;
        this.resultButton = this.add.rectangle(resultButtonX, resultButtonY, resultButtonWidth, resultButtonHeight, 0x00ff00).setInteractive().setVisible(false); // <-- 버튼은 초기 숨김
        const resultButtonStyle = { font: '18px Arial', fill: '#ffffff', align: 'center' };
        this.resultButtonText = this.add.text(resultButtonX, resultButtonY, '', resultButtonStyle).setOrigin(0.5).setDepth(1).setVisible(false); // <-- 버튼 텍스트 초기 숨김
        this.resultButton.on('pointerdown', () => { this.hideResultUIAndProceed(); }, this);


        // --- 게임 데이터 로딩 시작 (백엔드 API 호출) ---
        console.log('GameScene: 게임 데이터 로딩 시작...');
        this.setGameInputEnabled(false); // 데이터 로딩 중 입력 비활성화
        if (this.messageTextObject) {
             this.messageTextObject.setText('게임 데이터를 불러오는 중...'); // 로딩 메시지 표시
        }

        try {
            // 실제 백엔드 API 호출 및 데이터 로드 완료까지 대기
            this.wasteRulesData = await fetchWasteRulesFromBackend();
            console.log('GameScene: 게임 데이터 로딩 성공!');

             // TODO: 여기서 this.wasteRulesData에 있는 imageKey/imagePath를 사용하여
             // 실제 쓰레기 아이템 이미지들을 로드하는 비동기 작업 추가 가능
             // await this.loadItemImages(this.wasteRulesData); // 예시 함수 호출

            // --- 데이터 로드 완료: 게임 상태 초기화 및 첫 아이템 생성 ---
            this.resetGameState(); // 데이터 로드 완료 후에 게임 초기화 진행

        } catch (error) {
            console.error('GameScene: 게임 데이터 로딩 실패!', error);
            // 데이터 로딩 실패 시 처리 (예: 오류 메시지 표시, 다시 시도 버튼, 시작 화면으로 돌아가기 등)
            if (this.messageTextObject) {
                this.messageTextObject.setText('데이터 로드 실패!\n게임을 다시 시작해주세요.');
            }
            // 입력 비활성화 상태 유지 (게임 진행 불가)
             // TODO: retry 버튼 등을 표시하여 복구 가능하도록 처리
        }


        console.log('GameScene: create 완료 (비동기 로딩 후 게임 시작).');
    }

     // TODO: 아이템 이미지들을 로드하는 비동기 함수 (데이터 로드 후 create에서 호출)
     /*
     async loadItemImages(wasteRulesData) {
         console.log('GameScene: 아이템 이미지 로딩 시작...');
         const loadPromises = wasteRulesData.map(item => {
             // 이미 로드된 에셋은 다시 로드하지 않도록 체크 로직 추가 가능
             if (!this.textures.exists(item.imageKey)) {
                  return new Promise((resolve, reject) => {
                      this.load.image(item.imageKey, item.imagePath);
                      // 로딩 완료/실패 시 Promise resolve/reject
                      this.load.once(`filecomplete-image-${item.imageKey}`, () => {
                          console.log(`Image loaded: ${item.imageKey}`);
                          resolve();
                      });
                       this.load.once(`fileerror-image-${item.imageKey}`, (fileKey, file, error) => {
                            console.error(`Failed to load image: ${fileKey}`, error);
                            // reject(error); // 오류 발생 시 전체 로딩 중단 또는 경고 처리
                            resolve(); // 이미지 하나 실패해도 계속 진행하려면 resolve
                       });
                  });
             }
             return Promise.resolve(); // 이미 로드된 경우 즉시 해결
         });

         // 모든 이미지 로드 완료를 기다립니다.
         this.load.start(); // 로딩 매니저 시작 (once 리스너 등록 후 호출)
         await Promise.all(loadPromises); // 모든 이미지 파일의 로딩 완료를 기다림
         console.log('GameScene: 아이템 이미지 로딩 완료.');
     }
     */


    // 시간 타이머, 아이템 낙하, 아이템 정답 판별 진행 함수
    update(time, delta) {
        // wasteRulesData가 로드되지 않았거나 아이템이 없으면 업데이트 로직을 실행하지 않습니다.
        if (!this.wasteRulesData || this.wasteRulesData.length === 0 || !this.currentTrashItemGraphic) {
             // console.log('GameScene: 데이터/아이템 로드 대기 중...');
             return;
         }

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
            const collisionY = labelBottomY - 17; // 충돌 판정 Y 위치 (조정 필요할 수 있음)
            const itemBottomY = this.currentTrashItemGraphic.y + (this.currentTrashItemGraphic.height * this.currentTrashItemGraphic.scaleY / 2); // 아이템 하단 Y 위치

            if (itemBottomY >= collisionY && !this.isProcessingResult) {
                console.log('GameScene: 쓰레기 라벨 근처 높이에 도달! 결과 처리 시작.');
                this.isFalling = false;
                this.isProcessingResult = true;
                // 충돌 높이에 정확히 맞추기
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


    updateBinVisuals(newLaneIndex) {
        // console.log('GameScene: 쓰레기통 이미지 업데이트 - 새 레인:', newLaneIndex);

        // 이전 열린 쓰레기통이 현재 이동한 레인과 다르다면
        if (this.currentOpenBinIndex !== -1 && this.currentOpenBinIndex !== newLaneIndex) {
            // 이전 열린 쓰레기통을 찾아서 닫힌 상태 이미지로 변경
            const prevBinImg = this.binImages[this.currentOpenBinIndex];
            const prevBinKey = this.binKeys[this.currentOpenBinIndex]; // 이전 쓰레기통 키 (예: bin_general)
            if (prevBinImg && prevBinImg.setTexture) {
                 prevBinImg.setTexture(`${prevBinKey}_img`); // <-- 닫힌 상태 이미지 키 사용
                 // console.log(`GameScene: 이전 쓰레기통 닫음 - 레인: ${this.currentOpenBinIndex}`);
            }
        }

        // 새로 아이템이 위치한 레인의 쓰레기통을 열린 상태 이미지로 변경
        if (newLaneIndex !== -1 && newLaneIndex >= 0 && newLaneIndex < this.binImages.length) {
            const currentBinImg = this.binImages[newLaneIndex];
            const currentBinKey = this.binKeys[newLaneIndex]; // 현재 쓰레기통 키 (예: bin_paper)
            if (currentBinImg && currentBinImg.setTexture) {
                 currentBinImg.setTexture(`${currentBinKey}_open_img`); // <-- 열린 상태 이미지 키 사용
                 // console.log(`GameScene: 현재 쓰레기통 열림 - 레인: ${newLaneIndex}`);
            }
        }

        // 현재 열린 쓰레기통 인덱스 업데이트
        this.currentOpenBinIndex = newLaneIndex;
    }


    // --- 쓰레기 아이템을 랜덤으로 선택하고 화면에 사각형으로 표시하는 함수 ---
     // 이 함수는 wasteRulesData가 로드된 후에만 호출되어야 합니다.
    spawnWasteItem () {
        console.log('GameScene: 새 쓰레기 아이템 생성 시작.');

        // wasteRulesData가 아직 없거나 비어 있다면 아이템 생성 중지
         if (!this.wasteRulesData || this.wasteRulesData.length === 0) {
             console.log('GameScene: wasteRulesData가 로드되지 않았거나 비어 있습니다. 아이템을 생성할 수 없습니다.');
             // TODO: 데이터 로드 실패 처리 로직으로 연결 또는 게임 오버 처리
             if (this.messageTextObject) {
                 this.messageTextObject.setText('게임 아이템 데이터 오류!\n게임을 다시 시작해주세요.');
             }
             this.setGameInputEnabled(false); // 게임 진행 불가
             return;
         }

        // 이전 결과 UI 숨김 및 플래그 초기화 (resetGameState 또는 hideResultUIAndProceed에서 이미 호출)
        // hideResultUI() // 이미 resetGameState에서 호출됨

        // 쓰레기 아이템 제거는 hideResultUIAndProceed 또는 resetItemForRetry에서 처리
        // if (this.currentTrashItemGraphic) { ... }

        // 1. wasteRulesData 배열에서 랜덤으로 아이템 하나 선택
        const randomItemData = Phaser.Math.RND.pick(this.wasteRulesData);
        this.currentTrashItemData = randomItemData; // 현재 쓰레기 아이템 데이터 저장

        // 2. 쓰레기 아이템 오브젝트 생성 (현재는 사각형, 나중에 이미지 사용)
        const itemWidth = 40; const itemHeight = 40; const startY = this.panel.y - this.panel.height / 2 + 80;

        // --- 시작 칸(Lane) 설정 ---
        this.currentLaneIndex = 0; // 시작 칸 인덱스 (첫 번째 레인)
        const startX = this.laneCenterXPositions[this.currentLaneIndex];

        // add.rectangle()으로 사각형 오브젝트 생성 (임시)
        const correctBinColor = this.binColors[randomItemData.correctBin];
        this.currentTrashItemGraphic = this.add.rectangle(startX, startY, itemWidth, itemHeight, correctBinColor);
        this.currentTrashItemGraphic.itemData = randomItemData; // 아이템 데이터 연결
        this.currentTrashItemGraphic.setActive(true);

        // TODO: 이미지 사용 시에는 이 부분을 변경
        /*
        this.currentTrashItemGraphic = this.add.image(startX, startY, randomItemData.imageKey);
        this.currentTrashItemGraphic.setDisplaySize(itemWidth, itemHeight); // 이미지 크기 조절 필요
        this.currentTrashItemGraphic.setOrigin(0.5);
        this.currentTrashItemGraphic.itemData = randomItemData;
        this.currentTrashItemGraphic.setActive(true);
        */


        // --- 새로운 아이템 등장 시 메시지 업데이트 (nickname 사용) ---
        // 메시지 창이 항상 보이므로 여기서 메시지 내용만 업데이트합니다.
        if (this.messageTextObject && randomItemData.nickname) {
            this.messageTextObject.setText(`'${randomItemData.nickname}' 쓰레기가 나타났어.\n어디에 분리배출 해야 할까?`);
        }


        // --- 시간 타이머 리셋 ---
        this.itemTimeRemaining = this.itemTimeLimit; // <-- 아이템 등장 시 타이머 리셋


        this.isFalling = true; // 새로운 아이템 생성 후 낙하 시작
        // isProcessingResult 플래그는 hideResultUI에서 false로 이미 설정됨

        // --- ↓↓↓ 아이템 등장 시 시작 레인의 쓰레기통 열린 상태로 변경 ↓↓↓
        this.updateBinVisuals(this.currentLaneIndex);

        console.log('GameScene: 새 쓰레기 아이템 사각형 생성:', randomItemData.name, '시작 칸:', this.currentLaneIndex);
    }


    // --- 쓰레기 좌우 한 칸 이동 함수 ---
    moveLaneHorizontal(direction) {
        if (!this.currentTrashItemGraphic || !this.isFalling || this.isProcessingResult) return; // 결과 처리 중에는 이동 불가

        const numberOfBins = this.binKeys.length;
        let nextLaneIndex = this.currentLaneIndex + direction;
        if (nextLaneIndex < 0 || nextLaneIndex >= numberOfBins) { console.log('GameScene: 경계입니다.'); return; }
        this.currentLaneIndex = nextLaneIndex;
        const targetX = this.laneCenterXPositions[this.currentLaneIndex];
        this.currentTrashItemGraphic.x = targetX;

        // --- ↓↓↓ 레인 이동 시 쓰레기통 이미지 업데이트 ↓↓↓
        this.updateBinVisuals(this.currentLaneIndex);


        console.log('GameScene: 칸 이동 ->', this.currentLaneIndex);
    }


    // --- 결과 상태 트리거 함수 (충돌, 바닥 낙하, 시간 초과 시 호출) ---
    // itemLaneIndex: 아이템이 최종 도달한 칸 인덱스 (null이면 바닥 낙하)
    // reason: 결과 발생 이유 ('collision', 'floor', 'timeout')
    triggerResultState(itemLaneIndex, reason = 'incorrect') { // 기본 이유를 'incorrect' 또는 'collision'으로 설정 가능
         console.log('GameScene: 결과 상태 트리거 시작! 이유:', reason);

        // 쓰레기 아이템이나 데이터가 없으면 무시 (데이터 로드 실패 등)
         if (!this.currentTrashItemGraphic || !this.currentTrashItemData) { console.log('GameScene: 처리할 아이템 또는 데이터가 없습니다.'); return; }

        // isProcessingResult 플래그는 update에서 이미 true로 설정됨

        // 쓰레기 아이템 활성 상태 비활성화 (더 이상 update에서 움직이지 않도록)
         if(this.currentTrashItemGraphic) this.currentTrashItemGraphic.setActive(false);

        // 마지막으로 아이템이 도달했던 레인 인덱스 저장 (오답 시 다시 출제용)
        // 시간 초과의 경우 itemLaneIndex는 충돌 시 레인 인덱스 (이동 중 시간 초과)
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

            // --- 메시지 생성 (정답/오답) ---
            if (isCorrect) {
                message = `정답이야! \n'${itemData.name}'은 '${itemData.specificBin}'으로 배출해야 해.`;
            } else {
                 message = `오답이야! \n'${itemData.name}'의 분리배출을 다시 생각해볼까?`;
            }

        } else if (reason === 'floor') {
            // 바닥 낙하 (무조건 오답)
            isCorrect = false;
             // --- 메시지 생성 (바닥 낙하 오답) ---
             message = `오답이야! \n'${itemData.name}'의 분리배출을 다시 생각해볼까?`;

        } else if (reason === 'timeout') {
            // 시간 초과 (무조건 오답)
            isCorrect = false;
             // --- 메시지 생성 (시간 초과) ---
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
         const buttonText = isCorrect ? '다음 아이템' : '다시 하기'; // '다음 레벨' -> '다음 아이템'으로 변경
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
        // triggerResultState에서 이미 처리되지만, 여기서 한 번 더 호출해도 무방
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

         // wasteRulesData가 비어있지 않은지 다시 확인 후 아이템 생성 시도
         if (!this.wasteRulesData || this.wasteRulesData.length === 0) {
              console.warn("hideResultUIAndProceed: wasteRulesData가 비어 있어 다음 아이템을 생성할 수 없습니다.");
              // 데이터 로드 실패 또는 데이터가 없는 상태로 판단하고 게임 종료/오류 처리 등으로 연결 필요
              if (this.messageTextObject) {
                  this.messageTextObject.setText('게임 데이터 오류!\n게임을 종료합니다.'); // 또는 다른 메시지
                  // TODO: 게임 종료 또는 시작 화면으로 이동 로직 추가
              }
              this.setGameInputEnabled(false);
              return;
         }


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
          // 커맨드 버튼 인터랙티브 상태 업데이트
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
            // TODO: 레벨 증가 조건 및 레벨별 난이도 조절 로직 추가 필요 (예: 5번 정답 시 레벨 2)
            // 현재는 정답 시마다 레벨이 1씩 증가하도록 되어 있습니다.
            // this.level++; // <-- 레벨 증가를 여기서 할지, 특정 조건에서 할지 결정
            // if (this.levelText) { this.levelText.setText('레벨 ' + this.level); } // <-- 레벨 텍스트 업데이트
            console.log('GameScene: 레벨 증가 로직 확인 필요 -> 현재 레벨:', this.level); // 로그 추가

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
        // 하트 그래픽 배열을 순회하며 체력에 따라 이미지를 변경합니다.
         // 배열은 왼쪽부터 채워져 있지만, 시각적으로는 오른쪽부터 하트가 사라지도록 구현합니다.
        for (let i = 0; i < this.heartGraphics.length; i++) {
             // 배열의 마지막 요소 (오른쪽 하트)부터 시작해서 역순으로 처리
             const heartImg = this.heartGraphics[this.heartGraphics.length - 1 - i];

             if (heartImg && heartImg.setTexture) { // 오브젝트가 있고 setTexture 메서드가 있다면 (이미지 오브젝트인 경우)
                 if (i < this.health) {
                     // 현재 체력 수보다 작은 인덱스(오른쪽부터 셌을 때)의 하트는 꽉 찬 하트 이미지로 변경
                     heartImg.setTexture('heart_full_img'); // <-- 꽉 찬 하트 이미지 키 사용
                 } else {
                     // 현재 체력 수보다 크거나 같은 인덱스(오른쪽부터 셌을 때)의 하트는 빈 하트 이미지로 변경
                     heartImg.setTexture('heart_empty_img'); // <-- 빈 하트 이미지 키 사용
                 }
                 // setFillStyle은 사각형에만 해당되므로 제거
                 // if (heartImg.setFillStyle) { heartImg.setFillStyle(...); }
             }
         }
    }


     // --- 오답 시 동일한 아이템으로 다시 출제 ---
     resetItemForRetry() {
         console.log('GameScene: 같은 아이템으로 다시 출제.');
         // 이전 결과 UI 숨김 및 isProcessingResult = false 설정 (hideResultUIAndProceed에서 이미 호출됨)
         // hideResultUI();

         // 쓰레기 아이템 제거는 hideResultUIAndProceed에서 이미 처리
         // if (this.currentTrashItemGraphic) { ... }

         // 현재 아이템 데이터는 this.currentTrashItemData에 저장되어 있음.
         const itemDataToRetry = this.currentTrashItemData;

          // 데이터가 유효한지 다시 확인
          if (!itemDataToRetry) {
              console.error("resetItemForRetry: 현재 아이템 데이터가 없어 다시 출제할 수 없습니다.");
              // 게임 종료 또는 오류 처리 등으로 연결 필요
              if (this.messageTextObject) {
                  this.messageTextObject.setText('게임 데이터 오류!\n게임을 종료합니다.');
              }
              this.setGameInputEnabled(false);
              return;
          }


         // 쓰레기 아이템 사각형 오브젝트 재생성 (동일한 아이템 사용)
         const itemWidth = 40; const itemHeight = 40; const startY = this.panel.y - this.panel.height / 2 + 80;

         // 오답 시 마지막으로 도달했던 레인에서 시작하도록 설정
         this.currentLaneIndex = this.lastLandedLaneIndex; // <-- 마지막 레인에서 시작

         const startX = this.laneCenterXPositions[this.currentLaneIndex];

         // 사각형 색상은 아이템 데이터의 correctBin에 해당하는 색상 사용 (임시)
         const correctBinColor = this.binColors[itemDataToRetry.correctBin];
         this.currentTrashItemGraphic = this.add.rectangle(startX, startY, itemWidth, itemHeight, correctBinColor);
         this.currentTrashItemGraphic.itemData = itemDataToRetry; // 아이템 데이터 연결
         this.currentTrashItemGraphic.setActive(true);

         // TODO: 이미지 사용 시에는 이 부분을 변경
         /*
         this.currentTrashItemGraphic = this.add.image(startX, startY, itemDataToRetry.imageKey);
         this.currentTrashItemGraphic.setDisplaySize(itemWidth, itemHeight); // 이미지 크기 조절 필요
         this.currentTrashItemGraphic.setOrigin(0.5);
         this.currentTrashItemGraphic.itemData = itemDataToRetry;
         this.currentTrashItemGraphic.setActive(true);
         */


         this.isFalling = true;

         // 메시지 내용 업데이트 (다시 출제 시에는 초기 메시지 다시 표시)
         if (this.messageTextObject && itemDataToRetry.nickname) {
             this.messageTextObject.setText(`'${itemDataToRetry.nickname}' 쓰레기가 나타났어.\n어디에 분리배출 해야 할까?`);
         }

         // --- 시간 타이머 리셋 ---
         this.itemTimeRemaining = this.itemTimeLimit; // <-- 아이템 다시 출제 시 타이머 리셋

         // --- ↓↓↓ 다시 출제 시 시작 레인의 쓰레기통 열린 상태로 변경 ↓↓↓
         this.updateBinVisuals(this.currentLaneIndex);


         console.log('GameScene: 동일 아이템 사각형 다시 생성:', this.currentTrashItemData.name, '시작 칸:', this.currentLaneIndex);
     }

    // --- 게임 상태 초기화 함수 ---
    // 게임 시작 시 (create 완료 후) 또는 다시 시작할 때 호출됩니다.
    resetGameState() {
        console.log('GameScene: 게임 상태 초기화 시작.');

        // --- 게임 변수 초기화 ---
        this.score = 0; // 점수 초기화
        this.health = 3; // 체력 초기값으로 리셋
        this.level = 1; // <-- 레벨 초기값으로 리셋
        this.currentLaneIndex = 0; // 시작 칸
        this.isFalling = false;
        this.isProcessingResult = false;
        this.moveLeft = false;
        this.moveRight = false;
        this.moveDownFast = false;
        this.lastKeyboardMoveTime = 0;
        this.lastLandedLaneIndex = 0;
        this.itemTimeRemaining = this.itemTimeLimit; // <-- 시간 초기값으로 리셋
        this.currentOpenBinIndex = -1; // <-- 현재 열린 쓰레기통 인덱스 초기화 추가


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

        // 쓰레기통 열린 상태 닫기
        this.updateBinVisuals(-1); // -1 인덱스로 호출하여 모든 쓰레기통을 닫힌 상태로 만듦


        // --- 첫 쓰레기 아이템 생성 ---
         // 게임 플레이 입력 활성화는 spawnWasteItem 호출 전에 하는 것이 더 자연스러움
         this.setGameInputEnabled(true);
        this.spawnWasteItem(); // 데이터 로드 성공 후, 첫 아이템 생성

        console.log('GameScene: 게임 상태 초기화 완료. 첫 아이템 생성.');
    }

    // --- 게임 오버 처리 함수 ---
    gameOver() {
        console.log('GameScene: Game Over!');
        // 게임 오버 메시지 표시 (메시지 창은 항상 보이므로 내용만 변경)
        if (this.messageTextObject) {
             // TODO: 최종 점수 등을 포함하여 더 상세한 게임 오버 메시지 표시 가능
             this.messageTextObject.setText('게임 오버!\n다음에 다시 도전하세요!');
             // 결과 버튼 숨김 (더 이상 다시 하거나 다음 레벨 없음)
             if (this.resultButton) this.resultButton.setVisible(false);
             if (this.resultButtonText) this.resultButtonText.setVisible(false);
        }

        // 게임 플레이 입력 비활성화
        this.setGameInputEnabled(false);

        // 쓰레기 아이템 제거 (화면에 남아있을 경우)
        if (this.currentTrashItemGraphic) {
            this.currentTrashItemGraphic.destroy();
            this.currentTrashItemGraphic = null;
        }

        // 쓰레기통 열린 상태 닫기 (선택 사항)
        this.updateBinVisuals(-1); // -1 인덱스로 호출하여 모든 쓰레기통을 닫힌 상태로 만듦

        // TODO: 게임 오버 화면 (별도 씬)으로 이동하는 것이 더 좋을 수 있음
        // 현재는 일정 시간 대기 후 시작 화면(BootScene)으로 전환합니다.
         console.log('GameScene: 게임 오버 후 3초 대기.');
         this.time.delayedCall(3000, () => { // 3초 대기
             console.log('GameScene: 3초 지연 후 BootScene 시작 시도.');
             // GameScene을 멈춘 후 BootScene으로 전환합니다.
             this.scene.stop('GameScene'); // <-- 현재 GameScene 멈추기
             this.scene.start('BootScene'); // <-- BootScene으로 전환
         }, [], this);

        // 게임 오버 상태 플래그 설정 (필요하다면)
        // this.isGameOver = true; // 새로운 플래그 추가 가능
    }

    // TODO: 라운드/레벨 클리어 처리 함수 (다음 라운드 준비 등)
    // levelComplete() { console.log('Level Complete!'); this.scene.start('NextLevelScene'); }

}


// --- 게임 설정 (config) ---
// 이 부분이 모든 클래스 정의보다 아래에 위치해야 합니다.
const config = {
    type: Phaser.AUTO, // Canvas 또는 WebGL 자동 선택
    width: 480, // 게임 내부 해상도 (설계 기준)
    height: 720, // 게임 내부 해상도 (설계 기준)
    parent: 'game-container', // 게임 Canvas가 삽입될 HTML 요소의 ID
    scale: {
        mode: Phaser.Scale.FIT, // 부모 컨테이너에 맞춰 비율 유지하며 스케일링
        autoCenter: Phaser.Scale.CENTER_BOTH // 화면 중앙에 배치
    },
    // 사용할 씬들을 배열로 등록 (순서 중요: BootScene -> GameScene)
    scene: [
        BootScene, // 게임 시작 시 처음 실행될 씬
        GameScene  // BootScene에서 시작 버튼 클릭 시 전환될 씬
    ]
};

// Phaser 게임 인스턴스 생성
// 이 코드가 실행되면서 config에 따라 게임이 초기화되고 첫 번째 씬(BootScene)이 시작됩니다.
const game = new Phaser.Game(config);

// --- 이 아래에는 추가적인 게임 관련 코드가 오지 않도록 합니다 ---