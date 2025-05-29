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
        this.scene.createType1UI();
        this.scene.createType2UI();
        this.scene.createType3UI();

        // ★ 명시적으로 모든 타입 UI 숨기기
        this.scene.uiContainers.type1.setVisible(false);
        this.scene.uiContainers.type2.setVisible(false);
        this.scene.uiContainers.type3.setVisible(false);
        this.scene.uiContainers.type2Popup.setVisible(false);

        // 입력 설정
        this.scene.setupInput();
        // 게임 상태 초기화 및 첫 라운드 시작 (즉시 시작)
        this.scene.resetGameState();

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
        this.scene.createCommandButtons();

        // 결과 버튼들
        this.scene.createResultButtons();
    }
}