class BootScene extends Phaser.Scene {
    constructor() {
        super('BootScene');

        // 메뉴 관련 변수
        this.menuItems = [
            { text: '게임 시작', scene: 'GameScene' },
            { text: '게임 방법', scene: 'HowToPlayScene' },
            { text: '000 마이페이지', scene: 'MyPageScene' } // 유저 이름은 동적으로 설정
        ];
        this.selectedMenuIndex = -1; // 초기에는 선택된 메뉴 없음
        this.menuTexts = [];
        this.selectionBar = null;
        this.isTransitioning = false; // 전환 중인지 여부
        this.userName = '000'; // 기본 유저 이름
    }

    preload() {
        // 배경 이미지 로드
        this.load.image('background_img', 'assets/images/main_background.png');

        // 선택 바 이미지 로드
        this.load.image('selection_bar', 'assets/images/white_bar.png');
    }

    create() {
        // 씬이 시작될 때마다 전환 상태 초기화
        this.isTransitioning = false;
        
        // HowToPlayScene에서 돌아왔는지 체크
        if (localStorage.getItem('returnToBootScene') === 'true') {
            localStorage.removeItem('returnToBootScene');
            // 이미 BootScene이므로 아무것도 하지 않음
        }
        
        const { width, height } = this.sys.game.canvas;

        // 로그인된 유저 이름 가져오기 - name을 우선적으로 사용
        this.userName = localStorage.getItem('name') || localStorage.getItem('username') || '000';
        
        // 마이페이지 메뉴 텍스트 업데이트
        this.menuItems[2].text = `${this.userName} 마이페이지`;

        // 배경 이미지 설정
        this.add.image(0, 0, 'background_img')
            .setOrigin(0, 0)
            .setDisplaySize(width, height);

        // 선택 바 생성 (처음에는 보이지 않음)
        this.selectionBar = this.add.image(40, 520, 'selection_bar')
            .setOrigin(0, 0) // 왼쪽 상단을 기준점으로 설정
            .setDisplaySize(360, 40) // 바 크기를 360x40으로 설정
            .setVisible(false)
            .setAlpha(0);

        // 메뉴 아이템 생성
        this.createMenuItems();

        // 입력 이벤트 설정
        this.input.on('pointerdown', this.handleMenuClick, this);

        // 검은색 오버레이 생성 (처음에는 투명하게)
        this.blackOverlay = this.add.rectangle(0, 0, this.sys.game.canvas.width, this.sys.game.canvas.height, 0x3cbb89)
            .setOrigin(0, 0)
            .setAlpha(0)
            .setDepth(100) // 가장 위에 표시
            .setVisible(false);
    }

    createMenuItems() {
        const startY = 522;
        const spacing = 40;
        const menuX = this.sys.game.canvas.width - 60;

        this.menuTexts = [];

        this.menuItems.forEach((item, index) => {
            const y = startY + (index * spacing);

            // 메뉴 텍스트 생성 (모두 흰색으로 시작)
            const text = this.add.text(menuX, y, item.text, {
                font: '32px "머니그라피"',
                fill: '#ffffff',
                align: 'right'
            })
                .setOrigin(1, 0.5)
                .setInteractive();

            // 메뉴 아이템 데이터 저장
            text.menuIndex = index;

            this.menuTexts.push(text);
        });
    }

    handleMenuClick(pointer) {
        // 전환 중이면 클릭 무시
        if (this.isTransitioning) return;

        // 클릭한 메뉴 아이템 찾기
        let clickedIndex = -1;

        this.menuTexts.forEach(text => {
            if (Phaser.Geom.Rectangle.Contains(text.getBounds(), pointer.x, pointer.y)) {
                clickedIndex = text.menuIndex;
            }
        });

        // 메뉴 아이템을 클릭한 경우
        if (clickedIndex !== -1) {
            this.showSelectionAndTransition(clickedIndex);
        }
    }

    showSelectionAndTransition(index) {
        // 범위 체크
        if (index < 0 || index >= this.menuItems.length) return;

        // 전환 중 상태로 설정
        this.isTransitioning = true;

        // 모든 텍스트 흰색으로 초기화
        this.menuTexts.forEach(text => {
            text.setFill('#ffffff');
        });

        // 선택된 메뉴 인덱스 저장
        this.selectedMenuIndex = index;
        const selectedText = this.menuTexts[index];

        // 선택 바 위치 설정 및 표시 (선택된 메뉴 아이템의 y 위치에 맞춤)
        this.selectionBar.setPosition(40, selectedText.y - 20); // y에서 20을 빼서 텍스트 중앙에 맞춤
        this.selectionBar.setVisible(true);
        this.selectionBar.setAlpha(1);

        // 선택된 텍스트 색상 변경
        selectedText.setFill('#3cbb89');

        // 선택 바를 텍스트 뒤로 이동 (z-index 조정)
        this.selectionBar.setDepth(1);
        selectedText.setDepth(2);

        this.time.delayedCall(500, () => {
            this.startSelectedScene();
        });
    }

    startSelectedScene() {
        const selectedItem = this.menuItems[this.selectedMenuIndex];

        // 검은색 오버레이 표시
        this.blackOverlay.setVisible(true);

        // 페이드 아웃 효과
        this.tweens.add({
            targets: this.blackOverlay,
            alpha: 1,
            duration: 700,
            onComplete: () => {
                // 페이드 아웃 완료 후 씬 전환
                this.scene.start(selectedItem.scene, { fromBlackOverlay: true });
            }
        });
    }

}