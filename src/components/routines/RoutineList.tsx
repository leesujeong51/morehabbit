import React, { useState } from 'react';
import type { Routine, RoutineLog, Category, TimeOfDay } from '../../types/routine';
import { RoutineCard } from './RoutineCard';
import { calculateRoutineStreak } from '../../utils/routineUtils';
import { Sun, Sunset, Moon, Sparkles, Filter, Clock, PlusCircle } from 'lucide-react';


interface RoutineListProps {
  routines: Routine[];
  logs: RoutineLog[];
  categories: Category[];
  selectedDateKey: string;
  onToggleComplete: (routineId: string) => void;
  onOpenMemo: (routineId: string) => void;
  onEdit: (routine: Routine) => void;
  onDelete: (routineId: string) => void;
  onOpenAddModal: () => void;
}

type GroupByMode = 'time' | 'category';

export const RoutineList: React.FC<RoutineListProps> = ({
  routines,
  logs,
  categories,
  selectedDateKey,
  onToggleComplete,
  onOpenMemo,
  onEdit,
  onDelete,
  onOpenAddModal,
}) => {
  const [groupBy, setGroupBy] = useState<GroupByMode>('time');

  const getCategory = (catId: string) => categories.find((c) => c.id === catId);
  const getRoutineLog = (routineId: string) =>
    logs.find((l) => l.routineId === routineId && l.date === selectedDateKey);

  if (routines.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-8 text-center border border-neutral-100 shadow-xs my-4">
        <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto text-2xl mb-3">
          🌱
        </div>
        <h3 className="font-bold text-base text-neutral-800 mb-1">
          오늘 예정된 루틴이 없어요
        </h3>
        <p className="text-xs text-neutral-500 mb-4 max-w-xs mx-auto">
          작고 가벼운 루틴부터 시작해보세요. 물 한 잔 마시기부터 등록해볼까요?
        </p>
        <button
          onClick={onOpenAddModal}
          className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-4 py-2 rounded-xl transition shadow-sm active:scale-95"
        >
          <PlusCircle size={15} />
          <span>첫 루틴 추가하기</span>
        </button>
      </div>
    );
  }

  // Time groupings
  const timeGroups: { key: TimeOfDay; label: string; icon: React.ReactNode }[] = [
    { key: 'morning', label: '아침 루틴', icon: <Sun size={15} className="text-amber-500" /> },
    { key: 'afternoon', label: '낮 루틴', icon: <Sun size={15} className="text-orange-500" /> },
    { key: 'evening', label: '저녁 루틴', icon: <Sunset size={15} className="text-indigo-400" /> },
    { key: 'night', label: '밤 / 취침 전', icon: <Moon size={15} className="text-purple-400" /> },
    { key: 'anytime', label: '언제나 루틴', icon: <Sparkles size={15} className="text-emerald-500" /> },
  ];

  return (
    <div className="space-y-4">
      {/* View Switcher Header */}
      <div className="flex items-center justify-between px-1">
        <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider">
          오늘의 루틴 목록 ({routines.length})
        </span>

        {/* Group By Filter */}
        <div className="flex items-center bg-neutral-100/90 p-0.5 rounded-xl text-xs font-semibold text-neutral-600">
          <button
            onClick={() => setGroupBy('time')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition ${
              groupBy === 'time'
                ? 'bg-white text-neutral-900 shadow-2xs'
                : 'text-neutral-500 hover:text-neutral-800'
            }`}
          >
            <Clock size={12} />
            <span>시간순</span>
          </button>
          <button
            onClick={() => setGroupBy('category')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition ${
              groupBy === 'category'
                ? 'bg-white text-neutral-900 shadow-2xs'
                : 'text-neutral-500 hover:text-neutral-800'
            }`}
          >
            <Filter size={12} />
            <span>카테고리</span>
          </button>

        </div>
      </div>

      {/* Grouped lists */}
      {groupBy === 'time' ? (
        <div className="space-y-4">
          {timeGroups.map((group) => {
            const groupRoutines = routines.filter((r) => r.timeOfDay === group.key);
            if (groupRoutines.length === 0) return null;

            const completedCount = groupRoutines.filter(
              (r) => getRoutineLog(r.id)?.completed === true
            ).length;

            return (
              <div key={group.key} className="space-y-2">
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-neutral-700">
                    {group.icon}
                    <span>{group.label}</span>
                  </div>
                  <span className="text-[11px] font-semibold text-neutral-400">
                    {completedCount} / {groupRoutines.length}
                  </span>
                </div>

                <div className="space-y-2">
                  {groupRoutines.map((routine) => (
                    <RoutineCard
                      key={routine.id}
                      routine={routine}
                      category={getCategory(routine.categoryId)}
                      log={getRoutineLog(routine.id)}
                      streak={calculateRoutineStreak(routine, logs, selectedDateKey)}
                      onToggleComplete={onToggleComplete}
                      onOpenMemo={onOpenMemo}
                      onEdit={onEdit}
                      onDelete={onDelete}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="space-y-4">
          {categories.map((cat) => {
            const catRoutines = routines.filter((r) => r.categoryId === cat.id);
            if (catRoutines.length === 0) return null;

            const completedCount = catRoutines.filter(
              (r) => getRoutineLog(r.id)?.completed === true
            ).length;

            return (
              <div key={cat.id} className="space-y-2">
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-neutral-700">
                    <span>{cat.emoji}</span>
                    <span>{cat.name}</span>
                  </div>
                  <span className="text-[11px] font-semibold text-neutral-400">
                    {completedCount} / {catRoutines.length}
                  </span>
                </div>

                <div className="space-y-2">
                  {catRoutines.map((routine) => (
                    <RoutineCard
                      key={routine.id}
                      routine={routine}
                      category={cat}
                      log={getRoutineLog(routine.id)}
                      streak={calculateRoutineStreak(routine, logs, selectedDateKey)}
                      onToggleComplete={onToggleComplete}
                      onOpenMemo={onOpenMemo}
                      onEdit={onEdit}
                      onDelete={onDelete}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
