import React, { useState, useMemo } from 'react';
import { MobitCharacter } from '../character/MobitCharacter';
import { useLanguage } from '../../utils/i18n';
import type { Routine, UserProfile, TimeOfDay } from '../../types/routine';
import { toDateKey } from '../../utils/dateUtils';

interface OnboardingModalProps {
  isOpen: boolean;
  initialName?: string;
  onComplete: (
    userName: string,
    initialRoutines?: Routine[],
    surveyProfile?: Partial<UserProfile>
  ) => void;
}

// Mock registered / reserved usernames for duplicate check
const RESERVED_NAMES = [
  '관리자',
  'admin',
  'administrator',
  '모어해빗',
  'morehabbit',
  '운영자',
  '모빗이',
  'SJ',
  'master',
];

const STORAGE_REGISTERED_NAMES_KEY = 'morehabbit_registered_names';

// Generate unique default nickname (e.g. more5271)
const generateUniqueNickname = (reserved: Set<string>): string => {
  for (let i = 0; i < 100; i++) {
    const rand = Math.floor(1000 + Math.random() * 9000);
    const cand = `more${rand}`;
    if (!reserved.has(cand.toLowerCase())) {
      return cand;
    }
  }
  return `more${Date.now().toString().slice(-4)}`;
};

interface StarterRoutineTemplate {
  id: string;
  titleKo: string;
  titleEn: string;
  titleJa: string;
  emoji: string;
  categoryId: string;
  categoryLabelKo: string;
  timeOfDay: TimeOfDay;
  timeLabelKo: string;
  tagKo: string;
  priority: 'high' | 'medium';
}

