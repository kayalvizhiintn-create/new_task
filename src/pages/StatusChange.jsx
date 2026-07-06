import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { cn } from '../utils/cn';
import { Activity, Clock, AlertTriangle, X, Shield, Search, RefreshCcw } from 'lucide-react';
import { Link } from 'react-router-dom';
import SearchableSelect from '../components/SearchableSelect';

import { taskService } from '../services/taskService';
import { taskChangeStatusService } from '../services/taskChangeStatusService';
import { enumService } from '../services/enumService';
import { formatDateToDDMMYYYY } from '../utils/dateFormatter';

const isNoProject = (val) => {
  if (!val) return true;
  const clean = val.toLowerCase().trim();
  return clean === 'no' || clean === 'no project' || clean === 'noproject' || clean === 'no_project' || clean === 'none';
};

export default function StatusChange() {
  const { isDarkMode, statuses, currentUser, userPrivileges } = useStore();
  const [tasks, setTasks] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  const statusPermissions = userPrivileges['status board'] || { canView: 0, canCreate: 0, canUpdate: 0, canDelete: 0 };
  const isAdmin = currentUser?.role?.toLowerCase() === 'admin' || currentUser?.role?.toLowerCase() === 'super admin';
  const canView = isAdmin || (Object.keys(userPrivileges).length === 0) || statusPermissions.canView === 1;
  const canUpdateStatus = isAdmin || (Object.keys(userPrivileges).length === 0) || statusPermissions.canUpdate === 1;

  if (!canView) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center min-h-[400px] animate-[fadeIn_0.5s_ease-out]">
        <div className="p-4 rounded-full bg-rose-500/10 text-rose-500 mb-4 animate-[pulse_2s_infinite]">
          <Shield className="w-12 h-12" />
        </div>
        <h2 className={cn("text-2xl font-bold tracking-tight", isDarkMode ? "text-white" : "text-slate-900")}>Access Denied</h2>
        <p className={cn("text-sm font-medium mt-2 max-w-sm", isDarkMode ? "text-slate-400" : "text-slate-500")}>
          You do not have the required permissions to access this page. Please contact your system administrator.
        </p>
        <Link to="/dashboard" className="mt-6 px-6 py-2.5 rounded-xl font-bold bg-blue-600 hover:bg-blue-700 text-white transition-all duration-300 shadow-sm hover:shadow">
          Back to Dashboard
        </Link>
      </div>
    );
  }
  const [apiStatuses, setApiStatuses] = useState([]);
  const [loadingTasks, setLoadingTasks] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [pendingUpdate, setPendingUpdate] = useState(null);
  const [reason, setReason] = useState('');
  const [reasonError, setReasonError] = useState(false);

  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadTasks = async (isBackground = false) => {
    if (!isBackground) setLoadingTasks(true);
    try {
      const res = await taskService.getAllTasks();
      setTasks(Array.isArray(res) ? res : (res?.data || []));
    } catch (error) {
      console.error("Error fetching tasks", error);
    } finally {
      if (!isBackground) setLoadingTasks(false);
    }
  };

  React.useEffect(() => {
    loadTasks();
    enumService.getStatusDropdown().then(res => {
      let stats = [];
      if (Array.isArray(res)) stats = res;
      else if (Array.isArray(res?.data)) stats = res.data;
      else if (Array.isArray(res?.items)) stats = res.items;
      setApiStatuses(stats);
    }).catch(console.error);

    // 15-minute background refresh interval
    const intervalId = setInterval(async () => {
      setIsRefreshing(true);
      await loadTasks(true);
      setTimeout(() => setIsRefreshing(false), 1000);
    }, 15 * 60 * 1000);

    return () => clearInterval(intervalId);
  }, []);

  const handleStatusChange = (taskId, newStatus) => {
    const task = tasks.find(t => t.id === taskId || t.taskId === taskId);
    if (task && (task.status === newStatus || task.statusName === newStatus)) return;

    const isCompletedVal = String(newStatus).toLowerCase().trim() === 'completed' || String(newStatus) === '6';
    if (isCompletedVal && task && task.dueDate) {
      const dueDate = new Date(task.dueDate);
      dueDate.setHours(23, 59, 59, 999);
      if (dueDate < new Date()) {
        Swal.fire({
          title: 'Overdue Project',
          text: 'This project/task has passed its due date and cannot be marked as Completed!',
          icon: 'error'
        });
        return;
      }
    }

    setPendingUpdate({ taskId, newStatus });
    setModalOpen(true);
  };

  const confirmStatusChange = async () => {
    if (!reason.trim()) {
      setReasonError(true);
      return;
    }
    if (pendingUpdate) {
      let statusId = pendingUpdate.newStatus;
      const targetStatus = apiStatuses.find(s => {
        if (typeof s === 'string') return s.toLowerCase() === pendingUpdate.newStatus.toLowerCase();
        return (s.statusName || s.name || s.value || '').toLowerCase() === pendingUpdate.newStatus.toLowerCase();
      });
      
      if (targetStatus && typeof targetStatus !== 'string') {
        const sid = targetStatus.statusId || targetStatus.id || targetStatus.value;
        statusId = (typeof sid === 'string' && /^\d+$/.test(sid)) ? parseInt(sid, 10) : (sid || statusId);
      }

      if (typeof statusId === 'string') {
        switch (statusId.toLowerCase().trim()) {
          case 'new task': case 'new': statusId = 2; break;
          case 'in progress': case 'progress': statusId = 3; break;
          case 'pending': statusId = 4; break;
          case 'on-hold': case 'on hold': case 'hold': statusId = 5; break;
          case 'completed': case 'done': statusId = 6; break;
          case 'cancelled': case 'cancel': statusId = 7; break;
          default:
            const idx = statuses.findIndex(s => s.toLowerCase() === statusId.toLowerCase());
            if (idx !== -1) {
              statusId = idx + 1;
            }
            break;
        }
      }
      
      // Force statusId to integer if possible
      if (typeof statusId === 'string' && /^\d+$/.test(statusId)) {
        statusId = parseInt(statusId, 10);
      }

      let empId = currentUser?.employeeId || currentUser?.empId || currentUser?.id || currentUser?.emp_id || 0;
      if (typeof empId === 'string' && /^\d+$/.test(empId)) {
        empId = parseInt(empId, 10);
      } else if (typeof empId === 'string' && empId.startsWith('EMP-')) {
        empId = 0; // Fallback
      }

      const taskObj = tasks.find(t => t.id === pendingUpdate.taskId || t.taskId === pendingUpdate.taskId);
      let realTaskId = taskObj ? (taskObj.taskId || taskObj.id) : pendingUpdate.taskId;
      if (typeof realTaskId === 'string' && /^\d+$/.test(realTaskId)) {
        realTaskId = parseInt(realTaskId, 10);
      }

      try {
        const payload = {
          taskChangeId: 0,
          taskId: realTaskId,
          statusId: statusId,
          changedBy: empId,
          changeReason: reason.trim()
        };
        
        await taskChangeStatusService.createChange(payload);
      } catch (error) {
        console.warn("Failed to create change log, but continuing with update", error);
      }

      try {
        await taskService.updateTaskStatus(realTaskId, { status: statusId });
        await loadTasks();
      } catch (error) {
        console.error("Failed to update task status", error);
        alert("Failed to update the task status on the server.");
      }
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

  const filteredTasks = tasks.filter(task => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return true;

    const taskUid = (task.taskUid || `TSK-${String(task.taskId || task.id).padStart(3, '0')}`).toLowerCase();
    const taskDesc = (task.taskDesc || task.title || '').toLowerCase();
    const category = (task.categoryName || task.category || '').toLowerCase();
    const assignedTo = (task.assignToName || task.assignedTo || '').toLowerCase();
    const status = (task.statusName || task.status || '').toLowerCase();
    const project = (task.project || '').toLowerCase();
    const dueDateFormatted = formatDateToDDMMYYYY(task.dueDate).toLowerCase();

    return taskUid.includes(query) ||
           taskDesc.includes(query) ||
           category.includes(query) ||
           assignedTo.includes(query) ||
           status.includes(query) ||
           project.includes(query) ||
           dueDateFormatted.includes(query);
  });

  const sortedTasks = [...filteredTasks].sort((a, b) => new Date(b.createdAt || Date.now()) - new Date(a.createdAt || Date.now()));

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

        {/* Searchbar */}
        <div className={cn("p-2 rounded-2xl shadow-sm w-full md:w-72 shrink-0",
          isDarkMode ? "bg-slate-800/60 backdrop-blur-md" : "bg-white border border-slate-200"
        )}>
          <div className={cn("flex items-center gap-2.5 px-3 py-2 rounded-xl transition-colors",
            isDarkMode ? "bg-slate-900/50 focus-within:bg-slate-900" : "bg-slate-50 focus-within:bg-white focus-within:ring-2 focus-within:ring-blue-500/20"
          )}>
            <Search className="w-4 h-4 text-slate-400 shrink-0" />
            <input
              type="text"
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent border-none outline-none w-full text-xs font-semibold placeholder:text-slate-400 dark:text-slate-100"
            />
          </div>
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
                    <p className={cn("font-bold text-base", isDarkMode ? "text-slate-100" : "text-slate-900")}>
                      {task.taskUid || `TSK-${String(task.taskId || task.id).padStart(3, '0')}`}
                    </p>
                    <p className={cn("text-xs font-semibold mt-1 text-slate-500 dark:text-slate-400 whitespace-pre-wrap")}>
                      {task.taskDesc || task.title || 'No Description'}
                    </p>
                    {task.project && !isNoProject(task.project) && (
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-xs font-bold px-2 py-0.5 rounded bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-400">
                          Proj: {task.project}
                        </span>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-5">
                    <span className={cn("font-bold", isDarkMode ? "text-slate-300" : "text-slate-700")}>{task.categoryName || task.category}</span>
                  </td>
                  <td className={cn("px-6 py-5 font-medium", isDarkMode ? "text-slate-300" : "text-slate-600")}>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white text-xs font-bold shadow-sm overflow-hidden">
                        {(task.assignToName || task.assignedTo || 'U').substring(0, 2).toUpperCase()}
                      </div>
                      {task.assignToName || task.assignedTo || 'Unassigned'}
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className={cn("flex items-center gap-1.5 font-bold", isDarkMode ? "text-slate-300" : "text-slate-700")}>
                      <Clock className="w-4 h-4 text-amber-500" />
                      {formatDateToDDMMYYYY(task.dueDate)}
                    </div>
                  </td>
                  <td className="px-6 py-5 text-right">
                    <SearchableSelect
                      value={task.statusName || task.status}
                      onChange={(e) => handleStatusChange(task.id || task.taskId, e.target.value)}
                      disabled={!canUpdateStatus}
                      options={apiStatuses.length > 0 
                        ? apiStatuses.map(s => {
                            const val = typeof s === 'string' ? s : (s.statusName || s.name || s.value);
                            return { value: val, label: val };
                          })
                        : [
                            { value: "Created", label: "Created" },
                            { value: "Open", label: "Open" },
                            { value: "In Progress", label: "In Progress" },
                            { value: "Closed", label: "Closed" }
                          ]
                      }
                      isDarkMode={isDarkMode}
                      className="w-36 ml-auto"
                      triggerClassName={cn(
                        "px-3 py-1.5 text-xs font-bold tracking-wide", 
                        getStatusColor(task.statusName || task.status)
                      )}
                    />
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

      {isRefreshing && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-2.5 rounded-full shadow-lg bg-indigo-600 text-white text-sm font-black tracking-wide animate-bounce">
          <RefreshCcw className="w-4 h-4 animate-spin" />
          <span>Refreshing...</span>
        </div>
      )}
    </div>
  );
}
