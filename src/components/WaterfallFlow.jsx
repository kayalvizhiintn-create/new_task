import React from 'react';
import { useStore, INITIAL_STAGES } from '../store/useStore';
import { cn } from '../utils/cn';
import { CheckCircle2, Circle, ChevronRight, Calendar } from 'lucide-react';

export default function WaterfallFlow({ currentStage, onUpdateStage, deadlines = {}, onUpdateDeadline }) {
  const { isDarkMode } = useStore();
  
  const currentIndex = INITIAL_STAGES.indexOf(currentStage);

  return (
    <div className={cn("p-6 md:p-8 rounded-3xl border shadow-sm transition-all duration-300 w-full mb-8", 
      isDarkMode ? "bg-slate-800/40 border-slate-700/50" : "bg-white border-slate-200"
    )}>
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        {INITIAL_STAGES.map((stage, index) => {
          const isCompleted = index < currentIndex;
          const isCurrent = index === currentIndex;
          const isFuture = index > currentIndex;

          return (
            <React.Fragment key={stage}>
              <div 
                onClick={() => onUpdateStage(stage)}
                className={cn("flex flex-col items-center gap-2 group cursor-pointer relative w-full md:w-auto",
                  isFuture && "opacity-60 hover:opacity-100"
                )}
              >
                <div className={cn("w-12 h-12 rounded-full flex items-center justify-center border-4 transition-all duration-300 z-10",
                  isCompleted ? "bg-emerald-500 border-emerald-200 dark:border-emerald-900 text-white" :
                  isCurrent ? "bg-blue-600 border-blue-200 dark:border-blue-900 text-white shadow-lg shadow-blue-500/40 scale-110" :
                  isDarkMode ? "bg-slate-800 border-slate-700 text-slate-500 group-hover:border-blue-500/50" : "bg-slate-100 border-slate-200 text-slate-400 group-hover:border-blue-400"
                )}>
                  {isCompleted ? <CheckCircle2 className="w-6 h-6" /> : <Circle className="w-5 h-5 fill-current opacity-20" />}
                </div>
                
                <span className={cn("text-xs md:text-sm font-bold text-center tracking-wide",
                  isCompleted ? "text-emerald-600 dark:text-emerald-400" :
                  isCurrent ? "text-blue-600 dark:text-blue-400" :
                  isDarkMode ? "text-slate-400" : "text-slate-500"
                )}>
                  {stage}
                </span>

                {/* Mobile Connector Line (Hidden on md and up) */}
                {index < INITIAL_STAGES.length - 1 && (
                  <div className="h-6 w-1 md:hidden my-1 rounded-full bg-slate-200 dark:bg-slate-700" />
                )}
                
                {/* Deadline Picker */}
                {onUpdateDeadline && (
                  <div className="mt-4 flex items-center justify-center w-full relative" onClick={e => e.stopPropagation()}>
                    <input 
                      type="date"
                      value={deadlines[stage] || ''}
                      onChange={(e) => onUpdateDeadline(stage, e.target.value)}
                      className={cn("w-full max-w-[120px] text-xs px-2 py-1.5 rounded-lg border outline-none transition-all shadow-sm focus:ring-2 focus:ring-blue-500/20",
                        isDarkMode ? "bg-slate-900 border-slate-700 text-slate-300" : "bg-slate-50 border-slate-200 text-slate-700"
                      )}
                    />
                  </div>
                )}
              </div>

              {/* Desktop Connector Line */}
              {index < INITIAL_STAGES.length - 1 && (
                <div className="hidden md:flex flex-1 items-center justify-center">
                  <div className={cn("h-1 w-full rounded-full transition-colors duration-300",
                    index < currentIndex ? "bg-emerald-400" : isDarkMode ? "bg-slate-700" : "bg-slate-200"
                  )} />
                  <ChevronRight className={cn("w-5 h-5 -ml-3 z-0",
                    index < currentIndex ? "text-emerald-500" : isDarkMode ? "text-slate-600" : "text-slate-300"
                  )} />
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}
