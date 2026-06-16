import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { Link } from 'react-router-dom';
import { cn } from '../utils/cn';
import { Search, MapPin, Edit, Trash2, Shield, Plus } from 'lucide-react';
import ConfirmModal from '../components/ConfirmModal';

export default function EmployeeList() {
  const { employees, isDarkMode, deleteEmployee } = useStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [employeeToDelete, setEmployeeToDelete] = useState(null);

  const filteredEmployees = employees.filter(emp => {
    return (emp.name || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
           (emp.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
           (emp.id || '').toLowerCase().includes(searchTerm.toLowerCase());
  });

  const getRoleColor = (role) => {
    switch(role) {
      case 'Admin': return isDarkMode ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' : 'bg-purple-50 text-purple-700 border border-purple-200';
      case 'Manager': return isDarkMode ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : 'bg-blue-50 text-blue-700 border border-blue-200';
      case 'Developer': return isDarkMode ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-emerald-50 text-emerald-700 border border-emerald-200';
      default: return isDarkMode ? 'bg-slate-500/10 text-slate-400 border border-slate-500/20' : 'bg-slate-50 text-slate-700 border border-slate-200';
    }
  };

  return (
    <div className="space-y-6 animate-[fadeIn_0.5s_ease-out]">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className={cn("text-4xl font-extrabold tracking-tight", isDarkMode ? "text-white" : "text-slate-900")}>Team Directory</h1>
          <p className={cn("mt-2 font-medium", isDarkMode ? "text-slate-400" : "text-slate-500")}>Manage all corporate employees and their access roles.</p>
        </div>
        <div className="flex items-center gap-3">
          <Link 
            to="/employees/new"
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold bg-blue-600 hover:bg-blue-700 text-white transition-all duration-300 shadow-sm hover:shadow-md hover:-translate-y-0.5"
          >
            <Plus className="w-5 h-5" /> Add Employee
          </Link>
        </div>
      </div>

      <div className={cn("p-2 rounded-2xl flex flex-col md:flex-row gap-3 shadow-sm",
        isDarkMode ? "bg-slate-800/60 backdrop-blur-md" : "bg-white border border-slate-200"
      )}>
        <div className={cn("flex items-center gap-3 px-4 py-3 rounded-xl flex-1 transition-colors",
          isDarkMode ? "bg-slate-900/50 focus-within:bg-slate-900" : "bg-slate-50 focus-within:bg-white focus-within:ring-2 focus-within:ring-blue-500/20"
        )}>
          <Search className="w-5 h-5 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search employees by name, email or ID..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-transparent border-none outline-none w-full text-sm font-medium placeholder:text-slate-400 dark:text-slate-100"
          />
        </div>
      </div>

      {filteredEmployees.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
          {filteredEmployees.map((emp) => (
            <div 
              key={emp.id} 
              className={cn("relative overflow-hidden p-6 rounded-3xl border transition-all duration-300 hover:-translate-y-1 hover:shadow-xl group flex flex-col", 
                isDarkMode ? "bg-slate-800/40 border-slate-700/50 hover:bg-slate-800/60" : "bg-white border-slate-100 shadow-sm hover:bg-slate-50"
              )}
            >
              <div className="flex justify-between items-start mb-4 relative z-10">
                <span className={cn("px-3 py-1.5 rounded-xl text-xs font-bold tracking-wide flex items-center gap-1.5", getRoleColor(emp.role))}>
                  <Shield className="w-3.5 h-3.5" />
                  {emp.role}
                </span>
                <div className="flex items-center gap-1.5 font-bold text-xs text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700/50 px-3 py-1.5 rounded-xl">
                  <MapPin className={cn("w-3.5 h-3.5", emp.place === 'Remote' ? "text-indigo-500" : "text-emerald-500")} />
                  {emp.place}
                </div>
              </div>

              <div className="flex flex-col items-center mb-6 relative z-10">
                <div className="w-24 h-24 rounded-full overflow-hidden mb-4 border-4 shadow-md bg-gradient-to-tr from-blue-500 to-indigo-500 flex items-center justify-center text-white text-3xl font-bold border-white dark:border-slate-800">
                  {emp.avatar ? (
                    <img src={emp.avatar} alt={emp.name} className="w-full h-full object-cover" />
                  ) : (
                    (emp.name || 'U').substring(0, 2).toUpperCase()
                  )}
                </div>
                <h3 className="font-extrabold text-xl text-slate-900 dark:text-slate-100 mb-1">{emp.name || 'Unknown'}</h3>
                <p className={cn("text-sm font-medium mb-3", isDarkMode ? "text-slate-400" : "text-slate-500")}>{emp.email}</p>
                <div className="px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
                  <span className="text-xs font-bold text-slate-600 dark:text-slate-300">Bio ID: {emp.bioId}</span>
                </div>
              </div>

              <div className={cn("mt-auto pt-4 border-t flex justify-center gap-4 relative z-10", isDarkMode ? "border-slate-700/50" : "border-slate-100")}>
                <Link 
                  to={`/employees/edit/${emp.id}`} 
                  className={cn("flex-1 py-2 flex justify-center items-center gap-2 rounded-xl text-sm font-bold transition-all duration-200", 
                    isDarkMode ? "bg-blue-500/10 hover:bg-blue-500/20 text-blue-400" : "bg-blue-50 hover:bg-blue-100 text-blue-600"
                  )}
                >
                  <Edit className="w-4 h-4" /> Edit
                </Link>
                <button 
                  onClick={() => {
                    setEmployeeToDelete(emp.id);
                    setDeleteModalOpen(true);
                  }}
                  className={cn("flex-1 py-2 flex justify-center items-center gap-2 rounded-xl text-sm font-bold transition-all duration-200", 
                    isDarkMode ? "bg-rose-500/10 hover:bg-rose-500/20 text-rose-400" : "bg-rose-50 hover:bg-rose-100 text-rose-600"
                  )}
                >
                  <Trash2 className="w-4 h-4" /> Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className={cn("rounded-3xl border p-16 text-center", isDarkMode ? "bg-slate-800/40 border-slate-700/50" : "bg-white border-slate-200")}>
          <div className="flex flex-col items-center justify-center text-slate-400 dark:text-slate-500">
            <Search className="w-12 h-12 mb-4 opacity-50" />
            <p className="text-xl font-bold text-slate-700 dark:text-slate-300">No employees found</p>
            <p className="text-sm mt-2">Try searching with a different term or add a new employee.</p>
          </div>
        </div>
      )}

      <ConfirmModal 
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setEmployeeToDelete(null);
        }}
        onConfirm={() => {
          if (employeeToDelete) deleteEmployee(employeeToDelete);
        }}
        title="Remove Employee"
        message="Are you sure you want to remove this employee? This action cannot be undone."
      />
    </div>
  );
}
