import React, { useState, useMemo, useRef, useEffect } from 'react';
import type { Routine, RoutineTemplate, Category, IdeaMemo } from '../../types/routine';
import { toDateKey } from '../../utils/dateUtils';
import { getStoredMemos, saveStoredMemos } from '../../utils/memoStorage';
import { MOBIT_IMAGES } from '../character/mobitImages';
import { useLanguage } from '../../utils/i18n';
import {
  TRACKING_DEFINITIONS,
  getActiveTrackerIds,
  toggleActiveTracker,
  trackerTitle,
} from '../../utils/trackingStorage';
import type { TrackingDefinition } from '../../utils/trackingStorage';

interface ExploreViewProps {
  userRoutines: Routine[];
  categories: Category[];
  onAddRoutine: (routineData: Omit<Routine, 'id' | 'createdAt' | 'order'>) => void;
  onOpenAddModal: () => void;
  onOpenAddWithTemplate?: (templateData: Partial<Routine>) => void;
}

// 1. 습관 추천 배너 (User Request: AI 습관 추천 -> 습관 추천 및 실시간 인터랙션 연동)
const RECOMMENDED_BANNERS = [
  {
    id: 'habit-goal',
    title: '내 목표에 맞는\n맞춤 습관 만들래',
    btnText: '직접 만들기 >',
    theme: 'custom',
    emoji: '🎯',
    bgGradient: 'from-blue-600 via-blue-500 to-indigo-600',
    characterKey: 'victory',
  },
  {
    id: 'habit-sleep',
    title: '밤에 잠을\n잘 자고 싶어',
    btnText: '숙면 습관 보기 >',
    theme: 'mind',
    emoji: '🌙',
    bgGradient: 'from-indigo-600 via-purple-600 to-violet-600',
    characterKey: 'sleep',
  },
  {
    id: 'habit-morning',
    title: '활기찬 아침을\n열고 싶어',
    btnText: '모닝 습관 보기 >',
    theme: 'life',
    emoji: '☀️',
    bgGradient: 'from-sky-600 via-blue-600 to-indigo-700',
    characterKey: 'walking',
  },
  {
    id: 'habit-health',
    title: '매일 챙기는\n건강 & 영양제',
    btnText: '건강 습관 보기 >',
    theme: 'health',
    emoji: '💊',
    bgGradient: 'from-emerald-600 via-teal-600 to-cyan-700',
    characterKey: 'medicine',
  },
];

// 3. 인기 투두 (2열 알약 버튼 - 카테고리 고정 순서를 탈피하여 다채롭게 믹스 & 신규 요청 항목 반영)
const POPULAR_TODOS = [
  // 1행 (Row 1): 웰니스 & 일상정리
  { id: 'todo-supplement', title: '영양제 챙기기', category: 'selfcare' },
  { id: 'todo-closet', title: '옷장정리', category: 'life' },
  // 2행 (Row 2): 셀프케어 & 오늘계획
  { id: 'todo-hair', title: '헤어샵 예약', category: 'selfcare' },
  { id: 'todo-plan', title: '오늘 계획 세우기', category: 'study' },
  // 3행 (Row 3): 리프레시 & 병원예약
  { id: 'todo-walk', title: '동네 산책', category: 'rest' },
  { id: 'todo-hospital', title: '병원 예약', category: 'selfcare' },
  // 4행 (Row 4): 반려케어 & 수분섭취
  { id: 'todo-pet', title: '반려동물케어', category: 'life' },
  { id: 'todo-water', title: '물 1컵 마시기', category: 'selfcare' },
  // 5행 (Row 5): 건강검진 & 환기
  { id: 'todo-checkup', title: '건강검진', category: 'selfcare' },
  { id: 'todo-air', title: '방 환기하기', category: 'life' },
  // 6행 (Row 6): 스트레칭 & 세탁
  { id: 'todo-stretch', title: '가벼운 스트레칭', category: 'selfcare' },
  { id: 'todo-laundry', title: '빨래하기', category: 'life' },
  // 7행 (Row 7): 데스크 정리 & 티타임
  { id: 'todo-desk', title: '책상 정리정돈', category: 'study' },
  { id: 'todo-tea', title: '따뜻한 차 한 잔', category: 'rest' },
  // 8행 (Row 8): 주방 & 식물
  { id: 'todo-dishes', title: '설거지', category: 'life' },
  { id: 'todo-plant', title: '반려식물 물주기', category: 'life' },
  // 9행 (Row 9): 낮잠 & 메일답장
  { id: 'todo-nap', title: '15분 낮잠자기', category: 'rest' },
  { id: 'todo-mail', title: '이메일 답장하기', category: 'study' },
  // 10행 (Row 10): 분리수거 & 반신욕
  { id: 'todo-recycle', title: '분리수거', category: 'life' },
  { id: 'todo-bath', title: '반신욕하기', category: 'selfcare' },
  // 11행 (Row 11): 장보기 & 가계부
  { id: 'todo-grocery', title: '장보기', category: 'life' },
  { id: 'todo-finance', title: '가계부 정리', category: 'study' },
  // 12행 (Row 12): 침구 & 음악
  { id: 'todo-bed', title: '침구 정리', category: 'life' },
  { id: 'todo-music', title: '음악 감상하기', category: 'rest' },
  // 13행 (Row 13): 화장실 & 자료읽기
  { id: 'todo-bathroom', title: '화장실 청소', category: 'life' },
  { id: 'todo-read', title: '자료 1편 읽기', category: 'study' },
  // 14행 (Row 14): 쓰레기 & 휴식
  { id: 'todo-trash', title: '쓰레기 버리기', category: 'life' },
  { id: 'todo-relax', title: '멍 때리기 5분', category: 'rest' },
];

