import React, { useState, useEffect, useCallback, useRef } from 'react';
import type { Routine, RoutineLog, DailyReview, Category, ActiveTab, TimeOfDay, UserProfile } from './types/routine';

import {
  getStoredCategories,
  getStoredRoutines,
  getStoredLogs,
  getStoredReviews,
  saveStoredRoutines,
  saveStoredLogs,
  getStoredUserProfile,
  saveStoredUserProfile,
} from './utils/storage';
import { toDateKey } from './utils/dateUtils';
import {
  getDailyStats,
  calculateOverallStreak,
  triggerConfetti,
} from './utils/routineUtils';
import { LanguageProvider, useLanguage } from './utils/i18n';

import { AppHeader } from './components/header/AppHeader';
import { BottomNav } from './components/navigation/BottomNav';
import { TodayView } from './components/today/TodayView';
import { ExploreView } from './components/explore/ExploreView';
import { StatsView } from './components/stats/StatsView';
import { PomodoroView } from './components/pomodoro/PomodoroView';
import { ProfileView } from './components/profile/ProfileView';
import { RoutineFormModal } from './components/routines/RoutineFormModal';
import { RoutineMemoModal } from './components/routines/RoutineMemoModal';
import { DataManagementModal } from './components/settings/DataManagementModal';
import { SplashScreen } from './components/common/SplashScreen';
import { OnboardingModal } from './components/onboarding/OnboardingModal';
import { ReminderNotificationModal } from './components/notifications/ReminderNotificationModal';
import { StreakRulePage } from './components/common/StreakRulePage';
import { MemoVaultPage } from './components/memo/MemoVaultPage';
import { ConfirmModal } from './components/common/ConfirmModal';

