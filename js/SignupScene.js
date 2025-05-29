class SignupScene extends Phaser.Scene {
    constructor() {
        super('SignupScene');
    }

    preload() {
        this.load.image('signup_background', './assets/images/main_background.png');
        this.load.image('signup_white_bar', './assets/images/white_bar.png');
    }

    create() {
        const { width, height } = this.sys.game.canvas;

        // 배경 이미지
        this.add.image(0, 0, 'signup_background')
            .setOrigin(0)
            .setDisplaySize(width, height);

        // 제목
        this.add.text(width / 2, height * 0.2, '회원가입', {
            font: '32px "머니그라피"',
            fill: '#ffffff',
            align: 'center'
        }).setOrigin(0.5);

        // 입력 필드 설정
        const inputBgWidth = 360;
        const inputBgHeight = 50;
        const inputY = height * 0.51; // 
        const inputSpacing = 60;

        // ID 입력
        const idBg = this.add.image(width / 2, inputY, 'signup_white_bar')
            .setDisplaySize(360, 50)
            .setInteractive();
        const idText = this.add.text(width / 2, inputY, 'ID를 입력하세요', {
            font: '20px "머니그라피"',
            fill: '#666666'
        }).setOrigin(0.5);

        // 비밀번호 입력
        const pwBg = this.add.image(width / 2, inputY + inputSpacing, 'signup_white_bar')
            .setDisplaySize(360, 50)
            .setInteractive();
        const pwText = this.add.text(width / 2, inputY + inputSpacing, '비밀번호를 입력하세요', {
            font: '20px "머니그라피"',
            fill: '#666666'
        }).setOrigin(0.5);

        // 비밀번호 확인
        const pwConfirmBg = this.add.image(width / 2, inputY + inputSpacing * 2, 'signup_white_bar')
            .setDisplaySize(360, 50)
            .setInteractive();
        const pwConfirmText = this.add.text(width / 2, inputY + inputSpacing * 2, '비밀번호 확인', {
            font: '20px "머니그라피"',
            fill: '#666666'
        }).setOrigin(0.5);

        // 커서 깜빡임 효과
        const cursor = this.add.text(0, 0, '|', { 
            font: '20px "머니그라피"',
            fill: '#666666'
        }).setVisible(false).setOrigin(0.5);

        this.tweens.add({
            targets: cursor,
            alpha: 0,
            duration: 500,
            yoyo: true,
            repeat: -1
        });

        // 활성화된 입력 필드 추적
        this.activeInput = null;

        // 입력 필드 클릭 이벤트 확장
        const setupInputFieldFocus = (bg, text, defaultText) => {
            bg.on('pointerdown', () => {
            // 이전 커서 위치 초기화
            if (this.activeInput) {
                this.activeInput.text.setText(this.activeInput.text.text || this.activeInput.defaultText);
            }
            cursor.setVisible(true);
            text.setText('');
            // 텍스트의 중앙에 커서 위치
            cursor.setPosition(text.x, text.y);
            this.activeInput = { text, defaultText };
            });
        };

        setupInputFieldFocus(idBg, idText, 'ID를 입력하세요');
        setupInputFieldFocus(pwBg, pwText, '비밀번호를 입력하세요');
        setupInputFieldFocus(pwConfirmBg, pwConfirmText, '비밀번호 확인');

        // 가입하기 버튼
        const signupButton = this.add.image(width / 2, height * 0.7, 'signup_white_bar')
            .setDisplaySize(200, 50)
            .setInteractive();
        
        this.add.text(width / 2, height * 0.7, '가입하기', {
            font: '24px "머니그라피"',
            fill: '#3cbb89',
            align: 'center'
        }).setOrigin(0.5);

        // 뒤로가기 버튼
        const backButton = this.add.text(width / 2, height * 0.8, '로그인으로 돌아가기', {
            font: '20px "머니그라피"',
            fill: '#ffffff',
            align: 'center'
        })
        .setOrigin(0.5)
        .setInteractive();

        // 입력 필드 이벤트
        this.setupInputField(idBg, idText, 'text');
        this.setupInputField(pwBg, pwText, 'password');
        this.setupInputField(pwConfirmBg, pwConfirmText, 'password');

        // 버튼 이벤트
        signupButton.on('pointerdown', async () => {
            // 입력값 가져오기
            const id = idText.text;
            const password = pwText.text;
            const confirmPassword = pwConfirmText.text;

            // 입력값 검증
            if (id === 'ID를 입력하세요' || !id) {
                alert('ID를 입력해주세요.');
                return;
            }

            if (password === '비밀번호를 입력하세요' || !password) {
                alert('비밀번호를 입력해주세요.');
                return;
            }

            if (password !== confirmPassword) {
                alert('비밀번호가 일치하지 않습니다.');
                return;
            }

            try {
                const response = await this.signupRequest(id, password);
                if (response.success) {
                    alert('회원가입이 완료되었습니다.');
                    this.scene.start('LoginScene');
                } else {
                    alert(response.message || '회원가입에 실패했습니다.');
                }
            } catch (error) {
                console.error('회원가입 에러:', error);
                alert('회원가입 처리 중 오류가 발생했습니다.');
            }
        });

        backButton.on('pointerdown', () => {
            this.scene.start('LoginScene');
        });
    }

    setupInputField(bg, text, type) {
        bg.on('pointerdown', () => {
            const input = document.createElement('input');
            input.type = type;
            input.style.position = 'fixed';
            input.style.opacity = '0';
            document.body.appendChild(input);
            input.focus();
            input.addEventListener('input', (e) => {
                if (type === 'password') {
                    text.setText('*'.repeat(e.target.value.length) || '비밀번호를 입력하세요');
                } else {
                    text.setText(e.target.value || 'ID를 입력하세요');
                }
            });
        });
    }

    // SignupScene 클래스 내에 회원가입 요청 메서드 추가(주소 변경해야합니당)
    async signupRequest(id, password) {
        try {
            const response = await fetch('http://your-backend-url/api/signup', { 
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    username: id,
                    password: password
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Network response was not ok');
            }

            return await response.json();
        } catch (error) {
            console.error('Signup request failed:', error);
            throw error;
        }
    }
}
