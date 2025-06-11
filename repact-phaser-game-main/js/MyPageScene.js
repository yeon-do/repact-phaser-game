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

        // 도감 버튼 (뒤집힌 back.img) - 왼쪽 위 기준으로 오른쪽 120px, 아래 487px
        const dexButton = this.add.image(120, 487, 'dex_button')
            .setOrigin(0, 0)  // 왼쪽 위 기준
            .setDisplaySize(29, 27)  // 29*27 사이즈
            .setFlipX(true)  // 180도 뒤집기 (좌우 반전)
            .setInteractive();

        // 사용자 정보 가져오기
        const userName = localStorage.getItem('name') || localStorage.getItem('username') || '000';

        // 사용자 이름 표시 (이미지의 적절한 위치에)
        this.add.text(width * 0.35, height * 0.33, userName, {
            fontFamily: '머니그라피',
            fontSize: '28px',
            color: '#000000'
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