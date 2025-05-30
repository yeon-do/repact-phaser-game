export class CleanupAnimationManager {
    constructor(scene) {
        this.scene = scene;
    }

    // completePreprocessing 함수는 더 이상 사용하지 않으므로 제거하고
    // startCleanupAnimation 함수를 수정
    startCleanupAnimation() {
        // 1. 먼저 아이템 이미지 페이드 아웃
        this.scene.tweens.add({
            targets: this.scene.preprocessingItemImage,
            alpha: 0,
            duration: 500,
            onComplete: () => {
                // 아이템 이미지 제거
                this.scene.preprocessingItemImage.destroy();

                // 2. warning_animation 이미지가 있다면 왼쪽으로 밀어내기
                if (this.scene.warningSlide) {
                    this.scene.tweens.add({
                        targets: this.scene.warningSlide,
                        x: -1500, // 화면 왼쪽 바깥으로 더 멀리 이동
                        duration: 1500,
                        ease: 'Power2',
                        onComplete: () => {
                            // warning_animation 이미지 제거
                            this.scene.warningSlide.destroy();

                            // 3. 회색 배경 페이드 아웃
                            this.fadeOutBackground();
                        }
                    });
                } else {
                    // warning_animation이 없는 경우 바로 배경 페이드 아웃
                    this.fadeOutBackground();
                }
            }
        });

        // 남아있는 커맨드 키 이미지들도 함께 페이드 아웃
        this.scene.commandKeyImages.forEach(keyObj => {
            if (keyObj.image && keyObj.image.active !== null) {
                this.scene.tweens.add({
                    targets: keyObj.image,
                    alpha: 0,
                    duration: 500,
                    onComplete: () => {
                        keyObj.image.destroy();
                    }
                });
            }
        });
    }

    fadeOutBackground() {
        // 회색 배경 페이드 아웃
        this.scene.tweens.add({
            targets: this.scene.preprocessingPopupBg,
            alpha: 0,
            duration: 1000,
            onComplete: () => {
                // 배경 제거
                this.scene.preprocessingPopupBg.destroy();

                // 게임 재개 준비
                this.restartGameWithPreprocessedItem();
            }
        });
    }

    restartGameWithPreprocessedItem() {
        console.log('GameScene: 전처리 완료 후 게임 재시작 시작');

        // 중요: 현재 게임 타입을 Type 1으로 변경
        this.scene.currentGameType = 1;

        // 이전 아이템 참조 저장
        const oldItem = this.scene.currentTrashItemGraphic;
        const itemData = oldItem ? {...oldItem.itemData} : null; // 데이터 깊은 복사

        // 이전 아이템 제거 (참조 정리)
        if (oldItem) {
            oldItem.setVisible(false);
            oldItem.destroy();
            this.scene.currentTrashItemGraphic = null; // 참조 제거
        }

        // 전처리된 이미지 키 확인
        const itemId = itemData ? itemData.id : null;
        const preprocessedImageKey = itemId ? `${itemId}_preprocessed_img` : null;

        if (!preprocessedImageKey || !this.scene.textures.exists(preprocessedImageKey)) {
            console.error('전처리된 이미지를 찾을 수 없음:', preprocessedImageKey);
            return;
        }

        // 새 아이템 생성 위치 설정 (더 높은 위치에서 시작)
        const firstLaneX = 70;
        const startY = 300; // 더 높은 위치에서 시작 (기존 300)

        // 완전히 새로운 아이템 객체 생성
        this.scene.currentTrashItemGraphic = this.scene.add.sprite(firstLaneX, startY, preprocessedImageKey)
            .setDisplaySize(60, 60)
            .setOrigin(0, 0)
            .setDepth(10);

        // 아이템 데이터 설정
        this.scene.currentTrashItemGraphic.itemData = itemData;

        // 디스플레이 리스트에 명시적으로 추가
        this.scene.currentTrashItemGraphic.addToDisplayList();

        // 현재 레인 인덱스 초기화
        this.scene.currentLaneIndex = 0;
        this.scene.currentOpenBinIndex = -1;

        this.scene.resetAllBins();

        // 게임 상태 재설정
        this.scene.isFalling = true;
        this.scene.isProcessingResult = false;
        this.scene.lastFallTime = this.scene.game.getTime();

        // 라인 UI 업데이트
        this.scene.updateBinVisuals(this.scene.currentLaneIndex);

        // 전처리 후 고정 메시지 표시
        if (this.scene.messageTextObject) {
            this.scene.messageTextObject.setText("자, 이제 그럼 다시 분리배출 해볼까?");
            this.scene.messageTextObject.setVisible(true);
        }

        // 전처리 후 이름으로 업데이트 (아이템이 생성된 후에 호출)
        console.log('restartGameWithPreprocessedItem에서 displayItemName 호출');
        console.log('preprocessed 이미지 키:', preprocessedImageKey);
        this.scene.itemManager.displayItemName(itemData);

        console.log('전처리 완료 후 Type 1 게임으로 재개 완료');
    }

}