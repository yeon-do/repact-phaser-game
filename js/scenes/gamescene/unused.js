/*
    updateMessageWithCommand() {
        try {
            // 기존 커맨드 키 이미지와 텍스트 제거
            if (this.messageCommandImages && this.messageCommandImages.length > 0) {
                this.messageCommandImages.forEach(img => {
                    if (img && !img.destroyed) img.destroy();
                });
            }
            this.messageCommandImages = [];

            if (this.messageTexts && this.messageTexts.length > 0) {
                this.messageTexts.forEach(txt => {
                    if (txt && !txt.destroyed) txt.destroy();
                });
            }
            this.messageTexts = [];

            // 메시지 텍스트 객체 숨기기
            if (this.messageTextObject) {
                this.messageTextObject.setVisible(false);
            }

            // 시작 위치 설정
            let currentX = 87;
            let currentY = 665;
            let lineCount = 0;
            const maxStepsPerLine = 2; // 한 줄에 최대 2개 상황

            // 현재까지 진행된 모든 단계 표시
            const processedSteps = new Set();

            // 완료된 단계와 현재 진행 중인 단계 찾기
            for (const key of this.commandKeyImages) {
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
                    currentY += 30; // 다음 줄로 이동
                    lineCount = 0;
                }

                // 해당 단계의 모든 커맨드 가져오기
                const stepCommands = this.commandKeyImages.filter(key => key.stepIndex === stepIndex);

                if (stepCommands.length === 0) continue;

                // 단계 완료 여부 확인 (모든 커맨드가 완료되었는지)
                const isStepCompleted = stepCommands.every(cmd => !cmd.image || cmd.image.destroyed);

                // 현재 진행 중인 단계이고 단일 커맨드인 경우 즉시 진하게 표시
                const isCurrentStepWithSingleCommand = stepCommands.some(cmd => cmd.active) && stepCommands.length === 1;

                // 텍스트 스타일 결정
                const textStyle = {
                    font: '16px Arial',
                    fill: (isStepCompleted || isCurrentStepWithSingleCommand) ? '#000000' : '#666666',
                    fontStyle: (isStepCompleted || isCurrentStepWithSingleCommand) ? 'bold' : 'normal'
                };

                // 각 커맨드 키 이미지 추가
                for (const command of stepCommands) {
                    let keyImageKey;

                    // 이미지 키 결정
                    if (!command.image || command.image.destroyed) {
                        // 완료된 커맨드
                        switch (command.action) {
                            case 'left': keyImageKey = 'left_key_img'; break;
                            case 'down': keyImageKey = 'down_key_img'; break;
                            case 'right': keyImageKey = 'right_key_img'; break;
                            default: keyImageKey = 'down_key_img';
                        }
                    } else {
                        // 진행 중인 커맨드
                        switch (command.action) {
                            case 'left': keyImageKey = command.active ? 'left_key_img' : 'left_key_dim_img'; break;
                            case 'down': keyImageKey = command.active ? 'down_key_img' : 'down_key_dim_img'; break;
                            case 'right': keyImageKey = command.active ? 'right_key_img' : 'right_key_dim_img'; break;
                            default: keyImageKey = command.active ? 'down_key_img' : 'down_key_dim_img';
                        }
                    }

                    // 키 이미지 생성 (20x20 크기)
                    const keyImage = this.add.image(currentX, currentY, keyImageKey)
                        .setDisplaySize(20, 20)
                        .setOrigin(0, 0.5)
                        .setDepth(20);

                    // 색상 설정 (있는 경우)
                    if (command.color) {
                        try {
                            const colorValue = parseInt(command.color.replace('#', '0x'));
                            keyImage.setTint(colorValue);
                        } catch (e) {
                            console.error('색상 설정 오류:', e);
                        }
                    }

                    this.messageCommandImages.push(keyImage);

                    // X 위치 업데이트
                    currentX += 25; // 키 이미지 너비(20) + 간격(5)
                }

                // 텍스트 추가
                const stepText = this.add.text(currentX, currentY, stepCommands[0].text, textStyle)
                    .setOrigin(0, 0.5)
                    .setDepth(20);

                this.messageTexts.push(stepText);

                // X 위치 업데이트
                currentX += stepText.width + 10; // 텍스트 너비 + 간격(10)

                // 라인 카운트 증가
                lineCount++;
            }

            console.log('메시지 창 업데이트 완료');
        } catch (error) {
            console.error('메시지 창 업데이트 중 오류:', error);
        }
    }*/



