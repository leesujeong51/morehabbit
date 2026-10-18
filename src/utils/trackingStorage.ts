export interface TrackingDefinition {
  id: string;
  title: string;
  unit: string;
  emoji: string;
  icon: string;
  badge: string;
  badgeColor: string;
  gradient: string;
  description: string;
  inputType: 'number' | 'condition' | 'water' | 'spending' | 'sleep' | 'text';
  placeholder?: string;
  defaultGoal?: number;
  enTitle?: string;
  jaTitle?: string;
  enDescription?: string;
  jaDescription?: string;
}

export interface TrackingValue {
  trackerId: string;
  date: string; // YYYY-MM-DD
  value: number | string;
  note?: string;
  updatedAt: string;
}

export type DailyTrackingLogs = Record<string, Record<string, TrackingValue>>;

export const TRACKING_DEFINITIONS: TrackingDefinition[] = [
  {
    id: 'track-steps',
    title: '걸음 수 기록',
    enTitle: 'Step Count',
    jaTitle: '歩数記録',
    unit: '보',
    emoji: '👟',
    icon: 'directions_walk',
    badge: '활동량',
    badgeColor: 'bg-orange-100 text-orange-800 border-orange-200',
    gradient: 'from-orange-500 to-rose-500',
    description: '오늘 걸은 걸음 수를 기록하고 활기찬 활동량을 유지해요',
    enDescription: 'Log daily steps to maintain high vitality and health',
    jaDescription: '今日の歩数を記録し、活動的な生活を維持します',
    inputType: 'number',
    placeholder: '예: 8400',
    defaultGoal: 8000,
  },
  {
    id: 'track-water',
    title: '물 섭취량',
    enTitle: 'Water Intake',
    jaTitle: '水分摂取量',
    unit: 'ml',
    emoji: '💧',
    icon: 'water_drop',
    badge: '수분 충전',
    badgeColor: 'bg-cyan-100 text-cyan-800 border-cyan-200',
    gradient: 'from-cyan-500 to-blue-500',
    description: '250ml 단위로 간편 충전하며 하루 목표 2L를 채워보세요',
    enDescription: 'Quick +250ml logging towards your daily 2,000ml goal',
    jaDescription: '250ml単位で手軽に加算し、1日2Lを目指します',
    inputType: 'water',
    placeholder: '예: 1500',
    defaultGoal: 2000,
  },
  {
    id: 'track-condition',
    title: '컨디션 & 기분',
    enTitle: 'Condition & Mood',
    jaTitle: 'コンディション＆気分',
    unit: '등급',
    emoji: '😊',
    icon: 'sentiment_satisfied',
    badge: '에너지 지수',
    badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    gradient: 'from-emerald-500 to-teal-500',
    description: '오늘의 활력과 마음 상태를 5단계 이모지로 간편하게 체크해요',
    enDescription: 'Quickly log daily energy and mood with 5 emoji levels',
    jaDescription: '日々の活力とメンタルを5段階の絵文字で手軽にチェック',
    inputType: 'condition',
  },
  {
    id: 'track-sleep',
    title: '수면 시간',
    enTitle: 'Sleep Hours',
    jaTitle: '睡眠時間',
    unit: '시간',
    emoji: '🌙',
    icon: 'bedtime',
    badge: '숙면 리듬',
    badgeColor: 'bg-indigo-100 text-indigo-800 border-indigo-200',
    gradient: 'from-indigo-500 to-violet-600',
    description: '어젯밤 수면 시간과 취침 리듬을 기록하고 피로를 관리해요',
    enDescription: 'Track sleep duration and bedtime rhythm to manage fatigue',
    jaDescription: '睡眠時間と就寝リズムを記録し疲労をコントロール',
    inputType: 'sleep',
    placeholder: '예: 7.5',
    defaultGoal: 7.5,
  },
  {
    id: 'track-reading',
    title: '독서 페이지',
    enTitle: 'Reading Pages',
    jaTitle: '読書ページ数',
    unit: 'p',
    emoji: '📖',
    icon: 'menu_book',
    badge: '지식 누적',
    badgeColor: 'bg-blue-100 text-blue-800 border-blue-200',
    gradient: 'from-blue-500 to-sky-600',
    description: '오늘 읽은 페이지 수를 기록해 꾸준한 독서 습관을 쌓아요',
    enDescription: 'Log pages read today to build continuous reading habit',
    jaDescription: '今日読んだページ数を記録し読書習慣を継続',
    inputType: 'number',
    placeholder: '예: 25',
    defaultGoal: 20,
  },
  {
    id: 'track-journal',
    title: '한 줄 생각 일기',
    enTitle: 'One-line Journal',
    jaTitle: '一行日記・気づき',
    unit: '글',
    emoji: '✏️',
    icon: 'edit_note',
    badge: '하루 기록',
    badgeColor: 'bg-rose-100 text-rose-800 border-rose-200',
    gradient: 'from-rose-500 to-pink-500',
    description: '오늘 하루를 정리하는 짧지만 소중한 한 줄 생각을 남겨요',
    enDescription: 'Capture today’s core thought or memorable takeaway in 1 line',
    jaDescription: '今日の核心となる気づきや思考を1行で残します',
    inputType: 'text',
    placeholder: '오늘 하루 나에게 남기고 싶은 한 줄...',
  },
  {
    id: 'track-spending',
    title: '소비 & 지출',
    enTitle: 'Daily Spending',
    jaTitle: '支出・出費記録',
    unit: '원',
    emoji: '💰',
    icon: 'payments',
    badge: '스마트 지출',
    badgeColor: 'bg-purple-100 text-purple-800 border-purple-200',
    gradient: 'from-purple-500 to-indigo-500',
    description: '오늘 쓴 금액을 적거나 원클릭으로 무지출 데이를 인증해요',
    enDescription: 'Record daily spend or one-tap certify a Zero-Spend Day',
    jaDescription: '毎日の支出を記録、またはワンクリックでノーマネーデーを達成',
    inputType: 'spending',
    placeholder: '예: 12000',
  },
  {
    id: 'track-weight',
    title: '몸무게 기록',
    enTitle: 'Weight Log',
    jaTitle: '体重記録',
    unit: 'kg',
    emoji: '⚖️',
    icon: 'scale',
    badge: '체중 추이',
    badgeColor: 'bg-amber-100 text-amber-800 border-amber-200',
    gradient: 'from-amber-500 to-orange-500',
    description: '매일 아침 공복 몸무게를 기록하고 체중 변화 추세를 확인해요',
    enDescription: 'Track morning fasting weight and analyze weight trend',
    jaDescription: '毎朝の空腹時体重を記録し推移を確認します',
    inputType: 'number',
    placeholder: '예: 62.5',
    defaultGoal: 60.0,
  },
];

