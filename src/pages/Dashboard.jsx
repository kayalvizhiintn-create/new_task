import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { cn } from '../utils/cn';
import { Briefcase, CheckCircle2, Clock, AlertCircle, TrendingUp, FolderGit2, RefreshCcw, Hourglass, PauseCircle, XCircle, ChevronLeft, ChevronRight } from 'lucide-react';

const StatCard = ({ title, value, icon: Icon, gradientFrom, gradientTo, onClick }) => {
  const { isDarkMode } = useStore();
  return (
    <div 
      onClick={onClick}
      className={cn("relative overflow-hidden p-6 rounded-3xl border transition-all duration-300 hover:-translate-y-1 hover:shadow-xl group", 
      isDarkMode ? "bg-slate-800/40 border-slate-700/50 hover:bg-slate-800/60" : "bg-white border-slate-100 shadow-sm hover:bg-slate-50",
      onClick && "cursor-pointer"
    )}>
      <div className={cn("absolute -right-10 -top-10 w-32 h-32 rounded-full opacity-20 blur-2xl group-hover:opacity-40 transition-opacity", `bg-gradient-to-br ${gradientFrom} ${gradientTo}`)} />
      
      <div className="flex items-start justify-between relative z-10">
        <div>
          <p className={cn("text-sm font-semibold tracking-wide mb-2", isDarkMode ? "text-slate-400" : "text-slate-500")}>{title}</p>
          <h3 className={cn("text-4xl font-extrabold tracking-tight", isDarkMode ? "text-white" : "text-slate-900")}>{value}</h3>
        </div>
        <div className={cn("p-4 rounded-2xl bg-gradient-to-br text-white shadow-lg", gradientFrom, gradientTo)}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
      <div className="mt-4 flex items-center text-xs font-medium text-emerald-500">
        <TrendingUp className="w-3 h-3 mr-1" />
        <span>Current Status</span>
      </div>
    </div>
  );
};

