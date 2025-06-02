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
        const usernameBg = this.add.image(width / 2, inputY + inputSpacing, 'signup_white_bar')
            .setDisplaySize(360, 50)
            .setInteractive();
        const usernameText = this.add.text(width / 2, inputY + inputSpacing, 'ID를 입력하세요', {
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

        // 입력 필드 이벤트 설정 수정
        this.setupInputField(nameBg, nameText, 'name');    // 이름 입력
        this.setupInputField(usernameBg, usernameText, 'text');        // ID 입력
        this.setupInputField(pwBg, pwText, 'password');    // 비밀번호 입력
        this.setupInputField(phoneBg, phoneText, 'tel');   // 전화번호 입력
        this.setupInputField(emailBg, emailText, 'email'); // 이메일 입력

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
 // 가입하기 버튼 이벤트
signupButton.on('pointerdown', async () => {
    const name = nameText.text;
    const username = usernameText.text;
    const password = this.passwordValue;  // ✅ 진짜 입력한 비밀번호
    const phone = phoneText.text;
    const email = emailText.text;

    // 입력값 검증
    if (name === '이름을 입력하세요' || !name) {
        alert('이름을 입력해주세요.');
        return;
    }
    if (username === 'ID를 입력하세요' || !username) {
        alert('ID를 입력해주세요.');
        return;
    }
    if (!password || password.length < 1) {  // ✅ 수정: 실제 값 검사
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
        const response = await this.signupRequest(name, username, password, phone, email);
        alert(response.message || '회원가입이 완료되었습니다.');
        this.scene.start('LoginScene');
    } catch (error) {
        console.error('회원가입 에러:', error);
        alert(error.message || '회원가입 처리 중 오류가 발생했습니다.');
    }
});


        backButton.on('pointerdown', () => {
            this.scene.start('LoginScene');
        });
    }

    setupInputField(bg, text, type) {
        let currentValue = '';
        const defaultText = text.text;
        let isInputActive = false;
        let cursorBlink;
        let inputElement = null;

        const startInput = () => {
            isInputActive = true;
            
            // 기존 input 요소가 있다면 제거
            if (inputElement) {
                inputElement.remove();
            }

            // 숨겨진 input 요소 생성
            inputElement = document.createElement('input');
            inputElement.type = type;
            inputElement.style.position = 'absolute';
            inputElement.style.opacity = '0';
            inputElement.style.pointerEvents = 'none';
            inputElement.style.zIndex = '-1000';
            inputElement.value = currentValue;
            document.body.appendChild(inputElement);
            inputElement.focus();

            if (text.text === defaultText) {
                currentValue = '';
                text.setText('|');
            }

            // 기존 깜빡임 타이머가 있다면 제거
            if (cursorBlink) cursorBlink.destroy();

            // 커서 깜빡임 효과
            cursorBlink = this.time.addEvent({
                delay: 500,
                callback: () => {
                    if (text.text.endsWith('|')) {
                        text.setText(currentValue);
                    } else {
                        text.setText(currentValue + '|');
                    }
                },
                loop: true
            });

            // input 이벤트 리스너 추가
        inputElement.addEventListener('input', (e) => {
            currentValue = e.target.value;

            if (type === 'password') {
                this.passwordValue = currentValue; // ✅ 진짜 값 저장
                text.setText('*'.repeat(currentValue.length) + '|');
            } else {
                text.setText(currentValue + '|');
            }
        });

        // Enter 키 처리
        inputElement.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                endInput();
            }
        });
    };

    const endInput = () => {
        isInputActive = false;
        if (cursorBlink) cursorBlink.destroy();
        if (inputElement) {
            inputElement.remove();
            inputElement = null;
        }

        if (currentValue === '') {
            text.setText(defaultText);
        } else {
            if (type === 'password') {
                this.passwordValue = currentValue; // ✅ 진짜 값 저장
                text.setText('*'.repeat(currentValue.length));
            } else {
                text.setText(currentValue);
            }
        }
    };

    // 필드 클릭 시 입력 시작
    bg.on('pointerdown', () => {
        if (!isInputActive) {
            startInput();
        }
    });

    // 다른 곳 클릭 시 입력 종료
    this.input.on('pointerdown', (pointer, gameObjects) => {
        if (isInputActive && !gameObjects.includes(bg)) {
            endInput();
        }
    });
};

    // signup 요청 메서드 수정
    async signupRequest(name, username, password, phone, email) {  // username을 id로 변경
        try {

            console.log("전송할 JSON:", JSON.stringify({
    name,
    username,
    password,
    phone,
    email
}));

            const response = await fetch('http://43.201.253.146:8000/signup', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name,
                    username,  // username을 id로 변경
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
