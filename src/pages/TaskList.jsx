import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { cn } from '../utils/cn';
import { Search, Filter, Download, Plus, Edit, Eye, Trash2, ArrowLeft, GitMerge, Layers, Users } from 'lucide-react';
import ConfirmModal from '../components/ConfirmModal';
import ProjectFlow from '../components/ProjectFlow';
import { taskService } from '../services/taskService';
import { categoryService } from '../services/categoryService';
import { subcategoryService } from '../services/subcategoryService';

const getStatusColor = (status, isDarkMode) => {
  switch(status) {
    case 'Completed': return isDarkMode ? 'text-emerald-400' : 'text-emerald-600';
    case 'In Progress': return isDarkMode ? 'text-blue-400' : 'text-blue-600';
    case 'New Task': return isDarkMode ? 'text-amber-400' : 'text-amber-600';
    case 'Pending': return isDarkMode ? 'text-purple-400' : 'text-purple-600';
    case 'On Hold': return isDarkMode ? 'text-slate-400' : 'text-slate-600';
    case 'Cancelled': return isDarkMode ? 'text-rose-400' : 'text-rose-600';
    default: return isDarkMode ? 'text-slate-400' : 'text-slate-600';
  }
};

const StatusBadge = ({ status, isDarkMode }) => (
  <div className="flex items-center gap-2">
    <div className={cn("w-2 h-2 rounded-full", getStatusColor(status, isDarkMode).replace('text-', 'bg-'))} />
    <span className={cn("font-semibold", isDarkMode ? "text-slate-200" : "text-slate-700")}>{status}</span>
  </div>
);

