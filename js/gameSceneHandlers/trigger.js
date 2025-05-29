export class Trigger {
    constructor(scene) {
        this.scene = scene;
    }

    triggerResultState(itemLaneIndex, reason = 'incorrect') {
        console.log('GameScene: 결과 상태 트리거 시작! 이유:', reason, '게임타입:', this.scene.currentGameType);

        if (!this.scene.currentTrashItemGraphic) {
            console.log('GameScene: 처리할 아이템이 없습니다.');
            return;
        }

        this.scene.currentTrashItemGraphic.setActive(false);
        this.scene.lastLandedLaneIndex = (itemLaneIndex !== null) ? itemLaneIndex : this.scene.currentLaneIndex;

        let isCorrect = false;
        const itemData = this.scene.currentTrashItemData;
        let message = '';

        // Type 3 퀴즈 판정
        if (this.scene.currentGameType === 3) {
            // 왼쪽(0)이 정답인지, 오른쪽(1)이 정답인지 확인
            const correctLane = itemData.correctAnswer === 'left' ? 0 : 1;
            isCorrect = (this.scene.currentLaneIndex === correctLane);
            message = isCorrect ? itemData.messageCorrect : itemData.messageIncorrect;
        }
        // 기존 Type 1/2 판정
        else if (reason === 'collision') {
            let landedBinKey = null;
            if (itemLaneIndex !== null && itemLaneIndex >= 0 && itemLaneIndex < this.scene.binKeys.length) {
                landedBinKey = this.scene.binKeys[itemLaneIndex];
            }
            isCorrect = (landedBinKey !== null && itemData.correctBin === landedBinKey);
            message = isCorrect ? itemData.messageCorrect : itemData.messageIncorrect;
        } else if (reason === 'floor') {
            isCorrect = false;
            message = itemData.messageIncorrect;
        } else if (reason === 'correct') {
            isCorrect = true;
            message = itemData.messageCorrect;
        } else if (reason === 'incorrect') {
            isCorrect = false;
            message = itemData.messageIncorrect;
        }
        this.scene.lastResultIsCorrect = isCorrect;

        // 라인 색상 변경
        this.scene.updateLineColor(isCorrect);

        // 아이템 충돌 효과 표시
        this.scene.showItemCollisionEffect(isCorrect);

        // 메시지 표시
        if (this.scene.messageTextObject) {
            this.scene.messageTextObject.setText(message);
        }

        // 오답 시 체력 감소
        if (!isCorrect) {
            console.log('GameScene: 오답 처리 플로우 (체력 감소 등).');
            this.scene.health--;
            this.scene.updateHealthUI();

            // 게임 오버 조건 판단
            if (this.scene.health <= 0) {
                console.log('GameScene: 체력 0! 게임 오버.');
                this.scene.gameOver();
                return;
            }

            // 아이템에 적용된 모든 트윈 중지
            if (this.scene.currentTrashItemGraphic) {
                this.scene.tweens.killTweensOf(this.scene.currentTrashItemGraphic);

                // 애니메이션이 있다면 중지
                if (this.scene.currentTrashItemGraphic.anims) {
                    this.scene.currentTrashItemGraphic.anims.stop();
                }
            }

            // 약간의 딜레이 후 오답 팝업 표시
            this.scene.time.delayedCall(800, () => {
                this.scene.showIncorrectPopup();
            });
        } else {
            /// 정답일 때는 아이템 사라짐 애니메이션 적용
            this.scene.showItemCollisionEffect(isCorrect);

            // 자동으로 다음 라운드로 진행
            this.scene.time.delayedCall(this.scene.ANIMATION_TIMING.NEXT_ROUND_DELAY, () => {
                // 이미 처리되었는지 확인
                if (this.scene.isProcessingResult) {
                    this.scene.handleResult(isCorrect);
                    this.scene.proceedToNextRound();
                }
            }, [], this.scene);
        }
    }
}