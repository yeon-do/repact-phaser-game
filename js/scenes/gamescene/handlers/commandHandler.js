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
                    this.scene.updateItemImage(currentKey.stepIndex + 2);
                    console.log(`새로운 상황 시작: "${currentKey.text}" - step${currentKey.stepIndex + 2} 이미지로 변경`);
                }

                // 마지막 커맨드인지 확인
                const isLastCommand = currentKeyIndex === this.scene.commandKeyImages.length - 1;

                // 즉시 메시지 창 업데이트 (커맨드 키 누르는 순간)
                this.scene.updateMessageWithCommand();

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
                            this.scene.updateMessageWithCommand();
                            console.log(`상황 "${currentKey.text}" 완료 - 텍스트 진하게 변경`);
                        }

                        // 마지막 커맨드인 경우 특별 처리
                        if (isLastCommand) {
                            this.scene.time.delayedCall(500, () => {
                                this.scene.updateToPreprocessedImage();

                                this.scene.time.delayedCall(1000, () => {
                                    this.scene.startCompletionSequence();
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

}