export class ItemManager {
    constructor(scene) {
        this.scene = scene;
    }

    spawnWasteItem() {
        console.log('GameScene: 아이템 생성 시작, 현재 라운드:', this.scene.currentRound);

        // 쓰레기통 상태 확인 및 리셋
        this.scene.currentLaneIndex = 0; // 첫 번째 라인에서 시작
        this.scene.currentOpenBinIndex = -1; // 열린 쓰레기통 인덱스 초기화

        // 모든 쓰레기통 닫힌 상태로 리셋
        this.scene.resetAllBins();

        // 모든 타입별 UI 정리
        this.cleanupType3UI();

        // 현재 라운드에 맞는 아이템 가져오기
        const currentRoundData = this.scene.roundData.find(round => round.round === this.scene.currentRound);
        if (!currentRoundData) {
            console.error('GameScene: 현재 라운드 데이터를 찾을 수 없음:', this.scene.currentRound);
            return;
        }

        const itemData = this.scene.wasteRulesData.find(item => item.id === currentRoundData.itemId);
        if (!itemData) {
            console.error('GameScene: 아이템 데이터를 찾을 수 없음:', currentRoundData.itemId);
            return;
        }

        console.log('GameScene: 생성할 아이템:', itemData.name, '타입:', itemData.type);

        this.scene.updateBinVisuals(this.scene.currentLaneIndex);

        // 난이도 표시 업데이트
        if (this.scene.difficultyText) {
            this.scene.difficultyText.setText(`${itemData.difficulty}`);
        }

        this.scene.currentTrashItemData = itemData;
        this.scene.currentGameType = itemData.type;

        // 메인 패널 이미지 변경
        this.updateMainPanelForGameType(this.scene.currentGameType);

        // 타입별 스폰 처리
        if (this.scene.currentGameType === 1) {
            this.spawnType1Item(itemData);
        } else if (this.scene.currentGameType === 2) {
            this.spawnType2Item(itemData);
        } else if (this.scene.currentGameType === 3) {
            this.spawnType3Item(itemData);
        }
    }


