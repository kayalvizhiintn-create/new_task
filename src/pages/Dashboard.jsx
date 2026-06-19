import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore, INITIAL_DASHBOARD_METRICS } from '../store/useStore';
import { cn } from '../utils/cn';
import {
  Briefcase, CheckCircle2, Clock, AlertCircle, TrendingUp, FolderGit2, RefreshCcw,
  Hourglass, PauseCircle, XCircle, ChevronLeft, ChevronRight, Eye, Sparkles,
  Activity, AlertTriangle, PlusSquare, Target, Calendar,
  ClipboardCheck, FilePlus, PlayCircle, Hand, AlarmClock, CalendarPlus, ListTodo
} from 'lucide-react';


const StatCard = ({ title, value, icon: Icon, gradientFrom, gradientTo, onClick }) => {
  return (
    <div
      onClick={onClick}
      className={cn(
        "relative overflow-hidden p-3 md:p-4 rounded-[20px] transition-all duration-300 hover:-translate-y-1 group flex items-center gap-3 md:gap-4 shadow-md hover:shadow-xl text-white",
        `bg-gradient-to-br ${gradientFrom} ${gradientTo}`,
        onClick && "cursor-pointer"
      )}>

      {/* Decorative overlays */}
      <div className="absolute -right-6 -top-6 w-24 h-24 rounded-full bg-white/20 blur-2xl group-hover:bg-white/30 transition-colors duration-300" />
      <div className="absolute -left-6 -bottom-6 w-20 h-20 rounded-full bg-black/5 blur-xl" />

      <div className="p-2.5 md:p-3 rounded-2xl bg-white/20 backdrop-blur-md shadow-sm flex-shrink-0 relative z-10 transform group-hover:scale-105 group-hover:rotate-6 transition-all duration-300 border border-white/10">
        <Icon className="w-5 h-5 md:w-6 md:h-6 text-white" strokeWidth={2.5} />
      </div>

      <div className="min-w-0 flex-1 relative z-10">
        <p className="text-[10px] md:text-[11px] font-black tracking-wider mb-0.5 uppercase leading-tight drop-shadow-sm" title={title}>
          {title}
        </p>
        <h3 className="text-2xl md:text-3xl font-black tracking-tight drop-shadow-sm">
          {value}
        </h3>
      </div>
    </div>
  );
};


