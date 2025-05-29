export function updateType1(time, delta) {
    // isProcessingResult가 true면 업데이트 중단
    if (!this.currentTrashItemGraphic || !this.isFalling || this.isProcessingResult) return;

    const currentTime = time;

    // 픽셀 단위 낙하 로직
    if (!this.lastFallTime) {
        this.lastFallTime = currentTime;
    }

    let fallInterval = 500;
    if (this.cursors.down.isDown || this.moveDownFast) {
        fallInterval = fallInterval / this.fastFallMultiplier;
    }

    if (currentTime - this.lastFallTime >= fallInterval) {
        // 아이템 낙하
        this.currentTrashItemGraphic.y += 20;
        this.lastFallTime = currentTime;

        // 낙하 횟수 증가
        this.fallCount = (this.fallCount || 0) + 1;

        // 디버깅 로그 추가
        console.log('낙하 횟수:', this.fallCount, '게임 타입:', this.currentGameType);

        // TYPE2 아이템이고 한 번 떨어진 후에 '터치!' 텍스트 생성
        if (this.currentGameType === 2 && this.fallCount === 1 && !this.touchText) {
            console.log('터치 텍스트 생성 시도');

            const itemWidth = this.currentTrashItemGraphic.displayWidth;
            const touchX = this.currentTrashItemGraphic.x + itemWidth / 2;
            const touchY = this.currentTrashItemGraphic.y - 2;

            this.touchText = this.add.text(touchX, touchY, '터 치!', {
                font: '16px 머니그라피',
                fill: '#E2250E',
                stroke: '#FFFFFF',
                strokeThickness: 2,
                align: 'center'
            })
                .setOrigin(0.5, 1)
                .setDepth(11);

            console.log('터치 텍스트 생성 완료:', this.touchText);
        }

        // '터치!' 텍스트가 있으면 아이템과 함께 이동
        if (this.touchText) {
            this.touchText.y = this.currentTrashItemGraphic.y - 2;
            this.touchText.x = this.currentTrashItemGraphic.x + this.currentTrashItemGraphic.displayWidth / 2;
        }
    }

    // 좌우 이동 로직
    if (this.cursors.left.isDown || this.moveLeft || this.cursors.right.isDown || this.moveRight) {
        if (currentTime - this.lastKeyboardMoveTime > this.keyboardMoveDelay) {
            const direction = (this.cursors.left.isDown || this.moveLeft) ? -1 : 1;
            this.moveLaneHorizontal(direction);
            this.lastKeyboardMoveTime = currentTime;
        }
    } else {
        this.lastKeyboardMoveTime = currentTime - this.keyboardMoveDelay;
    }

    // 충돌 판정 - 고정 y 좌표 사용
    const collisionY = 535; // 충돌 판정을 위한 고정 y 좌표

    // 중요: 아이템의 하단 y좌표 계산 방식 변경
    // 전처리 완료된 아이템인지 확인
    const isPreprocessed = this.currentTrashItemGraphic.texture.key.includes('_preprocessed');

    // 아이템 하단 y좌표 계산 (전처리 완료된 아이템은 다른 오프셋 적용)
    let itemBottomY;
    if (isPreprocessed) {
        // 전처리 완료된 아이템은 정확한 충돌 위치 계산
        itemBottomY = this.currentTrashItemGraphic.y + 60; // 정확히 60px 높이 사용

        // 디버깅 로그
        console.log('전처리된 아이템 충돌 계산:',
            'y:', this.currentTrashItemGraphic.y,
            'bottomY:', itemBottomY,
            'collisionY:', collisionY,
            'diff:', collisionY - itemBottomY);
    } else {
        // 일반 아이템은 기존 방식 유지
        itemBottomY = this.currentTrashItemGraphic.y + this.currentTrashItemGraphic.height;
    }

    if (itemBottomY >= collisionY && !this.isProcessingResult) {
        console.log('GameScene: 아이템이 충돌 판정 위치에 도달!');
        this.isFalling = false;

        // 아이템 위치 조정
        this.currentTrashItemGraphic.y = collisionY - (isPreprocessed ? 60 : this.currentTrashItemGraphic.height);

        // '터치!' 텍스트 위치도 조정 (TYPE2 아이템인 경우)
        if (this.currentGameType === 2 && this.touchText) {
            this.touchText.y = this.currentTrashItemGraphic.y - 2;
        }

        // Type 2 아이템이지만 전처리 전인 경우에만 대기 상태로 전환
        if (this.currentGameType === 2 && !this.currentTrashItemGraphic.texture.key.includes('_preprocessed')) {
            // 메시지 업데이트 (전처리 필요 안내)
            if (this.messageTextObject && this.currentTrashItemGraphic.itemData.messageWarning) {
                this.messageTextObject.setText(this.currentTrashItemGraphic.itemData.messageWarning);
            }

            // 아이템이 깜빡이도록 하여 클릭 유도
            this.tweens.add({
                targets: [this.currentTrashItemGraphic, this.touchText],
                alpha: 0.6,
                yoyo: true,
                duration: 500,
                repeat: -1
            });

            console.log('GameScene: Type 2 아이템 대기 상태로 전환');
        } else {
            // Type 1 아이템이거나 전처리 완료된 Type 2 아이템은 결과 처리
            this.isProcessingResult = true;
            this.triggerResultState(this.currentLaneIndex, 'collision');
        }
    }

    // 화면 밖으로 떨어졌을 때 처리
    if (this.currentTrashItemGraphic.y > this.sys.game.canvas.height && !this.isProcessingResult) {
        console.log('GameScene: 화면 밖으로 떨어짐');
        this.isFalling = false;
        this.isProcessingResult = true;
        this.triggerResultState(null, 'floor');
    }
}