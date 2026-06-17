import React, { useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { cn } from '../utils/cn';
import { ArrowLeft, CheckCircle2, Briefcase, Calendar, AlignLeft, User } from 'lucide-react';

export default function ReviewTask() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { tasks, employees, updateTask, isDarkMode } = useStore();
  
  const taskToEdit = tasks.find(t => t.id === id);
  const [assignee, setAssignee] = useState('');

  if (!taskToEdit) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <h2 className={cn("text-2xl font-bold", isDarkMode ? "text-white" : "text-slate-900")}>Task not found</h2>
        <Link to="/tasks" className="mt-4 text-blue-500 hover:underline">Return to Tasks</Link>
      </div>
    );
  }

  const handleApprove = () => {
    if (!assignee) {
      alert("Please select an assignee before approving.");
      return;
    }
    
    // Auto change status to Open upon adding assignee
    updateTask(id, {
      assignedTo: assignee,
      status: 'Open'
    });
    
    navigate('/tasks');
  };

  const inputClasses = cn(
    "w-full px-4 py-3.5 rounded-xl border outline-none transition-all duration-300 text-sm font-semibold",
    isDarkMode 
      ? "bg-slate-900/50 border-slate-700 text-slate-100 focus:border-blue-500 focus:bg-slate-900 focus:ring-4 focus:ring-blue-500/10" 
      : "bg-slate-50 border-slate-200 text-slate-900 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
  );
  
  const labelClasses = cn("block text-sm font-bold mb-2 tracking-wide", isDarkMode ? "text-slate-300" : "text-slate-700");

  const SectionHeader = ({ icon: Icon, title, subtitle }) => (
    <div className="flex items-start gap-4 mb-8">
      <div className={cn("p-3.5 rounded-2xl", isDarkMode ? "bg-blue-500/20 text-blue-400" : "bg-blue-100 text-blue-600")}>
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <h2 className={cn("text-xl font-bold tracking-tight", isDarkMode ? "text-white" : "text-slate-900")}>{title}</h2>
        <p className={cn("text-sm font-medium mt-1", isDarkMode ? "text-slate-400" : "text-slate-500")}>{subtitle}</p>
      </div>
    </div>
  );

  return (
    <div className="w-full space-y-8 animate-[fadeIn_0.5s_ease-out]">
      <div className="flex items-center gap-4">
        <Link to="/tasks" className={cn("p-3 rounded-2xl transition-all duration-300 shadow-sm hover:-translate-y-0.5", isDarkMode ? "bg-slate-800 hover:bg-slate-700 text-slate-200" : "bg-white border border-slate-200 hover:bg-slate-50 text-slate-700")}>
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className={cn("text-4xl font-extrabold tracking-tight", isDarkMode ? "text-white" : "text-slate-900")}>Review Task</h1>
          <p className={cn("mt-2 font-medium", isDarkMode ? "text-slate-400" : "text-slate-500")}>
            Review the details below and assign the task to proceed.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Read-Only Details */}
        <div className="lg:col-span-2 space-y-8">
          <div className={cn("p-8 rounded-3xl border shadow-sm transition-all duration-300", isDarkMode ? "bg-slate-800/40 border-slate-700/50" : "bg-white border-slate-200")}>
            <SectionHeader icon={Briefcase} title="Core Details" subtitle="Basic information and categorization." />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="md:col-span-2">
                <label className={labelClasses}>Task Title</label>
                <div className={cn(inputClasses, "bg-slate-100 dark:bg-slate-800/80")}>{taskToEdit.title}</div>
              </div>
              <div>
                <label className={labelClasses}>Category</label>
                <div className={cn(inputClasses, "bg-slate-100 dark:bg-slate-800/80")}>{taskToEdit.category}</div>
              </div>
              <div>
                <label className={labelClasses}>Sub Category</label>
                <div className={cn(inputClasses, "bg-slate-100 dark:bg-slate-800/80")}>{taskToEdit.subCategory}</div>
              </div>
              <div>
                <label className={labelClasses}>Assigned By</label>
                <div className={cn(inputClasses, "bg-slate-100 dark:bg-slate-800/80")}>{taskToEdit.assignedBy}</div>
              </div>
              <div>
                <label className={labelClasses}>Review Requested To</label>
                <div className={cn(inputClasses, "bg-slate-100 dark:bg-slate-800/80")}>{taskToEdit.reviewTo}</div>
              </div>
            </div>
          </div>

          <div className={cn("p-8 rounded-3xl border shadow-sm transition-all duration-300", isDarkMode ? "bg-slate-800/40 border-slate-700/50" : "bg-white border-slate-200")}>
            <SectionHeader icon={Calendar} title="Scheduling & Status" subtitle="Priority, deadlines and progress tracking." />
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div>
                <label className={labelClasses}>Priority</label>
                <div className={cn(inputClasses, "bg-slate-100 dark:bg-slate-800/80")}>{taskToEdit.priority}</div>
              </div>
              <div>
                <label className={labelClasses}>Due Date</label>
                <div className={cn(inputClasses, "bg-slate-100 dark:bg-slate-800/80")}>{taskToEdit.dueDate}</div>
              </div>
              <div>
                <label className={labelClasses}>Current Status</label>
                <div className={cn(inputClasses, "bg-slate-100 dark:bg-slate-800/80 text-amber-600 dark:text-amber-400")}>{taskToEdit.status}</div>
              </div>
            </div>
          </div>
          
          <div className={cn("p-8 rounded-3xl border shadow-sm transition-all duration-300", isDarkMode ? "bg-slate-800/40 border-slate-700/50" : "bg-white border-slate-200")}>
            <SectionHeader icon={AlignLeft} title="Additional Details" subtitle="Detailed descriptions and internal notes." />
            
            <div className="space-y-8">
              <div>
                <label className={labelClasses}>Description</label>
                <div className={cn(inputClasses, "bg-slate-100 dark:bg-slate-800/80 whitespace-pre-wrap min-h-[100px]")}>{taskToEdit.description || 'No description provided.'}</div>
              </div>
              <div>
                <label className={labelClasses}>Notes / Additional Context</label>
                <div className={cn(inputClasses, "bg-slate-100 dark:bg-slate-800/80 whitespace-pre-wrap min-h-[80px]")}>{taskToEdit.notes || 'No notes provided.'}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Approval Action */}
        <div className="lg:col-span-1">
          <div className={cn("p-8 rounded-3xl border shadow-sm transition-all duration-300 sticky top-8", isDarkMode ? "bg-slate-800/60 border-slate-700/50" : "bg-white border-slate-200")}>
            <SectionHeader icon={User} title="Approval & Assignment" subtitle="Assign the task to approve it." />
            
            <div className="space-y-6">
              <div>
                <label className={labelClasses}>Assignee <span className="text-rose-500">*</span></label>
                <select 
                  value={assignee}
                  onChange={(e) => setAssignee(e.target.value)}
                  className={cn(inputClasses, "appearance-none cursor-pointer border-blue-400 bg-blue-50/50 dark:bg-blue-900/20")}
                >
                  <option value="">Select Assignee</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.name}>{emp.name}</option>
                  ))}
                </select>
                <p className={cn("text-xs mt-3", isDarkMode ? "text-slate-400" : "text-slate-500")}>
                  Selecting an assignee and clicking Approve will change the status to <strong className="text-emerald-500">Open</strong> automatically.
                </p>
              </div>

              <div className="pt-4">
                <button 
                  onClick={handleApprove}
                  className="w-full flex justify-center items-center gap-2 px-6 py-4 rounded-xl font-bold bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white transition-all duration-300 shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50 hover:-translate-y-0.5"
                >
                  <CheckCircle2 className="w-5 h-5" /> Approve & Assign
                </button>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
