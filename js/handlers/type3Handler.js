export function updateType3(time, delta) {
    if (!this.currentTrashItemGraphic || !this.isFalling) return;

    const currentTime = time;
    const {width, height} = this.sys.game.canvas;

    // 픽셀 단위 낙하를 위한 타이머 확인
    if (!this.lastFallTime) {
        this.lastFallTime = currentTime;
    }

    // 낙하 로직
    let fallInterval = 500;
    if (this.cursors.down.isDown || this.moveDownFast) {
        fallInterval = fallInterval / this.fastFallMultiplier;
    }

    if (currentTime - this.lastFallTime >= fallInterval) {
        this.currentTrashItemGraphic.y += 20;
        this.lastFallTime = currentTime;
    }

    // 좌우 이동 로직
    if (this.cursors.left.isDown || this.moveLeft || this.cursors.right.isDown || this.moveRight) {
        if (currentTime - this.lastKeyboardMoveTime > this.keyboardMoveDelay) {
            const newLaneIndex = (this.cursors.left.isDown || this.moveLeft) ? 0 : 1;
            if (this.currentLaneIndex !== newLaneIndex) {
                this.currentLaneIndex = newLaneIndex;
                const leftX = 110;
                const rightX = 270;
                const targetX = (this.currentLaneIndex === 0) ? leftX : rightX;
                this.currentTrashItemGraphic.x = targetX;
                this.lastKeyboardMoveTime = currentTime;
                console.log('GameScene: Type 3 아이템 이동 ->', this.currentLaneIndex ? '오른쪽' : '왼쪽');
            }
        }
    } else {
        this.lastKeyboardMoveTime = currentTime - this.keyboardMoveDelay;
    }

    // 패널 바닥 충돌 판정 - 명확한 값으로 수정
    const panelBottom = 535; // 패널 바닥 y좌표(535+20)
    const itemBottomY = this.currentTrashItemGraphic.y + this.currentTrashItemGraphic.height;

    // 충돌 감지 로그 추가
    if (itemBottomY >= panelBottom) {
        console.log('TYPE3 충돌 감지! itemBottomY:', itemBottomY, 'panelBottom:', panelBottom);
        this.isFalling = false;
        this.isProcessingResult = true;

        // 아이템 위치 조정 (바닥에 정확히 닿도록)
        this.currentTrashItemGraphic.y = panelBottom - this.currentTrashItemGraphic.height;

        // 정답 확인 (currentLaneIndex가 0이면 왼쪽, 1이면 오른쪽)
        const isCorrect = (this.currentLaneIndex === 0 && this.currentTrashItemGraphic.itemData.correctAnswer === 'left') ||
            (this.currentLaneIndex === 1 && this.currentTrashItemGraphic.itemData.correctAnswer === 'right');

        this.triggerResultState(this.currentLaneIndex, 'collision', isCorrect);
    }

    // 화면 밖으로 떨어졌을 때 처리 - 더 넓은 범위로 설정
    if (this.currentTrashItemGraphic.y > this.sys.game.canvas.height + 200) {
        console.log('GameScene: 화면 밖으로 떨어짐, y:', this.currentTrashItemGraphic.y);
        this.isFalling = false;
        this.isProcessingResult = true;
        this.triggerResultState(null, 'floor');
    }
}
