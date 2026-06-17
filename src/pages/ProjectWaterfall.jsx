import React from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { cn } from '../utils/cn';
import { ArrowLeft, GitMerge, Clock, FileText } from 'lucide-react';
import WaterfallFlow from '../components/WaterfallFlow';

export default function ProjectWaterfall() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { tasks, updateTask, isDarkMode } = useStore();
  
  const task = tasks.find(t => t.id === id);

  if (!task) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center animate-[fadeIn_0.5s_ease-out]">
        <h2 className="text-2xl font-bold text-slate-700 dark:text-slate-300">Task Not Found</h2>
        <p className="text-slate-500 mt-2">The task you are looking for does not exist or has been deleted.</p>
        <Link to="/tasks" className="mt-6 px-6 py-2.5 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors">
          Back to Tasks
        </Link>
      </div>
    );
  }

  const handleUpdateStage = (newStage) => {
    updateTask(id, { stage: newStage });
  };

  const handleUpdateDeadline = (stage, date) => {
    const updatedDeadlines = { ...task.stageDeadlines, [stage]: date };
    updateTask(id, { stageDeadlines: updatedDeadlines });
  };

  return (
    <div className="space-y-6 animate-[fadeIn_0.5s_ease-out]">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className={cn("text-4xl font-extrabold tracking-tight flex items-center gap-3", isDarkMode ? "text-white" : "text-slate-900")}>
            <GitMerge className="w-8 h-8 text-blue-500" /> Waterfall Stages
          </h1>
          <p className={cn("mt-2 font-medium", isDarkMode ? "text-slate-400" : "text-slate-500")}>Manage lifecycle stages and deadlines for {task.id}.</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate(-1)}
            className={cn("flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold transition-all duration-300 shadow-sm hover:shadow",
              isDarkMode ? "bg-slate-800 text-slate-200 hover:bg-slate-700" : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
            )}
          >
            <ArrowLeft className="w-4 h-4" /> Go Back
          </button>
        </div>
      </div>

      <div className={cn("p-6 md:p-8 rounded-3xl border shadow-sm transition-all duration-300", 
        isDarkMode ? "bg-slate-800/40 border-slate-700/50" : "bg-white border-slate-200"
      )}>
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-10">
          <div>
            <h2 className={cn("text-2xl font-bold", isDarkMode ? "text-slate-100" : "text-slate-900")}>{task.title}</h2>
            <div className="flex items-center gap-4 mt-2">
              <span className={cn("px-3 py-1 text-xs font-bold rounded-lg", isDarkMode ? "bg-indigo-500/20 text-indigo-400" : "bg-indigo-100 text-indigo-700")}>
                {task.category}
              </span>
              <span className={cn("px-3 py-1 text-xs font-bold rounded-lg", isDarkMode ? "bg-blue-500/20 text-blue-400" : "bg-blue-100 text-blue-700")}>
                {task.subCategory}
              </span>
            </div>
          </div>
          
          <div className={cn("p-4 rounded-2xl flex flex-col items-end gap-2", isDarkMode ? "bg-slate-900/50" : "bg-slate-50")}>
            <div className="flex items-center gap-2">
              <Clock className={cn("w-4 h-4", isDarkMode ? "text-slate-400" : "text-slate-500")} />
              <span className={cn("text-sm font-semibold", isDarkMode ? "text-slate-300" : "text-slate-700")}>Final Due Date: {task.dueDate || 'Not set'}</span>
            </div>
            <div className="flex items-center gap-2">
              <FileText className={cn("w-4 h-4", isDarkMode ? "text-slate-400" : "text-slate-500")} />
              <span className={cn("text-sm font-semibold", isDarkMode ? "text-slate-300" : "text-slate-700")}>Status: {task.status}</span>
            </div>
          </div>
        </div>

        <div className="mb-6">
          <h3 className={cn("text-lg font-bold mb-4", isDarkMode ? "text-slate-200" : "text-slate-800")}>Lifecycle Progress</h3>
          <WaterfallFlow 
            currentStage={task.stage || 'Requirements'} 
            onUpdateStage={handleUpdateStage}
            deadlines={task.stageDeadlines}
            onUpdateDeadline={handleUpdateDeadline}
          />
        </div>
        
        <div className={cn("p-4 rounded-2xl text-sm font-medium flex items-start gap-3", isDarkMode ? "bg-blue-500/10 text-blue-400" : "bg-blue-50 text-blue-700")}>
          <div className="mt-0.5"><Clock className="w-4 h-4" /></div>
          <p>Click on any stage above to mark it as the current active stage. Set deadlines for individual stages using the date pickers below each node. These changes are saved automatically.</p>
        </div>
      </div>
    </div>
  );
}