export default function TaskList() {
  const { employees, isDarkMode, categories, statuses } = useStore();
  const navigate = useNavigate();
  const [tasks, setTasks] = useState([]);
  const [apiCategories, setApiCategories] = useState([]);
  const [apiSubCategories, setApiSubCategories] = useState([]);
  const [loadingTasks, setLoadingTasks] = useState(true);
  const [searchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState(null);
  const [flowTask, setFlowTask] = useState(null);
  const itemsPerPage = 10;

  const loadTasks = async () => {
    setLoadingTasks(true);
    try {
      const [res, cats, subs] = await Promise.all([
        taskService.getAllTasks().catch(() => []),
        categoryService.getAllCategories().catch(() => []),
        subcategoryService.getAllSubcategories().catch(() => [])
      ]);
      setTasks(Array.isArray(res) ? res : (res?.data || []));
      setApiCategories(Array.isArray(cats) ? cats : (cats?.data || cats?.items || []));
      setApiSubCategories(Array.isArray(subs) ? subs : (subs?.data || subs?.items || []));
    } catch (error) {
      console.error("Error fetching tasks", error);
    } finally {
      setLoadingTasks(false);
    }
  };

  const getCategoryName = (idOrName) => {
    if (!idOrName && idOrName !== 0) return 'No Category';
    const cat = apiCategories.find(c => String(c.categoryId || c.id || c._id) === String(idOrName));
    return cat ? (cat.categoryName || cat.name) : idOrName;
  };

  const getSubCategoryName = (idOrName) => {
    if (!idOrName && idOrName !== 0) return '';
    const sub = apiSubCategories.find(s => String(s.subCategoryId || s.id || s._id) === String(idOrName));
    return sub ? (sub.subCategoryName || sub.name) : idOrName;
  };

  React.useEffect(() => {
    loadTasks();
    const statusParam = searchParams.get('status');
    if (statusParam) {
      setStatusFilter(statusParam); // Allow any status passed via URL parameter
    }
    
    const categoryParam = searchParams.get('category');
    if (categoryParam) {
      if (Object.keys(categories).includes(categoryParam)) {
        setCategoryFilter(categoryParam);
      } else if (categoryParam === 'All') {
        setCategoryFilter('All');
      }
    }
  }, [searchParams]);

  const filteredTasks = tasks.filter(task => {
    const taskTitle = task.title || task.taskDesc || '';
    const taskIdStr = String(task.id || task.taskId || '');
    
    const matchesSearch = taskTitle.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          taskIdStr.toLowerCase().includes(searchTerm.toLowerCase());
    
    const getStatusName = (t) => t.statusName || t.status || 'New Task';
    
    const matchesStatusFn = (t, target) => {
      if (target === 'All') return true;
      const s = getStatusName(t).toLowerCase().trim();
      const trg = target.toLowerCase().trim();
      if (trg.includes('review')) return s.includes('review');
      if (trg.includes('progress')) return s.includes('progress') || s.includes('going');
      if (trg.includes('hold')) return s.includes('hold') || s.includes('pause') || s.includes('pending');
      if (trg.includes('complete')) return s.includes('complete') || s.includes('done') || s.includes('close');
      if (trg.includes('cancel')) return s.includes('cancel') || s.includes('reject');
      if (trg.includes('new')) return s === 'new task' || s === 'new' || s === 'open' || s.includes('assigned');
      return s === trg;
    };

    const matchesStatus = matchesStatusFn(task, statusFilter);
    
    const taskCatName = (task.categoryName || getCategoryName(task.category || task.categoryId) || '').toLowerCase().trim();
    const targetCatName = (categoryFilter || '').toLowerCase().trim();
    const matchesCategory = categoryFilter === 'All' || taskCatName === targetCatName;
    
    return matchesSearch && matchesStatus && matchesCategory;
  });

  const totalPages = Math.ceil(filteredTasks.length / itemsPerPage);
  const paginatedTasks = filteredTasks.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleExportCSV = () => {
    const headers = ['UID', 'Title', 'Category', 'Sub Category', 'Assigned To', 'Priority', 'Due Date', 'Status', 'Created Date'];
    const csvContent = [
      headers.join(','),
      ...filteredTasks.map(t => [
        t.id || t.taskId, 
        `"${t.title || t.taskUid || ''}"`, 
        `"${t.categoryName || getCategoryName(t.category || t.categoryId)}"`, 
        `"${t.subCategoryName || getSubCategoryName(t.subCategory || t.subCategoryId)}"`, 
        `"${t.assignByName || t.assignedTo || 'Unassigned'}"`, 
        t.priorityName || t.priority, 
        t.dueDate, 
        t.statusName || t.status, 
        new Date(t.createdAt || Date.now()).toLocaleDateString()
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `tasks_export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getPriorityColor = (priority) => {
    switch(priority) {
      case 'Critical': return isDarkMode ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' : 'bg-rose-50 text-rose-700 border border-rose-200';
      case 'High': return isDarkMode ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20' : 'bg-orange-50 text-orange-700 border border-orange-200';
      case 'Medium': return isDarkMode ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : 'bg-blue-50 text-blue-700 border border-blue-200';
      case 'Low': return isDarkMode ? 'bg-slate-500/10 text-slate-400 border border-slate-500/20' : 'bg-slate-50 text-slate-700 border border-slate-200';
      default: return isDarkMode ? 'bg-slate-500/10 text-slate-400 border border-slate-500/20' : 'bg-slate-50 text-slate-700 border border-slate-200';
    }
  };



  return (
    <div className="space-y-6 animate-[fadeIn_0.5s_ease-out]">
      {/* Project Flow Modal */}
      {flowTask && <ProjectFlow task={flowTask} onClose={() => setFlowTask(null)} />}

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className={cn("text-4xl font-extrabold tracking-tight", isDarkMode ? "text-white" : "text-slate-900")}>Task List</h1>
          <p className={cn("mt-2 font-medium", isDarkMode ? "text-slate-400" : "text-slate-500")}>Manage and track all enterprise tasks efficiently.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Link 
            to="/"
            className={cn("flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold transition-all duration-300 shadow-sm hover:shadow",
              isDarkMode ? "bg-slate-800 text-slate-200 hover:bg-slate-700" : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
            )}
          >
            <ArrowLeft className="w-4 h-4" /> Dashboard
          </Link>
          <button 
            onClick={handleExportCSV}
            className={cn("flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold transition-all duration-300 shadow-sm hover:shadow",
              isDarkMode ? "bg-slate-800 text-slate-200 hover:bg-slate-700" : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
            )}
          >
            <Download className="w-4 h-4" /> Export CSV
          </button>
          <Link 
            to="/tasks/new"
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold bg-blue-600 hover:bg-blue-700 text-white transition-all duration-300 shadow-sm hover:shadow-md hover:-translate-y-0.5"
          >
            <Plus className="w-5 h-5" /> Create Task
          </Link>
        </div>
      </div>

      {/* Floating Toolbar */}
      <div className={cn("p-2 rounded-2xl flex flex-col md:flex-row gap-3 shadow-sm",
        isDarkMode ? "bg-slate-800/60 backdrop-blur-md" : "bg-white border border-slate-200"
      )}>
        <div className={cn("flex items-center gap-3 px-4 py-3 rounded-xl flex-1 transition-colors",
          isDarkMode ? "bg-slate-900/50 focus-within:bg-slate-900" : "bg-slate-50 focus-within:bg-white focus-within:ring-2 focus-within:ring-blue-500/20"
        )}>
          <Search className="w-5 h-5 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search tasks by title or UID..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-transparent border-none outline-none w-full text-sm font-medium placeholder:text-slate-400 dark:text-slate-100"
          />
        </div>
        
        <div className="flex flex-col md:flex-row items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-transparent w-full md:w-auto">
            <Filter className="w-5 h-5 text-slate-400" />
            <select 
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className={cn("bg-transparent outline-none text-sm font-bold cursor-pointer appearance-none min-w-[140px]",
                isDarkMode ? "text-slate-200" : "text-slate-700"
              )}
            >
              <option value="All">All Categories</option>
              {Object.keys(categories).map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-transparent w-full md:w-auto">
            <Filter className="w-5 h-5 text-slate-400" />
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className={cn("bg-transparent outline-none text-sm font-bold cursor-pointer appearance-none min-w-[120px]",
                isDarkMode ? "text-slate-200" : "text-slate-700"
              )}
            >
              <option value="All">All Statuses</option>
              {statuses.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Premium Data Table */}
      <div className={cn("rounded-3xl border overflow-hidden shadow-sm transition-all duration-300",
        isDarkMode ? "bg-slate-800/40 border-slate-700/50" : "bg-white border-slate-200"
      )}>
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left text-sm">
            <thead className={cn("border-b", isDarkMode ? "bg-slate-900/50 border-slate-700/50" : "bg-slate-50 border-slate-200")}>
              <tr>
                <th className={cn("px-3 py-4 font-bold uppercase tracking-wider text-xs", isDarkMode ? "text-slate-400" : "text-slate-500")}>UID</th>
                <th className={cn("px-3 py-4 font-bold uppercase tracking-wider text-xs", isDarkMode ? "text-slate-400" : "text-slate-500")}>Task Details</th>
                <th className={cn("px-3 py-4 font-bold uppercase tracking-wider text-xs", isDarkMode ? "text-slate-400" : "text-slate-500")}>Category</th>
                <th className={cn("px-3 py-4 font-bold uppercase tracking-wider text-xs", isDarkMode ? "text-slate-400" : "text-slate-500")}>Assignee</th>
                <th className={cn("px-3 py-4 font-bold uppercase tracking-wider text-xs", isDarkMode ? "text-slate-400" : "text-slate-500")}>Priority</th>
                <th className={cn("px-3 py-4 font-bold uppercase tracking-wider text-xs", isDarkMode ? "text-slate-400" : "text-slate-500")}>Due Date</th>
                <th className={cn("px-3 py-4 font-bold uppercase tracking-wider text-xs", isDarkMode ? "text-slate-400" : "text-slate-500")}>Status</th>
                <th className={cn("px-3 py-4 font-bold uppercase tracking-wider text-xs text-right", isDarkMode ? "text-slate-400" : "text-slate-500")}>Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700/50">
              {loadingTasks ? (
                <tr><td colSpan="8" className="p-8 text-center">Loading tasks from database...</td></tr>
              ) : paginatedTasks.length > 0 ? paginatedTasks.map((task, idx) => {
                const displayId = task.id || task.taskId || idx;
                const displayTitle = task.title || task.taskUid || task.taskDesc || 'No Title';
                const displayCategory = task.categoryName || getCategoryName(task.category || task.categoryId);
                const displaySubCategory = task.subCategoryName || getSubCategoryName(task.subCategory || task.subCategoryId);
                const displayAssignee = task.assignByName || task.assignedTo || 'Unassigned';
                const displayPriority = task.priorityName || task.priority || 'Medium';
                const displayStatus = task.statusName || task.status || 'New Task';
                
                return (
                <tr 
                  key={displayId} 
                  onClick={() => navigate(`/tasks/view/${displayId}`)}
                  className={cn("transition-all duration-200 group cursor-pointer", 
                  isDarkMode ? "hover:bg-slate-700/40" : "hover:bg-slate-50",
                  idx % 2 === 0 ? "bg-transparent" : (isDarkMode ? "bg-slate-800/20" : "bg-slate-50/50")
                )}>
                  <td className="px-3 py-4 font-bold text-blue-600 dark:text-blue-400">{displayId}</td>
                  <td className="px-3 py-4">
                    <p className={cn("font-bold text-base", isDarkMode ? "text-slate-100" : "text-slate-900")}>{displayTitle}</p>
                    {task.reference && (
                      <p className={cn("text-xs font-medium mt-1", isDarkMode ? "text-slate-400" : "text-slate-500")}>{task.reference}</p>
                    )}
                  </td>
                  <td className="px-3 py-4">
                    <p className={cn("font-semibold", isDarkMode ? "text-slate-300" : "text-slate-700")}>{displayCategory}</p>
                    <p className={cn("text-xs font-medium mt-1", isDarkMode ? "text-slate-400" : "text-slate-500")}>{displaySubCategory}</p>
                  </td>
                  <td className={cn("px-3 py-4 font-bold", isDarkMode ? "text-slate-300" : "text-slate-700")}>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 shrink-0 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white text-xs font-bold shadow-sm overflow-hidden">
                        {employees?.find(e => e.name === displayAssignee)?.avatar ? (
                          <img src={employees.find(e => e.name === displayAssignee).avatar} alt={displayAssignee} className="w-full h-full object-cover" />
                        ) : (
                          (displayAssignee || 'U').substring(0, 2).toUpperCase()
                        )}
                      </div>
                      <span className="truncate max-w-[100px]">{displayAssignee}</span>
                    </div>
                  </td>
                  <td className="px-3 py-4">
                    <span className={cn("px-2 py-1.5 rounded-xl text-xs font-bold tracking-wide whitespace-nowrap", getPriorityColor(displayPriority))}>
                      {displayPriority}
                    </span>
                  </td>
                  <td className={cn("px-3 py-4 font-semibold whitespace-nowrap", isDarkMode ? "text-slate-300" : "text-slate-700")}>{task.dueDate}</td>
                  <td className="px-3 py-4 whitespace-nowrap">
                    <StatusBadge status={displayStatus} isDarkMode={isDarkMode} />
                  </td>
                  <td className="px-3 py-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      {displayCategory === 'Development' && task.subCategory === 'Software Development' && (
                        <Link 
                          to={`/tasks/waterfall/${displayId}`} 
                          onClick={(e) => e.stopPropagation()}
                          className={cn("p-2 rounded-xl transition-all duration-200", isDarkMode ? "hover:bg-purple-500/20 text-purple-400" : "hover:bg-purple-50 text-purple-600")}
                          title="Manage Waterfall Stages"
                        >
                          <Layers className="w-4 h-4" />
                        </Link>
                      )}
                      <Link 
                        to={`/teams?project=${encodeURIComponent(displayTitle)}`}
                        onClick={(e) => e.stopPropagation()}
                        className={cn("p-2 rounded-xl transition-all duration-200", isDarkMode ? "hover:bg-indigo-500/20 text-indigo-400" : "hover:bg-indigo-50 text-indigo-600")}
                        title="Create Team"
                      >
                        <Users className="w-4 h-4" />
                      </Link>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setFlowTask(task);
                        }}
                        className={cn("p-2 rounded-xl transition-all duration-200", isDarkMode ? "hover:bg-emerald-500/20 text-emerald-400" : "hover:bg-emerald-50 text-emerald-600")}
                        title="View Project Flow"
                      >
                        <GitMerge className="w-4 h-4" />
                      </button>
                      <Link to={`/tasks/edit/${displayId}`} onClick={(e) => e.stopPropagation()} className={cn("p-2 rounded-xl transition-all duration-200", isDarkMode ? "hover:bg-blue-500/20 text-blue-400" : "hover:bg-blue-50 text-blue-600")}>
                        <Edit className="w-4 h-4" />
                      </Link>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setTaskToDelete(displayId);
                          setDeleteModalOpen(true);
                        }}
                        className={cn("p-2 rounded-xl transition-all duration-200", isDarkMode ? "hover:bg-rose-500/20 text-rose-400" : "hover:bg-rose-50 text-rose-600")}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              )}) : (
                <tr>
                  <td colSpan="8" className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center justify-center text-slate-400 dark:text-slate-500">
                      <Search className="w-12 h-12 mb-4 opacity-50" />
                      <p className="text-xl font-bold text-slate-700 dark:text-slate-300">No tasks found</p>
                      <p className="text-sm mt-2 font-medium">Try adjusting your search query or status filter.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination controls */}
        {totalPages > 1 && (
          <div className={cn("px-6 py-4 border-t flex items-center justify-between", isDarkMode ? "border-slate-700/50 bg-slate-800/80" : "border-slate-200 bg-slate-50")}>
            <span className="text-sm font-medium text-slate-500">
              Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredTasks.length)} of {filteredTasks.length} entries
            </span>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className={cn("px-4 py-2 rounded-xl text-sm font-bold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed",
                  isDarkMode ? "bg-slate-700 hover:bg-slate-600 text-slate-200" : "bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 shadow-sm"
                )}
              >
                Previous
              </button>
              <button 
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className={cn("px-4 py-2 rounded-xl text-sm font-bold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed",
                  isDarkMode ? "bg-slate-700 hover:bg-slate-600 text-slate-200" : "bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 shadow-sm"
                )}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      <ConfirmModal 
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setTaskToDelete(null);
        }}
        onConfirm={async () => {
          if (taskToDelete) {
            try {
              await taskService.deleteTask(taskToDelete);
              await loadTasks();
            } catch (error) {
              console.error("Error deleting task", error);
            }
          }
        }}
        title="Delete Task"
        message="Are you sure you want to delete this task? This action cannot be undone."
      />
    </div>
  );
}
