export class Preloader {
    constructor(scene) {
        this.scene = scene;
    }

    preload() {
        console.log('GameScene: preload 실행.');
        this.scene.load.image('panel_img', 'assets/images/mainA.png');
        this.scene.load.image('type3_panel_img', 'assets/images/mainC.png');
        this.scene.load.image('message_area_img', 'assets/images/message_board.png');
        this.scene.load.image('heart_full_img', 'assets/images/heart_full.png');
        this.scene.load.image('heart_empty_img', 'assets/images/heart_empty.png');
        this.scene.load.image('back_button_img', 'assets/images/back.png');
        this.scene.load.image('menu_button_img', 'assets/images/menu.png');
        this.scene.load.image('lane_line_img', 'assets/images/type1_line.png');
        this.scene.load.image('green_line_img', 'assets/images/right_line.png');
        this.scene.load.image('red_line_img', 'assets/images/false_line.png');

        // 라운드 UI 이미지 로드
        this.scene.load.image('round_black_img', 'assets/images/round_black.png');
        this.scene.load.image('round_gray_img', 'assets/images/round_gray.png');
        this.scene.load.image('round_connected_img', 'assets/images/round_connected.png');

        // 커맨드 버튼 이미지 로드
        this.scene.load.image('button_left_img', 'assets/images/button_left.png');
        this.scene.load.image('button_down_img', 'assets/images/button_down.png');
        this.scene.load.image('button_right_img', 'assets/images/button_right.png');
        // 커맨드 버튼 누른 상태 이미지 로드
        this.scene.load.image('button_left_pressed_img', 'assets/images/button_left_p.png');
        this.scene.load.image('button_down_pressed_img', 'assets/images/button_down_p.png');
        this.scene.load.image('button_right_pressed_img', 'assets/images/button_right_p.png');

        // 쓰레기통 이미지 로드 (닫힌 상태 및 열린 상태)
        this.scene.binKeys.forEach(key => {
            const binImageKey = `${key}_img`;
            const binImagePath = `assets/images/${key}.png`;
            this.scene.load.image(binImageKey, binImagePath);

            const binOpenImageKey = `${key}_open_img`;
            const binOpenImagePath = `assets/images/${key}_open.png`;
            this.scene.load.image(binOpenImageKey, binOpenImagePath);
        });

        // 쓰레기 아이템 이미지 로드
        this.scene.wasteRulesData.forEach(item => {
            if (item.type === 1) {
                this.scene.load.image(`${item.id}_img`, `assets/item/${item.id}.png`);
                this.scene.load.image(`${item.id}_black_img`, `assets/item/${item.id}_black.png`);
            }
            if (item.type === 3) {
                this.scene.load.image(`${item.id}_img`, `assets/item/${item.id}.png`);
                this.scene.load.image(`${item.id}_black_img`, `assets/item/${item.id}_black.png`);
            }
        });

        // Type2 아이템의 단계별 이미지 로드
        this.scene.wasteRulesData.forEach(item => {
            if (item.type === 2) {
                // 기본 이미지 (warning 포함)
                this.scene.load.image(`${item.id}_warning_img`, `assets/item/${item.id}_warning.png`);

                // 단계별 이미지
                if (item.preprocessingSteps) {
                    for (let i = 1; i <= item.preprocessingSteps.length + 1; i++) {
                        this.scene.load.image(`${item.id}_step${i}_img`, `assets/item/${item.id}_step${i}.png`);
                    }
                }

                // 전처리 완료된 이미지
                this.scene.load.image(`${item.id}_preprocessed_img`, `assets/item/${item.id}_preprocessed.png`);
            }
        });

        //type2 화면 구성 아이템 로드
        this.scene.load.image('warning_slide_img', 'assets/images/warning_animation.png');
        this.scene.load.image('popup_bg_img', 'assets/images/popup_bg.png');
        this.scene.load.image('left_key_img', 'assets/images/button_left.png');
        this.scene.load.image('down_key_img', 'assets/images/button_down.png');
        this.scene.load.image('right_key_img', 'assets/images/button_right.png');
        this.scene.load.image('left_key_dim_img', 'assets/images/left_key_dim.png');
        this.scene.load.image('down_key_dim_img', 'assets/images/down_key_dim.png');
        this.scene.load.image('right_key_dim_img', 'assets/images/right_key_dim.png');

    }
}