// 4. 테마별 습관 (다이어트, 운동, 공부, 자기계발, 생활루틴 등 다채로운 상황 & 탈-레퍼런스 셔플 순서)
const THEME_HABITS: RoutineTemplate[] = [
  // 1. 공복 건강 & 다이어트
  {
    id: 'h-diet-probiotics',
    title: '공복 유산균 & 미온수 한 잔',
    emoji: '🥛',
    category: '다이어트',
    categoryId: 'health',
    timeOfDay: 'morning',
    tag: '공복 루틴',
    xp: 35,
    durationMinutes: 3,
    desc: '아침 장 환경 개선 및 수분 보충',
  },
  // 2. 아침 시야 확장 (자기계발)
  {
    id: 'h-mind-economy-news',
    title: '아침 10분 경제·시사 뉴스 읽기',
    emoji: '📰',
    category: '자기계발',
    categoryId: 'growth',
    timeOfDay: 'morning',
    tag: '시야 넓히기',
    xp: 35,
    durationMinutes: 10,
    desc: '주요 경제 흐름과 세상 트렌드 파악',
  },
  // 3. 기상 즉시 작은 성공 (생활)
  {
    id: 'h-life-bed-tidy',
    title: '일어나자마자 이불·침구 정리',
    emoji: '☀️',
    category: '생활',
    categoryId: 'life',
    timeOfDay: 'morning',
    tag: '작은 성공',
    xp: 25,
    durationMinutes: 3,
    desc: '침대를 단정하게 개며 기분 좋은 하루 시작',
  },
  // 4. 딥워크 몰입 (공부)
  {
    id: 'h-study-pomodoro',
    title: '뽀모도로 25분 초집중 공부',
    emoji: '📚',
    category: '공부',
    categoryId: 'study',
    timeOfDay: 'afternoon',
    tag: '초집중',
    xp: 40,
    durationMinutes: 25,
    desc: '타이머 맞춰 딴 생각 없이 집중하기',
  },
  // 5. 모닝 피트니스 (운동)
  {
    id: 'h-fit-morning-stretch',
    title: '기상 직후 10분 전신 스트레칭',
    emoji: '🧘',
    category: '운동',
    categoryId: 'fitness',
    timeOfDay: 'morning',
    tag: '몸 깨우기',
    xp: 35,
    durationMinutes: 10,
    desc: '굳은 관절과 근육을 부드럽게 이완',
  },
  // 6. 긍정 에너지 (자기계발)
  {
    id: 'h-mind-gratitude',
    title: '오늘 감사한 일 3가지 적기',
    emoji: '🙏',
    category: '자기계발',
    categoryId: 'mind',
    timeOfDay: 'night',
    tag: '감사 일기',
    xp: 35,
    durationMinutes: 5,
    desc: '사소한 일상 속에서 감사함 발견하기',
  },
  // 7. 유산소 걷기 (운동)
  {
    id: 'h-fit-steps-8k',
    title: '하루 활력 8,000보 걷기',
    emoji: '👟',
    category: '운동',
    categoryId: 'fitness',
    timeOfDay: 'anytime',
    tag: '유산소',
    xp: 45,
    durationMinutes: 40,
    desc: '일일 기초 대사량과 활력 유지',
  },
  // 8. 당류 컷 (다이어트)
  {
    id: 'h-diet-sugar',
    title: '당류 줄이고 제로 음료 마시기',
    emoji: '🥤',
    category: '다이어트',
    categoryId: 'health',
    timeOfDay: 'afternoon',
    tag: '당류 컷',
    xp: 35,
    durationMinutes: 5,
    desc: '불필요한 설탕과 액상과당 줄이기',
  },
  // 9. 지식 축적 (공부)
  {
    id: 'h-study-reading-15p',
    title: '책 15페이지 밑줄 긋고 읽기',
    emoji: '📖',
    category: '공부',
    categoryId: 'study',
    timeOfDay: 'night',
    tag: '독서 습관',
    xp: 35,
    durationMinutes: 15,
    desc: '인사이트 있는 문장에 하이라이트',
  },
  // 10. 활력 영양 (건강)
  {
    id: 'h-life-vitamins',
    title: '필수 비타민과 영양제 챙겨먹기',
    emoji: '💊',
    category: '건강',
    categoryId: 'health',
    timeOfDay: 'morning',
    tag: '활력 영양',
    xp: 30,
    durationMinutes: 2,
    desc: '오메가3, 비타민B, 루테인 섭취',
  },
  // 11. 공기 순환 (생활)
  {
    id: 'h-life-ventilation',
    title: '아침 10분 온 집안 맞바람 환기',
    emoji: '🪟',
    category: '생활',
    categoryId: 'life',
    timeOfDay: 'morning',
    tag: '공기 정화',
    xp: 25,
    durationMinutes: 10,
    desc: '신선한 바깥 공기로 실내 리프레시',
  },
  // 12. 마인드셋 강화 (자기계발)
  {
    id: 'h-mind-affirmation',
    title: '나를 깨우는 긍정 확언 3문장',
    emoji: '✨',
    category: '자기계발',
    categoryId: 'mind',
    timeOfDay: 'morning',
    tag: '마인드셋',
    xp: 30,
    durationMinutes: 3,
    desc: '스스로에게 자신감을 주는 확언 외치기',
  },
  // 13. 저녁 유산소 (운동)
  {
    id: 'h-fit-running',
    title: '저녁 상쾌한 야외 러닝 25분',
    emoji: '🏃',
    category: '운동',
    categoryId: 'fitness',
    timeOfDay: 'night',
    tag: '달리기',
    xp: 50,
    durationMinutes: 25,
    desc: '체지방 연소와 하루 스트레스 해소',
  },
  // 14. 고단백 식단 (다이어트)
  {
    id: 'h-diet-protein',
    title: '점심 고단백 샐러드 식단 챙기기',
    emoji: '🥗',
    category: '다이어트',
    categoryId: 'health',
    timeOfDay: 'afternoon',
    tag: '식단 관리',
    xp: 40,
    durationMinutes: 20,
    desc: '닭가슴살, 계란 등 단백질과 신선 채소',
  },
  // 15. 외국어 단어 (공부)
  {
    id: 'h-study-vocab-10',
    title: '필수 외국어 단어 10개 외우기',
    emoji: '✍️',
    category: '공부',
    categoryId: 'study',
    timeOfDay: 'afternoon',
    tag: '어학 학습',
    xp: 35,
    durationMinutes: 10,
    desc: '매일 10단어 어휘력 차곡차곡 쌓기',
  },
  // 16. 계단 이용 (운동)
  {
    id: 'h-fit-stairs',
    title: '엘리베이터 대신 계단 오르기',
    emoji: '🪜',
    category: '운동',
    categoryId: 'fitness',
    timeOfDay: 'anytime',
    tag: '생활 운동',
    xp: 35,
    durationMinutes: 5,
    desc: '하체 근력과 심폐지구력 자연 강화',
  },
  // 17. 머리 비우기 (자기계발)
  {
    id: 'h-mind-meditation',
    title: '5분 마인드풀니스 호흡 명상',
    emoji: '🫁',
    category: '자기계발',
    categoryId: 'mind',
    timeOfDay: 'morning',
    tag: '머리 비우기',
    xp: 30,
    durationMinutes: 5,
    desc: '들숨과 날숨에 오롯이 집중하며 릴렉스',
  },
  // 18. 주방 정돈 (생활)
  {
    id: 'h-life-dishes',
    title: '식사 직후 설거지 & 싱크대 정리',
    emoji: '🍽️',
    category: '생활',
    categoryId: 'life',
    timeOfDay: 'afternoon',
    tag: '주방 정돈',
    xp: 30,
    durationMinutes: 10,
    desc: '미루지 않고 식사 후 바로 깨끗하게',
  },
  // 19. 코어 단련 (운동)
  {
    id: 'h-fit-plank',
    title: '코어 단련 플랭크 1분 버티기',
    emoji: '⏱️',
    category: '운동',
    categoryId: 'fitness',
    timeOfDay: 'night',
    tag: '코어 운동',
    xp: 35,
    durationMinutes: 3,
    desc: '복부와 허리 중심부 코어 근육 강화',
  },
  // 20. 간헐적 단식 (다이어트)
  {
    id: 'h-diet-fasting',
    title: '16:8 간헐적 단식 공복 지키기',
    emoji: '⏳',
    category: '다이어트',
    categoryId: 'health',
    timeOfDay: 'morning',
    tag: '공복 유지',
    xp: 45,
    durationMinutes: 10,
    desc: '16시간 공복으로 인슐린 안정화',
  },
  // 21. 온라인 강의 (공부)
  {
    id: 'h-study-lecture',
    title: '온라인 강의 1편 완강하기',
    emoji: '💻',
    category: '공부',
    categoryId: 'study',
    timeOfDay: 'night',
    tag: '강의 수강',
    xp: 45,
    durationMinutes: 30,
    desc: '미루지 않고 계획한 강좌 1강 시청',
  },
  // 22. 디지털 디톡스 (생활)
  {
    id: 'h-life-phone-off',
    title: '밤 11시 전 스마트폰 내려놓기',
    emoji: '📵',
    category: '생활',
    categoryId: 'life',
    timeOfDay: 'night',
    tag: '숙면 디톡스',
    xp: 40,
    durationMinutes: 30,
    desc: '눈과 뇌의 피로를 낮추고 깊은 수면 준비',
  },
  // 23. 아이디어 포착 (자기계발)
  {
    id: 'h-mind-idea-memo',
    title: '반짝이는 영감과 아이디어 메모',
    emoji: '🧠',
    category: '자기계발',
    categoryId: 'growth',
    timeOfDay: 'anytime',
    tag: '창의 기록',
    xp: 30,
    durationMinutes: 3,
    desc: '떠오른 직관이나 생각을 즉시 적어두기',
  },
  // 24. 야식 방지 (다이어트)
  {
    id: 'h-diet-no-snack',
    title: '저녁 8시 이후 야식과 간식 참기',
    emoji: '🚫',
    category: '다이어트',
    categoryId: 'health',
    timeOfDay: 'night',
    tag: '야식 금지',
    xp: 45,
    durationMinutes: 10,
    desc: '소화기관을 쉬게 하여 개운한 아침 맞이',
  },
  // 25. 스피킹 연습 (공부)
  {
    id: 'h-study-shadowing',
    title: '15분 외국어 말하기 쉐도잉',
    emoji: '🗣️',
    category: '공부',
    categoryId: 'study',
    timeOfDay: 'afternoon',
    tag: '스피킹',
    xp: 40,
    durationMinutes: 15,
    desc: '원어민 발음 듣고 바로 따라 말하기',
  },
  // 26. 힐링 티타임 (마음)
  {
    id: 'h-life-warm-tea',
    title: '따뜻한 차 한 잔 마시며 하루 정리',
    emoji: '🍵',
    category: '마음',
    categoryId: 'mind',
    timeOfDay: 'night',
    tag: '마음 이완',
    xp: 30,
    durationMinutes: 10,
    desc: '캐모마일이나 보리차로 몸 따뜻하게 데우기',
  },
  // 27. 자외선 차단 (생활)
  {
    id: 'h-life-sunscreen',
    title: '외출 전 잊지 않고 선크림 바르기',
    emoji: '🧴',
    category: '생활',
    categoryId: 'life',
    timeOfDay: 'morning',
    tag: '피부 건강',
    xp: 25,
    durationMinutes: 2,
    desc: '사계절 자외선으로부터 피부 건강 보호',
  },
  // 28. 수분 2L (다이어트)
  {
    id: 'h-diet-water-2l',
    title: '하루 순수 물 2L 채워 마시기',
    emoji: '💧',
    category: '다이어트',
    categoryId: 'health',
    timeOfDay: 'anytime',
    tag: '수분 충전',
    xp: 35,
    durationMinutes: 5,
    desc: '체내 노폐물 배출과 신진대사 촉진',
  },
  // 29. 3줄 요약 (공부)
  {
    id: 'h-study-summary',
    title: '오늘 배운 내용 나만의 3줄 요약',
    emoji: '💡',
    category: '공부',
    categoryId: 'study',
    timeOfDay: 'night',
    tag: '개념 정리',
    xp: 35,
    durationMinutes: 5,
    desc: '핵심 포인트를 내 언어로 재정리',
  },
  // 30. 폼롤러 마사지 (운동)
  {
    id: 'h-fit-foam-roller',
    title: '운동 후 폼롤러 근육 이완 마사지',
    emoji: '🪵',
    category: '운동',
    categoryId: 'fitness',
    timeOfDay: 'night',
    tag: '피로 이완',
    xp: 35,
    durationMinutes: 10,
    desc: '뭉친 다리와 등 근육 릴렉스',
  },
  // 31. 하루 회고 (자기계발)
  {
    id: 'h-mind-one-line',
    title: '잠들기 전 오늘 하루 1줄 회고',
    emoji: '✏️',
    category: '자기계발',
    categoryId: 'growth',
    timeOfDay: 'night',
    tag: '성장 기록',
    xp: 35,
    durationMinutes: 5,
    desc: '오늘을 돌아보며 내일의 나 응원하기',
  },
  // 32. 수면 다리풀기 (운동)
  {
    id: 'h-fit-bed-stretch',
    title: '잠들기 전 누워서 다리 스트레칭',
    emoji: '🛏️',
    category: '운동',
    categoryId: 'fitness',
    timeOfDay: 'night',
    tag: '숙면 스트레칭',
    xp: 30,
    durationMinutes: 5,
    desc: '하체 부종 빼고 편안하게 잠들기',
  },
];

