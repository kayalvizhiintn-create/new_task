import React, { useEffect, useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { cn } from '../utils/cn';
import { ArrowLeft, Save, Briefcase, Calendar, AlignLeft, Plus, Trash2, AlertCircle } from 'lucide-react';
import { taskService } from '../services/taskService';
import { categoryService } from '../services/categoryService';
import { subcategoryService } from '../services/subcategoryService';
import { enumService } from '../services/enumService';
import { employeeService } from '../services/employeeService';

// Helper to extract id/name generically
const getItemId = (item) => {
  if (!item) return '';
  if (typeof item !== 'object') return item;
  return item.id || item._id || item.value || item.subcategoryId || item.subCategoryId || item.categoryId || item.taskId || item.roleId || item.priorityId || item.statusId || item.empId || JSON.stringify(item);
};

const getItemName = (item) => {
  if (!item) return '';
  if (typeof item !== 'object') return item;
  return item.name || item.title || item.value || item.categoryName || item.taskDesc || item.roleName || item.priorityName || item.statusName || item.subCategoryName || item.empName || item.employeeName || 'Unknown';
};

const ensureArray = (data) => {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  if (Array.isArray(data.data)) return data.data;
  if (Array.isArray(data.items)) return data.items;
  if (typeof data === 'object') {
    // Fallback if data is a dictionary like {"Events": ["Sub"]}
    return Object.keys(data).map(k => ({ id: k, name: k, value: k }));
  }
  return [];
};

export default function TaskForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isDarkMode, currentUser } = useStore();
  
  const isEditMode = Boolean(id);
  const [taskToEdit, setTaskToEdit] = useState(null);
  
  const [categories, setCategories] = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  const [priorities, setPriorities] = useState([]);
  const [statuses, setStatuses] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loadingForm, setLoadingForm] = useState(false);

  const { register, handleSubmit, watch, setValue, control, reset, formState: { errors } } = useForm();

  useEffect(() => {
    const loadDropdownData = async () => {
      try {
        const [cats, subs, pris, stats, emps] = await Promise.all([
          categoryService.getAllCategories().catch(() => []),
          subcategoryService.getAllSubcategories().catch(() => []),
          enumService.getPriorityDropdown().catch(() => []),
          enumService.getStatusDropdown().catch(() => []),
          employeeService.getAllEmployees().catch(() => [])
        ]);

        setCategories(ensureArray(cats));
        setSubCategories(ensureArray(subs));
        setPriorities(ensureArray(pris));
        setStatuses(ensureArray(stats));
        setEmployees(ensureArray(emps));
      } catch (error) {
        console.error("Error loading dropdown data", error);
      }
    };
    
    loadDropdownData();
  }, []);

  useEffect(() => {
    if (isEditMode) {
      const loadTask = async () => {
        try {
          const res = await taskService.getTaskById(id);
          const task = res?.data || res;
          if (task) {
            setTaskToEdit(task);
            reset({
              title: task.taskUid || task.title || '',
              category: String(task.categoryId || task.category || ''),
              subCategory: String(task.subCategoryId || task.subCategory || ''),
              assignedBy: String(task.assignBy || task.assignedBy || currentUser?.name || ''),
              reviewTo: String(task.reviewTo || ''),
              assignedTo: String(task.assignedTo || ''),
              priority: String(task.priority || ''),
              dueDate: task.dueDate || '',
              status: String(task.status || ''),
              description: task.taskDesc || task.description || '',
              notes: task.notes || ''
            });
          }
        } catch (error) {
          console.error("Error fetching task", error);
        }
      };
      loadTask();
    } else {
      reset({
        title: '',
        category: '',
        subCategory: '',
        assignedBy: currentUser?.name || '',
        reviewTo: '',
        assignedTo: '',
        priority: '',
        dueDate: '',
        status: '',
        description: '',
        notes: ''
      });
    }
  }, [isEditMode, id, currentUser, reset]);

  const selectedCategory = watch('category');

  useEffect(() => {
    if (!isEditMode || (isEditMode && selectedCategory !== String(taskToEdit?.categoryId || taskToEdit?.category))) {
      // Don't auto-reset subcategory initially when editing, only when category changes later
      if (!isEditMode) setValue('subCategory', '');
    }
  }, [selectedCategory, isEditMode, setValue, taskToEdit]);

  const onSubmit = async (data) => {
    setLoadingForm(true);
    try {
      const payload = {
        taskId: isEditMode ? (parseInt(id, 10) || 0) : 0,
        taskUid: data.title,
        categoryId: parseInt(data.category, 10) || 0,
        subCategoryId: parseInt(data.subCategory, 10) || 0,
        assignBy: parseInt(data.assignedBy, 10) || 0, // assuming assignBy is employee ID or 0
        reviewTo: parseInt(data.reviewTo, 10) || 0,
        priority: parseInt(data.priority, 10) || 0,
        dueDate: data.dueDate,
        status: parseInt(data.status, 10) || 0,
        taskDesc: data.description || data.title,
        notes: data.notes || ""
      };

      if (isEditMode) {
        await taskService.updateTask(id, payload);
      } else {
        await taskService.createTask(payload);
      }
      navigate('/tasks');
    } catch (error) {
      console.error("Failed to save task", error);
    } finally {
      setLoadingForm(false);
    }
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
          <h1 className={cn("text-4xl font-extrabold tracking-tight", isDarkMode ? "text-white" : "text-slate-900")}>{isEditMode ? 'Edit Task' : 'Create New Task'}</h1>
          <p className={cn("mt-2 font-medium", isDarkMode ? "text-slate-400" : "text-slate-500")}>
            {isEditMode ? `Updating task ${id}` : 'Provide comprehensive details for the new enterprise task.'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        
        {/* Core Details Section */}
        <div className={cn("p-8 rounded-3xl border shadow-sm transition-all duration-300", isDarkMode ? "bg-slate-800/40 border-slate-700/50" : "bg-white border-slate-200")}>
          <SectionHeader icon={Briefcase} title="Core Details" subtitle="Basic information and categorization." />
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <label className={labelClasses}>Task Title / UID <span className="text-rose-500">*</span></label>
              <input 
                {...register('title', { required: 'Task title is required' })} 
                className={cn(inputClasses, errors.title && "border-rose-500")} 
                placeholder="Enter a descriptive task title or UID" 
              />
              {errors.title && <p className="text-rose-500 text-sm font-semibold mt-2">{errors.title.message}</p>}
            </div>

            <div>
              <label className={labelClasses}>Category <span className="text-rose-500">*</span></label>
              <select 
                {...register('category', { required: 'Category is required' })} 
                className={cn(inputClasses, "appearance-none cursor-pointer", errors.category && "border-rose-500")}
              >
                <option value="">Select Category</option>
                {categories.map(cat => (
                  <option key={getItemId(cat)} value={getItemId(cat)}>{getItemName(cat)}</option>
                ))}
              </select>
              {errors.category && <p className="text-rose-500 text-sm font-semibold mt-2">{errors.category.message}</p>}
            </div>

            <div>
              <label className={labelClasses}>Sub Category <span className="text-rose-500">*</span></label>
              <select 
                {...register('subCategory', { required: 'Sub Category is required' })} 
                className={cn(inputClasses, "appearance-none cursor-pointer", errors.subCategory && "border-rose-500")}
                disabled={!selectedCategory}
              >
                <option value="">Select Sub Category</option>
                {selectedCategory && subCategories
                  .filter(sub => {
                    const subCatIdStr = String(sub.categoryId || sub.category_id || sub.category?.id || sub.category?._id || sub.category || '');
                    return subCatIdStr === String(selectedCategory);
                  })
                  .map(sub => (
                    <option key={getItemId(sub)} value={getItemId(sub)}>{getItemName(sub)}</option>
                ))}
              </select>
              {errors.subCategory && <p className="text-rose-500 text-sm font-semibold mt-2">{errors.subCategory.message}</p>}
            </div>

            <div>
              <label className={labelClasses}>Assigned By (Optional)</label>
              <select 
                {...register('assignedBy')} 
                className={cn(inputClasses, "appearance-none cursor-pointer")}
              >
                <option value="">Select Assigner</option>
                {employees.map(emp => (
                  <option key={getItemId(emp)} value={getItemId(emp)}>{getItemName(emp)}</option>
                ))}
              </select>
            </div>

            <div>
              <label className={labelClasses}>Review To (Optional)</label>
              <select 
                {...register('reviewTo')} 
                className={cn(inputClasses, "appearance-none cursor-pointer")}
              >
                <option value="">Select Reviewer</option>
                {employees.map(emp => (
                  <option key={getItemId(emp)} value={getItemId(emp)}>{getItemName(emp)}</option>
                ))}
              </select>
            </div>

            {isEditMode && (
              <div>
                <label className={labelClasses}>Assigned To (Optional)</label>
                <select 
                  {...register('assignedTo')} 
                  className={cn(inputClasses, "appearance-none cursor-pointer")}
                >
                  <option value="">Select Assignee</option>
                  {employees.map(emp => (
                    <option key={getItemId(emp)} value={getItemId(emp)}>{getItemName(emp)}</option>
                  ))}
                </select>
              </div>
            )}

          </div>
        </div>

        {/* Scheduling & Status Section */}
        <div className={cn("p-8 rounded-3xl border shadow-sm transition-all duration-300", isDarkMode ? "bg-slate-800/40 border-slate-700/50" : "bg-white border-slate-200")}>
          <SectionHeader icon={Calendar} title="Scheduling & Status" subtitle="Priority, deadlines and progress tracking." />
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <label className={labelClasses}>Priority</label>
              <select {...register('priority')} className={cn(inputClasses, "appearance-none cursor-pointer")}>
                <option value="">Select Priority</option>
                {priorities.map(p => <option key={getItemId(p)} value={getItemId(p)}>{getItemName(p)}</option>)}
              </select>
            </div>

            <div>
              <label className={labelClasses}>Due Date <span className="text-rose-500">*</span></label>
              <input 
                type="date"
                {...register('dueDate', { required: 'Due Date is mandatory' })} 
                className={cn(inputClasses, "cursor-pointer", errors.dueDate && "border-rose-500")} 
              />
              {errors.dueDate && <p className="text-rose-500 text-sm font-semibold mt-2">{errors.dueDate.message}</p>}
            </div>

            <div>
              <label className={labelClasses}>Status <span className="text-rose-500">*</span></label>
              <select 
                {...register('status', { required: 'Status is mandatory' })} 
                className={cn(inputClasses, "appearance-none cursor-pointer", errors.status && "border-rose-500")}
              >
                <option value="">Select Status</option>
                {statuses.map(s => <option key={getItemId(s)} value={getItemId(s)}>{getItemName(s)}</option>)}
              </select>
              {errors.status && <p className="text-rose-500 text-sm font-semibold mt-2">{errors.status.message}</p>}
            </div>
          </div>
        </div>

        {/* Additional Details Section */}
        <div className={cn("p-8 rounded-3xl border shadow-sm transition-all duration-300", isDarkMode ? "bg-slate-800/40 border-slate-700/50" : "bg-white border-slate-200")}>
          <SectionHeader icon={AlignLeft} title="Additional Details" subtitle="Detailed descriptions and internal notes." />
          
          <div className="space-y-8">
            <div>
              <label className={labelClasses}>Task Description</label>
              <textarea 
                {...register('description')} 
                rows="4" 
                className={cn(inputClasses, "resize-y")} 
                placeholder="Provide a detailed description of the task..." 
              />
            </div>

            <div>
              <label className={labelClasses}>Notes / Additional Context</label>
              <textarea 
                {...register('notes')} 
                rows="2" 
                className={cn(inputClasses, "resize-y")} 
                placeholder="Any internal notes, links, or context..." 
              />
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div className={cn("flex items-center justify-end gap-4 mt-8 p-6 rounded-3xl border shadow-sm",
          isDarkMode ? "bg-slate-800/40 border-slate-700/50" : "bg-white border-slate-200"
        )}>
          <button 
            type="button" 
            onClick={() => navigate('/tasks')}
            className={cn("px-8 py-3.5 rounded-xl font-bold transition-all duration-300 border",
              isDarkMode ? "bg-slate-800/50 border-slate-700 hover:bg-slate-700 text-slate-300" : "bg-white border-slate-300 hover:bg-slate-50 text-slate-700 shadow-sm"
            )}
          >
            Cancel
          </button>
          <button 
            type="submit" 
            disabled={loadingForm}
            className="flex items-center gap-2 px-10 py-3.5 rounded-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white transition-all duration-300 shadow-lg shadow-blue-600/30 hover:shadow-blue-600/50 hover:-translate-y-0.5 disabled:opacity-50"
          >
            <Save className="w-5 h-5" /> {loadingForm ? 'Saving...' : (isEditMode ? 'Save Changes' : 'Create Task')}
          </button>
        </div>
        
      </form>
    </div>
  );
}