const STORAGE_KEYS = {
  ACTIVE_TRACKERS: 'morehabbit_active_trackers_v1',
  TRACKING_LOGS: 'morehabbit_tracking_logs_v1',
};

// Initial default active trackers (걸음 수, 물 섭취, 컨디션 우선 연동 - 몸무게는 개인정보 보호로 후순위)
const DEFAULT_ACTIVE_TRACKER_IDS = ['track-steps', 'track-water', 'track-condition'];

export const getActiveTrackerIds = (): string[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.ACTIVE_TRACKERS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.ACTIVE_TRACKERS, JSON.stringify(DEFAULT_ACTIVE_TRACKER_IDS));
      return DEFAULT_ACTIVE_TRACKER_IDS;
    }
    return JSON.parse(raw);
  } catch {
    return DEFAULT_ACTIVE_TRACKER_IDS;
  }
};

export const saveActiveTrackerIds = (ids: string[]): void => {
  localStorage.setItem(STORAGE_KEYS.ACTIVE_TRACKERS, JSON.stringify(ids));
  window.dispatchEvent(new CustomEvent('morehabbit-trackers-updated', { detail: ids }));
};

export const toggleActiveTracker = (trackerId: string): boolean => {
  const current = getActiveTrackerIds();
  const exists = current.includes(trackerId);
  const next = exists ? current.filter((id) => id !== trackerId) : [...current, trackerId];
  saveActiveTrackerIds(next);
  return !exists;
};

