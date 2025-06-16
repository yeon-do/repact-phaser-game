// 메인 게임 씬 - 모든 라운드와 타입을 처리
class GameScene extends Phaser.Scene {
    constructor() {
        super('GameScene');
        localStorage.clear();
        sessionStorage.clear();
        console.log('GameScene: Constructor 실행.');
        // 터치 딜레이 추가
        this.lastTouchTime = 0;
        this.canClick = true;  // 클릭 가능 상태 추가

        // === 게임 진행 관련 변수 ===
        this.level = 2; // 현재 레벨
        this.currentRound = 1; // 현재 라운드 (1-5)
        this.maxRounds = 5; // 레벨당 최대 라운드
        this.score = 0; // 현재 점수
        this.health = 3; // 체력 변수 (하트 3개)
        this.AVERAGE_LEVEL_TIME = 60 * 1000; // 60초(밀리초) 기준


        // 레벨별 아이템 데이터
        this.levelRounds = {
            /*1: [
                //{ round: 1, itemId: 'handwash', type: 2 },
                { round: 1, itemId: 'localstock', type: 1 },
                //{ round: 3, itemId: 'heimili', type: 2 },
                { round: 2, isSpecial: true } // 스페셜 라운드 플래그
            ],
            2: [
                { round: 1, itemId: 'can', type: 1 },
                { round: 2, itemId: 'milk_carton', type: 2 },
                { round: 3, itemId: 'deliverplastic', type: 2 },
                { round: 4, itemId: 'newspaper', type: 1 },
                { round: 5, itemId: 'chicken_bone', type: 3 }
            ],*/
            1: [
                //{ round: 1, itemId: 'handwash', type: 3 },
                { round: 1, itemId: 'glass_bottle', type: 1 },
                { round: 2, itemId: 'milk_carton', type: 2 },
                { round: 3, itemId: 'newspaper', type: 1 },
                { round: 4, itemId: 'plastic_bottle', type: 2 },
                { round: 5, itemId: 'chicken_bone', type: 3 }
            ],
            2: [
                { round: 1, itemId: 'can', type: 1 },
                { round: 2, itemId: 'tang', type: 3 },
                { round: 3, itemId: 'book', type: 1 },
                { round: 4, itemId: 'deliverplastic', type: 2 },
                { round: 5, itemId: 'soimilk', type: 2 }
            ],
            3: [
                { round: 1, itemId: 'handwash', type: 2 },
                { round: 2, itemId: 'localstock', type: 1 },
                { round: 3, itemId: 'heimili', type: 2 },
                { round: 4, isSpecial: true } // 스페셜 라운드 플래그

            ],
            // ...추가 레벨...
        };
        this.getRoundData = () => this.levelRounds[this.level] || [];


        // === UI 요소들 ===
        this.scoreText = null;
        this.levelText = null;
        this.roundText = null; // 라운드 표시 텍스트
        this.timeText = null;
        this.heartGraphics = [];
        this.itemNameText = null;

        // 전처리 관련 변수
        this.preprocessingSteps = null;
        this.currentPreprocessingStep = 0;
        this.currentCommandIndex = 0; // 현재 단계 내에서 몇 번째 커맨드인지
        this.messageCommandImages = []; // 메시지 창에 표시할 커맨드 이미지들
        this.messageTexts = []; // 메시지 창에 표시할 텍스트들

        // 애니메이션 타이밍 상수 정의
        this.ANIMATION_TIMING = {
            BLINK_DURATION: 150,      // 깜박임 한 번 지속 시간 (ms)
            BLINK_COUNT: 3,           // 깜박임 횟수
            FADE_OUT_DURATION: 1000,   // 사라지는 효과 지속 시간 (ms)
            NEXT_ROUND_DELAY: 2500,   // 다음 라운드로 넘어가는 지연 시간 (ms)
            LINE_BLINK_DURATION: 200, // 라인 깜박임 지속 시간 (ms)
            LINE_BLINK_COUNT: 3       // 라인 깜박임 횟수
        };

        // === 게임 상태 변수 ===
        this.currentGameType = 1; // 현재 게임 타입
        this.gameState = 'playing'; // 'playing', 'preprocessing', 'quiz'
        this.itemTimeLimit = 10; // 아이템별 시간 제한 (초)
        this.itemTimeRemaining = this.itemTimeLimit;
        this.currentTrashItemGraphic = null;
        this.currentTrashItemData = null;
        this.cursors = null;
        this.spaceKey = null;
        this.fastFallMultiplier = 4;
        this.currentLaneIndex = 0;
        this.isFalling = false;
        this.isProcessingResult = false;

        // === 입력 상태 관리 ===
        this.moveLeft = false;
        this.moveRight = false;
        this.moveDownFast = false;
        this.keyboardMoveDelay = 150;
        this.lastKeyboardMoveTime = 0;
        this.lastLandedLaneIndex = 0;

        // === 쓰레기 아이템 데이터 ===
        this.wasteRulesData = [
            // Type 1 아이템들
            {
                id: 'glass_bottle',
                name: '유리병',
                type: 1,
                difficulty: 1,
                correctBin: 'bin_glass',
                messageInitial: '유리병이 나타났어.\n어디에 분리배출 해야 할까?',
                messageCorrect: '정답이야!\n유리병은 유리 전용 수거함에 버려야 해!',
                messageIncorrect: '오답이야!\n유리병의 배출 방법을 다시 생각해볼까?'
            },
            {
                id: 'newspaper',
                name: '신문지',
                type: 1,
                difficulty: 1,
                correctBin: 'bin_paper',
                messageInitial: '신문지가 나타났어.\n어디에 분리배출 해야 할까?',
                messageCorrect: '정답이야!\n신문지는 종이 전용 수거함에 버려야 해!',
                messageIncorrect: '오답이야!\n신문지의 배출 방법을 다시 생각해볼까?'
            },
            {
                id: 'can',
                name: '음료수 캔',
                type: 1,
                difficulty: 1,
                correctBin: 'bin_can',
                messageInitial: '음료수 캔이 나타났어.\n어디에 분리배출 해야 할까?',
                messageCorrect: '정답이야!\n음료수 캔은 캔 전용 수거함에 버려야 해!',
                messageIncorrect: '오답이야!\n음료수 캔의 배출 방법을 다시 생각해볼까?'
            },
            {
                id: 'book',
                name: '책',
                type: 1,
                difficulty: 1,
                correctBin: 'bin_paper',
                messageInitial: '책이 나타났어.\n어디에 분리배출 해야 할까?',
                messageCorrect: '정답이야!\n책은 종이 전용 수거함에 버려야 해!',
                messageIncorrect: '오답이야!\n책의 배출 방법을 다시 생각해볼까?'
            },
            {
                id: 'localstock',
                name: '비타민 가득 현미팩',
                type: 1,
                difficulty: 2,
                correctBin: 'bin_pack',
                messageInitial: '맛 좋은 유기농 로컬스톡 현미팩이 나타났어.\n어디에 분리배출 해야 할까?',
                messageCorrect: '정답이야! 현미팩은\n종이팩(멸균팩) 전용 수거함에 버려야 해!',
                messageIncorrect: '오답이야!\n현미팩의 배출 방법을 다시 생각해볼까?'
            },
            // Type 2 아이템들 (전처리 필요)
            {
                id: 'milk_carton',
                name: '우유팩',
                preprocessedName: '세척하고 말린 우유팩',
                type: 2,
                difficulty: 3,
                correctBin: 'bin_pack',
                requiresPreprocessing: true,
                preprocessingSteps: [
                    {
                        text: '펼치고',
                        commands: [
                            { action: 'left', key: '←', color: '#FF9500' },
                            { action: 'right', key: '→', color: '#0080FF' }
                        ]
                    },
                    {
                        text: '물로 헹군 뒤',
                        commands: [
                            { action: 'down', key: '↓', color: '#00FF00' }
                        ]
                    },
                    {
                        text: '말린 다음',
                        commands: [
                            { action: 'left', key: '←', color: '#FF9500' },
                            { action: 'right', key: '→', color: '#0080FF' }
                        ]
                    },
                    {
                        text: '차곡 차곡 모으기',
                        commands: [
                            { action: 'down', key: '↓', color: '#00FF00' }
                        ]
                    },
                ],
                messageInitial: 'xx우유 500ml 쓰레기가 나타났어.\n근데 이대로는 분리배출이 안될 것 같은데...',
                messageWarning: 'xx우유 500ml 쓰레기가 나타났어.\n근데 이대로는 분리배출이 안될 것 같은데...',
                messagePreprocessingComplete: "휴, 드디어 우유팩을 분리배출 가능한 \n상태로 만들었어!", // 새로 추가
                messageAfterPreprocessing: "자, 이제 그럼 다시 분리배출 해볼까?", // 고정 메시지
                messageCorrect: "정답이야!\n우유팩은 일반 종이팩으로 배출해야해.",
                messageIncorrect: "오답이야!\n우유팩의 배출 방법을 다시 생각해 볼까?"
            },
            {
                id: 'plastic_bottle',
                name: '플라스틱 병',
                preprocessedName: '라벨 제거한 플라스틱 병',
                type: 2,
                difficulty: 2,
                correctBin: 'bin_plastic',
                requiresPreprocessing: true,
                preprocessingSteps: [
                    {
                        text: '라벨을 떼서 버리고',
                        commands: [
                            { action: 'left', key: '←', color: '#FF9500' },
                            { action: 'right', key: '→', color: '#0080FF' }
                        ]
                    },
                    {
                        text: '물로 헹군 뒤',
                        commands: [
                            { action: 'down', key: '↓', color: '#00FF00' }
                        ]
                    },
                    {
                        text: '뚜껑을 분리하기',
                        commands: [
                            { action: 'left', key: '←', color: '#FF9500' },
                            { action: 'right', key: '→', color: '#0080FF' }
                        ]
                    },
                ],
                messageInitial: '플라스틱 병이 나타났어.\n분리배출하려면 준비가 필요해!',
                messageWarning: '쓰레기가 쓰레기통으로 떨어지지 않네?\n플라스틱 병의 분리배출 과정이 필요해!',
                messagePreprocessingComplete: "휴, 드디어 플라스틱 병을 분리배출 가능한 \n상태로 만들었어!", // 새로 추가
                messageCorrect: "정답이야!\n플라스틱 병은 플라스틱으로 배출해야해.",
                messageIncorrect: "오답이야!\n우리 한 번 다시 생각해 볼까?"
            },
            {
                id: 'soimilk',
                name: '두유팩',
                preprocessedName: '세척하고 말린 두유팩',
                type: 2,
                difficulty: 3,
                correctBin: 'bin_pack',
                requiresPreprocessing: true,
                preprocessingSteps: [
                    {
                        text: '펼치고',
                        commands: [
                            { action: 'left', key: '←', color: '#FF9500' },
                            { action: 'right', key: '→', color: '#0080FF' }
                        ]
                    },
                    {
                        text: '물로 헹군 뒤',
                        commands: [
                            { action: 'down', key: '↓', color: '#00FF00' }
                        ]
                    },
                    {
                        text: '말린 다음',
                        commands: [
                            { action: 'left', key: '←', color: '#FF9500' },
                            { action: 'right', key: '→', color: '#0080FF' }
                        ]
                    },
                    {
                        text: '차곡 차곡 모으기',
                        commands: [
                            { action: 'down', key: '↓', color: '#00FF00' }
                        ]
                    },
                ],
                messageInitial: 'xx두유 200ml 쓰레기가 나타났어.\n근데 이대로는 분리배출이 안될 것 같은데...',
                messageWarning: 'xx두유 200ml 쓰레기가 나타났어.\n근데 이대로는 분리배출이 안될 것 같은데...',
                messagePreprocessed: "잘 정리됐어! 이제 종이팩 수거함에 넣자!",
                messagePreprocessingComplete: "휴, 드디어 두유팩을\n분리배출 가능한 상태로 만들었어!", // 새로 추가
                messageAfterPreprocessing: "자, 이제 그럼 다시 분리배출 해볼까?", // 고정 메시지
                messageCorrect: "정답이야! 두유팩은 멸균팩으로 배출해야해.\n 일반 종이팩과는 구분해야하니 명심해!!!",
                messageIncorrect: "오답이야!\n두유팩의 배출 방법을 다시 생각해 볼까?"
            },
            {
                id: 'deliverplastic',
                name: '양념이 묻은 배달용기',
                preprocessedName: '세척하고 말린 배달용기',
                type: 2,
                difficulty: 3,
                correctBin: 'bin_plastic',
                requiresPreprocessing: true,
                preprocessingSteps: [
                    {
                        text: '물로 헹구고',
                        commands: [
                            { action: 'down', key: '↓', color: '#00FF00' }
                        ]
                    },
                    {
                        text: '말린 뒤',
                        commands: [
                            { action: 'left', key: '←', color: '#FF9500' },
                            { action: 'right', key: '→', color: '#0080FF' }
                        ]
                    },
                    {
                        text: '용기만 남긴 채 배출',
                        commands: [
                            { action: 'down', key: '↓', color: '#00FF00' },
                            { action: 'down', key: '↓', color: '#00FF00' }
                        ]
                    },
                ],
                messageInitial: '양념이 묻은 배달용기가 나타났어.\n근데 이대로는 분리배출이 안될 것 같은데...',
                messageWarning: '양념이 묻은 배달용기 쓰레기가 나타났어.\n근데 이대로는 분리배출이 안될 것 같은데...',
                messagePreprocessed: "잘 정리됐어! 이제 종이팩 수거함에 넣자!",
                messagePreprocessingComplete: "휴, 드디어 양념이 묻은 배달용기를 \n분리배출 가능한 상태로 만들었어!", // 새로 추가
                messageAfterPreprocessing: "자, 이제 그럼 다시 분리배출 해볼까?", // 고정 메시지
                messageCorrect: "정답이야!\n세척한 용기는 플라스틱으로 배출해야해.",
                messageIncorrect: "오답이야!\n배달용기의 배출 방법을 다시 생각해 볼까?"
            },
            // TYPE2 리필리 아이템
            {
                id: 'handwash',
                name: '유한킴벌리 핸드워시',
                preprocessedName: '펼쳐서 말린 핸드워시',
                type: 2,
                difficulty: 3,
                correctBin: 'bin_pack',
                requiresPreprocessing: true,
                preprocessingSteps: [
                    {
                        text: '펌프와 홀더는 분리해 재사용하고',
                        commands: [
                            { action: 'left', key: '←', color: '#FF9500' },
                            { action: 'right', key: '→', color: '#0080FF' }
                        ]
                    },
                    {
                        text: '물로 헹군 뒤',
                        commands: [
                            { action: 'down', key: '↓', color: '#00FF00' }
                        ]
                    },
                    {
                        text: '펼치고',
                        commands: [
                            { action: 'left', key: '←', color: '#FF9500' },
                            { action: 'right', key: '→', color: '#0080FF' }
                        ]
                    },
                    {
                        text: '말린 다음',
                        commands: [
                            { action: 'left', key: '←', color: '#FF9500' },
                            { action: 'right', key: '→', color: '#0080FF' }
                        ]
                    },
                    {
                        text: '차곡 차곡 모으기',
                        commands: [
                            { action: 'down', key: '↓', color: '#00FF00' }
                        ]
                    },
                ],

                messageInitial: '다 쓴 유한킴벌리 핸드워시가 나타났어.\n분리배출 후 리필 제품으로 교체하자!',
                messageWarning: '다 쓴 유한킴벌리 핸드워시가 나타났어.\n분리배출 후 리필 제품으로 교체하자!',
                messagePreprocessingComplete: "휴, 드디어 핸드워시 팩을\n분리배출 가능한 상태로 만들었어!", // 새로 추가
                messageAfterPreprocessing: "펼쳐서 말린 핸드워시 팩은\n어디에 버려야 할까?", // 고정 메시지
                messageCorrect: "정답이야! 종이팩(멸균팩)으로 버려야 해.\n일반 종이팩과 구분해야 하는 점 잊지마!",
                messageIncorrect: "오답이야!\n핸드워시 팩 배출 방법을 다시 생각해 볼까?"
            },
            {
                id: 'heimili',
                name: '헤이밀리 주방 세제',
                preprocessedName: '플라스틱을 제거한 세재팩',
                type: 2,
                difficulty: 3,
                correctBin: 'bin_pack',
                requiresPreprocessing: true,
                preprocessingSteps: [
                    {
                        text: '입구의 플라스틱 캡을 제거하고',
                        commands: [
                            { action: 'left', key: '←', color: '#FF9500' },
                            { action: 'right', key: '→', color: '#0080FF' }
                        ]
                    },
                    {
                        text: '물로 헹군 뒤',
                        commands: [
                            { action: 'down', key: '↓', color: '#00FF00' }
                        ]
                    },
                    {
                        text: '펼치고',
                        commands: [
                            { action: 'left', key: '←', color: '#FF9500' },
                            { action: 'right', key: '→', color: '#0080FF' }
                        ]
                    },
                    {
                        text: '말려서',
                        commands: [
                            { action: 'left', key: '←', color: '#FF9500' },
                            { action: 'right', key: '→', color: '#0080FF' }
                        ]
                    },
                    {
                        text: '차곡 차곡 모으기',
                        commands: [
                            { action: 'down', key: '↓', color: '#00FF00' }
                        ]
                    },
                ],
                messageInitial: '다 쓴 헤이밀리 주방 세제가 나타났어.\n미세플라스틱 걱정없이 세척할 수 있었어!',
                messageWarning: '다 쓴 헤이밀리 주방 세제가 나타났어.\n미세플라스틱 걱정없이 세척할 수 있었어!',
                messagePreprocessingComplete: "휴, 드디어 헤이밀리 팩을\n분리배출 가능한 상태로 만들었어!", // 새로 추가
                messageAfterPreprocessing: "아까 분리한 입구와 캡은\n어디에 버려야 할까?", // 고정 메시지
                messageCorrect: "정답이야! 종이팩(멸균팩)으로 버려야 해.\n일반 종이팩과 구분해야 하는 점 잊지마!",
                messageIncorrect: "오답이야!\n헤이밀리 팩 배출 방법을 다시 생각해 볼까?"
            },

            // Type 3 아이템들 (퀴즈)
            {
                id: 'chicken_bone',
                name: '닭뼈',
                type: 3,
                difficulty: 2,
                correctBin: 'bin_general', // 일반쓰레기가 정답
                quizQuestion: '닭뼈는 어떤 종류의 쓰레기일까?\n알맞은 분리배출 방법을 선택해보자!',
                quizOptions: {
                    left: '일반쓰레기',
                    right: '음식쓰레기'
                },
                correctAnswer: 'left', // 왼쪽이 정답
                messageCorrect: '정답이야!\n닭뼈는 일반쓰레기로 버려야 해!',
                messageIncorrect: '오답이야!\n닭뼈의 배출 방법을 다시 생각해볼까?'
            },
            {
                id: 'tang',
                name: '귤 껍질',
                type: 3,
                difficulty: 2,
                correctBin: 'bin_food', // 음식쓰레기가 정답
                quizQuestion: '귤 껍질은 어떤 종류의 쓰레기일까?\n알맞은 분리배출 방법을 선택해보자!',
                quizOptions: {
                    left: '일반쓰레기',
                    right: '음식쓰레기'
                },
                correctAnswer: 'right', // 오른른쪽이 정답
                messageCorrect: '정답이야!\n귤 껍질은 음식쓰레기로 버려야 해!',
                messageIncorrect: '오답이야!\n귤 껍질의 배출 방법을 다시 생각해볼까?'
            }
        ];
        this.specialData = {
            id: 'special_paper_recycle',
            // 팝업에 처음 뜨는 텍스트
            popupMessage: '잠깐! 이렇게 분리배출한 종이팩들은 \n어떻게 재활용되는걸까?',
            // special warning 이미지 키
            warningImageKey: 'special_warning_slide_img',
            // special 안내 텍스트 (팝업 위에 잠깐 표시)
            introText: '종이팩이 재활용 되는 과정을 알아보자',
            // step 시작 시 메시지창 텍스트
            startMessage: '종이팩의 재활용 과정을 알아보자!',
            // 단계별 설명
            steps: [
                {
                    text: '1. 깨끗한 종이팩을 따로 골라줘요.',
                    imageKey: 'special_step1_img',
                    commands: [
                        { action: 'left', key: '←' }
                    ]
                },
                {
                    text: '2. 물에 담가 펄프와 비닐,\n알루미늄을 깨끗하게 분리해요.',
                    imageKey: 'special_step2_img',
                    commands: [
                        { action: 'down', key: '↓' },
                        { action: 'down', key: '↓' },
                        { action: 'right', key: '→' }
                    ]
                },
                {
                    text: '3. 남은 이물질을 정리하고,\n펄프만 남겨 깨끗하게 다듬어요.',
                    imageKey: 'special_step3_img',
                    commands: [
                        { action: 'right', key: '→' },
                        { action: 'left', key: '←' }
                    ]
                },
                {
                    text: '4. 정리된 펄프는\n부드러운 화장지로 다시 태어나요.',
                    imageKey: 'special_step4_img',
                    commands: [
                        { action: 'right', key: '→' },
                        { action: 'right', key: '→' }
                    ]
                }
            ],
            completeMessage: 'Special Round 500포인트 획득!\n그럼 이제 종이팩 재활용 실천하러 가자!'
        };

        // === 쓰레기통 설정 ===
        this.binKeys = ['bin_glass', 'bin_paper', 'bin_pack', 'bin_can', 'bin_plastic'];
        this.binNames = ['유리병', '종이', '종이팩', '캔고철', '플라스틱'];
        this.binColors = {
            'bin_glass': 0x00ff00,    // 초록색 - 유리병
            'bin_paper': 0x0000ff,    // 파란색 - 종이
            'bin_pack': 0xff0000,     // 빨간색 - 종이팩  
            'bin_can': 0xffff00,      // 노란색 - 캔고철
            'bin_plastic': 0x800080   // 보라색 - 플라스틱
        };
        this.laneCenterXPositions = [];
        this.binTopLabelYPositions = [];
        this.binImages = [];
        this.currentOpenBinIndex = -1;
        this.binGraphics = [];
        this.commandButtons = {};

        // === UI 컨테이너들 ===
        this.uiContainers = {};

        // === 전처리 관련 변수 ===
        this.currentPreprocessingStep = 0;
        this.isWaitingForCommand = false;
        this.preprocessingStepGraphics = [];

        // === 퀴즈 관련 변수 ===
        this.quizDropZones = [];
        this.selectedQuizAnswer = null;

        // === 화면 레이아웃 좌표 ===
        this.panel = { x: 0, y: 0, width: 0, height: 0 };
        this.messageArea = { x: 0, y: 0, width: 0, height: 0 };
        this.commandButtonArea = { y: 0 };

        // === 결과 표시 UI ===
        this.messageAreaGraphic = null;
        this.messageTextObject = null;
        this.resultButton = null;
        this.resultButtonText = null;
        this.lastResultIsCorrect = false;
    }

