import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { Link, useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import { cn } from '../utils/cn';
import { Search, Filter, Download, Plus, Edit, Eye, Trash2, ArrowLeft, GitMerge, Layers, Users, Shield, Printer, RefreshCcw } from 'lucide-react';
import ConfirmModal from '../components/ConfirmModal';
import ProjectFlow from '../components/ProjectFlow';
import WaterfallFlow from '../components/WaterfallFlow';
import SearchableSelect from '../components/SearchableSelect';
import { SecureComponent } from '../components/SecureComponent';
import { taskService } from '../services/taskService';
import { categoryService } from '../services/categoryService';
import { developmentService } from '../services/developmentService';
import { supportService } from '../services/supportService';
import { hardwareOthersService } from '../services/hardwareOthersService';
import { employeeService } from '../services/employeeService';
import { enumService } from '../services/enumService';
import { projectService } from '../services/projectService';
import { workflowService } from '../services/workflowService';
import { formatDateToDDMMYYYY } from '../utils/dateFormatter';


const getStatusColor = (status, isDarkMode) => {
  switch (status) {
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

const isNoProject = (val) => {
  if (!val) return true;
  const clean = val.toLowerCase().trim();
  return clean === 'no' || clean === 'no project' || clean === 'noproject' || clean === 'no_project' || clean === 'none';
};

const isNoAgent = (val) => {
  if (!val) return true;
  const clean = val.toLowerCase().trim();
  return clean === 'no' || clean === 'no agent' || clean === 'noagent' || clean === 'none';
};

export default function TaskList() {
  const { employees, isDarkMode, categories, statuses, userPrivileges, currentUser } = useStore();
  const navigate = useNavigate();
  const [tasks, setTasks] = useState([]);

  const taskPermissions = userPrivileges['task list'] || { canView: 0, canCreate: 0, canUpdate: 0, canDelete: 0 };
  const newTaskPermissions = userPrivileges['new task'] || { canView: 0, canCreate: 0, canUpdate: 0, canDelete: 0 };
  const isAdmin = currentUser?.role?.toLowerCase() === 'admin' || currentUser?.role?.toLowerCase() === 'super admin';
  const canCreateTask = isAdmin || (Object.keys(userPrivileges).length === 0) || (
    taskPermissions.canCreate === 1 && newTaskPermissions.canCreate === 1 && newTaskPermissions.canView === 1
  );
  const canUpdateTask = isAdmin || (Object.keys(userPrivileges).length === 0) || taskPermissions.canUpdate === 1;
  const canDeleteTask = isAdmin || (Object.keys(userPrivileges).length === 0) || taskPermissions.canDelete === 1;
  const [apiCategories, setApiCategories] = useState([]);
  const [apiSubCategories, setApiSubCategories] = useState([]);
  const [apiEmployees, setApiEmployees] = useState([]);
  const [apiStatuses, setApiStatuses] = useState([]);
  const [apiProjects, setApiProjects] = useState([]);
  const [projectFilter, setProjectFilter] = useState('All');
  const [loadingTasks, setLoadingTasks] = useState(true);
  const [searchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState('');
  const [taskNameFilter, setTaskNameFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [subCategoryFilter, setSubCategoryFilter] = useState('All');
  const [employeeFilter, setEmployeeFilter] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState(null);
  const [flowTask, setFlowTask] = useState(null);
  const location = useLocation();
  const fromDashboard = location.state?.fromDashboard || searchParams.get('fromDashboard') === 'true';
  const [collapsedTaskIds, setCollapsedTaskIds] = useState(new Set());
  const [workflowTemplates, setWorkflowTemplates] = useState([]);
  const itemsPerPage = 10;

  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadTasks = async (isBackground = false) => {
    if (!isBackground) setLoadingTasks(true);
    try {
      const [res, cats, devRes, supportRes, hwRes, emps, stats, projs, templatesRes] = await Promise.all([
        taskService.getAllTasks().catch(() => []),
        categoryService.getAllCategories().catch(() => []),
        developmentService.getAll().catch(() => []),
        supportService.getAll().catch(() => []),
        hardwareOthersService.getAll().catch(() => []),
        employeeService.getAllEmployees().catch(() => []),
        enumService.getStatusDropdown().catch(() => []),
        projectService.getAllProjects().catch(() => []),
        workflowService.getAllTemplates().catch(() => ({ data: [] }))
      ]);
      const ensureArray = (d) => Array.isArray(d) ? d : (d?.data || d?.items || []);
      const subs = [
        ...ensureArray(devRes),
        ...ensureArray(supportRes),
        ...ensureArray(hwRes)
      ];
      let fetchedTasks = Array.isArray(res) ? res : (res?.data || []);
      fetchedTasks.sort((a, b) => (b.taskId || b.id || 0) - (a.taskId || a.id || 0));
      setTasks(fetchedTasks);
      setApiCategories(Array.isArray(cats) ? cats : (cats?.data || cats?.items || []));
      setApiSubCategories(subs);
      setApiEmployees(Array.isArray(emps) ? emps : (emps?.data || emps?.items || []));
      setApiStatuses(Array.isArray(stats) ? stats : (stats?.data || stats?.items || []));
      setApiProjects(Array.isArray(projs) ? projs : (projs?.data || projs?.items || []));
      setWorkflowTemplates(templatesRes?.data || templatesRes || []);
    } catch (error) {
      console.error("Error fetching tasks", error);
    } finally {
      if (!isBackground) setLoadingTasks(false);
    }
  };

  const availableCategories = React.useMemo(() => {
    const cleanCatName = (name) => {
      if (!name) return '';
      return name.replace(/\s*\((project|development|support|hardware\s*&\s*others)\)/i, '').trim();
    };
    const fromApi = apiCategories.map(c => cleanCatName(c.categoryName || c.name || c.value)).filter(Boolean);
    const all = new Set(fromApi);
    return Array.from(all).sort();
  }, [apiCategories]);

  const availableEmployees = React.useMemo(() => {
    const fromApi = apiEmployees.map(e => e.employeeName || e.name || e.empName).filter(Boolean);
    const all = new Set(fromApi);
    return Array.from(all).sort();
  }, [apiEmployees]);

  const availableProjects = React.useMemo(() => {
    const fromApi = apiProjects
      .map(p => p.projectName || p.name || p.value)
      .filter(Boolean)
      .filter(name => !isNoProject(name));
    const all = new Set(fromApi);
    return Array.from(all).sort();
  }, [apiProjects]);

  const availableStatuses = React.useMemo(() => {
    const fromApi = apiStatuses.map(s => s.name || s.statusName || s.value).filter(Boolean);
    const all = new Set(fromApi);
    return Array.from(all);
  }, [apiStatuses]);

  const getCategoryName = (idOrName) => {
    if (!idOrName && idOrName !== 0) return 'No Category';
    const cat = apiCategories.find(c => String(c.categoryId || c.id || c._id) === String(idOrName));
    return cat ? (cat.categoryName || cat.name) : String(idOrName);
  };

  const getSubCategoryName = (idOrName) => {
    if (!idOrName && idOrName !== 0) return '';
    const sub = apiSubCategories.find(s => String(s.subCategoryId || s.id || s._id) === String(idOrName));
    return sub ? (sub.subCategoryName || sub.name) : String(idOrName);
  };

  React.useEffect(() => {
    loadTasks();
    const statusParam = searchParams.get('status');
    if (statusParam) {
      setStatusFilter(statusParam); // Allow any status passed via URL parameter
    }

    const categoryParam = searchParams.get('category');
    if (categoryParam) {
      setCategoryFilter(categoryParam);
    }

    const subcategoryParam = searchParams.get('subcategory');
    if (subcategoryParam) {
      setSubCategoryFilter(subcategoryParam);
    } else {
      setSubCategoryFilter('All');
    }

    // 15-minute background refresh interval
    const intervalId = setInterval(async () => {
      setIsRefreshing(true);
      await loadTasks(true);
      setTimeout(() => setIsRefreshing(false), 1000);
    }, 15 * 60 * 1000);

    return () => clearInterval(intervalId);
  }, [searchParams]);

  const filteredTasks = tasks.filter(task => {
    const taskTitle = task.title || task.taskDesc || '';
    const taskIdStr = String(task.id || task.taskId || '');

    const matchesSearch = taskTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      taskIdStr.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesTaskName = !taskNameFilter || taskTitle.toLowerCase().includes(taskNameFilter.toLowerCase());

    const displayAssignee = task.assignToName || task.assignedTo || 'Unassigned';
    const matchesEmployee = employeeFilter === 'All' ||
      displayAssignee.toLowerCase().trim() === employeeFilter.toLowerCase().trim();

    const getStatusName = (t) => String(t.statusName || t.status || 'New Task');

    const matchesStatusFn = (t, target) => {
      if (target === 'All') return true;
      const trg = target.toLowerCase().trim();

      const todayLocal = new Date();
      const today = `${todayLocal.getFullYear()}-${String(todayLocal.getMonth() + 1).padStart(2, '0')}-${String(todayLocal.getDate()).padStart(2, '0')}`;

      if (trg === 'today created') {
        const createdDate = t.createdTime || t.createdAt || t.createdDate || t.dateCreated || t.CreatedTime;
        return createdDate && createdDate.toString().startsWith(today);
      }
      if (trg === "today's task") {
        return t.dueDate && t.dueDate !== '0001-01-01' && t.dueDate.startsWith(today);
      }
      if (trg === 'overdue') {
        const s = getStatusName(t).toLowerCase().trim();
        const isCompleted = s.includes('complete') || s.includes('done') || s.includes('close');
        const isCancelled = s.includes('cancel') || s.includes('reject');
        return t.dueDate && t.dueDate !== '0001-01-01' && t.dueDate < today && !isCompleted && !isCancelled;
      }
      if (trg === 'total') {
        const s = getStatusName(t).toLowerCase().trim();
        const isCompleted = s.includes('complete') || s.includes('done') || s.includes('close');
        const isCancelled = s.includes('cancel') || s.includes('reject');
        return !isCompleted && !isCancelled;
      }

      const s = getStatusName(t).toLowerCase().trim();
      if (trg.includes('progress')) return s.includes('progress') || s.includes('going');
      if (trg.includes('hold')) return s.includes('hold') || s.includes('pause') || s.includes('pending');
      if (trg.includes('complete')) return s.includes('complete') || s.includes('done') || s.includes('close');
      if (trg.includes('cancel')) return s.includes('cancel') || s.includes('reject');
      if (trg.includes('new')) return s === 'new task' || s === 'new' || s === 'newtask' || s === 'open' || s.includes('assigned');
      return s === trg;
    };

    const matchesStatus = matchesStatusFn(task, statusFilter);

    const cleanCatName = (name) => {
      if (!name) return '';
      return name.replace(/\s*\((project|development|support|hardware\s*&\s*others)\)/i, '').trim();
    };

    const taskCatName = cleanCatName(task.categoryName || getCategoryName(task.category || task.categoryId) || '').toLowerCase().trim();
    const targetCatName = cleanCatName(categoryFilter || '').toLowerCase().trim();
    const matchesCategory = categoryFilter === 'All' || taskCatName === targetCatName;

    const taskSubCatName = (task.subCategoryName || getSubCategoryName(task.subCategory || task.subCategoryId) || '').toLowerCase().trim();
    const targetSubCatName = (subCategoryFilter || 'All').toLowerCase().trim();
    const matchesSubCategory = targetSubCatName === 'all' || taskSubCatName === targetSubCatName;

    const taskProject = task.project || '';
    const matchesProject = projectFilter === 'All' ||
      taskProject.toLowerCase().trim() === projectFilter.toLowerCase().trim();

    return matchesSearch && matchesTaskName && matchesEmployee && matchesStatus && matchesCategory && matchesSubCategory && matchesProject;
  });

  const totalPages = Math.ceil(filteredTasks.length / itemsPerPage);
  const paginatedTasks = filteredTasks.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const getSortedStages = (t) => {
    if (t && t.stageDeadlines && Object.keys(t.stageDeadlines).length > 0) {
      const taskStageNames = Object.keys(t.stageDeadlines);
      const matchingTemplate = workflowTemplates.find(tpl => {
        if (tpl.stages.length !== taskStageNames.length) return false;
        return tpl.stages.every(stg => taskStageNames.includes(stg.stageName));
      });
      if (matchingTemplate) {
        return [...matchingTemplate.stages]
          .sort((a, b) => (a.sequence || 0) - (b.sequence || 0))
          .map(s => s.stageName);
      }
      return taskStageNames;
    }
    return ['Planning', 'Requirement Gathering', 'Designing', 'Coding', 'Testing', 'Implementation & Support'];
  };


  const handleExportCSV = () => {
    const headers = ['UID', 'Title', 'Category', 'Sub Category', 'Assigned To', 'Priority', 'Due Date', 'Status', 'Project', 'Created Date'];
    const csvContent = [
      headers.join(','),
      ...filteredTasks.map(t => [
        t.id || t.taskId,
        `"${t.title || t.taskUid || ''}"`,
        `"${t.categoryName || getCategoryName(t.category || t.categoryId)}"`,
        `"${t.subCategoryName || getSubCategoryName(t.subCategory || t.subCategoryId)}"`,
        `"${t.assignToName || t.assignedTo || 'Unassigned'}"`,
        t.priorityName || t.priority,
        formatDateToDDMMYYYY(t.dueDate),
        t.statusName || t.status,
        t.project && !isNoProject(t.project) ? `"${t.project}"` : '""',
        formatDateToDDMMYYYY(t.createdAt || Date.now())
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
    switch (priority) {
      case 'Critical': return isDarkMode ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' : 'bg-rose-50 text-rose-700 border border-rose-200';
      case 'High': return isDarkMode ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20' : 'bg-orange-50 text-orange-700 border border-orange-200';
      case 'Medium': return isDarkMode ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : 'bg-blue-50 text-blue-700 border border-blue-200';
      case 'Low': return isDarkMode ? 'bg-slate-500/10 text-slate-400 border border-slate-500/20' : 'bg-slate-50 text-slate-700 border border-slate-200';
      default: return isDarkMode ? 'bg-slate-500/10 text-slate-400 border border-slate-500/20' : 'bg-slate-50 text-slate-700 border border-slate-200';
    }
  };

  // Returns true if the task can still be edited (within 30 min for non-admin)
  const canEditTask = (task) => {
    if (isAdmin) return true;
    const createdAt = task.createdTime || task.createdAt || task.CreatedTime || task.dateCreated;
    if (!createdAt) return true; // If no creation time, allow

    // Safely parse the ISO date to force UTC interpretation if no offset is present
    const parseUtcDate = (dateStr) => {
      if (!dateStr) return new Date();
      if (typeof dateStr === 'string' && !dateStr.endsWith('Z') && !dateStr.includes('+') && !dateStr.includes('-')) {
        return new Date(dateStr + 'Z');
      }
      return new Date(dateStr);
    };

    const minutesSince = (Date.now() - parseUtcDate(createdAt).getTime()) / 60000;
    return minutesSince <= 30;
  };

  const canView = isAdmin || (Object.keys(userPrivileges).length === 0) || taskPermissions.canView === 1;

  if (!canView) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center min-h-[400px] animate-[fadeIn_0.5s_ease-out]">
        <div className="p-4 rounded-full bg-rose-500/10 text-rose-500 mb-4 animate-[pulse_2s_infinite]">
          <Shield className="w-12 h-12" />
        </div>
        <h2 className={cn("text-2xl font-bold tracking-tight", isDarkMode ? "text-white" : "text-slate-900")}>Access Denied</h2>
        <p className={cn("text-sm font-medium mt-2 max-w-sm", isDarkMode ? "text-slate-400" : "text-slate-500")}>
          You do not have the required permissions to view the Task List. Please contact your system administrator.
        </p>
        <Link to="/dashboard" className="mt-6 px-6 py-2.5 rounded-xl font-bold bg-blue-600 hover:bg-blue-700 text-white transition-all duration-300 shadow-sm hover:shadow">
          Back to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-[fadeIn_0.5s_ease-out]">
      {/* Project Flow Modal */}
      {flowTask && <ProjectFlow task={flowTask} onClose={() => setFlowTask(null)} />}


      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 print:hidden">
        <div>
          <h1 className={cn("text-4xl font-extrabold tracking-tight", isDarkMode ? "text-white" : "text-slate-900")}>Task List</h1>
          {/* <p className={cn("mt-2 font-medium", isDarkMode ? "text-slate-400" : "text-slate-500")}>Manage and track all enterprise tasks efficiently.</p> */}
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
          <SecureComponent code="task.print">
            <button
              onClick={() => window.print()}
              className={cn("flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold transition-all duration-300 shadow-sm hover:shadow",
                isDarkMode ? "bg-slate-800 text-slate-200 hover:bg-slate-700" : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
              )}
            >
              <Printer className="w-4 h-4" /> Print Report
            </button>
          </SecureComponent>
          <SecureComponent code="task.export">
            <button
              onClick={handleExportCSV}
              className={cn("flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold transition-all duration-300 shadow-sm hover:shadow",
                isDarkMode ? "bg-slate-800 text-slate-200 hover:bg-slate-700" : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
              )}
            >
              <Download className="w-4 h-4" /> Export CSV
            </button>
          </SecureComponent>
          <SecureComponent code="task.create">
            {canCreateTask && (
              <Link
                to="/tasks/new"
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold bg-blue-600 hover:bg-blue-700 text-white transition-all duration-300 shadow-sm hover:shadow-md hover:-translate-y-0.5"
              >
                <Plus className="w-5 h-5" /> Create Task
              </Link>
            )}
          </SecureComponent>
        </div>
      </div>

      {/* Floating Toolbar */}
      <div className={cn("p-4 rounded-2xl grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 shadow-sm print:hidden",
        isDarkMode ? "bg-slate-800/60 backdrop-blur-md" : "bg-white border border-slate-200"
      )}>
        {/* General Search */}
        <div className={cn("flex items-center gap-3 px-4 py-3 rounded-xl transition-colors",
          isDarkMode ? "bg-slate-900/50 focus-within:bg-slate-900" : "bg-slate-50 focus-within:bg-white focus-within:ring-2 focus-within:ring-blue-500/20"
        )}>
          <Search className="w-5 h-5 text-slate-400 shrink-0" />
          <input
            type="text"
            placeholder="Search title/UID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-transparent border-none outline-none w-full text-sm font-medium placeholder:text-slate-400 dark:text-slate-100"
          />
        </div>

        {/* Task Name Filter */}
        <div className={cn("flex items-center gap-3 px-4 py-3 rounded-xl transition-colors",
          isDarkMode ? "bg-slate-900/50 focus-within:bg-slate-900" : "bg-slate-50 focus-within:bg-white focus-within:ring-2 focus-within:ring-blue-500/20"
        )}>
          <Search className="w-5 h-5 text-slate-400 shrink-0" />
          <input
            type="text"
            placeholder="Filter by Task Name..."
            value={taskNameFilter}
            onChange={(e) => setTaskNameFilter(e.target.value)}
            className="bg-transparent border-none outline-none w-full text-sm font-medium placeholder:text-slate-400 dark:text-slate-100"
          />
        </div>

        {/* Project Filter */}
        <div className={cn("flex items-center gap-3 px-4 py-2.5 rounded-xl transition-colors relative min-w-[180px] flex-1 md:flex-initial",
          isDarkMode ? "bg-slate-900/50" : "bg-slate-50"
        )}>
          <Filter className="w-5 h-5 text-slate-400 shrink-0" />
          <SearchableSelect
            value={projectFilter}
            onChange={(e) => setProjectFilter(e.target.value)}
            options={[
              { value: "All", label: "All Projects" },
              ...availableProjects.map(p => ({ value: p, label: p }))
            ]}
            placeholder="All Projects"
            isDarkMode={isDarkMode}
            className="flex-1"
            triggerClassName="bg-transparent border-none shadow-none px-0 py-0 focus:ring-0 focus:bg-transparent text-sm font-bold cursor-pointer"
          />
        </div>

        {/* Category Filter */}
        <div className={cn("flex items-center gap-3 px-4 py-2.5 rounded-xl transition-colors relative min-w-[180px] flex-1 md:flex-initial",
          isDarkMode ? "bg-slate-900/50" : "bg-slate-50"
        )}>
          <Filter className="w-5 h-5 text-slate-400 shrink-0" />
          <SearchableSelect
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            options={[
              { value: "All", label: "All Categories" },
              ...availableCategories.map(c => ({ value: c, label: c }))
            ]}
            placeholder="All Categories"
            isDarkMode={isDarkMode}
            className="flex-1"
            triggerClassName="bg-transparent border-none shadow-none px-0 py-0 focus:ring-0 focus:bg-transparent text-sm font-bold cursor-pointer"
          />
        </div>

        {/* Assignee/Name Filter */}
        <div className={cn("flex items-center gap-3 px-4 py-2.5 rounded-xl transition-colors relative min-w-[180px] flex-1 md:flex-initial",
          isDarkMode ? "bg-slate-900/50" : "bg-slate-50"
        )}>
          <Filter className="w-5 h-5 text-slate-400 shrink-0" />
          <SearchableSelect
            value={employeeFilter}
            onChange={(e) => setEmployeeFilter(e.target.value)}
            options={[
              { value: "All", label: "All Assignees" },
              ...availableEmployees.map(emp => ({ value: emp, label: emp }))
            ]}
            placeholder="All Assignees"
            isDarkMode={isDarkMode}
            className="flex-1"
            triggerClassName="bg-transparent border-none shadow-none px-0 py-0 focus:ring-0 focus:bg-transparent text-sm font-bold cursor-pointer"
          />
        </div>

        {/* Status Filter */}
        <div className={cn("flex items-center gap-3 px-4 py-2.5 rounded-xl transition-colors relative min-w-[180px] flex-1 md:flex-initial",
          isDarkMode ? "bg-slate-900/50" : "bg-slate-50"
        )}>
          <Filter className="w-5 h-5 text-slate-400 shrink-0" />
          <SearchableSelect
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            options={[
              { value: "All", label: "All Statuses" },
              ...availableStatuses.map(s => ({ value: s, label: s })),
              { value: "Today created", label: "Today Created" },
              { value: "Today's task", label: "Today's Task" },
              { value: "Overdue", label: "Overdue" },
              { value: "Total", label: "Total" }
            ]}
            placeholder="All Statuses"
            isDarkMode={isDarkMode}
            className="flex-1"
            triggerClassName="bg-transparent border-none shadow-none px-0 py-0 focus:ring-0 focus:bg-transparent text-sm font-bold cursor-pointer"
          />
        </div>
      </div>

      {/* Premium Data Table */}
      <div className={cn("rounded-3xl border overflow-hidden shadow-sm transition-all duration-300 print:hidden",
        isDarkMode ? "bg-slate-800/40 border-slate-700/50" : "bg-white border-slate-200"
      )}>
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left text-sm">
            <thead className={cn("border-b", isDarkMode ? "bg-slate-900/50 border-slate-700/50" : "bg-blue-900")}>
              <tr className="border-l-4 border-l-transparent">
                {fromDashboard ? (
                  <>
                    <th className={cn("px-4 py-3 font-bold uppercase tracking-wider text-xs w-[80px]", isDarkMode ? "text-slate-400" : "text-white")}>S.No</th>
                    <th className={cn("px-4 py-3 font-bold uppercase tracking-wider text-xs w-[350px]", isDarkMode ? "text-slate-400" : "text-white")}>Task Details</th>
                    <th className={cn("px-4 py-3 font-bold uppercase tracking-wider text-xs", isDarkMode ? "text-slate-400" : "text-white")}>Workflow Timeline</th>
                  </>
                ) : (
                  <>
                    <th className={cn("px-4 py-3 font-bold uppercase tracking-wider text-xs", isDarkMode ? "text-slate-400" : "text-white")}>S.No</th>
                    <th className={cn("px-4 py-3 font-bold uppercase tracking-wider text-xs", isDarkMode ? "text-slate-400" : "text-white")}>Task Details</th>
                    <th className={cn("px-4 py-3 font-bold uppercase tracking-wider text-xs", isDarkMode ? "text-slate-400" : "text-white")}>Category</th>
                    <th className={cn("px-4 py-3 font-bold uppercase tracking-wider text-xs", isDarkMode ? "text-slate-400" : "text-white")}>Assignee</th>
                    <th className={cn("px-4 py-3 font-bold uppercase tracking-wider text-xs", isDarkMode ? "text-slate-400" : "text-white")}>Priority</th>
                    <th className={cn("px-4 py-3 font-bold uppercase tracking-wider text-xs", isDarkMode ? "text-slate-400" : "text-white")}>Due Date</th>
                    <th className={cn("px-4 py-3 font-bold uppercase tracking-wider text-xs", isDarkMode ? "text-slate-400" : "text-white")}>Status</th>
                    <th className={cn("px-4 py-3 font-bold uppercase tracking-wider text-xs text-right", isDarkMode ? "text-slate-400" : "text-white")}>Actions</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700/50">
              {loadingTasks ? (
                <tr><td colSpan={fromDashboard ? "3" : "8"} className="p-8 text-center">Loading tasks from database...</td></tr>
              ) : paginatedTasks.length > 0 ? paginatedTasks.map((task, idx) => {
                const displayId = task.id || task.taskId || idx;
                const sNo = (currentPage - 1) * itemsPerPage + idx + 1;
                const taskName = task.taskDesc || task.title || 'No Description';
                const taskUid = task.taskUid || `TSK-${String(displayId).padStart(3, '0')}`;
                const displayCategory = task.categoryName || getCategoryName(task.category || task.categoryId);
                const displaySubCategory = task.subCategoryName || getSubCategoryName(task.subCategory || task.subCategoryId);
                const displayAssignee = task.assignToName || task.assignedTo || 'Unassigned';
                const displayPriority = task.priorityName || task.priority || 'Medium';
                const displayStatus = task.statusName || task.status || 'New Task';
                const isTimelineVisible = fromDashboard && !collapsedTaskIds.has(task.id || task.taskId);

                if (fromDashboard) {
                  return (
                    <tr
                      key={displayId}
                      onClick={() => navigate(`/tasks/view/${displayId}`)}
                      className={cn("transition-all duration-200 group cursor-pointer border-l-4 hover:bg-slate-50 dark:hover:bg-slate-700/40 border-l-transparent",
                        idx % 2 === 0 ? "bg-transparent" : (isDarkMode ? "bg-slate-800/20" : "bg-slate-50/50")
                      )}>
                      <td className="px-4 py-4 font-bold text-slate-500 dark:text-slate-400">{sNo}</td>
                      <td className="px-4 py-4">
                        <p className={cn("font-bold text-base", isDarkMode ? "text-slate-100" : "text-slate-900")}>{taskName}</p>
                        <div className="flex flex-wrap items-center gap-2 mt-1">
                          <span className="text-xs font-bold px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400">
                            {taskUid}
                          </span>
                          {task.project && !isNoProject(task.project) && (
                            <span className="text-xs font-bold px-2 py-0.5 rounded bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-400">
                              Proj: {task.project}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="w-full overflow-x-auto pb-1 no-scrollbar">
                          <WaterfallFlow
                            currentStage={task.stage || 'Planning'}
                            deadlines={task.stageDeadlines}
                            stages={getSortedStages(task)}
                            stageTasks={task.stageTasks}
                            taskStatusName={task.statusName || task.status}
                            readOnly={true}
                            compact={true}
                          />
                        </div>
                      </td>
                    </tr>
                  );
                }

                return (
                  <React.Fragment key={displayId}>
                    <tr
                      onClick={() => {
                        if (fromDashboard) {
                          const taskId = task.id || task.taskId;
                          setCollapsedTaskIds(prev => {
                            const next = new Set(prev);
                            if (next.has(taskId)) {
                              next.delete(taskId);
                            } else {
                              next.add(taskId);
                            }
                            return next;
                          });
                        } else {
                          navigate(`/tasks/view/${displayId}`);
                        }
                      }}
                      className={cn("transition-all duration-200 group cursor-pointer border-l-4",
                        isTimelineVisible
                          ? (isDarkMode ? "bg-indigo-500/20 text-white font-bold border-l-indigo-500" : "bg-indigo-50/80 text-indigo-900 font-bold border-l-indigo-500")
                          : (isDarkMode ? "hover:bg-slate-700/40 border-l-transparent" : "hover:bg-slate-50 border-l-transparent"),
                        !isTimelineVisible && (idx % 2 === 0 ? "bg-transparent" : (isDarkMode ? "bg-slate-800/20" : "bg-slate-50/50"))
                      )}>
                      <td className="px-4 py-4 font-bold text-slate-500 dark:text-slate-400">{sNo}</td>
                      <td className="px-4 py-4">
                        <p className={cn("font-bold text-base", isDarkMode ? "text-slate-100" : "text-slate-900")}>{taskName}</p>
                        <div className="flex flex-wrap items-center gap-2 mt-1">
                          <span className="text-xs font-bold px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400">
                            {taskUid}
                          </span>
                          {task.project && !isNoProject(task.project) && (
                            <span className="text-xs font-bold px-2 py-0.5 rounded bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-400">
                              Proj: {task.project}
                            </span>
                          )}
                          {task.reference && (
                            <span className={cn("text-xs font-medium", isDarkMode ? "text-slate-400" : "text-slate-500")}>
                              • {task.reference}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <p className={cn("font-semibold", isDarkMode ? "text-slate-300" : "text-slate-700")}>{displayCategory}</p>
                        <p className={cn("text-xs font-medium mt-1", isDarkMode ? "text-slate-400" : "text-slate-500")}>{displaySubCategory}</p>
                      </td>
                      <td className={cn("px-4 py-4 font-bold", isDarkMode ? "text-slate-300" : "text-slate-700")}>
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
                      <td className="px-4 py-4">
                        <span className={cn("px-2 py-1.5 rounded-xl text-xs font-bold tracking-wide whitespace-nowrap", getPriorityColor(displayPriority))}>
                          {displayPriority}
                        </span>
                      </td>
                      <td className={cn("px-4 py-4 font-semibold whitespace-nowrap", isDarkMode ? "text-slate-300" : "text-slate-700")}>{formatDateToDDMMYYYY(task.dueDate)}</td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <StatusBadge status={displayStatus} isDarkMode={isDarkMode} />
                      </td>
                      <td className="px-4 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {fromDashboard && (
                            <Link
                              to={`/tasks/view/${displayId}`}
                              onClick={(e) => e.stopPropagation()}
                              className={cn("p-2 rounded-xl transition-all duration-200", isDarkMode ? "hover:bg-indigo-500/20 text-indigo-400" : "hover:bg-indigo-50 text-indigo-600")}
                              title="View Task Details"
                            >
                              <Eye className="w-4 h-4" />
                            </Link>
                          )}
                          {((displayCategory === 'Development' && displaySubCategory === 'Software Development') ||
                            (task.stageDeadlines && Object.keys(task.stageDeadlines).length > 0)) && (
                              <Link
                                to={`/tasks/waterfall/${displayId}`}
                                onClick={(e) => e.stopPropagation()}
                                className={cn("p-2 rounded-xl transition-all duration-200", isDarkMode ? "hover:bg-purple-500/20 text-purple-400" : "hover:bg-purple-50 text-purple-600")}
                                title="Manage Waterfall Stages"
                              >
                                <Layers className="w-4 h-4" />
                              </Link>
                            )}
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
                          {canUpdateTask && canEditTask(task) && (
                            <Link to={`/tasks/edit/${displayId}`} onClick={(e) => e.stopPropagation()} className={cn("p-2 rounded-xl transition-all duration-200", isDarkMode ? "hover:bg-blue-500/20 text-blue-400" : "hover:bg-blue-50 text-blue-600")} title="Edit Task">
                              <Edit className="w-4 h-4" />
                            </Link>
                          )}
                          {canUpdateTask && !canEditTask(task) && !isAdmin && (
                            <span
                              title="Edit window expired (30 min)"
                              className={cn("p-2 rounded-xl cursor-not-allowed opacity-40", isDarkMode ? "text-blue-400" : "text-blue-600")}
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Edit className="w-4 h-4" />
                            </span>
                          )}
                          {canDeleteTask && (
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
                          )}
                        </div>
                      </td>
                    </tr>
                    {isTimelineVisible && (
                      <tr className="bg-slate-50/50 dark:bg-slate-800/10">
                        <td colSpan="8" className="px-2 py-2 border-t border-b dark:border-slate-700/50 border-slate-100">
                          <div className="w-full animate-[fadeIn_0.2s_ease-out] overflow-x-auto pb-4 no-scrollbar">
                            {/* <h3 className={cn("text-base font-black tracking-tight mb-6 flex items-center gap-2", isDarkMode ? "text-slate-200" : "text-slate-800")}>
                              <span className="w-1.5 h-4 rounded-full bg-indigo-500"></span>
                              <span>Lifecycle Progress</span>
                            </h3> */}
                            <WaterfallFlow
                              currentStage={task.stage || 'Planning'}
                              deadlines={task.stageDeadlines}
                              stages={getSortedStages(task)}
                              stageTasks={task.stageTasks}
                              taskStatusName={task.statusName || task.status}
                              readOnly={true}
                            />
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                )
              }) : (
                <tr>
                  <td colSpan={fromDashboard ? "3" : "8"} className="px-6 py-16 text-center">
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

      {/* Print-Only Table (All matching data, no pagination) */}
      <div className="hidden print:block w-full">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-100 border-b border-slate-300">
              <th className="px-3 py-3 font-bold text-slate-700 uppercase tracking-wider text-[10px] border border-slate-300">S.No</th>
              <th className="px-3 py-3 font-bold text-slate-700 uppercase tracking-wider text-[10px] border border-slate-300">Task UID</th>
              <th className="px-3 py-3 font-bold text-slate-700 uppercase tracking-wider text-[10px] border border-slate-300">Task Details</th>
              <th className="px-3 py-3 font-bold text-slate-700 uppercase tracking-wider text-[10px] border border-slate-300">Category / Sub</th>
              <th className="px-3 py-3 font-bold text-slate-700 uppercase tracking-wider text-[10px] border border-slate-300">Assignee</th>
              <th className="px-3 py-3 font-bold text-slate-700 uppercase tracking-wider text-[10px] border border-slate-300">Priority</th>
              <th className="px-3 py-3 font-bold text-slate-700 uppercase tracking-wider text-[10px] border border-slate-300">Due Date</th>
              <th className="px-3 py-3 font-bold text-slate-700 uppercase tracking-wider text-[10px] border border-slate-300">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {filteredTasks.length > 0 ? filteredTasks.map((task, idx) => {
              const displayId = task.id || task.taskId || idx;
              const taskName = task.taskDesc || task.title || 'No Description';
              const taskUid = task.taskUid || `TSK-${String(displayId).padStart(3, '0')}`;
              const displayCategory = task.categoryName || getCategoryName(task.category || task.categoryId);
              const displaySubCategory = task.subCategoryName || getSubCategoryName(task.subCategory || task.subCategoryId);
              const displayAssignee = task.assignToName || task.assignedTo || 'Unassigned';
              const displayPriority = task.priorityName || task.priority || 'Medium';
              const displayStatus = task.statusName || task.status || 'New Task';

              return (
                <tr key={`print-${displayId}`} className="border-b border-slate-300 page-break-inside-avoid">
                  <td className="px-3 py-3 border border-slate-300 font-semibold text-slate-600 text-center">{idx + 1}</td>
                  <td className="px-3 py-3 border border-slate-300 font-bold text-slate-800">{taskUid}</td>
                  <td className="px-3 py-3 border border-slate-300 font-medium text-slate-900 max-w-xs whitespace-normal break-words">
                    {taskName}
                    <div className="flex flex-wrap items-center gap-1.5 mt-1">
                      {task.project && !isNoProject(task.project) && (
                        <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200">
                          Proj: {task.project}
                        </span>
                      )}
                      {task.reference && (
                        <span className="text-[9px] text-slate-500 font-medium">
                          • Ref: {task.reference}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-3 border border-slate-300 font-semibold text-slate-700">
                    <div>{displayCategory}</div>
                    {displaySubCategory && <div className="text-[10px] text-slate-500 font-normal mt-0.5">{displaySubCategory}</div>}
                  </td>
                  <td className="px-3 py-3 border border-slate-300 font-semibold text-slate-700">{displayAssignee}</td>
                  <td className="px-3 py-3 border border-slate-300 font-bold text-slate-700 text-center">{displayPriority}</td>
                  <td className="px-3 py-3 border border-slate-300 text-center whitespace-nowrap">{formatDateToDDMMYYYY(task.dueDate)}</td>
                  <td className="px-3 py-3 border border-slate-300 font-bold text-slate-800 text-center">{displayStatus}</td>
                </tr>
              );
            }) : (
              <tr>
                <td colSpan="8" className="px-3 py-6 text-center text-slate-500 font-medium border border-slate-300">
                  No tasks available.
                </td>
              </tr>
            )}
          </tbody>
        </table>
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

      {isRefreshing && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-2.5 rounded-full shadow-lg bg-indigo-600 text-white text-sm font-black tracking-wide animate-bounce">
          <RefreshCcw className="w-4 h-4 animate-spin" />
          <span>Refreshing...</span>
        </div>
      )}
    </div>
  );
}
