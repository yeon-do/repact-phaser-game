export class Type3Handler {
    constructor(scene) {
        this.scene = scene
    }

    update(time, delta) {
        if (!this.scene.currentTrashItemGraphic || !this.scene.isFalling) return;

        const currentTime = time;
        const {width, height} = this.scene.sys.game.canvas;

        // 픽셀 단위 낙하를 위한 타이머 확인
        if (!this.scene.lastFallTime) {
            this.scene.lastFallTime = currentTime;
        }

        // 낙하 로직
        let fallInterval = 500;
        if (this.scene.cursors.down.isDown || this.scene.moveDownFast) {
            fallInterval = fallInterval / this.scene.fastFallMultiplier;
        }

        if (currentTime - this.scene.lastFallTime >= fallInterval) {
            this.scene.currentTrashItemGraphic.y += 20;
            this.scene.lastFallTime = currentTime;
        }

        // 좌우 이동 로직
        if (this.scene.cursors.left.isDown || this.scene.moveLeft || this.scene.cursors.right.isDown || this.scene.moveRight) {
            if (currentTime - this.scene.lastKeyboardMoveTime > this.scene.keyboardMoveDelay) {
                const newLaneIndex = (this.scene.cursors.left.isDown || this.scene.moveLeft) ? 0 : 1;
                if (this.scene.currentLaneIndex !== newLaneIndex) {
                    this.scene.currentLaneIndex = newLaneIndex;
                    const leftX = 110;
                    const rightX = 270;
                    const targetX = (this.scene.currentLaneIndex === 0) ? leftX : rightX;
                    this.scene.currentTrashItemGraphic.x = targetX;
                    this.scene.lastKeyboardMoveTime = currentTime;
                    console.log('GameScene: Type 3 아이템 이동 ->', this.scene.currentLaneIndex ? '오른쪽' : '왼쪽');
                }
            }
        } else {
            this.scene.lastKeyboardMoveTime = currentTime - this.scene.keyboardMoveDelay;
        }

        // 패널 바닥 충돌 판정 - 명확한 값으로 수정
        const panelBottom = 535; // 패널 바닥 y좌표(535+20)
        const itemBottomY = this.scene.currentTrashItemGraphic.y + this.scene.currentTrashItemGraphic.height;

        // 충돌 감지 로그 추가
        if (itemBottomY >= panelBottom) {
            console.log('TYPE3 충돌 감지! itemBottomY:', itemBottomY, 'panelBottom:', panelBottom);
            this.scene.isFalling = false;
            this.scene.isProcessingResult = true;

            // 아이템 위치 조정 (바닥에 정확히 닿도록)
            this.scene.currentTrashItemGraphic.y = panelBottom - this.scene.currentTrashItemGraphic.height;

            // 정답 확인 (currentLaneIndex가 0이면 왼쪽, 1이면 오른쪽)
            const isCorrect = (this.scene.currentLaneIndex === 0 && this.scene.currentTrashItemGraphic.itemData.correctAnswer === 'left') ||
                (this.scene.currentLaneIndex === 1 && this.scene.currentTrashItemGraphic.itemData.correctAnswer === 'right');

            this.scene.trigger.resultState(this.scene.currentLaneIndex, 'collision', isCorrect);
        }

        // 화면 밖으로 떨어졌을 때 처리 - 더 넓은 범위로 설정
        if (this.scene.currentTrashItemGraphic.y > this.scene.sys.game.canvas.height + 200) {
            console.log('GameScene: 화면 밖으로 떨어짐, y:', this.scene.currentTrashItemGraphic.y);
            this.scene.isFalling = false;
            this.scene.isProcessingResult = true;
            this.scene.trigger.resultState(null, 'floor');
        }
    }
}