    preload() {
        console.log('GameScene: preload 실행.');
        this.load.image('panel_img', 'assets/images/mainA.png');
        this.load.image('type3_panel_img', 'assets/images/mainC.png');
        this.load.image('message_area_img', 'assets/images/message_board.png');
        this.load.image('heart_full_img', 'assets/images/heart_full.png');
        this.load.image('heart_empty_img', 'assets/images/heart_empty.png');
        this.load.image('back_button_img', 'assets/images/back.png');
        this.load.image('menu_button_img', 'assets/images/menu.png');
        this.load.image('lane_line_img', 'assets/images/type1_line.png');
        this.load.image('green_line_img', 'assets/images/right_line.png');
        this.load.image('red_line_img', 'assets/images/false_line.png');
        this.load.image('retry_button', 'assets/images/retry_button.png');

        // 라운드 UI 이미지 로드
        this.load.image('round_black_img', 'assets/images/round_black.png');
        this.load.image('round_gray_img', 'assets/images/round_gray.png');
        this.load.image('round_connected_img', 'assets/images/round_connected.png');

        // 커맨드 버튼 이미지 로드
        this.load.image('button_left_img', 'assets/images/button_left.png');
        this.load.image('button_down_img', 'assets/images/button_down.png');
        this.load.image('button_right_img', 'assets/images/button_right.png');
        // 커맨드 버튼 누른 상태 이미지 로드
        this.load.image('button_left_pressed_img', 'assets/images/button_left_p.png');
        this.load.image('button_down_pressed_img', 'assets/images/button_down_p.png');
        this.load.image('button_right_pressed_img', 'assets/images/button_right_p.png');
        // 쓰레기통 이미지 로드 (닫힌 상태 및 열린 상태)
        this.binKeys.forEach(key => {
            const binImageKey = `${key}_img`;
            const binImagePath = `assets/images/${key}.png`;
            this.load.image(binImageKey, binImagePath);

            const binOpenImageKey = `${key}_open_img`;
            const binOpenImagePath = `assets/images/${key}_open.png`;
            this.load.image(binOpenImageKey, binOpenImagePath);
        });

        // 쓰레기 아이템 이미지 로드
        this.wasteRulesData.forEach(item => {
            if (item.type === 1) {
                this.load.image(`${item.id}_img`, `assets/item/${item.id}.png`);
                this.load.image(`${item.id}_black_img`, `assets/item/${item.id}_black.png`);
            }
            if (item.type === 3) {
                this.load.image(`${item.id}_img`, `assets/item/${item.id}.png`);
                this.load.image(`${item.id}_black_img`, `assets/item/${item.id}_black.png`);
            }
        });

        // Type2 아이템의 단계별 이미지 로드
        this.wasteRulesData.forEach(item => {
            if (item.type === 2) {
                // 기본 이미지 (warning 포함)
                this.load.image(`${item.id}_warning_img`, `assets/item/${item.id}_warning.png`);

                // 단계별 이미지
                if (item.preprocessingSteps) {
                    for (let i = 1; i <= item.preprocessingSteps.length + 1; i++) {
                        this.load.image(`${item.id}_step${i}_img`, `assets/item/${item.id}_step${i}.png`);
                    }
                }

                // 전처리 완료된 이미지
                this.load.image(`${item.id}_preprocessed_img`, `assets/item/${item.id}_preprocessed.png`);
            }
        });

        //type2 화면 구성 아이템 로드
        this.load.image('warning_slide_img', 'assets/images/warning_animation.png');
        this.load.image('popup_bg_img', 'assets/images/popup_bg.png');
        this.load.image('left_key_img', 'assets/images/cd_button_left.png');
        this.load.image('down_key_img', 'assets/images/cd_button_down.png');
        this.load.image('right_key_img', 'assets/images/cd_button_right.png');
        this.load.image('left_key_dim_img', 'assets/images/left_key_dim.png');
        this.load.image('down_key_dim_img', 'assets/images/down_key_dim.png');
        this.load.image('right_key_dim_img', 'assets/images/right_key_dim.png');

        //special round
        this.load.image('special_warning_slide_img', 'assets/images/special_warning_slide_img.png');
        this.load.image('special_step1_img', 'assets/images/special_step1_img.png');
        this.load.image('special_step2_img', 'assets/images/special_step2_img.png');
        this.load.image('special_step3_img', 'assets/images/special_step3_img.png');
        this.load.image('special_step4_img', 'assets/images/special_step4_img.png');
    }

    init(data) {
        this.fromBlackOverlay = data.fromBlackOverlay || false;

        // 항상 모든 상태 변수 명확히 초기화
        // 현재 플레이 레벨: data.level(씬 이동 시 전달), 없으면 최고레벨(localStorage)
        this.level = (data && data.level) ? data.level : parseInt(localStorage.getItem('level') || '1', 10);
        this.currentRound = 1;
        this.maxRounds = this.getRoundData().length;
        this.score = 0;
        // health가 data로 넘어오면 유지, 아니면 3으로 초기화
        if (typeof data.health === 'number') {
            this.health = data.health;
        } else if (typeof this.health !== 'number') {
            this.health = 3;
        }
        this.isFalling = false;
        this.isProcessingResult = false;
        this.moveLeft = false;
        this.moveRight = false;
        this.moveDownFast = false;
        this.lastKeyboardMoveTime = 0;
        this.lastLandedLaneIndex = 0;
        this.itemTimeRemaining = this.itemTimeLimit;
        this.currentOpenBinIndex = -1;
        this.gameState = 'playing';
        this.currentGameType = 1;
        this.fallCount = 0;
        this.levelStartTime = 0;
        this.currentTrashItemGraphic = null;
        this.currentTrashItemData = null;
        this.touchText = null;
        this.preprocessingSteps = null;
        this.currentPreprocessingStep = 0;
        this.currentCommandIndex = 0;
        this.messageCommandImages = [];
        this.messageTexts = [];
        this.lastResultIsCorrect = false;
        this.isWaitingForCommand = false;
        this.selectedQuizAnswer = null;
        this.cursors = null;
        this.spaceKey = null;
        this.fastFallMultiplier = 4;
        this.laneCenterXPositions = [];
        this.binTopLabelYPositions = [];
        this.binImages = [];
        this.binGraphics = [];
        this.binNameTexts = [];
        this.commandButtons = {};
        this.uiContainers = {};
        this.heartGraphics = [];
        this.itemNameText = null;
        this.roundGraphics = [];
        this.resultButton = null;
        this.resultButtonText = null;
        this.messageAreaGraphic = null;
        this.messageTextObject = null;
        this.difficultyText = null;
        this.levelText = null;
        this.scoreText = null;
        this.roundText = null;
        this.timeText = null;
        this.warningSlide = null;
        this.preprocessingPopupBg = null;
        this.preprocessingItemImage = null;
        this.type3Panel = null;
        this.type3TempPanel = null;
        this.type3LeftPanel = null;
        this.type3RightPanel = null;
        this.type3LeftText = null;
        this.type3RightText = null;
        this.leftChoiceText = null;
        this.rightChoiceText = null;
        this.incorrectPopupBg = null;
        this.retryButton = null;
        this.retryButtonText = null;
        this.blackOverlay = null;
        this.lastFallTime = 0;
        this.selectedQuizAnswer = null;
        this.quizDropZones = [];
        this.fromBlackOverlay = data && data.fromBlackOverlay;

        // 레벨 데이터 처리 추가
        if (data.level) {
            this.level = data.level;
            // 다음 레벨로 넘어갈 때 currentRound, maxRounds 등도 초기화
            this.currentRound = 1;
            this.maxRounds = this.getRoundData().length;
            console.log('GameScene: 새 레벨로 시작:', this.level);
        }
    }

    create() {
        console.log('GameScene: create 실행.');

        // 배경색 설정
        this.cameras.main.setBackgroundColor('#3cbb89');

        // UI 컨테이너 생성
        this.createUIContainers();

        // 공통 UI 생성
        this.createCommonUI();

        // 각 타입별 UI 생성
        this.createType1UI();
        this.createType2UI();
        this.createType3UI();

        // ★ 명시적으로 모든 타입 UI 숨기기
        this.uiContainers.type1.setVisible(false);
        this.uiContainers.type2.setVisible(false);
        this.uiContainers.type3.setVisible(false);
        this.uiContainers.type2Popup.setVisible(false);

        // 입력 설정
        this.setupInput();
        // 게임 상태 초기화 및 첫 라운드 시작 (즉시 시작)
        this.resetGameState();

        // 검은색 오버레이 생성 (처음에는 완전히 불투명하게)
        const { width, height } = this.sys.game.canvas;
        this.blackOverlay = this.add.rectangle(0, 0, width, height, 0x3cbb89)
            .setOrigin(0, 0)
            .setAlpha(1)
            .setDepth(100);

        // 페이드 인 효과 (검은색 -> 투명)
        this.tweens.add({
            targets: this.blackOverlay,
            alpha: 0,
            duration: 200,
            onComplete: () => {
                this.blackOverlay.destroy();
                // 아이템 낙하 시작
                this.isFalling = true;
                this.lastFallTime = this.game.getTime();
            }
        });

        console.log('GameScene: create 완료.');
    }

    createUIContainers() {
        // 각 게임 타입별 UI 컨테이너 생성
        this.uiContainers.common = this.add.container(); // 공통 UI (항상 표시)
        this.uiContainers.type1 = this.add.container();  // Type 1 UI
        this.uiContainers.type2 = this.add.container();  // Type 2 UI  
        this.uiContainers.type3 = this.add.container();  // Type 3 UI
        this.uiContainers.type2Popup = this.add.container(); // Type 2 전처리 팝업

        this.uiContainers.type1.setVisible(false);
        this.uiContainers.type2.setVisible(false);
        this.uiContainers.type3.setVisible(false);
        this.uiContainers.type2Popup.setVisible(false);
    }

    createCommonUI() {
        const { width, height } = this.sys.game.canvas;

        // 배경색 설정
        this.cameras.main.setBackgroundColor('#3CBB89'); // 초록색 배경

        // 메인 패널 배치 (330*445px, 위에서 200px 아래)
        this.panel.width = 330;
        this.panel.height = 445;
        this.panel.x = width / 2;
        this.panel.y = 180 + (this.panel.height * 0.5);

        // 메인 패널 이미지
        this.mainPanelImage = this.add.image(this.panel.x, this.panel.y, 'panel_img')
            .setDisplaySize(this.panel.width, this.panel.height)
            .setOrigin(0.5)
            .setDepth(0);
        this.uiContainers.common.add(this.mainPanelImage);

        // 메시지 영역 (330*105px, 위에서 640px 아래)
        this.messageArea.width = 330;
        this.messageArea.height = 105;
        this.messageArea.x = width / 2;
        this.messageArea.y = 640 + this.messageArea.height / 2; // 위에서 640px + 높이 절반

        this.messageAreaGraphic = this.add.image(this.messageArea.x, this.messageArea.y, 'message_area_img')
            .setDisplaySize(this.messageArea.width, this.messageArea.height)
            .setOrigin(0.5)
            .setVisible(true);
        this.uiContainers.common.add(this.messageAreaGraphic);

        const messageStyle = {
            font: '16px "머니그라피"',  // 폰트 변경
            fill: '#303030',
            align: 'left',  // 왼쪽 정렬
            wordWrap: { width: this.messageArea.width - 20 },
            letterSpacing: 0,    // 글자 간격
            lineSpacing: 16       // 줄 간격
        };

        // 메시지 위치 변경 (왼쪽 정렬, x: 80, y: 660)
        this.messageTextObject = this.add.text(80, 663, '', messageStyle)
            .setOrigin(0, 0)  // 왼쪽 상단 기준점으로 변경
            .setDepth(1)
            .setVisible(true);
        this.uiContainers.common.add(this.messageTextObject);

        // 상단 UI: 레벨, 점수, 시간
        const topY = 120;

        // 레벨 표시 (왼쪽 버튼과 중앙 사이)
        this.add.text(width * 0.35, topY - 5, '레벨', {
            font: '12px 머니그라피',
            fill: '#FFFFFF',
            align: 'center'
        }).setOrigin(0.5, 0);

        this.levelText = this.add.text(width * 0.35, topY + 12, '레벨 1', {
            font: '20px 머니그라피',
            fill: '#FFFFFF',
            align: 'center'
        }).setOrigin(0.5, 0);
        this.uiContainers.common.add(this.levelText);

        // 점수 표시 (중앙)
        this.add.text(width * 0.5, topY - 5, '환경 점수', {
            font: '12px 머니그라피',
            fill: '#FFFFFF',
            align: 'center'
        }).setOrigin(0.5, 0);

        this.scoreText = this.add.text(width * 0.5, topY + 12, '점수: 0', {
            font: '20px 머니그라피',
            fill: '#FFFFFF',
            align: 'center'
        }).setOrigin(0.5, 0);
        this.uiContainers.common.add(this.scoreText);

        // 시간 표시 (오른쪽 버튼과 중앙 사이)
        this.add.text(width * 0.65, topY - 5, '난이도', {
            font: '12px 머니그라피',
            fill: '#FFFFFF',
            align: 'center'
        }).setOrigin(0.5, 0);

        this.difficultyText = this.add.text(width * 0.65, topY + 12, '난이도 1', {
            font: '20px 머니그라피',
            fill: '#FFFFFF',
            align: 'center'
        }).setOrigin(0.5, 0);
        this.uiContainers.common.add(this.difficultyText);


        const backButton = this.add.image(80, 120, 'back_button_img')
            .setDisplaySize(29, 33)  // 크기 설정
            .setInteractive()
            .setOrigin(0, 0)
            .on('pointerdown', () => this.handleBackButton());  // 클릭 이벤트 핸들러 추가
        this.uiContainers.common.add(backButton);

        // 상단 버튼: 메뉴 (30*33px)
        const menuButton = this.add.image(330, 120, 'menu_button_img')
            .setDisplaySize(30, 33)  // 크기 설정
            .setInteractive()
            .setOrigin(0, 0)
            .on('pointerdown', () => this.handleMenuButton());  // 클릭 이벤트 핸들러 추가
        this.uiContainers.common.add(menuButton);

        this.createRoundsUI();

        // 하트 UI (위에서 260px)
        this.createHeartsUI();

        // 커맨드 버튼 생성
        this.createCommandButtons();

        // 결과 버튼들
        this.createResultButtons();
    }

    displayItemName(itemData) {
        const { width } = this.sys.game.canvas;

        // 디버깅 로그 추가
        console.log('displayItemName 호출됨');
        console.log('itemData:', itemData);
        console.log('itemData.type:', itemData.type);
        console.log('itemData.preprocessedName:', itemData.preprocessedName);
        console.log('currentTrashItemGraphic:', this.currentTrashItemGraphic);
        console.log('texture key:', this.currentTrashItemGraphic ? this.currentTrashItemGraphic.texture.key : 'null');

        // 기존 텍스트가 있으면 제거
        if (this.itemNameText) {
            this.itemNameText.destroy();
        }

        // 아이템 이름 결정
        let itemName = itemData.name;

        // TYPE2 아이템인 경우에만 특별 처리
        if (itemData.type === 2) {
            // 전처리된 이미지인지 확인
            if (this.currentTrashItemGraphic &&
                this.currentTrashItemGraphic.texture.key.includes('_preprocessed')) {
                // 전처리 후: preprocessedName 사용
                if (itemData.preprocessedName) {
                    itemName = itemData.preprocessedName;
                    console.log('TYPE2 전처리 후 이름 (preprocessedName):', itemName);
                } else {
                    itemName = itemData.name;
                    console.log('TYPE2 전처리 후 이름 (기본 name):', itemName);
                }
            } else {
                // 전처리 전: 이름 뒤에 ? 추가
                itemName = itemData.name + '?';
                console.log('TYPE2 전처리 전 이름:', itemName);
            }
        } else {
            // TYPE1, TYPE3는 기본 이름 사용
            itemName = itemData.name;
            console.log('TYPE1/TYPE3 기본 이름:', itemName);
        }

        // 새 텍스트 생성
        this.itemNameText = this.add.text(width / 2, 210, itemName, {
            font: '24px "머니그라피"',
            fill: '#FFFFFF',
            align: 'center',
            letterSpacing: 5 // 글자 간격 5로 설정
        })
            .setOrigin(0.5)
            .setDepth(15); // 다른 요소보다 앞에 표시

        // 공통 UI 컨테이너에 추가
        if (this.uiContainers && this.uiContainers.common) {
            this.uiContainers.common.add(this.itemNameText);
        }

        console.log('최종 아이템 이름 표시:', itemName);
    }

    handleBackButton() {
        // 뒤로가기 버튼 기능
        console.log('뒤로가기 버튼 클릭됨');
        // 예: 이전 씬으로 이동
        this.scene.start('PreviousScene');
    }

    handleMenuButton() {
        // 메뉴 버튼 기능
        console.log('메뉴 버튼 클릭됨');
        // 예: 메뉴 팝업 표시
        this.showMenu();
    }

    createHeartsUI() {
        // 목숨 하트 UI (위에서 260px, 첫 번째 하트 왼쪽에서 285px)

        const heartY = 260;
        const firstHeartX = 285; // 첫 번째 하트 X 위치
        const heartWidth = 21;   // 정확한 하트 너비
        const heartHeight = 18;  // 정확한 하트 높이
        const heartSpacing = 6;  // 하트 간 간격

        this.heartGraphics = [];

        // 왼쪽에서 오른쪽으로 하트 배치 (첫 번째 하트부터)
        for (let i = 0; i < 3; i++) {
            // i=0일 때 첫 번째 하트, 오른쪽으로 간격 추가
            const x = firstHeartX + (i * (heartWidth + heartSpacing));

            const heartImg = this.add.image(x, heartY, 'heart_full_img')
                .setDisplaySize(heartWidth, heartHeight) // 정확한 크기 설정
                .setOrigin(0, 0);

            this.heartGraphics.push(heartImg);
            this.uiContainers.common.add(heartImg);
        }
    }

    createRoundsUI() {
        // 기존 라운드 UI 제거
        if (this.roundGraphics) {
            this.roundGraphics.forEach(graphic => graphic.destroy());
        }
        this.roundGraphics = [];

        // 현재 레벨의 실제 라운드 수 가져오기
        const currentLevelRounds = this.getRoundData().length;
        console.log('현재 레벨 라운드 수:', currentLevelRounds);

        // 라운드 UI 위치 설정
        const roundY = 260;
        const firstRoundX = 80;
        const roundSize = 15;
        const roundSpacing = 5;

        // 실제 라운드 수만큼만 원 생성
        for (let i = 0; i < currentLevelRounds; i++) {
            const x = firstRoundX + (i * (roundSize + roundSpacing));

            // 첫 번째 원(i=0)은 검정색, 나머지는 회색
            const textureKey = (i === 0) ? 'round_black_img' : 'round_gray_img';

            const roundImg = this.add.image(x, roundY, textureKey)
                .setDisplaySize(roundSize, roundSize)
                .setOrigin(0, 0);

            this.roundGraphics.push(roundImg);
            this.uiContainers.common.add(roundImg);
        }

        // maxRounds 업데이트
        this.maxRounds = currentLevelRounds;
        console.log('라운드 UI 생성 완료. 총 라운드:', currentLevelRounds);
    }

    createResultButtons() {
        const resultButtonWidth = 100;
        const resultButtonHeight = 40;
        const resultButtonX = this.messageArea.x + this.messageArea.width / 2 - resultButtonWidth - 10;
        const resultButtonY = this.messageArea.y + this.messageArea.height / 2 - resultButtonHeight - 10;

        this.resultButton = this.add.rectangle(resultButtonX, resultButtonY, resultButtonWidth, resultButtonHeight, 0x00ff00)
            .setInteractive()
            .setVisible(false);
        this.uiContainers.common.add(this.resultButton);

        const resultButtonStyle = { font: '18px Arial', fill: '#ffffff', align: 'center' };
        this.resultButtonText = this.add.text(resultButtonX, resultButtonY, '', resultButtonStyle)
            .setOrigin(0.5)
            .setDepth(1)
            .setVisible(false);
        this.uiContainers.common.add(this.resultButtonText);

        this.resultButton.on('pointerdown', () => { this.hideResultUIAndProceed(); }, this);
    }

    createType1UI() {
        // Type 1용 쓰레기통 및 관련 UI
        this.createBinsUI();
        this.createCommandButtons();
        this.laneIndicatorLine = this.add.image(0, 0, 'lane_line_img')
            .setDepth(1)
            .setVisible(false);
        this.uiContainers.type1.add(this.laneIndicatorLine);
    }

    createBinsUI() {
        const binY = 581;
        const firstBinX = 75; // 왼쪽에서 75px (첫 번째 쓰레기통)
        const binWidth = 50;
        const binHeight = 34;
        const binSpacing = 10
        const labelYOffset = 16;

        this.binGraphics = [];
        this.laneCenterXPositions = [];
        this.binTopLabelYPositions = [];
        this.binImages = [];
        this.binNameTexts = []; // 쓰레기통 이름 텍스트 배열 추가

        this.binKeys.forEach((key, index) => {
            // 왼쪽부터 첫 번째 쓰레기통 위치에 간격을 더해 배치
            const binX = firstBinX + (index * (binWidth + binSpacing));
            const binCenterX = binX + (binWidth / 2); // 중앙 위치 (텍스트 정렬용)

            // 쓰레기통 이미지 추가 (왼쪽 상단 기준점)
            const binImageKey = `${key}_img`;
            const binImg = this.add.image(binX, binY, binImageKey)
                .setDisplaySize(binWidth, binHeight)
                .setOrigin(0, 0) // 왼쪽 상단이 기준점
                .setDepth(5);
            this.binImages.push(binImg);
            this.uiContainers.type1.add(binImg);

            // 쓰레기통 중앙 X 좌표 저장 (판정이나 떨어지는 아이템 정렬용)
            this.laneCenterXPositions.push(binCenterX);

            // 라벨 위치 계산 (쓰레기통 위)
            const labelY = binY - labelYOffset;
            this.binTopLabelYPositions[index] = labelY;

            // 쓰레기통 정보 저장 (판정용) - 왼쪽 상단 기준으로 좌표 조정
            this.binGraphics.push({
                key: key,
                x: binX, // 왼쪽 상단 X
                y: binY, // 왼쪽 상단 Y
                width: binWidth,
                height: binHeight,
                left: binX, // 왼쪽 가장자리
                right: binX + binWidth // 오른쪽 가장자리
            });

            // 쓰레기통 이름 텍스트
            const nameStyle = { font: '14px 머니그라피', fill: '#303030', align: 'center' };
            const binName = this.binNames[index];
            // 텍스트는 쓰레기통의 상단 중앙에 배치
            const nameText = this.add.text(binCenterX, labelY, binName, nameStyle).setOrigin(0.5, 1);
            this.uiContainers.type1.add(nameText);
            this.binNameTexts.push(nameText);
        });
    }