export default function Dashboard() {
  const { tasks, isDarkMode, categories } = useStore();
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const openForReviewTasks = tasks.filter(t => t.status === 'Open for review').length;
  const inProgressTasks = tasks.filter(t => t.status === 'In Progress').length;
  const onHoldTasks = tasks.filter(t => t.status === 'On-hold').length;

  const today = new Date().toISOString().split('T')[0];
  const overdueTasks = tasks.filter(t =>
    t.dueDate && t.dueDate < today && !['Completed', 'Cancelled'].includes(t.status)
  ).length;

  const todayCreatedTasks = tasks.filter(t => t.createdAt && t.createdAt.startsWith(today)).length;
  const todayDeadlinedTasks = tasks.filter(t => t.dueDate === today).length;

  const allCategories = Object.keys(categories || {});

  const getMetricButtonClass = (label) => {
    const baseClass = "px-3 py-1.5 rounded-md text-[13px] font-bold transition-all duration-200 shadow-md hover:scale-105 ";
    if (label === 'Open for review') return baseClass + "bg-zoho-yellow hover:bg-zoho-yellow-dark text-white";
    if (label === 'New Task') return baseClass + "bg-zoho-green hover:bg-zoho-green-dark text-white";
    if (label === 'In Progress') return baseClass + "bg-zoho-blue hover:bg-zoho-blue-dark text-white";
    if (label === 'On-hold') return baseClass + "bg-zoho-dark-grey hover:bg-[#1a1a1a] text-white";
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
      if (t.dueDate) {
        if (!tasksByDate[t.dueDate]) tasksByDate[t.dueDate] = [];
        tasksByDate[t.dueDate].push(t);
      }
    });

    const getPriorityColor = (priority) => {
      switch (priority) {
        case 'Critical': return isDarkMode ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' : 'bg-rose-50 text-rose-700 border border-rose-200';
        case 'High': return isDarkMode ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20' : 'bg-orange-50 text-orange-700 border border-orange-200';
        case 'Medium': return isDarkMode ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : 'bg-blue-50 text-blue-700 border border-blue-200';
        case 'Low': return isDarkMode ? 'bg-slate-500/10 text-slate-400 border border-slate-500/20' : 'bg-slate-50 text-slate-700 border border-slate-200';
        default: return isDarkMode ? 'bg-slate-500/10 text-slate-400 border border-slate-500/20' : 'bg-slate-50 text-slate-700 border border-slate-200';
      }
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

    const StatusBadge = ({ status }) => (
      <div className="flex items-center gap-2">
        <div className={cn("w-2 h-2 rounded-full", getStatusColor(status).replace('text-', 'bg-'))} />
        <span className={cn("font-semibold", isDarkMode ? "text-slate-200" : "text-slate-700")}>{status}</span>
      </div>
    );

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

        <div className="grid grid-cols-7 gap-2 mb-4 text-center">
          {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
            <div key={d} className={cn("text-xs font-black uppercase tracking-wider", isDarkMode ? "text-slate-500" : "text-slate-400")}>{d}</div>
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
                onClick={() => setSelectedDate(isSelected ? null : dateStr)}
                className={cn("relative p-2 rounded-2xl text-sm font-bold transition-all duration-300 aspect-square flex flex-col items-center justify-center group",
                  isSelected ? "bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-lg shadow-purple-500/30 scale-110 z-10" :
                    isToday ? "bg-gradient-to-br from-blue-400 to-blue-600 text-white shadow-md shadow-blue-500/20 ring-2 ring-blue-500/50 ring-offset-2 ring-offset-white dark:ring-offset-slate-900" :
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

        {selectedDate && (
          <div className="mt-8 pt-6 border-t dark:border-slate-700/50 animate-[fadeIn_0.3s_ease-out]">
            <div className="flex items-center justify-between mb-6">
              <h4 className={cn("text-base font-black tracking-tight", isDarkMode ? "text-slate-200" : "text-slate-800")}>
                Events for <span className="text-indigo-500">{selectedDate}</span>
              </h4>
              <button onClick={() => setSelectedDate(null)} className="text-xs font-bold px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors">Clear</button>
            </div>

            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
              {tasksByDate[selectedDate] ? tasksByDate[selectedDate].map(task => (
                <div key={task.id} className={cn("p-4 rounded-2xl border text-left cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:shadow-md", isDarkMode ? "bg-slate-800/60 border-slate-700 hover:bg-slate-700/80" : "bg-white border-slate-100 hover:border-slate-200 shadow-sm")} onClick={() => navigate(`/tasks/edit/${task.id}`)}>
                  <p className={cn("text-xs font-black mb-1.5 uppercase tracking-wide", getPriorityColor(task.priority).split(' ')[0])}>{task.priority} Priority</p>
                  <p className={cn("text-base font-bold mb-3 line-clamp-1", isDarkMode ? "text-slate-100" : "text-slate-800")}>{task.title}</p>
                  <div className="flex items-center justify-between">
                    <span className={cn("text-xs font-bold px-2 py-1 rounded-md", isDarkMode ? "bg-slate-700 text-slate-300" : "bg-slate-100 text-slate-600")}>{task.category}</span>
                    <StatusBadge status={task.status} />
                  </div>
                </div>
              )) : (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-3">
                    <Calendar className="w-6 h-6 text-slate-400 dark:text-slate-500" />
                  </div>
                  <p className={cn("text-sm font-bold", isDarkMode ? "text-slate-400" : "text-slate-500")}>No events for this date.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-[fadeIn_0.5s_ease-out]">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-7 gap-4 lg:gap-6 mt-1">
        <StatCard title="Open for review" value={openForReviewTasks} icon={ClipboardCheck} gradientFrom="from-zoho-yellow" gradientTo="to-zoho-yellow-dark" onClick={() => navigate('/tasks?status=Open for review')} />
        <StatCard title="New Task" value={tasks.filter(t => t.status === 'New Task').length} icon={FilePlus} gradientFrom="from-zoho-green" gradientTo="to-zoho-green-dark" onClick={() => navigate('/tasks?status=New Task')} />
        <StatCard title="In Progress" value={inProgressTasks} icon={PlayCircle} gradientFrom="from-zoho-blue" gradientTo="to-zoho-blue-dark" onClick={() => navigate('/tasks?status=In Progress')} />
        <StatCard title="On-hold" value={onHoldTasks} icon={Hand} gradientFrom="from-zoho-dark-grey" gradientTo="to-zoho-dark-grey-dark" onClick={() => navigate('/tasks?status=On-hold')} />
        <StatCard title="Overdue" value={overdueTasks} icon={AlarmClock} gradientFrom="from-zoho-red" gradientTo="to-zoho-red-dark" onClick={() => navigate('/tasks?status=All')} />
        <StatCard title="Today created" value={todayCreatedTasks} icon={CalendarPlus} gradientFrom="from-zoho-violet" gradientTo="to-zoho-violet-dark" onClick={() => navigate('/tasks')} />
        <StatCard title="Today's task" value={todayDeadlinedTasks} icon={ListTodo} gradientFrom="from-zoho-wine" gradientTo="to-zoho-wine-dark" onClick={() => navigate('/tasks')} />
      </div>

      <div className="pt-6">
        <h2 className={cn("text-2xl font-extrabold tracking-tight mb-6", isDarkMode ? "text-white" : "text-slate-900")}>Category Breakdown</h2>

        <div className="grid grid-cols-1 xl:grid-cols-5 gap-6 lg:gap-8 items-start">
          <div className="xl:col-span-3 space-y-6">
            <div className={cn("rounded-xl border shadow-md transition-all duration-300 backdrop-blur-xl overflow-hidden",
              isDarkMode ? "bg-slate-900/60 border-slate-700/50" : "bg-white/90 border-slate-200"
            )}>
              <div className="w-full">
                <table className="w-full text-left text-sm">
                  <thead className={cn("border-b-2", isDarkMode ? "bg-slate-800/90 border-slate-600" : "bg-slate-100 border-slate-300")}>
                    <tr>
                      <th className={cn("px-4 py-6 font-black uppercase tracking-wider text-xs", isDarkMode ? "text-slate-300" : "text-slate-700")}>Category</th>
                      {INITIAL_DASHBOARD_METRICS.map(metric => (
                        <th key={metric} className={cn("px-2 py-6 font-black uppercase tracking-wider text-[10px] md:text-xs text-center leading-tight", isDarkMode ? "text-slate-300" : "text-slate-700")}>{metric}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className={cn("divide-y", isDarkMode ? "divide-slate-700" : "divide-slate-100")}>
                    {allCategories.map((cat, idx) => {
                      return (
                        <tr key={cat} className={cn("transition-all duration-300 group cursor-default",
                          isDarkMode ? "hover:bg-slate-800/80" : "hover:bg-slate-50",
                          idx % 2 === 0 ? "bg-transparent" : (isDarkMode ? "bg-slate-800/40" : "bg-slate-50/50")
                        )}>
                          <td className={cn("px-4 py-6 font-semibold text-sm", isDarkMode ? "text-slate-200" : "text-slate-700")}>{cat}</td>
                          {INITIAL_DASHBOARD_METRICS.map(metricLabel => {
                            let filterFn;
                            if (metricLabel === 'Open for review') {
                              filterFn = (t) => t.status === 'Open for review';
                            } else if (metricLabel === 'Overdue') {
                              filterFn = (t) => t.dueDate && t.dueDate < today && !['Completed', 'Cancelled'].includes(t.status);
                            } else if (metricLabel === 'Today created') {
                              filterFn = (t) => t.createdAt && t.createdAt.startsWith(today);
                            } else if (metricLabel === "Today's task") {
                              filterFn = (t) => t.dueDate === today;
                            } else if (metricLabel === 'Total') {
                              filterFn = (t) => ['Open for review', 'New Task', 'In Progress', 'On-hold'].includes(t.status) || (t.dueDate && t.dueDate < today && !['Completed', 'Cancelled'].includes(t.status));
                            } else {
                              filterFn = (t) => t.status === metricLabel;
                            }

                            const count = tasks.filter(t => t.category === cat && filterFn(t)).length;
                            return (
                              <td key={metricLabel} className="px-2 py-6 text-center">
                                {count > 0 ? (
                                  <button onClick={() => navigate(`/tasks?category=${encodeURIComponent(cat)}${metricLabel !== 'Total' && metricLabel !== 'Today created' && metricLabel !== "Today's task" ? `&status=${encodeURIComponent(metricLabel)}` : ''}`)} 
                                    className={getMetricButtonClass(metricLabel)}
                                  >
                                    {count}
                                  </button>
                                ) : (
                                  <span className={cn("font-medium text-sm", isDarkMode ? "text-slate-600" : "text-slate-400")}>0</span>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot className={cn("border-t", isDarkMode ? "bg-slate-800/80 border-slate-700" : "bg-slate-50 border-slate-200")}>
                    <tr className="group">
                      <td className={cn("px-4 py-6 font-bold text-sm", isDarkMode ? "text-slate-200" : "text-slate-800")}>TOTAL</td>
                      {INITIAL_DASHBOARD_METRICS.map(metricLabel => {
                        let filterFn;
                        if (metricLabel === 'Open for review') {
                          filterFn = (t) => t.status === 'Open for review';
                        } else if (metricLabel === 'Overdue') {
                          filterFn = (t) => t.dueDate && t.dueDate < today && !['Completed', 'Cancelled'].includes(t.status);
                        } else if (metricLabel === 'Today created') {
                          filterFn = (t) => t.createdAt && t.createdAt.startsWith(today);
                        } else if (metricLabel === "Today's task") {
                          filterFn = (t) => t.dueDate === today;
                        } else if (metricLabel === 'Total') {
                          filterFn = (t) => ['Open for review', 'New Task', 'In Progress', 'On-hold'].includes(t.status) || (t.dueDate && t.dueDate < today && !['Completed', 'Cancelled'].includes(t.status));
                        } else {
                          filterFn = (t) => t.status === metricLabel;
                        }

                        const count = tasks.filter(t => filterFn(t)).length;
                        return (
                          <td key={metricLabel} className="px-2 py-6 text-center">
                            {count > 0 ? (
                              <button onClick={() => navigate(`/tasks?${metricLabel !== 'Total' && metricLabel !== 'Today created' && metricLabel !== "Today's task" ? `status=${encodeURIComponent(metricLabel)}` : ''}`)} 
                                className={getMetricButtonClass(metricLabel)}
                              >
                                {count}
                              </button>
                            ) : (
                              <span className={cn("font-medium text-sm", isDarkMode ? "text-slate-600" : "text-slate-400")}>0</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </div>

          <div className="xl:col-span-2 sticky top-6">
            {renderCalendar()}
          </div>
        </div>
      </div>
    </div>
  );
}
