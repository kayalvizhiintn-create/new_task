import React, { useEffect, useRef, useState } from 'react';
import { useStore } from '../store/useStore';
import { cn } from '../utils/cn';
import { X, GitCommit, Activity, User, PlusCircle, CheckCircle, Clock } from 'lucide-react';
import { taskChangeStatusService } from '../services/taskChangeStatusService';
import { employeeService } from '../services/employeeService';
import { enumService } from '../services/enumService';

export default function ProjectFlow({ task, onClose }) {
  const { isDarkMode } = useStore();
  const modalRef = useRef(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Click outside to close
    const handleOutsideClick = (e) => {
      if (modalRef.current && !modalRef.current.contains(e.target)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [onClose]);

  useEffect(() => {
    const fetchHistory = async () => {
      if (!task) return;
      try {
        setLoading(true);
        const [changesRes, empsRes, statsRes] = await Promise.all([
          taskChangeStatusService.getAllChanges().catch(() => []),
          employeeService.getAllEmployees().catch(() => []),
          enumService.getStatusDropdown().catch(() => [])
        ]);

        const changes = Array.isArray(changesRes) ? changesRes : (changesRes?.data || []);
        const emps = Array.isArray(empsRes) ? empsRes : (empsRes?.data || empsRes?.items || []);
        const stats = Array.isArray(statsRes) ? statsRes : (statsRes?.data || statsRes?.items || []);

        const empMap = {};
        emps.forEach(e => {
          empMap[e.employeeId || e.id || e._id] = e.employeeName || e.name;
        });

        const statusMap = {};
        stats.forEach((s, idx) => {
          if (typeof s === 'string') {
            statusMap[idx + 1] = s;
          } else {
            statusMap[s.statusId || s.id || s.value || (idx + 1)] = s.statusName || s.name || s.value;
          }
        });

        const taskIdNum = parseInt(task.taskId || task.id, 10);
        const filteredChanges = changes.filter(c => parseInt(c.taskId || c.task_id, 10) === taskIdNum);

        const mappedHistory = filteredChanges.map(c => {
          const statusName = statusMap[c.statusId || c.status] || `Status ${c.statusId || c.status}`;
          const userName = empMap[c.changedBy || c.created_by] || `Employee ${c.changedBy || c.created_by}`;
          return {
            action: 'Status Changed',
            timestamp: c.createdTime || c.createdAt || new Date().toISOString(),
            user: userName,
            details: `Status changed to ${statusName}${c.changeReason ? `\nReason: ${c.changeReason}` : ''}`
          };
        });

        const creatorName = empMap[task.assignBy] || task.assignByName || 'System';
        mappedHistory.push({
          action: 'Created',
          timestamp: task.createdTime || task.createdAt || new Date().toISOString(),
          user: creatorName,
          details: `Task created with status: ${task.statusName || task.status || 'New Task'}`
        });

        mappedHistory.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        setHistory(mappedHistory);
      } catch (error) {
        console.error("Failed to load project flow history", error);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [task]);

  const getActionIcon = (action) => {
    switch (action) {
      case 'Created': return <PlusCircle className="w-5 h-5 text-emerald-500" />;
      case 'Status Changed': return <Activity className="w-5 h-5 text-blue-500" />;
      case 'Assigned': return <User className="w-5 h-5 text-indigo-500" />;
      case 'Review Requested': return <Clock className="w-5 h-5 text-amber-500" />;
      default: return <GitCommit className="w-5 h-5 text-slate-500" />;
    }
  };

  const getActionColor = (action) => {
    switch (action) {
      case 'Created': return 'bg-emerald-100 dark:bg-emerald-500/20 border-emerald-200 dark:border-emerald-500/30';
      case 'Status Changed': return 'bg-blue-100 dark:bg-blue-500/20 border-blue-200 dark:border-blue-500/30';
      case 'Assigned': return 'bg-indigo-100 dark:bg-indigo-500/20 border-indigo-200 dark:border-indigo-500/30';
      case 'Review Requested': return 'bg-amber-100 dark:bg-amber-500/20 border-amber-200 dark:border-amber-500/30';
      default: return 'bg-slate-100 dark:bg-slate-500/20 border-slate-200 dark:border-slate-500/30';
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-[fadeIn_0.2s_ease-out] p-4">
      <div 
        ref={modalRef}
        className={cn("w-full max-w-2xl max-h-[90vh] flex flex-col rounded-3xl shadow-2xl overflow-hidden animate-[scaleIn_0.3s_ease-out]", 
          isDarkMode ? "bg-slate-800 border border-slate-700" : "bg-white border border-slate-200"
        )}
      >
        {/* Header */}
        <div className={cn("px-6 py-4 flex items-center justify-between border-b", isDarkMode ? "border-slate-700" : "border-slate-100")}>
          <div>
            <h2 className={cn("text-xl font-bold", isDarkMode ? "text-white" : "text-slate-900")}>Project Flow</h2>
            <p className={cn("text-sm font-medium", isDarkMode ? "text-slate-400" : "text-slate-500")}>{task.taskId || task.id} - {task.taskUid || task.title}</p>
          </div>
          <button 
            onClick={onClose}
            className={cn("p-2 rounded-full transition-colors", isDarkMode ? "hover:bg-slate-700 text-slate-400" : "hover:bg-slate-100 text-slate-500")}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Timeline */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar">
          {loading ? (
            <div className="text-center py-12 text-slate-500">Loading flow history...</div>
          ) : history.length === 0 ? (
            <div className="text-center py-12 text-slate-500">No flow history available for this task.</div>
          ) : (
            <div className="relative border-l-2 ml-4 md:ml-8 border-slate-200 dark:border-slate-700 space-y-8">
              {history.map((entry, index) => (
                <div key={index} className="relative pl-8 md:pl-10">
                  {/* Timeline Dot */}
                  <div className={cn("absolute -left-4 w-8 h-8 rounded-full flex items-center justify-center border-2 bg-white dark:bg-slate-800", getActionColor(entry.action))}>
                    {getActionIcon(entry.action)}
                  </div>
                  
                  {/* Content Box */}
                  <div className={cn("p-4 rounded-2xl border shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5", 
                    isDarkMode ? "bg-slate-800/80 border-slate-700" : "bg-white border-slate-200"
                  )}>
                    <div className="flex justify-between items-start mb-2">
                      <span className={cn("text-xs font-bold px-2 py-1 rounded-md uppercase tracking-wider", getActionColor(entry.action),
                        isDarkMode ? "text-slate-200" : "text-slate-700"
                      )}>
                        {entry.action}
                      </span>
                      <span className={cn("text-xs font-semibold", isDarkMode ? "text-slate-400" : "text-slate-500")}>
                        {new Date(entry.timestamp).toLocaleString(undefined, { 
                          month: 'short', day: 'numeric', year: 'numeric', 
                          hour: '2-digit', minute: '2-digit'
                        })}
                      </span>
                    </div>
                    <p className={cn("text-sm font-semibold mb-2", isDarkMode ? "text-slate-200" : "text-slate-800")}>
                      {entry.details}
                    </p>
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-[10px] font-bold">
                        {entry.user.substring(0, 2).toUpperCase()}
                      </div>
                      <span className={cn("text-xs font-medium", isDarkMode ? "text-slate-400" : "text-slate-500")}>
                        By {entry.user}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
