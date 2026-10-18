import React, { useState, useMemo, useRef, useEffect } from 'react';
import type { Routine, RoutineLog, Category, TimeOfDay, IdeaMemo } from '../../types/routine';
import { getWeekDates, isDateToday } from '../../utils/dateUtils';
import type { WeekDateItem } from '../../utils/dateUtils';
import { getDailyStats, isRoutineScheduledForDate } from '../../utils/routineUtils';
import { MobitCharacter, MobitAllDoneModal } from '../character/MobitCharacter';
import { ConfirmModal } from '../common/ConfirmModal';
import { useLanguage, getDayNamesForLanguage } from '../../utils/i18n';
import { getStoredMemos, saveStoredMemos } from '../../utils/memoStorage';
import {
  TRACKING_DEFINITIONS,
  getActiveTrackerIds,
  getDailyTrackingLogs,
  setTrackingValue,
  toggleActiveTracker,
  CONDITION_EMOJIS,
  trackerTitle,
  trackerUnit,
  conditionLabel,
} from '../../utils/trackingStorage';
import type { DailyTrackingLogs } from '../../utils/trackingStorage';

interface TodayViewProps {
  routines: Routine[];
  logs: RoutineLog[];
  categories: Category[];
  selectedDateKey: string;
  userName?: string;
  onSelectDate: (dateKey: string) => void;
  onToggleComplete: (routineId: string, targetDateKey?: string) => void;
  onOpenMemo: (routineId: string) => void;
  onOpenAddModal: (defaultTimeOfDay?: TimeOfDay) => void;
  onEditRoutine: (routine: Routine) => void;
  onDeleteRoutine: (routineId: string) => void;
  onStartFocus?: (routine: Routine) => void;
  streakCount?: number;
  onOpenMemoVault?: () => void;
  onNavigateToTab?: (tab: any) => void;
}

