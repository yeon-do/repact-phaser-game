// 파일 맨 위에 이 줄 추가해서 제대로 로드되는지 확인
console.log('MyPageScene.js loaded successfully');

class MyPageScene extends Phaser.Scene {
    constructor() {
        super('MyPageScene');
        console.log('MyPageScene constructor called');
        this.isTransitioning = false;
    }

    preload() {
        // mypage.png 이미지 로드
        this.load.image('mypage_background', './assets/startscene/mypage.png');

        // 뒤집힌 back.img 이미지 로드 (도감 버튼용)
        this.load.image('dex_button', './assets/images/back.png');
    }

    create() {
        // 씬이 시작될 때마다 전환 상태 초기화
        this.isTransitioning = false;

        const { width, height } = this.sys.game.canvas;

        // mypage.png 배경 이미지
        this.add.image(width / 2, height / 2, 'mypage_background')
            .setOrigin(0.5)
            .setDisplaySize(width, height);

        // 1. 레벨 표시 (현재레벨/10)
        const userLevel = parseInt(localStorage.getItem('level') || '1', 10);
        const levelText = `${userLevel} / 10`;
        this.add.text(440 - 60, 412, levelText, {
            fontFamily: '머니그라피',
            fontSize: '16px',
            color: '#FFFFFF',
            align: 'right'
        }).setOrigin(1, 0);

        // 2. 레벨 게이지 박스 (흰색, 320x20, 오른쪽에서 60, 위에서 440)
        const levelBarMaxWidth = 320;
        const levelBarHeight = 20;
        const levelBarX = 60
        const levelBarY = 440;
        const levelBarFillWidth = Math.max(0, Math.min(userLevel / 10, 1)) * levelBarMaxWidth;
        // 바 배경
        //this.add.rectangle(levelBarX, levelBarY, levelBarMaxWidth, levelBarHeight, 0xffffff, 0)
        //  .setOrigin(0, 0);
        // 바 채움 (해당 넓이만큼)
        if (levelBarFillWidth > 0) {
            this.add.rectangle(levelBarX, levelBarY, levelBarFillWidth, levelBarHeight, 0xffffff, 1)
                .setOrigin(0, 0);
        }

        // 3. 포인트 표시 (오른쪽에서 60, 위에서 560)
        const totalPoint = parseInt(localStorage.getItem('totalPoint') || '0', 10);
        //const totalPoint =1000;
        this.add.text(380, 572, totalPoint, {
            fontFamily: '머니그라피',
            fontSize: '16px',
            color: '#ffffff',
            align: 'right'
        }).setOrigin(1, 0);

        // 4. 포인트 게이지 박스 (흰색, 320x20, 오른쪽에서 60, 위에서 600)
        const pointBarMaxWidth = 320;
        const pointBarHeight = 20;
        const pointBarX = 60;
        const pointBarY = 600;
        const pointBarFillWidth = Math.max(0, Math.min(totalPoint / 10000, 1)) * pointBarMaxWidth;

        // 바 배경
        //this.add.rectangle(width - 60 - pointBarMaxWidth / 2, pointBarY, pointBarMaxWidth, pointBarHeight, 0xffffff, 0.3)
          //  .setOrigin(0.5);
        // 바 채움
        // 바 채움 (해당 넓이만큼)
        if (pointBarFillWidth > 0) {
            this.add.rectangle(pointBarX, pointBarY, pointBarFillWidth, pointBarHeight, 0xffffff, 1)
                .setOrigin(0, 0);
        }

        // 도감 버튼 (뒤집힌 back.img) - 왼쪽 위 기준으로 오른쪽 120px, 아래 487px
        const dexButton = this.add.image(120, 487, 'dex_button')
            .setOrigin(0, 0)  // 왼쪽 위 기준
            .setDisplaySize(29, 27)  // 29*27 사이즈
            .setFlipX(true)  // 180도 뒤집기 (좌우 반전)
            .setInteractive();

        // 사용자 정보 가져오기
        //const userName = localStorage.getItem('name') || localStorage.getItem('username') || '000';
        const userName = localStorage.getItem('name') || '김한양';
        const userId = localStorage.getItem('username') || 'hanyang123';

        // 사용자 이름 표시 (이미지의 적절한 위치에)
        this.add.text(60 + 95, 280 + 15, userName, {
            fontFamily: '머니그라피',
            fontSize: '28px',
            color: '#030303'
        }).setOrigin(0.5);

        // 사용자 아이디 표시 (이름 아래)
        this.add.text(60 + 95, 280 + 15 + 30, userId, {
            fontFamily: '머니그라피',
            fontSize: '16px',
            color: '#727272'
        }).setOrigin(0.5);

        // Re:Feely 버튼 (이미지의 Re:Feely 텍스트 위치)
        const refeelyButton = this.add.rectangle(width * 0.3, height * 0.75, 130, 40, 0x000000, 0)
            .setInteractive();

        // 에코야얼스 버튼 (이미지의 에코야얼스 텍스트 위치)
        const ecoyaButton = this.add.rectangle(width * 0.7, height * 0.75, 130, 40, 0x000000, 0)
            .setInteractive();

        // 뒤로가기 버튼 (이미지 하단의 뒤로가기 버튼 위치)
        const backButton = this.add.rectangle(width * 0.29, height * 0.84, 130, 40, 0x000000, 0)
            .setInteractive();

        // 수정하기 버튼 (이미지 하단의 정보 수정 버튼 위치)
        const editButton = this.add.rectangle(width * 0.71, height * 0.84, 130, 40, 0x000000, 0)
            .setInteractive();

        // 도감 버튼 이벤트
        dexButton.on('pointerdown', () => {
            if (!this.isTransitioning) {
                this.isTransitioning = true;
                this.scene.start('DexScene');
            }
        });

        // 뒤로가기 버튼 이벤트
        backButton.on('pointerdown', () => {
            if (!this.isTransitioning) {
                this.isTransitioning = true;
                this.scene.start('BootScene');
            }
        });

        editButton.on('pointerdown', () => {
            if (!this.isTransitioning) {
                alert('수정 기능은 준비 중입니다.');
            }
        });

        refeelyButton.on('pointerdown', () => {
            if (!this.isTransitioning) {
                // Re:Feely 웹사이트로 이동
                window.open('https://refeely.com/', '_blank');
            }
        });

        ecoyaButton.on('pointerdown', () => {
            if (!this.isTransitioning) {
                // 에코야얼스 웹사이트로 이동
                window.open('https://ecoyaearth.com/', '_blank');
            }
        });

        // === 페이드 인 오버레이 효과 추가 ===
        this.blackOverlay = this.add.rectangle(0, 0, width, height, 0x3cbb89)
            .setOrigin(0, 0)
            .setAlpha(1)
            .setDepth(100);

        this.tweens.add({
            targets: this.blackOverlay,
            alpha: 0,
            duration: 300,
            onComplete: () => {
                this.blackOverlay.destroy();
            }
        });

        // 디버깅용 - 버튼 위치 확인 (개발 후 제거)
        // dexButton.setStrokeStyle(2, 0xff00ff);  // 이미지는 setStrokeStyle 사용 불가 - 주석 처리

        // 대신 dexButton 위치 확인용 사각형 추가 (개발 후 제거)
        //this.add.rectangle(120 + 14.5, 487 + 13.5, 29, 27, 0xff00ff, 0.3); // 도감 버튼 위치 확인용

        //refeelyButton.setStrokeStyle(2, 0x00ff00);
        //ecoyaButton.setStrokeStyle(2, 0x0000ff);
        //backButton.setStrokeStyle(2, 0xff0000);
        //editButton.setStrokeStyle(2, 0xffff00);
    }
}