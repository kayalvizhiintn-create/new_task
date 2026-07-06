import React from 'react';
import { useStore, INITIAL_STAGES } from '../store/useStore';
import { calculateStageStatus, TIMELINE_STATUS } from '../utils/timelineStatus';
import { cn } from '../utils/cn';
import { CheckCircle2, Circle, ChevronRight, Calendar } from 'lucide-react';

export default function WaterfallFlow({
  currentStage,
  onUpdateStage,
  deadlines = {},
  onUpdateDeadline,
  stages,
  readOnly,
  activeViewingStage,
  onSelectStage,
  stageTasks = {},
  taskStatusName = '',
  compact = false
}) {
  const { isDarkMode } = useStore();

  const safeDeadlines = deadlines || {};
  const safeStageTasks = stageTasks || {};

  const stageList = (stages && stages.length > 0) ? stages : INITIAL_STAGES;
  const currentIndex = stageList.indexOf(currentStage);

  const formatDeadline = (dateStr) => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`; // DD/MM/YYYY
    }
    return dateStr;
  };

  const getStageStatus = (stage, index) => {
    const subtasks = safeStageTasks[stage] || [];
    const deadline = safeDeadlines[stage];
    const isDeadlinePast = deadline && new Date(deadline).setHours(0, 0, 0, 0) < new Date().setHours(0, 0, 0, 0);

    // If the overall task is completed, all stages are completed
    if (taskStatusName.toLowerCase() === 'completed') {
      return isDeadlinePast ? 'delay-completed' : 'fully-completed';
    }

    const isPast = index < currentIndex;
    const isCurrent = index === currentIndex;

    // Past stages are completed
    if (isPast) {
      return isDeadlinePast ? 'delay-completed' : 'fully-completed';
    }

    // Future stages are untouched (gray)
    if (index > currentIndex) {
      return 'pending';
    }

    // For the CURRENT stage (index === currentIndex):
    // If it has subtasks, check their status, but ensure it at least shows as in-progress (Blue)
    if (subtasks.length > 0) {
      const result = calculateStageStatus(subtasks, deadline);
      switch (result.status) {
        case TIMELINE_STATUS.OVERDUE: return 'overdue';
        case TIMELINE_STATUS.ON_HOLD: return 'on-hold';
        case TIMELINE_STATUS.CANCELLED: return 'cancelled';
        case TIMELINE_STATUS.COMPLETED: return 'fully-completed';
        case TIMELINE_STATUS.DELAY_COMPLETED: return 'delay-completed';
        // Treat NOT_STARTED and IN_PROGRESS as progress for the current stage
        default: return isDeadlinePast ? 'overdue' : 'progress';
      }
    }

    // Current stage with no subtasks -> Blue
    return isDeadlinePast ? 'overdue' : 'progress';
  };

  const statusClasses = {
    'fully-completed': {
      iconBg: cn("bg-emerald-500 border-emerald-250 dark:border-emerald-900 text-white shadow-md shadow-emerald-500/20", compact ? "border-2" : "border-4"),
      text: "text-emerald-600 dark:text-emerald-400 font-bold",
      line: "bg-emerald-400"
    },
    'delay-completed': {
      iconBg: cn("bg-amber-400 border-amber-250 dark:border-amber-900 text-white shadow-md shadow-amber-400/20", compact ? "border-2" : "border-4"),
      text: "text-amber-500 dark:text-amber-400 font-bold",
      line: "bg-amber-400"
    },
    'progress': {
      iconBg: cn("bg-blue-600 border-blue-300 dark:border-blue-900 text-white shadow-lg shadow-blue-600/30", compact ? "scale-100 border-2" : "scale-110 border-4"),
      text: "text-blue-600 dark:text-blue-400 font-extrabold",
      line: "bg-slate-200 dark:bg-slate-700"
    },
    'cancelled': {
      iconBg: cn("bg-rose-500 border-rose-250 dark:border-rose-900 text-white shadow-md shadow-rose-500/20", compact ? "border-2" : "border-4"),
      text: "text-rose-500 dark:text-rose-450 font-bold",
      line: "bg-rose-500"
    },
    'on-hold': {
      iconBg: cn("bg-blue-500 border-blue-250 dark:border-blue-900 text-white shadow-md shadow-blue-500/20", compact ? "border-2" : "border-4"),
      text: "text-blue-500 dark:text-blue-400 font-bold",
      line: "bg-blue-400"
    },
    'overdue': {
      iconBg: cn("bg-red-800 border-red-900 dark:border-red-950 text-white shadow-lg shadow-red-800/30 animate-pulse", compact ? "border-2" : "border-4"),
      text: "text-red-700 dark:text-red-400 font-extrabold",
      line: "bg-red-800"
    },
    'pending': {
      iconBg: isDarkMode 
        ? cn("bg-slate-800 border-slate-700 text-slate-500", compact ? "border-2" : "border-4") 
        : cn("bg-slate-100 border-slate-200 text-slate-400", compact ? "border-2" : "border-4"),
      text: "text-slate-400 dark:text-slate-500 font-medium",
      line: "bg-slate-200 dark:bg-slate-700"
    }
  };

  return (
    <div className={cn("flex items-center w-full", compact ? "flex-row justify-start gap-0 py-1" : "flex-col md:flex-row justify-between gap-4 py-6 md:min-w-[900px] xl:min-w-full")}>
      {stageList.map((stage, index) => {
        const status = getStageStatus(stage, index);
        const style = statusClasses[status] || statusClasses['pending'];
        const showChecked = status === 'fully-completed' || status === 'delay-completed';

        return (
          <React.Fragment key={stage}>
            <div
              onClick={() => {
                if (onSelectStage) onSelectStage(stage);
                if (!readOnly && onUpdateStage) onUpdateStage(stage);
              }}
              className={cn("flex flex-col items-center group relative cursor-pointer",
                compact ? "w-28 shrink-0 gap-1" : "w-auto gap-3",
                status === 'pending' && "opacity-65",
                status === 'pending' && !readOnly && "hover:opacity-100",
                activeViewingStage === stage && "scale-105"
              )}
            >
              <div className={cn("rounded-full flex items-center justify-center transition-all duration-300 z-10",
                compact ? "w-8 h-8 border-2" : "w-12 h-12 border-4",
                style.iconBg,
                activeViewingStage === stage && !compact && "ring-4 ring-offset-2 ring-blue-500 dark:ring-offset-slate-900"
              )}>
                {showChecked && (
                  <CheckCircle2 className={compact ? "w-4.5 h-4.5" : "w-6 h-6"} />
                )}
              </div>

              <span className={cn("text-center tracking-wide leading-tight break-words", compact ? "text-xs px-1" : "text-xs md:text-sm", style.text)}>
                {stage}
              </span>

              {/* Mobile Connector Line (Hidden on md and up) */}
              {index < stageList.length - 1 && !compact && (
                <div className="h-6 w-1 md:hidden my-1 rounded-full bg-slate-200 dark:bg-slate-700" />
              )}

              {/* Deadline Picker or Read-Only Label */}
              {!compact && (
                readOnly ? (
                  safeDeadlines[stage] ? (
                    <div className={cn("mt-3 px-2.5 py-1 rounded-lg text-[10px] font-bold border flex items-center gap-1",
                      isDarkMode ? "bg-slate-900/50 border-slate-700/50 text-slate-400" : "bg-slate-50 border-slate-200 text-slate-600"
                    )}>
                      <Calendar className="w-3.5 h-3.5" />
                      {formatDeadline(safeDeadlines[stage])}
                    </div>
                  ) : (
                    <div className={cn("mt-3 px-2.5 py-1 rounded-lg text-[10px] font-bold border border-dashed flex items-center gap-1 opacity-50",
                      isDarkMode ? "border-slate-800 text-slate-600" : "border-slate-200 text-slate-450"
                    )}>
                      No Target
                    </div>
                  )
                ) : (
                  onUpdateDeadline && (
                    <div className="mt-4 flex items-center justify-center w-full relative" onClick={e => e.stopPropagation()}>
                      <input
                        type="date"
                        value={safeDeadlines[stage] || ''}
                        onChange={(e) => onUpdateDeadline(stage, e.target.value)}
                        className={cn("w-full max-w-[120px] text-xs px-2 py-1.5 rounded-lg border outline-none transition-all shadow-sm focus:ring-2 focus:ring-blue-500/20",
                          isDarkMode ? "bg-slate-900 border-slate-700 text-slate-300" : "bg-slate-50 border-slate-200 text-slate-700"
                        )}
                      />
                    </div>
                  )
                )
              )}
            </div>

            {/* Desktop Connector Line */}
            {index < stageList.length - 1 && (
              <div className={cn(compact ? "flex w-14 shrink-0" : "hidden md:flex flex-1", "items-center justify-center")}>
                <div className={cn("h-0.5 w-full rounded-full transition-colors duration-300", style.line)} />
                <ChevronRight className={cn(compact ? "w-3 h-3 -ml-2" : "w-5 h-5 -ml-3", "z-0",
                  status === 'pending' ? (isDarkMode ? "text-slate-600" : "text-slate-350") : "text-slate-500"
                )} />
              </div>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}