export const TodayView: React.FC<TodayViewProps> = ({
  routines = [],
  logs = [],
  categories = [],
  selectedDateKey,
  userName = 'SJ',
  onSelectDate,
  onToggleComplete,
  onOpenMemo,
  onOpenAddModal,
  onEditRoutine,
  onDeleteRoutine,
  streakCount = 1,
}) => {
  const { language, t } = useLanguage();

  // Top Tabs: 습관 vs 할일 (User Request 5 & Image 2)
  const [mainTab, setMainTab] = useState<'habits' | 'todos'>('habits');

  // Filter for Habits
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'morning' | 'afternoon' | 'night'>('all');
  const [isAllDoneModalOpen, setIsAllDoneModalOpen] = useState(false);
  const [menuOpenRoutineId, setMenuOpenRoutineId] = useState<string | null>(null);
  const [routineToDelete, setRoutineToDelete] = useState<Routine | null>(null);
  const [todoToTrashId, setTodoToTrashId] = useState<string | null>(null);
  const [todoToPermanentId, setTodoToPermanentId] = useState<string | null>(null);
  const [isConfirmEmptyTrash, setIsConfirmEmptyTrash] = useState(false);

  // FAB Speed Dial State (User Request 7)
  const [isFabOpen, setIsFabOpen] = useState(false);

  // To-Dos & Memos State (User Request: trash bin, multiline input, etc.)
  const [memos, setMemos] = useState<IdeaMemo[]>(() => getStoredMemos());
  const [todoFilter, setTodoFilter] = useState<'all' | 'todo' | 'idea' | 'memo' | 'trash'>('all');
  const [newTodoText, setNewTodoText] = useState('');
  const [newTodoType, setNewTodoType] = useState<'todo' | 'idea' | 'memo'>('todo');
  const [openMenuTodoId, setOpenMenuTodoId] = useState<string | null>(null);
  const todoTextareaRef = useRef<HTMLTextAreaElement>(null);

  // Feedback Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  // Daily Life Trackers (User Request 2: 홈 맨 하단 기록 공간 & 통계 연동)
  const [activeTrackerIds, setActiveTrackerIds] = useState<string[]>(() => getActiveTrackerIds());
  const [trackingLogs, setTrackingLogs] = useState<DailyTrackingLogs>(() => getDailyTrackingLogs());
  const [editingTrackerInput, setEditingTrackerInput] = useState<Record<string, string>>({});
  const [isTrackerManagerOpen, setIsTrackerManagerOpen] = useState(false);

  useEffect(() => {
    const handleLogsUpdate = () => setTrackingLogs(getDailyTrackingLogs());
    const handleTrackersUpdate = () => setActiveTrackerIds(getActiveTrackerIds());
    window.addEventListener('morehabbit-tracking-logs-updated', handleLogsUpdate);
    window.addEventListener('morehabbit-trackers-updated', handleTrackersUpdate);
    return () => {
      window.removeEventListener('morehabbit-tracking-logs-updated', handleLogsUpdate);
      window.removeEventListener('morehabbit-trackers-updated', handleTrackersUpdate);
    };
  }, []);

  const activeTrackers = useMemo(() => {
    return TRACKING_DEFINITIONS.filter((def) => activeTrackerIds.includes(def.id));
  }, [activeTrackerIds]);

  const handleSaveTrackingValue = (trackerId: string, value: number | string, note?: string) => {
    setTrackingValue(trackerId, selectedDateKey, value, note);
    setTrackingLogs(getDailyTrackingLogs());
    setEditingTrackerInput((prev) => ({ ...prev, [trackerId]: String(value) }));
    const def = TRACKING_DEFINITIONS.find((d) => d.id === trackerId);
    showToast(
      language === 'en'
        ? `'${def?.title || 'Data'}' recorded! Check trends in Stats 📈`
        : language === 'ja'
        ? `「${def?.title || '記録'}」を記録しました！統計で推移を確認できます 📈`
        : `오늘의 ${def?.title || '기록'}이 저장되었습니다! 통계에서 변화 흐름을 확인하세요 📈`
    );
  };

  const persistMemos = (updated: IdeaMemo[]) => {
    setMemos(updated);
    saveStoredMemos(updated);
  };

  // Add Todo Handler (Requires explicit button click, Enter inserts newline)
  const handleAddTodo = () => {
    const raw = newTodoText.trim();
    if (!raw) return;

    const lines = newTodoText.split('\n');
    const title = lines[0].trim();
    const content = lines.slice(1).join('\n').trim();

    if (!title) return;

    const newMemo: IdeaMemo = {
      id: `memo-${Date.now()}`,
      title,
      content,
      type: newTodoType,
      completed: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    persistMemos([newMemo, ...memos]);
    setNewTodoText('');
    showToast(language === 'en' ? 'Task added ✨' : language === 'ja' ? 'タスクが追加されました ✨' : '새 할일이 추가되었습니다 ✨');
  };

  // Toggle Todo Checkbox
  const handleToggleTodo = (id: string) => {
    const updated = memos.map((m) =>
      m.id === id ? { ...m, completed: !m.completed, updatedAt: new Date().toISOString() } : m
    );
    persistMemos(updated);
  };

  // Move to Trash (7-day Google Keep style retention)
  const handleMoveToTrash = (id: string) => {
    const updated = memos.map((m) =>
      m.id === id ? { ...m, deletedAt: new Date().toISOString(), updatedAt: new Date().toISOString() } : m
    );
    persistMemos(updated);
    setOpenMenuTodoId(null);
    showToast(
      language === 'en'
        ? 'Moved to trash (kept for 7 days)'
        : language === 'ja'
        ? 'ゴミ箱に移動しました(7日間保管)'
        : '휴지통으로 이동되었습니다 (7일간 보관)'
    );
  };

  // Restore Todo from Trash
  const handleRestoreTodo = (id: string) => {
    const updated = memos.map((m) =>
      m.id === id ? { ...m, deletedAt: undefined, updatedAt: new Date().toISOString() } : m
    );
    persistMemos(updated);
    showToast(language === 'en' ? 'Restored' : language === 'ja' ? '復元しました' : '복원되었습니다.');
  };

  // Permanent Delete Todo
  const handlePermanentDeleteTodo = (id: string) => {
    setTodoToPermanentId(id);
  };

  // Empty Trash
  const handleEmptyTrash = () => {
    const updated = memos.filter((m) => !m.deletedAt);
    persistMemos(updated);
    showToast(language === 'en' ? 'Trash emptied' : language === 'ja' ? 'ゴミ箱を空にしました' : '휴지통이 비워졌습니다.');
  };

  // Export Todo: Copy (Clean text)
  const handleCopyTodo = (memo: IdeaMemo) => {
    const typeLabel =
      memo.type === 'todo'
        ? t.today.todoTasks
        : memo.type === 'idea'
        ? t.today.todoIdeas
        : t.today.todoMemos;
    const text = `[${typeLabel}] ${memo.title}${memo.content ? `\n${memo.content}` : ''}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      showToast(language === 'en' ? 'Copied to clipboard' : language === 'ja' ? 'コピーしました' : '클립보드에 복사되었습니다! 📋');
    }
  };

  // Export Todo: Kakao (Clean text)
  const handleShareKakao = (memo: IdeaMemo) => {
    const appLabel = language === 'en' ? '[MoreHabit]' : language === 'ja' ? '[モアハビット]' : '[모어해빗]';
    const shareText = `${appLabel}\n${memo.title}${memo.content ? `\n${memo.content}` : ''}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(shareText);
      showToast(language === 'en' ? 'Copied for Kakao' : language === 'ja' ? 'カカオ用にコピーしました' : '카카오톡 공유 양식으로 복사되었습니다 💬');
    }
  };

  // Export Todo: Email
  const handleExportEmail = (memo: IdeaMemo) => {
    const mailtoUrl = `mailto:?subject=${encodeURIComponent(memo.title)}&body=${encodeURIComponent(
      memo.content ? `${memo.title}\n\n${memo.content}` : memo.title
    )}`;
    window.open(mailtoUrl, '_blank');
  };

  // Export Todo: Print / PDF (Only checked / completed tasks)
  const handlePrintPdf = () => {
    const checked = memos.filter((m) => m.completed && !m.deletedAt);
    if (checked.length === 0) {
      showToast(t.today.noCheckedPdf || '체크(완료)된 할일이 없습니다. 완료한 할일을 먼저 체크해주세요!');
      return;
    }

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      window.print();
      return;
    }

    const titleText =
      language === 'en'
        ? 'MoreHabit - Completed Tasks'
        : language === 'ja'
        ? 'MoreHabit - 完了タスク一覧'
        : 'MoreHabit - 완료된 할일 목록';
    const dateStr = new Date().toLocaleString();
    const countStr =
      language === 'en'
        ? `${checked.length} completed items`
        : language === 'ja'
        ? `全${checked.length}件完了`
        : `총 ${checked.length}개 완료`;

    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${titleText}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 32px; color: #1e293b; max-width: 680px; margin: 0 auto; line-height: 1.5; }
    h1 { font-size: 22px; margin-bottom: 6px; color: #0f172a; border-bottom: 2px solid #2563eb; padding-bottom: 8px; }
    .sub { font-size: 13px; color: #64748b; margin-bottom: 24px; }
    .item { padding: 12px 16px; margin-bottom: 12px; border: 1px solid #e2e8f0; border-radius: 12px; background: #f8fafc; }
    .item-header { display: flex; align-items: center; gap: 8px; }
    .badge { font-size: 11px; font-weight: bold; padding: 2px 8px; border-radius: 6px; background: #dbeafe; color: #1d4ed8; }
    .title { font-size: 15px; font-weight: bold; text-decoration: line-through; color: #334155; }
    .content { margin-top: 8px; font-size: 13px; color: #475569; white-space: pre-wrap; padding-left: 28px; }
    .check { color: #2563eb; font-weight: bold; font-size: 16px; }
    .date { font-size: 11px; color: #94a3b8; margin-left: auto; }
    @media print {
      body { padding: 0; }
    }
  </style>
</head>
<body>
  <h1>✅ ${titleText}</h1>
  <div class="sub">${dateStr} · ${countStr}</div>
  ${checked
    .map(
      (item) => `
    <div class="item">
      <div class="item-header">
        <span class="check">☑</span>
        <span class="badge">${item.type === 'todo' ? '할일' : item.type === 'idea' ? '아이디어' : '메모'}</span>
        <span class="title">${item.title}</span>
        <span class="date">${new Date(item.createdAt).toLocaleDateString()}</span>
      </div>
      ${item.content ? `<div class="content">${item.content}</div>` : ''}
    </div>
  `
    )
    .join('')}
  <script>
    window.onload = function() {
      window.print();
    };
  </script>
</body>
</html>`;

    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
  };

  // Filtered To-Dos (Including trash filter)
  const filteredMemos = useMemo(() => {
    if (todoFilter === 'trash') {
      return memos.filter((m) => !!m.deletedAt);
    }
    const nonDeleted = memos.filter((m) => !m.deletedAt);
    if (todoFilter === 'all') return nonDeleted;
    return nonDeleted.filter((m) => m.type === todoFilter);
  }, [memos, todoFilter]);

  // Compute 7-day strip based on current date
  const weekDates = useMemo(() => {
    return getWeekDates(new Date());
  }, []);

  // Filter routines scheduled for selected date
  const scheduledRoutines = useMemo(() => {
    return (routines || []).filter((r) => isRoutineScheduledForDate(r, selectedDateKey));
  }, [routines, selectedDateKey]);

  const stats = useMemo(() => {
    return getDailyStats(routines || [], logs || [], selectedDateKey);
  }, [routines, logs, selectedDateKey]);

  // Calculate XP earned
  const totalXpEarned = useMemo(() => {
    return scheduledRoutines.reduce((sum, r) => {
      const isDone = logs.some((l) => l.routineId === r.id && l.date === selectedDateKey && l.completed);
      return isDone ? sum + (r.xp || 40) : sum;
    }, 0);
  }, [scheduledRoutines, logs, selectedDateKey]);

  // Sorter: Checked items first (User Request 7), then priority, time, order
  const sortRoutines = (list: Routine[]) => {
    return [...list].sort((a, b) => {
      const aDone = Boolean(logs.some((l) => l.routineId === a.id && l.date === selectedDateKey && l.completed));
      const bDone = Boolean(logs.some((l) => l.routineId === b.id && l.date === selectedDateKey && l.completed));

      if (aDone !== bDone) {
        return aDone ? -1 : 1; // Completed items at top
      }

      const priorityWeight: Record<string, number> = { high: 3, medium: 2, low: 1 };
      const weightA = priorityWeight[a.priority || 'medium'] || 2;
      const weightB = priorityWeight[b.priority || 'medium'] || 2;
      if (weightA !== weightB) {
        return weightB - weightA;
      }

      const timeA = a.reminderTime || '99:99';
      const timeB = b.reminderTime || '99:99';
      const timeDiff = timeA.localeCompare(timeB);
      if (timeDiff !== 0) return timeDiff;

      return (a.order || 0) - (b.order || 0);
    });
  };

  // Partition routines by time of day
  const morningRoutines = useMemo(() => {
    return sortRoutines(scheduledRoutines.filter((r) => r.timeOfDay === 'morning'));
  }, [scheduledRoutines, logs, selectedDateKey]);

  const afternoonRoutines = useMemo(() => {
    return sortRoutines(scheduledRoutines.filter((r) => r.timeOfDay === 'afternoon'));
  }, [scheduledRoutines, logs, selectedDateKey]);

  const nightRoutines = useMemo(() => {
    return sortRoutines(scheduledRoutines.filter((r) => r.timeOfDay === 'night' || r.timeOfDay === 'evening'));
  }, [scheduledRoutines, logs, selectedDateKey]);

  const anytimeRoutines = useMemo(() => {
    return sortRoutines(scheduledRoutines.filter((r) => r.timeOfDay === 'anytime'));
  }, [scheduledRoutines, logs, selectedDateKey]);

  const pick = (ko: string, en: string, ja: string) => (language === 'en' ? en : language === 'ja' ? ja : ko);

  const dayNames = getDayNamesForLanguage(language);
  const dayLabels: { [key: number]: string } = {
    0: dayNames[0],
    1: dayNames[1],
    2: dayNames[2],
    3: dayNames[3],
    4: dayNames[4],
    5: dayNames[5],
    6: dayNames[6],
  };

  const isToday = isDateToday(selectedDateKey);

  // Checkbox toggle
  const handleCheckboxClick = (routineId: string) => {
    const isCurrentlyDone = logs.some(
      (l) => l.date === selectedDateKey && l.routineId === routineId && l.completed
    );
    const activeRoutines = routines.filter((r) => !r.archived);
    const completedCount = activeRoutines.filter((r) =>
      logs.some((l) => l.routineId === r.id && l.date === selectedDateKey && l.completed)
    ).length;

    if (!isCurrentlyDone && completedCount + 1 >= activeRoutines.length && activeRoutines.length > 0) {
      setIsAllDoneModalOpen(true);
    }
    onToggleComplete(routineId, selectedDateKey);
  };

  // Helper to render routine item
  const renderRoutineCard = (routine: Routine) => {
    const log = logs.find((l) => l.routineId === routine.id && l.date === selectedDateKey);
    const isCompleted = Boolean(log?.completed);
    const category = categories.find((c) => c.id === routine.categoryId);
    const isMenuOpen = menuOpenRoutineId === routine.id;

    return (
      <article
        key={routine.id}
        className={`w-full rounded-2xl p-4 flex items-center justify-between gap-3 transition-all relative ${
          isCompleted
            ? 'bg-surface-container-low/70 border border-surface-container/60 hover:bg-surface-container-low'
            : 'bg-surface-container-lowest border-l-4 border-l-primary border border-surface-container/80 shadow-[0_3px_16px_-2px_rgba(29,78,216,0.06)]'
        }`}
      >
        <div className="flex-1 min-w-0 pr-2">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-lg leading-none shrink-0">{routine.emoji}</span>
            <span
              className="font-extrabold text-xs px-2.5 py-0.5 rounded-md"
              style={{
                backgroundColor: category ? `${category.color}15` : '#e2e8f0',
                color: category?.color || '#475569',
              }}
            >
              {category?.name || '습관'}
            </span>
            {routine.reminderTime && (
              <span className="text-xs text-tertiary font-semibold flex items-center gap-0.5">
                <span className="material-symbols-outlined text-[15px]">alarm</span>
                {routine.reminderTime}
              </span>
            )}
            {routine.tag && (
              <span className="text-xs font-extrabold px-1.5 py-0.5 rounded-md bg-blue-50 text-blue-700">
                {routine.tag}
              </span>
            )}
            <span className="text-xs text-secondary font-extrabold">
              +{routine.xp || 40}XP
            </span>
          </div>

          <h3
            className={`font-black text-base mt-1 break-keep leading-snug ${
              isCompleted ? 'line-through text-outline' : 'text-on-surface'
            }`}
          >
            {routine.title}
          </h3>

          {log?.note && (
            <p className="text-sm text-tertiary mt-1 italic line-clamp-1 flex items-center gap-1">
              <span>💬</span>
              <span>"{log.note}"</span>
            </p>
          )}
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2 shrink-0 relative">
          {/* Action Menu */}
          <div className="relative">
            <button
              onClick={() => setMenuOpenRoutineId(isMenuOpen ? null : routine.id)}
              className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors ${
                log?.note
                  ? 'bg-secondary-fixed text-secondary'
                  : 'bg-surface-container-low hover:bg-surface-container text-tertiary'
              }`}
              title={language === 'en' ? 'Options (Memo/Edit/Delete)' : language === 'ja' ? 'オプション（メモ/編集/削除）' : '옵션 메뉴 (메모/수정/삭제)'}
            >
              <span className="material-symbols-outlined text-[19px]">
                {log?.note ? 'edit_note' : 'more_vert'}
              </span>
            </button>

            {isMenuOpen && (
              <div className="absolute right-0 top-10 z-50 w-36 bg-surface-container-lowest rounded-xl shadow-lg border border-surface-container p-1 flex flex-col gap-0.5">
                <button
                  onClick={() => {
                    setMenuOpenRoutineId(null);
                    onOpenMemo(routine.id);
                  }}
                  className="w-full px-3 py-2 text-left text-xs font-bold text-on-surface hover:bg-surface-container-low rounded-lg flex items-center gap-2 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[17px] text-tertiary">
                    edit_note
                  </span>
                  <span>{t.today.memoTitle}</span>
                </button>

                <button
                  onClick={() => {
                    setMenuOpenRoutineId(null);
                    onEditRoutine(routine);
                  }}
                  className="w-full px-3 py-2 text-left text-xs font-bold text-on-surface hover:bg-surface-container-low rounded-lg flex items-center gap-2 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[17px] text-tertiary">edit</span>
                  <span>{t.common.edit}</span>
                </button>

                <button
                  onClick={() => {
                    setMenuOpenRoutineId(null);
                    setRoutineToDelete(routine);
                  }}
                  className="w-full px-3 py-2 text-left text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-lg flex items-center gap-2 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[17px] text-rose-500">delete</span>
                  <span>{t.common.delete}</span>
                </button>
              </div>
            )}
          </div>

          {/* Toggle Complete Checkbox */}
          <button
            onClick={() => handleCheckboxClick(routine.id)}
            className={`w-11 h-11 rounded-full flex items-center justify-center transition-all active:scale-90 cursor-pointer ${
              isCompleted
                ? 'bg-primary text-white shadow-xs'
                : 'border-2 border-outline-variant hover:border-primary hover:bg-primary-fixed/20 text-transparent'
            }`}
            title={isCompleted ? (language === 'en' ? 'Undo Complete' : language === 'ja' ? '完了取消' : '완료 취소') : (language === 'en' ? 'Mark Complete' : language === 'ja' ? '完了チェック' : '완료 체크')}
          >
            <span
              className={`material-symbols-outlined text-[24px] font-black ${
                isCompleted ? 'text-white' : 'opacity-0 hover:opacity-40 text-primary'
              }`}
            >
              check
            </span>
          </button>
        </div>
      </article>
    );
  };

  // Helper to render time block
  const renderTimeBlock = (
    title: string,
    timeRange: string,
    timeOfDayKey: TimeOfDay,
    blockRoutines: Routine[]
  ) => {
    const completedCount = blockRoutines.filter((r) =>
      logs.some((l) => l.routineId === r.id && l.date === selectedDateKey && l.completed)
    ).length;
    const totalCount = blockRoutines.length;
    const isAllDone = totalCount > 0 && completedCount === totalCount;
    const percent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

    return (
      <section className="bg-surface-container-lowest/90 rounded-2xl p-4 shadow-[0_4px_20px_-2px_rgba(29,78,216,0.05)] border border-surface-container/70 flex flex-col gap-3">
        <div className="flex items-center justify-between pb-2.5 border-b border-surface-container/50">
          <div className="flex flex-col">
            <h3 className="font-extrabold text-base text-on-surface tracking-tight">
              {title}
            </h3>
            <span className="text-xs text-tertiary font-semibold mt-0.5">
              {timeRange}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {totalCount > 0 ? (
              <span
                className={`text-xs font-bold px-3 py-1 rounded-full ${
                  isAllDone
                    ? 'bg-primary text-white shadow-2xs'
                    : completedCount > 0
                    ? 'bg-primary-fixed text-primary'
                    : 'bg-surface-container text-tertiary'
                }`}
              >
                {isAllDone ? (language === 'en' ? 'All Done' : language === 'ja' ? '全達成' : '전체 완료') : (language === 'en' ? `${completedCount}/${totalCount} Done` : language === 'ja' ? `${completedCount}/${totalCount} 完了` : `${completedCount}/${totalCount} 완료`)}
              </span>
            ) : null}

            <button
              onClick={() => onOpenAddModal(timeOfDayKey)}
              className="text-xs text-primary hover:text-primary-container font-semibold p-1.5 hover:bg-surface-container-low rounded-lg transition cursor-pointer"
              title={language === 'en' ? `Add ${title}` : language === 'ja' ? `${title}を追加` : `${title} 추가`}
            >
              <span className="material-symbols-outlined text-[19px]">add</span>
            </button>
          </div>
        </div>

        {totalCount > 0 && (
          <div className="w-full h-1.5 bg-surface-container-low rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-500 rounded-full"
              style={{ width: `${percent}%` }}
            ></div>
          </div>
        )}

        {totalCount === 0 ? (
          <button
            onClick={() => onOpenAddModal(timeOfDayKey)}
            className="w-full py-4 rounded-xl border border-dashed border-surface-container-high hover:border-primary/50 text-tertiary hover:text-primary transition-colors flex items-center justify-center gap-2 text-sm font-medium bg-surface/30 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">add_circle</span>
            <span>{t.today.addNewRoutine}</span>
          </button>
        ) : (
          <div className="flex flex-col gap-2">
            {blockRoutines.map((routine) => renderRoutineCard(routine))}
          </div>
        )}
      </section>
    );
  };

  return (
    <div className="flex flex-col w-full pb-36 gap-space-lg select-none">
      {/* Toast Feedback */}
      {toastMessage && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-full bg-slate-900/90 text-white text-xs font-bold shadow-lg backdrop-blur-md flex items-center gap-2 animate-bounce">
          <span>✨</span>
          <span className="break-keep">{toastMessage}</span>
        </div>
      )}

      {/* Date Header Strip */}
      <section className="bg-surface-container-lowest rounded-2xl p-3 sm:p-4 shadow-[0_4px_24px_-4px_rgba(29,78,216,0.06)] border border-surface-container/60">
        <div className="flex items-center justify-between pb-3 border-b border-surface-container/50">
          <div className="flex items-center gap-2">
            <span className="text-lg">📅</span>
            <div>
              <h2 className="text-lg sm:text-lg font-black text-[#0f2e7a] tracking-tight">
                {selectedDateKey.replace(/-/g, '. ')}
              </h2>
              <span className="text-xs sm:text-xs text-tertiary font-bold">
                {isToday ? (language === 'en' ? "Today's Status" : language === 'ja' ? '今日の達成状況' : '오늘의 실천 현황') : (language === 'en' ? 'View Past Record' : language === 'ja' ? '過去の記録' : '기록 조회 모드')}
              </span>
            </div>
          </div>

          {!isToday && (
            <button
              onClick={() => onSelectDate(new Date().toISOString().slice(0, 10))}
              className="text-xs sm:text-xs font-black text-primary bg-primary-fixed/60 hover:bg-primary-fixed px-3 py-1.5 rounded-xl transition cursor-pointer shrink-0"
            >
              {language === 'en' ? 'Go to Today' : language === 'ja' ? '今日へ移動' : '오늘로 이동'}
            </button>
          )}
        </div>

        {/* Weekly Day Selector Strip (Responsive Grid for 100% Mobile Visibility) */}
        <div className="grid grid-cols-7 gap-1 pt-2 w-full">
          {weekDates.map((item: WeekDateItem) => {
            const dateObj = new Date(item.date);
            const dayOfWeek = dateObj.getDay();
            const label = dayLabels[dayOfWeek];
            const isSelected = item.key === selectedDateKey;
            const isCurrentToday = isDateToday(item.key);

            const dayStats = getDailyStats(routines, logs, item.key);
            const isAllDone = dayStats.totalRoutines > 0 && dayStats.percentage === 100;
            const isPartDone = dayStats.percentage > 0;

            return (
              <button
                key={item.key}
                onClick={() => onSelectDate(item.key)}
                className={`flex flex-col items-center justify-center w-full py-1.5 px-0.5 rounded-xl transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-blue-50/90 border border-blue-300/80 shadow-2xs'
                    : 'bg-transparent border border-transparent hover:bg-slate-100/70'
                }`}
              >
                <span
                  className={`text-xs sm:text-xs font-black mb-1 ${
                    isSelected
                      ? 'text-primary font-black'
                      : dayOfWeek === 0
                      ? 'text-rose-500'
                      : dayOfWeek === 6
                      ? 'text-blue-500'
                      : 'text-slate-500'
                  }`}
                >
                  {label}
                </span>

                <div
                  className={`w-7.5 h-7.5 sm:w-8.5 sm:h-8.5 rounded-full flex items-center justify-center text-xs sm:text-sm font-black transition-all mx-auto ${
                    isSelected
                      ? 'bg-primary text-white shadow-xs'
                      : isCurrentToday
                      ? 'border-2 border-primary text-primary bg-white'
                      : 'bg-slate-100 text-slate-800'
                  }`}
                >
                  {item.day}
                </div>

                <div className="h-2 flex items-center justify-center mt-0.5">
                  {isAllDone ? (
                    <span className="w-1.5 h-1.5 rounded-full bg-primary" title="100% 완료"></span>
                  ) : isPartDone ? (
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-400" title={`${dayStats.percentage}% 달성`}></span>
                  ) : (
                    <span className="w-1 h-1 rounded-full bg-transparent"></span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* TOP TABS: 습관 vs 할일 (User Request 5 & Image 2) */}
      <div className="flex rounded-2xl bg-slate-200/80 p-1 select-none">
        <button
          onClick={() => setMainTab('habits')}
          className={`flex-1 py-3 text-center rounded-xl text-base font-black transition-all cursor-pointer ${
            mainTab === 'habits'
              ? 'bg-white text-primary shadow-xs'
              : 'text-slate-600 hover:text-slate-900 font-extrabold'
          }`}
        >
          {t.today.habitsTab}
        </button>
        <button
          onClick={() => setMainTab('todos')}
          className={`flex-1 py-3 text-center rounded-xl text-base font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
            mainTab === 'todos'
              ? 'bg-white text-primary shadow-xs'
              : 'text-slate-600 hover:text-slate-900 font-extrabold'
          }`}
        >
          <span>{t.today.todosTab}</span>
          {memos.length > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-xs font-black">
              {memos.length}
            </span>
          )}
        </button>
      </div>

      {/* ============================================================== */}
      {/* TAB CONTENT 1: 습관 (Habits / Routines) */}
      {/* ============================================================== */}
      {mainTab === 'habits' && (
        <>

          {/* 100% All Habits Completed Celebration Card */}
          {stats.totalRoutines > 0 && stats.percentage === 100 && (
            <section
              onClick={() => setIsAllDoneModalOpen(true)}
              className="bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 text-white rounded-2xl p-4 shadow-[0_8px_24px_-4px_rgba(29,78,216,0.3)] flex items-center justify-between gap-3 cursor-pointer active:scale-[0.99] transition-all"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-13 h-13 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0 border border-white/25">
                  <MobitCharacter mood="proud" className="w-12 h-12" />
                </div>
                <div className="flex flex-col min-w-0 justify-center">
                  <h3 className="text-base font-black text-white leading-snug break-keep">
                    {language === 'en' ? 'All Habits Cleared Today' : language === 'ja' ? '今日の習慣を完全達成' : '오늘 습관 완벽 달성'}
                  </h3>
                </div>
              </div>
              <span className="material-symbols-outlined text-white/80 text-[24px] shrink-0">
                chevron_right
              </span>
            </section>
          )}

          {/* Routine Category Filter Tabs */}
          <section className="flex flex-col gap-space-sm">
            <div className="flex items-center gap-space-xs overflow-x-auto no-scrollbar py-0.5">
              <button
                onClick={() => setSelectedFilter('all')}
                className={`px-4.5 py-2.5 rounded-full text-sm transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
                  selectedFilter === 'all'
                    ? 'bg-primary text-white font-black shadow-xs'
                    : 'bg-surface-container-low text-on-surface-variant hover:text-on-surface font-extrabold'
                }`}
              >
                <span className="break-keep">{t.today.filterAll}</span>
                <span
                  className={`w-4.5 h-4.5 rounded-full text-xs flex items-center justify-center font-black ${
                    selectedFilter === 'all'
                      ? 'bg-white text-primary'
                      : 'bg-surface-container-highest text-on-surface-variant'
                  }`}
                >
                  {scheduledRoutines.length}
                </span>
              </button>

              <button
                onClick={() => setSelectedFilter('morning')}
                className={`px-4.5 py-2.5 rounded-full text-sm transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
                  selectedFilter === 'morning'
                    ? 'bg-primary text-white font-black shadow-xs'
                    : 'bg-surface-container-low text-on-surface-variant hover:text-on-surface font-extrabold'
                }`}
              >
                <span className="break-keep">{t.today.filterMorning}</span>
                <span
                  className={`w-4.5 h-4.5 rounded-full text-xs flex items-center justify-center font-black ${
                    selectedFilter === 'morning'
                      ? 'bg-white text-primary'
                      : 'bg-surface-container-highest text-on-surface-variant'
                  }`}
                >
                  {morningRoutines.length}
                </span>
              </button>

              <button
                onClick={() => setSelectedFilter('afternoon')}
                className={`px-4.5 py-2.5 rounded-full text-sm transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
                  selectedFilter === 'afternoon'
                    ? 'bg-primary text-white font-black shadow-xs'
                    : 'bg-surface-container-low text-on-surface-variant hover:text-on-surface font-extrabold'
                }`}
              >
                <span className="break-keep">{t.today.filterAfternoon}</span>
                <span
                  className={`w-4.5 h-4.5 rounded-full text-xs flex items-center justify-center font-black ${
                    selectedFilter === 'afternoon'
                      ? 'bg-white text-primary'
                      : 'bg-surface-container-highest text-on-surface-variant'
                  }`}
                >
                  {afternoonRoutines.length}
                </span>
              </button>

              <button
                onClick={() => setSelectedFilter('night')}
                className={`px-4.5 py-2.5 rounded-full text-sm transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
                  selectedFilter === 'night'
                    ? 'bg-primary text-white font-black shadow-xs'
                    : 'bg-surface-container-low text-on-surface-variant hover:text-on-surface font-extrabold'
                }`}
              >
                <span className="break-keep">{t.today.filterNight}</span>
                <span
                  className={`w-4.5 h-4.5 rounded-full text-xs flex items-center justify-center font-black ${
                    selectedFilter === 'night'
                      ? 'bg-white text-primary'
                      : 'bg-surface-container-highest text-on-surface-variant'
                  }`}
                >
                  {nightRoutines.length}
                </span>
              </button>
            </div>
          </section>

          {/* Time-Partitioned Routine Blocks */}
          {morningRoutines.length === 0 &&
          afternoonRoutines.length === 0 &&
          nightRoutines.length === 0 &&
          anytimeRoutines.length === 0 ? (
            <div className="bg-surface-container-lowest rounded-3xl p-8 border border-surface-container/70 shadow-xs flex flex-col items-center text-center my-2">
              <div className="w-20 h-20 bg-blue-50/90 rounded-2xl flex items-center justify-center mb-3">
                <MobitCharacter mood="happy" className="w-16 h-16" />
              </div>
              <h4 className="text-base font-black text-slate-800 mb-1">
                {t.today.emptyTitle}
              </h4>
              <p className="text-xs text-slate-500 max-w-xs mb-5 break-keep">
                {t.today.emptySub}
              </p>
              <button
                onClick={() => onOpenAddModal()}
                className="inline-flex items-center gap-2 bg-primary hover:bg-blue-700 text-white font-black text-sm px-5 py-2.5 rounded-xl shadow-xs active:scale-95 transition cursor-pointer"
              >
                <span className="material-symbols-outlined text-[19px]">add_circle</span>
                <span>{t.today.addHabitBtn}</span>
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {(selectedFilter === 'all' || selectedFilter === 'morning') &&
                renderTimeBlock(t.today.morningBlock, '06:00 ~ 12:00', 'morning', morningRoutines)}

              {(selectedFilter === 'all' || selectedFilter === 'afternoon') &&
                renderTimeBlock(t.today.afternoonBlock, '12:00 ~ 18:00', 'afternoon', afternoonRoutines)}

              {(selectedFilter === 'all' || selectedFilter === 'night') &&
                renderTimeBlock(t.today.nightBlock, '18:00 ~ 24:00', 'night', nightRoutines)}

              {selectedFilter === 'all' &&
                anytimeRoutines.length > 0 &&
                renderTimeBlock(t.today.anytimeBlock, language === 'en' ? 'Anytime during the day' : language === 'ja' ? 'いつでも' : '하루 중 자유롭게', 'anytime', anytimeRoutines)}
            </div>
          )}

          {/* 오늘의 일상 기록 (Daily Life Trackers) */}
          <section className="mt-6 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-black text-slate-900 tracking-tight">
                {pick('오늘의 일상 기록', "Today's Logs", '今日の記録')}
              </h3>
              <button
                type="button"
                onClick={() => setIsTrackerManagerOpen(!isTrackerManagerOpen)}
                className="h-9 px-3 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-100 flex items-center gap-1 transition cursor-pointer active:scale-95"
              >
                <span className="material-symbols-outlined text-[18px]">{isTrackerManagerOpen ? 'check' : 'tune'}</span>
                <span>{isTrackerManagerOpen ? pick('완료', 'Done', '完了') : pick('편집', 'Edit', '編集')}</span>
              </button>
            </div>

            {isTrackerManagerOpen && (
              <div className="flex flex-wrap gap-2">
                {TRACKING_DEFINITIONS.map((def) => {
                  const isActive = activeTrackerIds.includes(def.id);
                  return (
                    <button
                      key={def.id}
                      type="button"
                      onClick={() => {
                        toggleActiveTracker(def.id);
                        setActiveTrackerIds(getActiveTrackerIds());
                      }}
                      className={`h-9 px-3 rounded-full text-sm font-bold flex items-center gap-1 transition active:scale-95 cursor-pointer border ${
                        isActive ? 'bg-primary text-white border-primary' : 'bg-white text-slate-600 border-slate-200'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[16px]">{isActive ? 'check' : 'add'}</span>
                      <span>{trackerTitle(def, language)}</span>
                    </button>
                  );
                })}
              </div>
            )}

            {activeTrackers.length === 0 ? (
              <button
                type="button"
                onClick={() => setIsTrackerManagerOpen(true)}
                className="w-full py-5 rounded-2xl bg-white border border-dashed border-slate-300 text-sm font-bold text-slate-500 flex items-center justify-center gap-1 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">add</span>
                <span>{pick('기록 항목 추가', 'Add a log', '記録を追加')}</span>
              </button>
            ) : (
              <div className="space-y-2.5">
                {activeTrackers.map((def) => {
                  const val = trackingLogs[selectedDateKey]?.[def.id]?.value;
                  const hasValue = val !== undefined && val !== '';
                  const unit = trackerUnit(def, language);
                  const isZeroSpend = def.inputType === 'spending' && hasValue && Number(val) === 0;
                  const draft = editingTrackerInput[def.id] ?? (hasValue && !isZeroSpend ? String(val) : '');
                  const setDraft = (v: string) => setEditingTrackerInput((prev) => ({ ...prev, [def.id]: v }));
                  const saveDraft = () => {
                    const raw = draft.trim();
                    if (raw !== '') handleSaveTrackingValue(def.id, def.inputType === 'text' ? raw : Number(raw));
                  };
                  const display = !hasValue
                    ? ''
                    : def.inputType === 'condition'
                    ? conditionLabel(String(val), language)
                    : isZeroSpend
                    ? pick('무지출', 'No spend', '支出なし')
                    : def.inputType === 'water'
                    ? `${Number(val).toLocaleString()} / 2,000 ml`
                    : def.inputType === 'text'
                    ? ''
                    : `${Number(val).toLocaleString()} ${unit}`;
                  const chip =
                    'h-10 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold cursor-pointer active:scale-95 transition shrink-0';
                  const field =
                    'flex-1 min-w-0 h-10 px-3 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-900 focus:outline-none focus:border-primary focus:bg-white transition';
                  const saveBtn = (
                    <button
                      type="button"
                      onClick={saveDraft}
                      className="h-10 px-4 rounded-xl bg-primary hover:bg-blue-700 text-white text-sm font-bold cursor-pointer active:scale-95 transition shrink-0"
                    >
                      {pick('저장', 'Save', '保存')}
                    </button>
                  );
                  const numberField = (step: string) => (
                    <input
                      type="number"
                      inputMode="decimal"
                      step={step}
                      value={draft}
                      onChange={(e) => setDraft(e.target.value)}
                      placeholder={unit}
                      className={field}
                    />
                  );

                  return (
                    <div key={def.id} className="p-4 rounded-2xl bg-white border border-slate-200/80 space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="w-9 h-9 rounded-xl bg-blue-50 text-primary flex items-center justify-center shrink-0">
                            <span className="material-symbols-outlined text-[20px]">{def.icon}</span>
                          </span>
                          <h4 className="text-base font-bold text-slate-900 truncate">{trackerTitle(def, language)}</h4>
                        </div>
                        {display && <span className="text-base font-black text-primary shrink-0">{display}</span>}
                      </div>

                      {def.inputType === 'condition' && (
                        <div className="grid grid-cols-5 gap-1.5">
                          {Object.entries(CONDITION_EMOJIS).map(([key, item]) => {
                            const isSelected = val === key;
                            return (
                              <button
                                key={key}
                                type="button"
                                onClick={() => handleSaveTrackingValue(def.id, key)}
                                className={`py-2 rounded-xl flex flex-col items-center gap-0.5 transition cursor-pointer active:scale-95 border ${
                                  isSelected ? 'bg-blue-50 border-primary' : 'bg-slate-50 border-transparent hover:bg-slate-100'
                                }`}
                              >
                                <span className="text-base leading-none select-none">{item.emoji}</span>
                                <span className={`text-xs font-bold ${isSelected ? 'text-primary' : 'text-slate-500'}`}>
                                  {conditionLabel(key, language)}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      )}

                      {def.inputType === 'water' && (
                        <>
                          <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                            <div
                              className="h-full bg-primary rounded-full transition-all duration-300"
                              style={{ width: `${Math.min(100, Math.round((Number(val || 0) / 2000) * 100))}%` }}
                            />
                          </div>
                          <div className="flex items-center gap-2">
                            <button type="button" onClick={() => handleSaveTrackingValue(def.id, Math.max(0, Number(val || 0) - 250))} className={chip}>
                              −250
                            </button>
                            <button
                              type="button"
                              onClick={() => handleSaveTrackingValue(def.id, Number(val || 0) + 250)}
                              className="flex-1 h-10 rounded-xl bg-blue-50 hover:bg-blue-100 text-primary text-sm font-bold cursor-pointer active:scale-95 transition"
                            >
                              +250 ml
                            </button>
                            <button
                              type="button"
                              onClick={() => handleSaveTrackingValue(def.id, Number(val || 0) + 500)}
                              className="flex-1 h-10 rounded-xl bg-blue-50 hover:bg-blue-100 text-primary text-sm font-bold cursor-pointer active:scale-95 transition"
                            >
                              +500 ml
                            </button>
                          </div>
                        </>
                      )}

                      {def.inputType === 'spending' && (
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleSaveTrackingValue(def.id, 0)}
                            className={`h-10 px-3 rounded-xl text-sm font-bold cursor-pointer active:scale-95 transition shrink-0 ${
                              isZeroSpend ? 'bg-primary text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                            }`}
                          >
                            {pick('무지출', 'No spend', '支出なし')}
                          </button>
                          {numberField('1')}
                          {saveBtn}
                        </div>
                      )}

                      {def.inputType === 'number' && (
                        <div className="flex items-center gap-2">
                          {numberField(def.id === 'track-weight' ? '0.1' : '1')}
                          {def.id === 'track-weight' && hasValue && (
                            <>
                              <button type="button" onClick={() => handleSaveTrackingValue(def.id, Number((Number(val) - 0.1).toFixed(1)))} className={chip}>
                                −0.1
                              </button>
                              <button type="button" onClick={() => handleSaveTrackingValue(def.id, Number((Number(val) + 0.1).toFixed(1)))} className={chip}>
                                +0.1
                              </button>
                            </>
                          )}
                          {def.id === 'track-steps' && (
                            <button type="button" onClick={() => handleSaveTrackingValue(def.id, Number(val || 0) + 1000)} className={chip}>
                              +1,000
                            </button>
                          )}
                          {saveBtn}
                        </div>
                      )}

                      {def.inputType === 'sleep' && (
                        <div className="flex items-center gap-2">
                          {numberField('0.5')}
                          <button type="button" onClick={() => handleSaveTrackingValue(def.id, Math.max(0, Number((Number(val || 7.5) - 0.5).toFixed(1))))} className={chip}>
                            −0.5
                          </button>
                          <button type="button" onClick={() => handleSaveTrackingValue(def.id, Number((Number(val || 7.5) + 0.5).toFixed(1)))} className={chip}>
                            +0.5
                          </button>
                          {saveBtn}
                        </div>
                      )}

                      {def.inputType === 'text' && (
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={draft}
                            onChange={(e) => setDraft(e.target.value)}
                            placeholder={pick('오늘의 한 줄', 'One line for today', '今日の一行')}
                            className={field}
                          />
                          {saveBtn}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </>
      )}

      {/* ============================================================== */}
      {/* TAB CONTENT 2: 할일 & 아이디어 (To-Dos & Memos) */}
      {/* ============================================================== */}
      {mainTab === 'todos' && (
        <section className="flex flex-col gap-4">
          {/* Quick Add To-Do Box (Multiline description support, Enter inserts newline) */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleAddTodo();
            }}
            className="bg-white rounded-3xl p-4 border border-blue-100/90 shadow-2xs flex flex-col gap-3"
          >
            <div className="flex items-center gap-2">
              <span className="text-lg">📝</span>
              <span className="text-base font-black text-slate-900">
                {language === 'en' ? 'New Task / Idea' : language === 'ja' ? '新しいやること / アイデア' : '새로운 할일 / 아이디어'}
              </span>
            </div>

            <div className="flex items-start gap-2 w-full">
              <select
                value={newTodoType}
                onChange={(e) => setNewTodoType(e.target.value as any)}
                className="shrink-0 py-2.5 px-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-slate-700 cursor-pointer mt-0.5"
              >
                <option value="todo">✅ {t.today.todoTasks}</option>
                <option value="idea">💡 {t.today.todoIdeas}</option>
                <option value="memo">📋 {t.today.todoMemos}</option>
              </select>

              <textarea
                ref={todoTextareaRef}
                value={newTodoText}
                onChange={(e) => setNewTodoText(e.target.value)}
                placeholder={t.today.quickTodoPlaceholder || (language === 'en' ? 'Write today\'s task or idea (Enter for newline, Add button to save)' : language === 'ja' ? '今日のやることやアイデアを入力（Enterで改行、追加ボタンで登録）' : '오늘 할일 또는 아이디어를 작성하세요 (Enter는 줄바꿈, 오른쪽 추가 버튼으로 등록)')}
                rows={2}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    // Enter must NOT submit; naturally inserts newline
                    e.stopPropagation();
                  }
                }}
                className="flex-1 min-w-0 py-2 px-3 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white transition resize-none leading-relaxed"
              />

              <button
                type="button"
                onClick={handleAddTodo}
                className="h-10 px-4 rounded-xl bg-primary hover:bg-blue-700 text-white font-black text-sm shrink-0 active:scale-95 transition shadow-xs cursor-pointer mt-0.5"
              >
                {t.common.add}
              </button>
            </div>
          </form>

          {/* Filter Pills & Export Bar */}
          <div className="flex items-center justify-between gap-2 overflow-x-auto no-scrollbar">
            <div className="flex items-center gap-1.5">
              {(['all', 'todo', 'idea', 'memo', 'trash'] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => {
                    setTodoFilter(filter);
                    setOpenMenuTodoId(null);
                  }}
                  className={`px-3.5 py-2 rounded-xl text-sm font-bold transition cursor-pointer shrink-0 ${
                    todoFilter === filter
                      ? filter === 'trash'
                        ? 'bg-rose-600 text-white shadow-xs font-black'
                        : 'bg-primary text-white shadow-xs font-black'
                      : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {filter === 'all'
                    ? t.today.todoAll
                    : filter === 'todo'
                    ? t.today.todoTasks
                    : filter === 'idea'
                    ? t.today.todoIdeas
                    : filter === 'memo'
                    ? t.today.todoMemos
                    : t.today.trashTab}
                </button>
              ))}
            </div>

            <button
              onClick={handlePrintPdf}
              className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50 flex items-center justify-center shrink-0 cursor-pointer shadow-2xs"
              title={language === 'en' ? 'Export checked tasks to PDF' : language === 'ja' ? '完了したタスクのみPDF出力' : '완료(체크)된 할일만 PDF로 추출'}
            >
              <span>PDF</span>
            </button>
          </div>

          {/* Google Keep style Trash Info Banner */}
          {todoFilter === 'trash' && (
            <div className="p-3.5 rounded-2xl bg-slate-100/90 border border-slate-200 flex items-center justify-between gap-2 text-xs text-slate-700">
              <span className="font-medium flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[18px] text-slate-500">info</span>
                <span>{t.today.trashNotice}</span>
              </span>
              {filteredMemos.length > 0 && (
                <button
                  type="button"
                  onClick={() => setIsConfirmEmptyTrash(true)}
                  className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 font-black text-xs shrink-0 transition cursor-pointer"
                >
                  {t.today.emptyTrash}
                </button>
              )}
            </div>
          )}

          {/* To-Do List */}
          <div className="flex flex-col gap-2.5">
            {filteredMemos.length === 0 ? (
              <div className="bg-white rounded-3xl p-8 border border-blue-100/90 text-center flex flex-col items-center">
                <div className="mb-2 flex items-center justify-center">
                  <MobitCharacter mood={todoFilter === 'trash' ? 'rest' : 'memo'} className="w-20 h-20" />
                </div>
                <p className="text-base font-black text-slate-800">
                  {todoFilter === 'trash'
                    ? t.today.trashEmpty
                    : (language === 'en' ? 'No tasks or notes yet' : language === 'ja' ? '登録されたやることやメモがありません' : '등록된 할일이나 메모가 없습니다')}
                </p>
                <p className="text-xs text-slate-500 mt-1 break-keep">
                  {todoFilter === 'trash'
                    ? (language === 'en' ? 'No deleted items. Deleted notes are kept for 7 days.' : language === 'ja' ? '削除された項目はありません。削除したメモは7日間保管されます。' : '삭제된 항목이 없습니다. 삭제한 메모는 7일간 안전하게 보관됩니다.')
                    : (language === 'en' ? 'Record your important tasks and creative ideas freely 💡' : language === 'ja' ? '今日の大切なことやひらめいたアイデアを自由に記録してみてください 💡' : '오늘의 중요한 일이나 번뜩이는 아이디어를 자유롭게 기록해 보세요 💡')}
                </p>
              </div>
            ) : (
              filteredMemos.map((memo) => (
                <div
                  key={memo.id}
                  className={`p-4 rounded-2xl border transition-all flex flex-col gap-2.5 ${
                    memo.completed
                      ? 'bg-slate-50/70 border-slate-200/80 text-slate-400'
                      : 'bg-white border-blue-100/90 shadow-2xs hover:shadow-xs'
                  }`}
                >
                  {/* Top Row: Checkbox + Type Badge & Date + Title + ... Menu */}
                  <div className="flex items-start gap-2.5">
                    {/* Left Checkbox (Hidden in Trash) */}
                    {todoFilter !== 'trash' ? (
                      <button
                        onClick={() => handleToggleTodo(memo.id)}
                        className={`w-6.5 h-6.5 rounded-lg flex items-center justify-center mt-0.5 transition cursor-pointer shrink-0 ${
                          memo.completed
                            ? 'bg-primary text-white shadow-xs'
                            : 'border-2 border-slate-300 hover:border-primary'
                        }`}
                      >
                        {memo.completed && (
                          <span className="material-symbols-outlined text-[17px] font-black">check</span>
                        )}
                      </button>
                    ) : (
                      <div className="w-6.5 h-6.5 rounded-lg bg-slate-100 flex items-center justify-center mt-0.5 text-slate-400 shrink-0">
                        <span className="material-symbols-outlined text-[16px]">delete</span>
                      </div>
                    )}

                    {/* Title & Badge (Full horizontal width) */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                        <span
                          className={`px-2 py-0.5 rounded-md text-xs font-black uppercase ${
                            memo.type === 'todo'
                              ? 'bg-blue-50 text-blue-700'
                              : memo.type === 'idea'
                              ? 'bg-amber-50 text-amber-700'
                              : 'bg-purple-50 text-purple-700'
                          }`}
                        >
                          {memo.type === 'todo'
                            ? t.today.todoTasks
                            : memo.type === 'idea'
                            ? t.today.todoIdeas
                            : t.today.todoMemos}
                        </span>
                        <span className="text-xs text-slate-400 font-semibold">
                          {new Date(memo.createdAt).toLocaleDateString(language === 'ja' ? 'ja-JP' : language === 'en' ? 'en-US' : 'ko-KR', {
                            month: 'numeric',
                            day: 'numeric',
                          })}
                        </span>
                      </div>

                      <h4
                        className={`text-base font-black leading-snug break-keep ${
                          memo.completed ? 'line-through text-slate-400' : 'text-slate-900'
                        }`}
                      >
                        {memo.title}
                      </h4>
                    </div>

                    {/* Actions: In Trash vs Normal ... dropdown */}
                    {todoFilter === 'trash' ? (
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleRestoreTodo(memo.id)}
                          className="px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 font-black text-xs transition cursor-pointer"
                        >
                          {t.today.menuRestore}
                        </button>
                        <button
                          type="button"
                          onClick={() => handlePermanentDeleteTodo(memo.id)}
                          className="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 font-black text-xs transition cursor-pointer"
                        >
                          {t.today.menuPermanentDelete}
                        </button>
                      </div>
                    ) : (
                      <div className="relative shrink-0">
                        <button
                          type="button"
                          onClick={() => setOpenMenuTodoId(openMenuTodoId === memo.id ? null : memo.id)}
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                          title={language === 'en' ? 'More' : language === 'ja' ? 'その他' : '더보기'}
                        >
                          <span className="material-symbols-outlined text-[20px]">more_horiz</span>
                        </button>

                        {/* Text-Only Dropdown (No emojis, fully translated) */}
                        {openMenuTodoId === memo.id && (
                          <div
                            className="absolute right-0 top-9 z-30 min-w-[110px] bg-white rounded-xl shadow-lg border border-slate-200 py-1 flex flex-col text-xs font-bold text-slate-700 animate-in fade-in zoom-in-95 duration-100 select-none"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              type="button"
                              onClick={() => {
                                handleCopyTodo(memo);
                                setOpenMenuTodoId(null);
                              }}
                              className="px-3.5 py-2 text-left hover:bg-slate-50 transition cursor-pointer"
                            >
                              {t.today.menuCopy}
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                handleShareKakao(memo);
                                setOpenMenuTodoId(null);
                              }}
                              className="px-3.5 py-2 text-left hover:bg-slate-50 transition cursor-pointer"
                            >
                              {t.today.menuKakao}
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                handleExportEmail(memo);
                                setOpenMenuTodoId(null);
                              }}
                              className="px-3.5 py-2 text-left hover:bg-slate-50 transition cursor-pointer"
                            >
                              {t.today.menuEmail}
                            </button>
                            <div className="my-1 border-t border-slate-100" />
                            <button
                              type="button"
                              onClick={() => {
                                setTodoToTrashId(memo.id);
                                setOpenMenuTodoId(null);
                              }}
                              className="px-3.5 py-2 text-left text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                            >
                              {t.today.menuDelete}
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Body Content Box (Full Width, clear typography) */}
                  {memo.content && (
                    <div className="ml-9 p-3 rounded-xl bg-slate-50/80 border border-slate-100 text-sm text-slate-700 font-medium whitespace-pre-wrap leading-relaxed break-keep">
                      {memo.content}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </section>
      )}

      {/* Floating Speed Dial Overlay & Action Items (User Request 2 & Image 5) */}
      {isFabOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/45 backdrop-blur-xs transition-opacity animate-fadeIn"
          onClick={() => setIsFabOpen(false)}
        >
          {/* Stacked speed dial buttons directly above the FAB */}
          <div
            className="fixed bottom-36 right-5 z-50 flex flex-col items-end gap-3 select-none"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Option 1: 습관 추가 (Top Item) */}
            <button
              onClick={() => {
                setIsFabOpen(false);
                onOpenAddModal();
              }}
              className="flex items-center gap-3.5 px-4 py-3 rounded-2xl bg-white text-slate-900 shadow-2xl border border-slate-100 hover:bg-slate-50 active:scale-95 transition-all cursor-pointer animate-in fade-in slide-in-from-bottom-4 duration-200"
            >
              <span className="text-sm font-black text-slate-900">{t.today?.addHabitBtn || '습관 추가'}</span>
              <div className="w-9 h-9 rounded-xl bg-blue-50 text-primary flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[20px] font-bold">calendar_today</span>
              </div>
            </button>

            {/* Option 2: 할일 추가 (Bottom Item, right above the FAB) */}
            <button
              onClick={() => {
                setIsFabOpen(false);
                setMainTab('todos');
                setTimeout(() => todoTextareaRef.current?.focus(), 150);
              }}
              className="flex items-center gap-3.5 px-4 py-3 rounded-2xl bg-white text-slate-900 shadow-2xl border border-slate-100 hover:bg-slate-50 active:scale-95 transition-all cursor-pointer animate-in fade-in slide-in-from-bottom-2 duration-150"
            >
              <span className="text-sm font-black text-slate-900">{t.today?.addTodoBtn || '할일 추가'}</span>
              <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[22px] font-bold">check_circle</span>
              </div>
            </button>
          </div>
        </div>
      )}

      {/* Main Bottom-Right Circular Floating Action Button (FAB - Rotates from + to X) */}
      {!isAllDoneModalOpen && (
        <button
          onClick={() => setIsFabOpen(!isFabOpen)}
          className={`fixed bottom-20 right-5 z-50 w-14 h-14 rounded-full flex items-center justify-center shadow-xl active:scale-90 transition-all duration-300 cursor-pointer ${
            isFabOpen
              ? 'bg-slate-900 text-white shadow-slate-900/50'
              : 'bg-primary hover:bg-blue-700 text-white shadow-blue-500/35'
          }`}
          title={isFabOpen ? (t.common?.close || '닫기') : (t.common?.add || '추가')}
        >
          <span
            className={`material-symbols-outlined text-[30px] font-bold transition-transform duration-300 ${
              isFabOpen ? 'rotate-90' : 'rotate-0'
            }`}
          >
            {isFabOpen ? 'close' : 'add'}
          </span>
        </button>
      )}

      {/* All Done Celebration Dialog */}
      <MobitAllDoneModal
        isOpen={isAllDoneModalOpen}
        onClose={() => setIsAllDoneModalOpen(false)}
        userName={userName}
        streakCount={streakCount}
        logs={logs}
        completedCount={stats.completedRoutines}
        totalXp={totalXpEarned}
      />

      {/* Habit Safe Delete Confirmation Dialog */}
      <ConfirmModal
        isOpen={routineToDelete !== null}
        title={t.confirm?.deleteHabitTitle || '습관을 삭제할까요?'}
        itemName={routineToDelete?.title}
        message={t.confirm?.deleteHabitMessage || '이 습관의 기록도 함께 삭제될 수 있습니다.'}
        confirmLabel={t.common?.delete || '삭제'}
        cancelLabel={t.common?.cancel || '취소'}
        onCancel={() => setRoutineToDelete(null)}
        onConfirm={() => {
          if (routineToDelete) {
            onDeleteRoutine(routineToDelete.id);
            setRoutineToDelete(null);
            showToast(language === 'en' ? 'Habit deleted' : language === 'ja' ? '習慣を削除しました' : '습관이 삭제되었습니다.');
          }
        }}
      />

      {/* 1. 휴지통 이동 확인 팝업 */}
      <ConfirmModal
        isOpen={todoToTrashId !== null}
        title={t.confirm?.deleteTaskTitle || '삭제하시겠습니까?'}
        message={t.confirm?.deleteTaskMessage || '선택한 할일이 휴지통으로 이동하며, 7일간 보관 후 영구 삭제됩니다.'}
        confirmLabel={t.common?.delete || '삭제'}
        cancelLabel={t.common?.cancel || '취소'}
        onCancel={() => setTodoToTrashId(null)}
        onConfirm={() => {
          if (todoToTrashId) {
            handleMoveToTrash(todoToTrashId);
            setTodoToTrashId(null);
          }
        }}
      />

      {/* 2. 영구 삭제 확인 팝업 */}
      <ConfirmModal
        isOpen={todoToPermanentId !== null}
        title={t.confirm?.permanentDeleteTitle || '영구 삭제하시겠습니까?'}
        message={t.confirm?.permanentDeleteMessage || '휴지통에서 완전히 삭제되며 다시 복구할 수 없습니다.'}
        confirmLabel={t.today?.menuPermanentDelete || '영구 삭제'}
        cancelLabel={t.common?.cancel || '취소'}
        onCancel={() => setTodoToPermanentId(null)}
        onConfirm={() => {
          if (todoToPermanentId) {
            const next = memos.filter((m) => m.id !== todoToPermanentId);
            persistMemos(next);
            setTodoToPermanentId(null);
            showToast(language === 'en' ? 'Permanently deleted' : language === 'ja' ? '完全に削除しました' : '영구 삭제되었습니다.');
          }
        }}
      />

      {/* 3. 휴지통 비우기 확인 팝업 */}
      <ConfirmModal
        isOpen={isConfirmEmptyTrash}
        title={t.confirm?.emptyTrashTitle || '휴지통을 모두 비우시겠습니까?'}
        message={t.confirm?.emptyTrashMessage || '휴지통에 있는 모든 항목이 영구 삭제됩니다.'}
        confirmLabel={t.confirm?.emptyTrashConfirm || '휴지통 비우기'}
        cancelLabel={t.common?.cancel || '취소'}
        onCancel={() => setIsConfirmEmptyTrash(false)}
        onConfirm={() => {
          handleEmptyTrash();
          setIsConfirmEmptyTrash(false);
        }}
      />
    </div>
  );
};