const AppContent: React.FC = () => {
  const { t, language } = useLanguage();

  // Core state from LocalStorage
  const [categories, setCategories] = useState<Category[]>([]);
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [logs, setLogs] = useState<RoutineLog[]>([]);
  const [reviews, setReviews] = useState<DailyReview[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile>(getStoredUserProfile());

  // App UI & Feature states
  const [isSplashActive, setIsSplashActive] = useState(true);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(() => !getStoredUserProfile().hasCompletedOnboarding);
  const [activeReminderRoutine, setActiveReminderRoutine] = useState<Routine | null>(null);
  const [notifiedRoutineKeys, setNotifiedRoutineKeys] = useState<Set<string>>(new Set());

  // Navigation & selection state
  const [selectedDateKey, setSelectedDateKey] = useState<string>(toDateKey());
  const [activeTab, setActiveTab] = useState<ActiveTab>('today');
  const [focusRoutine, setFocusRoutine] = useState<Routine | null>(null);

  // Automatically scroll to the very top whenever the menu tab changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
    if (document.documentElement) document.documentElement.scrollTop = 0;
    if (document.body) document.body.scrollTop = 0;
  }, [activeTab]);

  // Modal states
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingRoutine, setEditingRoutine] = useState<Routine | Partial<Routine> | null>(null);
  const [defaultTimeOfDay, setDefaultTimeOfDay] = useState<TimeOfDay>('morning');
  const [memoRoutineId, setMemoRoutineId] = useState<string | null>(null);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isStreakCelebrationOpen, setIsStreakCelebrationOpen] = useState(false);
  const [isMemoVaultOpen, setIsMemoVaultOpen] = useState(false);
  const [isExitConfirmModalOpen, setIsExitConfirmModalOpen] = useState(false);
  const [exitToastMessage, setExitToastMessage] = useState<string | null>(null);
  const lastBackPressTimeRef = useRef<number>(0);

  // User Request 3: 휴대폰 이전 버튼 처리
  useEffect(() => {
    try {
      window.history.pushState({ app: 'morehabbit' }, '', window.location.href);
    } catch {
      // Ignore
    }

    const handlePopState = () => {
      try {
        window.history.pushState({ app: 'morehabbit' }, '', window.location.href);
      } catch {
        // Ignore
      }

      // 1. 종료 확인 모달이 열려있으면 닫기
      if (isExitConfirmModalOpen) {
        setIsExitConfirmModalOpen(false);
        return;
      }

      // 2. 열려있는 풀페이지 또는 모달 순차적 닫기
      if (isMemoVaultOpen) {
        setIsMemoVaultOpen(false);
        return;
      }
      if (isStreakCelebrationOpen) {
        setIsStreakCelebrationOpen(false);
        return;
      }
      if (isSettingsModalOpen) {
        setIsSettingsModalOpen(false);
        return;
      }
      if (isFormModalOpen) {
        setIsFormModalOpen(false);
        setEditingRoutine(null);
        return;
      }
      if (memoRoutineId) {
        setMemoRoutineId(null);
        return;
      }

      // 3. 서브 메뉴 탭에 머무르고 있는 경우 홈(today)으로 이동
      if (activeTab !== 'today') {
        setActiveTab('today');
        window.scrollTo({ top: 0, behavior: 'instant' });
        return;
      }

      // 4. 홈(today) 화면인 경우: 2초 내 연속 2회 클릭 시 종료 확인 팝업, 1회 클릭 시 토스트 안내
      const now = Date.now();
      const elapsed = now - lastBackPressTimeRef.current;

      if (elapsed < 2000) {
        setExitToastMessage(null);
        setIsExitConfirmModalOpen(true);
      } else {
        lastBackPressTimeRef.current = now;
        setExitToastMessage(t.confirm?.backToast || '뒤로 가기 버튼을 한 번 더 누르면 종료됩니다.');
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [
    isExitConfirmModalOpen,
    isMemoVaultOpen,
    isStreakCelebrationOpen,
    isSettingsModalOpen,
    isFormModalOpen,
    memoRoutineId,
    activeTab,
    t,
  ]);

  // 토스트 자동 숨김 타이머 (2초)
  useEffect(() => {
    if (exitToastMessage) {
      const timer = setTimeout(() => {
        setExitToastMessage(null);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [exitToastMessage]);

  // Load data from LocalStorage
  const loadData = useCallback(() => {
    setCategories(getStoredCategories());
    setRoutines(getStoredRoutines());
    setLogs(getStoredLogs());
    setReviews(getStoredReviews());
    setUserProfile(getStoredUserProfile());
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Overall streak calculation (신규 사용자는 온보딩 완료 전까지 0)
  const streakCount = userProfile.hasCompletedOnboarding ? calculateOverallStreak(routines, logs) : 0;

  // Toggle routine completion for specific date
  const handleToggleComplete = (routineId: string, targetDateKey: string = selectedDateKey) => {
    setLogs((prevLogs) => {
      const existingIndex = prevLogs.findIndex(
        (l) => l.routineId === routineId && l.date === targetDateKey
      );

      let newLogs: RoutineLog[];
      let newlyCompleted = false;

      if (existingIndex >= 0) {
        const current = prevLogs[existingIndex];
        const nextCompleted = !current.completed;
        newlyCompleted = nextCompleted;

        newLogs = [...prevLogs];
        newLogs[existingIndex] = {
          ...current,
          completed: nextCompleted,
          completedAt: nextCompleted ? new Date().toTimeString().slice(0, 5) : undefined,
        };
      } else {
        newlyCompleted = true;
        newLogs = [
          ...prevLogs,
          {
            routineId,
            date: targetDateKey,
            completed: true,
            completedAt: new Date().toTimeString().slice(0, 5),
          },
        ];
      }

      saveStoredLogs(newLogs);

      // Check if this action made the daily progress 100%
      if (newlyCompleted) {
        const nextStats = getDailyStats(routines, newLogs, targetDateKey);
        if (nextStats.totalRoutines > 0 && nextStats.percentage === 100) {
          triggerConfetti();
        }
      }

      return newLogs;
    });
  };

  // Add or update routine
  const handleSaveRoutine = (
    data: Omit<Routine, 'id' | 'createdAt' | 'order'>,
    existingId?: string
  ) => {
    let updatedRoutines: Routine[];

    if (existingId) {
      updatedRoutines = routines.map((r) =>
        r.id === existingId
          ? {
              ...r,
              ...data,
              startDate: data.startDate || r.startDate || toDateKey(new Date(r.createdAt)),
              priority: data.priority || r.priority || 'medium',
              isPrivate: data.isPrivate !== undefined ? data.isPrivate : r.isPrivate,
            }
          : r
      );
    } else {
      const newRoutine: Routine = {
        ...data,
        id: `rt-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        createdAt: new Date().toISOString(),
        startDate: data.startDate || toDateKey(),
        priority: data.priority || 'medium',
        isPrivate: data.isPrivate || false,
        order: routines.length,
        xp: 40,
      };
      updatedRoutines = [...routines, newRoutine];
    }

    setRoutines(updatedRoutines);
    saveStoredRoutines(updatedRoutines);
    setIsFormModalOpen(false);
    setEditingRoutine(null);
  };

  // Delete routine
  const handleDeleteRoutine = (routineId: string) => {
    const updated = routines.filter((r) => r.id !== routineId);
    setRoutines(updated);
    saveStoredRoutines(updated);
    setIsFormModalOpen(false);
    setEditingRoutine(null);
  };

  // Update profile
  const handleUpdateProfile = (partial: Partial<UserProfile>) => {
    const updated = { ...userProfile, ...partial };
    setUserProfile(updated);
    saveStoredUserProfile(updated);
  };

  // Complete onboarding
  const handleCompleteOnboarding = (
    name: string,
    initialRoutines?: Routine[],
    surveyProfile?: Partial<UserProfile>
  ) => {
    const updated: UserProfile = {
      ...userProfile,
      name: name.trim() || 'SJ',
      hasCompletedOnboarding: true,
      allowNotification: true,
      ...surveyProfile,
    };
    setUserProfile(updated);
    saveStoredUserProfile(updated);

    if (initialRoutines && initialRoutines.length > 0) {
      setRoutines(initialRoutines);
      saveStoredRoutines(initialRoutines);
    }
    setIsOnboardingOpen(false);
  };

  // Routine Reminder Interval Check (every 10s)
  useEffect(() => {
    if (!userProfile.allowNotification) return;

    const checkReminders = () => {
      const now = new Date();
      const currentHHmm = `${String(now.getHours()).padStart(2, '0')}:${String(
        now.getMinutes()
      ).padStart(2, '0')}`;
      const todayKey = toDateKey(now);

      const target = routines.find((r) => {
        if (!r.reminderTime || r.reminderTime !== currentHHmm) return false;
        const alreadyDone = logs.some(
          (l) => l.routineId === r.id && l.date === todayKey && l.completed
        );
        if (alreadyDone) return false;
        const notificationKey = `${todayKey}-${r.id}-${r.reminderTime}`;
        return !notifiedRoutineKeys.has(notificationKey);
      });

      if (target) {
        const notifKey = `${todayKey}-${target.id}-${target.reminderTime}`;
        setNotifiedRoutineKeys((prev) => new Set([...prev, notifKey]));
        setActiveReminderRoutine(target);

        // Native Browser Notification (User Request 2)
        if ('Notification' in window && Notification.permission === 'granted') {
          try {
            const notifTitle = language === 'en' ? 'MoreHabit Reminder ⏰' : language === 'ja' ? 'モアハビット 習慣リマインダー ⏰' : '모어해빗 습관 알림 ⏰';
            const notifBody =
              language === 'en'
                ? `Time for "${target.title}". Let's take action and check it off!`
                : language === 'ja'
                ? `「${target.title}」の時間です。今すぐ実践してチェックしましょう！`
                : `"${target.title}"을(를) 할 시간이에요. 지금 바로 실천하고 체크해볼까요?`;
            new Notification(notifTitle, {
              body: notifBody,
              icon: './icon-192.png',
            });
          } catch {}
        }
      }
    };

    const interval = setInterval(checkReminders, 10000);
    return () => clearInterval(interval);
  }, [routines, logs, userProfile.allowNotification, notifiedRoutineKeys]);

  // Save routine memo
  const handleSaveMemo = (routineId: string, note: string) => {
    setLogs((prevLogs) => {
      const existingIndex = prevLogs.findIndex(
        (l) => l.routineId === routineId && l.date === selectedDateKey
      );

      let newLogs: RoutineLog[];
      if (existingIndex >= 0) {
        newLogs = [...prevLogs];
        newLogs[existingIndex] = {
          ...newLogs[existingIndex],
          note,
          completed: true,
        };
      } else {
        newLogs = [
          ...prevLogs,
          {
            routineId,
            date: selectedDateKey,
            completed: true,
            completedAt: new Date().toTimeString().slice(0, 5),
            note,
          },
        ];
      }

      saveStoredLogs(newLogs);
      return newLogs;
    });
  };

  // Delete routine memo
  const handleDeleteMemo = (routineId: string) => {
    setLogs((prevLogs) => {
      const existingIndex = prevLogs.findIndex(
        (l) => l.routineId === routineId && l.date === selectedDateKey
      );
      if (existingIndex >= 0) {
        const newLogs = [...prevLogs];
        newLogs[existingIndex] = {
          ...newLogs[existingIndex],
          note: undefined,
        };
        saveStoredLogs(newLogs);
        return newLogs;
      }
      return prevLogs;
    });
  };

  // Start Pomodoro session from Routine Card
  const handleStartFocus = (routine: Routine) => {
    setFocusRoutine(routine);
    setActiveTab('pomodoro');
    window.scrollTo({ top: 0, behavior: 'instant' });
  };

  const activeMemoRoutine = routines.find((r) => r.id === memoRoutineId) || null;
  const activeMemoLog = logs.find(
    (l) => l.routineId === memoRoutineId && l.date === selectedDateKey
  );

  return (
    <div className="min-h-screen bg-surface text-on-surface flex flex-col justify-between selection:bg-primary-fixed selection:text-on-primary-fixed">
      {/* Opening Splash Screen */}
      {isSplashActive && (
        <SplashScreen onFinish={() => setIsSplashActive(false)} minDisplayTimeMs={950} />
      )}

      {/* First-time Onboarding Modal (Fullscreen, Header/BottomNav/FAB strictly hidden) */}
      {isOnboardingOpen ? (
        <OnboardingModal
          isOpen={true}
          initialName={userProfile.name}
          onComplete={handleCompleteOnboarding}
        />
      ) : (
        <>
          {/* In-App Routine Notification Alert Modal */}
          <ReminderNotificationModal
            routine={activeReminderRoutine}
            onClose={() => setActiveReminderRoutine(null)}
            onComplete={(routineId) => {
              handleToggleComplete(routineId, toDateKey());
            }}
          />

          {/* Top Mobile Header */}
          <AppHeader
            activeTab={activeTab}
            streakCount={streakCount}
            onNavigateToProfile={() => {
              setActiveTab('profile');
              window.scrollTo({ top: 0, behavior: 'instant' });
            }}
            onOpenStreakModal={() => setIsStreakCelebrationOpen(true)}
          />

          {/* Main Container - Strictly pure Mobile Layout (max-w-md mx-auto) */}
          <main
            className={`flex-1 w-full max-w-md mx-auto ${
              activeTab === 'pomodoro' || activeTab === 'focus'
                ? 'px-3.5 pt-16 pb-20'
                : 'px-4 pt-20 pb-24'
            }`}
          >
        {/* Tab 1: Today View (오늘의 습관) */}
        {activeTab === 'today' && (
          <TodayView
            routines={routines}
            logs={logs}
            categories={categories}
            selectedDateKey={selectedDateKey}
            userName={userProfile.name}
            onSelectDate={(key) => setSelectedDateKey(key)}
            onToggleComplete={handleToggleComplete}
            onOpenMemo={(id) => setMemoRoutineId(id)}
            onOpenAddModal={(timeOfDay) => {
              setEditingRoutine(null);
              if (timeOfDay) setDefaultTimeOfDay(timeOfDay);
              setIsFormModalOpen(true);
            }}
            onEditRoutine={(r) => {
              setEditingRoutine(r);
              setIsFormModalOpen(true);
            }}
            onDeleteRoutine={handleDeleteRoutine}
            onStartFocus={handleStartFocus}
            streakCount={streakCount}
            onOpenMemoVault={() => setIsMemoVaultOpen(true)}
          />
        )}

        {/* Tab 2: Explore View (습관 탐색 & 추가) */}
        {activeTab === 'explore' && (
          <ExploreView
            userRoutines={routines}
            categories={categories}
            onAddRoutine={(routineData) => handleSaveRoutine(routineData)}
            onOpenAddModal={() => {
              setEditingRoutine(null);
              setIsFormModalOpen(true);
            }}
            onOpenAddWithTemplate={(templateData) => {
              setEditingRoutine(templateData);
              setIsFormModalOpen(true);
            }}
          />
        )}

        {/* Tab 3: Stats View (통계 및 스트릭) */}
        {activeTab === 'stats' && (
          <StatsView
            routines={routines}
            logs={logs}
            reviews={reviews}
            categories={categories}
            userName={userProfile.name}
            onToggleComplete={handleToggleComplete}
            onSelectDate={(dateKey) => {
              setSelectedDateKey(dateKey);
              setActiveTab('today');
              window.scrollTo({ top: 0, behavior: 'instant' });
            }}
          />
        )}

        {/* Tab 4: Pomodoro View (뽀모도로 타이머) */}
        {(activeTab === 'pomodoro' || activeTab === 'focus') && (
          <PomodoroView
            routines={routines}
            selectedRoutine={focusRoutine}
            onSelectRoutine={(r) => setFocusRoutine(r)}
            onCompleteRoutine={(routineId) => {
              handleToggleComplete(routineId, toDateKey());
            }}
          />
        )}

        {/* Tab 5: Profile View (내 정보 / 마이페이지) */}
        {activeTab === 'profile' && (
          <ProfileView
            routines={routines}
            logs={logs}
            streakCount={streakCount}
            userProfile={userProfile}
            onUpdateProfile={handleUpdateProfile}
            onOpenDataBackupModal={() => setIsSettingsModalOpen(true)}
          />
        )}
      </main>

      {/* Floating Bottom Navigation Bar (Centered max-w-md) */}
      <BottomNav
        activeTab={activeTab}
        onChangeTab={(tab) => {
          setActiveTab(tab);
          window.scrollTo({ top: 0, behavior: 'instant' });
        }}
      />
        </>
      )}

      {/* Routine Add / Edit Modal */}
      <RoutineFormModal
        isOpen={isFormModalOpen}
        onClose={() => {
          setIsFormModalOpen(false);
          setEditingRoutine(null);
        }}
        categories={categories}
        initialRoutine={editingRoutine ? { ...editingRoutine } : undefined}
        defaultTimeOfDay={defaultTimeOfDay}
        onSave={handleSaveRoutine}
        onDelete={handleDeleteRoutine}
      />

      {/* Routine Memo Modal */}
      <RoutineMemoModal
        isOpen={Boolean(memoRoutineId)}
        onClose={() => setMemoRoutineId(null)}
        routine={activeMemoRoutine}
        log={activeMemoLog}
        dateKey={selectedDateKey}
        onSaveMemo={handleSaveMemo}
        onDeleteMemo={handleDeleteMemo}
      />

      {/* Data Backup & Settings Modal */}
      <DataManagementModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        onDataReload={loadData}
      />

      {/* Flame Streak Rule Full Page (User Request 1 & 9: 팝업X 풀페이지 형태, 코알라+앱 색상 통일, 불꽃 규칙) */}
      <StreakRulePage
        isOpen={isStreakCelebrationOpen}
        onClose={() => setIsStreakCelebrationOpen(false)}
        streakCount={streakCount}
        logs={logs}
      />

      {/* Idea & Todo Memo Vault Full Page (User Request 2) */}
      {isMemoVaultOpen && (
        <MemoVaultPage onBack={() => setIsMemoVaultOpen(false)} />
      )}

      {/* Mobile Back Button Double Press Toast (User Request 3) */}
      {exitToastMessage && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[100] px-4 py-2.5 rounded-full bg-slate-900/90 text-white text-xs font-bold shadow-xl backdrop-blur-xs flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2 duration-150 whitespace-nowrap">
          <span>🐢</span>
          <span>{exitToastMessage}</span>
        </div>
      )}

      {/* App Exit Confirmation Modal (User Request 3) */}
      <ConfirmModal
        isOpen={isExitConfirmModalOpen}
        title={t.confirm?.exitTitle || '종료하시겠습니까?'}
        message={t.confirm?.exitMessage || '앱을 종료하시겠습니까? 오늘 실천한 모든 기록은 안전하게 저장되어 있습니다.'}
        confirmLabel={t.confirm?.exitConfirm || '종료'}
        cancelLabel={t.common?.cancel || '취소'}
        isDestructive={false}
        onCancel={() => setIsExitConfirmModalOpen(false)}
        onConfirm={() => {
          setIsExitConfirmModalOpen(false);
          if (window.navigator && (window.navigator as any).app && (window.navigator as any).app.exitApp) {
            (window.navigator as any).app.exitApp();
          } else {
            window.close();
            setTimeout(() => {
              window.location.href = 'about:blank';
            }, 100);
          }
        }}
      />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <LanguageProvider>
      <AppContent />
    </LanguageProvider>
  );
};

export default App;
