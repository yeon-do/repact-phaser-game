export const rules = [
  {
    "id": "glass_bottle",
    "name": "유리병",
    "type": 1,
    "difficulty": 1,
    "correctBin": "bin_glass",
    "messageInitial": "유리병이 나타났어.\n어디에 분리배출 해야 할까?",
    "messageCorrect": "정답! 유리병은 유리병 전용 수거함에!",
    "messageIncorrect": "오답! 유리병은 유리 전용 수거함에 넣어야 해."
  },
  {
    "id": "newspaper",
    "name": "신문지",
    "type": 1,
    "difficulty": 1,
    "correctBin": "bin_paper",
    "messageInitial": "신문지가 나타났어.\n어디에 분리배출 해야 할까?",
    "messageCorrect": "정답! 신문지는 종이로 분리배출!",
    "messageIncorrect": "오답! 신문지는 종이류로 분리배출해야 해."
  },
  {
    "id": "milk_carton",
    "name": "우유팩",
    "preprocessedName": "세척하고 말린 우유팩",
    "type": 2,
    "difficulty": 3,
    "correctBin": "bin_pack",
    "requiresPreprocessing": true,
    "preprocessingSteps": [
      {
        "text": "펼치고",
        "commands": [
          { "action": "left", "key": "←", "color": "#FF9500" },
          { "action": "right", "key": "→", "color": "#0080FF" }
        ]
      },
      {
        "text": "물로 헹군 뒤",
        "commands": [
          { "action": "down", "key": "↓", "color": "#00FF00" }
        ]
      },
      {
        "text": "말린 다음",
        "commands": [
          { "action": "left", "key": "←", "color": "#FF9500" },
          { "action": "right", "key": "→", "color": "#0080FF" }
        ]
      },
      {
        "text": "차곡 차곡 모으기",
        "commands": [
          { "action": "down", "key": "↓", "color": "#00FF00" }
        ]
      }
    ],
    "messageInitial": "xx우유 500ml 쓰레기가 나타났어.\n근데 이대로는 분리배출이 안될 것 같은데...",
    "messageWarning": "xx우유 500ml 쓰레기가 나타났어.\n근데 이대로는 분리배출이 안될 것 같은데...",
    "messagePreprocessed": "잘 정리됐어! 이제 종이팩 수거함에 넣자!",
    "messagePreprocessingComplete": "휴, 드디어 우유팩을 분리배출 가능한 \n상태로 만들었어!",
    "messageAfterPreprocessing": "자, 이제 그럼 다시 분리배출 해볼까?",
    "messageCorrect": "정답이야!\n우유팩은 일반 종이팩으로 배출해야해.",
    "messageIncorrect": "오답이야!\n우유팩의 배출 방법을 다시 생각해 볼까?"
  },
  {
    "id": "plastic_bottle",
    "name": "플라스틱 병",
    "preprocessedName": "라벨을 제거한 플라스틱 병",
    "type": 2,
    "difficulty": 2,
    "correctBin": "bin_plastic",
    "requiresPreprocessing": true,
    "preprocessingSteps": [
      {
        "text": "라벨을 떼서 버리고",
        "commands": [
          { "action": "left", "key": "←", "color": "#FF9500" },
          { "action": "right", "key": "→", "color": "#0080FF" }
        ]
      },
      {
        "text": "물로 헹군 뒤",
        "commands": [
          { "action": "down", "key": "↓", "color": "#00FF00" }
        ]
      },
      {
        "text": "뚜껑을 분리하기",
        "commands": [
          { "action": "left", "key": "←", "color": "#FF9500" },
          { "action": "right", "key": "→", "color": "#0080FF" }
        ]
      }
    ],
    "messageInitial": "플라스틱 병이 나타났어.\n분리배출하려면 준비가 필요해!",
    "messageWarning": "쓰레기가 쓰레기통으로 떨어지지 않네?\n플라스틱 병의 분리배출 과정이 필요해!",
    "messagePreprocessed": "잘 정리됐어! 이제 플라스틱 수거함에 넣자!",
    "messageCorrect": "정답이야!\n플라스틱 병은 플라스틱으로 배출해야해.",
    "messageIncorrect": "오답이야!\n플라스틱 병의 배출 방법을 다시 생각해 볼까?"
  },
  {
    "id": "chicken_bone",
    "name": "닭뼈",
    "type": 3,
    "difficulty": 2,
    "correctBin": "bin_general",
    "quizQuestion": "닭뼈는 어떤 종류의 쓰레기일까?\n알맞은 분리배출 방법을 선택해보자!",
    "quizOptions": {
      "left": "일반쓰레기",
      "right": "음식쓰레기"
    },
    "correctAnswer": "left",
    "messageCorrect": "정답이야!\n닭뼈는 일반쓰레기로 버려야 해!",
    "messageIncorrect": "오답이야!\n닭뼈의 배출 방법을 다시 생각해볼까?"
  }
]