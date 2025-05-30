export class CommandHandler {
    constructor(scene) {
        this.scene = scene;
    }

    handlePreprocessingCommand(action) {
        try {
            // 활성화된 첫 번째 커맨드 키 찾기
            const currentKeyIndex = this.scene.commandKeyImages.findIndex(key => key.active);

            if (currentKeyIndex === -1) {
                console.log('활성화된 커맨드 키가 없음');
                return;
            }

            const currentKey = this.scene.commandKeyImages[currentKeyIndex];

            // 액션 일치 확인
            if (currentKey.action === action) {
                console.log('올바른 키 입력:', action);

                // 새로운 상황의 첫 번째 커맨드인지 확인
                const isFirstCommandOfNewStep = currentKeyIndex === 0 ||
                    (currentKeyIndex > 0 &&
                        this.scene.commandKeyImages[currentKeyIndex].stepIndex !==
                        this.scene.commandKeyImages[currentKeyIndex - 1].stepIndex);

                // 새로운 상황 시작 시 이미지 변경
                if (isFirstCommandOfNewStep) {
                    this.updateItemImage(currentKey.stepIndex + 2);
                    console.log(`새로운 상황 시작: "${currentKey.text}" - step${currentKey.stepIndex + 2} 이미지로 변경`);
                }

                // 마지막 커맨드인지 확인
                const isLastCommand = currentKeyIndex === this.scene.commandKeyImages.length - 1;

                // 즉시 메시지 창 업데이트 (커맨드 키 누르는 순간)
                this.updateMessageWithCommand();

                // 키 이미지 날아가는 애니메이션 (동시에 시작)
                this.scene.tweens.add({
                    targets: currentKey.image,
                    y: currentKey.image.y - 50,
                    alpha: 0,
                    duration: 500,
                    onComplete: () => {
                        // 이미지 제거
                        if (currentKey.image) {
                            currentKey.image.destroy();
                            currentKey.image = null;
                        }

                        // 다음 커맨드 키들 앞으로 당기기
                        for (let i = currentKeyIndex + 1; i < this.scene.commandKeyImages.length; i++) {
                            const key = this.scene.commandKeyImages[i];
                            if (key.image) {
                                this.scene.tweens.add({
                                    targets: key.image,
                                    x: 240 + ((i - currentKeyIndex - 1) * 24),
                                    duration: 300
                                });
                            }
                        }

                        // 현재 키 비활성화
                        currentKey.active = false;

                        // 상황 완료 여부 확인 후 텍스트 진하게 변경
                        const remainingCommandsInStep = this.scene.commandKeyImages.filter(key =>
                            key.stepIndex === currentKey.stepIndex &&
                            key.image &&
                            !key.image.destroyed &&
                            this.scene.commandKeyImages.indexOf(key) > currentKeyIndex);

                        if (remainingCommandsInStep.length === 0) {
                            // 상황 완료 시 텍스트 진하게 변경
                            this.updateMessageWithCommand();
                            console.log(`상황 "${currentKey.text}" 완료 - 텍스트 진하게 변경`);
                        }

                        // 마지막 커맨드인 경우 특별 처리
                        if (isLastCommand) {
                            this.scene.time.delayedCall(500, () => {
                                this.updateToPreprocessedImage();

                                this.scene.time.delayedCall(1000, () => {
                                    this.startCompletionSequence();
                                });
                            });
                        } else {
                            // 다음 키 활성화
                            const nextKey = this.scene.commandKeyImages[currentKeyIndex + 1];
                            nextKey.active = true;

                            // 다음 키 활성화 이미지로 변경
                            if (nextKey.image) {
                                let activeKeyImageKey;
                                switch (nextKey.action) {
                                    case 'left':
                                        activeKeyImageKey = 'left_key_img';
                                        break;
                                    case 'down':
                                        activeKeyImageKey = 'down_key_img';
                                        break;
                                    case 'right':
                                        activeKeyImageKey = 'right_key_img';
                                        break;
                                    default:
                                        activeKeyImageKey = 'down_key_img';
                                }

                                if (this.scene.textures.exists(activeKeyImageKey)) {
                                    nextKey.image.setTexture(activeKeyImageKey);
                                    nextKey.image.setDisplaySize(40, 43);
                                }
                            }
                        }
                    }
                });
            } else {
                // 잘못된 키 입력 - 흔들림 효과
                if (currentKey.image) {
                    this.scene.tweens.add({
                        targets: currentKey.image,
                        x: currentKey.image.x + 5,
                        duration: 50,
                        yoyo: true,
                        repeat: 3
                    });
                }
            }
        } catch (error) {
            console.error('커맨드 처리 중 오류:', error);
        }
    }

    startCompletionSequence() {
        try {
            // 누적된 텍스트 제거
            this.clearMessageBoard();

            // 전처리 완료 메시지 표시
            if (this.scene.messageTextObject && this.scene.currentTrashItemData.messagePreprocessingComplete) {
                this.scene.messageTextObject.setVisible(true);
                this.scene.messageTextObject.setText(this.scene.currentTrashItemData.messagePreprocessingComplete);
            }

            // 동시에 전처리 이미지 서서히 사라지게 하기
            if (this.scene.preprocessingItemImage) {
                this.scene.tweens.add({
                    targets: this.scene.preprocessingItemImage,
                    alpha: 0,
                    duration: 2000, // 2초에 걸쳐 서서히 사라짐
                    onComplete: () => {
                        // 이미지가 완전히 사라진 후 다음 단계로
                        this.scene.time.delayedCall(500, () => {
                            this.scene.startCleanupAnimation();
                        });
                    }
                });
            } else {
                // 이미지가 없는 경우 바로 다음 단계로
                this.scene.time.delayedCall(2000, () => {
                    this.scene.startCleanupAnimation();
                });
            }

            console.log('전처리 완료 시퀀스 시작');
        } catch (error) {
            console.error('완료 시퀀스 중 오류:', error);
        }
    }

    updateMessageWithCommand() {
        try {
            // 기존 커맨드 키 이미지와 텍스트 제거
            if (this.scene.messageCommandImages && this.scene.messageCommandImages.length > 0) {
                this.scene.messageCommandImages.forEach(img => {
                    if (img && !img.destroyed) img.destroy();
                });
            }
            this.scene.messageCommandImages = [];

            if (this.scene.messageTexts && this.scene.messageTexts.length > 0) {
                this.scene.messageTexts.forEach(txt => {
                    if (txt && !txt.destroyed) txt.destroy();
                });
            }
            this.scene.messageTexts = [];

            // 메시지 텍스트 객체 숨기기
            if (this.scene.messageTextObject) {
                this.scene.messageTextObject.setVisible(false);
            }

            // 시작 위치 설정
            let currentX = 87;
            let currentY = 665;
            let lineCount = 0;
            const maxStepsPerLine = 2; // 한 줄에 최대 2개 상황

            // 현재까지 진행된 모든 단계 표시
            const processedSteps = new Set();

            // 완료된 단계와 현재 진행 중인 단계 찾기
            for (const key of this.scene.commandKeyImages) {
                if (!key.image || key.image.destroyed) {
                    // 완료된 커맨드의 단계 추가
                    processedSteps.add(key.stepIndex);
                } else if (key.active) {
                    // 현재 활성화된 커맨드의 단계 추가
                    processedSteps.add(key.stepIndex);
                }
            }

            // 단계별로 그룹화하여 표시
            const sortedSteps = Array.from(processedSteps).sort((a, b) => a - b);

            for (const stepIndex of sortedSteps) {
                // 한 줄에 2개 상황이 이미 있으면 다음 줄로
                if (lineCount >= maxStepsPerLine && stepIndex > 0) {
                    currentX = 87;
                    currentY += 32; // 다음 줄로 이동
                    lineCount = 0;
                }

                // 해당 단계의 모든 커맨드 가져오기
                const stepCommands = this.scene.commandKeyImages.filter(key => key.stepIndex === stepIndex);

                if (stepCommands.length === 0) continue;

                // 단계 완료 여부 확인 (모든 커맨드가 완료되었는지)
                const isStepCompleted = stepCommands.every(cmd => !cmd.image || cmd.image.destroyed);

                // 현재 진행 중인 단계이고 단일 커맨드인 경우 즉시 진하게 표시
                const isCurrentStepWithSingleCommand = stepCommands.some(cmd => cmd.active) && stepCommands.length === 1;

                // 텍스트 스타일 결정
                const textStyle = {
                    font: '16px 머니그라피',
                    fill: (isStepCompleted || isCurrentStepWithSingleCommand) ? '#303030' : '#C8C8C8',
                    fontStyle: (isStepCompleted || isCurrentStepWithSingleCommand) ? 'bold' : 'normal'
                };

                // 각 커맨드 키 이미지 추가 (패널과 동일한 이미지 사용)
                for (const command of stepCommands) {
                    let keyImageKey;

                    // 이미지 키 결정 (패널과 동일한 이미지 키 사용)
                    if (!command.image || command.image.destroyed) {
                        // 완료된 커맨드 (패널과 동일한 활성화 이미지)
                        switch (command.action) {
                            case 'left':
                                keyImageKey = 'left_key_img';
                                break;
                            case 'down':
                                keyImageKey = 'down_key_img';
                                break;
                            case 'right':
                                keyImageKey = 'right_key_img';
                                break;
                            default:
                                keyImageKey = 'down_key_img';
                        }
                    } else {
                        // 진행 중인 커맨드 (패널과 동일한 이미지)
                        switch (command.action) {
                            case 'left':
                                keyImageKey = command.active ? 'left_key_img' : 'left_key_dim_img';
                                break;
                            case 'down':
                                keyImageKey = command.active ? 'down_key_img' : 'down_key_dim_img';
                                break;
                            case 'right':
                                keyImageKey = command.active ? 'right_key_img' : 'right_key_dim_img';
                                break;
                            default:
                                keyImageKey = command.active ? 'down_key_img' : 'down_key_dim_img';
                        }
                    }

                    // 키 이미지 생성 (20x20 크기)
                    const keyImage = this.scene.add.image(currentX, currentY, keyImageKey)
                        .setDisplaySize(20, 20)
                        .setOrigin(0, 0)
                        .setDepth(20);

                    // 색상 설정은 제거 (패널과 동일하게)
                    // if (command.color) {
                    //     try {
                    //         const colorValue = parseInt(command.color.replace('#', '0x'));
                    //         keyImage.setTint(colorValue);
                    //     } catch (e) {
                    //         console.error('색상 설정 오류:', e);
                    //     }
                    // }

                    this.scene.messageCommandImages.push(keyImage);

                    // X 위치 업데이트
                    currentX += 20; // 키 이미지 너비(20) + 간격(5)
                }

                // 텍스트 추가
                const stepText = this.scene.add.text(currentX, currentY, stepCommands[0].text, textStyle)
                    .setOrigin(0, 0)
                    .setDepth(20);

                this.scene.messageTexts.push(stepText);

                // X 위치 업데이트
                currentX += stepText.width + 10; // 텍스트 너비 + 간격(10)

                // 라인 카운트 증가
                lineCount++;
            }

            console.log('메시지 창 업데이트 완료');

        } catch (error) {
            console.error('메시지 창 업데이트 중 오류:', error);
        }
    }


    updateToPreprocessedImage() {
        try {
            // preprocessed 이미지로 변경 (기존 step 변경과 동일한 방식)
            const itemId = this.scene.currentTrashItemGraphic.itemData.id;
            const preprocessedImageKey = `${itemId}_preprocessed_img`;

            // 원본 이미지 크기 저장
            const originalWidth = this.scene.preprocessingItemImage.displayWidth;
            const originalHeight = this.scene.preprocessingItemImage.displayHeight;

            // preprocessed 이미지가 있으면 변경 (step 변경과 동일한 방식)
            if (this.scene.textures.exists(preprocessedImageKey)) {
                this.scene.preprocessingItemImage.setTexture(preprocessedImageKey);
                // 원본 크기 유지
                this.scene.preprocessingItemImage.setDisplaySize(originalWidth, originalHeight);
                console.log(`전처리 완료 이미지로 변경: ${preprocessedImageKey}`);
            } else {
                console.log(`전처리 완료 이미지 없음: ${preprocessedImageKey} (기본 이미지 유지)`);
            }
        } catch (error) {
            console.error('전처리 완료 이미지 업데이트 중 오류:', error);
        }
    }


    updateItemImage(stepNumber) {
        try {
            // 상황 단위로 이미지 업데이트 (step1, step2, step3, step4)
            const itemId = this.scene.currentTrashItemGraphic.itemData.id;
            const stepImageKey = `${itemId}_step${stepNumber}_img`;

            // 원본 이미지 크기 저장
            const originalWidth = this.scene.preprocessingItemImage.displayWidth;
            const originalHeight = this.scene.preprocessingItemImage.displayHeight;

            // 해당 단계 이미지가 있으면 변경, 없으면 그대로
            if (this.scene.textures.exists(stepImageKey)) {
                this.scene.preprocessingItemImage.setTexture(stepImageKey);
                // 원본 크기 유지
                this.scene.preprocessingItemImage.setDisplaySize(originalWidth, originalHeight);
                console.log(`전처리 이미지 업데이트: ${stepImageKey}`);
            } else {
                console.log(`전처리 이미지 없음: ${stepImageKey} (기본 이미지 유지)`);
            }
        } catch (error) {
            console.error('전처리 이미지 업데이트 중 오류:', error);
        }
    }



    // 메시지 보드 정리 함수 추가 (completePreprocessing 함수 앞에 추가)
    clearMessageBoard() {
        try {
            // 메시지 커맨드 이미지들 제거
            if (this.scene.messageCommandImages && this.scene.messageCommandImages.length > 0) {
                this.scene.messageCommandImages.forEach(img => {
                    if (img && !img.destroyed) img.destroy();
                });
            }
            this.scene.messageCommandImages = [];

            // 메시지 텍스트들 제거
            if (this.scene.messageTexts && this.scene.messageTexts.length > 0) {
                this.scene.messageTexts.forEach(txt => {
                    if (txt && !txt.destroyed) txt.destroy();
                });
            }
            this.scene.messageTexts = [];

            console.log('메시지 보드 정리 완료');
        } catch (error) {
            console.error('메시지 보드 정리 중 오류:', error);
        }
    }

}