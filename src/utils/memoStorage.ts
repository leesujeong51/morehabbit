import type { IdeaMemo } from '../types/routine';

const MEMO_STORAGE_KEY = 'morehabbit_memos_v2';
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

export const getStoredMemos = (): IdeaMemo[] => {
  try {
    const raw = localStorage.getItem(MEMO_STORAGE_KEY);
    if (raw) {
      const parsed: IdeaMemo[] = JSON.parse(raw);
      const now = Date.now();
      // Auto-purge items in trash for > 7 days (Google Keep style)
      const valid = parsed.filter((item) => {
        if (!item.deletedAt) return true;
        const deletedTime = new Date(item.deletedAt).getTime();
        return now - deletedTime < SEVEN_DAYS_MS;
      });

      if (valid.length !== parsed.length) {
        saveStoredMemos(valid);
      }
      return valid;
    }
  } catch (err) {
    console.error('Failed to parse memos:', err);
  }
  // Default starter sample memos for instant discovery
  return [
    {
      id: 'memo-1',
      title: '아침 산책 중 떠오른 새로운 습관 아이디어',
      content: '아침 7시에 10분 스트레칭 후 미온수 한 잔 마시기. 휴대폰을 켜기 전에 호흡 10회 명상 병행하면 뇌가 훨씬 맑아질 듯!',
      type: 'idea',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'memo-2',
      title: '이번 주말까지 꼭 해낼 할 일 리스트',
      content: '1. 침구류 세탁 및 환기\n2. 독서 1챕터 요약 정리\n3. 다음 주 식단 장보기\n4. 뽀모도로 5세션 완주하기',
      type: 'todo',
      completed: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];
};

export const saveStoredMemos = (memos: IdeaMemo[]): void => {
  try {
    localStorage.setItem(MEMO_STORAGE_KEY, JSON.stringify(memos));
  } catch (err) {
    console.error('Failed to save memos:', err);
  }
};
