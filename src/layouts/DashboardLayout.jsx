import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, ListTodo, PlusCircle, Sun, Moon, Menu, Users, UserPlus, LogOut, ChevronLeft, Activity, Settings, Bell } from 'lucide-react';
import { useStore } from '../store/useStore';
import { cn } from '../utils/cn';

export default function DashboardLayout() {
  const { isDarkMode, toggleDarkMode, logout, currentUser, tasks } = useStore();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [showNotifications, setShowNotifications] = useState(false);
  const reviewTasks = tasks.filter(t => t.status === 'Open for review' && t.reviewTo === currentUser?.name);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Task List', path: '/tasks', icon: ListTodo },
    { name: 'Status Board', path: '/status-change', icon: Activity },
    { name: 'New Task', path: '/tasks/new', icon: PlusCircle },
    { name: 'Teams', path: '/teams', icon: Users },
    { name: 'Employees', path: '/employees', icon: Users },
    { name: 'Add Employee', path: '/employees/new', icon: UserPlus },
    { name: 'Masters Settings', path: '/masters', icon: Settings },
  ];

  return (
    <div className={cn("h-screen w-full overflow-hidden flex bg-slate-50 transition-colors duration-500", 
      isDarkMode ? "bg-[#0B1120] text-slate-100" : "bg-[#F8FAFC] text-slate-900"
    )}>
      {/* Mobile overlay */}
      {isSidebarOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Premium Dark Sidebar */}
      <aside className={cn("fixed md:relative flex-shrink-0 transition-all duration-300 z-50 flex flex-col h-full", 
        isDarkMode ? "bg-[#0F172A] border-r border-slate-800" : "bg-slate-900 text-slate-100 border-r border-slate-800",
        isSidebarOpen ? "w-64 translate-x-0" : "w-20 -translate-x-full md:translate-x-0"
      )}>
        <div className={cn("h-20 flex items-center justify-between px-6 border-b border-slate-800/50")}>
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-500 shadow-lg shadow-blue-500/30 flex items-center justify-center flex-shrink-0">
              <div className="w-3 h-3 rounded-full bg-white" />
            </div>
            {isSidebarOpen && <span className="font-extrabold text-2xl tracking-tight bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent whitespace-nowrap">TaskMaster</span>}
          </div>
          
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className={cn("p-2 rounded-full transition-all duration-300 hover:bg-slate-800 text-slate-400")}
            >
              {isSidebarOpen ? <ChevronLeft className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {!isSidebarOpen && (
          <div className="flex justify-center mt-4">
            <button 
              onClick={toggleDarkMode}
              className={cn("p-2 rounded-full transition-all duration-300", 
                isDarkMode ? "hover:bg-slate-800 text-yellow-400" : "hover:bg-slate-800 text-slate-300"
              )}
            >
              {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
        )}

        <nav className="p-4 space-y-2 mt-2 flex-1 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {navItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              end
              className={({ isActive }) => cn(
                "flex items-center gap-4 rounded-xl font-medium transition-all duration-300 group",
                isSidebarOpen ? "px-4 py-3.5" : "justify-center py-3.5",
                isActive 
                  ? "bg-blue-600/10 text-blue-400 shadow-[inset_4px_0_0_0_rgba(59,130,246,1)]" 
                  : "hover:bg-slate-800/50 text-slate-400 hover:text-slate-200"
              )}
              title={!isSidebarOpen ? item.name : ""}
            >
              <item.icon className={cn("w-5 h-5 transition-transform duration-300 group-hover:scale-110 flex-shrink-0", 
                "text-inherit"
              )} />
              {isSidebarOpen && <span className="whitespace-nowrap">{item.name}</span>}
            </NavLink>
          ))}
        </nav>

        {/* User Profile & Logout */}
        <div className="p-4 border-t border-slate-800/50">
          {isSidebarOpen ? (
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3 p-2 rounded-xl bg-slate-800/30">
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white text-sm font-bold shadow-sm flex-shrink-0">
                  {currentUser?.name?.substring(0, 2).toUpperCase() || 'AD'}
                </div>
                <div className="flex-1 overflow-hidden">
                  <p className="font-bold text-sm text-slate-200 truncate">{currentUser?.name || 'Admin User'}</p>
                  <p className="text-xs text-slate-400 font-medium truncate">{currentUser?.bioId || 'BIO-0000'}</p>
                </div>
                <button 
                  onClick={toggleDarkMode}
                  className={cn("p-2 rounded-full transition-all duration-300 flex-shrink-0", 
                    isDarkMode ? "hover:bg-slate-700 text-yellow-400" : "hover:bg-slate-200 text-slate-500"
                  )}
                  title="Toggle Theme"
                >
                  {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                </button>
              </div>
              <button 
                onClick={handleLogout}
                className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-bold bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white transition-all duration-300"
              >
                <LogOut className="w-4 h-4" /> Logout
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white text-sm font-bold shadow-sm flex-shrink-0" title={currentUser?.name}>
                {currentUser?.name?.substring(0, 2).toUpperCase() || 'AD'}
              </div>
              <button 
                onClick={handleLogout}
                title="Logout"
                className="p-2.5 rounded-xl text-rose-500 hover:bg-rose-500 hover:text-white transition-all duration-300"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen overflow-hidden relative">
        {/* Mobile Header (visible only on mobile) */}
        <header className={cn("md:hidden h-16 border-b flex items-center justify-between px-4 z-30",
          isDarkMode ? "bg-[#0F172A] border-slate-800 text-slate-100" : "bg-white border-slate-200 text-slate-900"
        )}>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-500 shadow-lg shadow-blue-500/30 flex items-center justify-center flex-shrink-0">
              <div className="w-3 h-3 rounded-full bg-white" />
            </div>
            <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent whitespace-nowrap">TaskMaster</span>
          </div>
          <button 
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <Menu className="w-6 h-6" />
          </button>
        </header>

        {/* Notification Bell */}
        <div className="absolute top-4 right-4 md:top-6 md:right-8 z-50">
          <div className="relative">
            <button 
              onClick={() => setShowNotifications(!showNotifications)}
              className={cn("p-3 rounded-full shadow-lg transition-all duration-300", 
                isDarkMode ? "bg-slate-800 hover:bg-slate-700 text-slate-200" : "bg-white hover:bg-slate-50 text-slate-700 border border-slate-200"
              )}
            >
              <Bell className="w-6 h-6" />
              {reviewTasks.length > 0 && (
                <span className="absolute top-0 right-0 -mt-1 -mr-1 flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white shadow-sm ring-2 ring-white dark:ring-slate-900">
                  {reviewTasks.length}
                </span>
              )}
            </button>
            
            {showNotifications && (
              <div className={cn("absolute right-0 mt-2 w-80 rounded-2xl shadow-xl border overflow-hidden",
                isDarkMode ? "bg-slate-800 border-slate-700" : "bg-white border-slate-200"
              )}>
                <div className={cn("p-4 border-b font-bold flex justify-between items-center", isDarkMode ? "border-slate-700 text-white" : "border-slate-100 text-slate-900")}>
                  <span>Pending Reviews</span>
                  <span className="text-xs bg-rose-500/10 text-rose-500 px-2 py-1 rounded-full">{reviewTasks.length}</span>
                </div>
                <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
                  {reviewTasks.length > 0 ? (
                    reviewTasks.map(task => (
                      <div 
                        key={task.id} 
                        onClick={() => {
                          setShowNotifications(false);
                          navigate(`/tasks/review/${task.id}`);
                        }}
                        className={cn("p-4 cursor-pointer transition-colors border-b last:border-b-0", 
                          isDarkMode ? "hover:bg-slate-700/50 border-slate-700/50" : "hover:bg-slate-50 border-slate-100"
                        )}
                      >
                        <p className={cn("text-sm font-bold truncate", isDarkMode ? "text-slate-200" : "text-slate-800")}>{task.title}</p>
                        <p className={cn("text-xs mt-1", isDarkMode ? "text-slate-400" : "text-slate-500")}>Assigned by: {task.assignedBy}</p>
                      </div>
                    ))
                  ) : (
                    <div className={cn("p-6 text-center text-sm font-medium", isDarkMode ? "text-slate-400" : "text-slate-500")}>
                      No pending reviews.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Page Content */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto p-4 md:p-8 pt-20 md:pt-6 relative z-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