    // 이 함수 추가
    updateMainPanelForGameType(gameType) {
        console.log('GameScene: 메인 패널 업데이트, 게임 타입:', gameType);

        // 저장된 메인 패널 참조 사용
        if (!this.scene.mainPanelImage) {
            console.error('GameScene: 메인 패널 참조가 없음!');
            return;
        }

        // 게임 타입에 따라 이미지 변경
        if (gameType === 3) {
            // Type 3용 이미지로 변경
            if (this.scene.textures.exists('type3_panel_img')) {
                // 메인 패널 이미지를 Type 3 패널 이미지로 변경
                this.scene.mainPanelImage.setTexture('type3_panel_img');
                console.log('GameScene: 메인 패널 이미지를 Type 3로 변경 성공');
            } else {
                console.error('GameScene: type3_panel_img 텍스처가 존재하지 않음!');
            }

            // Type 1 요소는 보이지 않게 처리 (쓰레기통 등)
            this.scene.binImages.forEach(bin => bin.setVisible(false));

            // 쓰레기통 이름도 숨김
            if (this.scene.binNameTexts) {
                this.scene.binNameTexts.forEach(text => text.setVisible(false));
            }
            // 검정 라인 숨김
            if (this.scene.laneIndicatorLine) {
                this.scene.laneIndicatorLine.setVisible(false);
            }

            console.log('GameScene: Type 3 - 쓰레기통과 이름 숨김, 커맨드 버튼 유지');
        } else {
            // 기본 이미지로 변경
            this.scene.mainPanelImage.setTexture('panel_img');
            console.log('GameScene: 메인 패널 이미지를 기본으로 변경');

            // Type 3 이지선다 텍스트 숨김
            if (this.scene.leftChoiceText) this.scene.leftChoiceText.setVisible(false);
            if (this.scene.rightChoiceText) this.scene.rightChoiceText.setVisible(false);

            // Type 1 쓰레기통 다시 표시
            this.scene.binImages.forEach(bin => bin.setVisible(true));

            // 쓰레기통 이름도 다시 표시
            if (this.scene.binNameTexts) {
                this.scene.binNameTexts.forEach(text => text.setVisible(true));
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
        this.scene.currentLaneIndex = 0; // 항상 첫 번째 레인에서 시작
        const lanePositions = [];
        for (let i = 0; i < this.scene.binKeys.length; i++) {
            lanePositions.push(firstLaneX + (i * 60));
        }
        this.scene.laneCenterXPositions = lanePositions; // 레인 중앙 위치 업데이트

        const startX = this.scene.laneCenterXPositions[this.scene.currentLaneIndex];

        // 아이템 이미지 키 결정 (itemData.id + "_img")
        const itemImageKey = `${itemData.id}_img`;

        // 이미지로 생성
        this.scene.currentTrashItemGraphic = this.scene.add.image(startX, startY, itemImageKey)
            .setDisplaySize(itemWidth, itemHeight)
            .setOrigin(0, 0) // 왼쪽 상단 기준점
            .setDepth(10);   // 다른 요소들보다 앞에 표시

        // 중요: 아이템이 실제로 생성되었는지 확인
        console.log('아이템 생성 확인:', this.scene.currentTrashItemGraphic.texture.key,
            'x:', this.scene.currentTrashItemGraphic.x,
            'y:', this.scene.currentTrashItemGraphic.y);

        this.scene.currentTrashItemGraphic.itemData = itemData;
        this.scene.currentTrashItemGraphic.setActive(true);

        // 메시지 업데이트
        if (this.scene.messageTextObject && itemData.messageInitial) {
            this.scene.messageTextObject.setText(itemData.messageInitial);
        }
        // 아이템 이름 표시 추가
        console.log('spawnType1Item에서 displayItemName 호출');
        this.displayItemName(itemData);


        // 시간 타이머 리셋
        this.scene.itemTimeRemaining = this.scene.itemTimeLimit;
        this.scene.isFalling = true;
        this.scene.isProcessingResult = false; // 중요: 결과 처리 상태 초기화
        this.scene.lastFallTime = this.scene.game.getTime(); // 픽셀 단위 낙하를 위한 타이머 초기화

        // 시작 레인의 쓰레기통 열기
        this.scene.updateBinVisuals(this.scene.currentLaneIndex);

        console.log('GameScene: Type 1 아이템 생성 완료:', itemData.name);
    }

    spawnType2Item(itemData) {
        // 게임 상태 명시적 초기화
        this.scene.gameState = 'playing';
        this.scene.isProcessingResult = false;
        this.scene.preprocessingInputEnabled = false;
        this.scene.currentPreprocessingStep = 0;
        this.scene.fallCount = 0;

        // Type1과 거의 동일하게 처리
        const itemWidth = 60;
        const itemHeight = 60;
        const firstLaneX = 70;
        const startY = 300;

        // 레인 위치 계산
        this.scene.currentLaneIndex = 0;
        const lanePositions = [];
        for (let i = 0; i < this.scene.binKeys.length; i++) {
            lanePositions.push(firstLaneX + (i * 60));
        }
        this.scene.laneCenterXPositions = lanePositions;

        const startX = this.scene.laneCenterXPositions[this.scene.currentLaneIndex];

        // 경고 아이콘이 있는 아이템 이미지 키
        const warningImageKey = `${itemData.id}_warning_img`;

        // 이미지로 생성
        this.scene.currentTrashItemGraphic = this.scene.add.image(startX, startY, warningImageKey)
            .setDisplaySize(itemWidth, itemHeight)
            .setOrigin(0, 0)
            .setDepth(10)
            .setInteractive();

        // 아이템 데이터 설정
        this.scene.currentTrashItemGraphic.itemData = itemData;
        this.scene.currentTrashItemGraphic.setActive(true);

        // 아이템 이름 표시 (TYPE2인 경우 ? 추가되어야 함)
        console.log('spawnType2Item에서 displayItemName 호출');
        this.displayItemName(itemData);

        /*/ '터치!' 텍스트 추가 (아이템 위 2픽셀 위치)
        this.scene.touchText = this.scene.add.text(
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
        this.scene.currentTrashItemGraphic.on('pointerdown', this.onType2ItemClick, this);

        // 아이템 데이터 설정
        this.scene.currentTrashItemGraphic.itemData = itemData;
        this.scene.currentTrashItemGraphic.setActive(true);

        // 메시지 업데이트
        if (this.scene.messageTextObject && itemData.messageInitial) {
            this.scene.messageTextObject.setText(itemData.messageInitial);
        }

        // 시간 타이머 리셋
        this.scene.itemTimeRemaining = this.scene.itemTimeLimit;
        this.scene.isFalling = true;
        this.scene.lastFallTime = this.scene.game.getTime();

        // Type1과 동일하게 시작 레인의 쓰레기통 열기
        this.scene.updateBinVisuals(this.scene.currentLaneIndex);

        console.log('GameScene: Type 2 아이템 생성:', itemData.name);
    }


    // spawnType3Item 함수 수정
    spawnType3Item(itemData) {
        console.log('GameScene: Type 3 아이템 생성');

        const {width, height} = this.scene.sys.game.canvas;

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
        this.scene.currentTrashItemGraphic = this.scene.add.image(startX, startY, itemImageKey)
            .setDisplaySize(itemWidth, itemHeight)
            .setOrigin(0, 0)
            .setDepth(10);

        this.scene.currentTrashItemGraphic.itemData = itemData;

        // 초기 레인 인덱스는 왼쪽(0)
        this.scene.currentLaneIndex = 0;

        // 메시지 업데이트
        if (this.scene.messageTextObject) {
            this.scene.messageTextObject.setText(itemData.quizQuestion || '닭뼈는 어떤 종류의 쓰레기일까?\n왼쪽은 일반쓰레기, 오른쪽은 음식물쓰레기!');
        }

        // 이지선다 선택지 텍스트 업데이트
        if (!this.scene.leftChoiceText) {
            this.scene.leftChoiceText = this.scene.add.text(
                94,
                570, //width / 2 - 82,590,
                itemData.quizOptions?.left || '일반쓰레기',
                {font: '20px 머니그라피', fill: '#000000', align: 'center', fontStyle: 'bold'}
            ).setOrigin(0, 0);
        } else {
            this.scene.leftChoiceText.setText(itemData.quizOptions?.left || '일반쓰레기');
            this.scene.leftChoiceText.setVisible(true);
        }

        if (!this.scene.rightChoiceText) {
            this.scene.rightChoiceText = this.scene.add.text(
                245, 570,
                itemData.quizOptions?.right || '음식물쓰레기',
                {font: '20px 머니그라피', fill: '#000000', align: 'center', fontStyle: 'bold'}
            ).setOrigin(0, 0);
        } else {
            this.scene.rightChoiceText.setText(itemData.quizOptions?.right || '음식물쓰레기');
            this.scene.rightChoiceText.setVisible(true);
        }
        // 아이템 이름 표시 추가 (TYPE3는 기본 name 사용)
        console.log('spawnType3Item에서 displayItemName 호출');
        this.displayItemName(itemData);

        // 시간 타이머 리셋
        this.scene.itemTimeRemaining = this.scene.itemTimeLimit;
        this.scene.isFalling = true;
        this.scene.lastFallTime = this.scene.game.getTime();

        console.log('GameScene: Type 3 아이템 생성 완료');
    }


    // 충돌 처리 함수 추가
    // handleType3Collision() {
    //     if (!this.scene.isFalling || this.scene.isProcessingResult) return;
    //
    //     this.scene.isFalling = false;
    //     this.scene.isProcessingResult = true;
    //
    //     // 정답 확인
    //     const isCorrect = (this.scene.currentLaneIndex === 0 && this.scene.currentTrashItemGraphic.itemData.correctAnswer === 'left') ||
    //         (this.scene.currentLaneIndex === 1 && this.scene.currentTrashItemGraphic.itemData.correctAnswer === 'right');
    //
    //     this.scene.triggerResultState(this.scene.currentLaneIndex, 'collision', isCorrect);
    // }


    cleanupType3UI() {
        // Type 3 관련 UI 요소 숨김
        if (this.scene.leftChoiceText) this.scene.leftChoiceText.setVisible(false);
        if (this.scene.rightChoiceText) this.scene.rightChoiceText.setVisible(false);

        // 쓰레기통 이름이 숨겨진 경우 다시 표시
        if (this.scene.binNameTexts && !this.scene.binNameTexts[0].visible) {
            this.scene.binNameTexts.forEach(text => text.setVisible(true));
        }

        // 쓰레기통이 숨겨진 경우 다시 표시
        if (this.scene.binImages && !this.scene.binImages[0].visible) {
            this.scene.binImages.forEach(bin => bin.setVisible(true));
        }
    }

    // === Type 2 관련 함수들 ===
    onType2ItemClick() {
        // Type2가 아니거나 이미 처리 중인 경우 무시
        if (this.scene.currentGameType !== 2 || this.scene.isProcessingResult) return;

        console.log('GameScene: Type 2 아이템 클릭됨');

        // 클릭 시 깜빡임 애니메이션 중지
        this.scene.tweens.killTweensOf(this.scene.currentTrashItemGraphic);

        if (this.scene.touchText) {
            this.scene.tweens.killTweensOf(this.scene.touchText);
            this.scene.touchText.destroy(); // '터치!' 텍스트 제거
            this.scene.touchText = null;
        }
        this.scene.currentTrashItemGraphic.alpha = 1;

        this.scene.isFalling = false;

        // 전처리 시작
        this.scene.isProcessingResult = true;
        this.showPreprocessingPopup();
    }

    showPreprocessingPopup() {
        // 이미지로 팝업 배경 생성
        this.scene.preprocessingPopupBg = this.scene.add.image(60, 240, 'popup_bg_img')
            .setDisplaySize(320, 375)
            .setOrigin(0, 0)
            .setAlpha(0)
            .setDepth(25);

        // 경고 메시지 설정 (전처리 유도)
        if (this.scene.messageTextObject && this.scene.currentTrashItemData.messageWarning) {
            this.scene.messageTextObject.setText(this.scene.currentTrashItemData.messageWarning);
        }

        // 서서히 나타나는 애니메이션 (2초 동안)
        this.scene.tweens.add({
            targets: this.scene.preprocessingPopupBg,
            alpha: 1,
            duration: 1000,
            ease: 'Linear',
            onComplete: () => {
                console.log('GameScene: 팝업 배경 표시 완료');
                // 배경 표시 완료 후 경고 슬라이드 애니메이션 시작
                this.scene.miniGameManager.showWarningSlideAnimation();
            }
        });
    }

    displayItemName(itemData) {
        const {width} = this.scene.sys.game.canvas;

        // 디버깅 로그 추가
        console.log('displayItemName 호출됨');
        console.log('itemData:', itemData);
        console.log('itemData.type:', itemData.type);
        console.log('itemData.preprocessedName:', itemData.preprocessedName);
        console.log('currentTrashItemGraphic:', this.scene.currentTrashItemGraphic);
        console.log('texture key:', this.scene.currentTrashItemGraphic ? this.scene.currentTrashItemGraphic.texture.key : 'null');

        // 기존 텍스트가 있으면 제거
        if (this.scene.itemNameText) {
            this.scene.itemNameText.destroy();
        }

        // 아이템 이름 결정
        let itemName = itemData.name;

        // TYPE2 아이템인 경우에만 특별 처리
        if (itemData.type === 2) {
            // 전처리된 이미지인지 확인
            if (this.scene.currentTrashItemGraphic &&
                this.scene.currentTrashItemGraphic.texture.key.includes('_preprocessed')) {
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
        this.scene.itemNameText = this.scene.add.text(width / 2, 210, itemName, {
            font: '24px "머니그라피"',
            fill: '#FFFFFF',
            align: 'center',
            letterSpacing: 5 // 글자 간격 5로 설정
        })
            .setOrigin(0.5)
            .setDepth(15); // 다른 요소보다 앞에 표시

        // 공통 UI 컨테이너에 추가
        if (this.scene.uiContainers && this.scene.uiContainers.common) {
            this.scene.uiContainers.common.add(this.scene.itemNameText);
        }

        console.log('최종 아이템 이름 표시:', itemName);
    }

}