const THEME_HABIT_LOCALES: Record<string, { enTitle: string; enTag: string; jaTitle: string; jaTag: string }> = {
  'h-diet-probiotics': { enTitle: 'Probiotics & Warm Water', enTag: 'Fasting Routine', jaTitle: '空腹時の乳酸菌＆白湯', jaTag: '朝の習慣' },
  'h-mind-economy-news': { enTitle: '10m Economy & Daily News', enTag: 'Broader Horizon', jaTitle: '10分間の経済・ニュース閲覧', jaTag: '視野拡大' },
  'h-life-bed-tidy': { enTitle: 'Make the Bed in the Morning', enTag: 'Small Win', jaTitle: '起きてすぐのベッドメイキング', jaTag: '小さな成功' },
  'h-study-pomodoro': { enTitle: '25m Pomodoro Study Session', enTag: 'Deep Focus', jaTitle: '25分ポモドーロ集中学習', jaTag: '集中力' },
  'h-fit-morning-stretch': { enTitle: '10m Morning Full Body Stretch', enTag: 'Body Wakeup', jaTitle: '朝の10分全身ストレッチ', jaTag: '覚醒ストレッチ' },
  'h-mind-gratitude': { enTitle: 'Write 3 Things Grateful For', enTag: 'Gratitude Diary', jaTitle: '感謝の言葉を3つ書く', jaTag: '感謝日記' },
  'h-fit-steps-8k': { enTitle: 'Walk 8,000 Energetic Steps', enTag: 'Cardio Boost', jaTitle: '1日8,000歩ウォーキング', jaTag: '有酸素' },
  'h-diet-sugar': { enTitle: 'Cut Sugar & Drink Zero Soda', enTag: 'Sugar Cut', jaTitle: '糖質オフ＆ゼロ飲料にする', jaTag: '糖質カット' },
  'h-study-reading-15p': { enTitle: 'Read 15 Pages & Highlight', enTag: 'Reading Habit', jaTitle: '本を15ページ読む', jaTag: '読書習慣' },
  'h-life-vitamins': { enTitle: 'Take Daily Vitamins & Nutrients', enTag: 'Energy Boost', jaTitle: '必須サプリ＆ビタミン補給', jaTag: '活力チャージ' },
  'h-life-ventilation': { enTitle: '10m Room Cross-Ventilation', enTag: 'Fresh Air', jaTitle: '朝10分間の換気', jaTag: '空気清浄' },
  'h-mind-affirmation': { enTitle: '3 Daily Positive Affirmations', enTag: 'Mindset', jaTitle: '3つのポジティブ宣言', jaTag: 'マインドセット' },
  'h-fit-running': { enTitle: '25m Refreshing Evening Run', enTag: 'Running', jaTitle: '夕方の爽快ランニング25分', jaTag: 'ランニング' },
  'h-diet-protein': { enTitle: 'High-Protein Salad for Lunch', enTag: 'Diet Meal', jaTitle: '昼の高タンパクサラダ食', jaTag: '食事管理' },
  'h-study-vocab-10': { enTitle: 'Memorize 10 Essential Words', enTag: 'Language', jaTitle: '外国語の重要単語10個暗記', jaTag: '語学学習' },
  'h-fit-stairs': { enTitle: 'Take the Stairs over Elevator', enTag: 'Daily Fitness', jaTitle: '階段を使って上がる', jaTag: '生活運動' },
  'h-mind-meditation': { enTitle: '5m Mindfulness Breathing', enTag: 'Mind Clear', jaTitle: '5分間のマインドフルネス瞑想', jaTag: 'リフレッシュ' },
  'h-life-dishes': { enTitle: 'Do Dishes Right After Meal', enTag: 'Kitchen Care', jaTitle: '食後すぐの食器洗い＆片付け', jaTag: 'キッチン掃除' },
  'h-fit-plank': { enTitle: 'Hold 1-Min Core Plank', enTag: 'Core Workout', jaTitle: '体幹強化プランク1分', jaTag: '体幹トレ' },
  'h-diet-fasting': { enTitle: '16:8 Intermittent Fasting Goal', enTag: 'Fasting', jaTitle: '16:8断食タイムキープ', jaTag: 'ファスティング' },
  'h-study-lecture': { enTitle: 'Complete 1 Online Video Class', enTag: 'Class Goal', jaTitle: 'オンライン講座1本完走', jaTag: '受講完了' },
  'h-life-phone-off': { enTitle: 'Screen-off Before 11 PM', enTag: 'Digital Detox', jaTitle: '夜11時前にスマホを置く', jaTag: 'デジタルデトックス' },
  'h-mind-idea-memo': { enTitle: 'Note Down Creative Sparks', enTag: 'Ideas', jaTitle: 'ひらめき＆アイデアメモ', jaTag: '発想記録' },
  'h-diet-no-snack': { enTitle: 'No Midnight Snacks After 8 PM', enTag: 'No Late Night Snack', jaTitle: '夜8時以降の間食を控える', jaTag: '夜食禁止' },
  'h-study-shadowing': { enTitle: '15m Language Shadowing', enTag: 'Speaking', jaTitle: '15分スピーキングシャドーイング', jaTag: '発音練習' },
  'h-life-warm-tea': { enTitle: 'Drink Warm Tea at Night', enTag: 'Calm Night', jaTitle: '温かいお茶で1日を終える', jaTag: '心のリラックス' },
  'h-life-sunscreen': { enTitle: 'Apply Daily Sunscreen', enTag: 'Skin Care', jaTitle: '外出前の日焼け止め', jaTag: 'UVケア' },
  'h-diet-water-2l': { enTitle: 'Drink 2 Liters of Pure Water', enTag: 'Hydration', jaTitle: '1日2Lの水分補給', jaTag: '水分チャージ' },
  'h-study-summary': { enTitle: '3-Line Summary of Daily Study', enTag: 'Review', jaTitle: '学んだ内容の3行まとめ', jaTag: '要約復習' },
  'h-fit-foam-roller': { enTitle: 'Post-Workout Foam Rolling', enTag: 'Muscle Relax', jaTitle: 'フォームローラーマッサージ', jaTag: '筋膜リリース' },
  'h-mind-one-line': { enTitle: 'Daily 1-Line Self Reflection', enTag: 'Growth', jaTitle: '就寝前の1行ふりかえり', jaTag: '成長の記録' },
  'h-fit-bed-stretch': { enTitle: 'Bedtime Leg Stretching', enTag: 'Sleep Prep', jaTitle: '寝る前の足ストレッチ', jaTag: '快眠ストレッチ' },
};

