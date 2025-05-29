export class Trigger {
    constructor(scene) {
        this.scene = scene;
    }

    resultState(itemLaneIndex, reason = 'incorrect') {
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
        this.updateLineColor(isCorrect);

        // 아이템 충돌 효과 표시
        this.showItemCollisionEffect(isCorrect);

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
                this.showIncorrectPopup();
            });
        } else {
            /// 정답일 때는 아이템 사라짐 애니메이션 적용
            this.showItemCollisionEffect(isCorrect);

            // 자동으로 다음 라운드로 진행
            this.scene.time.delayedCall(this.scene.ANIMATION_TIMING.NEXT_ROUND_DELAY, () => {
                // 이미 처리되었는지 확인
                if (this.scene.isProcessingResult) {
                    this.scene.handleResult(isCorrect);
                    this.proceedToNextRound();
                }
            }, [], this.scene);
        }
    }

    // 라인 색상 변경 함수
    updateLineColor(isCorrect) {
        // 기존 라인 이미지가 있으면 제거
        if (this.scene.laneIndicatorLine) {
            // 새 라인 이미지로 교체
            const lineImageKey = isCorrect ? 'green_line_img' : 'red_line_img';
            this.scene.laneIndicatorLine.setTexture(lineImageKey);
        }
        const lineX = 70 + (this.scene.currentLaneIndex * 60); // 현재 레인에 맞게 조정
        const lineY = 280;
        this.scene.laneIndicatorLine
            .setPosition(lineX, lineY)
            .setDisplaySize(60, 335);
    }

    proceedToNextRound() {
        console.log('GameScene: 다음 라운드로 진행, 현재:', this.scene.currentRound, '-> 다음:', this.scene.currentRound + 1);
        this.scene.fallCount = 0;

        if (this.scene.currentRound >= this.scene.maxRounds) {
            // 레벨 완료
            this.scene.completeLevel();
        } else {
            // 다음 라운드
            this.scene.currentRound++;
            console.log('GameScene: 라운드 증가됨 ->', this.scene.currentRound);

            // 라운드 전환 시 쓰레기통 상태 리셋
            this.scene.currentLaneIndex = 0; // 첫 번째 라인으로 초기화
            this.scene.currentOpenBinIndex = -1; // 열린 쓰레기통 인덱스 초기화
            this.scene.resetAllBins(); // 모든 쓰레기통 닫힌 상태로 리셋

            // 라운드 UI 업데이트 (텍스트 대신 이미지 사용)
            this.updateRoundsUI();

            // 현재 라운드 데이터 확인
            const nextRoundData = this.scene.roundData.find(round => round.round === this.scene.currentRound);
            console.log('GameScene: 다음 라운드 데이터:', nextRoundData);

            this.scene.spawnWasteItem();
        }
    }

    updateRoundsUI() {
        console.log('GameScene: 라운드 UI 업데이트, 현재 라운드:', this.scene.currentRound);

        const roundSize = 15;   // 원 크기 15x15
        const roundSpacing = 5; // 간격
        const firstRoundX = 80; // 첫 번째 원 X 위치

        // 각 원의 위치와 이미지 업데이트
        for (let i = 0; i < this.scene.roundGraphics.length; i++) {
            const roundImg = this.scene.roundGraphics[i];

            if (i === 0) {
                // 첫 번째 원은 항상 검정색, 위치는 그대로
                roundImg.setTexture('round_black_img');
                roundImg.setPosition(firstRoundX, 260);
            } else if (i < this.scene.currentRound) {
                // 현재 라운드 이전은 연결된 원
                roundImg.setTexture('round_connected_img');

                // 연결된 원은 간격을 메우기 위해 5픽셀 왼쪽으로 이동
                // 즉, 원래 위치에서 간격만큼 왼쪽으로 이동
                const originalX = firstRoundX + (i * (roundSize + roundSpacing));
                roundImg.setPosition(originalX - roundSpacing, 260);
            } else {
                // 현재 라운드 이후는 회색 원, 원래 위치 유지
                roundImg.setTexture('round_gray_img');
                const originalX = firstRoundX + (i * (roundSize + roundSpacing));
                roundImg.setPosition(originalX, 260);
            }
        }
    }

    gameOver() {
        console.log('GameScene: Game Over!');

        // 게임 오버 메시지 표시
        if (this.scene.messageTextObject) {
            this.scene.messageTextObject.setText('게임 오버!\n다음에 다시 도전하세요!');
        }

        // 게임 플레이 입력 비활성화
        this.scene.setGameInputEnabled(false);

        // 게임 오버 팝업 표시
        this.scene.incorrectPopupBg = this.scene.add.image(60, 240, 'popup_bg_img')
            .setDisplaySize(320, 375)
            .setOrigin(0, 0)
            .setAlpha(0)
            .setDepth(25);

        // 서서히 나타나는 애니메이션
        this.scene.tweens.add({
            targets: this.scene.incorrectPopupBg,
            alpha: 0.8,
            duration: 800,
            ease: 'Linear',
            onComplete: () => {
                // 게임 오버 텍스트 표시
                const gameOverText = this.scene.add.text(220, 350, '게임 오버', {
                    font: '32px "머니그라피"',
                    fill: '#ffffff',
                    align: 'center'
                })
                    .setOrigin(0.5)
                    .setDepth(26);

                // 다시 시작 버튼
                const restartButton = this.scene.add.rectangle(220, 450, 180, 60, 0x0000ff)
                    .setInteractive()
                    .setDepth(26);

                const restartText = this.scene.add.text(220, 450, '다시 시작', {
                    font: '24px "머니그라피"',
                    fill: '#ffffff',
                    align: 'center'
                })
                    .setOrigin(0.5)
                    .setDepth(27);

                // 버튼 클릭 이벤트
                restartButton.on('pointerdown', () => {
                    this.scene.scene.start('BootScene');
                });
            }
        });
    }

    // showIncorrectPopup 함수 수정
    showIncorrectPopup() {
        // 기존 팝업이 있으면 먼저 제거
        if (this.scene.incorrectPopupBg) {
            this.scene.incorrectPopupBg.destroy();
            this.scene.incorrectPopupBg = null;
        }

        // 팝업 배경 생성 (처음에는 투명하게)
        this.scene.incorrectPopupBg = this.scene.add.image(60, 240, 'popup_bg_img')
            .setDisplaySize(320, 375)
            .setOrigin(0, 0)
            .setAlpha(0)
            .setDepth(25);

        console.log('새 팝업 배경 생성:', this.scene.incorrectPopupBg.texture.key);

        // 서서히 나타나는 애니메이션
        this.scene.tweens.add({
            targets: this.scene.incorrectPopupBg,
            alpha: 0.8, // 약간 투명하게 설정
            duration: 800,
            ease: 'Linear',
            onComplete: () => {
                // 팝업 배경 표시 완료 후 다시하기 버튼 생성
                this.scene.time.delayedCall(300, () => {
                    this.scene.createRetryButton();
                });
            }
        });
    }

    createRetryButton() {
        // 버튼 위치 계산 (팝업 중앙 하단)
        const buttonX = 60 + 320 / 2;
        const buttonY = 240 + 375 - 60;

        // 버튼 생성
        this.scene.retryButton = this.scene.add.rectangle(buttonX, buttonY, 150, 50, 0xff0000)
            .setInteractive()
            .setDepth(26);

        // 버튼 텍스트
        this.scene.retryButtonText = this.scene.add.text(buttonX, buttonY, '다시 하기', {
            font: '20px "머니그라피"',
            fill: '#ffffff',
            align: 'center'
        })
            .setOrigin(0.5)
            .setDepth(27);

        // 버튼 클릭 이벤트
        this.scene.retryButton.on('pointerdown', () => {
            // 모든 팝업 요소 제거
            this.scene.hideIncorrectPopup();

            // 게임 상태 초기화 후 재시작
            this.scene.time.delayedCall(300, () => {
                this.scene.resetCurrentRound();
            });
        });
    }

    // 오답 팝업 숨기기 함수
    hideIncorrectPopup() {
        console.log('팝업 숨김 시작');

        // 버튼 즉시 제거
        if (this.scene.retryButton) {
            this.scene.retryButton.destroy();
            this.scene.retryButton = null;
        }

        if (this.scene.retryButtonText) {
            this.scene.retryButtonText.destroy();
            this.scene.retryButtonText = null;
        }

        // 아이템 즉시 제거
        if (this.scene.currentTrashItemGraphic) {
            this.scene.currentTrashItemGraphic.destroy();
            this.scene.currentTrashItemGraphic = null;
        }

        // 트윈 사용 대신 즉시 제거
        if (this.scene.incorrectPopupBg) {
            console.log('팝업 배경 즉시 제거');
            this.scene.incorrectPopupBg.destroy();
            this.scene.incorrectPopupBg = null;
        }

        // 모든 객체 제거 후 게임 재시작
        console.log('팝업 숨김 완료, 게임 재시작');
        this.scene.resetCurrentRound();
    }

    // 아이템 충돌 효과 함수
    // showItemCollisionEffect 함수 수정
    showItemCollisionEffect(isCorrect) {
        if (!this.scene.currentTrashItemGraphic) return;

        // 아이템 객체 참조 저장
        const itemGraphic = this.scene.currentTrashItemGraphic;
        /*
                // 2초 후에 서서히 검정색으로 변환 시작
                this.scene.time.delayedCall(700, () => {
                    // 객체가 여전히 존재하는지 확인
                    if (!itemGraphic || !itemGraphic.scene) return;

                    // 서서히 검정색으로 변하는 효과
                    this.scene.tweens.add({
                        targets: itemGraphic,
                        tint: 0x000000, // 검정색으로 변환
                        duration: 1500, // 1.5초에 걸쳐 서서히 검정색으로
                        ease: 'Power2',
                        onComplete: () => {
                            // 검정색 변환 완료 후 검정 오브젝트 이미지로 교체 (선택사항)
                            const itemData = this.scene.currentTrashItemData;
                            let blackImageKey;

                            if (this.scene.currentGameType === 2 && isCorrect) {
                                blackImageKey = `${itemData.id}_preprocessed_black_img`;
                            } else {
                                blackImageKey = `${itemData.id}_black_img`;
                            }

                            if (this.scene.textures.exists(blackImageKey)) {
                                itemGraphic.setTexture(blackImageKey);
                                itemGraphic.clearTint(); // 틴트 제거하고 원본 검정 이미지 사용
                            }

                            // 서서히 사라지는 효과
                            this.scene.tweens.add({
                                targets: itemGraphic,
                                alpha: 0,
                                duration: this.scene.ANIMATION_TIMING.FADE_OUT_DURATION,
                                ease: 'Power2',
                                onComplete: () => {
                                    if (itemGraphic && itemGraphic.scene) {
                                        itemGraphic.destroy();
                                    }
                                    if (this.scene.currentTrashItemGraphic === itemGraphic) {
                                        this.scene.currentTrashItemGraphic = null;
                                    }
                                }
                            });
                        }
                    });
                });
            }*/

        // 1. 아이템 깜박임 효과
        this.scene.tweens.add({
            targets: itemGraphic,
            alpha: 0.5,
            duration: this.scene.ANIMATION_TIMING.BLINK_DURATION,
            yoyo: true,
            repeat: this.scene.ANIMATION_TIMING.BLINK_COUNT,
            onComplete: () => {
                // 객체가 여전히 존재하는지 확인
                if (!itemGraphic || !itemGraphic.scene) return;

                // 2. 검정 오브젝트로 변환
                const itemData = this.scene.currentTrashItemData;
                let blackImageKey;

                if (this.scene.currentGameType === 2 && isCorrect) {
                    blackImageKey = `${itemData.id}_preprocessed_black_img`;
                } else {
                    blackImageKey = `${itemData.id}_black_img`;
                }

                if (this.scene.textures.exists(blackImageKey)) {
                    itemGraphic.setTexture(blackImageKey);
                }

                // 3. 서서히 사라지는 효과
                this.scene.tweens.add({
                    targets: itemGraphic,
                    alpha: 0,
                    duration: this.scene.ANIMATION_TIMING.FADE_OUT_DURATION,
                    ease: 'Power2',
                    onComplete: () => {
                        // 객체가 여전히 존재하는지 확인
                        if (itemGraphic && itemGraphic.scene) {
                            itemGraphic.destroy();
                        }

                        // currentTrashItemGraphic 참조 업데이트
                        if (this.scene.currentTrashItemGraphic === itemGraphic) {
                            this.scene.currentTrashItemGraphic = null;
                        }
                    }
                });
            }
        });
    }
}