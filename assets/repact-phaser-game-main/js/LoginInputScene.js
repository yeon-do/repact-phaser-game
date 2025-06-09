class LoginInputScene extends Phaser.Scene {
  constructor() {
    super('LoginInputScene');  // 씬 키 설정
  }

  preload() {
    this.load.image('login_background', './assets/images/main_background.png');
    this.load.image('dark_bar', './assets/images/dark_bar.png');
  }

  create() {
    const { width, height } = this.sys.game.canvas;

    // 배경 - main_background 이미지와 정확히 같은 색상으로 변경
    this.add.rectangle(0, 0, width, height, 0x2ecc71).setOrigin(0);

    // 아이디 라벨
    this.add.text(width * 0.5, height * 0.35, '아이디', {
      fontFamily: '메니크래피',
      fontSize: '24px',
      color: '#FFFFFF'
    }).setOrigin(0.5);

    // 아이디 입력 박스 - black_bar 이미지
    const idBar = this.add.image(width * 0.5, height * 0.4, 'dark_bar');
    idBar.setDisplaySize(width * 0.7, 50).setAlpha(0.8);

    // 비밀번호 라벨
    this.add.text(width * 0.5, height * 0.45, '비밀번호', {
      fontFamily: '메니크래피',
      fontSize: '24px',
      color: '#FFFFFF'
    }).setOrigin(0.5);

    // 비밀번호 입력 박스 - black_bar 이미지
    const pwBar = this.add.image(width * 0.5, height * 0.5, 'dark_bar');
    pwBar.setDisplaySize(width * 0.7, 50).setAlpha(0.8);

    // DOM 입력 요소 위치 조정 (dark_bar 정중앙에 배치)
    const inputStyle = 'width: 308px; height: 34px; padding: 0; margin: 0; color: white; border: none; background: none; font-size: 20px; text-align: center; outline: none; line-height: 34px;';
    const idInput = this.add.dom(width * 0.5, height * 0.4).createFromHTML(`<input type="text" style="${inputStyle}">`);
    const pwInput = this.add.dom(width * 0.5, height * 0.5).createFromHTML(`<input type="password" style="${inputStyle}">`);
    
    // DOM 요소 중앙 정렬 설정
    idInput.setOrigin(0.5, 0.5);
    pwInput.setOrigin(0.5, 0.5);

    // 로그인 버튼 추가
    const loginButton = this.add.image(width * 0.5, height * 0.6, 'dark_bar')
      .setDisplaySize(200, 50)
      .setInteractive();

    this.add.text(width * 0.5, height * 0.6, '로그인', {
      fontFamily: '머니크래피',
      fontSize: '24px',
      color: '#FFFFFF'
    }).setOrigin(0.5);

    // 뒤로가기 버튼 추가
    const backButton = this.add.text(width * 0.5, height * 0.7, '뒤로가기', {
      fontFamily: '머니크래피',
      fontSize: '24px',
      color: '#FFFFFF'
    }).setOrigin(0.5).setInteractive();

    // 로그인 버튼 이벤트
    loginButton.on('pointerdown', async () => {
      // DOM 입력 요소에서 값 가져오기 - 올바른 방법
      const username = idInput.node.querySelector('input').value;
      const password = pwInput.node.querySelector('input').value;
      
      console.log('Username:', username); // 아이디만 로그
      
      if (!username || !password) {
        alert('아이디와 비밀번호를 입력해주세요.');
        return;
      }

      try {
        // 로그인 요청 처리 (API 호출)
        const response = await this.loginRequest(username, password);
        
        // 로그인 성공 시 사용자 이름을 localStorage에 저장
        localStorage.setItem('username', username);
        
        alert('로그인 성공!');
        // 게임 메인 씬으로 이동
        this.scene.start('BootScene');
      } catch (error) {
        alert('로그인 실패: ' + error.message);
      }
    });

    // 뒤로가기 버튼 이벤트
    backButton.on('pointerdown', () => {
      this.scene.start('LoginScene');
    });
  }

  // 로그인 요청 메서드 추가
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