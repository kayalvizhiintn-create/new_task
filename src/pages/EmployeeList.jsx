import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { Link } from 'react-router-dom';
import { cn } from '../utils/cn';
import { Search, MapPin, Edit, Trash2, Shield, Plus, LayoutGrid, List, Key, RefreshCcw } from 'lucide-react';
import { employeeService } from '../services/employeeService';
import ChangePasswordModal from '../components/ChangePasswordModal';
import Swal from 'sweetalert2';

export default function EmployeeList() {
  const { isDarkMode, userPrivileges, currentUser } = useStore();
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [employeeToDelete, setEmployeeToDelete] = useState(null);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'table'
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const [employeeForPassword, setEmployeeForPassword] = useState(null);

  const empPermissions = userPrivileges['employees'] || { canView: 0, canCreate: 0, canUpdate: 0, canDelete: 0 };
  const addEmpPermissions = userPrivileges['add employee'] || { canView: 0, canCreate: 0, canUpdate: 0, canDelete: 0 };
  const isAdmin = currentUser?.role?.toLowerCase() === 'admin' || currentUser?.role?.toLowerCase() === 'super admin';
  const canCreateEmp = isAdmin || (Object.keys(userPrivileges).length === 0) || (
    empPermissions.canCreate === 1 && addEmpPermissions.canCreate === 1 && addEmpPermissions.canView === 1
  );
  const canUpdateEmp = isAdmin || (Object.keys(userPrivileges).length === 0) || empPermissions.canUpdate === 1;
  const canDeleteEmp = isAdmin || (Object.keys(userPrivileges).length === 0) || empPermissions.canDelete === 1;

  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchEmployees = async (isBackground = false) => {
    if (!isBackground) setLoading(true);
    try {
      const data = await employeeService.getAllEmployees();
      // Handle array or object response format safely
      setEmployees(Array.isArray(data) ? data : (data?.data || data?.items || []));
    } catch (error) {
      console.error("Error fetching employees", error);
    } finally {
      if (!isBackground) setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchEmployees();

    // 15-minute background refresh interval
    const intervalId = setInterval(async () => {
      setIsRefreshing(true);
      await fetchEmployees(true);
      setTimeout(() => setIsRefreshing(false), 1000);
    }, 15 * 60 * 1000);

    return () => clearInterval(intervalId);
  }, []);


  const filteredEmployees = employees.filter(emp => {
    const empName = emp.name || emp.empName || emp.employeeName || '';
    const empIdStr = emp.id || emp.empId || emp.bioid || emp.bioId || emp.employeeId || '';
    return empName.toLowerCase().includes(searchTerm.toLowerCase()) || 
           (emp.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
           empIdStr.toString().toLowerCase().includes(searchTerm.toLowerCase());
  });

  const getRoleColor = (role) => {
    switch(role) {
      case 'Admin': 
      case 'Super Admin': 
        return isDarkMode ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' : 'bg-purple-50 text-purple-700 border border-purple-200';
      case 'Manager': return isDarkMode ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : 'bg-blue-50 text-blue-700 border border-blue-200';
      case 'Developer': return isDarkMode ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-emerald-50 text-emerald-700 border border-emerald-200';
      default: return isDarkMode ? 'bg-slate-500/10 text-slate-400 border border-slate-500/20' : 'bg-slate-50 text-slate-700 border border-slate-200';
    }
  };

  const canView = isAdmin || (Object.keys(userPrivileges).length === 0) || empPermissions.canView === 1;

  if (!canView) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center min-h-[400px] animate-[fadeIn_0.5s_ease-out]">
        <div className="p-4 rounded-full bg-rose-500/10 text-rose-500 mb-4 animate-[pulse_2s_infinite]">
          <Shield className="w-12 h-12" />
        </div>
        <h2 className={cn("text-2xl font-bold tracking-tight", isDarkMode ? "text-white" : "text-slate-900")}>Access Denied</h2>
        <p className={cn("text-sm font-medium mt-2 max-w-sm", isDarkMode ? "text-slate-400" : "text-slate-500")}>
          You do not have the required permissions to view the Employee Directory. Please contact your system administrator.
        </p>
        <Link to="/dashboard" className="mt-6 px-6 py-2.5 rounded-xl font-bold bg-blue-600 hover:bg-blue-700 text-white transition-all duration-300 shadow-sm hover:shadow">
          Back to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-[fadeIn_0.5s_ease-out]">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className={cn("text-4xl font-extrabold tracking-tight", isDarkMode ? "text-white" : "text-slate-900")}>Team Directory</h1>
          <p className={cn("mt-2 font-medium", isDarkMode ? "text-slate-400" : "text-slate-500")}>Manage all corporate employees and their access roles.</p>
        </div>
        {canCreateEmp && (
          <div className="flex items-center gap-3">
            <Link 
              to="/employees/new"
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold bg-blue-600 hover:bg-blue-700 text-white transition-all duration-300 shadow-sm hover:shadow-md hover:-translate-y-0.5"
            >
              <Plus className="w-5 h-5" /> Add Employee
            </Link>
          </div>
        )}
      </div>

      <div className={cn("p-2 rounded-2xl flex flex-col md:flex-row gap-3 shadow-sm justify-between items-center",
        isDarkMode ? "bg-slate-800/60 backdrop-blur-md" : "bg-white border border-slate-200"
      )}>
        <div className={cn("flex items-center gap-3 px-4 py-3 rounded-xl flex-1 transition-colors border w-full",
          isDarkMode ? "bg-slate-900/50 border-slate-700 focus-within:border-blue-500 focus-within:bg-slate-900" : "bg-slate-50 border-slate-200 focus-within:border-blue-500 focus-within:bg-white"
        )}>
          <Search className="w-5 h-5 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search employees by name, email or ID..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-transparent border-none outline-none focus:outline-none focus:ring-0 w-full text-sm font-medium placeholder:text-slate-400 dark:text-slate-100"
          />
        </div>
        
        <div className="flex items-center gap-2 border dark:border-slate-700/80 rounded-xl p-1 bg-slate-100 dark:bg-slate-900/50 mr-2">
          <button 
            onClick={() => setViewMode('grid')}
            className={cn("p-2 rounded-lg transition-all", 
              viewMode === 'grid' 
                ? "bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm" 
                : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            )}
            title="Grid View"
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
          <button 
            onClick={() => setViewMode('table')}
            className={cn("p-2 rounded-lg transition-all", 
              viewMode === 'table' 
                ? "bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm" 
                : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            )}
            title="Table View"
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center p-16 text-slate-500 font-medium">Loading employees from database...</div>
      ) : filteredEmployees.length > 0 ? (
        viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {filteredEmployees.map((emp, index) => (
              <div 
                key={emp.id || emp.empId || emp._id || emp.employeeId || index} 
                className={cn("relative overflow-hidden p-6 rounded-3xl border transition-all duration-300 hover:-translate-y-1 hover:shadow-xl group flex flex-col", 
                  isDarkMode ? "bg-slate-800/40 border-slate-700/50 hover:bg-slate-800/60" : "bg-white border-slate-100 shadow-sm hover:bg-slate-50"
                )}
              >
                <div className="flex justify-between items-start mb-4 relative z-10">
                  <span className={cn("px-3 py-1.5 rounded-xl text-xs font-bold tracking-wide flex items-center gap-1.5", getRoleColor(emp.role || emp.roleName))}>
                    <Shield className="w-3.5 h-3.5" />
                    {emp.role || emp.roleName || 'Employee'}
                  </span>
                  <div className="flex items-center gap-1.5 font-bold text-xs text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700/50 px-3 py-1.5 rounded-xl">
                    <MapPin className={cn("w-3.5 h-3.5", (emp.place || emp.workPlace || emp.location) === 'Remote' ? "text-indigo-500" : "text-emerald-500")} />
                    {emp.place || emp.workPlace || emp.location || 'Office'}
                  </div>
                </div>

                <div className="flex flex-col items-center mb-6 relative z-10">
                  <div className="w-24 h-24 rounded-full overflow-hidden mb-4 border-4 shadow-md bg-gradient-to-tr from-blue-500 to-indigo-500 flex items-center justify-center text-white text-3xl font-bold border-white dark:border-slate-800">
                    {emp.avatar ? (
                      <img src={emp.avatar} alt={emp.name || emp.empName} className="w-full h-full object-cover" />
                    ) : (
                      (emp.name || emp.empName || emp.employeeName || 'U').substring(0, 2).toUpperCase()
                    )}
                  </div>
                  <h3 className="font-extrabold text-xl text-slate-900 dark:text-slate-100 mb-1">{emp.name || emp.empName || emp.employeeName || 'Unknown'}</h3>
                  <p className={cn("text-sm font-medium mb-3", isDarkMode ? "text-slate-400" : "text-slate-500")}>{emp.email}</p>
                  <div className="px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
                    <span className="text-xs font-bold text-slate-600 dark:text-slate-300">Bio ID: {emp.bioid || emp.bioId || emp.empBioId || emp.id || emp.employeeId || 'N/A'}</span>
                  </div>
                </div>

                <div className={cn("mt-auto pt-4 border-t flex justify-center gap-3 relative z-10", isDarkMode ? "border-slate-700/50" : "border-slate-100")}>
                  {canUpdateEmp && (
                    <Link 
                      to={`/employees/edit/${emp.id || emp.empId || emp._id || emp.employeeId}`} 
                      className={cn("flex-1 py-2 flex justify-center items-center gap-1.5 rounded-xl text-xs font-bold transition-all duration-200", 
                        isDarkMode ? "bg-blue-500/10 hover:bg-blue-500/20 text-blue-400" : "bg-blue-50 hover:bg-blue-100 text-blue-600"
                      )}
                    >
                      <Edit className="w-3.5 h-3.5" /> Edit
                    </Link>
                  )}
                  <button 
                    onClick={() => {
                      setEmployeeForPassword(emp);
                      setChangePasswordOpen(true);
                    }}
                    className={cn("flex-1 py-2 flex justify-center items-center gap-1.5 rounded-xl text-xs font-bold transition-all duration-200", 
                      isDarkMode ? "bg-amber-500/10 hover:bg-amber-500/20 text-amber-400" : "bg-amber-50 hover:bg-amber-100 text-amber-600"
                    )}
                    title="Change Password"
                  >
                    <Key className="w-3.5 h-3.5" /> Password
                  </button>
                  {canDeleteEmp && (
                    <button 
                      onClick={() => {
                        const empName = emp.name || emp.empName || emp.employeeName || 'this employee';
                        const targetId = emp.id || emp.empId || emp._id || emp.employeeId;
                        Swal.fire({
                          title: 'Are you sure?',
                          text: `Do you want to remove employee "${empName}"? This action cannot be undone.`,
                          icon: 'warning',
                          showCancelButton: true,
                          confirmButtonColor: '#ef4444',
                          cancelButtonColor: '#64748b',
                          confirmButtonText: 'Yes, remove them!',
                          background: isDarkMode ? '#1e293b' : '#ffffff',
                          color: isDarkMode ? '#f8fafc' : '#0f172a',
                        }).then(async (result) => {
                          if (result.isConfirmed) {
                            try {
                              await employeeService.deleteEmployee(targetId);
                              await fetchEmployees();
                              Swal.fire({
                                title: 'Removed!',
                                text: `Employee "${empName}" has been removed.`,
                                icon: 'success',
                                confirmButtonColor: '#3b82f6',
                                background: isDarkMode ? '#1e293b' : '#ffffff',
                                color: isDarkMode ? '#f8fafc' : '#0f172a',
                              });
                            } catch (error) {
                              console.error("Failed to delete employee", error);
                              Swal.fire({
                                title: 'Error!',
                                text: 'Failed to remove employee.',
                                icon: 'error',
                                confirmButtonColor: '#3b82f6',
                                background: isDarkMode ? '#1e293b' : '#ffffff',
                                color: isDarkMode ? '#f8fafc' : '#0f172a',
                              });
                            }
                          }
                        });
                      }}
                      className={cn("flex-1 py-2 flex justify-center items-center gap-1.5 rounded-xl text-xs font-bold transition-all duration-200", 
                        isDarkMode ? "bg-rose-500/10 hover:bg-rose-500/20 text-rose-400" : "bg-rose-50 hover:bg-rose-100 text-rose-600"
                      )}
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Delete
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className={cn("rounded-3xl border overflow-hidden shadow-sm transition-all duration-300",
            isDarkMode ? "bg-slate-800/40 border-slate-700/50" : "bg-white border-slate-200"
          )}>
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left text-sm">
                <thead className={cn("border-b", isDarkMode ? "bg-slate-900/50 border-slate-700/50" : "bg-slate-50 border-slate-200")}>
                  <tr>
                    <th className={cn("px-6 py-4 font-bold uppercase tracking-wider text-xs", isDarkMode ? "text-slate-400" : "text-slate-500")}>Employee</th>
                    <th className={cn("px-6 py-4 font-bold uppercase tracking-wider text-xs", isDarkMode ? "text-slate-400" : "text-slate-500")}>Email</th>
                    <th className={cn("px-6 py-4 font-bold uppercase tracking-wider text-xs", isDarkMode ? "text-slate-400" : "text-slate-500")}>Bio ID</th>
                    <th className={cn("px-6 py-4 font-bold uppercase tracking-wider text-xs", isDarkMode ? "text-slate-400" : "text-slate-500")}>Role</th>
                    <th className={cn("px-6 py-4 font-bold uppercase tracking-wider text-xs", isDarkMode ? "text-slate-400" : "text-slate-500")}>Location</th>
                    <th className={cn("px-6 py-4 font-bold uppercase tracking-wider text-xs text-center", isDarkMode ? "text-slate-400" : "text-slate-500")}>Password</th>
                    <th className={cn("px-6 py-4 font-bold uppercase tracking-wider text-xs text-right", isDarkMode ? "text-slate-400" : "text-slate-500")}>Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700/50">
                  {filteredEmployees.map((emp, idx) => {
                    const empName = emp.name || emp.empName || emp.employeeName || 'Unknown';
                    const empId = emp.id || emp.empId || emp._id || emp.employeeId || idx;
                    const empBioId = emp.bioid || emp.bioId || emp.empBioId || empId || 'N/A';
                    const empRole = emp.role || emp.roleName || 'Employee';
                    
                    return (
                      <tr 
                        key={empId}
                        className={cn("transition-all duration-200 hover:bg-slate-50/50 dark:hover:bg-slate-700/20",
                          idx % 2 === 0 ? "bg-transparent" : (isDarkMode ? "bg-slate-800/10" : "bg-slate-50/30")
                        )}
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 shrink-0 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-500 flex items-center justify-center text-white text-sm font-bold shadow-sm overflow-hidden">
                              {emp.avatar ? (
                                <img src={emp.avatar} alt={empName} className="w-full h-full object-cover" />
                              ) : (
                                empName.substring(0, 2).toUpperCase()
                              )}
                            </div>
                            <span className={cn("font-bold text-base", isDarkMode ? "text-slate-100" : "text-slate-900")}>{empName}</span>
                          </div>
                        </td>
                        <td className={cn("px-6 py-4 font-semibold", isDarkMode ? "text-slate-300" : "text-slate-700")}>{emp.email}</td>
                        <td className={cn("px-6 py-4 font-bold text-blue-600 dark:text-blue-400")}>{empBioId}</td>
                        <td className="px-6 py-4">
                          <span className={cn("px-2.5 py-1 rounded-xl text-xs font-bold tracking-wide flex items-center gap-1.5 w-fit", getRoleColor(empRole))}>
                            <Shield className="w-3 h-3" />
                            {empRole}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-semibold">
                          <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                            <MapPin className={cn("w-3.5 h-3.5", (emp.place || emp.workPlace || emp.location) === 'Remote' ? "text-indigo-500" : "text-emerald-500")} />
                            {emp.place || emp.workPlace || emp.location || 'Office'}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <button 
                            onClick={() => {
                              setEmployeeForPassword(emp);
                              setChangePasswordOpen(true);
                            }}
                            className={cn("p-2 rounded-xl transition-all duration-200 mx-auto block", 
                              isDarkMode ? "hover:bg-amber-500/20 text-amber-400" : "hover:bg-amber-50 text-amber-600"
                            )}
                            title="Change Password"
                          >
                            <Key className="w-4 h-4" />
                          </button>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {canUpdateEmp && (
                              <Link 
                                to={`/employees/edit/${empId}`} 
                                className={cn("p-2 rounded-xl transition-all duration-200", 
                                  isDarkMode ? "hover:bg-blue-500/20 text-blue-400" : "hover:bg-blue-50 text-blue-600"
                                )}
                                title="Edit Employee"
                              >
                                <Edit className="w-4 h-4" />
                              </Link>
                            )}
                            {canDeleteEmp && (
                              <button 
                                onClick={() => {
                                  Swal.fire({
                                    title: 'Are you sure?',
                                    text: `Do you want to remove employee "${empName}"? This action cannot be undone.`,
                                    icon: 'warning',
                                    showCancelButton: true,
                                    confirmButtonColor: '#ef4444',
                                    cancelButtonColor: '#64748b',
                                    confirmButtonText: 'Yes, remove them!',
                                    background: isDarkMode ? '#1e293b' : '#ffffff',
                                    color: isDarkMode ? '#f8fafc' : '#0f172a',
                                  }).then(async (result) => {
                                    if (result.isConfirmed) {
                                      try {
                                        await employeeService.deleteEmployee(empId);
                                        await fetchEmployees();
                                        Swal.fire({
                                          title: 'Removed!',
                                          text: `Employee "${empName}" has been removed.`,
                                          icon: 'success',
                                          confirmButtonColor: '#3b82f6',
                                          background: isDarkMode ? '#1e293b' : '#ffffff',
                                          color: isDarkMode ? '#f8fafc' : '#0f172a',
                                        });
                                      } catch (error) {
                                        console.error("Failed to delete employee", error);
                                        Swal.fire({
                                          title: 'Error!',
                                          text: 'Failed to remove employee.',
                                          icon: 'error',
                                          confirmButtonColor: '#3b82f6',
                                          background: isDarkMode ? '#1e293b' : '#ffffff',
                                          color: isDarkMode ? '#f8fafc' : '#0f172a',
                                        });
                                      }
                                    }
                                  });
                                }}
                                className={cn("p-2 rounded-xl transition-all duration-200", 
                                  isDarkMode ? "hover:bg-rose-500/20 text-rose-400" : "hover:bg-rose-50 text-rose-600"
                                )}
                                title="Delete Employee"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )
      ) : (
        <div className={cn("rounded-3xl border p-16 text-center", isDarkMode ? "bg-slate-800/40 border-slate-700/50" : "bg-white border-slate-200")}>
          <div className="flex flex-col items-center justify-center text-slate-400 dark:text-slate-500">
            <Search className="w-12 h-12 mb-4 opacity-50" />
            <p className="text-xl font-bold text-slate-700 dark:text-slate-300">No employees found</p>
            <p className="text-sm mt-2">Try searching with a different term or add a new employee.</p>
          </div>
        </div>
      )}



      <ChangePasswordModal
        isOpen={changePasswordOpen}
        onClose={() => {
          setChangePasswordOpen(false);
          setEmployeeForPassword(null);
        }}
        employee={employeeForPassword}
        onSuccess={() => fetchEmployees()}
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
