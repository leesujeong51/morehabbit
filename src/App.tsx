import React, { useState, useEffect, useCallback } from 'react';
import type { Routine, RoutineLog, DailyReview, Category, ActiveTab, TimeOfDay } from './types/routine';

import {
  getStoredCategories,
  getStoredRoutines,
  getStoredLogs,
  getStoredReviews,
  saveStoredRoutines,
  saveStoredLogs,
} from './utils/storage';
import { toDateKey } from './utils/dateUtils';
import {
  getDailyStats,
  calculateOverallStreak,
  triggerConfetti,
} from './utils/routineUtils';

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
import { InstallAppBanner } from './components/common/InstallAppBanner';

export const App: React.FC = () => {
  // Core state from LocalStorage
  const [categories, setCategories] = useState<Category[]>([]);
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [logs, setLogs] = useState<RoutineLog[]>([]);
  const [reviews, setReviews] = useState<DailyReview[]>([]);

  // Navigation & selection state
  const [selectedDateKey, setSelectedDateKey] = useState<string>(toDateKey());
  const [activeTab, setActiveTab] = useState<ActiveTab>('today');
  const [focusRoutine, setFocusRoutine] = useState<Routine | null>(null);

  // Modal states
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingRoutine, setEditingRoutine] = useState<Routine | null>(null);
  const [defaultTimeOfDay, setDefaultTimeOfDay] = useState<TimeOfDay>('morning');
  const [memoRoutineId, setMemoRoutineId] = useState<string | null>(null);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

  // Load data from LocalStorage
  const loadData = useCallback(() => {
    setCategories(getStoredCategories());
    setRoutines(getStoredRoutines());
    setLogs(getStoredLogs());
    setReviews(getStoredReviews());
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Overall streak calculation
  const streakCount = calculateOverallStreak(routines, logs);

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
            }
          : r
      );
    } else {
      const newRoutine: Routine = {
        ...data,
        id: `rt-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        createdAt: new Date().toISOString(),
        order: routines.length + 1,
      };
      updatedRoutines = [...routines, newRoutine];
    }

    setRoutines(updatedRoutines);
    saveStoredRoutines(updatedRoutines);
    setEditingRoutine(null);
  };

  // Delete routine
  const handleDeleteRoutine = (routineId: string) => {
    const updated = routines.filter((r) => r.id !== routineId);
    setRoutines(updated);
    saveStoredRoutines(updated);
  };


  // Save memo for a specific routine completion
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
  };

  const activeMemoRoutine = routines.find((r) => r.id === memoRoutineId) || null;
  const activeMemoLog = logs.find(
    (l) => l.routineId === memoRoutineId && l.date === selectedDateKey
  );

  return (
    <div className="min-h-screen bg-surface text-on-surface flex flex-col justify-between selection:bg-primary-fixed selection:text-on-primary-fixed">
      {/* Top Mobile Header (Centered max-w-md on all screens including PC) */}
      <AppHeader
        activeTab={activeTab}
        streakCount={streakCount}
        onNavigateToProfile={() => setActiveTab('profile')}
      />

      {/* Main Container - Strictly pure Mobile Layout (max-w-md mx-auto) */}
      <main className="flex-1 w-full max-w-md mx-auto px-4 pt-20 pb-28">
        {/* PWA Mobile Install Banner */}
        <InstallAppBanner />

        {/* Tab 1: Today View (오늘의 루틴) */}
        {activeTab === 'today' && (
          <TodayView
            routines={routines}
            logs={logs}
            categories={categories}
            selectedDateKey={selectedDateKey}
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
          />
        )}

        {/* Tab 2: Explore View (루틴 탐색 & 추가) */}
        {activeTab === 'explore' && (
          <ExploreView
            userRoutines={routines}
            categories={categories}
            onAddRoutine={(routineData) => handleSaveRoutine(routineData)}
            onOpenAddModal={() => {
              setEditingRoutine(null);
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
            onToggleComplete={handleToggleComplete}
            onSelectDate={(dateKey) => {
              setSelectedDateKey(dateKey);
              setActiveTab('today');
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
            onOpenDataBackupModal={() => setIsSettingsModalOpen(true)}
          />
        )}
      </main>

      {/* Floating Bottom Navigation Bar (Centered max-w-md) */}
      <BottomNav
        activeTab={activeTab}
        onChangeTab={(tab) => setActiveTab(tab)}
      />

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
    </div>
  );
};

export default App;