// activateNextCommandKey() {
//     // 현재 활성화할 커맨드 키 인덱스 계산
//     let currentKeyIndex = 0;
//     let found = false;
//
//     for (let i = 0; i < this.commandKeyImages.length; i++) {
//         const key = this.commandKeyImages[i];
//         if (!key.active) {
//             currentKeyIndex = i;
//             found = true;
//             break;
//         }
//     }
//
//     // 모든 키가 이미 활성화되었으면 완료
//     if (!found) {
//         this.completePreprocessing();
//         return;
//     }
//
//     // 현재 키 활성화
//     const currentKey = this.commandKeyImages[currentKeyIndex];
//
//     // 활성화 이미지 키 결정
//     let activeKeyImageKey;
//     switch (currentKey.action) {
//         case 'left':
//             activeKeyImageKey = 'left_key_img';
//             break;
//         case 'down':
//             activeKeyImageKey = 'down_key_img';
//             break;
//         case 'right':
//             activeKeyImageKey = 'right_key_img';
//             break;
//         default:
//             activeKeyImageKey = 'down_key_img';
//     }
//
//     // 키 이미지 변경
//     if (currentKey.image && !currentKey.image.destroyed) {
//         try {
//             currentKey.image.setTexture(activeKeyImageKey);
//             currentKey.active = true;
//         } catch (error) {
//             console.error('텍스처 설정 중 오류:', error);
//         }
//     }
// }
//
//
// activateCommandKey(stepIndex, commandIndex) {
//     // 모든 단계가 완료되었는지 확인
//     if (stepIndex >= this.preprocessingSteps.length) {
//         this.completePreprocessing();
//         return;
//     }
//
//     // 현재 단계 및 커맨드 인덱스 설정
//     this.currentPreprocessingStep = stepIndex;
//     this.currentCommandIndex = commandIndex;
//
//     // 현재 커맨드 키 찾기
//     const currentKeyObj = this.commandKeyImages.find(key =>
//         key.stepIndex === stepIndex && key.commandIndex === commandIndex);
//
//     if (currentKeyObj) {
//         // 활성화 이미지로 변경
//         let activeKeyImageKey;
//         switch (currentKeyObj.command.action) {
//             case 'left':
//                 activeKeyImageKey = 'left_key_img';
//                 break;
//             case 'down':
//                 activeKeyImageKey = 'down_key_img';
//                 break;
//             case 'right':
//                 activeKeyImageKey = 'right_key_img';
//                 break;
//             default:
//                 activeKeyImageKey = 'down_key_img';
//         }
//
//         currentKeyObj.image.setTexture(activeKeyImageKey);
//         currentKeyObj.active = true;
//     }
//
//     // 메시지 창은 첫 커맨드 입력 후에만 표시
// }
//
//
// activateNextCommandKey() {
//     if (this.currentPreprocessingStep >= this.preprocessingSteps.length) {
//         // 모든 단계 완료
//         this.completePreprocessing();
//         return;
//     }
//
//     // 현재 단계의 커맨드 키 활성화
//     const currentKeyObj = this.commandKeyImages[this.currentPreprocessingStep];
//     const step = this.preprocessingSteps[this.currentPreprocessingStep];
//     let activeKeyImageKey;
//
//     // 밝은 이미지 키 결정
//     switch (step.action) {
//         case 'left':
//             activeKeyImageKey = 'left_key_img';
//             break;
//         case 'down':
//             activeKeyImageKey = 'down_key_img';
//             break;
//         case 'right':
//             activeKeyImageKey = 'right_key_img';
//             break;
//         default:
//             activeKeyImageKey = 'down_key_img';
//     }
//
//     // 1초 후 키 이미지 변경 (흐린 이미지 -> 밝은 이미지)
//     this.time.delayedCall(700, () => {
//         currentKeyObj.image.setTexture(activeKeyImageKey);
//         currentKeyObj.image.setDisplaySize(40, 43);
//         currentKeyObj.image.setAlpha(1);
//         currentKeyObj.active = true;
//
//         // 메시지 창 업데이트 (현재 커맨드 이미지 추가)
//         this.updateMessageWithCommand(step);
//     });
// }


// resetItemForRetry() {
//     console.log('GameScene: 같은 아이템으로 다시 출제.');
//     this.hideResultUI();
//
//     // 현재 게임 타입에 따라 다시 스폰
//     if (this.currentGameType === 1) {
//         this.spawnType1Item(this.currentTrashItemData);
//     } else if (this.currentGameType === 2) {
//         this.spawnType2Item(this.currentTrashItemData);
//     } else if (this.currentGameType === 3) {
//         this.spawnType3Item(this.currentTrashItemData);
//     }
// }