    /*createCommandButtons() {
        const { width } = this.sys.game.canvas;
        // 기존 버튼이 있으면 먼저 제거
        if (this.commandButtons.left) {
            this.commandButtons.left.destroy();
            this.commandButtons.left = null;
        }
        if (this.commandButtons.down) {
            this.commandButtons.down.destroy();
            this.commandButtons.down = null;
        }
        if (this.commandButtons.right) {
            this.commandButtons.right.destroy();
            this.commandButtons.right = null;
        }

        // this.commandButtons가 객체가 아니면 초기화
        if (!this.commandButtons) {
            this.commandButtons = {};
        }

        // 커맨드 버튼 크기 및 위치
        const buttonSize = 80;
        const buttonHeight = 85;

        // 왼쪽 버튼 (위 760px, 왼쪽 70px)
        this.commandButtons.left = this.add.image(70, 760, 'button_left_img')
            .setDisplaySize(buttonSize, buttonHeight)
            .setOrigin(0, 0)
            .setInteractive();
        this.commandButtons.left.on('pointerdown', () => {
            this.moveLeft = true;
            this.commandButtons.left.setTexture('button_left_pressed_img');
        });
        this.commandButtons.left.on('pointerup', () => {
            this.moveLeft = false;
            this.commandButtons.left.setTexture('button_left_img');
        });
        this.commandButtons.left.on('pointerout', () => {
            this.moveLeft = false;
            this.commandButtons.left.setTexture('button_left_img');
        });
        // 중요: common 컨테이너에 추가
        this.uiContainers.common.add(this.commandButtons.left);

        // 가운데 버튼 (위 760px, 왼쪽 180px)
        this.commandButtons.down = this.add.image(180, 760, 'button_down_img')
            .setDisplaySize(buttonSize, buttonHeight)
            .setOrigin(0, 0)
            .setInteractive();
        this.commandButtons.down.on('pointerdown', () => {
            this.moveDownFast = true;
            this.commandButtons.down.setTexture('button_down_pressed_img');
        });
        this.commandButtons.down.on('pointerup', () => {
            this.moveDownFast = false;
            this.commandButtons.down.setTexture('button_down_img');
        });
        this.commandButtons.down.on('pointerout', () => {
            this.moveDownFast = false;
            this.commandButtons.down.setTexture('button_down_img');
        });
        // 중요: common 컨테이너에 추가
        this.uiContainers.common.add(this.commandButtons.down);

        // 오른쪽 버튼 (위 760px, 왼쪽 290px)
        this.commandButtons.right = this.add.image(290, 760, 'button_right_img')
            .setDisplaySize(buttonSize, buttonHeight)
            .setOrigin(0, 0)
            .setInteractive();
        this.commandButtons.right.on('pointerdown', () => {
            this.moveRight = true;
            this.commandButtons.right.setTexture('button_right_pressed_img');
        });
        this.commandButtons.right.on('pointerup', () => {
            this.moveRight = false;
            this.commandButtons.right.setTexture('button_right_img');
        });
        this.commandButtons.right.on('pointerout', () => {
            this.moveRight = false;
            this.commandButtons.right.setTexture('button_right_img');
        });


        this.commandButtons.left.on('pointerdown', () => {
            this.moveLeft = true;
            this.commandButtons.left.setTexture('button_left_pressed_img');
            if (this.isProcessingResult) {
                this.handlePreprocessingCommand('left');
            }
        });

        this.commandButtons.down.on('pointerdown', () => {
            this.moveDownFast = true;
            this.commandButtons.down.setTexture('button_down_pressed_img');
            if (this.isProcessingResult) {
                this.handlePreprocessingCommand('down');
            }
        });

        this.commandButtons.right.on('pointerdown', () => {
            this.moveRight = true;
            this.commandButtons.right.setTexture('button_right_pressed_img');
            if (this.isProcessingResult) {
                this.handlePreprocessingCommand('right');
            }
        });

        // 중요: common 컨테이너에 추가
        this.uiContainers.common.add(this.commandButtons.right);
    }*/


    createCommandButtons() {
        // 기존 버튼이 있으면 먼저 제거
        if (this.commandButtons.left) this.commandButtons.left.destroy();
        if (this.commandButtons.down) this.commandButtons.down.destroy();
        if (this.commandButtons.right) this.commandButtons.right.destroy();

        const buttonSize = 80;
        const buttonHeight = 85;

        // 왼쪽 버튼 생성 및 이벤트 설정
        this.commandButtons.left = this.add.image(70, 760, 'button_left_img')
            .setDisplaySize(buttonSize, buttonHeight)
            .setOrigin(0, 0)
            .setInteractive();

        // 가운데 버튼 생성 및 이벤트 설정
        this.commandButtons.down = this.add.image(180, 760, 'button_down_img')
            .setDisplaySize(buttonSize, buttonHeight)
            .setOrigin(0, 0)
            .setInteractive();

        // 오른쪽 버튼 생성 및 이벤트 설정
        this.commandButtons.right = this.add.image(290, 760, 'button_right_img')
            .setDisplaySize(buttonSize, buttonHeight)
            .setOrigin(0, 0)
            .setInteractive();

        const setupButtonListeners = (button, direction, pressedTexture, normalTexture) => {
            button.removeAllListeners(); // 기존 리스너 제거

            let isProcessing = false; // 처리 중 플래그 추가

            button.on('pointerdown', () => {
                if (isProcessing) return; // 처리 중이면 무시

                // Type 2나 Special Round일 때만 터치 제어 적용
                if ((this.isProcessingResult && this.currentGameType === 2) ||
                    this.specialStepInputEnabled) {

                    if (this.canClick && this.checkTouchDelay()) {
                        isProcessing = true; // 처리 시작

                        if (this.isProcessingResult && this.currentGameType === 2) {
                            this.handlePreprocessingCommand(direction);
                        } else if (this.specialStepInputEnabled) {
                            this.processSpecialCommandInput(direction);
                        }

                        this.disableClickTemporarily();

                        // 처리 완료 후 플래그 해제
                        this.time.delayedCall(300, () => {
                            isProcessing = false;
                        });
                    }
                } else {
                    // 일반 게임플레이 상태일 때는 즉시 반응
                    switch (direction) {
                        case 'left':
                            this.moveLeft = true;
                            break;
                        case 'down':
                            this.moveDownFast = true;
                            break;
                        case 'right':
                            this.moveRight = true;
                            break;
                    }
                }
            });

            button.on('pointerup', () => {
                button.setTexture(normalTexture);
                switch (direction) {
                    case 'left':
                        this.moveLeft = false;
                        break;
                    case 'down':
                        this.moveDownFast = false;
                        break;
                    case 'right':
                        this.moveRight = false;
                        break;
                }
            });

            button.on('pointerout', () => {
                button.setTexture(normalTexture);
                switch (direction) {
                    case 'left':
                        this.moveLeft = false;
                        break;
                    case 'down':
                        this.moveDownFast = false;
                        break;
                    case 'right':
                        this.moveRight = false;
                        break;
                }
            });
        };

        // 각 버튼에 리스너 설정
        setupButtonListeners(this.commandButtons.left, 'left', 'button_left_pressed_img', 'button_left_img');
        setupButtonListeners(this.commandButtons.down, 'down', 'button_down_pressed_img', 'button_down_img');
        setupButtonListeners(this.commandButtons.right, 'right', 'button_right_pressed_img', 'button_right_img');

        // 버튼들을 common 컨테이너에 추가
        this.uiContainers.common.add(this.commandButtons.left);
        this.uiContainers.common.add(this.commandButtons.down);
        this.uiContainers.common.add(this.commandButtons.right);
    }

    // 터치 딜레이 체크
    checkTouchDelay() {
        const currentTime = new Date().getTime();
        if (currentTime - this.lastTouchTime < 100) { // 100ms 내 터치는 무시
            return false;
        }
        this.lastTouchTime = currentTime;
        return true;
    }

    // 클릭 일시 비활성화
    disableClickTemporarily() {
        this.canClick = false;
        this.time.delayedCall(100, () => {  // 100ms 후 다시 활성화
            this.canClick = true;
        });
    }


    createType2UI() {
        // Type 2는 기본적으로 Type 1과 같은 UI를 사용
        // 전처리 팝업만 별도로 생성
        this.preprocessingInputEnabled = false;
        this.preprocessingSteps = null;
        this.currentPreprocessingStep = 0;

        // 여기서 createPreprocessingPopup 호출 제거
        // 팝업은 아이템 클릭 시에만 생성됨

        console.log('GameScene: Type 2 UI 초기화 완료');
    }

    createType3UI() {
        const { width, height } = this.sys.game.canvas;

        // 기존 UI 컨테이너가 비어있는지 확인 (재생성 방지)
        //if (this.uiContainers.type3.list.length > 0) {
        //  console.log('GameScene: Type 3 UI가 이미 생성됨');
        //return;
        //}

        console.log('GameScene: Type 3 UI 생성 시작');
        /*
                // 패널이 텍스처로 존재하는지 확인
                if (this.textures.exists('type3_panel_img')) {
                    // 이미지로 패널 생성
                    this.type3Panel = this.add.image(
                        width / 2,
                        height / 2,
                        'type3_panel_img'
                    ).setDisplaySize(width * 0.8, height * 0.6)
                        .setDepth(0);
                    this.uiContainers.type3.add(this.type3Panel);
                } else {
                    console.log('GameScene: type3_panel_img가 없음, 임시 패널 생성');
                    // 임시 패널 생성 (텍스처가 없을 경우)
                    this.type3TempPanel = this.add.rectangle(
                        width / 2,
                        height / 2,
                        width * 0.8,
                        height * 0.6,
                        0xffffff, // 흰 배경
                        1
                    ).setOrigin(0.5);
                    this.uiContainers.type3.add(this.type3TempPanel);
        
                    // 좌우 색상 구분
                    this.type3LeftPanel = this.add.rectangle(
                        width / 2 - width * 0.8 / 4,
                        height / 2,
                        width * 0.8 / 2,
                        height * 0.6,
                        0xffeebb, // 왼쪽 패널 색상 (연한 노란색)
                        1
                    ).setOrigin(0.5);
                    this.uiContainers.type3.add(this.type3LeftPanel);
        
                    this.type3RightPanel = this.add.rectangle(
                        width / 2 + width * 0.8 / 4,
                        height / 2,
                        width * 0.8 / 2,
                        height * 0.6,
                        0xccffdd, // 오른쪽 패널 색상 (연한 초록색)
                        1
                    ).setOrigin(0.5);
                    this.uiContainers.type3.add(this.type3RightPanel);
                }*/


        if (!this.type3LeftText) {
            this.type3LeftText = this.add.text(
                94, 570,
                '일반쓰레기',
                {
                    font: '20px 머니그라피',
                    fill: '#000000',
                    align: 'center',
                    fontStyle: 'bold'
                }
            ).setOrigin(0, 0).setDepth(10);
            this.uiContainers.type3.add(this.type3LeftText);
        }

        if (!this.type3RightText) {
            this.type3RightText = this.add.text(
                245, 570,
                '음식물쓰레기',
                {
                    font: '20px 머니그라피',
                    fill: '#000000',
                    align: 'center',
                    fontStyle: 'bold'
                }
            ).setOrigin(0, 0).setDepth(10);
            this.uiContainers.type3.add(this.type3RightText);
        }
        console.log('type3LeftText:', this.type3LeftText);
        console.log('type3RightText:', this.type3RightText);

        console.log('type3LeftText position:', this.type3LeftText.x, this.type3LeftText.y);
        console.log('type3RightText position:', this.type3RightText.x, this.type3RightText.y);

        // 초기에는 숨김
        this.uiContainers.type3.setVisible(false);

        console.log('GameScene: Type 3 UI 생성 완료');
    }

