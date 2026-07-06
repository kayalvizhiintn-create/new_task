import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore, INITIAL_DASHBOARD_METRICS } from '../store/useStore';
import { cn } from '../utils/cn';
import { taskService } from '../services/taskService';
import { categoryService } from '../services/categoryService';
import { developmentService } from '../services/developmentService';
import { supportService } from '../services/supportService';
import { hardwareOthersService } from '../services/hardwareOthersService';
import projectWorkflowService from '../services/projectWorkflowService';
import { formatDateToDDMMYYYY } from '../utils/dateFormatter';
import { SecureComponent } from '../components/SecureComponent';

import {
  Briefcase, CheckCircle2, Clock, AlertCircle, TrendingUp, FolderGit2, RefreshCcw,
  Hourglass, PauseCircle, XCircle, ChevronLeft, ChevronRight, Eye, Sparkles,
  Activity, AlertTriangle, PlusSquare, Target, Calendar,
  ClipboardCheck, FilePlus, PlayCircle, Hand, AlarmClock, CalendarPlus, ListTodo,
  Code, HelpCircle, Laptop, ShoppingCart, Cloud, MapPin
} from 'lucide-react';


const StatCard = ({ title, value, icon: Icon, gradientFrom, gradientTo, onClick }) => {
  return (
    <div
      onClick={onClick}
      className={cn(
        "relative overflow-hidden p-2 sm:p-3 md:p-4 rounded-[20px] transition-all duration-300 hover:-translate-y-1 group flex items-center gap-2 sm:gap-3 md:gap-4 shadow-md hover:shadow-xl text-white",
        `bg-gradient-to-br ${gradientFrom} ${gradientTo}`,
        onClick && "cursor-pointer"
      )}>

      {/* Decorative overlays */}
      <div className="absolute -right-6 -top-6 w-24 h-24 rounded-full bg-white/20 blur-2xl group-hover:bg-white/30 transition-colors duration-300" />
      <div className="absolute -left-6 -bottom-6 w-20 h-20 rounded-full bg-black/5 blur-xl" />

      <div className="p-1.5 sm:p-2.5 md:p-3 rounded-2xl bg-white/20 backdrop-blur-md shadow-sm flex-shrink-0 relative z-10 transform group-hover:scale-105 group-hover:rotate-6 transition-all duration-300 border border-white/10">
        <Icon className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-white" strokeWidth={2.5} />
      </div>

      <div className="min-w-0 flex-1 relative z-10">
        <p className="text-[9px] sm:text-[10px] md:text-[11px] font-black tracking-wider mb-0.5 uppercase leading-tight drop-shadow-sm" title={title}>
          {title}
        </p>
        <h3 className="text-xl sm:text-2xl md:text-3xl font-black tracking-tight drop-shadow-sm">
          {value}
        </h3>
      </div>
    </div>
  );
};