export default function Dashboard() {
  const { tasks, isDarkMode, categories, dashboardMetrics } = useStore();
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
      const dLocal = new Date(d.getTime() - (offset*60*1000))
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
      switch(priority) {
        case 'Critical': return isDarkMode ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' : 'bg-rose-50 text-rose-700 border border-rose-200';
        case 'High': return isDarkMode ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20' : 'bg-orange-50 text-orange-700 border border-orange-200';
        case 'Medium': return isDarkMode ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : 'bg-blue-50 text-blue-700 border border-blue-200';
        case 'Low': return isDarkMode ? 'bg-slate-500/10 text-slate-400 border border-slate-500/20' : 'bg-slate-50 text-slate-700 border border-slate-200';
        default: return isDarkMode ? 'bg-slate-500/10 text-slate-400 border border-slate-500/20' : 'bg-slate-50 text-slate-700 border border-slate-200';
      }
    };

    const getStatusColor = (status) => {
      switch(status) {
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
      <div className={cn("p-6 rounded-3xl border shadow-sm transition-all duration-300 h-full", 
        isDarkMode ? "bg-slate-800/40 border-slate-700/50" : "bg-white border-slate-200"
      )}>
        <div className="flex items-center justify-between mb-6">
          <h3 className={cn("text-lg font-bold tracking-tight", isDarkMode ? "text-white" : "text-slate-900")}>
            {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
          </h3>
          <div className="flex gap-2">
            <button onClick={handlePrevMonth} className={cn("p-1.5 rounded-lg transition-colors", isDarkMode ? "hover:bg-slate-700 text-slate-300" : "hover:bg-slate-100 text-slate-600")}>
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button onClick={handleNextMonth} className={cn("p-1.5 rounded-lg transition-colors", isDarkMode ? "hover:bg-slate-700 text-slate-300" : "hover:bg-slate-100 text-slate-600")}>
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-2 mb-2 text-center">
          {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
            <div key={d} className={cn("text-xs font-bold uppercase", isDarkMode ? "text-slate-500" : "text-slate-400")}>{d}</div>
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
                className={cn("relative p-2 rounded-xl text-sm font-bold transition-all duration-200 aspect-square flex flex-col items-center justify-center",
                  isSelected ? "bg-blue-600 text-white shadow-md shadow-blue-500/30 scale-110 z-10" : 
                  isToday ? "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400" :
                  hasEvents ? "bg-slate-800 text-white dark:bg-slate-700 dark:text-slate-200" : 
                  isDarkMode ? "hover:bg-slate-700 text-slate-300" : "hover:bg-slate-100 text-slate-700"
                )}
              >
                <span>{dayNum}</span>
                {hasEvents && !isSelected && !isToday && (
                  <span className="absolute bottom-1.5 w-1 h-1 rounded-full bg-slate-400 dark:bg-slate-400"></span>
                )}
              </button>
            );
          })}
        </div>
        
        {selectedDate && (
          <div className="mt-8 pt-6 border-t dark:border-slate-700/50">
            <div className="flex items-center justify-between mb-4">
              <h4 className={cn("text-sm font-bold", isDarkMode ? "text-slate-200" : "text-slate-800")}>
                Events for {selectedDate}
              </h4>
              <button onClick={() => setSelectedDate(null)} className="text-xs font-bold text-blue-500 hover:text-blue-600">Clear</button>
            </div>
            
            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
              {tasksByDate[selectedDate] ? tasksByDate[selectedDate].map(task => (
                <div key={task.id} className={cn("p-3 rounded-xl border text-left cursor-pointer transition-colors", isDarkMode ? "bg-slate-800 border-slate-700 hover:bg-slate-700" : "bg-slate-50 border-slate-200 hover:bg-slate-100")} onClick={() => navigate(`/tasks/edit/${task.id}`)}>
                  <p className={cn("text-xs font-bold mb-1 truncate", getPriorityColor(task.priority).split(' ')[0])}>{task.priority} Priority</p>
                  <p className={cn("text-sm font-bold truncate", isDarkMode ? "text-slate-200" : "text-slate-800")}>{task.title}</p>
                  <div className="flex items-center justify-between mt-2">
                    <span className={cn("text-xs font-semibold", isDarkMode ? "text-slate-400" : "text-slate-500")}>{task.category}</span>
                    <span className="text-xs font-semibold"><StatusBadge status={task.status} /></span>
                  </div>
                </div>
              )) : (
                <p className={cn("text-sm font-medium text-center py-4", isDarkMode ? "text-slate-500" : "text-slate-400")}>No events for this date.</p>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-8 animate-[fadeIn_0.5s_ease-out]">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        {/* <div>
          <h1 className={cn("text-4xl font-extrabold tracking-tight", isDarkMode ? "text-white" : "text-slate-900")}>Dashboard overview</h1>
          <p className={cn("mt-2 font-medium", isDarkMode ? "text-slate-400" : "text-slate-500")}>Welcome back. Here's what's happening today.</p>
        </div> */}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4 lg:gap-6">
        <StatCard title="Open for review" value={openForReviewTasks} icon={AlertCircle} gradientFrom="from-amber-400" gradientTo="to-orange-500" onClick={() => navigate('/tasks?status=Open for review')} />
        <StatCard title="Overdue" value={overdueTasks} icon={Clock} gradientFrom="from-rose-400" gradientTo="to-red-500" onClick={() => navigate('/tasks?status=All')} />
        <StatCard title="Progress" value={inProgressTasks} icon={RefreshCcw} gradientFrom="from-blue-400" gradientTo="to-indigo-500" onClick={() => navigate('/tasks?status=In Progress')} />
        <StatCard title="On-hold" value={onHoldTasks} icon={PauseCircle} gradientFrom="from-slate-400" gradientTo="to-gray-500" onClick={() => navigate('/tasks?status=On-hold')} />
        <StatCard title="Today created" value={todayCreatedTasks} icon={FolderGit2} gradientFrom="from-purple-400" gradientTo="to-fuchsia-500" onClick={() => navigate('/tasks')} />
        <StatCard title="Today deadlined" value={todayDeadlinedTasks} icon={Briefcase} gradientFrom="from-emerald-400" gradientTo="to-teal-500" onClick={() => navigate('/tasks')} />
      </div>

      <div className="pt-6">
        <h2 className={cn("text-2xl font-extrabold tracking-tight mb-6", isDarkMode ? "text-white" : "text-slate-900")}>Category Breakdown</h2>
        
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 lg:gap-6 items-start">
          <div className="xl:col-span-2 space-y-6">
            <div className={cn("rounded-3xl border overflow-hidden shadow-sm transition-all duration-300",
              isDarkMode ? "bg-slate-800/40 border-slate-700/50" : "bg-white border-slate-200"
            )}>
              <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full text-left text-sm">
                  <thead className={cn("border-b", isDarkMode ? "bg-slate-900/50 border-slate-700/50" : "bg-slate-50 border-slate-200")}>
                    <tr>
                      <th className={cn("px-4 py-4 font-bold uppercase tracking-wider text-xs", isDarkMode ? "text-slate-400" : "text-slate-500")}>Metrics</th>
                      {allCategories.map(cat => (
                        <th key={cat} className={cn("px-3 py-4 font-bold uppercase tracking-wider text-[10px] md:text-xs text-center", isDarkMode ? "text-slate-400" : "text-slate-500")}>{cat}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-700/50">
                    {dashboardMetrics?.map((metricLabel, idx) => {
                      let filterFn;
                      if (metricLabel === 'Open for review') {
                        filterFn = (t) => t.status === 'Open for review';
                      } else if (metricLabel === 'Overdue') {
                        filterFn = (t) => t.dueDate && t.dueDate < today && !['Completed', 'Cancelled'].includes(t.status);
                      } else if (metricLabel === 'Today created') {
                        filterFn = (t) => t.createdAt && t.createdAt.startsWith(today);
                      } else if (metricLabel === 'Today deadlined') {
                        filterFn = (t) => t.dueDate === today;
                      } else if (metricLabel === 'Total') {
                        filterFn = () => true;
                      } else {
                        // Maps dynamically to the exact status name or alias (like 'Progress' -> 'In Progress')
                        filterFn = (t) => t.status === metricLabel || t.status === metricLabel.replace('Progress', 'In Progress');
                      }

                      return (
                        <tr key={metricLabel} className={cn("transition-all duration-200 group cursor-default", 
                          isDarkMode ? "hover:bg-slate-700/40" : "hover:bg-slate-50",
                          idx % 2 === 0 ? "bg-transparent" : (isDarkMode ? "bg-slate-800/20" : "bg-slate-50/50")
                        )}>
                          <td className="px-4 py-4 font-bold text-slate-700 dark:text-slate-300 text-xs md:text-sm">{metricLabel}</td>
                          {allCategories.map(cat => {
                            const count = tasks.filter(t => t.category === cat && filterFn(t)).length;
                            return (
                              <td key={cat} className="px-3 py-4 font-semibold text-slate-600 dark:text-slate-400 text-center">
                                {count > 0 ? (
                                  <span className={cn("px-2 py-1 rounded-lg text-xs font-bold", 
                                    isDarkMode ? "bg-blue-500/10 text-blue-400" : "bg-blue-50 text-blue-600"
                                  )}>{count}</span>
                                ) : (
                                  <span className="text-slate-400 dark:text-slate-500 font-bold text-xs">0</span>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
          
          <div className="xl:col-span-1 sticky top-6">
            {renderCalendar()}
          </div>
        </div>
      </div>
    </div>
  );
}