const POPULAR_TODO_LOCALES: Record<string, { en: string; ja: string }> = {
  'todo-supplement': { en: 'Take Supplements', ja: 'サプリメントを飲む' },
  'todo-closet': { en: 'Organize Closet', ja: 'クローゼット整理' },
  'todo-hair': { en: 'Hair Salon Booking', ja: '美容室の予約' },
  'todo-plan': { en: 'Plan My Day', ja: '今日の計画を立てる' },
  'todo-walk': { en: 'Neighborhood Walk', ja: '近所を散歩する' },
  'todo-hospital': { en: 'Doctor Appointment', ja: '病院の予約' },
  'todo-pet': { en: 'Pet Care', ja: 'ペットのお世話' },
  'todo-water': { en: 'Drink 1 Glass Water', ja: 'お水を1杯飲む' },
  'todo-checkup': { en: 'Health Checkup', ja: '健康診断' },
  'todo-air': { en: 'Ventilate Room', ja: '部屋の換気をする' },
  'todo-stretch': { en: 'Light Stretch', ja: '軽いストレッチ' },
  'todo-laundry': { en: 'Do Laundry', ja: '洗濯をする' },
  'todo-desk': { en: 'Organize Desk', ja: 'デスクの片付け' },
  'todo-tea': { en: 'Drink Warm Tea', ja: '温かいお茶を飲む' },
  'todo-dishes': { en: 'Do Dishes', ja: '食器を洗う' },
  'todo-plant': { en: 'Water Plants', ja: '観葉植物の水やり' },
  'todo-nap': { en: '15m Power Nap', ja: '15分のお昼寝' },
  'todo-mail': { en: 'Reply to Emails', ja: 'メールの返信をする' },
  'todo-recycle': { en: 'Recycling', ja: '分別ゴミ出し' },
  'todo-bath': { en: 'Take a Warm Bath', ja: '半身浴をする' },
  'todo-grocery': { en: 'Grocery Shopping', ja: '買い物に行く' },
  'todo-finance': { en: 'Review Expenses', ja: '家計簿をつける' },
  'todo-bed': { en: 'Make the Bed', ja: 'ベッドメイキング' },
  'todo-music': { en: 'Listen to Music', ja: '音楽を聴く' },
  'todo-bathroom': { en: 'Clean Bathroom', ja: 'お風呂・トイレ掃除' },
  'todo-read': { en: 'Read 1 Article', ja: '資料を1本読む' },
  'todo-trash': { en: 'Take Out Trash', ja: 'ゴミ出しをする' },
  'todo-relax': { en: '5 Min Space Out', ja: '5分ぼーっとする' },
};

