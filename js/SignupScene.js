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
        this.add.text(width / 2, height * 0.15, '회원가입', {
            font: '32px "머니그라피"',
            fill: '#ffffff',
            align: 'center'
        }).setOrigin(0.5);

        // 입력 필드 설정
        const inputBgWidth = 360;
        const inputBgHeight = 50;
        const inputY = height * 0.3; // 시작 위치를 위로 조정
        const inputSpacing = 60;

        // 이름 입력
        const nameBg = this.add.image(width / 2, inputY, 'signup_white_bar')
            .setDisplaySize(360, 50)
            .setInteractive();
        const nameText = this.add.text(width / 2, inputY, '이름을 입력하세요', {
            font: '20px "머니그라피"',
            fill: '#666666'
        }).setOrigin(0.5);

        // ID 입력 (username을 id로 변경)
        const idBg = this.add.image(width / 2, inputY + inputSpacing, 'signup_white_bar')
            .setDisplaySize(360, 50)
            .setInteractive();
        const idText = this.add.text(width / 2, inputY + inputSpacing, 'ID를 입력하세요', {
            font: '20px "머니그라피"',
            fill: '#666666'
        }).setOrigin(0.5);

        // 비밀번호 입력
        const pwBg = this.add.image(width / 2, inputY + inputSpacing * 2, 'signup_white_bar')
            .setDisplaySize(360, 50)
            .setInteractive();
        const pwText = this.add.text(width / 2, inputY + inputSpacing * 2, '비밀번호를 입력하세요', {
            font: '20px "머니그라피"',
            fill: '#666666'
        }).setOrigin(0.5);

        // 전화번호 입력
        const phoneBg = this.add.image(width / 2, inputY + inputSpacing * 3, 'signup_white_bar')
            .setDisplaySize(360, 50)
            .setInteractive();
        const phoneText = this.add.text(width / 2, inputY + inputSpacing * 3, '전화번호를 입력하세요', {
            font: '20px "머니그라피"',
            fill: '#666666'
        }).setOrigin(0.5);

        // 이메일 입력
        const emailBg = this.add.image(width / 2, inputY + inputSpacing * 4, 'signup_white_bar')
            .setDisplaySize(360, 50)
            .setInteractive();
        const emailText = this.add.text(width / 2, inputY + inputSpacing * 4, '이메일을 입력하세요', {
            font: '20px "머니그라피"',
            fill: '#666666'
        }).setOrigin(0.5);

        // 입력 필드 이벤트 설정
        this.setupInputField(nameBg, nameText, 'text');
        this.setupInputField(idBg, idText, 'text');  // username을 id로 변경
        this.setupInputField(pwBg, pwText, 'password');
        this.setupInputField(phoneBg, phoneText, 'tel');
        this.setupInputField(emailBg, emailText, 'email');

        // 가입하기 버튼 위치 조정
        const signupButton = this.add.image(width / 2, inputY + inputSpacing * 5 + 20, 'signup_white_bar')
            .setDisplaySize(200, 50)
            .setInteractive();

        this.add.text(width / 2, inputY + inputSpacing * 5 + 20, '가입하기', {
            font: '24px "머니그라피"',
            fill: '#3cbb89',
            align: 'center'
        }).setOrigin(0.5);

        // 뒤로가기 버튼 위치 조정
        const backButton = this.add.text(width / 2, inputY + inputSpacing * 5 + 80, '로그인으로 돌아가기', {
            font: '20px "머니그라피"',
            fill: '#ffffff',
            align: 'center'
        })
        .setOrigin(0.5)
        .setInteractive();

        // 가입하기 버튼 이벤트
        signupButton.on('pointerdown', async () => {
            // 입력값 가져오기
            const name = nameText.text;
            const id = idText.text;  // username을 id로 변경
            const password = pwText.text;
            const phone = phoneText.text;
            const email = emailText.text;

            // 입력값 검증
            if (name === '이름을 입력하세요' || !name) {
                alert('이름을 입력해주세요.');
                return;
            }
            if (id === 'ID를 입력하세요' || !id) {  // username을 id로 변경
                alert('ID를 입력해주세요.');
                return;
            }
            if (password === '비밀번호를 입력하세요' || !password) {
                alert('비밀번호를 입력해주세요.');
                return;
            }
            if (phone === '전화번호를 입력하세요' || !phone) {
                alert('전화번호를 입력해주세요.');
                return;
            }
            if (email === '이메일을 입력하세요' || !email) {
                alert('이메일을 입력해주세요.');
                return;
            }

            try {
                const response = await this.signupRequest(name, id, password, phone, email);  // username을 id로 변경
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

    // signup 요청 메서드 수정
    async signupRequest(name, id, password, phone, email) {  // username을 id로 변경
        try {
            const response = await fetch('http://your-backend-url/api/signup', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name,
                    id,  // username을 id로 변경
                    password,
                    phone,
                    email
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
