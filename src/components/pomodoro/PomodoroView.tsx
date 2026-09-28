import React from 'react';
import type { Routine } from '../../types/routine';
import { PomodoroTimerCard } from './PomodoroTimerCard';

interface PomodoroViewProps {
  routines?: Routine[];
  selectedRoutine?: Routine | null;
  onCompleteRoutine?: (routineId: string) => void;
  onSelectRoutine?: (routine: Routine) => void;
}

export const PomodoroView: React.FC<PomodoroViewProps> = ({
  onCompleteRoutine,
}) => {
  return (
    <div className="flex flex-col w-full pb-10 select-none">
      {/* Grand Pomodoro Studio with Enlarged Dial and Pomodoro Study Technique */}
      <PomodoroTimerCard
        onSessionComplete={() => {
          if (onCompleteRoutine) {
            onCompleteRoutine('');
          }
        }}
      />
    </div>
  );
};

export default PomodoroView;
