import BootScene from './scenes/BootScene.js';
import GameScene from './scenes/gamescene/gameScene.js';

// 게임 설정 (config)
const config = {
    type: Phaser.AUTO,
    parent: 'game-container',
    width: 440,
    height: 956,
    backgroundColor: '#3cbb89',
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        // 최소 크기 설정 (선택 사항)
        min: {
            width: 220,
            height: 478
        },
        // 최대 크기 설정 (선택 사항)
        max: {
            width: 440,
            height: 956
        }
    },
    // 터치 캡처 비활성화 추가
    input: {
        touch: {
            capture: false
        }
    },
    scene: [
        BootScene,
        GameScene
    ]
};

export default config