export const getDailyTrackingLogs = (): DailyTrackingLogs => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.TRACKING_LOGS);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
};

export const saveDailyTrackingLogs = (logs: DailyTrackingLogs): void => {
  localStorage.setItem(STORAGE_KEYS.TRACKING_LOGS, JSON.stringify(logs));
  window.dispatchEvent(new CustomEvent('morehabbit-tracking-logs-updated', { detail: logs }));
};

export const getTrackingValue = (trackerId: string, dateKey: string): TrackingValue | undefined => {
  const logs = getDailyTrackingLogs();
  return logs[dateKey]?.[trackerId];
};

export const setTrackingValue = (
  trackerId: string,
  dateKey: string,
  value: number | string,
  note?: string
): void => {
  const logs = getDailyTrackingLogs();
  const dayLogs = logs[dateKey] || {};
  dayLogs[trackerId] = {
    trackerId,
    date: dateKey,
    value,
    note,
    updatedAt: new Date().toISOString(),
  };
  logs[dateKey] = dayLogs;
  saveDailyTrackingLogs(logs);
};

type Lang = 'ko' | 'en' | 'ja';

// 화면 표시용 짧은 이름·단위 (언어별)
const TRACKER_LABELS: Record<string, Record<Lang, [string, string]>> = {
  'track-steps': { ko: ['걸음 수', '보'], en: ['Steps', 'steps'], ja: ['歩数', '歩'] },
  'track-water': { ko: ['물', 'ml'], en: ['Water', 'ml'], ja: ['水分', 'ml'] },
  'track-condition': { ko: ['컨디션', ''], en: ['Mood', ''], ja: ['体調', ''] },
  'track-sleep': { ko: ['수면', '시간'], en: ['Sleep', 'h'], ja: ['睡眠', '時間'] },
  'track-reading': { ko: ['독서', 'p'], en: ['Reading', 'p'], ja: ['読書', 'p'] },
  'track-journal': { ko: ['한 줄 일기', ''], en: ['Journal', ''], ja: ['一行日記', ''] },
  'track-spending': { ko: ['지출', '원'], en: ['Spending', 'KRW'], ja: ['支出', 'ウォン'] },
  'track-weight': { ko: ['몸무게', 'kg'], en: ['Weight', 'kg'], ja: ['体重', 'kg'] },
};

const asLang = (language: string): Lang => (language === 'en' || language === 'ja' ? language : 'ko');

export const trackerTitle = (def: TrackingDefinition, language: string) =>
  TRACKER_LABELS[def.id]?.[asLang(language)][0] ?? def.title;

export const trackerUnit = (def: TrackingDefinition, language: string) =>
  TRACKER_LABELS[def.id]?.[asLang(language)][1] ?? def.unit;

const CONDITION_LABELS: Record<string, Record<Lang, string>> = {
  great: { ko: '최고', en: 'Great', ja: '最高' },
  good: { ko: '좋음', en: 'Good', ja: '良い' },
  normal: { ko: '보통', en: 'Okay', ja: '普通' },
  tired: { ko: '지침', en: 'Tired', ja: '疲れ' },
  bad: { ko: '힘듦', en: 'Bad', ja: 'つらい' },
};

export const conditionLabel = (key: string, language: string) =>
  CONDITION_LABELS[key]?.[asLang(language)] ?? key;

export const CONDITION_EMOJIS: Record<string, { emoji: string; label: string; score: number }> = {
  great: { emoji: '😄', label: '최고', score: 100 },
  good: { emoji: '😊', label: '좋음', score: 80 },
  normal: { emoji: '😐', label: '보통', score: 60 },
  tired: { emoji: '🥱', label: '지침', score: 40 },
  bad: { emoji: '😢', label: '힘듦', score: 20 },
};
