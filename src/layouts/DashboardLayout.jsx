import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, ListTodo, PlusCircle, Sun, Moon, Menu, Users, UserPlus, LogOut, ChevronLeft, Activity, Settings, Key, Shield } from 'lucide-react';
import { useStore } from '../store/useStore';
import { cn } from '../utils/cn';
import ChangePasswordModal from '../components/ChangePasswordModal';
import { authService } from '../services/authService';
import { privilegeService } from '../services/privilegeService';
import logo1 from '../assets/logo1.jpg';
import { employeeService } from '../services/employeeService';
import { permissionService } from '../services/permissionService';


export default function DashboardLayout() {
  const { isDarkMode, toggleDarkMode, logout, currentUser, permissionTree = [], permissionCodes = {} } = useStore();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [showNotifications, setShowNotifications] = useState(false);
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const [employeeForPassword, setEmployeeForPassword] = useState(null);

  const handleLogout = async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error("Logout API failed", error);
    } finally {
      localStorage.removeItem('token');
      logout();
      navigate('/login');
    }
  };

  const [allowedMenus, setAllowedMenus] = useState(new Set());
  const [loadingPrivileges, setLoadingPrivileges] = useState(true);
  const [permissionsLoaded, setPermissionsLoaded] = useState(false);

  useEffect(() => {
    const fetchUserPrivileges = async () => {
      setPermissionsLoaded(false);
      if (!currentUser) {
        setLoadingPrivileges(false);
        setPermissionsLoaded(true);
        return;
      }
      try {
        // Try every possible field name for employee ID
        const empId =
          currentUser?.employeeId ||
          currentUser?.EmployeeId ||
          currentUser?.emp_id ||
          currentUser?.empId ||
          currentUser?.userId ||
          currentUser?.id;

        console.log('[Permissions] currentUser:', currentUser, '→ empId:', empId);

        if (empId) {
          const dynamicPermsRes = await permissionService.getUserPayload(empId).catch((err) => {
            console.error('[Permissions] getUserPayload failed:', err);
            return null;
          });

          console.log('[Permissions] API response:', dynamicPermsRes);

          if (dynamicPermsRes?.isSuccess && dynamicPermsRes.data?.permissions) {
            const codes = dynamicPermsRes.data.permissions;
            console.log('[Permissions] codes loaded:', codes);
            useStore.setState({
              permissionCodes: codes,
              permissionTree: dynamicPermsRes.data.menuTree || []
            });
          } else {
            // API returned but no permissions data — set empty safely
            console.warn('[Permissions] API succeeded but no permissions field. Defaulting to deny-all.');
            useStore.setState({ permissionCodes: { __loaded: true } });
          }
        } else {
          console.warn('[Permissions] No empId found on currentUser. Defaulting to deny-all.');
          useStore.setState({ permissionCodes: { __loaded: true } });
        }

        // Also load old-style privileges for canCreate/canUpdate/canDelete on components
        if (currentUser?.roleId) {
          const [privsRes, menusRes] = await Promise.all([
            privilegeService.getPrivilegesByRole(currentUser.roleId).catch(() => []),
            privilegeService.getAllMenus().catch(() => [])
          ]);
          const privilegesArr = Array.isArray(privsRes) ? privsRes : (privsRes?.data || []);
          const menusArr = Array.isArray(menusRes) ? menusRes : (menusRes?.data || []);
          const menuIdToName = {};
          menusArr.forEach(m => { menuIdToName[m.menuId] = m.menuName; });
          const privilegesMap = {};
          privilegesArr.forEach(p => {
            const name = menuIdToName[p.menuId];
            if (name) {
              privilegesMap[name.toLowerCase()] = {
                canView: p.canView, canCreate: p.canCreate, canUpdate: p.canUpdate, canDelete: p.canDelete
              };
            }
          });
          useStore.setState({ userPrivileges: privilegesMap });
        }
      } catch (error) {
        console.error('[Permissions] fetchUserPrivileges failed:', error);
        useStore.setState({ permissionCodes: { __loaded: true } }); // deny-all fallback
      } finally {
        setLoadingPrivileges(false);
        setPermissionsLoaded(true);
      }
    };

    fetchUserPrivileges();
  }, [currentUser?.employeeId, currentUser?.id, currentUser?.emp_id, currentUser?.empId, currentUser?.roleId]);

  const [avatar, setAvatar] = useState('');

  useEffect(() => {
    const fetchProfile = async () => {
      const empId = currentUser?.employeeId || currentUser?.id || currentUser?.empId || currentUser?.emp_id;
      if (!empId) return;
      try {
        const res = await employeeService.getEmployeeById(empId);
        const empData = Array.isArray(res?.data) ? res.data[0] : (Array.isArray(res) ? res[0] : (res?.data || res));
        if (empData && empData.avatar) {
          setAvatar(empData.avatar);
          if (currentUser?.avatar !== empData.avatar) {
            useStore.setState(state => ({
              currentUser: {
                ...state.currentUser,
                avatar: empData.avatar
              }
            }));
          }
        }
      } catch (error) {
        console.error("Failed to fetch logged-in employee details", error);
      }
    };
    fetchProfile();
  }, [currentUser?.employeeId, currentUser?.id, currentUser?.empId, currentUser?.emp_id]);

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, code: 'dashboard.page' },
    // { name: 'Workflows', path: '/workflows', icon: Settings, code: 'workflowmanagement.page' },
    { name: 'Task List', path: '/tasks', icon: ListTodo, code: 'task.page' },
    { name: 'Status Board', path: '/status-change', icon: Activity, code: 'statusboard.page' },
    { name: 'New Task', path: '/tasks/new', icon: PlusCircle, code: 'newtask.page' },
    // { name: 'Teams', path: '/teams', icon: Users, code: 'teams.page' },
    { name: 'Employees', path: '/employees', icon: Users, code: 'employee.page' },
    { name: 'Add Employee', path: '/employees/new', icon: UserPlus, code: 'addemployee.page' },
    { name: 'Role Privileges', path: '/privileges', icon: Shield, code: 'roleprivileges.page' },
    { name: 'Masters Settings', path: '/masters', icon: Settings, code: 'masterssettings.page' },
  ];

  const filteredNavItems = navItems.filter(item => {
    // While permissions are loading, show all items (prevents flash of empty sidebar)
    if (!permissionsLoaded) return true;
    const perm = permissionCodes[item.code] ?? 'Deny'; // missing = Deny (secure by default)
    return perm !== 'Deny' && perm !== 'Hidden';
  });


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
      <aside className={cn("fixed md:relative flex-shrink-0 transition-all duration-300 z-50 flex flex-col h-full print:hidden",
        isDarkMode ? "bg-[#0F172A] border-r border-slate-800" : "bg-slate-900 text-slate-100 border-r border-slate-800",
        isSidebarOpen ? "w-64 translate-x-0" : "w-20 -translate-x-full md:translate-x-0"
      )}>
        <div className={cn("h-20 flex items-center justify-between px-6 border-b border-slate-800/50")}>
          <div className="flex items-center gap-3 overflow-hidden">
            <img src={logo1} alt="NavaNala Logo" className="w-8 h-8 rounded-lg object-contain bg-white p-0.5 flex-shrink-0 shadow-lg" />
            {isSidebarOpen && <span className="font-extrabold text-2xl tracking-tight bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent whitespace-nowrap">NavaNala</span>}
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
          {filteredNavItems.map((item) => (
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
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-3 p-2 rounded-xl bg-slate-800/30">
                {(currentUser?.avatar || avatar) ? (
                  <img
                    src={currentUser?.avatar || avatar}
                    alt="Profile"
                    className="w-10 h-10 rounded-full object-cover shadow-sm flex-shrink-0 border border-slate-700/50"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white text-sm font-bold shadow-sm flex-shrink-0">
                    {currentUser?.name?.substring(0, 2).toUpperCase() || 'AD'}
                  </div>
                )}
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
                onClick={() => {
                  setEmployeeForPassword(currentUser);
                  setChangePasswordOpen(true);
                }}
                className="flex items-center justify-center gap-2 w-full py-2 rounded-xl text-sm font-bold bg-orange-500/10 text-orange-500 hover:bg-orange-500 hover:text-white transition-all duration-300"
              >
                <Key className="w-4 h-4" /> Change Password
              </button>
              <button
                onClick={handleLogout}
                className="flex items-center justify-center gap-2 w-full py-2 rounded-xl text-sm font-bold bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all duration-300"
              >
                <LogOut className="w-4 h-4" /> Logout
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3">
              {(currentUser?.avatar || avatar) ? (
                <img
                  src={currentUser?.avatar || avatar}
                  alt="Profile"
                  className="w-10 h-10 rounded-full object-cover shadow-sm flex-shrink-0 border border-slate-700/50"
                  title={currentUser?.name}
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white text-sm font-bold shadow-sm flex-shrink-0" title={currentUser?.name}>
                  {currentUser?.name?.substring(0, 2).toUpperCase() || 'AD'}
                </div>
              )}
              <button
                onClick={() => {
                  setEmployeeForPassword(currentUser);
                  setChangePasswordOpen(true);
                }}
                title="Change Password"
                className="p-2 rounded-xl text-amber-500 hover:bg-amber-500 hover:text-white transition-all duration-300"
              >
                <Key className="w-5 h-5" />
              </button>
              <button
                onClick={handleLogout}
                title="Logout"
                className="p-2 rounded-xl text-rose-500 hover:bg-rose-500 hover:text-white transition-all duration-300"
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
        <header className={cn("md:hidden h-16 border-b flex items-center justify-between px-4 z-30 print:hidden",
          isDarkMode ? "bg-[#0F172A] border-slate-800 text-slate-100" : "bg-white border-slate-200 text-slate-900"
        )}>
          <div className="flex items-center gap-3">
            <img src={logo1} alt="NavaNala Logo" className="w-8 h-8 rounded-lg object-contain bg-white p-0.5 flex-shrink-0 shadow-lg" />
            <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent whitespace-nowrap">NavaNala</span>
          </div>
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <Menu className="w-6 h-6" />
          </button>
        </header>

        {/* Empty space/placeholder to maintain layout if needed */}

        {/* Page Content */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto p-4 md:p-8 pt-20 md:pt-6 relative z-0">
          <Outlet />
        </main>
      </div>

      <ChangePasswordModal
        isOpen={changePasswordOpen}
        onClose={() => {
          setChangePasswordOpen(false);
          setEmployeeForPassword(null);
        }}
        employee={employeeForPassword}
      />
    </div>
  );
}