// Tailored starter routines dictionary by focus area
const STARTER_POOLS: Record<string, StarterRoutineTemplate[]> = {
  health: [
    {
      id: 'pool-water',
      titleKo: '미온수 한 잔 마시기',
      titleEn: 'Drink a glass of warm water',
      titleJa: '白湯を1杯飲む',
      emoji: '💧',
      categoryId: 'life',
      categoryLabelKo: '생활 & 건강',
      timeOfDay: 'morning',
      timeLabelKo: '아침',
      tagKo: '500ml',
      priority: 'high',
    },
    {
      id: 'pool-stretch',
      titleKo: '기상 직후 스트레칭 10분',
      titleEn: 'Morning light stretching 10m',
      titleJa: '朝の軽いストレッチ10分',
      emoji: '🧘',
      categoryId: 'health',
      categoryLabelKo: '운동 & 건강',
      timeOfDay: 'morning',
      timeLabelKo: '아침',
      tagKo: '10분',
      priority: 'medium',
    },
    {
      id: 'pool-vitamin',
      titleKo: '비타민 및 영양제 챙겨먹기',
      titleEn: 'Take vitamins & supplements',
      titleJa: 'ビタミン＆サプリを飲む',
      emoji: '💊',
      categoryId: 'health',
      categoryLabelKo: '운동 & 건강',
      timeOfDay: 'afternoon',
      timeLabelKo: '낮',
      tagKo: '영양',
      priority: 'high',
    },
    {
      id: 'pool-workout',
      titleKo: '가벼운 유산소 또는 홈트 20분',
      titleEn: 'Cardio walk or home workout 20m',
      titleJa: '軽い有酸素運動または宅トレ20分',
      emoji: '🏃',
      categoryId: 'health',
      categoryLabelKo: '운동 & 건강',
      timeOfDay: 'evening',
      timeLabelKo: '저녁',
      tagKo: '20분',
      priority: 'medium',
    },
  ],
  growth: [
    {
      id: 'pool-water',
      titleKo: '미온수 한 잔 마시기',
      titleEn: 'Drink a glass of warm water',
      titleJa: '白湯を1杯飲む',
      emoji: '💧',
      categoryId: 'life',
      categoryLabelKo: '생활 & 건강',
      timeOfDay: 'morning',
      timeLabelKo: '아침',
      tagKo: '500ml',
      priority: 'high',
    },
    {
      id: 'pool-todo',
      titleKo: '오늘 꼭 해야 할 일 3가지 작성',
      titleEn: 'Write down Top 3 tasks for today',
      titleJa: '今日やるべきこと3つをメモ',
      emoji: '📝',
      categoryId: 'growth',
      categoryLabelKo: '공부 & 성장',
      timeOfDay: 'morning',
      timeLabelKo: '아침',
      tagKo: '5분',
      priority: 'high',
    },
    {
      id: 'pool-reading',
      titleKo: '독서 20분 또는 아티클 읽기',
      titleEn: 'Read for 20m or read an article',
      titleJa: '読書20分または記事を読む',
      emoji: '📖',
      categoryId: 'growth',
      categoryLabelKo: '공부 & 성장',
      timeOfDay: 'evening',
      timeLabelKo: '저녁',
      tagKo: '20분',
      priority: 'medium',
    },
    {
      id: 'pool-note',
      titleKo: '하루 5분 오늘 배운 점 메모',
      titleEn: 'Daily 5m learning log',
      titleJa: '今日学んだことを5分メモ',
      emoji: '✍️',
      categoryId: 'growth',
      categoryLabelKo: '공부 & 성장',
      timeOfDay: 'night',
      timeLabelKo: '밤',
      tagKo: '5분',
      priority: 'medium',
    },
  ],
  life: [
    {
      id: 'pool-water',
      titleKo: '미온수 한 잔 마시기',
      titleEn: 'Drink a glass of warm water',
      titleJa: '白湯を1杯飲む',
      emoji: '💧',
      categoryId: 'life',
      categoryLabelKo: '생활 & 정돈',
      timeOfDay: 'morning',
      timeLabelKo: '아침',
      tagKo: '500ml',
      priority: 'high',
    },
    {
      id: 'pool-bed',
      titleKo: '기상 직후 침구 & 이불 정돈하기',
      titleEn: 'Make your bed after waking up',
      titleJa: '起きたらベッドメイキング',
      emoji: '🛏️',
      categoryId: 'life',
      categoryLabelKo: '생활 & 정돈',
      timeOfDay: 'morning',
      timeLabelKo: '아침',
      tagKo: '2분',
      priority: 'high',
    },
    {
      id: 'pool-tidy',
      titleKo: '저녁 10분 내 방 & 책상 정리',
      titleEn: 'Tidy up room & desk for 10m',
      titleJa: '部屋とデスクを10分片付け',
      emoji: '🧹',
      categoryId: 'life',
      categoryLabelKo: '생활 & 정돈',
      timeOfDay: 'evening',
      timeLabelKo: '저녁',
      tagKo: '10분',
      priority: 'medium',
    },
    {
      id: 'pool-sleep',
      titleKo: '밤 11시 전 스마트폰 내려놓기',
      titleEn: 'Put phone away before 11 PM',
      titleJa: '夜11時前にスマホを手放す',
      emoji: '🌙',
      categoryId: 'life',
      categoryLabelKo: '생활 & 정돈',
      timeOfDay: 'night',
      timeLabelKo: '밤',
      tagKo: '숙면',
      priority: 'high',
    },
  ],
  mind: [
    {
      id: 'pool-water',
      titleKo: '미온수 한 잔 마시기',
      titleEn: 'Drink a glass of warm water',
      titleJa: '白湯を1杯飲む',
      emoji: '💧',
      categoryId: 'life',
      categoryLabelKo: '생활 & 건강',
      timeOfDay: 'morning',
      timeLabelKo: '아침',
      tagKo: '500ml',
      priority: 'high',
    },
    {
      id: 'pool-meditation',
      titleKo: '아침 3분 깊은 심호흡 & 명상',
      titleEn: 'Morning 3m deep breathing & meditation',
      titleJa: '朝の深呼吸＆瞑想3分',
      emoji: '🌬️',
      categoryId: 'mind',
      categoryLabelKo: '마음 & 멘탈',
      timeOfDay: 'morning',
      timeLabelKo: '아침',
      tagKo: '3분',
      priority: 'high',
    },
    {
      id: 'pool-walk',
      titleKo: '맑은 공기 마시며 10분 산책',
      titleEn: '10m walk in the fresh air',
      titleJa: '澄んだ空気で10分散歩',
      emoji: '🌿',
      categoryId: 'mind',
      categoryLabelKo: '마음 & 멘탈',
      timeOfDay: 'afternoon',
      timeLabelKo: '낮',
      tagKo: '힐링',
      priority: 'medium',
    },
    {
      id: 'pool-diary',
      titleKo: '하루 5분 감사 일기 & 나 칭찬하기',
      titleEn: '5m gratitude & self-praise diary',
      titleJa: '1日5分の感謝日記＆自分褒め',
      emoji: '✨',
      categoryId: 'mind',
      categoryLabelKo: '마음 & 멘탈',
      timeOfDay: 'night',
      timeLabelKo: '밤',
      tagKo: '감사',
      priority: 'medium',
    },
  ],
};

