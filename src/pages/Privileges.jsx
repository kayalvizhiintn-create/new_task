import React, { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { cn } from '../utils/cn';
import { Shield, Settings, Menu as MenuIcon, AlertCircle, CheckCircle2, ChevronRight, Lock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { roleService } from '../services/roleService';
import { privilegeService } from '../services/privilegeService';

const DEFAULT_MENUS = [
  { name: 'Dashboard', orderId: 1 },
  { name: 'Task List', orderId: 2 },
  { name: 'Status Board', orderId: 3 },
  { name: 'New Task', orderId: 4 },
  { name: 'Teams', orderId: 5 },
  { name: 'Employees', orderId: 6 },
  { name: 'Add Employee', orderId: 7 },
  { name: 'Role Privileges', orderId: 8 },
  { name: 'Masters Settings', orderId: 9 }
];

export default function Privileges() {
  const { isDarkMode, currentUser, userPrivileges } = useStore();
  const isAdmin = currentUser?.role?.toLowerCase() === 'admin';
  const canAccess = isAdmin || (Object.keys(userPrivileges).length === 0) || (userPrivileges['role privileges']?.canView === 1);

  if (!canAccess) {
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

  const [roles, setRoles] = useState([]);
  const [menus, setMenus] = useState([]);
  const [selectedRoleId, setSelectedRoleId] = useState('');
  
  // Mapping of menuId -> privilegeId for the selected role
  const [mappedPrivileges, setMappedPrivileges] = useState({});
  
  const [loadingRoles, setLoadingRoles] = useState(true);
  const [loadingMenus, setLoadingMenus] = useState(false);
  const [loadingPrivileges, setLoadingPrivileges] = useState(false);
  const [actionLoading, setActionLoading] = useState(null); // stores menuId currently toggling

  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });

  const showNotification = (message, type = 'success') => {
    setNotification({ show: true, message, type });
    setTimeout(() => {
      setNotification({ show: false, message: '', type: 'success' });
    }, 3000);
  };

  // Fetch initial roles & menus
  useEffect(() => {
    const fetchInitialData = async () => {
      setLoadingRoles(true);
      try {
        const [rolesRes, menusRes] = await Promise.all([
          roleService.getAllRoles().catch(() => []),
          privilegeService.getAllMenus().catch(() => [])
        ]);

        // Process Roles
        const rolesArr = Array.isArray(rolesRes) ? rolesRes : (rolesRes?.data || rolesRes?.items || []);
        setRoles(rolesArr);

        // Process Menus
        let menusArr = Array.isArray(menusRes) ? menusRes : (menusRes?.data || menusRes?.items || []);
        
        // Auto-seed if empty
        if (menusArr.length === 0) {
          console.log("Database menus table is empty. Auto-seeding default menus from frontend...");
          const seedPromises = DEFAULT_MENUS.map(m => 
            privilegeService.createMenu({
              menuId: 0,
              parentId: 0,
              menuName: m.name,
              orderId: m.orderId
            }).catch(err => {
              console.error(`Failed to seed menu: ${m.name}`, err);
              return null;
            })
          );
          await Promise.all(seedPromises);
          
          // Re-fetch menus
          const refetchedMenus = await privilegeService.getAllMenus().catch(() => []);
          menusArr = Array.isArray(refetchedMenus) ? refetchedMenus : (refetchedMenus?.data || refetchedMenus?.items || []);
        }

        setMenus(menusArr.sort((a, b) => (a.orderId || 0) - (b.orderId || 0)));

        // Select first role by default if available
        if (rolesArr.length > 0) {
          const firstId = rolesArr[0].id || rolesArr[0].roleId || rolesArr[0]._id;
          setSelectedRoleId(String(firstId));
        }
      } catch (error) {
        console.error("Error fetching setup data", error);
        showNotification("Failed to load initial roles and menus", "error");
      } finally {
        setLoadingRoles(false);
      }
    };

    fetchInitialData();
  }, []);

  // Fetch privileges when role selection changes
  useEffect(() => {
    if (!selectedRoleId) {
      setMappedPrivileges({});
      return;
    }

    const fetchRolePrivileges = async () => {
      setLoadingPrivileges(true);
      try {
        const res = await privilegeService.getPrivilegesByRole(selectedRoleId);
        const privilegesArr = Array.isArray(res) ? res : (res?.data || res?.items || []);
        
        // Map menuId -> privilege details object
        const mapping = {};
        privilegesArr.forEach(p => {
          const mId = p.menuId;
          if (mId || mId === 0) {
            mapping[mId] = {
              privilegeId: p.privilegeId || p.id,
              canCreate: p.canCreate || 0,
              canUpdate: p.canUpdate || 0,
              canDelete: p.canDelete || 0,
              canView: p.canView || 0
            };
          }
        });
        setMappedPrivileges(mapping);
      } catch (error) {
        console.error("Error fetching role privileges", error);
        showNotification("Failed to load privileges for selected role", "error");
      } finally {
        setLoadingPrivileges(false);
      }
    };

    fetchRolePrivileges();
  }, [selectedRoleId]);

  const handleTogglePermission = async (menuId, permissionName, currentValue) => {
    if (!selectedRoleId) return;
    
    const actionKey = `${menuId}-${permissionName}`;
    setActionLoading(actionKey);
    try {
      const existingPrivilege = mappedPrivileges[menuId];
      const nextValue = currentValue === 1 ? 0 : 1;
      
      if (existingPrivilege) {
        // Update
        const payload = {
          privilegeId: existingPrivilege.privilegeId,
          roleId: parseInt(selectedRoleId, 10),
          menuId: parseInt(menuId, 10),
          canCreate: existingPrivilege.canCreate,
          canUpdate: existingPrivilege.canUpdate,
          canDelete: existingPrivilege.canDelete,
          canView: existingPrivilege.canView
        };
        payload[permissionName] = nextValue;
        
        const res = await privilegeService.updatePrivilege(payload);
        if (res?.isSuccess || res?.data) {
          setMappedPrivileges(prev => ({
            ...prev,
            [menuId]: {
              ...prev[menuId],
              [permissionName]: nextValue
            }
          }));
          showNotification("Permission updated successfully");
        } else {
          showNotification(res?.message || "Failed to update permission", "error");
        }
      } else {
        // Create
        const payload = {
          privilegeId: 0,
          roleId: parseInt(selectedRoleId, 10),
          menuId: parseInt(menuId, 10),
          canCreate: 0,
          canUpdate: 0,
          canDelete: 0,
          canView: 0
        };
        payload[permissionName] = nextValue;
        
        const res = await privilegeService.createPrivilege(payload);
        if (res?.isSuccess || res?.data) {
          const newPriv = res.data || res;
          setMappedPrivileges(prev => ({
            ...prev,
            [menuId]: {
              privilegeId: newPriv.privilegeId || newPriv.id,
              canCreate: newPriv.canCreate || 0,
              canUpdate: newPriv.canUpdate || 0,
              canDelete: newPriv.canDelete || 0,
              canView: newPriv.canView || 0
            }
          }));
          showNotification("Permission mapped successfully");
        } else {
          showNotification(res?.message || "Failed to map permission", "error");
        }
      }
    } catch (error) {
      console.error("Failed to toggle permission", error);
      showNotification(error.response?.data?.message || error.message || "An error occurred", "error");
    } finally {
      setActionLoading(null);
    }
  };

  const renderPermissionToggle = (menuId, key, label, val) => {
    const isChecked = val === 1;
    const actionKey = `${menuId}-${key}`;
    const isToggling = actionLoading === actionKey;
    
    return (
      <div className="flex items-center gap-1.5 bg-slate-100/50 dark:bg-slate-900/40 px-3 py-1.5 rounded-xl border border-slate-200/40 dark:border-slate-800/40 hover:scale-[1.02] transition-transform duration-200">
        <span className={cn("text-[10px] font-extrabold uppercase tracking-wider shrink-0", 
          isChecked 
            ? (isDarkMode ? "text-indigo-400" : "text-indigo-600")
            : (isDarkMode ? "text-slate-400" : "text-slate-500")
        )}>
          {label}
        </span>
        <label className={cn("relative inline-flex items-center cursor-pointer select-none", 
          isToggling && "opacity-50 pointer-events-none"
        )}>
          <input 
            type="checkbox" 
            checked={isChecked}
            onChange={() => handleTogglePermission(menuId, key, val || 0)}
            className="sr-only peer"
            disabled={isToggling}
          />
          <div className={cn(
            "w-8 h-4.5 rounded-full peer transition-all duration-300 relative border border-transparent",
            "after:content-[''] after:absolute after:top-[1px] after:left-[1px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-all dark:after:border-slate-600",
            isDarkMode ? "bg-slate-700/60" : "bg-slate-300/60",
            "peer-checked:after:translate-x-[14px] peer-checked:after:border-white peer-checked:bg-blue-600"
          )}>
            {isToggling && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-2.5 h-2.5 border border-slate-300 border-t-white rounded-full animate-spin" />
              </div>
            )}
          </div>
        </label>
      </div>
    );
  };

  const getRoleName = (id) => {
    const roleObj = roles.find(r => String(r.id || r.roleId || r._id) === String(id));
    return roleObj ? (roleObj.name || roleObj.roleName) : 'Role';
  };

  return (
    <div className="space-y-6 animate-[fadeIn_0.5s_ease-out]">
      {/* Toast Notification Banner */}
      {notification.show && (
        <div className={cn(
          "fixed top-4 right-4 z-50 p-4 rounded-2xl shadow-xl flex items-center gap-3 animate-[slideIn_0.3s_ease-out] border",
          notification.type === 'success' 
            ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500 dark:bg-emerald-950/20" 
            : "bg-rose-500/10 border-rose-500/20 text-rose-500 dark:bg-rose-950/20"
        )}>
          {notification.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          <span className="text-sm font-bold">{notification.message}</span>
        </div>
      )}

      {/* Header section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className={cn("text-4xl font-extrabold tracking-tight", isDarkMode ? "text-white" : "text-slate-900")}>Role Privileges</h1>
          <p className={cn("mt-2 font-medium", isDarkMode ? "text-slate-400" : "text-slate-500")}>Configure accessible system menus and interface pages for user roles.</p>
        </div>
        
        {/* Role Selector dropdown */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          {loadingRoles ? (
            <div className="h-12 w-48 rounded-xl bg-slate-200 dark:bg-slate-700 animate-pulse" />
          ) : (
            <div className={cn("px-4 py-3 rounded-xl border flex items-center gap-3 flex-1 md:flex-initial", 
              isDarkMode ? "bg-slate-800 border-slate-700 text-slate-100" : "bg-white border-slate-200 text-slate-900 shadow-sm"
            )}>
              <Shield className="w-5 h-5 text-indigo-500 shrink-0" />
              <select
                value={selectedRoleId}
                onChange={(e) => setSelectedRoleId(e.target.value)}
                className="bg-transparent outline-none border-none font-bold text-sm cursor-pointer appearance-none min-w-[160px] pr-8"
              >
                <option value="">Select Role</option>
                {roles.map(role => {
                  const id = role.id || role.roleId || role._id;
                  const name = role.name || role.roleName;
                  return <option key={id} value={id}>{name}</option>;
                })}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Grid structure */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Helper summary panel */}
        {/* <div className={cn("p-6 rounded-3xl border shadow-sm h-fit", 
          isDarkMode ? "bg-slate-800/40 border-slate-700/50" : "bg-white border-slate-200"
        )}> */}
          {/* <div className="flex items-center gap-3 mb-4">
            <div className="p-3 rounded-xl bg-indigo-500/20 text-indigo-500">
              <Lock className="w-6 h-6" />
            </div>
            <h3 className={cn("text-xl font-bold", isDarkMode ? "text-white" : "text-slate-900")}>Access Info</h3>
          </div> */}
          
          {/* <p className={cn("text-sm font-semibold mb-4 leading-relaxed", isDarkMode ? "text-slate-300" : "text-slate-600")}>
            Selected Role: <span className="text-indigo-500 font-extrabold">{getRoleName(selectedRoleId)}</span>
          </p>
          <div className={cn("p-4 rounded-2xl text-xs font-medium space-y-3 leading-relaxed", 
            isDarkMode ? "bg-slate-900/50 text-slate-400" : "bg-slate-50 text-slate-500"
          )}>
            <p>1. Select a role from the dropdown menu to inspect its current accessible menus.</p>
            <p>2. Checking a menu item grants access to that page or route for users belonging to the role.</p>
            <p>3. Mappings are updated in real-time on the server as they are toggled.</p>
          </div>
        </div> */}

        {/* Privileges/Menu Management Grid */}
        <div className="md:col-span-2">
          {loadingPrivileges || loadingRoles ? (
            <div className="space-y-4">
              {[1, 2, 3, 4].map(idx => (
                <div key={idx} className={cn("h-16 rounded-2xl animate-pulse", isDarkMode ? "bg-slate-800" : "bg-slate-100")} />
              ))}
            </div>
          ) : !selectedRoleId ? (
            <div className={cn("rounded-3xl border p-12 text-center", isDarkMode ? "bg-slate-800/40 border-slate-700/50" : "bg-white border-slate-200 shadow-sm")}>
              <AlertCircle className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <p className="font-bold text-lg text-slate-700 dark:text-slate-300">No Role Selected</p>
              <p className="text-sm mt-2 text-slate-500 dark:text-slate-400">Select a role from the top dropdown to manage its privileges.</p>
            </div>
          ) : menus.length > 0 ? (
            <div className={cn("rounded-3xl border overflow-hidden shadow-sm transition-all duration-300",
              isDarkMode ? "bg-slate-800/40 border-slate-700/50" : "bg-white border-slate-200"
            )}>
              <div className="divide-y divide-slate-200 dark:divide-slate-700/50">
                {menus.map((menu, idx) => {
                  const menuId = menu.menuId;
                  const isMapped = mappedPrivileges[menuId] !== undefined && 
                    (mappedPrivileges[menuId].canView === 1 || 
                     mappedPrivileges[menuId].canCreate === 1 || 
                     mappedPrivileges[menuId].canUpdate === 1 || 
                     mappedPrivileges[menuId].canDelete === 1);

                  return (
                    <div 
                      key={menuId}
                      className={cn("flex flex-col sm:flex-row sm:items-center justify-between px-6 py-4.5 gap-4 transition-all duration-200", 
                        isDarkMode ? "hover:bg-slate-700/20" : "hover:bg-slate-50",
                        idx % 2 === 0 ? "bg-transparent" : (isDarkMode ? "bg-slate-800/10" : "bg-slate-50/20")
                      )}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={cn("p-2 rounded-xl shrink-0", 
                          isMapped 
                            ? "bg-indigo-500/15 text-indigo-500" 
                            : "bg-slate-100 dark:bg-slate-800 text-slate-400"
                        )}>
                          <MenuIcon className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <h4 className={cn("font-bold text-sm truncate", isDarkMode ? "text-slate-100" : "text-slate-900")}>
                            {menu.menuName || `Menu #${menuId}`}
                          </h4>
                          {menu.parentId > 0 && (
                            <p className="text-[10px] font-bold text-indigo-400 dark:text-indigo-500/80 mt-0.5 flex items-center gap-1">
                              Sub-item of #{menu.parentId}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* CRUD Toggle Columns */}
                      <div className="flex flex-wrap items-center gap-3 shrink-0">
                        {renderPermissionToggle(menuId, 'canView', 'View', mappedPrivileges[menuId]?.canView)}
                        {renderPermissionToggle(menuId, 'canCreate', 'Create', mappedPrivileges[menuId]?.canCreate)}
                        {renderPermissionToggle(menuId, 'canUpdate', 'Update', mappedPrivileges[menuId]?.canUpdate)}
                        {renderPermissionToggle(menuId, 'canDelete', 'Delete', mappedPrivileges[menuId]?.canDelete)}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className={cn("rounded-3xl border p-12 text-center", isDarkMode ? "bg-slate-800/40 border-slate-700/50" : "bg-white border-slate-200 shadow-sm")}>
              <AlertCircle className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <p className="font-bold text-lg text-slate-700 dark:text-slate-300">No Menus Found</p>
              <p className="text-sm mt-2 text-slate-500 dark:text-slate-400 font-medium">Verify that the menu controller returns populated data.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
