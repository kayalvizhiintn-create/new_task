import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { cn } from '../utils/cn';
import { Activity, Clock, AlertTriangle, X } from 'lucide-react';

export default function StatusChange() {
  const { tasks, employees, updateTask, isDarkMode, statuses } = useStore();
  const [modalOpen, setModalOpen] = useState(false);
  const [pendingUpdate, setPendingUpdate] = useState(null);
  const [reason, setReason] = useState('');
  const [reasonError, setReasonError] = useState(false);

  const handleStatusChange = (taskId, newStatus) => {
    const task = tasks.find(t => t.id === taskId);
    if (task && task.status === newStatus) return;

    setPendingUpdate({ taskId, newStatus });
    setModalOpen(true);
  };

  const confirmStatusChange = () => {
    if (!reason.trim()) {
      setReasonError(true);
      return;
    }
    if (pendingUpdate) {
      updateTask(pendingUpdate.taskId, { 
        status: pendingUpdate.newStatus,
        statusReason: reason.trim()
      });
    }
    setModalOpen(false);
    setPendingUpdate(null);
    setReason('');
    setReasonError(false);
  };

  const cancelStatusChange = () => {
    setModalOpen(false);
    setPendingUpdate(null);
    setReason('');
    setReasonError(false);
  };

  const sortedTasks = [...tasks].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const getStatusColor = (status) => {
    switch(status) {
      case 'New Task': return 'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400 border-amber-200 dark:border-amber-500/20';
      case 'Pending': return 'bg-slate-100 text-slate-700 dark:bg-slate-500/10 dark:text-slate-400 border-slate-200 dark:border-slate-500/20';
      case 'In Progress': return 'bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400 border-blue-200 dark:border-blue-500/20';
      case 'On Hold': return 'bg-gray-100 text-gray-700 dark:bg-gray-500/10 dark:text-gray-400 border-gray-200 dark:border-gray-500/20';
      case 'Completed': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20';
      case 'Cancelled': return 'bg-rose-100 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400 border-rose-200 dark:border-rose-500/20';
      default: return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300';
    }
  };

  return (
    <div className="space-y-6 animate-[fadeIn_0.5s_ease-out]">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className={cn("text-4xl font-extrabold tracking-tight flex items-center gap-3", isDarkMode ? "text-white" : "text-slate-900")}>
            <Activity className="w-8 h-8 text-blue-500" /> Status Board
          </h1>
          <p className={cn("mt-2 font-medium", isDarkMode ? "text-slate-400" : "text-slate-500")}>Quickly update project statuses across the board.</p>
        </div>
      </div>

      <div className={cn("rounded-3xl border overflow-hidden shadow-sm transition-all duration-300",
        isDarkMode ? "bg-slate-800/40 border-slate-700/50" : "bg-white border-slate-200"
      )}>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className={cn("border-b", isDarkMode ? "bg-slate-900/50 border-slate-700/50" : "bg-slate-50 border-slate-200")}>
              <tr>
                <th className={cn("px-6 py-5 font-bold uppercase tracking-wider text-xs", isDarkMode ? "text-slate-400" : "text-slate-500")}>Task / Project</th>
                <th className={cn("px-6 py-5 font-bold uppercase tracking-wider text-xs", isDarkMode ? "text-slate-400" : "text-slate-500")}>Category</th>
                <th className={cn("px-6 py-5 font-bold uppercase tracking-wider text-xs", isDarkMode ? "text-slate-400" : "text-slate-500")}>Assigned To</th>
                <th className={cn("px-6 py-5 font-bold uppercase tracking-wider text-xs", isDarkMode ? "text-slate-400" : "text-slate-500")}>Due Date</th>
                <th className={cn("px-6 py-5 font-bold uppercase tracking-wider text-xs text-right", isDarkMode ? "text-slate-400" : "text-slate-500")}>Current Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700/50">
              {sortedTasks.length > 0 ? sortedTasks.map((task, idx) => (
                <tr key={task.id} className={cn("transition-all duration-200 group cursor-default", 
                  isDarkMode ? "hover:bg-slate-700/40" : "hover:bg-slate-50",
                  idx % 2 === 0 ? "bg-transparent" : (isDarkMode ? "bg-slate-800/20" : "bg-slate-50/50")
                )}>
                  <td className="px-6 py-5">
                    <p className={cn("font-bold text-base", isDarkMode ? "text-slate-100" : "text-slate-900")}>{task.title}</p>
                    <p className={cn("text-xs font-medium mt-0.5", isDarkMode ? "text-slate-400" : "text-slate-500")}>{task.id}</p>
                  </td>
                  <td className="px-6 py-5">
                    <span className={cn("font-bold", isDarkMode ? "text-slate-300" : "text-slate-700")}>{task.category}</span>
                  </td>
                  <td className={cn("px-6 py-5 font-medium", isDarkMode ? "text-slate-300" : "text-slate-600")}>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white text-xs font-bold shadow-sm overflow-hidden">
                        {employees?.find(e => e.name === task.assignedTo)?.avatar ? (
                          <img src={employees.find(e => e.name === task.assignedTo).avatar} alt={task.assignedTo} className="w-full h-full object-cover" />
                        ) : (
                          (task.assignedTo || 'U').substring(0, 2).toUpperCase()
                        )}
                      </div>
                      {task.assignedTo || 'Unassigned'}
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className={cn("flex items-center gap-1.5 font-bold", isDarkMode ? "text-slate-300" : "text-slate-700")}>
                      <Clock className="w-4 h-4 text-amber-500" />
                      {task.dueDate}
                    </div>
                  </td>
                  <td className="px-6 py-5 text-right">
                    <select
                      value={task.status}
                      onChange={(e) => handleStatusChange(task.id, e.target.value)}
                      className={cn("appearance-none px-4 py-2 rounded-xl text-xs font-bold tracking-wide border cursor-pointer outline-none transition-all shadow-sm focus:ring-2 focus:ring-blue-500/20", 
                        getStatusColor(task.status)
                      )}
                    >
                      {statuses.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="5" className="px-6 py-16 text-center">
                    <p className="text-xl font-bold text-slate-700 dark:text-slate-300">No tasks available</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-[fadeIn_0.2s_ease-out]">
          <div className={cn("w-full max-w-md rounded-3xl shadow-2xl p-6 md:p-8 relative", 
            isDarkMode ? "bg-slate-800 border border-slate-700" : "bg-white"
          )}>
            <div className="absolute top-4 right-4">
              <button onClick={cancelStatusChange} className={cn("p-2 rounded-full transition-colors", isDarkMode ? "hover:bg-slate-700 text-slate-400" : "hover:bg-slate-100 text-slate-500")}>
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-500/20 flex items-center justify-center mb-6">
                <AlertTriangle className="w-8 h-8 text-amber-600 dark:text-amber-500" />
              </div>
              
              <h2 className={cn("text-2xl font-bold mb-2", isDarkMode ? "text-white" : "text-slate-900")}>Confirm Status Change</h2>
              <p className={cn("text-sm mb-6", isDarkMode ? "text-slate-300" : "text-slate-600")}>
                Are you sure you want to change the status to <span className="font-bold">"{pendingUpdate?.newStatus}"</span>?
              </p>
              
              <div className="w-full text-left mb-6">
                <label className={cn("block text-sm font-bold mb-2", isDarkMode ? "text-slate-300" : "text-slate-700")}>
                  Reason for Change <span className="text-rose-500">*</span>
                </label>
                <textarea
                  value={reason}
                  onChange={(e) => {
                    setReason(e.target.value);
                    if (e.target.value.trim()) setReasonError(false);
                  }}
                  className={cn("w-full px-4 py-3 rounded-xl border focus:ring-2 focus:ring-blue-500/20 outline-none transition-all resize-none",
                    isDarkMode ? "bg-slate-900/50 border-slate-700 text-white placeholder-slate-500" : "bg-white border-slate-300 text-slate-900 placeholder-slate-400",
                    reasonError ? "border-rose-500 focus:border-rose-500 ring-rose-500/20" : "focus:border-blue-500"
                  )}
                  placeholder="Please provide a valid reason..."
                  rows={3}
                ></textarea>
                {reasonError && <p className="text-rose-500 text-xs font-bold mt-2">Reason is required.</p>}
              </div>
              
              <div className="flex gap-3 w-full">
                <button 
                  onClick={cancelStatusChange}
                  className={cn("flex-1 py-3 rounded-xl font-bold transition-colors", 
                    isDarkMode ? "bg-slate-700 hover:bg-slate-600 text-white" : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                  )}
                >
                  No, Cancel
                </button>
                <button 
                  onClick={confirmStatusChange}
                  className="flex-1 py-3 rounded-xl font-bold bg-blue-600 hover:bg-blue-700 text-white transition-colors"
                >
                  Yes, Update
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