export const OnboardingModal: React.FC<OnboardingModalProps> = ({
  isOpen,
  initialName = '',
  onComplete,
}) => {
  const { language, t } = useLanguage();

  // Multi-step state: 1 (Nickname) -> 2 (Survey) -> 3 (Curated Routines)
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Load existing names from localStorage
  const existingNames = useMemo(() => {
    try {
      const raw = localStorage.getItem(STORAGE_REGISTERED_NAMES_KEY);
      const list: string[] = raw ? JSON.parse(raw) : [];
      return new Set([...RESERVED_NAMES.map((n) => n.toLowerCase()), ...list.map((n) => n.toLowerCase())]);
    } catch {
      return new Set(RESERVED_NAMES.map((n) => n.toLowerCase()));
    }
  }, []);

  // Pre-fill a unique nickname (e.g. more5271)
  const defaultCandidate = useMemo(() => {
    if (initialName && initialName.trim()) return initialName.trim();
    return generateUniqueNickname(existingNames);
  }, [initialName, existingNames]);

  const [nickname, setNickname] = useState(defaultCandidate);
  const [isAutoDefault, setIsAutoDefault] = useState(true);
  const [checkStatus, setCheckStatus] = useState<'idle' | 'available' | 'duplicate' | 'too_short' | 'too_long' | 'invalid'>('available');

  // Survey responses (User Request 4: 나이대, 성별, 원하는 루틴 수, 목표 영역, 실천 시간대, 계정 연동 여부)
  const [ageGroup, setAgeGroup] = useState<string>('20-30');
  const [gender, setGender] = useState<string>('female');
  const [routineCountGoal, setRoutineCountGoal] = useState<string>('3-4');
  const [focusArea, setFocusArea] = useState<string>('health');
  const [focusTimeOfDay, setFocusTimeOfDay] = useState<string>('morning');
  const [accountType, setAccountType] = useState<'guest' | 'linked'>('guest');

  // Selected routine template IDs for step 3
  const [selectedTemplateIds, setSelectedTemplateIds] = useState<Set<string>>(new Set());

  // Real-time validation helper
  const validateNickname = (name: string): 'idle' | 'available' | 'duplicate' | 'too_short' | 'too_long' | 'invalid' => {
    const trimmed = name.trim();
    if (!trimmed) return 'idle';
    if (trimmed.length < 2) return 'too_short';
    if (trimmed.length > 10) return 'too_long';
    if (!/^[a-zA-Z0-9가-힣ㄱ-ㅎㅏ-ㅣ]+$/.test(trimmed)) return 'invalid';
    if (existingNames.has(trimmed.toLowerCase())) return 'duplicate';
    return 'available';
  };

  if (!isOpen) return null;

  // Clear when mouse enters or on focus so user can immediately type
  const handleClearAutoDefault = () => {
    if (isAutoDefault) {
      setNickname('');
      setIsAutoDefault(false);
      setCheckStatus('idle');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setIsAutoDefault(false);
    setNickname(value);
    const status = validateNickname(value);
    setCheckStatus(status);
  };

  const handleCheckDuplicate = () => {
    const status = validateNickname(nickname);
    setCheckStatus(status);
  };

  // Step 1 -> Step 2 transition
  const handleGoToStep2 = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const finalName = nickname.trim();
    const status = validateNickname(finalName);
    if (status !== 'available') {
      setCheckStatus(status);
      return;
    }
    setStep(2);
  };

  // Step 2 -> Step 3 transition (Prepare recommended habits)
  const handleGoToStep3 = () => {
    const pool = STARTER_POOLS[focusArea] || STARTER_POOLS.health;
    // Determine how many to pre-check based on routineCountGoal
    let targetCount = 3;
    if (routineCountGoal === '1-2') targetCount = 2;
    else if (routineCountGoal === '5+') targetCount = pool.length;

    const initialChecked = new Set(pool.slice(0, targetCount).map((item) => item.id));
    setSelectedTemplateIds(initialChecked);
    setStep(3);
  };

  // Toggle routine selection in Step 3
  const handleToggleRoutine = (templateId: string) => {
    setSelectedTemplateIds((prev) => {
      const next = new Set(prev);
      if (next.has(templateId)) {
        if (next.size > 1) {
          next.delete(templateId);
        }
      } else {
        next.add(templateId);
      }
      return next;
    });
  };

  // Step 3 -> Final Completion
  const handleFinishOnboarding = () => {
    const finalName = nickname.trim();

    // Persist registered nickname to avoid future collision
    try {
      const raw = localStorage.getItem(STORAGE_REGISTERED_NAMES_KEY);
      const list: string[] = raw ? JSON.parse(raw) : [];
      if (!list.includes(finalName)) {
        list.push(finalName);
        localStorage.setItem(STORAGE_REGISTERED_NAMES_KEY, JSON.stringify(list));
      }
    } catch {}

    // Build actual Routine objects from selected templates
    const pool = STARTER_POOLS[focusArea] || STARTER_POOLS.health;
    const chosenTemplates = pool.filter((item) => selectedTemplateIds.has(item.id));
    const nowIso = new Date().toISOString();
    const todayDateStr = toDateKey(new Date());

    const initialRoutines: Routine[] = chosenTemplates.map((item, idx) => ({
      id: `rt-init-${Date.now()}-${idx}`,
      title: language === 'en' ? item.titleEn : language === 'ja' ? item.titleJa : item.titleKo,
      emoji: item.emoji,
      categoryId: item.categoryId,
      timeOfDay: item.timeOfDay,
      reminderTime:
        item.timeOfDay === 'morning'
          ? '07:30'
          : item.timeOfDay === 'afternoon'
          ? '13:00'
          : item.timeOfDay === 'evening'
          ? '20:00'
          : '22:30',
      repeatType: 'daily',
      startDate: todayDateStr,
      createdAt: nowIso,
      priority: item.priority,
      isPrivate: false,
      order: idx + 1,
      xp: 40,
      tag: item.tagKo,
    }));

    const surveyProfile: Partial<UserProfile> = {
      ageGroup,
      gender,
      routineCountGoal,
      focusArea,
      focusTimeOfDay,
      accountType,
    };

    onComplete(finalName, initialRoutines, surveyProfile);
  };

  const isStep1Valid = checkStatus === 'available';

  return (
    <div
      className="fixed inset-0 z-[100] w-screen h-[100dvh] bg-white select-none animate-fadeIn flex flex-col justify-between overflow-y-auto"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-sm sm:max-w-md min-h-full flex flex-col justify-between p-5 sm:p-7 mx-auto relative z-20">
        
        {/* ========================================================================= */}
        {/* STEP 1: 닉네임 설정 (모바일 기종 관계없이 모니터 세로 기준 가운데에 위치) */}
        {/* ========================================================================= */}
        {step === 1 && (
          <div className="my-auto flex flex-col items-center text-center w-full py-4 shrink-0 animate-fadeIn">
            {/* Top Mascot (Image 3: Joyful welcoming turtle) */}
            <div className="w-20 h-20 rounded-3xl bg-blue-50/90 border border-blue-100 flex items-center justify-center mb-5 shadow-xs shrink-0">
              <MobitCharacter mood="joy" className="w-16 h-16 object-contain" />
            </div>

            {/* Title: '반가워요!' (거북이, 하트 이모티콘 제거) */}
            <h1 className="text-xl sm:text-xl font-black text-slate-900 tracking-tight leading-[1.3] text-center break-keep">
              {language === 'en' ? 'Welcome!' : language === 'ja' ? 'はじめまして！' : '반가워요!'}
              <br />
              <span className="text-[#1d4ed8]">
                {language === 'en' ? 'What should we call you?' : language === 'ja' ? '何とお呼びしましょうか？' : '어떤 이름으로 불러드릴까요?'}
              </span>
            </h1>

            {/* Input Area */}
            <div className="w-full mt-7 text-left">
              <label className="block text-sm font-bold text-slate-700 mb-2">
                {language === 'en' ? 'Nickname to use' : language === 'ja' ? '使用するニックネーム' : '사용할 닉네임'}
              </label>

              <div className="relative flex items-center gap-2 w-full min-w-0">
                <input
                  type="text"
                  value={nickname}
                  onChange={handleInputChange}
                  onMouseEnter={handleClearAutoDefault}
                  onFocus={handleClearAutoDefault}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      if (isStep1Valid) handleGoToStep2();
                      else handleCheckDuplicate();
                    }
                  }}
                  placeholder={language === 'en' ? 'e.g. more5271' : language === 'ja' ? '例: more5271' : '예: more5271'}
                  maxLength={10}
                  className={`flex-1 min-w-0 h-14 pl-4 pr-3 bg-slate-50 border rounded-2xl text-base font-bold text-slate-900 placeholder:text-slate-400 focus:outline-none transition-all ${
                    checkStatus === 'available'
                      ? 'border-emerald-500 focus:ring-2 focus:ring-emerald-100'
                      : checkStatus === 'duplicate'
                      ? 'border-rose-500 focus:ring-2 focus:ring-rose-100'
                      : 'border-slate-200 focus:border-blue-600 focus:ring-2 focus:ring-blue-100'
                  }`}
                />

                <button
                  type="button"
                  onClick={handleCheckDuplicate}
                  className="h-14 px-4.5 rounded-2xl bg-slate-900 hover:bg-blue-700 text-white font-extrabold text-xs shrink-0 active:scale-95 transition shadow-xs cursor-pointer whitespace-nowrap"
                >
                  {language === 'en' ? 'Check' : language === 'ja' ? '重複確認' : '중복 확인'}
                </button>
              </div>

              {/* Validation Feedback Message */}
              <div className="min-h-[24px] mt-2.5 px-1">
                {checkStatus === 'available' && (
                  <p className="text-xs font-bold text-emerald-600 flex items-center gap-1.5 animate-fadeIn">
                    <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-black">✓</span>
                    <span>{t.onboarding?.available || '✨ 사용 가능한 멋진 닉네임이에요!'}</span>
                  </p>
                )}

                {checkStatus === 'duplicate' && (
                  <p className="text-xs font-bold text-rose-500 flex items-center gap-1.5 animate-fadeIn">
                    <span className="w-4 h-4 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center text-xs font-black">✕</span>
                    <span>{t.onboarding?.duplicate || '❌ 이미 사용 중인 닉네임입니다. 다른 이름을 입력해 주세요.'}</span>
                  </p>
                )}

                {checkStatus === 'too_short' && (
                  <p className="text-xs font-medium text-amber-600 animate-fadeIn">
                    {t.onboarding?.tooShort || '2자 이상 입력해 주세요.'}
                  </p>
                )}

                {checkStatus === 'too_long' && (
                  <p className="text-xs font-medium text-amber-600 animate-fadeIn">
                    {t.onboarding?.tooLong || '10자 이하로 입력해 주세요.'}
                  </p>
                )}

                {checkStatus === 'invalid' && (
                  <p className="text-xs font-medium text-rose-500 animate-fadeIn">
                    {t.onboarding?.invalidChars || '한글, 영문, 숫자만 사용 가능합니다.'}
                  </p>
                )}

                {checkStatus === 'idle' && (
                  <p className="text-xs text-slate-400 font-medium">
                    {t.onboarding?.ruleHint || '한글, 영문, 숫자 2~10자'}
                  </p>
                )}
              </div>
            </div>

            {/* Bottom Action Area (Card와 일체형으로 바로 아래 배치) */}
            <div className="w-full mt-6 flex flex-col items-center">
              <button
                type="button"
                onClick={handleGoToStep2}
                disabled={!isStep1Valid}
                className={`w-full h-14 rounded-2xl font-black text-base transition-all flex items-center justify-center gap-2 ${
                  isStep1Valid
                    ? 'bg-primary hover:bg-blue-700 text-white shadow-lg shadow-blue-500/25 active:scale-98 cursor-pointer'
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                }`}
              >
                <span>{language === 'en' ? 'Next (Create My Routine) →' : language === 'ja' ? '次へ (カスタム習慣の作成) →' : '다음 단계로 (맞춤 루틴 만들기) →'}</span>
              </button>

              <p className="text-xs text-slate-400 font-medium mt-3 text-center">
                {language === 'en' ? 'You can always change your nickname in My Page' : language === 'ja' ? 'ニックネームはいつでも[マイページ]で変更できます' : '닉네임은 언제든지 [내 정보]에서 변경할 수 있어요'}
              </p>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STEP 2: 맞춤 루틴 설문 (개인정보 보호 방침 준수 + 5가지 핵심 질문) */}
        {/* ========================================================================= */}
        {step === 2 && (
          <div className="flex flex-col w-full py-2 animate-fadeIn">
            {/* Top Navigation Bar */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="flex items-center gap-1 text-xs font-bold text-slate-600 hover:text-slate-900 transition cursor-pointer px-1 py-1"
              >
                <span>←</span>
                <span>{language === 'en' ? 'Back' : language === 'ja' ? '戻る' : '닉네임 수정'}</span>
              </button>
              <span className="text-xs font-black tracking-wider uppercase text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full">
                Step 2 / 3
              </span>
            </div>

            {/* Header with Thinking Mascot */}
            <div className="flex items-center gap-3.5 mt-4 mb-4">
              <div className="w-14 h-14 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0">
                <MobitCharacter mood="thinking" className="w-11 h-11 object-contain" />
              </div>
              <div className="text-left">
                <h2 className="text-lg sm:text-lg font-extrabold text-slate-900 tracking-tight leading-snug">
                  {nickname}님의 맞춤 습관 찾기
                </h2>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  나에게 딱 맞는 첫 루틴 생성을 위해 몇 가지만 알려주세요!
                </p>
              </div>
            </div>

            {/* Privacy Compliance Banner (User Request 4: 개인정보 보호 방침안에 기본만 물어봐) */}
            <div className="bg-emerald-50/80 border border-emerald-200/80 rounded-2xl p-3 text-left mb-5">
              <div className="flex items-start gap-2">
                <span className="text-sm">🔒</span>
                <div>
                  <p className="text-xs font-bold text-emerald-900">
                    모어해빗 개인정보 보호 원칙
                  </p>
                  <p className="text-xs text-emerald-700/90 leading-relaxed mt-0.5">
                    입력하신 정보는 기기(로컬 브라우저)에만 안전하게 보관되며, 사용자 맞춤 첫 루틴 추천 이외의 목적으로는 수집·외부 전송되지 않습니다.
                  </p>
                </div>
              </div>
            </div>

            {/* Question List */}
            <div className="flex flex-col gap-5 text-left pb-6">
              {/* Question 1: 나이대 (User Request 4-1: 10~20 / 20~30 / 30~40 / 40대 이상) */}
              <div>
                <label className="block text-xs font-extrabold text-slate-800 mb-2">
                  1. 연령대를 알려주세요
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: '10-20', label: '10대 ~ 20대' },
                    { id: '20-30', label: '20대 ~ 30대' },
                    { id: '30-40', label: '30대 ~ 40대' },
                    { id: '40+', label: '40대 이상' },
                  ].map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setAgeGroup(opt.id)}
                      className={`h-11 rounded-xl font-bold text-xs border transition-all cursor-pointer ${
                        ageGroup === opt.id
                          ? 'border-blue-600 bg-blue-50/90 text-blue-700 ring-2 ring-blue-500/20'
                          : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Question 2: 성별 (User Request 4-2: 여성, 남성) */}
              <div>
                <label className="block text-xs font-extrabold text-slate-800 mb-2">
                  2. 성별을 선택해 주세요
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'female', label: '여성' },
                    { id: 'male', label: '남성' },
                    { id: 'none', label: '선택 안함' },
                  ].map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setGender(opt.id)}
                      className={`h-11 rounded-xl font-bold text-xs border transition-all cursor-pointer ${
                        gender === opt.id
                          ? 'border-blue-600 bg-blue-50/90 text-blue-700 ring-2 ring-blue-500/20'
                          : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Question 3: 원하는 루틴 개수 (User Request 4-3: 1~2개 / 3~4개 / 5개 이상) */}
              <div>
                <label className="block text-xs font-extrabold text-slate-800 mb-2">
                  3. 시작하고 싶은 루틴 개수는 몇 개인가요?
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: '1-2', label: '1~2개', sub: '가볍게' },
                    { id: '3-4', label: '3~4개', sub: '추천!' },
                    { id: '5+', label: '5개 이상', sub: '알차게' },
                  ].map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setRoutineCountGoal(opt.id)}
                      className={`h-13 rounded-xl border flex flex-col items-center justify-center transition-all cursor-pointer ${
                        routineCountGoal === opt.id
                          ? 'border-blue-600 bg-blue-50/90 text-blue-700 ring-2 ring-blue-500/20'
                          : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <span className="font-extrabold text-xs">{opt.label}</span>
                      <span className="text-xs font-medium opacity-80">{opt.sub}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Question 4: 집중하고 싶은 목표 분야 (User Request 4-4: 묻고 싶은거 1) */}
              <div>
                <label className="block text-xs font-extrabold text-slate-800 mb-2">
                  4. 가장 집중하고 싶은 목표 영역은 어디인가요?
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'health', icon: '🏃', label: '운동 & 건강', desc: '체력 증진과 활력' },
                    { id: 'growth', icon: '📚', label: '공부 & 성장', desc: '독서와 자기계발' },
                    { id: 'life', icon: '🌿', label: '생활 & 정돈', desc: '기상과 청결한 환경' },
                    { id: 'mind', icon: '🧘', label: '마음 & 멘탈', desc: '감사일기와 휴식' },
                  ].map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setFocusArea(opt.id)}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                        focusArea === opt.id
                          ? 'border-blue-600 bg-blue-50/90 text-blue-700 ring-2 ring-blue-500/20'
                          : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 font-extrabold text-xs">
                        <span>{opt.icon}</span>
                        <span>{opt.label}</span>
                      </div>
                      <p className="text-xs font-medium text-slate-500 mt-1">{opt.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Question 5: 실천 시간대 (User Request 4-4: 묻고 싶은거 2) */}
              <div>
                <label className="block text-xs font-extrabold text-slate-800 mb-2">
                  5. 주로 어떤 시간대에 실천하고 싶으신가요?
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'morning', icon: '🌅', label: '상쾌한 아침' },
                    { id: 'afternoon', icon: '☀️', label: '활기찬 낮' },
                    { id: 'evening', icon: '🌙', label: '편안한 저녁·밤' },
                    { id: 'anytime', icon: '⏰', label: '언제든 자유롭게' },
                  ].map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setFocusTimeOfDay(opt.id)}
                      className={`h-11 px-3 rounded-xl font-bold text-xs border flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                        focusTimeOfDay === opt.id
                          ? 'border-blue-600 bg-blue-50/90 text-blue-700 ring-2 ring-blue-500/20'
                          : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <span>{opt.icon}</span>
                      <span>{opt.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Question 6: 계정 연동 여부 (User Request 4-5: 계정 연동하겠냐? 일단 써볼거냐?) */}
              <div>
                <label className="block text-xs font-extrabold text-slate-800 mb-2">
                  6. 시작 방식을 선택해 주세요
                </label>
                <div className="flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={() => setAccountType('guest')}
                    className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                      accountType === 'guest'
                        ? 'border-blue-600 bg-blue-50/90 text-blue-700 ring-2 ring-blue-500/20'
                        : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-sm flex items-center gap-1.5">
                        <span>🚀</span>
                        <span>게스트로 바로 써보기 (추천)</span>
                      </span>
                      <span className="text-xs font-bold bg-blue-600 text-white px-2 py-0.5 rounded-full">즉시 시작</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      별도 로그인 없이 즉시 사용하며 모든 데이터는 내 기기에 안전하게 저장됩니다.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setAccountType('linked')}
                    className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                      accountType === 'linked'
                        ? 'border-blue-600 bg-blue-50/90 text-blue-700 ring-2 ring-blue-500/20'
                        : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-sm flex items-center gap-1.5">
                        <span>🔗</span>
                        <span>계정 연동하고 시작하기</span>
                      </span>
                      <span className="text-xs font-medium text-slate-400">클라우드 백업</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      기기 변경이나 캐시 삭제 시에도 습관과 스트릭 데이터를 안전하게 보호합니다.
                    </p>
                  </button>
                </div>
              </div>
            </div>

            {/* Bottom CTA Button */}
            <div className="sticky bottom-0 bg-white/95 backdrop-blur-xs pt-3 pb-1 border-t border-slate-100 mt-auto">
              <button
                type="button"
                onClick={handleGoToStep3}
                className="w-full h-14 rounded-2xl bg-primary hover:bg-blue-700 text-white font-black text-base transition shadow-lg shadow-blue-500/25 active:scale-98 cursor-pointer flex items-center justify-center gap-2"
              >
                <span>맞춤 루틴 추천받기 →</span>
              </button>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STEP 3: 맞춤 추천 루틴 선택 및 확인 (Curated Starter Routines) */}
        {/* ========================================================================= */}
        {step === 3 && (
          <div className="flex flex-col w-full py-2 animate-fadeIn">
            {/* Top Navigation Bar */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="flex items-center gap-1 text-xs font-bold text-slate-600 hover:text-slate-900 transition cursor-pointer px-1 py-1"
              >
                <span>←</span>
                <span>{language === 'en' ? 'Back' : language === 'ja' ? '戻る' : '설문 수정'}</span>
              </button>
              <span className="text-xs font-black tracking-wider uppercase text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full">
                Step 3 / 3
              </span>
            </div>

            {/* Header with Joy Mascot */}
            <div className="flex items-center gap-3.5 mt-4 mb-4">
              <div className="w-14 h-14 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0">
                <MobitCharacter mood="victory" className="w-11 h-11 object-contain" />
              </div>
              <div className="text-left">
                <h2 className="text-lg sm:text-lg font-extrabold text-slate-900 tracking-tight leading-snug">
                  {nickname}님을 위한 첫 맞춤 습관! ✨
                </h2>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  선택하신 목표에 꼭 맞춘 추천 습관이에요. 실천할 습관을 선택해 주세요.
                </p>
              </div>
            </div>

            {/* Routine Checklist */}
            <div className="flex flex-col gap-2.5 text-left mb-6">
              {(STARTER_POOLS[focusArea] || STARTER_POOLS.health).map((item) => {
                const isSelected = selectedTemplateIds.has(item.id);
                return (
                  <div
                    key={item.id}
                    onClick={() => handleToggleRoutine(item.id)}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center gap-3 select-none ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50/70 shadow-xs'
                        : 'border-slate-200 bg-slate-50/70 opacity-70 hover:opacity-100'
                    }`}
                  >
                    {/* Checkbox */}
                    <div
                      className={`w-6 h-6 rounded-lg border flex items-center justify-center transition-all shrink-0 ${
                        isSelected
                          ? 'bg-blue-600 border-blue-600 text-white'
                          : 'border-slate-300 bg-white'
                      }`}
                    >
                      {isSelected && (
                        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      )}
                    </div>

                    {/* Emoji */}
                    <span className="text-lg shrink-0">{item.emoji}</span>

                    {/* Text info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-sm text-slate-900 truncate">
                          {language === 'en' ? item.titleEn : language === 'ja' ? item.titleJa : item.titleKo}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className="text-xs font-bold text-blue-700 bg-blue-100/70 px-2 py-0.5 rounded-md">
                          {item.timeLabelKo}
                        </span>
                        <span className="text-xs font-medium text-slate-500 bg-slate-200/60 px-2 py-0.5 rounded-md">
                          {item.categoryLabelKo}
                        </span>
                        <span className="text-xs font-semibold text-slate-400">
                          {item.tagKo}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Bottom Completion Area */}
            <div className="mt-auto pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={handleFinishOnboarding}
                disabled={selectedTemplateIds.size === 0}
                className={`w-full h-14 rounded-2xl font-black text-base transition-all flex items-center justify-center gap-2 ${
                  selectedTemplateIds.size > 0
                    ? 'bg-primary hover:bg-blue-700 text-white shadow-lg shadow-blue-500/25 active:scale-98 cursor-pointer'
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                }`}
              >
                <span>
                  {language === 'en'
                    ? `Start with ${selectedTemplateIds.size} Habits 🚀`
                    : language === 'ja'
                    ? `選択した${selectedTemplateIds.size}個の習慣で始める 🚀`
                    : `선택한 ${selectedTemplateIds.size}개 루틴으로 모어해빗 시작하기 🚀`}
                </span>
              </button>

              <p className="text-xs text-slate-400 font-medium mt-3 text-center">
                {language === 'en'
                  ? 'You can add or customize habits anytime in the Explore menu'
                  : language === 'ja'
                  ? '習慣はアプリ内の[探す]メニューでいつでも追加・変更できます'
                  : '앱 시작 후에도 [탐색] 메뉴에서 언제든 새로운 습관을 추가할 수 있어요'}
              </p>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