    setupInput() {
        this.cursors = this.input.keyboard.createCursorKeys();
        this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

        // Type 2 커맨드 키 설정
        this.leftKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.LEFT);
        this.rightKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.RIGHT);
        this.downKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.DOWN);

        // 키보드 이벤트에 전처리 커맨드 처리 추가
        this.input.keyboard.on('keydown', (event) => {
            if (this.preprocessingInputEnabled) {
                switch (event.keyCode) {
                    case Phaser.Input.Keyboard.KeyCodes.LEFT:
                        this.handlePreprocessingCommand('left');
                        break;
                    case Phaser.Input.Keyboard.KeyCodes.DOWN:
                        this.handlePreprocessingCommand('down');
                        break;
                    case Phaser.Input.Keyboard.KeyCodes.RIGHT:
                        this.handlePreprocessingCommand('right');
                        break;
                }
            }
        });
    }

    update(time, delta) {
        const deltaInSeconds = delta / 1000;

        // 매 120프레임마다 팝업 객체 확인 (약 2초마다)
        if (time % 120 === 0) {
            // 'popup_bg_img' 텍스처를 사용하는 객체 수 확인
            const popupCount = this.children.list.filter(
                obj => obj.texture && obj.texture.key === 'popup_bg_img'
            ).length;

            if (popupCount > 0) {
                console.log('현재 팝업 배경 객체 수:', popupCount);
            }
        }

        // 아이템 상태 로깅 (매 60프레임마다)
        if (time % 60 === 0 && this.currentTrashItemGraphic) {
            console.log('아이템 상태:',
                'visible:', this.currentTrashItemGraphic.visible,
                'active:', this.currentTrashItemGraphic.active,
                'y:', this.currentTrashItemGraphic.y);
        }

        // 게임 타입별 업데이트
        switch (this.currentGameType) {
            case 1:
                this.updateType1(time, delta);
                break;
            case 2:
                if (this.gameState === 'preprocessing') {
                    this.updateType2Preprocessing();
                } else {
                    this.updateType1(time, delta); // Type 2는 기본적으로 Type 1과 같음
                }
                break;
            case 3:
                this.updateType3(time, delta);
                break;
        }
    }

    updateType1(time, delta) {
        // isProcessingResult가 true면 업데이트 중단
        if (!this.currentTrashItemGraphic || !this.isFalling || this.isProcessingResult) return;

        const currentTime = time;

        // 픽셀 단위 낙하 로직
        if (!this.lastFallTime) {
            this.lastFallTime = currentTime;
        }

        let fallInterval = 710;
        if (this.cursors.down.isDown || this.moveDownFast) {
            fallInterval = fallInterval / this.fastFallMultiplier; // 빠르게
        }

        if (currentTime - this.lastFallTime >= fallInterval) {
            // 아이템 낙하
            this.currentTrashItemGraphic.y += 20;
            this.lastFallTime = currentTime;

            // 낙하 횟수 증가
            this.fallCount = (this.fallCount || 0) + 1;

            // 디버깅 로그 추가
            console.log('낙하 횟수:', this.fallCount, '게임 타입:', this.currentGameType);

            // TYPE2 아이템이고 한 번 떨어진 후에 '터치!' 텍스트 생성
            if (this.currentGameType === 2 && this.fallCount === 1 && !this.touchText) {
                console.log('터치 텍스트 생성 시도');

                const itemWidth = this.currentTrashItemGraphic.displayWidth;
                const touchX = this.currentTrashItemGraphic.x + itemWidth / 2;
                const touchY = this.currentTrashItemGraphic.y - 2;

                this.touchText = this.add.text(touchX, touchY, '터 치!', {
                    font: '16px 머니그라피',
                    fill: '#E2250E',
                    stroke: '#FFFFFF',
                    strokeThickness: 2,
                    align: 'center'
                })
                    .setOrigin(0.5, 1)
                    .setDepth(11);

                console.log('터치 텍스트 생성 완료:', this.touchText);
            }

            // '터치!' 텍스트가 있으면 아이템과 함께 이동
            if (this.touchText) {
                this.touchText.y = this.currentTrashItemGraphic.y - 2;
                this.touchText.x = this.currentTrashItemGraphic.x + this.currentTrashItemGraphic.displayWidth / 2;
            }
        }

        // 좌우 이동 로직
        if (this.cursors.left.isDown || this.moveLeft || this.cursors.right.isDown || this.moveRight) {
            if (currentTime - this.lastKeyboardMoveTime > this.keyboardMoveDelay) {
                const direction = (this.cursors.left.isDown || this.moveLeft) ? -1 : 1;
                this.moveLaneHorizontal(direction);
                this.lastKeyboardMoveTime = currentTime;
            }
        } else {
            this.lastKeyboardMoveTime = currentTime - this.keyboardMoveDelay;
        }

        // 충돌 판정 - 고정 y 좌표 사용
        const collisionY = 535; // 충돌 판정을 위한 고정 y 좌표

        // 중요: 아이템의 하단 y좌표 계산 방식 변경
        // 전처리 완료된 아이템인지 확인
        const isPreprocessed = this.currentTrashItemGraphic.texture.key.includes('_preprocessed');

        // 아이템 하단 y좌표 계산 (전처리 완료된 아이템은 다른 오프셋 적용)
        let itemBottomY;
        if (isPreprocessed) {
            // 전처리 완료된 아이템은 정확한 충돌 위치 계산
            itemBottomY = this.currentTrashItemGraphic.y + 60; // 정확히 60px 높이 사용

            // 디버깅 로그
            console.log('전처리된 아이템 충돌 계산:',
                'y:', this.currentTrashItemGraphic.y,
                'bottomY:', itemBottomY,
                'collisionY:', collisionY,
                'diff:', collisionY - itemBottomY);
        } else {
            // 일반 아이템은 기존 방식 유지
            itemBottomY = this.currentTrashItemGraphic.y + this.currentTrashItemGraphic.height;
        }

        if (itemBottomY >= collisionY && !this.isProcessingResult) {
            console.log('GameScene: 아이템이 충돌 판정 위치에 도달!');
            this.isFalling = false;

            // 아이템 위치 조정
            this.currentTrashItemGraphic.y = collisionY - (isPreprocessed ? 60 : this.currentTrashItemGraphic.height);

            // '터치!' 텍스트 위치도 조정 (TYPE2 아이템인 경우)
            if (this.currentGameType === 2 && this.touchText) {
                this.touchText.y = this.currentTrashItemGraphic.y - 2;
            }

            // Type 2 아이템이지만 전처리 전인 경우에만 대기 상태로 전환
            if (this.currentGameType === 2 && !this.currentTrashItemGraphic.texture.key.includes('_preprocessed')) {
                // 메시지 업데이트 (전처리 필요 안내)
                if (this.messageTextObject && this.currentTrashItemGraphic.itemData.messageWarning) {
                    this.messageTextObject.setText(this.currentTrashItemGraphic.itemData.messageWarning);
                }

                // 아이템이 깜빡이도록 하여 클릭 유도
                this.tweens.add({
                    targets: [this.currentTrashItemGraphic, this.touchText],
                    alpha: 0.6,
                    yoyo: true,
                    duration: 500,
                    repeat: -1
                });

                console.log('GameScene: Type 2 아이템 대기 상태로 전환');
            } else {
                // Type 1 아이템이거나 전처리 완료된 Type 2 아이템은 결과 처리
                this.isProcessingResult = true;
                this.triggerResultState(this.currentLaneIndex, 'collision');
            }
        }

        // 화면 밖으로 떨어졌을 때 처리
        if (this.currentTrashItemGraphic.y > this.sys.game.canvas.height && !this.isProcessingResult) {
            console.log('GameScene: 화면 밖으로 떨어짐');
            this.isFalling = false;
            this.isProcessingResult = true;
            this.triggerResultState(null, 'floor');
        }
    }


    updateType2Preprocessing() {
        // 키보드 입력 체크
        if (this.isWaitingForCommand) {
            if (this.leftKey.isDown) {
                this.handlePreprocessingCommand('left');
            } else if (this.rightKey.isDown) {
                this.handlePreprocessingCommand('right');
            } else if (this.downKey.isDown) {
                this.handlePreprocessingCommand('down');
            }
        }
    }

    updateType3(time, delta) {
        if (!this.currentTrashItemGraphic || !this.isFalling) return;

        const currentTime = time;
        const { width, height } = this.sys.game.canvas;

        // 픽셀 단위 낙하를 위한 타이머 확인
        if (!this.lastFallTime) {
            this.lastFallTime = currentTime;
        }

        // 낙하 로직
        let fallInterval = 700;
        if (this.cursors.down.isDown || this.moveDownFast) {
            fallInterval = fallInterval / this.fastFallMultiplier;
        }

        if (currentTime - this.lastFallTime >= fallInterval) {
            this.currentTrashItemGraphic.y += 20;
            this.lastFallTime = currentTime;
        }

        // 좌우 이동 로직
        if (this.cursors.left.isDown || this.moveLeft || this.cursors.right.isDown || this.moveRight) {
            if (currentTime - this.lastKeyboardMoveTime > this.keyboardMoveDelay) {
                const newLaneIndex = (this.cursors.left.isDown || this.moveLeft) ? 0 : 1;
                if (this.currentLaneIndex !== newLaneIndex) {
                    this.currentLaneIndex = newLaneIndex;
                    const leftX = 110;
                    const rightX = 270;
                    const targetX = (this.currentLaneIndex === 0) ? leftX : rightX;
                    this.currentTrashItemGraphic.x = targetX;
                    this.lastKeyboardMoveTime = currentTime;
                    console.log('GameScene: Type 3 아이템 이동 ->', this.currentLaneIndex ? '오른쪽' : '왼쪽');
                }
            }
        } else {
            this.lastKeyboardMoveTime = currentTime - this.keyboardMoveDelay;
        }

        // 패널 바닥 충돌 판정 - 명확한 값으로 수정
        const panelBottom = 535; // 패널 바닥 y좌표(535+20)
        const itemBottomY = this.currentTrashItemGraphic.y + this.currentTrashItemGraphic.height;

        // 충돌 감지 로그 추가
        if (itemBottomY >= panelBottom) {
            console.log('TYPE3 충돌 감지! itemBottomY:', itemBottomY, 'panelBottom:', panelBottom);
            this.isFalling = false;
            this.isProcessingResult = true;

            // 아이템 위치 조정 (바닥에 정확히 닿도록)
            this.currentTrashItemGraphic.y = panelBottom - this.currentTrashItemGraphic.height;

            // 정답 확인 (currentLaneIndex가 0이면 왼쪽, 1이면 오른쪽)
            const isCorrect = (this.currentLaneIndex === 0 && this.currentTrashItemGraphic.itemData.correctAnswer === 'left') ||
                (this.currentLaneIndex === 1 && this.currentTrashItemGraphic.itemData.correctAnswer === 'right');

            this.triggerResultState(this.currentLaneIndex, 'collision', isCorrect);
        }

        // 화면 밖으로 떨어졌을 때 처리 - 더 넓은 범위로 설정
        if (this.currentTrashItemGraphic.y > this.sys.game.canvas.height + 200) {
            console.log('GameScene: 화면 밖으로 떨어짐, y:', this.currentTrashItemGraphic.y);
            this.isFalling = false;
            this.isProcessingResult = true;
            this.triggerResultState(null, 'floor');
        }
    }


    // GameScene 클래스 내에 다음 함수 추가
    switchGameTypeUI(gameType) {
        console.log('GameScene: UI 전환 - 타입', gameType);

        // 기존 아이템 제거 (혹시라도 있다면)
        if (this.currentTrashItemGraphic) {
            this.currentTrashItemGraphic.destroy();
            this.currentTrashItemGraphic = null;
        }

        // 모든 UI 컨테이너 숨김
        this.uiContainers.type1.setVisible(false);
        this.uiContainers.type2.setVisible(false);
        this.uiContainers.type3.setVisible(false);
        this.uiContainers.type2Popup.setVisible(false);

        // 공통 UI는 항상 표시
        this.uiContainers.common.setVisible(true);

        // 해당 타입 UI만 표시
        switch (gameType) {
            case 1:
                console.log('GameScene: Type 1 UI 표시');
                this.uiContainers.type1.setVisible(true);
                break;
            case 2:
                console.log('GameScene: Type 2 UI 표시');
                this.uiContainers.type1.setVisible(true); // Type 2는 Type 1 UI 사용
                break;
            case 3:
                console.log('GameScene: Type 3 UI 표시');
                this.uiContainers.type3.setVisible(true);
                break;
        }

        // 메인 패널 제어 (Type 3에서만 숨김)
        const mainPanel = this.children.getByName('main_panel');
        if (mainPanel) {
            mainPanel.setVisible(gameType !== 3);
            console.log('GameScene: 메인 패널 표시 여부:', gameType !== 3);
        }

        this.gameState = 'playing';
    }

    spawnWasteItem() {
        console.log('GameScene: 아이템 생성 시작, 현재 라운드:', this.currentRound);

        // 쓰레기통 상태 확인 및 리셋
        this.currentLaneIndex = 2; // 첫 번째 라인에서 시작
        this.currentOpenBinIndex = -1; // 열린 쓰레기통 인덱스 초기화

        // 모든 쓰레기통 닫힌 상태로 리셋
        this.resetAllBins();

        // 모든 타입별 UI 정리
        this.cleanupType3UI();

        // 현재 라운드에 맞는 아이템 가져오기
        const currentRoundData = this.getRoundData().find(round => round.round === this.currentRound);
        if (!currentRoundData) {
            console.error('GameScene: 현재 라운드 데이터를 찾을 수 없음:', this.currentRound);
            return;
        }

        const itemData = this.wasteRulesData.find(item => item.id === currentRoundData.itemId);
        if (!itemData) {
            console.error('GameScene: 아이템 데이터를 찾을 수 없음:', currentRoundData.itemId);
            return;
        }

        console.log('GameScene: 생성할 아이템:', itemData.name, '타입:', itemData.type);

        this.updateBinVisuals(this.currentLaneIndex);

        // 난이도 표시 업데이트
        if (this.difficultyText) {
            this.difficultyText.setText(`${itemData.difficulty}`);
        }

        this.currentTrashItemData = itemData;
        this.currentGameType = itemData.type;

        // 메인 패널 이미지 변경
        this.updateMainPanelForGameType(this.currentGameType);

        // 타입별 스폰 처리
        if (this.currentGameType === 1) {
            this.spawnType1Item(itemData);
        } else if (this.currentGameType === 2) {
            this.spawnType2Item(itemData);
        } else if (this.currentGameType === 3) {
            this.spawnType3Item(itemData);
        }
    }

    // 이 함수 추가
    updateMainPanelForGameType(gameType) {
        console.log('GameScene: 메인 패널 업데이트, 게임 타입:', gameType);

        // 저장된 메인 패널 참조 사용
        if (!this.mainPanelImage) {
            console.error('GameScene: 메인 패널 참조가 없음!');
            return;
        }

        // 게임 타입에 따라 이미지 변경
        if (gameType === 3) {
            // Type 3용 이미지로 변경
            if (this.textures.exists('type3_panel_img')) {
                // 메인 패널 이미지를 Type 3 패널 이미지로 변경
                this.mainPanelImage.setTexture('type3_panel_img');
                console.log('GameScene: 메인 패널 이미지를 Type 3로 변경 성공');
            } else {
                console.error('GameScene: type3_panel_img 텍스처가 존재하지 않음!');
            }

            // Type 1 요소는 보이지 않게 처리 (쓰레기통 등)
            this.binImages.forEach(bin => bin.setVisible(false));

            // 쓰레기통 이름도 숨김
            if (this.binNameTexts) {
                this.binNameTexts.forEach(text => text.setVisible(false));
            }
            // 검정 라인 숨김
            if (this.laneIndicatorLine) {
                this.laneIndicatorLine.setVisible(false);
            }

            console.log('GameScene: Type 3 - 쓰레기통과 이름 숨김, 커맨드 버튼 유지');
        } else {
            // 기본 이미지로 변경
            this.mainPanelImage.setTexture('panel_img');
            console.log('GameScene: 메인 패널 이미지를 기본으로 변경');

            // Type 3 이지선다 텍스트 숨김
            if (this.leftChoiceText) this.leftChoiceText.setVisible(false);
            if (this.rightChoiceText) this.rightChoiceText.setVisible(false);

            // Type 1 쓰레기통 다시 표시
            this.binImages.forEach(bin => bin.setVisible(true));

            // 쓰레기통 이름도 다시 표시
            if (this.binNameTexts) {
                this.binNameTexts.forEach(text => text.setVisible(true));
            }

            console.log('GameScene: Type 1 UI 복원 완료');
        }
    }

    spawnType1Item(itemData) {
        const itemWidth = 60;
        const itemHeight = 60;
        const firstLaneX = 70;  // 왼쪽에서 70px
        const startY = 300;     // 위에서 300px

        // 레인 위치 계산 (각 라인 60px 간격)
        this.currentLaneIndex = 2; // 항상 첫 번째 레인에서 시작
        const lanePositions = [];
        for (let i = 0; i < this.binKeys.length; i++) {
            lanePositions.push(firstLaneX + (i * 60));
        }
        this.laneCenterXPositions = lanePositions; // 레인 중앙 위치 업데이트

        const startX = this.laneCenterXPositions[this.currentLaneIndex];

        // 아이템 이미지 키 결정 (itemData.id + "_img")
        const itemImageKey = `${itemData.id}_img`;

        // 이미지로 생성
        this.currentTrashItemGraphic = this.add.image(startX, startY, itemImageKey)
            .setDisplaySize(itemWidth, itemHeight)
            .setOrigin(0, 0) // 왼쪽 상단 기준점
            .setDepth(10);   // 다른 요소들보다 앞에 표시

        // 중요: 아이템이 실제로 생성되었는지 확인
        console.log('아이템 생성 확인:', this.currentTrashItemGraphic.texture.key,
            'x:', this.currentTrashItemGraphic.x,
            'y:', this.currentTrashItemGraphic.y);

        this.currentTrashItemGraphic.itemData = itemData;
        this.currentTrashItemGraphic.setActive(true);

        // 메시지 업데이트
        if (this.messageTextObject && itemData.messageInitial) {
            this.messageTextObject.setText(itemData.messageInitial);
        }
        // 아이템 이름 표시 추가
        console.log('spawnType1Item에서 displayItemName 호출');
        this.displayItemName(itemData);


        // 시간 타이머 리셋
        this.itemTimeRemaining = this.itemTimeLimit;
        this.isFalling = true;
        this.isProcessingResult = false; // 중요: 결과 처리 상태 초기화
        this.lastFallTime = this.game.getTime(); // 픽셀 단위 낙하를 위한 타이머 초기화

        // 시작 레인의 쓰레기통 열기
        this.updateBinVisuals(this.currentLaneIndex);

        console.log('GameScene: Type 1 아이템 생성 완료:', itemData.name);
    }

    spawnType2Item(itemData) {
        // 게임 상태 명시적 초기화
        this.gameState = 'playing';
        this.isProcessingResult = false;
        this.preprocessingInputEnabled = false;
        this.currentPreprocessingStep = 0;
        this.fallCount = 0;

        // Type1과 거의 동일하게 처리
        const itemWidth = 60;
        const itemHeight = 60;
        const firstLaneX = 70;
        const startY = 300;

        // 레인 위치 계산
        this.currentLaneIndex = 2;
        const lanePositions = [];
        for (let i = 0; i < this.binKeys.length; i++) {
            lanePositions.push(firstLaneX + (i * 60));
        }
        this.laneCenterXPositions = lanePositions;

        const startX = this.laneCenterXPositions[this.currentLaneIndex];

        // 경고 아이콘이 있는 아이템 이미지 키
        const warningImageKey = `${itemData.id}_warning_img`;

        // 이미지로 생성
        this.currentTrashItemGraphic = this.add.image(startX, startY, warningImageKey)
            .setDisplaySize(itemWidth, itemHeight)
            .setOrigin(0, 0)
            .setDepth(10)
            .setInteractive();

        // 아이템 데이터 설정
        this.currentTrashItemGraphic.itemData = itemData;
        this.currentTrashItemGraphic.setActive(true);

        // 아이템 이름 표시 (TYPE2인 경우 ? 추가되어야 함)
        console.log('spawnType2Item에서 displayItemName 호출');
        this.displayItemName(itemData);

        /*/ '터치!' 텍스트 추가 (아이템 위 2픽셀 위치)
        this.touchText = this.add.text(
            startX + itemWidth / 2,
            startY - 2,
            '터 치!',
            {
                font: '16px 머니그라피',
                fill: '#E2250E',
                stroke: '#FFFFFF',
                strokeThickness: 2,
                align: 'center'
            }
        )
            .setOrigin(0.5, 1) // 텍스트 중앙 하단 기준
            .setDepth(11); // 아이템보다 위에 표시*/

        // Type 2 아이템에만 클릭 핸들러 추가
        this.currentTrashItemGraphic.on('pointerdown', this.onType2ItemClick, this);

        // 아이템 데이터 설정
        this.currentTrashItemGraphic.itemData = itemData;
        this.currentTrashItemGraphic.setActive(true);

        // 메시지 업데이트
        if (this.messageTextObject && itemData.messageInitial) {
            this.messageTextObject.setText(itemData.messageInitial);
        }

        // 시간 타이머 리셋
        this.itemTimeRemaining = this.itemTimeLimit;
        this.isFalling = true;
        this.lastFallTime = this.game.getTime();

        // Type1과 동일하게 시작 레인의 쓰레기통 열기
        this.updateBinVisuals(this.currentLaneIndex);

        console.log('GameScene: Type 2 아이템 생성:', itemData.name);
    }


    // spawnType3Item 함수 수정
    spawnType3Item(itemData) {
        console.log('GameScene: Type 3 아이템 생성');
        if (!this.type3LeftText || !this.type3RightText) {
            console.error('Type3 선택지 텍스트가 생성되지 않았습니다!');
        }

        if (this.uiContainers.type3) {
            this.uiContainers.type3.setVisible(true);
        }

        const { width, height } = this.sys.game.canvas;

        // 아이템 크기
        const itemWidth = 60;
        const itemHeight = 60;

        // 왼쪽 레인에 아이템 배치
        const startX = 110; // 왼쪽에서 110px
        const startY = 300; // 위에서 300px

        // 패널 바닥 위치 정의 (여기서 정의!)
        const panelBottom = 555; // 패널 바닥 y좌표

        // 아이템 이미지 키
        const itemImageKey = `${itemData.id}_img`;

        // 이미지로 생성
        this.currentTrashItemGraphic = this.add.image(startX, startY, itemImageKey)
            .setDisplaySize(itemWidth, itemHeight)
            .setOrigin(0, 0)
            .setDepth(10);

        this.currentTrashItemGraphic.itemData = itemData;

        // 초기 레인 인덱스는 왼쪽(0)
        this.currentLaneIndex = 0;

        // 메시지 업데이트
        if (this.messageTextObject) {
            this.messageTextObject.setText(itemData.quizQuestion || '닭뼈는 어떤 종류의 쓰레기일까?\n왼쪽은 일반쓰레기, 오른쪽은 음식물쓰레기!');
        }

        // 이전 선택지 텍스트가 있으면 숨기기
        if (this.type3LeftText) this.type3LeftText.setVisible(false);
        if (this.type3RightText) this.type3RightText.setVisible(false);

        // 선택지 텍스트 위치와 내용, visible 명확히 지정
        if (this.type3LeftText) {
            this.type3LeftText.setText(itemData.quizOptions?.left || '일반쓰레기');
            this.type3LeftText.setVisible(true);
        }
        if (this.type3RightText) {
            this.type3RightText.setText(itemData.quizOptions?.right || '음식물쓰레기');
            this.type3RightText.setVisible(true);
        }

        /*
                // 새 선택지 텍스트 생성 또는 갱신
                if (!this.type3LeftText) {
                    this.type3LeftText = this.add.text(
                        this.sys.game.canvas.width / 2 - this.sys.game.canvas.width * 0.8 / 4,
                        this.sys.game.canvas.height / 2 + this.sys.game.canvas.height * 0.3 / 2,
                        itemData.quizOptions?.left || '일반쓰레기',
                        {
                            font: '22px 머니그라피',
                            fill: '#000000',
                            align: 'center',
                            fontStyle: 'bold'
                        }
                    ).setOrigin(0.5);
                    this.uiContainers.type3.add(this.type3LeftText);
                }
                this.type3LeftText.setText(itemData.quizOptions?.left || '일반쓰레기');
                this.type3LeftText.setVisible(true);
        
                if (!this.type3RightText) {
                    this.type3RightText = this.add.text(
                        this.sys.game.canvas.width / 2 + this.sys.game.canvas.width * 0.8 / 4,
                        this.sys.game.canvas.height / 2 + this.sys.game.canvas.height * 0.3 / 2,
                        itemData.quizOptions?.right || '음식물쓰레기',
                        {
                            font: '22px 머니그라피',
                            fill: '#000000',
                            align: 'center',
                            fontStyle: 'bold'
                        }
                    ).setOrigin(0.5);
                    this.uiContainers.type3.add(this.type3RightText);
                }
                this.type3RightText.setText(itemData.quizOptions?.right || '음식물쓰레기');
                this.type3RightText.setVisible(true);
        */
        // 아이템 이름 표시 추가 (TYPE3는 기본 name 사용)
        console.log('spawnType3Item에서 displayItemName 호출');
        this.displayItemName(itemData);

        // 시간 타이머 리셋
        this.itemTimeRemaining = this.itemTimeLimit;
        this.isFalling = true;
        this.lastFallTime = this.game.getTime();

        console.log('GameScene: Type 3 아이템 생성 완료');
    }


    // 충돌 처리 함수 추가
    handleType3Collision() {
        if (!this.isFalling || this.isProcessingResult) return;

        this.isFalling = false;
        this.isProcessingResult = true;

        // 정답 확인
        const isCorrect = (this.currentLaneIndex === 0 && this.currentTrashItemGraphic.itemData.correctAnswer === 'left') ||
            (this.currentLaneIndex === 1 && this.currentTrashItemGraphic.itemData.correctAnswer === 'right');

        this.triggerResultState(this.currentLaneIndex, 'collision', isCorrect);
    }


    cleanupType3UI() {
        // Type 3 관련 UI 요소 숨김
        if (this.type3LeftText) this.type3LeftText.setVisible(false);
        if (this.type3RightText) this.type3RightText.setVisible(false);

        // 쓰레기통 이름이 숨겨진 경우 다시 표시
        if (this.binNameTexts && !this.binNameTexts[0].visible) {
            this.binNameTexts.forEach(text => text.setVisible(true));
        }

        // 쓰레기통이 숨겨진 경우 다시 표시
        if (this.binImages && !this.binImages[0].visible) {
            this.binImages.forEach(bin => bin.setVisible(true));
        }
    }

    // === Type 2 관련 함수들 ===
    showPreprocessingPopup() {
        // 이미지로 팝업 배경 생성
        this.preprocessingPopupBg = this.add.image(60, 240, 'popup_bg_img')
            .setDisplaySize(320, 375)
            .setOrigin(0, 0)
            .setAlpha(0)
            .setDepth(25);

        // 경고 메시지 설정 (전처리 유도)
        if (this.messageTextObject && this.currentTrashItemData.messageWarning) {
            this.messageTextObject.setText(this.currentTrashItemData.messageWarning);
        }

        // 서서히 나타나는 애니메이션 (2초 동안)
        this.tweens.add({
            targets: this.preprocessingPopupBg,
            alpha: 1,
            duration: 1000,
            ease: 'Linear',
            onComplete: () => {
                console.log('GameScene: 팝업 배경 표시 완료');
                // 배경 표시 완료 후 경고 슬라이드 애니메이션 시작
                this.showWarningSlideAnimation();
            }
        });
    }

    onType2ItemClick() {
        // Type2가 아니거나 이미 처리 중인 경우 무시
        if (this.currentGameType !== 2 || this.isProcessingResult) return;

        console.log('GameScene: Type 2 아이템 클릭됨');

        // 클릭 시 깜빡임 애니메이션 중지
        this.tweens.killTweensOf(this.currentTrashItemGraphic);

        if (this.touchText) {
            this.tweens.killTweensOf(this.touchText);
            this.touchText.destroy(); // '터치!' 텍스트 제거
            this.touchText = null;
        }
        this.currentTrashItemGraphic.alpha = 1;

        this.isFalling = false;

        // 전처리 시작
        this.isProcessingResult = true;
        this.showPreprocessingPopup();
    }

    showWarningSlideAnimation() {
        const { width, height } = this.sys.game.canvas;

        // 경고 이미지 생성 (처음에는 화면 오른쪽 바깥에 위치)
        // 크기: 1417x556, 위치: 위에서 167px
        this.warningSlide = this.add.image(width + 700, 167, 'warning_slide_img')
            .setOrigin(0, 0) // 왼쪽 상단이 기준점
            .setDepth(26);   // 배경보다 위에 표시

        // 이미지 크기 설정 (원본 크기 그대로 사용)
        this.warningSlide.setDisplaySize(1417, 556);

        // 왼쪽으로 밀어내기 애니메이션
        this.tweens.add({
            targets: this.warningSlide,
            x: -448, // 왼쪽으로 448px 이동 (화면 왼쪽 바깥으로)
            duration: 2000, //2초
            ease: 'Power2',
            onComplete: () => {
                console.log('GameScene: 경고 슬라이드 애니메이션 완료');
                // 경고 슬라이드 애니메이션 완료 후 미니게임 요소 표시
                this.startPreprocessingMiniGame();
            }
        });
    }


    startPreprocessingMiniGame() {
        // 아이템 이미지 생성
        const itemId = this.currentTrashItemGraphic.itemData.id;

        // STEP1 이미지로 시작
        const step1ImageKey = `${itemId}_step1_img`;
        const fallbackImageKey = this.currentTrashItemGraphic.texture.key;

        // 이미지 키 존재 여부 확인
        const imageKey = this.textures.exists(step1ImageKey) ? step1ImageKey : fallbackImageKey;

        this.preprocessingItemImage = this.add.image(80, 400, imageKey)
            .setDisplaySize(120, 120)
            .setOrigin(0, 0)
            .setDepth(26);

        // 전처리 단계 정보 가져오기
        this.preprocessingSteps = this.currentTrashItemGraphic.itemData.preprocessingSteps || [];
        this.currentPreprocessingStep = 0;
        this.currentCommandIndex = 0;

        // 커맨드 키 배열 초기화
        this.commandKeyImages = [];

        // 메시지 창 초기화 (처음에는 빈 상태로)
        if (this.messageTextObject) {
            this.messageTextObject.setText("분리수거가 가능하게 바꿔보자!\n화면에 맞는 커맨드를 입력해봐");
        }

        // 메시지 텍스트 배열 초기화
        if (this.messageTexts && this.messageTexts.length > 0) {
            this.messageTexts.forEach(txt => txt.destroy());
            this.messageTexts = [];
        }

        // 메시지 커맨드 이미지 초기화
        if (this.messageCommandImages && this.messageCommandImages.length > 0) {
            this.messageCommandImages.forEach(img => img.destroy());
            this.messageCommandImages = [];
        }

        // 커맨드 키 초기 설정
        this.setupCommandKeys();

        // 메시지 창 초기화 (처음에는 안내 메시지만)
        if (this.messageTextObject) {
            this.messageTextObject.setText("분리수거가 가능하게 바꿔보자!\n화면에 맞는 커맨드를 입력해봐");
            this.messageTextObject.setVisible(true);
        }

        // 첫 번째 커맨드 키는 사용자 입력 후 활성화되도록 함
        // 첫 번째 커맨드 키만 입력 가능하도록 설정
        if (this.commandKeyImages.length > 0) {
            this.commandKeyImages[0].active = true;
        }

        //this.isProcessingCommand = false;
    }


    setupCommandKeys() {
        // 기존 커맨드 키 이미지 제거
        this.commandKeyImages.forEach(key => {
            if (key.image) key.image.destroy();
        });
        this.commandKeyImages = [];

        // 모든 단계의 모든 커맨드를 순서대로 배열로 변환
        let allCommands = [];
        for (let i = 0; i < this.preprocessingSteps.length; i++) {
            const step = this.preprocessingSteps[i];
            const commands = step.commands || [];

            for (let j = 0; j < commands.length; j++) {
                allCommands.push({
                    stepIndex: i,
                    commandIndex: j,
                    action: commands[j].action,
                    color: commands[j].color,
                    text: step.text
                });
            }
        }

        console.log('전체 커맨드 수:', allCommands.length);

        // 모든 커맨드 키 생성 (순서대로)
        for (let i = 0; i < allCommands.length; i++) {
            const command = allCommands[i];
            let keyImageKey;

            // 흐린 이미지 키 결정
            switch (command.action) {
                case 'left': keyImageKey = 'left_key_dim_img'; break;
                case 'down': keyImageKey = 'down_key_dim_img'; break;
                case 'right': keyImageKey = 'right_key_dim_img'; break;
                default: keyImageKey = 'down_key_dim_img';
            }

            // 키 이미지 생성 (크기 명시적 지정)
            const keyX = 240 + (i * 24);
            const keyImage = this.add.image(keyX, 440, keyImageKey)
                .setDisplaySize(40, 43) // 명시적 크기 설정
                .setOrigin(0, 0)
                .setDepth(26 + (allCommands.length - i));

            this.commandKeyImages.push({
                image: keyImage,
                stepIndex: command.stepIndex,
                commandIndex: command.commandIndex,
                action: command.action,
                text: command.text,
                color: command.color,
                active: i === 0 // 첫 번째 키만 활성화
            });
        }

        // 첫 번째 키 활성화 이미지로 변경
        if (this.commandKeyImages.length > 0) {
            const firstKey = this.commandKeyImages[0]
            let activeKeyImageKey;

            switch (firstKey.action) {
                case 'left': activeKeyImageKey = 'left_key_img'; break;
                case 'down': activeKeyImageKey = 'down_key_img'; break;
                case 'right': activeKeyImageKey = 'right_key_img'; break;
                default: activeKeyImageKey = 'down_key_img';
            }

            if (this.textures.exists(activeKeyImageKey)) {
                firstKey.image.setTexture(activeKeyImageKey);
                firstKey.image.setDisplaySize(40, 43);
            }
        }

        console.log(`총 ${this.commandKeyImages.length}개의 커맨드 키 생성됨`);
    }

    activateNextCommandKey() {
        // 현재 활성화할 커맨드 키 인덱스 계산
        let currentKeyIndex = 0;
        let found = false;

        for (let i = 0; i < this.commandKeyImages.length; i++) {
            const key = this.commandKeyImages[i];
            if (!key.active) {
                currentKeyIndex = i;
                found = true;
                break;
            }
        }

        // 모든 키가 이미 활성화되었으면 완료
        if (!found) {
            this.completePreprocessing();
            return;
        }

        // 현재 키 활성화
        const currentKey = this.commandKeyImages[currentKeyIndex];

        // 활성화 이미지 키 결정
        let activeKeyImageKey;
        switch (currentKey.action) {
            case 'left': activeKeyImageKey = 'left_key_img'; break;
            case 'down': activeKeyImageKey = 'down_key_img'; break;
            case 'right': activeKeyImageKey = 'right_key_img'; break;
            default: activeKeyImageKey = 'down_key_img';
        }

        // 키 이미지 변경
        if (currentKey.image && !currentKey.image.destroyed) {
            try {
                currentKey.image.setTexture(activeKeyImageKey);
                currentKey.active = true;
            } catch (error) {
                console.error('텍스처 설정 중 오류:', error);
            }
        }
    }

    activateCommandKey(stepIndex, commandIndex) {
        // 모든 단계가 완료되었는지 확인
        if (stepIndex >= this.preprocessingSteps.length) {
            this.completePreprocessing();
            return;
        }

        // 현재 단계 및 커맨드 인덱스 설정
        this.currentPreprocessingStep = stepIndex;
        this.currentCommandIndex = commandIndex;

        // 현재 커맨드 키 찾기
        const currentKeyObj = this.commandKeyImages.find(key =>
            key.stepIndex === stepIndex && key.commandIndex === commandIndex);

        if (currentKeyObj) {
            // 활성화 이미지로 변경
            let activeKeyImageKey;
            switch (currentKeyObj.command.action) {
                case 'left': activeKeyImageKey = 'left_key_img'; break;
                case 'down': activeKeyImageKey = 'down_key_img'; break;
                case 'right': activeKeyImageKey = 'right_key_img'; break;
                default: activeKeyImageKey = 'down_key_img';
            }

            currentKeyObj.image.setTexture(activeKeyImageKey);
            currentKeyObj.active = true;
        }

        // 메시지 창은 첫 커맨드 입력 후에만 표시
    }


    activateNextCommandKey() {
        if (this.currentPreprocessingStep >= this.preprocessingSteps.length) {
            // 모든 단계 완료
            this.completePreprocessing();
            return;
        }

        // 현재 단계의 커맨드 키 활성화
        const currentKeyObj = this.commandKeyImages[this.currentPreprocessingStep];
        const step = this.preprocessingSteps[this.currentPreprocessingStep];
        let activeKeyImageKey;

        // 밝은 이미지 키 결정
        switch (step.action) {
            case 'left': activeKeyImageKey = 'left_key_img'; break;
            case 'down': activeKeyImageKey = 'down_key_img'; break;
            case 'right': activeKeyImageKey = 'right_key_img'; break;
            default: activeKeyImageKey = 'down_key_img';
        }

        // 1초 후 키 이미지 변경 (흐린 이미지 -> 밝은 이미지)
        this.time.delayedCall(500, () => {
            currentKeyObj.image.setTexture(activeKeyImageKey);
            currentKeyObj.image.setDisplaySize(40, 43);
            currentKeyObj.image.setAlpha(1);
            currentKeyObj.active = true;

            // 메시지 창 업데이트 (현재 커맨드 이미지 추가)
            this.updateMessageWithCommand(step);
        });
    }
    /*
        updateMessageWithCommand() {
            try {
                // 기존 커맨드 키 이미지와 텍스트 제거
                if (this.messageCommandImages && this.messageCommandImages.length > 0) {
                    this.messageCommandImages.forEach(img => {
                        if (img && !img.destroyed) img.destroy();
                    });
                }
                this.messageCommandImages = [];
    
                if (this.messageTexts && this.messageTexts.length > 0) {
                    this.messageTexts.forEach(txt => {
                        if (txt && !txt.destroyed) txt.destroy();
                    });
                }
                this.messageTexts = [];
    
                // 메시지 텍스트 객체 숨기기
                if (this.messageTextObject) {
                    this.messageTextObject.setVisible(false);
                }
    
                // 시작 위치 설정
                let currentX = 87;
                let currentY = 665;
                let lineCount = 0;
                const maxStepsPerLine = 2; // 한 줄에 최대 2개 상황
    
                // 현재까지 진행된 모든 단계 표시
                const processedSteps = new Set();
    
                // 완료된 단계와 현재 진행 중인 단계 찾기
                for (const key of this.commandKeyImages) {
                    if (!key.image || key.image.destroyed) {
                        // 완료된 커맨드의 단계 추가
                        processedSteps.add(key.stepIndex);
                    } else if (key.active) {
                        // 현재 활성화된 커맨드의 단계 추가
                        processedSteps.add(key.stepIndex);
                    }
                }
    
                // 단계별로 그룹화하여 표시
                const sortedSteps = Array.from(processedSteps).sort((a, b) => a - b);
    
                for (const stepIndex of sortedSteps) {
                    // 한 줄에 2개 상황이 이미 있으면 다음 줄로
                    if (lineCount >= maxStepsPerLine && stepIndex > 0) {
                        currentX = 87;
                        currentY += 32; // 다음 줄로 이동
                        lineCount = 0;
                    }
    
                    // 해당 단계의 모든 커맨드 가져오기
                    const stepCommands = this.commandKeyImages.filter(key => key.stepIndex === stepIndex);
    
                    if (stepCommands.length === 0) continue;
    
                    // 단계 완료 여부 확인 (모든 커맨드가 완료되었는지)
                    const isStepCompleted = stepCommands.every(cmd => !cmd.image || cmd.image.destroyed);
    
                    // 현재 진행 중인 단계이고 단일 커맨드인 경우 즉시 진하게 표시
                    const isCurrentStepWithSingleCommand = stepCommands.some(cmd => cmd.active) && stepCommands.length === 1;
    
                    // 텍스트 스타일 결정
                    const textStyle = {
                        font: '16px 머니그라피',
                        fill: (isStepCompleted || isCurrentStepWithSingleCommand) ? '#303030' : '#C8C8C8',
                        fontStyle: (isStepCompleted || isCurrentStepWithSingleCommand) ? 'bold' : 'normal'
                    };
    
                    // 각 커맨드 키 이미지 추가 (패널과 동일한 이미지 사용)
                    for (const command of stepCommands) {
                        let keyImageKey;
    
                        // 이미지 키 결정 (패널과 동일한 이미지 키 사용)
                        if (!command.image || command.image.destroyed) {
                            // 완료된 커맨드 (패널과 동일한 활성화 이미지)
                            switch (command.action) {
                                case 'left': keyImageKey = 'left_key_img'; break;
                                case 'down': keyImageKey = 'down_key_img'; break;
                                case 'right': keyImageKey = 'right_key_img'; break;
                                default: keyImageKey = 'down_key_img';
                            }
                        } else {
                            // 진행 중인 커맨드 (패널과 동일한 이미지)
                            switch (command.action) {
                                case 'left': keyImageKey = command.active ? 'left_key_img' : 'left_key_dim_img'; break;
                                case 'down': keyImageKey = command.active ? 'down_key_img' : 'down_key_dim_img'; break;
                                case 'right': keyImageKey = command.active ? 'right_key_img' : 'right_key_dim_img'; break;
                                default: keyImageKey = command.active ? 'down_key_img' : 'down_key_dim_img';
                            }
                        }
    
                        // 키 이미지 생성 (20x20 크기)
                        const keyImage = this.add.image(currentX, currentY, keyImageKey)
                            .setDisplaySize(20, 20)
                            .setOrigin(0, 0)
                            .setDepth(20);
    
                        // 색상 설정은 제거 (패널과 동일하게)
                        // if (command.color) {
                        //     try {
                        //         const colorValue = parseInt(command.color.replace('#', '0x'));
                        //         keyImage.setTint(colorValue);
                        //     } catch (e) {
                        //         console.error('색상 설정 오류:', e);
                        //     }
                        // }
    
                        this.messageCommandImages.push(keyImage);
    
                        // X 위치 업데이트
                        currentX += 20; // 키 이미지 너비(20) + 간격(5)
                    }
    
                    // 텍스트 추가
                    const stepText = this.add.text(currentX, currentY, stepCommands[0].text, textStyle)
                        .setOrigin(0, 0)
                        .setDepth(20);
    
                    this.messageTexts.push(stepText);
    
                    // X 위치 업데이트
                    currentX += stepText.width + 10; // 텍스트 너비 + 간격(10)
    
                    // 라인 카운트 증가
                    lineCount++;
                }
    
                console.log('메시지 창 업데이트 완료');
    
            } catch (error) {
                console.error('메시지 창 업데이트 중 오류:', error);
            }
        }
        
    
        handlePreprocessingCommand(action) {
            try {
                // 활성화된 첫 번째 커맨드 키 찾기
                const currentKeyIndex = this.commandKeyImages.findIndex(key => key.active);
    
                if (currentKeyIndex === -1) {
                    console.log('활성화된 커맨드 키가 없음');
                    return;
                }
    
                const currentKey = this.commandKeyImages[currentKeyIndex];
    
                // 액션 일치 확인
                if (currentKey.action === action) {
                    console.log('올바른 키 입력:', action);
    
                    // 새로운 상황의 첫 번째 커맨드인지 확인
                    const isFirstCommandOfNewStep = currentKeyIndex === 0 ||
                        (currentKeyIndex > 0 &&
                            this.commandKeyImages[currentKeyIndex].stepIndex !==
                            this.commandKeyImages[currentKeyIndex - 1].stepIndex);
    
                    // 새로운 상황 시작 시 이미지 변경
                    if (isFirstCommandOfNewStep) {
                        this.updateItemImage(currentKey.stepIndex + 2);
                        console.log(`새로운 상황 시작: "${currentKey.text}" - step${currentKey.stepIndex + 2} 이미지로 변경`);
                    }
    
                    // 마지막 커맨드인지 확인
                    const isLastCommand = currentKeyIndex === this.commandKeyImages.length - 1;
    
                    // 즉시 메시지 창 업데이트 (커맨드 키 누르는 순간)
                    this.updateMessageWithCommand();
    
                    // 키 이미지 날아가는 애니메이션 (동시에 시작)
                    this.tweens.add({
                        targets: currentKey.image,
                        y: currentKey.image.y - 50,
                        alpha: 0,
                        duration: 200,
                        onComplete: () => {
                            // 이미지 제거
                            if (currentKey.image) {
                                currentKey.image.destroy();
                                currentKey.image = null;
                            }
    
                            // 다음 커맨드 키들 앞으로 당기기
                            for (let i = currentKeyIndex + 1; i < this.commandKeyImages.length; i++) {
                                const key = this.commandKeyImages[i];
                                if (key.image) {
                                    this.tweens.add({
                                        targets: key.image,
                                        x: 240 + ((i - currentKeyIndex - 1) * 24),
                                        duration: 300
                                    });
                                }
                            }
    
                            // 현재 키 비활성화
                            currentKey.active = false;
    
                            // 상황 완료 여부 확인 후 텍스트 진하게 변경
                            const remainingCommandsInStep = this.commandKeyImages.filter(key =>
                                key.stepIndex === currentKey.stepIndex &&
                                key.image &&
                                !key.image.destroyed &&
                                this.commandKeyImages.indexOf(key) > currentKeyIndex);
    
                            if (remainingCommandsInStep.length === 0) {
                                // 상황 완료 시 텍스트 진하게 변경
                                this.updateMessageWithCommand();
                                console.log(`상황 "${currentKey.text}" 완료 - 텍스트 진하게 변경`);
                            }
    
                            // 마지막 커맨드인 경우 특별 처리
                            if (isLastCommand) {
                                this.time.delayedCall(1500, () => {
                                    this.startCompletionSequence();
                                });
                            } else {
                                // 다음 키 활성화
                                const nextKey = this.commandKeyImages[currentKeyIndex + 1];
                                nextKey.active = true;
    
                                // 다음 키 활성화 이미지로 변경
                                if (nextKey.image) {
                                    let activeKeyImageKey;
                                    switch (nextKey.action) {
                                        case 'left': activeKeyImageKey = 'left_key_img'; break;
                                        case 'down': activeKeyImageKey = 'down_key_img'; break;
                                        case 'right': activeKeyImageKey = 'right_key_img'; break;
                                        default: activeKeyImageKey = 'down_key_img';
                                    }
    
                                    if (this.textures.exists(activeKeyImageKey)) {
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
                        this.tweens.add({
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
        }*/

    updateMessageWithCommand() {
        try {
            // 메시지 영역 크기
            const maxWidth = 330 - 20; // messageArea.width - padding
            const maxLines = 2;
            let currentX = 87;
            let currentY = 665;
            let lineCount = 0;

            // 줄바꿈 및 초기화 로직을 위한 임시 배열
            let lines = [[]];
            let lineWidths = [0];

            // 단계별로 표시할 커맨드와 텍스트를 미리 계산
            const processedSteps = [];
            for (const key of this.commandKeyImages) {
                if (key.active || !key.image || key.image.destroyed) {
                    if (!processedSteps.includes(key.stepIndex)) {
                        processedSteps.push(key.stepIndex);
                    }
                }
            }
            processedSteps.sort((a, b) => a - b);

            // Phaser 텍스트 측정용 임시 객체
            const tempText = this.add.text(0, 0, '', { font: '16px 머니그라피' }).setVisible(false);

            // 줄바꿈 계산
            for (const stepIndex of processedSteps) {
                const stepCommands = this.commandKeyImages.filter(key => key.stepIndex === stepIndex);
                if (stepCommands.length === 0) continue;

                // 커맨드 이미지 너비
                const commandWidth = stepCommands.length * 20;
                // 텍스트 너비
                tempText.setText(stepCommands[0].text);
                const textWidth = tempText.width + 10;

                const totalWidth = commandWidth + textWidth;

                // 현재 줄에 들어갈 수 있는지 확인
                if (lineWidths[lineCount] + totalWidth > maxWidth) {
                    // 다음 줄로
                    lineCount++;
                    if (lineCount >= maxLines) {
                        // 두 줄 다 찼으면 메시지창 초기화
                        this.messageCommandImages.forEach(img => { if (img && !img.destroyed) img.destroy(); });
                        this.messageTexts.forEach(txt => { if (txt && !txt.destroyed) txt.destroy(); });
                        this.messageCommandImages = [];
                        this.messageTexts = [];
                        lines = [[]];
                        lineWidths = [0];
                        lineCount = 0;
                        currentY = 665;
                    }
                    lines[lineCount] = [];
                    lineWidths[lineCount] = 0;
                }

                lines[lineCount].push({ stepIndex, stepCommands });
                lineWidths[lineCount] += totalWidth;
            }
            tempText.destroy();

            // 실제로 메시지창에 표시
            currentY = 665;
            for (let i = 0; i <= lineCount; i++) {
                currentX = 87;
                for (const { stepIndex, stepCommands } of lines[i]) {
                    // 텍스트 스타일
                    const isStepCompleted = stepCommands.every(cmd => !cmd.image || cmd.image.destroyed);
                    const isCurrentStepWithSingleCommand = stepCommands.some(cmd => cmd.active) && stepCommands.length === 1;
                    const textStyle = {
                        font: '16px 머니그라피',
                        fill: (isStepCompleted || isCurrentStepWithSingleCommand) ? '#303030' : '#C8C8C8',
                        fontStyle: 'normal' // 기본 스타일로 설정
                    };
                    // 커맨드 이미지
                    for (const command of stepCommands) {
                        let keyImageKey;
                        if (!command.image || command.image.destroyed) {
                            switch (command.action) {
                                case 'left': keyImageKey = 'left_key_img'; break;
                                case 'down': keyImageKey = 'down_key_img'; break;
                                case 'right': keyImageKey = 'right_key_img'; break;
                                default: keyImageKey = 'down_key_img';
                            }
                        } else {
                            switch (command.action) {
                                case 'left': keyImageKey = command.active ? 'left_key_img' : 'left_key_dim_img'; break;
                                case 'down': keyImageKey = command.active ? 'down_key_img' : 'down_key_dim_img'; break;
                                case 'right': keyImageKey = command.active ? 'right_key_img' : 'right_key_dim_img'; break;
                                default: keyImageKey = command.active ? 'down_key_img' : 'down_key_dim_img';
                            }
                        }
                        const keyImage = this.add.image(currentX, currentY, keyImageKey)
                            .setDisplaySize(20, 20)
                            .setOrigin(0, 0)
                            .setDepth(20);
                        this.messageCommandImages.push(keyImage);
                        currentX += 20;
                    }
                    // 텍스트
                    const stepText = this.add.text(currentX, currentY, stepCommands[0].text, textStyle)
                        .setOrigin(0, 0)
                        .setDepth(20);
                    this.messageTexts.push(stepText);
                    currentX += stepText.width + 10;
                }
                currentY += 32;
            }
            if (this.messageTextObject) this.messageTextObject.setVisible(false);
            console.log('메시지 창 업데이트 완료');
        } catch (error) {
            console.error('메시지 창 업데이트 중 오류:', error);
        }
    }

    handlePreprocessingCommand(action) {
        try {
            // special round 여부 확인
            if (this.specialStepInputEnabled) {
                // special round의 경우 무시
                return;
            }
            const currentKeyIndex = this.commandKeyImages.findIndex(key => key.active);
            if (currentKeyIndex === -1) {
                console.log('활성화된 커맨드 키가 없음');
                return;
            }
            const currentKey = this.commandKeyImages[currentKeyIndex];

            // === 5번째 step의 첫 커맨드 입력 시 메시지창 초기화 트리거 ===
            if (currentKey.stepIndex === 4 && currentKey.commandIndex === 0) {
                // 메시지창 초기화
                if (this.messageCommandImages && this.messageCommandImages.length > 0) {
                    this.messageCommandImages.forEach(img => { if (img && !img.destroyed) img.destroy(); });
                }
                this.messageCommandImages = [];
                if (this.messageTexts && this.messageTexts.length > 0) {
                    this.messageTexts.forEach(txt => { if (txt && !txt.destroyed) txt.destroy(); });
                }
                this.messageTexts = [];
            }

            // 액션 일치 확인
            if (currentKey.action === action) {
                console.log('올바른 키 입력:', action);

                // 새로운 상황의 첫 번째 커맨드인지 확인
                const isFirstCommandOfNewStep = currentKeyIndex === 0 ||
                    (currentKeyIndex > 0 &&
                        this.commandKeyImages[currentKeyIndex].stepIndex !==
                        this.commandKeyImages[currentKeyIndex - 1].stepIndex);

                // 새로운 상황 시작 시 이미지 변경
                if (isFirstCommandOfNewStep) {
                    this.updateItemImage(currentKey.stepIndex + 2);
                    console.log(`새로운 상황 시작: "${currentKey.text}" - step${currentKey.stepIndex + 2} 이미지로 변경`);
                }

                // 마지막 커맨드인지 확인
                const isLastCommand = currentKeyIndex === this.commandKeyImages.length - 1;

                // 즉시 메시지 창 업데이트 (커맨드 키 누르는 순간)
                this.updateMessageWithCommand();

                // 키 이미지 날아가는 애니메이션 (동시에 시작)
                this.tweens.add({
                    targets: currentKey.image,
                    y: currentKey.image.y - 50,
                    alpha: 0,
                    duration: 300,
                    onComplete: () => {
                        // 이미지 제거
                        if (currentKey.image) {
                            currentKey.image.destroy();
                            currentKey.image = null;
                        }

                        // 다음 커맨드 키들 앞으로 당기기
                        for (let i = currentKeyIndex + 1; i < this.commandKeyImages.length; i++) {
                            const key = this.commandKeyImages[i];
                            if (key.image) {
                                this.tweens.add({
                                    targets: key.image,
                                    x: 240 + ((i - currentKeyIndex - 1) * 24),
                                    duration: 300
                                });
                            }
                        }

                        // 현재 키 비활성화
                        currentKey.active = false;
                        // 상황 완료 여부 확인 후 텍스트 진하게 변경
                        const remainingCommandsInStep = this.commandKeyImages.filter(key =>
                            key.stepIndex === currentKey.stepIndex &&
                            key.image &&
                            !key.image.destroyed &&
                            this.commandKeyImages.indexOf(key) > currentKeyIndex);

                        if (remainingCommandsInStep.length === 0) {
                            // 상황 완료 시 텍스트 진하게 변경
                            this.updateMessageWithCommand();
                            console.log(`상황 "${currentKey.text}" 완료 - 텍스트 진하게 변경`);
                        }
                        // 마지막 커맨드인 경우 특별 처리
                        if (isLastCommand) {
                            this.time.delayedCall(1500, () => {
                                this.startCompletionSequence();
                            });
                        } else {
                            // 다음 키 활성화
                            const nextKey = this.commandKeyImages[currentKeyIndex + 1];
                            nextKey.active = true;

                            // 다음 키 활성화 이미지로 변경
                            if (nextKey.image) {
                                let activeKeyImageKey;
                                switch (nextKey.action) {
                                    case 'left': activeKeyImageKey = 'left_key_img'; break;
                                    case 'down': activeKeyImageKey = 'down_key_img'; break;
                                    case 'right': activeKeyImageKey = 'right_key_img'; break;
                                    default: activeKeyImageKey = 'down_key_img';
                                }

                                if (this.textures.exists(activeKeyImageKey)) {
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
                    this.tweens.add({
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

    // 다음 키 활성화 함수 추가
    activateNextKey(currentIndex) {
        const nextIndex = currentIndex + 1;
        if (nextIndex < this.commandKeyImages.length) {
            const nextKey = this.commandKeyImages[nextIndex];
            if (nextKey && nextKey.image) {
                nextKey.active = true;
                let activeKeyImageKey;
                switch (nextKey.action) {
                    case 'left': activeKeyImageKey = 'left_key_img'; break;
                    case 'down': activeKeyImageKey = 'down_key_img'; break;
                    case 'right': activeKeyImageKey = 'right_key_img'; break;
                    default: activeKeyImageKey = 'down_key_img';
                }
                nextKey.image.setTexture(activeKeyImageKey);
            }
        } else {
            // 모든 키 완료
            this.time.delayedCall(1000, () => {
                this.startCompletionSequence();
            });
        }
    }

    updateItemImage(stepNumber) {
        try {
            // 상황 단위로 이미지 업데이트 (step1, step2, step3, step4)
            const itemId = this.currentTrashItemGraphic.itemData.id;
            const stepImageKey = `${itemId}_step${stepNumber}_img`;

            // 원본 이미지 크기 저장
            const originalWidth = this.preprocessingItemImage.displayWidth;
            const originalHeight = this.preprocessingItemImage.displayHeight;

            // 해당 단계 이미지가 있으면 변경, 없으면 그대로
            if (this.textures.exists(stepImageKey)) {
                this.preprocessingItemImage.setTexture(stepImageKey);
                // 원본 크기 유지
                this.preprocessingItemImage.setDisplaySize(originalWidth, originalHeight);
                console.log(`전처리 이미지 업데이트: ${stepImageKey}`);
            } else {
                console.log(`전처리 이미지 없음: ${stepImageKey} (기본 이미지 유지)`);
            }
        } catch (error) {
            console.error('전처리 이미지 업데이트 중 오류:', error);
        }
    }

    startCompletionSequence() {
        try {
            // 누적된 텍스트 제거
            this.clearMessageBoard();

            // 전처리 완료 메시지 표시
            if (this.messageTextObject && this.currentTrashItemData.messagePreprocessingComplete) {
                this.messageTextObject.setVisible(true);
                this.messageTextObject.setText(this.currentTrashItemData.messagePreprocessingComplete);
            }

            // 동시에 전처리 이미지 서서히 사라지게 하기
            if (this.preprocessingItemImage) {
                this.tweens.add({
                    targets: this.preprocessingItemImage,
                    alpha: 0,
                    duration: 1500, // 2초에 걸쳐 서서히 사라짐
                    onComplete: () => {
                        // 이미지가 완전히 사라진 후 다음 단계로
                        this.time.delayedCall(500, () => {
                            this.startCleanupAnimation();
                        });
                    }
                });
            } else {
                // 이미지가 없는 경우 바로 다음 단계로
                this.time.delayedCall(1500, () => {
                    this.startCleanupAnimation();
                });
            }

            console.log('전처리 완료 시퀀스 시작');
        } catch (error) {
            console.error('완료 시퀀스 중 오류:', error);
        }
    }

    // 메시지 보드 정리 함수 추가 (completePreprocessing 함수 앞에 추가)
    clearMessageBoard() {
        try {
            // 메시지 커맨드 이미지들 제거
            if (this.messageCommandImages && this.messageCommandImages.length > 0) {
                this.messageCommandImages.forEach(img => {
                    if (img && !img.destroyed) img.destroy();
                });
            }
            this.messageCommandImages = [];

            // 메시지 텍스트들 제거
            if (this.messageTexts && this.messageTexts.length > 0) {
                this.messageTexts.forEach(txt => {
                    if (txt && !txt.destroyed) txt.destroy();
                });
            }
            this.messageTexts = [];

            console.log('메시지 보드 정리 완료');
        } catch (error) {
            console.error('메시지 보드 정리 중 오류:', error);
        }
    }
    // completePreprocessing 함수는 더 이상 사용하지 않으므로 제거하고
    // startCleanupAnimation 함수를 수정

    startCleanupAnimation() {
        // 1. 먼저 warning_animation 이미지가 있다면 왼쪽으로 밀어내기
        if (this.warningSlide) {
            this.tweens.add({
                targets: this.warningSlide,
                x: -1500, // 화면 왼쪽 바깥으로 더 멀리 이동
                duration: 1500,
                ease: 'Power2',
                onComplete: () => {
                    // warning_animation 이미지 제거
                    this.warningSlide.destroy();

                    // 2. 회색 배경 페이드 아웃
                    this.fadeOutBackground();
                }
            });
        } else {
            // warning_animation이 없는 경우 바로 배경 페이드 아웃
            this.fadeOutBackground();
        }

        // 남아있는 커맨드 키 이미지들도 함께 페이드 아웃
        this.commandKeyImages.forEach(keyObj => {
            if (keyObj.image && keyObj.image.active !== null) {
                this.tweens.add({
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
        this.tweens.add({
            targets: this.preprocessingPopupBg,
            alpha: 0,
            duration: 1000,
            onComplete: () => {
                // 배경 제거
                this.preprocessingPopupBg.destroy();

                // 게임 재개 준비
                this.restartGameWithPreprocessedItem();
            }
        });
    }



    startCleanupAnimation() {
        // 1. 먼저 아이템 이미지 페이드 아웃
        this.tweens.add({
            targets: this.preprocessingItemImage,
            alpha: 0,
            duration: 500,
            onComplete: () => {
                // 아이템 이미지 제거
                this.preprocessingItemImage.destroy();

                // 2. warning_animation 이미지가 있다면 왼쪽으로 밀어내기
                if (this.warningSlide) {
                    this.tweens.add({
                        targets: this.warningSlide,
                        x: -1500, // 화면 왼쪽 바깥으로 더 멀리 이동
                        duration: 1500,
                        ease: 'Power2',
                        onComplete: () => {
                            // warning_animation 이미지 제거
                            this.warningSlide.destroy();

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
        this.commandKeyImages.forEach(keyObj => {
            if (keyObj.image && keyObj.image.active !== null) {
                this.tweens.add({
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
        this.tweens.add({
            targets: this.preprocessingPopupBg,
            alpha: 0,
            duration: 1000,
            onComplete: () => {
                // 배경 제거
                this.preprocessingPopupBg.destroy();

                // 게임 재개 준비
                this.restartGameWithPreprocessedItem();
            }
        });
    }

    restartGameWithPreprocessedItem() {
        console.log('GameScene: 전처리 완료 후 게임 재시작 시작');

        // 중요: 현재 게임 타입을 Type 1으로 변경
        this.currentGameType = 1;

        // 이전 아이템 참조 저장
        const oldItem = this.currentTrashItemGraphic;
        const itemData = oldItem ? { ...oldItem.itemData } : null; // 데이터 깊은 복사

        // 이전 아이템 제거 (참조 정리)
        if (oldItem) {
            oldItem.setVisible(false);
            oldItem.destroy();
            this.currentTrashItemGraphic = null; // 참조 제거
        }

        // 전처리된 이미지 키 확인
        const itemId = itemData ? itemData.id : null;
        const preprocessedImageKey = itemId ? `${itemId}_preprocessed_img` : null;

        if (!preprocessedImageKey || !this.textures.exists(preprocessedImageKey)) {
            console.error('전처리된 이미지를 찾을 수 없음:', preprocessedImageKey);
            return;
        }

        // 새 아이템 생성 위치 설정 (더 높은 위치에서 시작)
        this.currentLaneIndex = 2; // 가운데(3번째) 레인에서 시작
        this.currentOpenBinIndex = -1;
        const startX = this.laneCenterXPositions[this.currentLaneIndex]; // ★ 가운데 레인 x좌표 사용
        const startY = 300; // 더 높은 위치에서 시작 (기존 300)

        // 완전히 새로운 아이템 객체 생성
        this.currentTrashItemGraphic = this.add.sprite(startX, startY, preprocessedImageKey)
            .setDisplaySize(60, 60)
            .setOrigin(0, 0)
            .setDepth(10);

        // 아이템 데이터 설정
        this.currentTrashItemGraphic.itemData = itemData;

        // 디스플레이 리스트에 명시적으로 추가
        this.currentTrashItemGraphic.addToDisplayList();

        // 현재 레인 인덱스 초기화
        this.currentLaneIndex = 2;
        this.currentOpenBinIndex = -1;

        this.resetAllBins();

        // 게임 상태 재설정
        this.isFalling = true;
        this.isProcessingResult = false;
        this.lastFallTime = this.game.getTime();

        // 라인 UI 업데이트
        this.updateBinVisuals(this.currentLaneIndex);

        // 전처리 후 고정 메시지 표시
        if (this.messageTextObject) {
            this.messageTextObject.setText("자, 이제 그럼 다시 분리배출 해볼까?");
            this.messageTextObject.setVisible(true);
        }

        // 전처리 후 이름으로 업데이트 (아이템이 생성된 후에 호출)
        console.log('restartGameWithPreprocessedItem에서 displayItemName 호출');
        console.log('preprocessed 이미지 키:', preprocessedImageKey);
        this.displayItemName(itemData);

        console.log('전처리 완료 후 Type 1 게임으로 재개 완료');
    }


    // === 공통 게임 로직 함수들 ===
    updateBinVisuals(newLaneIndex) {
        console.log('updateBinVisuals 호출:', newLaneIndex, '현재 게임 타입:', this.currentGameType);

        // Type 3 처리
        if (this.currentGameType === 3) {
            if (this.laneIndicatorLine) {
                this.laneIndicatorLine.setVisible(false);
            }
            return;
        }

        // 열린 쓰레기통과 닫힌 쓰레기통의 크기 및 위치 설정
        const closedBinSize = { width: 50, height: 34 };
        const closedBinY = 581;

        const openBinSize = { width: 51.14, height: 46.47 };
        const openBinY = 568.53;
        const openBinXOffset = -2; // 열린 상태일 때 X 좌표 오프셋

        // 이전 열린 쓰레기통 닫기
        if (this.currentOpenBinIndex !== -1 && this.currentOpenBinIndex !== newLaneIndex) {
            const prevBinImg = this.binImages[this.currentOpenBinIndex];
            const prevBinKey = this.binKeys[this.currentOpenBinIndex];
            const prevBinX = this.binGraphics[this.currentOpenBinIndex].x;

            if (prevBinImg) {
                // 텍스처 변경
                prevBinImg.setTexture(`${prevBinKey}_img`);

                // 닫힌 쓰레기통 크기와 위치로 복원
                prevBinImg.setDisplaySize(closedBinSize.width, closedBinSize.height);
                prevBinImg.setPosition(prevBinX, closedBinY);
            }
        }

        // 새로운 레인의 쓰레기통 열기
        if (newLaneIndex !== -1 && newLaneIndex >= 0 && newLaneIndex < this.binImages.length) {
            const currentBinImg = this.binImages[newLaneIndex];
            const currentBinKey = this.binKeys[newLaneIndex];
            const currentBinX = this.binGraphics[newLaneIndex].x;

            if (currentBinImg) {
                // 텍스처 변경
                currentBinImg.setTexture(`${currentBinKey}_open_img`);

                // 열린 쓰레기통 크기와 위치로 변경
                currentBinImg.setDisplaySize(openBinSize.width, openBinSize.height);
                currentBinImg.setPosition(currentBinX + openBinXOffset, openBinY);

                // 검정 라인 이미지 표시
                if (this.laneIndicatorLine) {
                    // 라인 위치 계산
                    const lineX = 70; // 왼쪽에서 70px
                    const lineY = 280; // 위에서 280px
                    const lineXAdjusted = lineX + (newLaneIndex * 60); // 60px 간격으로 조정

                    // 라인 텍스처 설정 및 표시
                    this.laneIndicatorLine
                        .setTexture('lane_line_img') // 항상 검정색 라인으로 시작
                        .setPosition(lineXAdjusted, lineY)
                        .setDisplaySize(60, 335)
                        .setVisible(true)
                        .setOrigin(0, 0);

                    console.log('라인 표시:', lineXAdjusted, lineY);
                } else {
                    console.log('라인 객체가 없음');
                }
            }
        }

        this.currentOpenBinIndex = newLaneIndex;
    }


    moveLaneHorizontal(direction) {
        if (!this.currentTrashItemGraphic || !this.isFalling) return;

        const { width } = this.sys.game.canvas;

        if (this.currentGameType === 3) {
            // Type 3는 왼쪽(0)과 오른쪽(1)만 있음
            const newLaneIndex = direction === -1 ? 0 : 1;
            this.currentLaneIndex = newLaneIndex;

            // 패널 위치에 맞게 x좌표 설정
            const targetX = newLaneIndex === 0 ?
                width / 2 - this.panel.width * 0.8 / 4 :
                width / 2 + this.panel.width * 0.8 / 4;

            this.currentTrashItemGraphic.x = targetX;
            console.log('GameScene: Type 3 선택지 이동 ->', this.currentLaneIndex);
            return;
        }

        // 기존 Type 1/2 로직
        const numberOfBins = this.binKeys.length;
        let nextLaneIndex = this.currentLaneIndex + direction;

        if (nextLaneIndex < 0 || nextLaneIndex >= numberOfBins) {
            console.log('GameScene: 경계입니다.');
            return;
        }

        this.currentLaneIndex = nextLaneIndex;
        const targetX = this.laneCenterXPositions[this.currentLaneIndex];
        this.currentTrashItemGraphic.x = targetX;

        // '터치!' 텍스트도 함께 이동 (TYPE2 아이템인 경우)
        if (this.currentGameType === 2 && this.touchText) {
            this.touchText.x = targetX + this.currentTrashItemGraphic.displayWidth / 2;
        }

        // 쓰레기통 이미지 업데이트
        this.updateBinVisuals(this.currentLaneIndex);

        console.log('GameScene: 칸 이동 ->', this.currentLaneIndex);
    }

    triggerResultState(itemLaneIndex, reason = 'incorrect') {
        console.log('GameScene: 결과 상태 트리거 시작! 이유:', reason, '게임타입:', this.currentGameType);

        if (!this.currentTrashItemGraphic) {
            console.log('GameScene: 처리할 아이템이 없습니다.');
            return;
        }

        this.currentTrashItemGraphic.setActive(false);
        this.lastLandedLaneIndex = (itemLaneIndex !== null) ? itemLaneIndex : this.currentLaneIndex;

        let isCorrect = false;
        const itemData = this.currentTrashItemData;
        let message = '';

        // Type 3 퀴즈 판정
        if (this.currentGameType === 3) {
            // 왼쪽(0)이 정답인지, 오른쪽(1)이 정답인지 확인
            const correctLane = itemData.correctAnswer === 'left' ? 0 : 1;
            isCorrect = (this.currentLaneIndex === correctLane);
            message = isCorrect ? itemData.messageCorrect : itemData.messageIncorrect;
        }
        // 기존 Type 1/2 판정
        else if (reason === 'collision') {
            let landedBinKey = null;
            if (itemLaneIndex !== null && itemLaneIndex >= 0 && itemLaneIndex < this.binKeys.length) {
                landedBinKey = this.binKeys[itemLaneIndex];
            }
            isCorrect = (landedBinKey !== null && itemData.correctBin === landedBinKey);
            message = isCorrect ? itemData.messageCorrect : itemData.messageIncorrect;
        } else if (reason === 'floor') {
            isCorrect = false;
            message = itemData.messageIncorrect;
        } else if (reason === 'correct') {
            isCorrect = true;
            message = itemData.messageCorrect;
        } else if (reason === 'incorrect') {
            isCorrect = false;
            message = itemData.messageIncorrect;
        }
        this.lastResultIsCorrect = isCorrect;

        // 라인 색상 변경
        this.updateLineColor(isCorrect);

        // 아이템 충돌 효과 표시
        this.showItemCollisionEffect(isCorrect);

        // 메시지 표시
        if (this.messageTextObject) {
            this.messageTextObject.setText(message);
        }

        // 오답 시 체력 감소
        if (!isCorrect) {
            console.log('GameScene: 오답 처리 플로우 (체력 감소 등).');
            this.health--;
            this.updateHealthUI();

            // 게임 오버 조건 판단
            if (this.health <= 0) {
                console.log('GameScene: 체력 0! 게임 오버.');
                this.gameOver();
                return;
            }

            // 아이템에 적용된 모든 트윈 중지
            if (this.currentTrashItemGraphic) {
                this.tweens.killTweensOf(this.currentTrashItemGraphic);

                // 애니메이션이 있다면 중지
                if (this.currentTrashItemGraphic.anims) {
                    this.currentTrashItemGraphic.anims.stop();
                }
            }

            // 약간의 딜레이 후 오답 팝업 표시
            this.time.delayedCall(800, () => {
                this.showIncorrectPopup();
            });
        } else {
            /// 정답일 때는 아이템 사라짐 애니메이션 적용
            this.showItemCollisionEffect(isCorrect);

            // 자동으로 다음 라운드로 진행
            this.time.delayedCall(this.ANIMATION_TIMING.NEXT_ROUND_DELAY, () => {
                // 이미 처리되었는지 확인
                if (this.isProcessingResult) {
                    this.handleResult(isCorrect);
                    this.proceedToNextRound();
                }
            }, [], this);
        }
    }
    // 라인 색상 변경 함수
    updateLineColor(isCorrect) {
        // 기존 라인 이미지가 있으면 제거
        if (this.laneIndicatorLine) {
            // 새 라인 이미지로 교체
            const lineImageKey = isCorrect ? 'green_line_img' : 'red_line_img';
            this.laneIndicatorLine.setTexture(lineImageKey);
        }
        const lineX = 70 + (this.currentLaneIndex * 60); // 현재 레인에 맞게 조정
        const lineY = 280;
        this.laneIndicatorLine
            .setPosition(lineX, lineY)
            .setDisplaySize(60, 335);
    }

    // 아이템 충돌 효과 함수
    // showItemCollisionEffect 함수 수정
    showItemCollisionEffect(isCorrect) {
        if (!this.currentTrashItemGraphic) return;

        // 아이템 객체 참조 저장
        const itemGraphic = this.currentTrashItemGraphic;
        /*
                // 2초 후에 서서히 검정색으로 변환 시작
                this.time.delayedCall(700, () => {
                    // 객체가 여전히 존재하는지 확인
                    if (!itemGraphic || !itemGraphic.scene) return;
        
                    // 서서히 검정색으로 변하는 효과
                    this.tweens.add({
                        targets: itemGraphic,
                        tint: 0x000000, // 검정색으로 변환
                        duration: 1500, // 1.5초에 걸쳐 서서히 검정색으로
                        ease: 'Power2',
                        onComplete: () => {
                            // 검정색 변환 완료 후 검정 오브젝트 이미지로 교체 (선택사항)
                            const itemData = this.currentTrashItemData;
                            let blackImageKey;
        
                            if (this.currentGameType === 2 && isCorrect) {
                                blackImageKey = `${itemData.id}_preprocessed_black_img`;
                            } else {
                                blackImageKey = `${itemData.id}_black_img`;
                            }
        
                            if (this.textures.exists(blackImageKey)) {
                                itemGraphic.setTexture(blackImageKey);
                                itemGraphic.clearTint(); // 틴트 제거하고 원본 검정 이미지 사용
                            }
        
                            // 서서히 사라지는 효과
                            this.tweens.add({
                                targets: itemGraphic,
                                alpha: 0,
                                duration: this.ANIMATION_TIMING.FADE_OUT_DURATION,
                                ease: 'Power2',
                                onComplete: () => {
                                    if (itemGraphic && itemGraphic.scene) {
                                        itemGraphic.destroy();
                                    }
                                    if (this.currentTrashItemGraphic === itemGraphic) {
                                        this.currentTrashItemGraphic = null;
                                    }
                                }
                            });
                        }
                    });
                });
            }*/

        // 1. 아이템 깜박임 효과
        this.tweens.add({
            targets: itemGraphic,
            alpha: 0.5,
            duration: this.ANIMATION_TIMING.BLINK_DURATION,
            yoyo: true,
            repeat: this.ANIMATION_TIMING.BLINK_COUNT,
            onComplete: () => {
                // 객체가 여전히 존재하는지 확인
                if (!itemGraphic || !itemGraphic.scene) return;

                // 2. 검정 오브젝트로 변환
                const itemData = this.currentTrashItemData;
                let blackImageKey;

                if (this.currentGameType === 2 && isCorrect) {
                    blackImageKey = `${itemData.id}_preprocessed_black_img`;
                } else {
                    blackImageKey = `${itemData.id}_black_img`;
                }

                if (this.textures.exists(blackImageKey)) {
                    itemGraphic.setTexture(blackImageKey);
                }

                // 3. 서서히 사라지는 효과
                this.tweens.add({
                    targets: itemGraphic,
                    alpha: 0,
                    duration: this.ANIMATION_TIMING.FADE_OUT_DURATION,
                    ease: 'Power2',
                    onComplete: () => {
                        // 객체가 여전히 존재하는지 확인
                        if (itemGraphic && itemGraphic.scene) {
                            itemGraphic.destroy();
                        }

                        // currentTrashItemGraphic 참조 업데이트
                        if (this.currentTrashItemGraphic === itemGraphic) {
                            this.currentTrashItemGraphic = null;
                        }
                    }
                });
            }
        });
    }


    // showIncorrectPopup 함수 수정
    showIncorrectPopup() {
        // 기존 팝업이 있으면 먼저 제거
        if (this.incorrectPopupBg) {
            this.incorrectPopupBg.destroy();
            this.incorrectPopupBg = null;
        }

        // 팝업 배경 생성 (처음에는 투명하게)
        this.incorrectPopupBg = this.add.image(60, 240, 'popup_bg_img')
            .setDisplaySize(320, 375)
            .setOrigin(0, 0)
            .setAlpha(0)
            .setDepth(25);

        console.log('새 팝업 배경 생성:', this.incorrectPopupBg.texture.key);

        // 서서히 나타나는 애니메이션
        this.tweens.add({
            targets: this.incorrectPopupBg,
            alpha: 0.8, // 약간 투명하게 설정
            duration: 800,
            ease: 'Linear',
            onComplete: () => {
                // 팝업 배경 표시 완료 후 다시하기 버튼 생성
                this.time.delayedCall(300, () => {
                    this.createRetryButton();
                });
            }
        });
    }


    createRetryButton() {

        // 버튼 생성
        this.retryButton = this.add.image(180, 360, 'retry_button')
            .setOrigin(0, 0)
            .setInteractive()
            .setDisplaySize(80, 85)
            .setDepth(26);

        // 버튼 클릭 이벤트
        this.retryButton.on('pointerdown', () => {
            // 모든 팝업 요소 제거
            this.hideIncorrectPopup();

            // 게임 상태 초기화 후 재시작
            this.time.delayedCall(300, () => {
                this.resetCurrentRound();
            });
        });
    }

    // 오답 팝업 숨기기 함수
    hideIncorrectPopup() {
        console.log('팝업 숨김 시작');

        // 버튼 즉시 제거
        if (this.retryButton) {
            this.retryButton.destroy();
            this.retryButton = null;
        }

        if (this.retryButtonText) {
            this.retryButtonText.destroy();
            this.retryButtonText = null;
        }

        // 아이템 즉시 제거
        if (this.currentTrashItemGraphic) {
            this.currentTrashItemGraphic.destroy();
            this.currentTrashItemGraphic = null;
        }

        // 트윈 사용 대신 즉시 제거
        if (this.incorrectPopupBg) {
            console.log('팝업 배경 즉시 제거');
            this.incorrectPopupBg.destroy();
            this.incorrectPopupBg = null;
        }

        // 모든 객체 제거 후 게임 재시작
        console.log('팝업 숨김 완료, 게임 재시작');
        this.resetCurrentRound();
    }




    hideResultUIAndProceed() {
        console.log('GameScene: 결과 UI 숨김 및 다음 진행.');

        if (this.health <= 0) {
            console.log('GameScene: 이미 게임 오버 상태이므로 다음 진행하지 않음.');
            return;
        }

        // 결과 UI 숨김
        this.hideResultUI();

        // 쓰레기 아이템 제거
        if (this.currentTrashItemGraphic) {
            this.currentTrashItemGraphic.destroy();
            this.currentTrashItemGraphic = null;
        }

        // 점수 및 라운드 처리
        this.handleResult(this.lastResultIsCorrect);

        // 게임 플레이 입력 다시 활성화
        this.setGameInputEnabled(true);

        this.resetCurrentRound();
    }

    hideResultUI() {
        console.log('GameScene: 결과 UI 숨김.');
        if (this.resultButton) { this.resultButton.setVisible(false); }
        if (this.resultButtonText) { this.resultButtonText.setVisible(false); }
        this.isProcessingResult = false;
    }

    setGameInputEnabled(enabled) {
        console.log('GameScene: 게임 입력 상태 변경 -', enabled ? '활성화' : '비활성화');
        //if (this.input) this.input.enabled = enabled; // ★ 포인터 입력도 같이!
        //if (this.input && this.input.keyboard) this.input.keyboard.enabled = enabled;
        if (this.commandButtons.left) {
            this.commandButtons.left.setInteractive(enabled);
            this.commandButtons.down.setInteractive(enabled);
            this.commandButtons.right.setInteractive(enabled);
        }
    }

    handleResult(isCorrect) {
        console.log('GameScene: 최종 판정 결과 처리 시작! 정답:', isCorrect);

        if (isCorrect) {
            // 정답 처리 - 난이도에 따른 점수 부여
            const difficulty = this.currentTrashItemData.difficulty || 1;
            const baseScore = 100;
            const earnedScore = baseScore * difficulty;

            this.score += earnedScore;
            if (this.scoreText) {
                this.scoreText.setText(`${this.score}`);
            }
            console.log(`GameScene: 점수 업데이트 완료. 획득: ${earnedScore} (난이도 ${difficulty})`);
        } else {
            console.log('GameScene: 오답 처리 완료 (체력 감소됨).');
        }
    }

    proceedToNextRound() {
        console.log('GameScene: 다음 라운드로 진행, 현재:', this.currentRound, '-> 다음:', this.currentRound + 1);
        this.fallCount = 0;

        if (this.level === 3 && this.currentRound === 3) {
            // 3라운드 끝나면 3초 후 스페셜 라운드 진입
            this.time.delayedCall(1500, () => {
                this.startSpecialRound();
            });
            return;
        }

        if (this.currentRound >= this.getRoundData().length) {  // maxRounds 대신 실제 라운드 수 사용
            // 레벨 완료
            this.completeLevel();
        } else {
            // 다음 라운드
            this.currentRound++;
            console.log('GameScene: 라운드 증가됨 ->', this.currentRound);

            // 라운드 전환 시 쓰레기통 상태 리셋
            this.currentLaneIndex = 0; // 첫 번째 라인으로 초기화
            this.currentOpenBinIndex = -1; // 열린 쓰레기통 인덱스 초기화
            this.resetAllBins(); // 모든 쓰레기통 닫힌 상태로 리셋

            // 라운드 UI 업데이트 (텍스트 대신 이미지 사용)
            this.updateRoundsUI();

            // 현재 라운드 데이터 확인
            const nextRoundData = this.getRoundData().find(round => round.round === this.currentRound);
            console.log('GameScene: 다음 라운드 데이터:', nextRoundData);

            this.spawnWasteItem();
        }
    }


    /*   startSpecialRound() {
           // 팝업 메시지와 함께 special round 시작
           this.showSpecialPreprocessingPopup(this.specialData);
       }
   
       showSpecialPreprocessingPopup() {
           // 팝업 배경
           this.preprocessingPopupBg = this.add.image(60, 240, 'popup_bg_img')
               .setDisplaySize(320, 375)
               .setOrigin(0, 0)
               .setAlpha(0)
               .setDepth(25);
   
           // 메시지 창에는 popupMessage만 유지
           if (this.messageTextObject) {
               this.messageTextObject.setText(this.specialData.popupMessage);
               this.messageTextObject.setVisible(true);
           }
   
           // 팝업 페이드인
           this.tweens.add({
               targets: this.preprocessingPopupBg,
               alpha: 1,
               duration: 500,
               onComplete: () => {
                   this.showSpecialWarningSlideAnimation();
               }
           });
       }
   
       showSpecialWarningSlideAnimation() {
           const { width } = this.sys.game.canvas;
           // special warning 이미지 사용
           this.specialWarningSlide = this.add.image(width + 700, 243, this.specialData.warningImageKey)
               .setOrigin(0, 0)
               .setDepth(26)
               .setDisplaySize(1300, 353.53);
   
           this.tweens.add({
               targets: this.specialWarningSlide,
               x: -448,
               duration: 2000,
               ease: 'Power2',
               onComplete: () => {
                   // === 안내 텍스트 2종 생성 ===
                   // <special round>
                   const centerX = this.sys.game.canvas.width / 2;
   
                   // <special round>
                   const specialRoundText = this.add.text(
                       centerX, 391,
                       '<special round>',
                       {
                           font: '24px "머니그라피"',
                           fill: '#303030',
                           align: 'center',
                           wordWrap: { width: 408 }
                       }
                   ).setOrigin(0.5, 0) // ← x축 가운데 정렬
                       .setAlpha(0.5)
                       .setDepth(30);
   
                   // 종이팩이 재활용되는 과정을 알아보자!
                   const infoText = this.add.text(
                       centerX, 391 + 32,
                       '종이팩이 재활용되는 과정을 알아보자!',
                       {
                           font: '24px "머니그라피"',
                           fill: '#303030',
                           align: 'center',
                           wordWrap: { width: 408 }
                       }
                   ).setOrigin(0.5, 0) // ← x축 가운데 정렬
                       .setAlpha(1)
                       .setDepth(30);
                   // 2초 후 서서히 사라지고 step 시작
                   this.time.delayedCall(2000, () => {
                       this.tweens.add({
                           targets: [specialRoundText, infoText],
                           alpha: 0,
                           duration: 700,
                           onComplete: () => {
                               specialRoundText.destroy();
                               infoText.destroy();
                               // step sequence 시작
                               this.startSpecialStepSequence(0);
                           }
                       });
                   });
               }
           });
       }
   
       // 단계별로 이미지/텍스트/커맨드키 표시
       startSpecialStepSequence(stepIndex) {
           // 현재 step 데이터
           if (!this.specialData || !this.specialData.steps || stepIndex >= this.specialData.steps.length) {
               console.error('Invalid special data or step index');
               return;
           }
           // 1. 텍스트창 업데이트
           if (this.messageTextObject) {
               this.messageTextObject.setText("종이팩의 재활용 과정을 알아보자!");
               this.messageTextObject.setVisible(true);
           }
   
           // 이전 step UI 제거
           if (this.specialStepImage) this.specialStepImage.destroy();
           if (this.specialStepText) this.specialStepText.destroy();
           if (this.specialCommandKeys) this.specialCommandKeys.forEach(img => img.destroy());
           this.specialCommandKeys = [];
   
           // 마지막 단계 완료 시
           if (stepIndex >= this.specialData.steps.length) {
               if (this.specialStepText) this.specialStepText.destroy();
               this.time.delayedCall(2000, () => {
                   this.cleanupSpecialRound();
               });
               return;
           }
   
           // 현재 step 데이터
           const step = this.specialData.steps[stepIndex];
   
           // 단계별 이미지 (358, 40)
           this.specialStepImage = this.add.image(40, 358, step.imageKey)
               .setOrigin(0, 0)
               .setDisplaySize(160, 160)
               .setDepth(27);
   
           // 단계별 설명 (308, 80) 가운데 정렬
           this.specialStepText = this.add.text(80, 308, step.text, {
               font: '20px "머니그라피"',
               fill: '#303030',
               align: 'center',
               //wordWrap: { width: 220 }
           }).setOrigin(0, 0).setDepth(27);
   
   
           this.setupSpecialCommandKeys(step);
           // 첫 번째 키만 활성화된 상태로 시작
           this.handleNextSpecialCommand();
           // 현재 step 인덱스 저장
           this.currentSpecialStep = stepIndex;
       }
   
       setupSpecialCommandKeys(step) {
           // type2의 setupCommandKeys와 유사하게 구현
           if (this.specialCommandKeys) {
               this.specialCommandKeys.forEach(key => key.destroy());
           }
           this.specialCommandKeys = [];
   
           // 커맨드 키들 위치 설정
           let keyX = 238;  // 왼쪽에서 238
           const keyY = 418; // 위에서 418
   
           // 모든 커맨드 키 한번에 생성 (마지막 키가 가장 앞에 보이도록)
           step.commands.forEach((cmd, idx) => {
               const isActive = idx === 0;  // 첫 번째 키만 활성화
               let keyImageKey = cmd.action === 'left'
                   ? (isActive ? 'left_key_img' : 'left_key_dim_img')
                   : cmd.action === 'down'
                       ? (isActive ? 'down_key_img' : 'down_key_dim_img')
                       : (isActive ? 'right_key_img' : 'right_key_dim_img');
   
               let keyImg = this.add.image(keyX + (idx * 24), keyY, keyImageKey)
                   .setDisplaySize(40, 43)
                   .setOrigin(0, 0)
                   .setDepth(28 + (step.commands.length - idx)); // 뒤의 키가 더 앞에 보이도록
   
               this.specialCommandKeys.push(keyImg);
           });
   
           // 입력 관련 변수 설정
           this.specialStepInputEnabled = true;
           this.specialStepCommands = step.commands.slice();
           this.specialStepCommandIndex = 0;
       }
   
       handleNextSpecialCommand() {
           if (!this.specialStepInputEnabled) return;
           const expected = this.specialStepCommands[this.specialStepCommandIndex];
   
           // 키보드 입력
           this.input.keyboard.once('keydown', (event) => {
               let action = null;
               if (event.keyCode === Phaser.Input.Keyboard.KeyCodes.LEFT) action = 'left';
               if (event.keyCode === Phaser.Input.Keyboard.KeyCodes.DOWN) action = 'down';
               if (event.keyCode === Phaser.Input.Keyboard.KeyCodes.RIGHT) action = 'right';
               if (action === expected.action) {
                   this.processSpecialCommandInput(action);
               } else {
                   // 틀린 입력시 흔들림 효과
                   const keyImg = this.specialCommandKeys[this.specialStepCommandIndex];
                   this.tweens.add({
                       targets: keyImg,
                       x: keyImg.x + 5,
                       duration: 50,
                       yoyo: true,
                       repeat: 2
                   });
                   this.handleNextSpecialCommand();
               }
           });
   
           // 버튼 입력
           ['left', 'down', 'right'].forEach(dir => {
               this.commandButtons[dir].once('pointerdown', () => {
                   if (!this.specialStepInputEnabled) return;
                   if (dir === expected.action) {
                       this.processSpecialCommandInput(dir);
                   } else {
                       const keyImg = this.specialCommandKeys[this.specialStepCommandIndex];
                       this.tweens.add({
                           targets: keyImg,
                           x: keyImg.x + 5,
                           duration: 50,
                           yoyo: true,
                           repeat: 2
                       });
                       this.handleNextSpecialCommand();
                   }
               });
           });
       }
   
       processSpecialCommandInput(action) {
           const keyImg = this.specialCommandKeys[this.specialStepCommandIndex];
   
           // 날아가는 애니메이션
           this.tweens.add({
               targets: keyImg,
               y: keyImg.y - 50,
               alpha: 0,
               duration: 400,
               onComplete: () => keyImg.destroy()
           });
   
           // 남은 키들 앞으로 당기기
           for (let i = this.specialStepCommandIndex + 1; i < this.specialCommandKeys.length; i++) {
               const key = this.specialCommandKeys[i];
               this.tweens.add({
                   targets: key,
                   x: 238 + ((i - this.specialStepCommandIndex - 1) * 48),
                   duration: 300
               });
           }
   
           // 다음 커맨드로 이동
           this.specialStepCommandIndex++;
   
           if (this.specialStepCommandIndex < this.specialStepCommands.length) {
               // 다음 키 활성화
               const nextKeyImg = this.specialCommandKeys[this.specialStepCommandIndex];
               const nextCmd = this.specialStepCommands[this.specialStepCommandIndex];
               let activeKeyImageKey =
                   nextCmd.action === 'left' ? 'left_key_img' :
                       nextCmd.action === 'down' ? 'down_key_img' : 'right_key_img';
               nextKeyImg.setTexture(activeKeyImageKey);
   
               this.handleNextSpecialCommand();
           } else {
               // 모든 커맨드 완료 - 다음 step으로
               this.specialStepInputEnabled = false;
               this.time.delayedCall(400, () => {
                   this.startSpecialStepSequence(this.specialData, this.currentSpecialStep + 1);
               });
           }
       }
   
       cleanupSpecialRound() {
           // 이미지/텍스트/경고 애니메이션 제거
           if (this.specialStepImage) this.specialStepImage.destroy();
           if (this.specialStepText) this.specialStepText.destroy();
           if (this.specialCommandKeys) this.specialCommandKeys.forEach(img => img.destroy());
           if (this.specialWarningSlide) {
               this.tweens.add({
                   targets: this.specialWarningSlide,
                   x: -1500,
                   duration: 1000,
                   onComplete: () => {
                       this.specialWarningSlide.destroy();
                       if (this.preprocessingPopupBg) {
                           this.tweens.add({
                               targets: this.preprocessingPopupBg,
                               alpha: 0,
                               duration: 500,
                               onComplete: () => {
                                   this.preprocessingPopupBg.destroy();
                                   // complete 화면(결과 등)으로 이동
                                   this.completeLevel();
                               }
                           });
                       }
                   }
               });
           }
       }*/

    startSpecialRound() {
        // 팝업 메시지와 함께 special round 시작
        this.showSpecialPopup();
    }

    showSpecialPopup() {
        // 팝업 배경
        this.specialPopupBg = this.add.image(60, 240, 'popup_bg_img')
            .setDisplaySize(320, 375)
            .setOrigin(0, 0)
            .setAlpha(0)
            .setDepth(25);

        // 메시지 업데이트
        if (this.messageTextObject) {
            this.messageTextObject.setText(this.specialData.popupMessage);
            this.messageTextObject.setVisible(true);
        }

        // 팝업 페이드인
        this.tweens.add({
            targets: this.specialPopupBg,
            alpha: 1,
            duration: 500,
            onComplete: () => {
                this.showSpecialWarningAnimation();
            }
        });
    }

    showSpecialWarningAnimation() {
        const { width } = this.sys.game.canvas;

        this.specialWarningSlide = this.add.image(width + 700, 243, this.specialData.warningImageKey)
            .setOrigin(0, 0)
            .setDepth(26)
            .setDisplaySize(1300, 353.53);

        // 왼쪽으로 슬라이드
        this.tweens.add({
            targets: this.specialWarningSlide,
            x: -448,
            duration: 1500,
            ease: 'Power2',
            onComplete: () => {
                // 안내 텍스트 표시
                this.showSpecialIntroText();
            }
        });
    }

    showSpecialIntroText() {
        const centerX = this.sys.game.canvas.width / 2;

        // Special Round 텍스트
        const specialRoundText = this.add.text(
            centerX, 391,
            '<special round>',
            {
                font: '24px "머니그라피"',
                fill: '#303030',
                align: 'center'
            }
        ).setOrigin(0.5, 0)
            .setAlpha(0.5)
            .setDepth(30);

        // 안내 텍스트
        const infoText = this.add.text(
            centerX, 423,
            this.specialData.introText,
            {
                font: '24px "머니그라피"',
                fill: '#303030',
                align: 'center'
            }
        ).setOrigin(0.5, 0)
            .setDepth(30);

        // 2초 후 페이드아웃하고 스텝 시퀀스 시작
        this.time.delayedCall(2000, () => {
            this.tweens.add({
                targets: [specialRoundText, infoText],
                alpha: 0,
                duration: 700,
                onComplete: () => {
                    specialRoundText.destroy();
                    infoText.destroy();
                    this.initializeSpecialSteps();
                }
            });
        });
    }

    initializeSpecialSteps() {
        // 스텝 관련 변수 초기화
        this.currentSpecialStep = 0;
        this.specialStepInputEnabled = true;

        // 현재 스텝의 이미지와 텍스트 표시
        this.displaySpecialStepContent(0);

        // 모든 커맨드 키 초기화 및 표시
        this.initializeSpecialCommandKeys();
        //this.isProcessingCommand = false;
    }

    displaySpecialStepContent(stepIndex) {
        // 이전 이미지와 텍스트 제거
        if (this.specialStepImage) this.specialStepImage.destroy();
        if (this.specialStepText) this.specialStepText.destroy();

        const step = this.specialData.steps[stepIndex];
        // 1. 텍스트창 업데이트
        if (this.messageTextObject) {
            this.messageTextObject.setText("종이팩의 재활용 과정을 알아보자!");
            this.messageTextObject.setVisible(true);
        }

        // 단계별 이미지 (왼쪽에서 40px, 위에서 358px)
        this.specialStepImage = this.add.image(40, 358, step.imageKey)
            .setOrigin(0, 0)
            .setDisplaySize(160, 160)
            .setDepth(27)
            .setAlpha(0); // 처음에는 투명하게

        // 단계별 설명 (왼쪽에서 80px, 위에서 308px)
        this.specialStepText = this.add.text(80, 308, step.text, {
            font: '20px "머니그라피"',
            fill: '#303030',
            align: 'center'
        })
            .setOrigin(0, 0)
            .setDepth(27)
            .setAlpha(0); // 처음에는 투명하게

        // 페이드인 애니메이션
        this.tweens.add({
            targets: [this.specialStepImage, this.specialStepText],
            alpha: 1,
            duration: 500,
            ease: 'Power2'
        });
    }

    initializeSpecialCommandKeys() {
        this.specialCommandKeys = [];
        this.specialCommands = [];
        this.activeKeyIndex = 0;

        // 모든 스텝의 커맨드를 하나의 배열로 합침
        this.specialData.steps.forEach((step, stepIndex) => {
            step.commands.forEach((cmd, cmdIndex) => {
                this.specialCommands.push({
                    ...cmd,
                    stepIndex,
                    commandIndex: cmdIndex
                });
            });
        });

        // 커맨드 키 생성
        let keyX = 238;
        const keyY = 418;

        this.specialCommands.forEach((cmd, idx) => {
            const isActive = idx === 0;  // 첫 번째만 활성화
            const keyImg = this.add.image(
                keyX + (idx * 24),
                keyY,
                isActive ? `${cmd.action}_key_img` : `${cmd.action}_key_dim_img`
            )
                .setDisplaySize(40, 43)
                .setOrigin(0, 0)
                .setDepth(28 + (this.specialCommands.length - idx));

            // 키 속성 설정
            keyImg.active = isActive;
            keyImg.action = cmd.action;
            keyImg.commandIndex = idx;
            keyImg.stepIndex = cmd.stepIndex;
            this.specialCommandKeys.push(keyImg);
        });

        // 입력 처리 시작
        this.handleSpecialCommand();
    }
    handleSpecialCommand() {
        // 이전 이벤트 리스너 제거
        this.input.keyboard.off('keydown');
        ['left', 'down', 'right'].forEach(dir => {
            if (this.commandButtons[dir]) {
                this.commandButtons[dir].off('pointerdown');
            }
        });

        // 새로운 이벤트 리스너 등록
        const handleInput = (action) => {
            if (!this.specialStepInputEnabled) return;
            this.processSpecialCommandInput(action);
        };

        // 키보드 이벤트
        this.input.keyboard.on('keydown', (event) => {
            let action = null;
            if (event.keyCode === Phaser.Input.Keyboard.KeyCodes.LEFT) action = 'left';
            else if (event.keyCode === Phaser.Input.Keyboard.KeyCodes.DOWN) action = 'down';
            else if (event.keyCode === Phaser.Input.Keyboard.KeyCodes.RIGHT) action = 'right';

            if (action) handleInput(action);
        });

        // 터치 이벤트
        ['left', 'down', 'right'].forEach(dir => {
            if (this.commandButtons[dir]) {
                this.commandButtons[dir].on('pointerdown', () => handleInput(dir));
            }
        });
    }
    /*
     processSpecialCommandInput(action) {
         const currentKey = this.specialCommandKeys[this.activeKeyIndex];
 
         if (!currentKey) return;
 
         console.log('현재 활성화된 키:', this.activeKeyIndex);
         console.log('입력된 액션:', action);
         console.log('현재 키 액션:', currentKey.action);
 
         if (action === currentKey.action) {
             console.log('올바른 액션 입력됨');
 
             // 현재 키 비활성화 및 날아가는 애니메이션
             currentKey.active = false;
             this.tweens.add({
                 targets: currentKey,
                 y: currentKey.y - 50,
                 alpha: 0,
                 duration: 400,
                 onComplete: () => {
                     currentKey.destroy();
 
                     // 남은 키들 앞으로 당기기
                     for (let i = this.activeKeyIndex + 1; i < this.specialCommandKeys.length; i++) {
                         const key = this.specialCommandKeys[i];
                         if (key && !key.destroyed) {
                             this.tweens.add({
                                 targets: key,
                                 x: 238 + ((i - this.activeKeyIndex - 1) * 24),
                                 duration: 300
                             });
                         }
                     }
 
                     // 다음 키 활성화
                     this.activeKeyIndex++;
                     if (this.activeKeyIndex < this.specialCommandKeys.length) {
                         const nextKey = this.specialCommandKeys[this.activeKeyIndex];
                         if (nextKey && !nextKey.destroyed) {
                             nextKey.active = true;
                             nextKey.setTexture(`${nextKey.action}_key_img`);
 
                             // 단계가 바뀌었는지 확인
                             if (nextKey.stepIndex !== currentKey.stepIndex) {
                                 this.displaySpecialStepContent(nextKey.stepIndex);
                             }
                         }
                     } else {
                         // 모든 키 완료
                         this.goToNextSpecialStep();
                     }
                 }
             });
         } else {
             // 틀린 입력 - 흔들림 효과
             this.tweens.add({
                 targets: currentKey,
                 x: currentKey.x + 5,
                 duration: 50,
                 yoyo: true,
                 repeat: 2
             });
         }
     }*/
    processSpecialCommandInput(action) {
        // 터치 딜레이 체크와 canClick 상태 확인 추가
        if (!this.canClick || !this.checkTouchDelay()) return;

        const currentKey = this.specialCommandKeys[this.activeKeyIndex];
        if (!currentKey) return;

        if (action === currentKey.action) {
            // 입력 처리 시작 전에 클릭 비활성화
            this.disableClickTemporarily();

            // 현재 키 비활성화 및 날아가는 애니메이션
            currentKey.active = false;
            this.tweens.add({
                targets: currentKey,
                y: currentKey.y - 50,
                alpha: 0,
                duration: 400,
                onComplete: () => {
                    currentKey.destroy();

                    // 남은 키들 앞으로 당기기
                    for (let i = this.activeKeyIndex + 1; i < this.specialCommandKeys.length; i++) {
                        const key = this.specialCommandKeys[i];
                        if (key && !key.destroyed) {
                            this.tweens.add({
                                targets: key,
                                x: 238 + ((i - this.activeKeyIndex - 1) * 24),
                                duration: 300
                            });
                        }
                    }

                    // 다음 키 활성화
                    this.activeKeyIndex++;
                    if (this.activeKeyIndex < this.specialCommandKeys.length) {
                        const nextKey = this.specialCommandKeys[this.activeKeyIndex];
                        if (nextKey && !nextKey.destroyed) {
                            nextKey.active = true;
                            nextKey.setTexture(`${nextKey.action}_key_img`);

                            // 단계가 바뀌었는지 확인
                            if (nextKey.stepIndex !== currentKey.stepIndex) {
                                this.displaySpecialStepContent(nextKey.stepIndex);
                            }
                        }
                    } else {
                        // 모든 키 완료
                        this.goToNextSpecialStep();
                    }
                }
            });
        } else {
            // 틀린 입력 - 흔들림 효과
            this.tweens.add({
                targets: currentKey,
                x: currentKey.x + 5,
                duration: 50,
                yoyo: true,
                repeat: 2
            });
        }
    }

    goToNextSpecialStep() {
        console.log('goToNextSpecialStep 호출됨');

        // 현재 스텝 완료 처리
        this.specialStepInputEnabled = false;
        console.log('현재 스텝:', this.currentSpecialStep);

        if (this.messageTextObject) {
            this.messageTextObject.setText(this.specialData.completeMessage);
        }

        // 모든 키가 완료되었으므로 바로 정리 시작
        this.time.delayedCall(2500, () => {
            console.log('모든 스텝 완료, 정리 시작');
            this.cleanupSpecialRound();
        });
    }
    /*
        goToNextSpecialStep() {
            // 현재 스텝 완료 처리
            this.specialStepInputEnabled = false;
    
            // 이미지/텍스트 페이드아웃
            this.tweens.add({
                targets: [this.specialStepImage, this.specialStepText],
                alpha: 0,
                duration: 500,
                onComplete: () => {
                    // 다음 스텝 시작
                    this.currentSpecialStep++;
                    if (this.currentSpecialStep < this.specialData.steps.length) {
                        this.displaySpecialStepContent(this.currentSpecialStep);
                        this.initializeSpecialCommandKeys();
                    } else {
                        // special round 완료
                        this.time.delayedCall(2000, () => {
                            this.cleanupSpecialRound();
                        });
                    }
                }
            });
        }*/

    startSpecialStepSequence(stepIndex) {
        // 이전 step UI 제거
        if (this.specialStepImage) this.specialStepImage.destroy();
        if (this.specialStepText) this.specialStepText.destroy();
        if (this.specialCommandKeys) this.specialCommandKeys.forEach(img => img.destroy());
        this.specialCommandKeys = [];

        // 1. 텍스트창 업데이트
        if (this.messageTextObject) {
            this.messageTextObject.setText("종이팩의 재활용 과정을 알아보자!");
            this.messageTextObject.setVisible(true);
        }

        // 마지막 단계 완료 시
        if (stepIndex >= this.specialData.steps.length) {
            // 메시지 표시
            if (this.messageTextObject) {
                this.messageTextObject.setText(this.specialData.completeMessage);
            }
            // 2초 후 정리 시작
            this.time.delayedCall(2000, () => {
                this.cleanupSpecialRound();
            });
            return;
        }

        // 현재 step 데이터
        const step = this.specialData.steps[stepIndex];

        // 단계별 이미지 (왼쪽에서 40px, 위에서 358px)
        this.specialStepImage = this.add.image(40, 358, step.imageKey)
            .setOrigin(0, 0)
            .setDisplaySize(160, 160)
            .setDepth(27);

        // 단계별 설명 (왼쪽에서 80px, 위에서 308px)
        this.specialStepText = this.add.text(80, 308, step.text, {
            font: '20px "머니그라피"',
            fill: '#303030',
            align: 'center'
        }).setOrigin(0, 0).setDepth(27);

        // special round용 커맨드 키 생성 및 설정
        this.setupSpecialCommandKeys(step);

        // 첫 번째 커맨드 키만 활성화된 상태로 시작
        this.handleNextSpecialCommand();

        // 현재 step 인덱스 저장
        this.currentSpecialStep = stepIndex;
    }

    cleanupSpecialRound() {
        // 이전 요소들 제거
        if (this.specialStepImage) this.specialStepImage.destroy();
        if (this.specialStepText) this.specialStepText.destroy();
        if (this.specialCommandKeys) {
            this.specialCommandKeys.forEach(key => key.destroy());
        }

        // 경고 슬라이드 왼쪽으로 이동하며 사라짐
        if (this.specialWarningSlide) {
            this.tweens.add({
                targets: this.specialWarningSlide,
                x: -1500,
                duration: 1500,
                onComplete: () => {
                    this.specialWarningSlide.destroy();
                    if (this.specialPopupBg) {
                        // 배경 페이드아웃
                        this.tweens.add({
                            targets: this.specialPopupBg,
                            alpha: 0,
                            duration: 500,
                            onComplete: () => {
                                this.specialPopupBg.destroy();
                                // 특별 라운드 점수 추가
                                this.score += 500;
                                if (this.scoreText) {
                                    this.scoreText.setText(`${this.score}`);
                                }
                                // 다음 레벨로 진행
                                this.completeLevel();
                            }
                        });
                    }
                }
            });
        }
    }

    // resetCurrentRound 함수 수정
    resetCurrentRound() {
        console.log('GameScene: 현재 라운드 다시 시작');

        // 모든 트윈 중지
        this.tweens.killAll();

        // 게임 상태 초기화
        this.isFalling = false;
        this.isProcessingResult = false;
        this.gameState = 'playing';

        // 타이머 초기화
        this.itemTimeRemaining = this.itemTimeLimit;
        this.lastFallTime = 0;

        // 전처리 관련 변수 초기화
        this.preprocessingSteps = null;
        this.currentPreprocessingStep = 0;
        this.commandKeyImages = [];

        // 낙하 횟수 초기화
        this.fallCount = 0;

        // '터치!' 텍스트 제거
        if (this.touchText) {
            this.touchText.destroy();
            this.touchText = null;
        }

        // 기존 아이템 제거
        if (this.currentTrashItemGraphic) {
            this.currentTrashItemGraphic.destroy();
            this.currentTrashItemGraphic = null;
        }

        // 아이템 이름 텍스트 제거
        if (this.itemNameText) {
            this.itemNameText.destroy();
            this.itemNameText = null;
        }

        // 라인 초기화
        if (this.laneIndicatorLine) {
            this.laneIndicatorLine.setTexture('lane_line_img');
            this.laneIndicatorLine.setVisible(false);
        }

        // 현재 레인 인덱스 초기화
        this.currentLaneIndex = 0;
        this.currentOpenBinIndex = -1;

        //this.isProcessingCommand = false;

        this.spawnWasteItem();
    }

    completeLevel() {
        console.log('GameScene: 레벨 완료!');

        // 1. 상단 UI 그룹 (레벨, 점수, 난이도, 하트, 라운드, 상단 버튼, 상단 텍스트 등)
        const topUI = [
            this.levelText,
            this.scoreText,
            this.difficultyText,
            // 상단 버튼들
            ...this.uiContainers.common.list.filter(obj =>
                obj.texture && (obj.texture.key === 'back_button_img' || obj.texture.key === 'menu_button_img')
            ),
            // 상단 라벨 텍스트들 (예: '레벨', '환경 점수', '난이도')
            ...this.children.list.filter(obj =>
                obj.text && (
                    obj.text === '레벨' ||
                    obj.text === '환경 점수' ||
                    obj.text === '난이도'
                )
            )
        ];

        // 2. 메인 패널 + 아이템 + 아이템 이름 + 쓰레기통 + 쓰레기통 이름 + 라인
        const centerUI = [
            this.mainPanelImage,
            this.currentTrashItemGraphic,
            this.itemNameText,
            ...(this.heartGraphics || []),
            ...(this.roundGraphics || []),
            ...(this.binImages || []),
            ...(this.binNameTexts || []),
            this.laneIndicatorLine,
            this.type3LeftText,
            this.type3RightText
        ].filter(Boolean);

        // 3. 메시지 영역 (메시지 보드, 메시지 텍스트, 메시지 커맨드 이미지, 메시지 텍스트들)
        const messageUI = [
            this.messageAreaGraphic,
            this.messageTextObject,
            ...(this.messageCommandImages || []),
            ...(this.messageTexts || [])
        ].filter(Boolean);

        // 4. 하단 UI (커맨드 버튼)
        const bottomUI = [
            this.commandButtons.left,
            this.commandButtons.down,
            this.commandButtons.right
        ];

        // 1. 상단 UI 왼쪽으로 밀어내기
        this.tweens.add({
            targets: topUI,
            x: '-=500',
            alpha: 0,
            duration: 500,
            ease: 'Power2',
            onComplete: () => {
                // 2. 메인 패널+아이템 점점 사라지기
                this.tweens.add({
                    targets: centerUI,
                    alpha: 0,
                    duration: 500,
                    ease: 'Power2',
                    onComplete: () => {
                        // 3. 메시지 영역 점점 사라지기
                        this.tweens.add({
                            targets: messageUI,
                            alpha: 0,
                            duration: 500,
                            ease: 'Power2',
                            onComplete: () => {
                                // 4. 하단 UI 왼쪽으로 밀어내기
                                this.tweens.add({
                                    targets: bottomUI,
                                    x: '-=500',
                                    alpha: 0,
                                    duration: 500,
                                    ease: 'Power2',
                                    onComplete: () => {
                                        // 모두 사라진 후 결과 화면으로 전환
                                        this.time.delayedCall(200, () => {
                                            this.showResultScene();
                                        });
                                    }
                                });
                            }
                        });
                    }
                });
            }
        });
    }
    /*
        showResultScene() {
            // 기존 completeLevel의 결과 데이터 전달 코드
            const elapsed = this.time.now - this.levelStartTime;
            const avg = this.AVERAGE_LEVEL_TIME;
            let timeBonus = avg / Math.max(elapsed, 1);
            timeBonus = Math.min(Math.max(timeBonus, 0.5), 2);
    
            const baseScore = this.score;
            const bonusScore = Math.round(baseScore * (timeBonus - 1));
            const totalScore = baseScore + bonusScore;
            let totalPoint = parseInt(localStorage.getItem('totalPoint')) || 0;
            totalPoint += totalScore;
            localStorage.setItem('totalPoint', totalPoint);
    
            this.scene.start('ResultScene', {
                level: this.level,
                trashCount: this.maxRounds,
                baseScore,
                totalScore,
                timeBonus: timeBonus.toFixed(2),
                elapsed: Math.round(elapsed / 1000),
                health: this.health
            });
        }*/
    showResultScene() {
        // 레벨 점수(라운드별 점수 합)
        const levelScore = this.score;

        // 시간 보너스 계산
        const elapsed = this.time.now - this.levelStartTime;
        const avg = this.AVERAGE_LEVEL_TIME;
        let timeBonusRatio = avg / Math.max(elapsed, 1);
        // 보너스 배율은 0.5~2로 제한
        timeBonusRatio = Math.min(Math.max(timeBonusRatio, 0.5), 2);

        // 최종 점수 = (평균 수행시간/실제 수행시간) × 레벨 점수
        const totalScore = Math.round(levelScore * timeBonusRatio);

        // 누적 포인트 저장
        let totalPoint = parseInt(localStorage.getItem('totalPoint')) || 0;
        totalPoint += totalScore;
        localStorage.setItem('totalPoint', totalPoint);

        this.scene.start('ResultScene', {
            level: this.level,
            trashCount: this.maxRounds,
            baseScore: levelScore,
            totalScore,
            timeBonus: timeBonusRatio.toFixed(2),
            elapsed: Math.round(elapsed / 1000),
            health: this.health
        });
    }

    updateHealthUI() {
        console.log('GameScene: 체력 UI 업데이트. 현재 체력:', this.health);

        // 하트의 총 개수
        const totalHearts = this.heartGraphics.length;

        for (let i = 0; i < totalHearts; i++) {
            // i가 0이면 첫 번째(왼쪽) 하트, 값이 클수록 오른쪽 하트
            const heartImg = this.heartGraphics[i];

            if (i < this.health) {
                // 체력이 남아있는 경우 채워진 하트
                heartImg.setTexture('heart_full_img');
            } else {
                // 체력이 없는 경우 빈 하트
                heartImg.setTexture('heart_empty_img');
            }
        }
    }

    updateRoundsUI() {
        console.log('GameScene: 라운드 UI 업데이트, 현재 라운드:', this.currentRound);

        const roundSize = 15;   // 원 크기 15x15
        const roundSpacing = 5; // 간격
        const firstRoundX = 80; // 첫 번째 원 X 위치

        // 각 원의 위치와 이미지 업데이트
        for (let i = 0; i < this.roundGraphics.length; i++) {
            const roundImg = this.roundGraphics[i];

            if (i === 0) {
                // 첫 번째 원은 항상 검정색, 위치는 그대로
                roundImg.setTexture('round_black_img');
                roundImg.setPosition(firstRoundX, 260);
            } else if (i < this.currentRound) {
                // 현재 라운드 이전은 연결된 원
                roundImg.setTexture('round_connected_img');

                // 연결된 원은 간격을 메우기 위해 5픽셀 왼쪽으로 이동
                // 즉, 원래 위치에서 간격만큼 왼쪽으로 이동
                const originalX = firstRoundX + (i * (roundSize + roundSpacing));
                roundImg.setPosition(originalX - roundSpacing, 260);
            } else {
                // 현재 라운드 이후는 회색 원, 원래 위치 유지
                roundImg.setTexture('round_gray_img');
                const originalX = firstRoundX + (i * (roundSize + roundSpacing));
                roundImg.setPosition(originalX, 260);
            }
        }
    }

    resetItemForRetry() {
        console.log('GameScene: 같은 아이템으로 다시 출제.');
        this.hideResultUI();

        // 현재 게임 타입에 따라 다시 스폰
        if (this.currentGameType === 1) {
            this.spawnType1Item(this.currentTrashItemData);
        } else if (this.currentGameType === 2) {
            this.spawnType2Item(this.currentTrashItemData);
        } else if (this.currentGameType === 3) {
            this.spawnType3Item(this.currentTrashItemData);
        }
    }

    // resetGameState 함수에서 첫 아이템 생성 부분 분리
    resetGameState() {
        console.log('GameScene: 게임 상태 초기화 시작.');

        // 팝업 객체가 있으면 제거
        if (this.incorrectPopupBg) {
            this.incorrectPopupBg.destroy();
            this.incorrectPopupBg = null;
        }
        // 게임 변수 초기화
        this.score = 0;
        //this.health = 3;
        this.currentRound = 1;
        this.maxRounds = this.getRoundData().length; // 현재 레벨의 실제 라운드 수로 설정
        this.currentLaneIndex = 0;
        this.isFalling = false;
        this.isProcessingResult = false;
        this.moveLeft = false;
        this.moveRight = false;
        this.moveDownFast = false;
        this.lastKeyboardMoveTime = 0;
        this.lastLandedLaneIndex = 0;
        this.itemTimeRemaining = this.itemTimeLimit;
        this.currentOpenBinIndex = -1;
        this.gameState = 'playing';
        this.currentGameType = 1;
        this.fallCount = 0;

        this.levelStartTime = this.time.now; // 레벨 시작 시간 기록

        // UI 전환
        this.switchGameTypeUI(this.currentGameType);

        // UI 오브젝트 초기화
        if (this.scoreText) { this.scoreText.setText(this.score); }
        if (this.levelText) {
            this.levelText.setText(`${this.level}`);
        }
        if (this.roundText) { this.roundText.setText(`${this.currentRound}`); }
        if (this.timeText) { this.timeText.setText(`${this.itemTimeLimit}`); }

        // 하트 UI 업데이트
        if (this.heartGraphics.length > 0) {
            this.updateHealthUI();
        }

        // 결과 버튼 숨김
        this.hideResultUI();

        // 쓰레기 아이템 제거
        if (this.currentTrashItemGraphic) {
            this.currentTrashItemGraphic.destroy();
            this.currentTrashItemGraphic = null;
        }

        this.currentLaneIndex = 0;
        this.currentOpenBinIndex = -1; // 중요: 열린 쓰레기통 인덱스 초기화

        // 모든 쓰레기통을 닫힌 상태로 리셋
        this.resetAllBins();

        // 첫 번째 라운드 아이템 생성
        this.spawnWasteItem();
        //this.isProcessingCommand = false;

        console.log('GameScene: 게임 상태 초기화 완료. 첫 아이템 생성.');
    }

    resetAllBins() {
        console.log('모든 쓰레기통 리셋 시작');

        if (!this.binImages || this.binImages.length === 0) {
            console.log('쓰레기통 이미지가 초기화되지 않음');
            return;
        }

        // 원래 updateBinVisuals의 로직을 참고하여 리셋
        const closedBinSize = { width: 50, height: 34 };
        const closedBinY = 581;

        this.binImages.forEach((bin, index) => {
            if (bin && this.binKeys && this.binKeys[index] && this.binGraphics && this.binGraphics[index]) {
                // binKeys를 기반으로 닫힌 이미지 키 생성
                const closedImageKey = `${this.binKeys[index]}_img`;
                const originalBinX = this.binGraphics[index].x;

                if (this.textures.exists(closedImageKey)) {
                    // 텍스처 변경
                    bin.setTexture(closedImageKey);

                    // 닫힌 쓰레기통 크기와 위치로 복원 (updateBinVisuals와 동일한 로직)
                    bin.setDisplaySize(closedBinSize.width, closedBinSize.height);
                    bin.setPosition(originalBinX, closedBinY);

                    console.log(`쓰레기통 ${index} (${this.binKeys[index]}) 닫힌 상태로 리셋`);
                } else {
                    console.warn(`쓰레기통 이미지 없음: ${closedImageKey}`);
                }
            }
        });

        // 라인 인디케이터 숨기기
        if (this.laneIndicatorLine) {
            this.laneIndicatorLine.setVisible(false);
        }

        console.log('모든 쓰레기통 리셋 완료');
    }





    // GameScene 클래스에 shutdown 함수 추가
    shutdown() {
        // 모든 트윈 중지
        this.tweens.killAll();

        // 팝업 객체 제거
        if (this.incorrectPopupBg) {
            this.incorrectPopupBg.destroy();
            this.incorrectPopupBg = null;
        }

        // 기타 객체 정리
        if (this.currentTrashItemGraphic) {
            this.currentTrashItemGraphic.destroy();
            this.currentTrashItemGraphic = null;
        }

        console.log('GameScene: 씬 종료 및 객체 정리 완료');
    }


    gameOver() {
        console.log('GameScene: Game Over!');

        // 모든 트윈 및 애니메이션 중지
        if (this.tweens) this.tweens.killAll();
        if (this.currentTrashItemGraphic && this.currentTrashItemGraphic.anims) {
            this.currentTrashItemGraphic.anims.stop();
        }

        // 게임 오버 메시지 표시
        if (this.messageTextObject) {
            this.messageTextObject.setText('게임 오버!\n다음에 다시 도전하세요!');
        }

        // 게임 플레이 입력 비활성화
        this.setGameInputEnabled(false);

        // 게임 오버 팝업 표시
        this.incorrectPopupBg = this.add.image(60, 240, 'popup_bg_img')
            .setDisplaySize(320, 375)
            .setOrigin(0, 0)
            .setAlpha(0)
            .setDepth(25);

        // 서서히 나타나는 애니메이션
        this.tweens.add({
            targets: this.incorrectPopupBg,
            alpha: 0.8,
            duration: 800,
            ease: 'Linear',
            onComplete: () => {
                // 게임 오버 텍스트 표시
                const gameOverText = this.add.text(220, 350, '게임 오버', {
                    font: '32px "머니그라피"',
                    fill: '#ffffff',
                    align: 'center'
                })
                    .setOrigin(0.5)
                    .setDepth(26);

                // 다시 시작 버튼
                const restartButton = this.add.rectangle(220, 450, 180, 60, 0x0000ff)
                    .setInteractive()
                    .setDepth(26);

                const restartText = this.add.text(220, 450, '다시 시작', {
                    font: '24px "머니그라피"',
                    fill: '#ffffff',
                    align: 'center'
                })
                    .setOrigin(0.5)
                    .setDepth(27);

                // 버튼 클릭 이벤트
                restartButton.on('pointerdown', () => {
                    // 모든 인터랙티브 오브젝트 제거
                    if (this.commandButtons.left) this.commandButtons.left.destroy();
                    if (this.commandButtons.down) this.commandButtons.down.destroy();
                    if (this.commandButtons.right) this.commandButtons.right.destroy();
                    if (this.currentTrashItemGraphic) this.currentTrashItemGraphic.destroy();
                    if (this.incorrectPopupBg) this.incorrectPopupBg.destroy();
                    // ...필요시 추가...

                    // 입력 활성화
                    this.input.enabled = true;
                    if (this.input.keyboard) this.input.keyboard.enabled = true;
                    if (this.input.mouse) this.input.mouse.enabled = true;
                    if (this.input.touch) this.input.touch.enabled = true;

                    // 씬 전환
                    this.scene.stop('GameScene');
                    this.scene.start('BootScene');
                });
            }
        });
    }
}


class ResultScene extends Phaser.Scene {
    constructor() {
        super('ResultScene');
    }

    init(data) {
        // GameScene에서 전달된 결과 데이터 저장
        this.resultData = data || {};
    }
    preload() {
        this.load.image('btn_home', 'assets/images/homebutton.png');
        this.load.image('btn_next', 'assets/images/nextbutton.png');
        this.load.image('btn_env', 'assets/images/refeelybutton.png');
        this.load.image('line', 'assets/images/finalline.png');

    }

    create() {
        const { width, height } = this.sys.game.canvas;

        // 배경색
        this.cameras.main.setBackgroundColor('#3cbb89');

        // 결과 컨테이너 생성 (애니메이션용)
        this.resultContainer = this.add.container(0, 0).setAlpha(0);

        // 결과 패널 배경
        const panel = this.add.rectangle(0, 0, 340, 600, 0x3cbb89, 1);
        this.resultContainer.add(panel);

        // 타이틀
        const title = this.add.text(60, 200, '게임 결과', {
            font: '48px "머니그라피"',
            fill: '#fff',
            align: 'left'
        }).setOrigin(0, 0);
        this.resultContainer.add(title);

        // 서브타이틀
        const subtitle = this.add.text(60, 260, '분리배출의 전문가네요!', {
            font: '24px "머니그라피"',
            fill: '#fff',
            align: 'center'
        }).setOrigin(0, 0);
        this.resultContainer.add(subtitle);

        // 결과 정보 항목명/값 분리
        const infoStartY = 332;
        const infoLineHeight = 40;
        const infoFont = '32px "머니그라피"';
        const infoColor = '#fff';

        // 항목명(왼쪽)
        const labels = ['레벨', '처리한 쓰레기', '환경 점수'];
        labels.forEach((label, i) => {
            this.resultContainer.add(
                this.add.text(60, infoStartY + i * infoLineHeight, label, {
                    font: infoFont,
                    fill: infoColor,
                    align: 'left'
                }).setOrigin(0, 0)
            );
        });

        // 값(오른쪽)
        const values = [
            this.resultData.level,
            `${this.resultData.trashCount}개`,
            this.resultData.baseScore?.toLocaleString() ?? ''
        ];
        values.forEach((val, i) => {
            this.resultContainer.add(
                this.add.text(380, infoStartY + i * infoLineHeight, val, {
                    font: infoFont,
                    fill: infoColor,
                    align: 'right'
                }).setOrigin(1, 0)
            );
        });

        // 라인구분 (이미지)
        const line = this.add.image(60, 457, 'line')
            .setOrigin(0, 0)
            .setInteractive()
            .setAlpha(1)
            .setDisplaySize(320, 2); // 필요시 크기 조정
        this.resultContainer.add(line);

        // 포인트 표시
        const point = this.add.text(60, 468, '획득 포인트', {
            font: '32px "머니그라피"',
            fill: '#fff',
            align: 'left'
        }).setOrigin(0, 0);
        this.resultContainer.add(point);
        const pointvalue = this.add.text(380, 468, this.resultData.totalScore?.toLocaleString() ?? '', {
            font: '32px "머니그라피"',
            fill: '#fff',
            align: 'right'
        }).setOrigin(1, 0);
        this.resultContainer.add(pointvalue);

        // 시간 보너스(작은 글씨, 별도 줄)
        const elapsedSec = this.resultData.elapsed || 0;
        const min = Math.floor(elapsedSec / 60);
        const sec = elapsedSec % 60;
        const elapsedStr = `${min}분 ${sec}초`;

        this.resultContainer.add(
            this.add.text(60, 508,
                `시간 스코어 x${this.resultData.timeBonus}  (${elapsedStr})`, {
                font: '16px "머니그라피"',
                fill: '#fff',
                align: 'left'
            }).setOrigin(0, 0)
        );

        // 홈 버튼 (이미지)
        const homeBtnImg = this.add.image(46, 650, 'btn_home')
            .setOrigin(0, 0)
            .setInteractive()
            .setAlpha(1)
            .setDisplaySize(164, 40); // 필요시 크기 조정
        this.resultContainer.add(homeBtnImg);

        // 다음 레벨 버튼 (이미지)
        const nextBtnImg = this.add.image(230, 650, 'btn_next')
            .setOrigin(0, 0)
            .setInteractive()
            .setAlpha(1)
            .setDisplaySize(164, 40);
        this.resultContainer.add(nextBtnImg);

        // 리필리 버튼 (이미지)
        const envBtnImg = this.add.image(46, 555, 'btn_env')
            .setOrigin(0, 0)
            .setInteractive()
            .setAlpha(1)
            .setDisplaySize(348, 75);
        this.resultContainer.add(envBtnImg);

        // 페이드인 애니메이션
        this.tweens.add({
            targets: this.resultContainer,
            alpha: 1,
            duration: 700,
            ease: 'Power2'
        });

        // 버튼 이벤트
        envBtnImg.on('pointerdown', () => {
            window.open('https://refeely.com/', '_blank');
        });

        homeBtnImg.on('pointerdown', () => {
            this.fadeOutAndGoHome();
        });

        nextBtnImg.on('pointerdown', () => {
            this.fadeOutAndNextLevel();
        });
    }

    fadeOutAndGoHome() {
        // 최고레벨 갱신
        const savedLevel = parseInt(localStorage.getItem('level') || '1', 10);
        if (this.resultData.level > savedLevel) {
            localStorage.setItem('level', this.resultData.level);
        }
        this.tweens.add({
            targets: this.resultContainer,
            alpha: 0,
            duration: 500,
            onComplete: () => {
                this.scene.start('BootScene');
            }
        });
    }

    fadeOutAndNextLevel() {
        const nextLevel = (this.resultData.level || 1) + 1;

        // 레벨 3 이후는 준비중 메시지 표시
        if (nextLevel > 3) {
            // 준비중 팝업 배경
            const popupBg = this.add.rectangle(
                220, 478,  // 화면 중앙
                300, 200,  // 크기
                0x000000,  // 배경색
                0.8        // 투명도
            ).setDepth(100);

            // 준비중 메시지
            const popupText = this.add.text(
                220, 478,
                '다음 레벨은\n준비중입니다!',
                {
                    font: '24px "머니그라피"',
                    fill: '#ffffff',
                    align: 'center'
                }
            ).setOrigin(0.5)
                .setDepth(101);

            // 2초 후 팝업 제거
            this.time.delayedCall(2000, () => {
                popupBg.destroy();
                popupText.destroy();
            });

            return; // 다음 진행 중단
        }

        // 레벨 3 이하인 경우 기존 로직 실행
        const savedLevel = parseInt(localStorage.getItem('level') || '1', 10);
        if (nextLevel > savedLevel) {
            localStorage.setItem('level', nextLevel);
        }

        this.tweens.add({
            targets: this.resultContainer,
            alpha: 0,
            duration: 500,
            onComplete: () => {
                this.scene.start('GameScene', {
                    level: nextLevel,
                    health: this.resultData.health
                });
            }
        });
    }
}

// Phaser config에 ResultScene 추가 필요!
// scene: [BootScene, GameScene, ResultScene]

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
        //LoginScene,
        //LoginInputScene,
        //SignupScene,
        BootScene,
        HowToPlayScene,
        MyPageScene,
        GameScene,
        DexScene,
        ResultScene
    ],
    dom: {
        createContainer: true  // DOM 요소 사용을 위해 추가
    }
};
const game = new Phaser.Game(config);