export const ExploreView: React.FC<ExploreViewProps> = ({
  userRoutines,
  categories,
  onAddRoutine,
  onOpenAddModal,
  onOpenAddWithTemplate,
}) => {
  const { t, language } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedHabitCat, setSelectedHabitCat] = useState<'all' | string>('all');
  const [selectedTodoCat, setSelectedTodoCat] = useState<'all' | string>('all');
  const [addedTodoTitles, setAddedTodoTitles] = useState<Set<string>>(new Set());
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [showAllTrackers, setShowAllTrackers] = useState(false);
  const habitSectionRef = useRef<HTMLDivElement>(null);

  // Pagination / Limit states (5 habits initially, 5 rows = 10 todos in 2-col grid)
  const [habitLimit, setHabitLimit] = useState(5);
  const [todoLimit, setTodoLimit] = useState(10);

  // Reset pagination when category tab or search query changes
  useEffect(() => {
    setHabitLimit(5);
  }, [selectedHabitCat, searchQuery]);

  useEffect(() => {
    setTodoLimit(10);
  }, [selectedTodoCat, searchQuery]);

  // Localized banners
  const banners = useMemo(() => {
    return RECOMMENDED_BANNERS.map((b) => {
      if (language === 'en') {
        const enTitles: Record<string, { title: string; btn: string }> = {
          'habit-goal': { title: 'Build habits tailored\nto my personal goal', btn: 'Create >' },
          'habit-sleep': { title: 'I want to get\na deep sleep tonight', btn: 'Sleep habits >' },
          'habit-morning': { title: 'Start the day\nwith fresh energy', btn: 'Morning habits >' },
          'habit-health': { title: 'Daily vitamins\n& health care', btn: 'Health habits >' },
        };
        const item = enTitles[b.id];
        return item ? { ...b, title: item.title, btnText: item.btn } : b;
      }
      if (language === 'ja') {
        const jaTitles: Record<string, { title: string; btn: string }> = {
          'habit-goal': { title: '目標に合わせた\n自分習慣を作りたい', btn: '自分で作成 >' },
          'habit-sleep': { title: '夜ぐっすり\n快眠したい', btn: '睡眠習慣を見る >' },
          'habit-morning': { title: '活力ある朝を\n迎えたい', btn: '朝の習慣を見る >' },
          'habit-health': { title: '毎日続ける\n健康＆サプリ', btn: '健康習慣を見る >' },
        };
        const item = jaTitles[b.id];
        return item ? { ...b, title: item.title, btnText: item.btn } : b;
      }
      return b;
    });
  }, [language]);

  // Active Daily Tracker IDs (홈 화면 & 통계 연동)
  const [activeTrackerIds, setActiveTrackerIds] = useState<string[]>(() => getActiveTrackerIds());

  useEffect(() => {
    const handleUpdate = () => setActiveTrackerIds(getActiveTrackerIds());
    window.addEventListener('morehabbit-trackers-updated', handleUpdate);
    return () => window.removeEventListener('morehabbit-trackers-updated', handleUpdate);
  }, []);

  const handleToggleTracker = (def: TrackingDefinition) => {
    const isNowActive = toggleActiveTracker(def.id);
    const item = { title: trackerTitle(def, language) };
    setActiveTrackerIds(getActiveTrackerIds());
    showToast(
      isNowActive
        ? (language === 'en'
            ? `'${item.title}' connected to Home & Stats! ✨`
            : language === 'ja'
            ? `「${item.title}」がホームと統計に連携されました！ ✨`
            : `'${item.title}'이(가) 홈 화면과 통계에 연동되었습니다! ✨`)
        : (language === 'en'
            ? `'${item.title}' removed from active trackers`
            : language === 'ja'
            ? `「${item.title}」の連携を解除しました`
            : `'${item.title}' 기록 연동이 해제되었습니다.`)
    );
  };

  // Localized category filters (다이어트, 운동, 공부, 자기계발, 생활루틴)
  const habitCategories = useMemo(() => {
    return [
      { id: 'all', label: t.explore?.categories?.all || '전체' },
      { id: 'health', label: language === 'en' ? 'Health & Diet' : language === 'ja' ? '健康＆ダイエット' : '건강 & 다이어트' },
      { id: 'fitness', label: language === 'en' ? 'Workout' : language === 'ja' ? '運動＆フィットネス' : '운동 & 피트니스' },
      { id: 'study', label: language === 'en' ? 'Study & Reading' : language === 'ja' ? '勉強＆読書' : '공부 & 독서' },
      { id: 'growth', label: language === 'en' ? 'Self-Growth' : language === 'ja' ? '自己啓発＆マインド' : '자기계발 & 마인드' },
      { id: 'life', label: language === 'en' ? 'Daily Routine' : language === 'ja' ? '生活＆ルーティン' : '생활 & 루틴' },
      { id: 'mind', label: language === 'en' ? 'Mind & Healing' : language === 'ja' ? '心＆癒し' : '마음 & 힐링' },
    ];
  }, [language, t]);

  const todoCategories = useMemo(() => {
    return [
      { id: 'all', label: language === 'en' ? 'All' : language === 'ja' ? 'すべて' : '전체' },
      { id: 'life', label: language === 'en' ? 'Daily' : language === 'ja' ? '生活' : '생활' },
      { id: 'selfcare', label: language === 'en' ? 'Self-care' : language === 'ja' ? 'セルフケア' : '셀프케어' },
      { id: 'rest', label: language === 'en' ? 'Rest' : language === 'ja' ? '休息' : '휴식' },
      { id: 'study', label: language === 'en' ? 'Study/Work' : language === 'ja' ? '勉強/仕事' : '공부/업무' },
    ];
  }, [language]);

  // Friendly bottom toast notification
  const showToast = (message: string) => {
    setToastMsg(message);
    setTimeout(() => {
      setToastMsg((prev) => (prev === message ? null : prev));
    }, 2400);
  };

  const getThemeHabitTitle = (item: RoutineTemplate) => {
    if (language === 'en') return THEME_HABIT_LOCALES[item.id]?.enTitle || item.title;
    if (language === 'ja') return THEME_HABIT_LOCALES[item.id]?.jaTitle || item.title;
    return item.title;
  };

  const getThemeHabitTag = (item: RoutineTemplate) => {
    if (language === 'en') return THEME_HABIT_LOCALES[item.id]?.enTag || item.tag || item.category;
    if (language === 'ja') return THEME_HABIT_LOCALES[item.id]?.jaTag || item.tag || item.category;
    return item.tag || item.category;
  };

  const getTodoTitle = (item: (typeof POPULAR_TODOS)[0]) => {
    if (language === 'en') return POPULAR_TODO_LOCALES[item.id]?.en || item.title;
    if (language === 'ja') return POPULAR_TODO_LOCALES[item.id]?.ja || item.title;
    return item.title;
  };

  // Handle Recommendation Banner Click (Smoothly scrolls and filters to matching habits)
  const handleBannerClick = (banner: (typeof RECOMMENDED_BANNERS)[0]) => {
    if (banner.theme === 'custom') {
      onOpenAddModal();
    } else {
      setSelectedHabitCat(banner.theme);
      setSearchQuery('');
      setTimeout(() => {
        habitSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 60);

      const msg =
        banner.theme === 'mind'
          ? (language === 'en' ? 'Moved to Sleep & Healing habits 🌙' : language === 'ja' ? '睡眠・ヒーリング習慣へ移動しました 🌙' : '숙면 & 힐링 추천 습관으로 이동했습니다 🌙')
          : banner.theme === 'life'
          ? (language === 'en' ? 'Moved to Miracle Morning habits ☀️' : language === 'ja' ? 'ミラクルモーニング習慣へ移動しました ☀️' : '상쾌한 생활 & 미라클 모닝 습관으로 이동했습니다 ☀️')
          : banner.theme === 'health'
          ? (language === 'en' ? 'Moved to Health & Vitamins habits 💊' : language === 'ja' ? '健康＆サプリ習慣へ移動しました 💊' : '영양제 & 건강 추천 습관으로 이동했습니다 💊')
          : (language === 'en' ? 'Moved to recommended habits ✨' : language === 'ja' ? 'おすすめ習慣リストへ移動しました ✨' : '추천 습관 목록으로 이동했습니다 ✨');
      showToast(msg);
    }
  };

  // Check if a routine is already added by title or localized title
  const isRoutineAdded = (habit: RoutineTemplate) => {
    const loc = getThemeHabitTitle(habit);
    return userRoutines.some(
      (r) =>
        r.title.trim().toLowerCase() === habit.title.trim().toLowerCase() ||
        r.title.trim().toLowerCase() === loc.trim().toLowerCase()
    );
  };

  // Handle Quick Add Todo (Image 2)
  const handleAddTodo = (todoTitle: string) => {
    const currentMemos = getStoredMemos();
    const newMemo: IdeaMemo = {
      id: 'todo-' + Date.now(),
      title: todoTitle,
      content: language === 'en' ? 'Added from Explore recommendations.' : language === 'ja' ? 'おすすめから追加されたToDoです。' : '추천 탐색에서 추가된 할일입니다.',
      type: 'todo',
      completed: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    saveStoredMemos([newMemo, ...currentMemos]);
    setAddedTodoTitles((prev) => new Set([...prev, todoTitle]));
    showToast(
      language === 'en'
        ? `'${todoTitle}' added to today's tasks! ✨`
        : language === 'ja'
        ? `「${todoTitle}」を今日のやることに追加しました！ ✨`
        : `'${todoTitle}'이(가) 오늘의 할일에 추가되었습니다! ✨`
    );
  };

  // Handle Open Add Modal with Template (Image 3 & 4)
  const handleOpenTemplateModal = (tmpl: {
    title: string;
    emoji: string;
    categoryId?: string;
    timeOfDay?: any;
    xp?: number;
    tag?: string;
  }) => {
    const templateData: Partial<Routine> = {
      title: tmpl.title,
      emoji: tmpl.emoji,
      categoryId: tmpl.categoryId || categories[0]?.id || 'life',
      timeOfDay: tmpl.timeOfDay || 'anytime',
      repeatType: 'daily',
      xp: tmpl.xp || 40,
      tag: tmpl.tag || (language === 'en' ? 'Recommended' : language === 'ja' ? 'おすすめ' : '추천'),
      startDate: toDateKey(),
      priority: 'medium',
      isPrivate: false,
    };

    if (onOpenAddWithTemplate) {
      onOpenAddWithTemplate(templateData);
    } else {
      onAddRoutine(templateData as any);
    }
  };

  // Filter Todos
  const filteredTodos = useMemo(() => {
    return POPULAR_TODOS.filter((item) => {
      const locTitle = getTodoTitle(item);
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        searchQuery === '' ||
        item.title.toLowerCase().includes(q) ||
        locTitle.toLowerCase().includes(q);
      const matchesCat = selectedTodoCat === 'all' || item.category === selectedTodoCat;
      return matchesSearch && matchesCat;
    });
  }, [searchQuery, selectedTodoCat, language]);

  // Filter Theme Habits
  const filteredHabits = useMemo(() => {
    return THEME_HABITS.filter((item) => {
      const locTitle = getThemeHabitTitle(item);
      const locTag = getThemeHabitTag(item);
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        searchQuery === '' ||
        item.title.toLowerCase().includes(q) ||
        locTitle.toLowerCase().includes(q) ||
        (item.tag && item.tag.toLowerCase().includes(q)) ||
        locTag.toLowerCase().includes(q);
      const matchesCat =
        selectedHabitCat === 'all' ||
        (selectedHabitCat === 'health' && (item.categoryId === 'health' || item.category === '영양제' || item.category === '다이어트')) ||
        (selectedHabitCat === 'fitness' && item.categoryId === 'fitness') ||
        (selectedHabitCat === 'study' && item.categoryId === 'study') ||
        (selectedHabitCat === 'growth' && (item.categoryId === 'growth' || item.categoryId === 'study' || item.categoryId === 'mind')) ||
        (selectedHabitCat === 'life' && item.categoryId === 'life') ||
        (selectedHabitCat === 'mind' && item.categoryId === 'mind');
      return matchesSearch && matchesCat;
    });
  }, [searchQuery, selectedHabitCat, language]);

  // Displayed slices for pagination (5 habits initially, 10 todos = 5 rows)
  const displayedHabits = useMemo(() => {
    return filteredHabits.slice(0, habitLimit);
  }, [filteredHabits, habitLimit]);

  const displayedTodos = useMemo(() => {
    return filteredTodos.slice(0, todoLimit);
  }, [filteredTodos, todoLimit]);

  return (
    <div className="space-y-6 animate-fadeIn select-none pb-12">
      {/* 0. Top Header & Search Bar */}
      <div className="space-y-3 pt-1">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
              <span>{t.explore?.title || '추천'}</span>
            </h2>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              {t.explore?.subtitle || '나에게 꼭 맞는 습관과 일회성 할일을 둘러보세요'}
            </p>
          </div>
          <button
            onClick={onOpenAddModal}
            aria-label={t.explore?.customBtn || '새 습관 만들기'}
            title={t.explore?.customBtn || '새 습관 만들기'}
            className="w-9 h-9 rounded-full bg-blue-50 text-blue-700 hover:bg-blue-100 flex items-center justify-center active:scale-90 transition shadow-2xs cursor-pointer border border-blue-200/90 shrink-0"
          >
            <span className="material-symbols-outlined text-[22px] leading-none">add</span>
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative w-full">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-blue-600">
            <span className="material-symbols-outlined text-[20px]">search</span>
          </div>
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t.explore?.searchPlaceholder || '습관 또는 할일 검색 (예: 유산균, 빨래, 독서)'}
            className="w-full h-11 pl-10 pr-9 bg-white rounded-xl text-sm font-medium text-slate-900 placeholder:text-slate-400 shadow-2xs border border-slate-200/90 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">cancel</span>
            </button>
          )}
        </div>
      </div>

      {/* 1. 습관 추천 배너 */}
      <section className="space-y-2.5">
        <div className="flex items-center gap-2">
          <h3 className="text-base font-black text-slate-900 tracking-tight">
            {language === 'en' ? 'Habit Recommendations' : language === 'ja' ? '習慣のおすすめ' : '습관 추천'}
          </h3>
        </div>

        <div className="flex gap-3 overflow-x-auto pb-1 pt-0.5 scrollbar-none snap-x snap-mandatory">
          {banners.map((banner) => (
            <div
              key={banner.id}
              onClick={() => handleBannerClick(banner)}
              className={`min-w-[245px] max-w-[270px] shrink-0 rounded-2xl p-4 bg-gradient-to-r ${banner.bgGradient} text-white shadow-xs relative overflow-hidden flex flex-col justify-between cursor-pointer snap-start active:scale-98 transition-all hover:shadow-md`}
            >
              <div className="relative z-10 max-w-[155px]">
                {banner.emoji && (
                  <span className="text-lg mb-1 inline-block drop-shadow-sm leading-none">{banner.emoji}</span>
                )}
                <h4 className="text-base font-black leading-snug whitespace-pre-line text-white drop-shadow-2xs">
                  {banner.title}
                </h4>
              </div>

              <div className="relative z-10 mt-3 flex items-center">
                <span className="px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-black text-white border border-white/30 flex items-center gap-1">
                  <span>{banner.btnText}</span>
                </span>
              </div>

              {/* Official Mobit turtle character decoration (확대X, 여백 안쪽 배치로 잘림 방지) */}
              <div className="absolute right-2.5 bottom-2 w-20 h-20 flex items-end justify-end pointer-events-none z-10">
                <img
                  src={(MOBIT_IMAGES as any)[banner.characterKey] || MOBIT_IMAGES.cheer}
                  alt={language === 'en' ? 'Mobit character' : language === 'ja' ? 'モビット キャラクター' : '모빗 캐릭터'}
                  className="max-h-[74px] max-w-[74px] object-contain drop-shadow-md select-none pointer-events-none"
                  draggable={false}
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 2. 일상 기록 트래커 — 추가하면 홈 '오늘의 일상 기록'과 통계에 연동 */}
      <section className="space-y-3">
        <h3 className="text-base font-black text-slate-900 tracking-tight">
          {language === 'en' ? 'Daily Logs' : language === 'ja' ? '毎日の記録' : '일상 기록'}
        </h3>

        <div className="grid grid-cols-2 gap-2.5">
          {(showAllTrackers ? TRACKING_DEFINITIONS : TRACKING_DEFINITIONS.slice(0, 4)).map((def) => {
            const isActive = activeTrackerIds.includes(def.id);
            return (
              <button
                key={def.id}
                type="button"
                onClick={() => handleToggleTracker(def)}
                className={`p-3.5 rounded-2xl border bg-white flex items-center gap-2.5 text-left transition active:scale-98 cursor-pointer ${
                  isActive ? 'border-primary' : 'border-slate-200/80 hover:border-slate-300'
                }`}
              >
                <span className="w-9 h-9 rounded-xl bg-blue-50 text-primary flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[20px]">{def.icon}</span>
                </span>
                <span className="flex-1 min-w-0 text-sm font-bold text-slate-900 truncate">{trackerTitle(def, language)}</span>
                <span
                  className={`material-symbols-outlined text-[20px] shrink-0 ${isActive ? 'text-primary' : 'text-slate-300'}`}
                >
                  {isActive ? 'check_circle' : 'add_circle'}
                </span>
              </button>
            );
          })}
        </div>

        {TRACKING_DEFINITIONS.length > 4 && (
          <button
            type="button"
            onClick={() => setShowAllTrackers((prev) => !prev)}
            className="w-full py-2.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200/90 text-slate-700 text-sm font-bold flex items-center justify-center gap-1 transition active:scale-98 cursor-pointer"
          >
            <span>
              {showAllTrackers
                ? (language === 'en' ? 'Collapse' : language === 'ja' ? '閉じる' : '접기')
                : (language === 'en' ? 'Show More' : language === 'ja' ? 'もっと見る' : '더보기')}
            </span>
            <span className="material-symbols-outlined text-[18px] text-slate-500">
              {showAllTrackers ? 'expand_less' : 'expand_more'}
            </span>
          </button>
        )}
      </section>

      {/* 3. 테마별 습관 */}
      <section ref={habitSectionRef} className="space-y-3 pt-1 scroll-mt-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <h3 className="text-base font-black text-slate-900 tracking-tight">
              {t.explore?.themeHabits || '테마별 습관'}
            </h3>
          </div>
          <span className="text-xs text-slate-400 font-bold">{filteredHabits.length}</span>
        </div>

        {/* Category Filter Chips */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {habitCategories.map((cat) => {
            const isSelected = selectedHabitCat === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedHabitCat(cat.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer active:scale-95 ${
                  isSelected
                    ? 'bg-primary text-white shadow-xs font-black'
                    : 'bg-white text-slate-600 hover:bg-blue-50/70 border border-slate-200/80'
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* Clean, High-Legibility Habit Cards */}
        <div className="space-y-2">
          {displayedHabits.map((habit) => {
            const added = isRoutineAdded(habit);
            const localizedTitle = getThemeHabitTitle(habit);
            const localizedTag = getThemeHabitTag(habit);
            return (
              <div
                key={habit.id}
                className="p-3.5 px-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs flex items-center justify-between gap-3 hover:border-blue-300 transition-all"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10.5 h-10.5 rounded-xl bg-slate-50 border border-slate-200/70 flex items-center justify-center text-lg shrink-0 select-none">
                    {habit.emoji}
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-sm font-black text-slate-900 leading-snug truncate">
                      {localizedTitle}
                    </h4>
                    <span className="text-xs font-bold text-slate-500 mt-0.5 inline-block">
                      {localizedTag}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleOpenTemplateModal({ ...habit, title: localizedTitle, tag: localizedTag })}
                  className={`h-9 px-3.5 rounded-xl text-xs font-black flex items-center gap-1 active:scale-95 transition cursor-pointer shrink-0 ${
                    added
                      ? 'bg-blue-50 text-blue-700 border border-blue-200'
                      : 'bg-primary hover:bg-blue-700 text-white shadow-2xs'
                  }`}
                >
                  <span className="material-symbols-outlined text-[16px] font-black">
                    {added ? 'check' : 'add'}
                  </span>
                  <span>
                    {added
                      ? (language === 'en' ? 'Added' : language === 'ja' ? '登録済' : '등록됨')
                      : (language === 'en' ? 'Add' : language === 'ja' ? '追加' : '추가')}
                  </span>
                </button>
              </div>
            );
          })}
        </div>

        {/* 더보기 / 접기 버튼 (5개 제한) */}
        {filteredHabits.length > 5 && (
          <div className="pt-1">
            {habitLimit < filteredHabits.length ? (
              <button
                type="button"
                onClick={() => setHabitLimit((prev) => Math.min(prev + 5, filteredHabits.length))}
                className="w-full py-2.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200/90 text-slate-700 text-xs font-bold flex items-center justify-center gap-1.5 transition active:scale-98 shadow-2xs cursor-pointer"
              >
                <span>{language === 'en' ? 'Show More' : language === 'ja' ? 'もっと見る' : '더보기'}</span>
                <span className="text-xs text-slate-400 font-semibold">
                  (+{Math.min(5, filteredHabits.length - habitLimit)})
                </span>
                <span className="material-symbols-outlined text-[18px] text-slate-500">expand_more</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setHabitLimit(5)}
                className="w-full py-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-500 text-xs font-bold flex items-center justify-center gap-1 transition active:scale-98 cursor-pointer"
              >
                <span>{language === 'en' ? 'Collapse' : language === 'ja' ? '閉じる' : '접기'}</span>
                <span className="material-symbols-outlined text-[18px]">expand_less</span>
              </button>
            )}
          </div>
        )}
      </section>

      {/* 4. 인기 할일 */}
      <section className="space-y-3 pt-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <h3 className="text-base font-black text-slate-900 tracking-tight">
              {t.explore?.popularTasks || '인기 할일'}
            </h3>
          </div>
          <span className="text-xs text-slate-400 font-bold">
            {language === 'en' ? 'Today' : language === 'ja' ? '今日の実践' : '오늘 실천'}
          </span>
        </div>

        {/* Info Callout Box */}
        <div className="px-3.5 py-2.5 rounded-xl bg-slate-100/80 border border-slate-200/80 text-xs text-slate-600 font-medium">
          {t.explore?.taskNotice || '‘할일’은 오늘만 실천하는 일회성 메모 및 태스크예요'}
        </div>

        {/* Category Filter Tabs */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {todoCategories.map((cat) => {
            const isSelected = selectedTodoCat === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedTodoCat(cat.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer active:scale-95 ${
                  isSelected
                    ? 'bg-slate-800 text-white shadow-xs font-black'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80'
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* 2-Column Pill Grid */}
        <div className="grid grid-cols-2 gap-2">
          {displayedTodos.map((todo) => {
            const localizedTitle = getTodoTitle(todo);
            const isAdded = addedTodoTitles.has(todo.title) || addedTodoTitles.has(localizedTitle);
            return (
              <div
                key={todo.id}
                className="h-12 px-3 rounded-2xl bg-white border border-slate-200/90 shadow-2xs flex items-center justify-between gap-1.5 hover:border-blue-300 transition-all"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="px-1.5 py-0.5 rounded-md bg-blue-50 text-blue-700 text-xs font-black shrink-0 border border-blue-100">
                    {t.explore?.taskBadge || '할일'}
                  </span>
                  <span className="text-xs font-extrabold text-slate-900 truncate">
                    {localizedTitle}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => handleAddTodo(localizedTitle)}
                  className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 active:scale-90 transition-all cursor-pointer ${
                    isAdded
                      ? 'bg-emerald-500 text-white shadow-xs'
                      : 'bg-slate-900 hover:bg-primary text-white'
                  }`}
                  title="Add"
                >
                  <span className="material-symbols-outlined text-[16px] font-black">
                    {isAdded ? 'check' : 'add'}
                  </span>
                </button>
              </div>
            );
          })}
        </div>

        {/* 더보기 / 접기 버튼 (5줄 = 10개 기준) */}
        {filteredTodos.length > 10 && (
          <div className="pt-1">
            {todoLimit < filteredTodos.length ? (
              <button
                type="button"
                onClick={() => setTodoLimit((prev) => Math.min(prev + 10, filteredTodos.length))}
                className="w-full py-2.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200/90 text-slate-700 text-xs font-bold flex items-center justify-center gap-1.5 transition active:scale-98 shadow-2xs cursor-pointer"
              >
                <span>{language === 'en' ? 'Show More' : language === 'ja' ? 'もっと見る' : '더보기'}</span>
                <span className="text-xs text-slate-400 font-semibold">
                  (+{Math.min(10, filteredTodos.length - todoLimit)})
                </span>
                <span className="material-symbols-outlined text-[18px] text-slate-500">expand_more</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setTodoLimit(10)}
                className="w-full py-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-500 text-xs font-bold flex items-center justify-center gap-1 transition active:scale-98 cursor-pointer"
              >
                <span>{language === 'en' ? 'Collapse' : language === 'ja' ? '閉じる' : '접기'}</span>
                <span className="material-symbols-outlined text-[18px]">expand_less</span>
              </button>
            )}
          </div>
        )}
      </section>

      {/* 5. Custom Habit Creator Button at Bottom */}
      <div className="pt-2">
        <button
          onClick={onOpenAddModal}
          className="w-full py-3.5 rounded-2xl bg-slate-50 hover:bg-blue-50/60 border border-dashed border-slate-300 hover:border-blue-400 text-slate-700 text-sm font-black flex items-center justify-center gap-2 active:scale-98 transition cursor-pointer"
        >
          <span className="material-symbols-outlined text-[20px] text-primary">add_circle</span>
          <span>{t.explore?.customHabitBtn || '원하는 습관이 없나요? 직접 만들기'}</span>
        </button>
      </div>

      {/* Floating Bottom Toast Notification */}
      {toastMsg && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-full bg-slate-900/90 backdrop-blur-md text-white text-xs font-black shadow-xl animate-in fade-in slide-in-from-bottom-3 duration-200 pointer-events-none whitespace-nowrap">
          {toastMsg}
        </div>
      )}
    </div>
  );
};
