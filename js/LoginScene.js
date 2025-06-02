class LoginScene extends Phaser.Scene {
    constructor() {
        super('LoginScene');
        this.id = '';  // null 대신 빈 문자열로 초기화
        this.pw = '';  // null 대신 빈 문자열로 초기화
    }

    preload() {
        // 로드 이벤트 리스너 추가
        this.load.on('complete', () => {
            console.log('모든 이미지 로드 완료');
        });

        this.load.on('loaderror', (fileObj) => {
            console.error('이미지 로드 실패:', fileObj.src);
        });

        // 절대 경로로 이미지 로드
        this.load.image('login_background', './assets/images/main_background.png');
        this.load.image('login_white_bar', './assets/images/white_bar.png');
    }

    create() {
        const { width, height } = this.sys.game.canvas;

        // 배경 이미지 설정에 디버그 정보 추가
        const bg = this.add.image(0, 0, 'login_background')
            .setOrigin(0)
            .setDisplaySize(width, height);
        
        console.log('배경 이미지 크기:', {
            textureWidth: bg.texture.width,
            textureHeight: bg.texture.height,
            displayWidth: bg.displayWidth,
            displayHeight: bg.displayHeight
        });


        // 입력 필드 (흰색 박스)
        const inputBgWidth = 300;
        const inputBgHeight = 50;
        const inputY = height * 0.45;

        // ID 입력 필드
        const idBg = this.add.image(width / 2, inputY + 70, 'login_white_bar')
            .setDisplaySize(inputBgWidth + 60, inputBgHeight)
            .setInteractive();

        const idText = this.add.text(width / 2, inputY + 70, 'ID를 입력하세요', {
            font: '20px "머니그라피"',
            fill: '#666666'
        }).setOrigin(0.5);

        // 비밀번호 입력 필드 
        const pwBg = this.add.image(width / 2, inputY + 140, 'login_white_bar')
            .setDisplaySize(inputBgWidth + 60, inputBgHeight)
            .setInteractive();

        const pwText = this.add.text(width / 2, inputY + 140, '비밀번호를 입력하세요', {
            font: '20px "머니그라피"',
            fill: '#666666'
        }).setOrigin(0.5);

        // 로그인 버튼
        const loginButton = this.add.image(width / 2, height * 0.7, 'login_white_bar')
            .setDisplaySize(200, 50)
            .setInteractive();

        const loginText = this.add.text(width / 2, height * 0.7, '로그인', {
            font: '24px "머니그라피"', 
            fill: '#3cbb89',
            align: 'center'
        }).setOrigin(0.5);

        // 회원가입
        const signupButton = this.add.text(width / 2, height * 0.8, '회원가입', {
            font: '20px "머니그라피"',
            fill: '#ffffff',
            align: 'center'
        })
        .setOrigin(0.5)
        .setInteractive();


loginButton.on('pointerdown', async () => {
    try {
        // 입력값이 기본 텍스트인지 확인
        if (idText.text === 'ID를 입력하세요' || pwText.text === '비밀번호를 입력하세요') {
            alert('ID와 비밀번호를 입력해주세요');
            return;
        }

        // 입력값이 비어있는지 확인
        if (!this.id || !this.pw || this.id.trim() === '' || this.pw.trim() === '') {
            alert('ID와 비밀번호를 입력해주세요');
            return;
        }

        const response = await this.loginRequest(this.id, this.pw);
        
        if (response && response.access_token) {
            // 로그인 성공
            localStorage.setItem('userToken', response.access_token);
            this.scene.start('BootScene');
        } else {
            alert(response.message || '로그인에 실패했습니다.');
        }
    } catch (error) {
        console.error('로그인 에러:', error);
        alert(error.message || '로그인 처리 중 오류가 발생했습니다.');
    }
});

        signupButton.on('pointerdown', () => {
            // SignupScene으로 전환
            this.scene.start('SignupScene');
        });

        // 입력 필드 클릭 이벤트 
        idBg.on('pointerdown', () => {
            if (idText.text === 'ID를 입력하세요') {
                idText.setText('');
            }
            
            const input = document.createElement('input');
            input.type = 'text';
            input.style.position = 'fixed';
            input.style.opacity = '0';
            document.body.appendChild(input);
            input.focus();

            // 커서 깜빡임 효과
            const cursorBlink = this.time.addEvent({
                delay: 500,
                callback: () => {
                    if (idText.text.endsWith('|')) {
                        idText.setText(idText.text.slice(0, -1));
                    } else {
                        idText.setText(idText.text + '|');
                    }
                },
                loop: true
            });

            input.addEventListener('input', (e) => {
                const value = e.target.value;
                idText.setText(value + '|');
            });

            // 포커스 잃었을 때
            input.addEventListener('blur', () => {
                cursorBlink.destroy();
                const value = input.value.trim();
                
                if (!value) {
                    this.id = '';  // 또는 this.pw = '';
                    idText.setText('ID를 입력하세요');  // 또는 pwText.setText('비밀번호를 입력하세요');
                } else {
                    this.id = value;  // 또는 this.pw = value;
                    idText.setText(value);  // 또는 pwText.setText('*'.repeat(value.length));
                }
                document.body.removeChild(input);
            });
        });

        pwBg.on('pointerdown', () => {
            if (pwText.text === '비밀번호를 입력하세요') {
                pwText.setText('');
            }

            const input = document.createElement('input');
            input.type = 'password';
            input.style.position = 'fixed';
            input.style.opacity = '0';
            document.body.appendChild(input);
            input.focus();

            // 커서 깜빡임 효과
            const cursorBlink = this.time.addEvent({
                delay: 500,
                callback: () => {
                    if (pwText.text.endsWith('|')) {
                        pwText.setText(pwText.text.slice(0, -1));
                    } else {
                        pwText.setText(pwText.text + '|');
                    }
                },
                loop: true
            });

            input.addEventListener('input', (e) => {
                const value = '*'.repeat(e.target.value.length);
                pwText.setText(value + '|');
            });

            // 포커스 잃었을 때
            input.addEventListener('blur', () => {
                cursorBlink.destroy();
                const value = input.value.trim();
                
                if (!value) {
                    this.pw = '';
                    pwText.setText('비밀번호를 입력하세요');
                } else {
                    this.pw = value;
                    pwText.setText('*'.repeat(value.length));
                }
                document.body.removeChild(input);
            });
        });
    }

 async loginRequest(id, password) {
        try {
            // 유효성 검사 추가
            if (!id || !password || id.trim() === '' || password.trim() === '') {
                throw new Error('ID와 비밀번호를 입력해주세요');
            }

            console.log("보내는 ID:", id);
            console.log("보내는 Password:", password);

            const response = await fetch('http://43.201.253.146:8000/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    username: id.trim(),
                    password: password.trim()
                })
            });

            const responseData = await response.json();
            
            if (!response.ok) {
                throw new Error(responseData.detail || '로그인에 실패했습니다');
            }

            console.log("받은 응답:", responseData);
            return responseData;
        } catch (error) {
            console.error('Login request failed:', error);
            throw error;
        }
    }
}