export default function Dashboard() {
  const { isDarkMode } = useStore();
  const navigate = useNavigate();

  const getTodayString = () => {
    const todayLocal = new Date();
    return `${todayLocal.getFullYear()}-${String(todayLocal.getMonth() + 1).padStart(2, '0')}-${String(todayLocal.getDate()).padStart(2, '0')}`;
  };

  const [tasks, setTasks] = useState([]);
  const [apiCategories, setApiCategories] = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  const [loadingTasks, setLoadingTasks] = useState(true);
  const [selectedDate, setSelectedDate] = useState(getTodayString());
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [projectSummary, setProjectSummary] = useState(null);

  const loadData = async (isBackground = false) => {
    if (!isBackground) setLoadingTasks(true);
    try {
      const [res, catsRes, devRes, supportRes, hwRes, projSummaryRes] = await Promise.all([
        taskService.getAllTasks().catch(() => []),
        categoryService.getAllCategories().catch(() => []),
        developmentService.getAll().catch(() => []),
        supportService.getAll().catch(() => []),
        hardwareOthersService.getAll().catch(() => []),
        projectWorkflowService.getDashboardSummary().catch(() => null)
      ]);
      setTasks(Array.isArray(res) ? res : (res?.data || []));
      const cats = Array.isArray(catsRes) ? catsRes : (catsRes?.data || catsRes?.items || []);
      setApiCategories(cats);

      const ensureArray = (d) => Array.isArray(d) ? d : (d?.data || d?.items || []);
      const subs = [
        ...ensureArray(devRes),
        ...ensureArray(supportRes),
        ...ensureArray(hwRes)
      ];
      setSubCategories(subs);

      if (projSummaryRes && projSummaryRes.isSuccess) {
        setProjectSummary(projSummaryRes.data);
      }
    } catch (error) {
      console.error("Error fetching data for dashboard", error);
    } finally {
      if (!isBackground) setLoadingTasks(false);
    }
  };

  React.useEffect(() => {
    loadData();

    // 15-minute background refresh interval
    const intervalId = setInterval(async () => {
      setIsRefreshing(true);
      await loadData(true);
      setTimeout(() => setIsRefreshing(false), 1000);
    }, 15 * 60 * 1000);

    return () => clearInterval(intervalId);
  }, []);

  const getCategoryName = (idOrName) => {
    if (!idOrName && idOrName !== 0) return 'No Category';
    const cat = apiCategories.find(c => String(c.categoryId || c.id || c._id) === String(idOrName));
    return cat ? (cat.categoryName || cat.name) : String(idOrName);
  };

  const getStatusName = (t) => String(t.statusName || t.status || 'New Task');

  const matchesStatus = (t, target) => {
    const s = getStatusName(t).toLowerCase().trim();
    if (target === 'review') return s.includes('review');
    if (target === 'progress') return s.includes('progress') || s.includes('going');
    if (target === 'hold') return s.includes('hold') || s.includes('pause') || s.includes('pending');
    if (target === 'completed') return s.includes('complete') || s.includes('done') || s.includes('close');
    if (target === 'cancelled') return s.includes('cancel') || s.includes('reject');
    if (target === 'new') return s === 'new task' || s === 'new' || s === 'newtask' || s === 'open' || s.includes('assigned');
    return s === target.toLowerCase();
  };

  const inProgressTasks = tasks.filter(t => matchesStatus(t, 'progress')).length;
  const onHoldTasks = tasks.filter(t => matchesStatus(t, 'hold')).length;
  const newTaskCount = tasks.filter(t => matchesStatus(t, 'new')).length;

  // Use local date (not UTC) to avoid IST timezone mismatch
  const today = getTodayString();

  const overdueTasks = tasks.filter(t =>
    t.dueDate && t.dueDate !== '0001-01-01' && t.dueDate < today && !matchesStatus(t, 'completed') && !matchesStatus(t, 'cancelled')
  ).length;

  const todayCreatedTasks = tasks.filter(t => {
    // Backend returns 'createdTime' (from TaskidBo.cs)
    const createdDate = t.createdTime || t.createdAt || t.createdDate || t.dateCreated || t.CreatedTime;
    return createdDate && createdDate.toString().startsWith(today);
  }).length;
  const todayDeadlinedTasks = tasks.filter(t => t.dueDate && t.dueDate !== '0001-01-01' && t.dueDate.startsWith(today)).length;

  const categoryNamesList = apiCategories.length > 0
    ? apiCategories.map(c => c.categoryName || c.name || c.id)
    : ['Development', 'Events', 'Support', 'Hardware Sales', 'Purchase', 'Zoho', 'Visits'];
  const allCategories = Array.from(new Set(categoryNamesList)).filter(Boolean);

  const getMetricButtonClass = (label) => {
    const baseClass = "px-3 py-1.5 rounded-md text-[13px] font-bold transition-all duration-200 shadow-md hover:scale-105 ";
    if (label === 'New Task') return baseClass + "bg-zoho-green hover:bg-zoho-green-dark text-white";
    if (label === 'In Progress') return baseClass + "bg-zoho-blue hover:bg-zoho-blue-dark text-white";
    if (label === 'On-hold') return baseClass + "bg-zoho-yellow hover:bg-zoho-yellow-dark text-white";
    if (label === 'Overdue') return baseClass + "bg-zoho-red hover:bg-zoho-red-dark text-white";
    if (label === 'Today created') return baseClass + "bg-zoho-violet hover:bg-zoho-violet-dark text-white";
    if (label === "Today's task") return baseClass + "bg-zoho-wine hover:bg-zoho-wine-dark text-white";
    if (label === 'Total') return baseClass + "bg-slate-800 hover:bg-black text-white dark:bg-slate-600 dark:hover:bg-slate-500";
    return baseClass + "bg-indigo-600 hover:bg-indigo-700 text-white";
  };

  const renderCalendar = () => {
    const todayObj = new Date();
    const todayStrLocal = todayObj.toISOString().split('T')[0];

    const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
    const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay();

    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

    const days = [];
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      const d = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), i);
      const offset = d.getTimezoneOffset()
      const dLocal = new Date(d.getTime() - (offset * 60 * 1000))
      days.push(dLocal.toISOString().split('T')[0]);
    }

    const handlePrevMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
    const handleNextMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));

    const tasksByDate = {};
    tasks.forEach(t => {
      if (t.dueDate && t.dueDate !== '0001-01-01') {
        if (!tasksByDate[t.dueDate]) tasksByDate[t.dueDate] = [];
        tasksByDate[t.dueDate].push(t);
      }
    });

    const getPriorityConfig = (priority) => {
      switch (priority) {
        case 'Critical':
          return {
            label: 'Critical',
            accent: 'bg-gradient-to-b from-rose-500 to-red-600',
            text: 'text-rose-600 dark:text-rose-400',
            bg: 'bg-rose-50 dark:bg-rose-950/20 border-rose-100 dark:border-rose-900/30',
            icon: AlertCircle
          };
        case 'High':
          return {
            label: 'High',
            accent: 'bg-gradient-to-b from-orange-500 to-amber-500',
            text: 'text-orange-600 dark:text-orange-400',
            bg: 'bg-orange-50 dark:bg-orange-950/20 border-orange-100 dark:border-orange-900/30',
            icon: AlertTriangle
          };
        case 'Medium':
          return {
            label: 'Medium',
            accent: 'bg-gradient-to-b from-blue-500 to-indigo-500',
            text: 'text-blue-600 dark:text-blue-400',
            bg: 'bg-blue-50 dark:bg-blue-950/20 border-blue-100 dark:border-blue-900/30',
            icon: Activity
          };
        case 'Low':
          return {
            label: 'Low',
            accent: 'bg-gradient-to-b from-slate-400 to-slate-500',
            text: 'text-slate-600 dark:text-slate-400',
            bg: 'bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-700/50',
            icon: Clock
          };
        default:
          return {
            label: priority || 'Low',
            accent: 'bg-gradient-to-b from-slate-400 to-slate-500',
            text: 'text-slate-600 dark:text-slate-400',
            bg: 'bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-700/50',
            icon: Clock
          };
      }
    };

    const getCategoryConfig = (categoryName) => {
      const name = (categoryName || '').toLowerCase();
      if (name.includes('dev')) return { icon: Code, color: 'text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-950/30 border-blue-100 dark:border-blue-900/30' };
      if (name.includes('event')) return { icon: Calendar, color: 'text-purple-600 bg-purple-50 dark:text-purple-400 dark:bg-purple-950/30 border-purple-100 dark:border-purple-900/30' };
      if (name.includes('support')) return { icon: HelpCircle, color: 'text-emerald-600 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-950/30 border-emerald-100 dark:border-emerald-900/30' };
      if (name.includes('sale') || name.includes('hardware')) return { icon: Laptop, color: 'text-pink-600 bg-pink-50 dark:text-pink-400 dark:bg-pink-950/30 border-pink-100 dark:border-pink-900/30' };
      if (name.includes('purchase')) return { icon: ShoppingCart, color: 'text-amber-600 bg-amber-50 dark:text-amber-400 dark:bg-amber-950/30 border-amber-100 dark:border-amber-900/30' };
      if (name.includes('zoho')) return { icon: Cloud, color: 'text-indigo-600 bg-indigo-50 dark:text-indigo-400 dark:bg-indigo-950/30 border-indigo-100 dark:border-indigo-900/30' };
      if (name.includes('visit')) return { icon: MapPin, color: 'text-rose-600 bg-rose-50 dark:text-rose-400 dark:bg-rose-950/30 border-rose-100 dark:border-rose-900/30' };
      return { icon: Briefcase, color: 'text-slate-600 bg-slate-50 dark:text-slate-400 dark:bg-slate-800/50 border-slate-100 dark:border-slate-700/50' };
    };

    const getStatusColor = (status) => {
      switch (status) {
        case 'Completed': return isDarkMode ? 'text-emerald-400' : 'text-emerald-600';
        case 'In Progress': return isDarkMode ? 'text-blue-400' : 'text-blue-600';
        case 'Open': return isDarkMode ? 'text-amber-400' : 'text-amber-600';
        case 'Pending': return isDarkMode ? 'text-purple-400' : 'text-purple-600';
        case 'On Hold': return isDarkMode ? 'text-slate-400' : 'text-slate-600';
        case 'Cancelled': return isDarkMode ? 'text-rose-400' : 'text-rose-600';
        default: return isDarkMode ? 'text-slate-400' : 'text-slate-600';
      }
    };

    const StatusBadge = ({ status }) => {
      const isProgress = status === 'In Progress';
      return (
        <div className={cn(
          "flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border shadow-sm flex-shrink-0",
          status === 'Completed' ? "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/30" :
            status === 'In Progress' ? "bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 border-blue-100 dark:border-blue-900/30" :
              status === 'Open' || status === 'New Task' ? "bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-900/30" :
                status === 'Pending' ? "bg-purple-50 dark:bg-purple-950/20 text-purple-600 dark:text-purple-400 border-purple-100 dark:border-purple-900/30" :
                  status === 'On Hold' ? "bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 border-slate-100 dark:border-slate-700/50" :
                    "bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 border-rose-100 dark:border-rose-900/30"
        )}>
          <span className="relative flex h-2 w-2">
            {isProgress && (
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
            )}
            <span className={cn("relative inline-flex rounded-full h-2 w-2",
              status === 'Completed' ? "bg-emerald-500" :
                status === 'In Progress' ? "bg-blue-500" :
                  status === 'Open' || status === 'New Task' ? "bg-amber-500" :
                    status === 'Pending' ? "bg-purple-500" :
                      status === 'On Hold' ? "bg-slate-400" :
                        "bg-rose-500"
            )}></span>
          </span>
          <span>{status}</span>
        </div>
      );
    };

    const renderTaskCard = (task) => {
      const priorityInfo = getPriorityConfig(task.priorityName || task.priority);
      const categoryInfo = getCategoryConfig(task.categoryName || getCategoryName(task.category || task.categoryId));
      const CategoryIcon = categoryInfo.icon;
      const PriorityIcon = priorityInfo.icon;
      const status = getStatusName(task);

      return (
        <div
          key={task.id || task.taskId}
          className={cn(
            "relative pl-6 p-4 rounded-[1.25rem] border text-left cursor-pointer transition-all duration-300 overflow-hidden group",
            isDarkMode
              ? "bg-slate-800/40 border-slate-700/50 hover:bg-slate-800/80 hover:border-indigo-500/30"
              : "bg-white border-slate-100 hover:border-indigo-200 hover:shadow-[0_8px_30px_rgb(99,102,241,0.06)] shadow-sm"
          )}
          onClick={() => navigate(`/tasks/view/${task.id || task.taskId}`)}
        >
          {/* Vertical priority accent bar */}
          <div className={cn("absolute left-0 top-0 bottom-0 w-1.5 transition-all duration-300 group-hover:w-2", priorityInfo.accent)} />

          {/* Content */}
          <div className="flex flex-col h-full justify-between gap-3">
            <div>
              {/* Header: Priority pill */}
              <div className="flex items-center gap-2 mb-2">
                <span className={cn(
                  "flex items-center gap-1 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border",
                  priorityInfo.bg,
                  priorityInfo.text
                )}>
                  <PriorityIcon className="w-3 h-3" />
                  {priorityInfo.label} Priority
                </span>
              </div>

              <h5 className={cn(
                "text-sm font-bold tracking-tight line-clamp-2 leading-snug group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors duration-200",
                isDarkMode ? "text-slate-100" : "text-slate-800"
              )}>
                {task.title || task.taskDesc}
              </h5>
            </div>

            {/* Footer: Category and Status */}
            <div className="flex flex-wrap items-center justify-between gap-1.5 mt-1 pt-2 border-t border-dashed border-slate-100 dark:border-slate-800/60">
              {/* Category pill with icon */}
              <span className={cn(
                "flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-lg border flex-shrink-0",
                categoryInfo.color
              )}>
                <CategoryIcon className="w-3 h-3 flex-shrink-0" />
                {task.categoryName || getCategoryName(task.category || task.categoryId)}
              </span>

              <StatusBadge status={status} />
            </div>
          </div>
        </div>
      );
    };

    return (
      <div className={cn("p-6 md:p-8 rounded-[2rem] border shadow-lg transition-all duration-300 h-full backdrop-blur-xl",
        isDarkMode ? "bg-slate-900/40 border-slate-700/50" : "bg-white/80 border-slate-200/60"
      )}>
        <div className="flex items-center justify-between mb-8">
          <h3 className={cn("text-xl md:text-2xl font-black tracking-tight", isDarkMode ? "text-white" : "text-slate-800")}>
            {monthNames[currentMonth.getMonth()]} <span className="text-indigo-500">{currentMonth.getFullYear()}</span>
          </h3>
          <div className="flex gap-2">
            <button onClick={handlePrevMonth} className={cn("p-2 rounded-xl transition-all duration-200 hover:scale-105", isDarkMode ? "bg-slate-800 hover:bg-slate-700 text-slate-300" : "bg-white shadow-sm border border-slate-200 hover:bg-slate-50 text-slate-600")}>
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button onClick={handleNextMonth} className={cn("p-2 rounded-xl transition-all duration-200 hover:scale-105", isDarkMode ? "bg-slate-800 hover:bg-slate-700 text-slate-300" : "bg-white shadow-sm border border-slate-200 hover:bg-slate-50 text-slate-600")}>
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-1 mb-4 text-center">
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, idx) => (
            <div key={d + idx} className={cn("text-[10px] md:text-xs font-black uppercase", isDarkMode ? "text-slate-500" : "text-slate-400")}>{d}</div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-2 text-center">
          {days.map((dateStr, i) => {
            if (!dateStr) return <div key={`empty-${i}`} className="p-2"></div>;

            const isToday = dateStr === todayStrLocal;
            const isSelected = dateStr === selectedDate;
            const hasEvents = tasksByDate[dateStr] && tasksByDate[dateStr].length > 0;
            const dayNum = parseInt(dateStr.split('-')[2], 10);

            return (
              <button
                key={dateStr}
                onClick={() => setSelectedDate(dateStr)}
                className={cn("relative p-2 rounded-2xl text-sm font-bold transition-all duration-300 aspect-square flex flex-col items-center justify-center group",
                  isSelected ? "bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-lg shadow-purple-500/30 scale-110 z-10" :
                    isToday ? "today-highlight" :
                      hasEvents ? "bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/20" :
                        isDarkMode ? "hover:bg-slate-800 text-slate-300" : "hover:bg-slate-100 text-slate-700"
                )}
              >
                <span>{dayNum}</span>
                {hasEvents && !isSelected && !isToday && (
                  <span className="absolute bottom-1.5 w-1.5 h-1.5 rounded-full bg-indigo-500 dark:bg-indigo-400 group-hover:scale-125 transition-transform"></span>
                )}
              </button>
            );
          })}
        </div>

        {selectedDate && (() => {
          const selectedDayTasks = tasksByDate[selectedDate] || [];
          const visitsList = selectedDayTasks.filter(task => {
            const catName = task.categoryName || getCategoryName(task.category || task.categoryId);
            return (catName || '').toLowerCase().includes('visit');
          });
          const eventsList = selectedDayTasks.filter(task => {
            const catName = task.categoryName || getCategoryName(task.category || task.categoryId);
            return !(catName || '').toLowerCase().includes('visit');
          });

          return (
            <div className="mt-8 pt-6 border-t dark:border-slate-700/50 animate-[fadeIn_0.3s_ease-out]">
              <div className="flex items-center justify-between mb-6">
                <h4 className={cn("text-base font-black tracking-tight flex items-center gap-2", isDarkMode ? "text-slate-200" : "text-slate-800")}>
                  <span className="w-1.5 h-4 rounded-full bg-indigo-500"></span>
                  Schedule for <span className="text-indigo-500">{formatDateToDDMMYYYY(selectedDate)}</span>
                  {selectedDayTasks.length > 0 && (
                    <span className="ml-1.5 text-[10px] font-black px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/30">
                      {selectedDayTasks.length}
                    </span>
                  )}
                </h4>
                <button
                  onClick={() => setSelectedDate(getTodayString())}
                  className={cn(
                    "text-xs font-bold px-3 py-1.5 rounded-xl border flex items-center gap-1.5 transition-all duration-300 hover:scale-105 active:scale-95",
                    isDarkMode
                      ? "bg-slate-800/60 border-slate-700 hover:bg-slate-700 text-slate-300"
                      : "bg-white border-slate-200 hover:bg-slate-50 text-slate-600 shadow-sm"
                  )}
                >
                  <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Today</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {/* Column 1: Visits */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b dark:border-slate-800 border-slate-100">
                    <span className={cn("text-xs font-black uppercase tracking-wider flex items-center gap-1.5", isDarkMode ? "text-slate-400" : "text-slate-500")}>
                      <MapPin className="w-4 h-4 text-rose-500 animate-pulse" />
                      <span>{selectedDate === today ? "Today's Visits" : "Visits"}</span>
                    </span>
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-900/30">
                      {visitsList.length}
                    </span>
                  </div>
                  <div className="space-y-3.5 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
                    {visitsList.length > 0 ? (
                      visitsList.map(task => renderTaskCard(task))
                    ) : (
                      <div className="flex flex-col items-center justify-center py-10 text-center border border-dashed rounded-2xl dark:border-slate-800 border-slate-200 bg-slate-50/30 dark:bg-slate-900/10">
                        <MapPin className="w-8 h-8 text-slate-400 dark:text-slate-500 mb-2 opacity-50" />
                        <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 italic">No visits scheduled.</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Column 2: Scheduled */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b dark:border-slate-800 border-slate-100">
                    <span className={cn("text-xs font-black uppercase tracking-wider flex items-center gap-1.5", isDarkMode ? "text-slate-400" : "text-slate-500")}>
                      <Calendar className="w-4 h-4 text-indigo-500" />
                      <span>{selectedDate === today ? "Today's Scheduled" : "Scheduled"}</span>
                    </span>
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/30">
                      {eventsList.length}
                    </span>
                  </div>
                  <div className="space-y-3.5 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
                    {eventsList.length > 0 ? (
                      eventsList.map(task => renderTaskCard(task))
                    ) : (
                      <div className="flex flex-col items-center justify-center py-10 text-center border border-dashed rounded-2xl dark:border-slate-800 border-slate-200 bg-slate-50/30 dark:bg-slate-900/10">
                        <Calendar className="w-8 h-8 text-slate-400 dark:text-slate-500 mb-2 opacity-50" />
                        <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 italic">No scheduled tasks.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })()}
      </div>
    );
  };

  const getItemId = (item) => item.subCategoryId || item.subreadonlyId || item.subcategoryId || item.categoryId || item.id || item._id;

  // Apply the display order saved from Masters drag-and-drop (localStorage) to a list of items.
  // Falls back to API order if no saved order exists for that key.
  const applyMastersOrder = (items, localStorageKey, getId) => {
    try {
      const saved = localStorage.getItem(localStorageKey);
      if (!saved) return items;
      const order = JSON.parse(saved);
      if (!order || order.length === 0) return items;
      return [...items].sort((a, b) => {
        const aIdx = order.indexOf(String(getId(a)));
        const bIdx = order.indexOf(String(getId(b)));
        if (aIdx === -1 && bIdx === -1) return 0;
        if (aIdx === -1) return 1;
        if (bIdx === -1) return -1;
        return aIdx - bIdx;
      });
    } catch {
      return items;
    }
  };

  const cleanCatName = (name) => {
    if (!name) return '';
    return name.replace(/\s*\((project|development|support|hardware\s*&\s*others)\)/i, '').trim();
  };

  const getCatSection = (cat) => {
    const name = (cat?.categoryName || cat?.name || '').toLowerCase();
    if (name.includes('(project)') || name.includes('project') || name.includes('iot')) {
      return 'projects';
    }
    if (name.includes('(development)') || name.includes('development')) {
      return 'development';
    }
    if (name.includes('(support)') || name.includes('support')) {
      return 'support';
    }
    return 'hardwareOthers';
  };

  const getOrderedSubRows = (sectionName) => {
    const catsInSection = apiCategories.filter(cat => getCatSection(cat) === sectionName);
    const sortedCats = applyMastersOrder(
      catsInSection,
      `masters_cat_order_${sectionName}`,
      item => item.categoryId || item.id || item._id
    );

    const rows = [];
    sortedCats.forEach(cat => {
      const cid = parseInt(cat.categoryId || cat.id || cat._id || '', 10);
      const subsForCat = subCategories.filter(sub => {
        const subCid = parseInt(sub.categoryId || sub.category_id || sub.category || '', 10);
        return subCid === cid;
      });
      const sortedSubs = applyMastersOrder(
        subsForCat,
        `masters_sub_order_${cid}`,
        item => item.subCategoryId || item.id || item._id
      );
      rows.push(...sortedSubs);
    });
    return rows;
  };

  const devRows = getOrderedSubRows('development');
  const supportRows = getOrderedSubRows('support');

  const hwRows = applyMastersOrder(
    apiCategories.filter(cat => getCatSection(cat) === 'hardwareOthers'),
    'masters_cat_order_hardwareOthers',
    item => item.categoryId || item.id || item._id
  );

  // const projectRows = applyMastersOrder(
  //   apiCategories.filter(cat => getCatSection(cat) === 'projects'),
  //   'masters_cat_order_projects',
  //   item => item.categoryId || item.id || item._id
  // );

  const renderBreakdownTable = (title, rows, isSubCategoryTable, mainCategoryName) => {
    const getMetricTotal = (metricLabel) => {
      let filterFn;
      if (metricLabel === 'New Task') {
        filterFn = (t) => matchesStatus(t, 'new');
      } else if (metricLabel === 'In Progress') {
        filterFn = (t) => matchesStatus(t, 'progress');
      } else if (metricLabel === 'On-hold') {
        filterFn = (t) => matchesStatus(t, 'hold');
      } else if (metricLabel === 'Overdue') {
        filterFn = (t) => t.dueDate && t.dueDate !== '0001-01-01' && t.dueDate < today && !matchesStatus(t, 'completed') && !matchesStatus(t, 'cancelled');
      } else if (metricLabel === 'Today created') {
        filterFn = (t) => {
          const createdDate = t.createdTime || t.createdAt || t.createdDate || t.dateCreated || t.CreatedTime;
          return createdDate && createdDate.toString().startsWith(today);
        };
      } else if (metricLabel === "Today's task") {
        filterFn = (t) => t.dueDate && t.dueDate !== '0001-01-01' && t.dueDate.startsWith(today);
      } else if (metricLabel === 'Total') {
        filterFn = (t) => {
          const s = getStatusName(t).toLowerCase().trim();
          const isCompleted = s.includes('complete') || s.includes('done') || s.includes('close');
          const isCancelled = s.includes('cancel') || s.includes('reject');
          return !isCompleted && !isCancelled;
        };
      } else {
        filterFn = (t) => getStatusName(t).toLowerCase() === metricLabel.toLowerCase();
      }

      let totalCount = 0;
      rows.forEach(item => {
        const rawRowName = isSubCategoryTable
          ? (item.subCategoryName || item.name)
          : (item.categoryName || item.name);
        const name = isSubCategoryTable ? rawRowName : cleanCatName(rawRowName);
        const itemId = getItemId(item);

        if (isSubCategoryTable) {
          totalCount += tasks.filter(t => {
            const catName = getCategoryName(t.category || t.categoryId);
            const subName = t.subCategoryName || '';
            return (catName || '').toLowerCase().trim() === (mainCategoryName || '').toLowerCase().trim() &&
              (t.subCategoryId === itemId || subName.toLowerCase().trim() === (name || '').toLowerCase().trim()) &&
              filterFn(t);
          }).length;
        } else {
          totalCount += tasks.filter(t => {
            const catName = t.categoryName || getCategoryName(t.category || t.categoryId) || '';
            return (t.categoryId === itemId || cleanCatName(catName).toLowerCase().trim() === (name || '').toLowerCase().trim()) &&
              filterFn(t);
          }).length;
        }
      });
      return totalCount;
    };

    return (
      <div className={cn("rounded-xl border shadow-md transition-all duration-300 backdrop-blur-xl overflow-hidden mb-6",
        isDarkMode ? "bg-slate-900/60 border-slate-700/50" : "bg-white/90 border-slate-200"
      )}>
        <div className="p-4 border-b border-slate-200 dark:border-slate-700/50">
          <h3 className={cn("text-base font-extrabold tracking-tight", isDarkMode ? "text-indigo-400" : "text-indigo-650")}>
            {title}
          </h3>
        </div>
        <div className="w-full overflow-x-auto">
          <table className="w-full text-left text-sm min-w-[600px]">
            <thead className={cn("border-b-2", isDarkMode ? "bg-slate-800/90 border-slate-600" : "bg-slate-100 border-slate-300")}>
              <tr>
                <th className={cn("px-4 py-4 font-black uppercase tracking-wider text-xs", isDarkMode ? "text-slate-300" : "text-slate-700")}>
                  {isSubCategoryTable ? "Sub Category" : "Category"}
                </th>
                {INITIAL_DASHBOARD_METRICS.map(metric => (
                  <th key={metric} className={cn("px-2 py-4 font-black uppercase tracking-wider text-[10px] md:text-xs text-center leading-tight", isDarkMode ? "text-slate-300" : "text-slate-700")}>
                    {metric}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className={cn("divide-y", isDarkMode ? "divide-slate-700" : "divide-slate-100")}>
              {rows.map((item, idx) => {
                const rawName = isSubCategoryTable
                  ? (item.subCategoryName || item.name)
                  : (item.categoryName || item.name);
                const name = isSubCategoryTable ? rawName : cleanCatName(rawName);
                const itemId = getItemId(item);

                return (
                  <tr key={name + idx} className={cn("transition-all duration-300 group cursor-default",
                    isDarkMode ? "hover:bg-slate-800/80" : "hover:bg-slate-50",
                    idx % 2 === 0 ? "bg-transparent" : (isDarkMode ? "bg-slate-800/40" : "bg-slate-50/50")
                  )}>
                    <td className={cn("px-4 py-4 font-semibold text-sm", isDarkMode ? "text-slate-200" : "text-slate-700")}>
                      {name}
                    </td>
                    {INITIAL_DASHBOARD_METRICS.map(metricLabel => {
                      let filterFn;
                      if (metricLabel === 'New Task') {
                        filterFn = (t) => matchesStatus(t, 'new');
                      } else if (metricLabel === 'In Progress') {
                        filterFn = (t) => matchesStatus(t, 'progress');
                      } else if (metricLabel === 'On-hold') {
                        filterFn = (t) => matchesStatus(t, 'hold');
                      } else if (metricLabel === 'Overdue') {
                        filterFn = (t) => t.dueDate && t.dueDate !== '0001-01-01' && t.dueDate < today && !matchesStatus(t, 'completed') && !matchesStatus(t, 'cancelled');
                      } else if (metricLabel === 'Today created') {
                        filterFn = (t) => {
                          const createdDate = t.createdTime || t.createdAt || t.createdDate || t.dateCreated || t.CreatedTime;
                          return createdDate && createdDate.toString().startsWith(today);
                        };
                      } else if (metricLabel === "Today's task") {
                        filterFn = (t) => t.dueDate && t.dueDate !== '0001-01-01' && t.dueDate.startsWith(today);
                      } else if (metricLabel === 'Total') {
                        filterFn = (t) => {
                          const s = getStatusName(t).toLowerCase().trim();
                          const isCompleted = s.includes('complete') || s.includes('done') || s.includes('close');
                          const isCancelled = s.includes('cancel') || s.includes('reject');
                          return !isCompleted && !isCancelled;
                        };
                      } else {
                        filterFn = (t) => getStatusName(t).toLowerCase() === metricLabel.toLowerCase();
                      }

                      let count = 0;
                      if (isSubCategoryTable) {
                        count = tasks.filter(t => {
                          const catName = getCategoryName(t.category || t.categoryId);
                          const subName = t.subCategoryName || '';
                          return (catName || '').toLowerCase().trim() === (mainCategoryName || '').toLowerCase().trim() &&
                            (t.subCategoryId === itemId || subName.toLowerCase().trim() === (name || '').toLowerCase().trim()) &&
                            filterFn(t);
                        }).length;
                       } else {
                        count = tasks.filter(t => {
                          const catName = t.categoryName || getCategoryName(t.category || t.categoryId) || '';
                          return (t.categoryId === itemId || cleanCatName(catName).toLowerCase().trim() === (name || '').toLowerCase().trim()) &&
                            filterFn(t);
                        }).length;
                      }

                      const queryParams = new URLSearchParams();
                      if (isSubCategoryTable) {
                        queryParams.set('category', mainCategoryName);
                        queryParams.set('subcategory', name);
                      } else {
                        queryParams.set('category', name);
                      }
                      queryParams.set('status', metricLabel);

                      return (
                        <td key={metricLabel} className="px-2 py-4 text-center">
                          {count > 0 ? (
                            <button
                              onClick={() => navigate(`/tasks?${queryParams.toString()}`, { state: { fromDashboard: true } })}
                              className={getMetricButtonClass(metricLabel)}
                            >
                              {count}
                            </button>
                          ) : (
                            <span className={cn("font-medium text-sm", isDarkMode ? "text-slate-650" : "text-slate-400")}>0</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={INITIAL_DASHBOARD_METRICS.length + 1} className="text-center p-6 text-slate-500 font-medium">
                    No items found.
                  </td>
                </tr>
              )}
            </tbody>
            {rows.length > 0 && (
              <tfoot className={cn("border-t", isDarkMode ? "bg-slate-800/80 border-slate-700" : "bg-slate-50 border-slate-200")}>
                <tr className="group">
                  <td className={cn("px-4 py-4 font-bold text-sm", isDarkMode ? "text-slate-200" : "text-slate-800")}>
                    TOTAL
                  </td>
                  {INITIAL_DASHBOARD_METRICS.map(metricLabel => {
                    const totalCount = getMetricTotal(metricLabel);

                    const queryParams = new URLSearchParams();
                    if (isSubCategoryTable) {
                      queryParams.set('category', mainCategoryName);
                    }
                    queryParams.set('status', metricLabel);

                    return (
                      <td key={metricLabel} className="px-2 py-4 text-center">
                        {totalCount > 0 ? (
                          <button
                            onClick={() => {
                              if (isSubCategoryTable) {
                                navigate(`/tasks?${queryParams.toString()}`, { state: { fromDashboard: true } });
                              } else {
                                navigate(`/tasks?status=${encodeURIComponent(metricLabel)}`, { state: { fromDashboard: true } });
                              }
                            }}
                            className={getMetricButtonClass(metricLabel)}
                          >
                            {totalCount}
                          </button>
                        ) : (
                          <span className={cn("font-medium text-sm", isDarkMode ? "text-slate-600" : "text-slate-400")}>0</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-[fadeIn_0.5s_ease-out]">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-4 mt-1">
        <SecureComponent code="dashboard.card.newtask.view">
          <StatCard title="New Task" value={newTaskCount} icon={FilePlus} gradientFrom="from-zoho-green" gradientTo="to-zoho-green-dark" onClick={() => navigate('/tasks?status=New Task', { state: { fromDashboard: true } })} />
        </SecureComponent>
        <StatCard title="In Progress" value={inProgressTasks} icon={PlayCircle} gradientFrom="from-zoho-blue" gradientTo="to-zoho-blue-dark" onClick={() => navigate('/tasks?status=In Progress', { state: { fromDashboard: true } })} />
        <StatCard title="On-hold" value={onHoldTasks} icon={Hand} gradientFrom="from-zoho-yellow" gradientTo="to-zoho-yellow-dark" onClick={() => navigate('/tasks?status=On-hold', { state: { fromDashboard: true } })} />
        <StatCard title="Overdue" value={overdueTasks} icon={AlarmClock} gradientFrom="from-zoho-red" gradientTo="to-zoho-red-dark" onClick={() => navigate('/tasks?status=Overdue', { state: { fromDashboard: true } })} />
        <StatCard title="Today created" value={todayCreatedTasks} icon={CalendarPlus} gradientFrom="from-zoho-violet" gradientTo="to-zoho-violet-dark" onClick={() => navigate('/tasks?status=Today created', { state: { fromDashboard: true } })} />
        <StatCard title="Today's task" value={todayDeadlinedTasks} icon={ListTodo} gradientFrom="from-zoho-wine" gradientTo="to-zoho-wine-dark" onClick={() => navigate("/tasks?status=Today's task", { state: { fromDashboard: true } })} />
        <StatCard title="Total" value={newTaskCount + inProgressTasks + onHoldTasks} icon={Briefcase} gradientFrom="from-slate-700" gradientTo="to-slate-800" onClick={() => navigate('/tasks?status=Total', { state: { fromDashboard: true } })} />
      </div>

      <div className="pt-6">
        <h2 className={cn("text-2xl font-extrabold tracking-tight mb-6", isDarkMode ? "text-white" : "text-slate-900")}>Category Overview</h2>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">
          <div className="lg:col-span-3 space-y-6 min-w-0">
            {renderBreakdownTable("Development Overview", devRows, true, "Development")}
            {renderBreakdownTable("Support Overview", supportRows, true, "Support")}
            {renderBreakdownTable("Hardware & Others Overview", hwRows, false)}
            {/* {renderBreakdownTable("Projects Overview", projectRows, false)} */}
          </div>

          <div className="lg:col-span-2 lg:sticky lg:top-6 min-w-0">
            {renderCalendar()}
          </div>
        </div>
      </div>



      {isRefreshing && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-2.5 rounded-full shadow-lg bg-indigo-600 text-white text-sm font-black tracking-wide animate-bounce">
          <RefreshCcw className="w-4 h-4 animate-spin" />
          <span>Refreshing...</span>
        </div>
      )}
    </div>
  );
}
