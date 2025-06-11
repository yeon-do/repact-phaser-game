class LoginInputScene extends Phaser.Scene {
  constructor() {
    super('LoginInputScene');  // 씬 키 설정
  }

  preload() {
    // login.png 파일 로드
    this.load.image('login_image', './assets/startscene/login.png');
    
    // 만약 위 경로가 안 되면 아래 경로들을 시도해보세요
    // this.load.image('login_image', 'assets/images/login.png');
    // this.load.image('login_image', './login.png');
  }

  create() {
    const { width, height } = this.sys.game.canvas;

    // login.png 배경 이미지
    this.add.image(width / 2, height / 2, 'login_image')
      .setOrigin(0.5)
      .setDisplaySize(width, height);

    // login.png의 입력 필드에 맞는 스타일 (투명하게)
    const inputStyle = 'width: 250px; padding: 10px; color: white; border: none; background: transparent; font-size: 18px; text-align: center; outline: none;';
    
    // 아이디 입력 필드 (login.png의 아이디 입력 영역에 맞춤)
    const idInput = this.add.dom(width * 0.5, height * 0.4).createFromHTML(`<input type="text" placeholder="" style="${inputStyle}">`);
    idInput.setOrigin(0.5);

    // 비밀번호 입력 필드 (login.png의 비밀번호 입력 영역에 맞춤)
    const pwInput = this.add.dom(width * 0.5, height * 0.54).createFromHTML(`<input type="password" placeholder="" style="${inputStyle}">`);
    pwInput.setOrigin(0.5);

    // 로그인 버튼 (login.png의 로그인 버튼 위치에 투명한 클릭 영역)
    const loginButton = this.add.rectangle(width * 0.7, height * 0.64, 120, 40, 0x000000, 0)
      .setInteractive();

    // 뒤로가기 버튼 (login.png의 뒤로가기 버튼 위치에 투명한 클릭 영역)
    const backButton = this.add.rectangle(width * 0.28, height * 0.64, 120, 40, 0x000000, 0)
      .setInteractive();

    // 로그인 버튼 이벤트
    loginButton.on('pointerdown', async () => {
      const username = idInput.node.querySelector('input').value;
      const password = pwInput.node.querySelector('input').value;
      
      if (!username || !password) {
        alert('아이디와 비밀번호를 입력해주세요.');
        return;
      }

      try {
        const response = await this.loginRequest(username, password);
        localStorage.setItem('username', username);
        alert('로그인 성공!');
        this.scene.start('BootScene');
      } catch (error) {
        alert('로그인 실패: ' + error.message);
      }
    });

    // 뒤로가기 버튼 이벤트
    backButton.on('pointerdown', () => {
      this.scene.start('LoginScene');
    });

    // 디버깅용 - 버튼 위치 확인 (개발 후 제거)
    // loginButton.setStrokeStyle(2, 0x00ff00);
    // backButton.setStrokeStyle(2, 0xff0000);
  }

  // 로그인 요청 메서드 (기존과 동일)
  async loginRequest(username, password) {
    try {
      const response = await fetch('http://43.201.253.146:8000/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username,
          password
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Login failed');
      }

      return await response.json();
    } catch (error) {
      console.error('Login request failed:', error);
      throw error;
    }
  }
}