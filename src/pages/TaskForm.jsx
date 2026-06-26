import React, { useEffect, useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { cn } from '../utils/cn';
import { ArrowLeft, Save, Briefcase, Calendar, AlignLeft, Plus, Trash2, AlertCircle, Shield } from 'lucide-react';
import { taskService } from '../services/taskService';
import { categoryService } from '../services/categoryService';
import { subcategoryService } from '../services/subcategoryService';
import { enumService } from '../services/enumService';
import { employeeService } from '../services/employeeService';
import Swal from 'sweetalert2';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { validateEmail, validateMobile } from '../utils/validation';

// Helper to extract id/name generically
const getItemId = (item) => {
  if (!item) return '';
  if (typeof item !== 'object') return item;
  return item.employeeId || item.id || item._id || item.value || item.subcategoryId || item.subCategoryId || item.categoryId || item.taskId || item.roleId || item.priorityId || item.statusId || item.empId || JSON.stringify(item);
};

const getItemName = (item) => {
  if (!item) return '';
  if (typeof item !== 'object') return item;
  return item.employeeName || item.empName || item.name || item.title || item.value || item.categoryName || item.taskDesc || item.roleName || item.priorityName || item.statusName || item.subCategoryName || 'Unknown';
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
  const { isDarkMode, currentUser, userPrivileges } = useStore();
  
  const isEditMode = Boolean(id);
  const [taskToEdit, setTaskToEdit] = useState(null);
  const [isLoadingData, setIsLoadingData] = useState(true);

  
  const [categories, setCategories] = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  const [priorities, setPriorities] = useState([]);
  const [statuses, setStatuses] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loadingForm, setLoadingForm] = useState(false);
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [showAddSubCategory, setShowAddSubCategory] = useState(false);
  const [newSubCategoryName, setNewSubCategoryName] = useState('');
  const { register, handleSubmit, watch, setValue, control, reset, formState: { errors, isDirty } } = useForm();
  
  const { fields: extraMembers, append: appendMember, remove: removeMember } = useFieldArray({
    control,
    name: "visitorDetails.extraMembers"
  });

  useEffect(() => {
    const loadAllData = async () => {
      setIsLoadingData(true);
      try {
        // 1. Load dropdown data first
        const [cats, subs, pris, stats, emps] = await Promise.all([
          categoryService.getAllCategories().catch(() => []),
          subcategoryService.getAllSubcategories().catch(() => []),
          enumService.getPriorityDropdown().catch(() => []),
          enumService.getStatusDropdown().catch(() => []),
          employeeService.getAllEmployees().catch(() => [])
        ]);

        const categoriesData = ensureArray(cats);
        const subCategoriesData = ensureArray(subs);
        const prioritiesData = ensureArray(pris);
        const statusesData = ensureArray(stats);
        const employeesData = ensureArray(emps);

        setCategories(categoriesData);
        setSubCategories(subCategoriesData);
        setPriorities(prioritiesData);
        setStatuses(statusesData);
        setEmployees(employeesData);

        const loggedInUserId = currentUser?.employeeId || currentUser?.empId || currentUser?.id || '';

        // 2. Load task data if in edit mode
        if (isEditMode) {
          const res = await taskService.getTaskById(id);
          const task = Array.isArray(res?.data) ? res.data[0] : (Array.isArray(res) ? res[0] : (res?.data || res));
          if (task) {
            setTaskToEdit(task);
            const savedDraft = localStorage.getItem(`draftTaskForm_edit_${id}`);
            if (savedDraft) {
              try {
                reset(JSON.parse(savedDraft));
              } catch(e) {
                console.error("Failed to parse draft edit form", e);
              }
            } else {
              reset({
                title: task.taskDesc || '',
                category: task.categoryId !== undefined && task.categoryId !== null ? String(task.categoryId) : String(task.category || ''),
                subCategory: task.subCategoryId !== undefined && task.subCategoryId !== null ? String(task.subCategoryId) : String(task.subCategory || ''),
                assignedBy: task.assignBy !== undefined && task.assignBy !== null ? String(task.assignBy) : String(task.assignedBy || loggedInUserId),
                assignedTo: task.assignTo !== undefined && task.assignTo !== null ? String(task.assignTo) : String(task.assignedTo || ''),
                priority: task.priority !== undefined && task.priority !== null ? String(task.priority) : '',
                dueDate: task.dueDate || '',
                status: task.status !== undefined && task.status !== null ? String(task.status) : '2',
                description: task.notes || '',
                notes: task.notes || '',
                referrerDetails: task.referrerDetails || {},
                meetingPersonDetails: task.meetingPersonDetails || {},
                visitorDetails: task.visitorDetails || { extraMembers: [] }
              });
            }
          }
        } else {
          // New task mode
          const savedDraft = localStorage.getItem('draftTaskForm');
          if (savedDraft) {
            try {
              reset(JSON.parse(savedDraft));
            } catch(e) {
              console.error("Failed to parse draft form", e);
            }
          } else {
            reset({
              title: '',
              category: '',
              subCategory: '',
              assignedBy: String(loggedInUserId),
              assignedTo: '',
              priority: '',
              dueDate: '',
              status: '2',
              description: '',
              notes: '',
              referrerDetails: {},
              meetingPersonDetails: {},
              visitorDetails: { extraMembers: [] }
            });
          }
        }
      } catch (error) {
        console.error("Error loading form data", error);
      } finally {
        setIsLoadingData(false);
      }
    };
    
    loadAllData();
  }, [isEditMode, id, currentUser, reset]);

  const formData = watch();
  
  useEffect(() => {
    if (!isLoadingData && isDirty && formData && Object.keys(formData).length > 0) {
      if (isEditMode && id) {
        localStorage.setItem(`draftTaskForm_edit_${id}`, JSON.stringify(formData));
      } else if (!isEditMode) {
        localStorage.setItem('draftTaskForm', JSON.stringify(formData));
      }
    }
  }, [formData, isEditMode, id, isDirty, isLoadingData]);

  const selectedCategory = watch('category');

  const selectedCategoryObj = categories.find(c => String(getItemId(c)) === String(selectedCategory));
  const categoryName = getItemName(selectedCategoryObj);
  
  const selectedSubCategoryObj = subCategories.find(s => String(getItemId(s)) === String(watch('subCategory')));
  const subCategoryName = getItemName(selectedSubCategoryObj);

  const isVisits = categoryName === 'Visits';
  const isInternalOrExternal = isVisits && (subCategoryName === 'Internal' || subCategoryName === 'External');

  const getAssignedByName = () => {
    if (isEditMode && taskToEdit) {
      const assignById = taskToEdit.assignBy || taskToEdit.assignedBy;
      const emp = employees.find(e => String(e.employeeId || e.id) === String(assignById));
      return emp ? (emp.employeeName || emp.name) : (taskToEdit.assignByName || taskToEdit.assignedBy || '');
    }
    return currentUser?.name || '';
  };



  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) return;
    if (newCategoryName.includes('_')) {
      Swal.fire({ title: 'Error', text: 'Underscores (_) are not allowed. Please use hyphens (-) instead.', icon: 'error' });
      return;
    }
    try {
      await categoryService.createCategory({ categoryId: 0, categoryName: newCategoryName.trim() });
      const cats = await categoryService.getAllCategories();
      setCategories(ensureArray(cats));
      setShowAddCategory(false);
      setNewCategoryName('');
      Swal.fire({ title: 'Success', text: 'Category added!', icon: 'success', timer: 1500, showConfirmButton: false });
    } catch (error) {
      console.error("Failed to add category", error);
      Swal.fire({ title: 'Error', text: 'Failed to add category', icon: 'error' });
    }
  };

  const handleAddSubCategory = async () => {
    if (!newSubCategoryName.trim() || !selectedCategory) return;
    if (newSubCategoryName.includes('_')) {
      Swal.fire({ title: 'Error', text: 'Underscores (_) are not allowed. Please use hyphens (-) instead.', icon: 'error' });
      return;
    }
    try {
      await subcategoryService.createSubcategory({ 
        subCategoryId: 0, 
        categoryId: parseInt(selectedCategory, 10), 
        subCategoryName: newSubCategoryName.trim() 
      });
      const subs = await subcategoryService.getAllSubcategories();
      setSubCategories(ensureArray(subs));
      setShowAddSubCategory(false);
      setNewSubCategoryName('');
      Swal.fire({ title: 'Success', text: 'Sub Category added!', icon: 'success', timer: 1500, showConfirmButton: false });
    } catch (error) {
      console.error("Failed to add subcategory", error);
      Swal.fire({ title: 'Error', text: 'Failed to add subcategory', icon: 'error' });
    }
  };

  const onSubmit = async (data) => {
    setLoadingForm(true);
    try {
      const payload = {
        taskId: isEditMode ? (parseInt(id, 10) || 0) : 0,
        taskUid: isEditMode ? taskToEdit.taskUid : "",
        categoryId: parseInt(data.category, 10) || 0,
        subCategoryId: parseInt(data.subCategory, 10) || 0,
        assignBy: parseInt(data.assignedBy, 10) || 0, // assuming assignBy is employee ID or 0
        assignTo: parseInt(data.assignedTo, 10) || 0,
        priority: parseInt(data.priority, 10) || 0,
        dueDate: data.dueDate,
        status: parseInt(data.status, 10) || 0,
        taskDesc: data.title?.trim(),
        notes: data.notes || data.description || ""
      };

      if (isInternalOrExternal) {
        payload.referrerDetails = {
          type: subCategoryName,
          name: data.referrerDetails?.name,
          description: data.referrerDetails?.description || ""
        };
        payload.meetingPersonDetails = {
          name: data.meetingPersonDetails?.name,
          description: data.meetingPersonDetails?.description || ""
        };
        payload.visitorDetails = {
          expectedCount: data.visitorDetails?.expectedCount ? parseInt(data.visitorDetails.expectedCount, 10) : null,
          date: data.visitorDetails?.date,
          name: data.visitorDetails?.name?.trim() || null,
          email: data.visitorDetails?.email?.trim() || null,
          mobile: data.visitorDetails?.mobile?.trim() || null,
          company: data.visitorDetails?.company?.trim() || null,
          extraMembers: (data.visitorDetails?.extraMembers || []).map(m => ({
            name: m.name?.trim() || null,
            role: m.role?.trim() || null,
            company: m.company?.trim() || null,
            email: m.email?.trim() || null,
            mobile: m.mobile?.trim() || null
          }))
        };
      }

      if (isEditMode) {
        await taskService.updateTask(id, payload);
        localStorage.removeItem(`draftTaskForm_edit_${id}`);
        Swal.fire({
          title: 'Success!',
          text: 'Task updated successfully.',
          icon: 'success',
          timer: 2000,
          showConfirmButton: false
        });
      } else {
        await taskService.createTask(payload);
        localStorage.removeItem('draftTaskForm');
        Swal.fire({
          title: 'Success!',
          text: 'Task created successfully.',
          icon: 'success',
          timer: 2000,
          showConfirmButton: false
        });
      }
      navigate('/tasks');
    } catch (error) {
      console.error("Failed to save task", error);
      const errorMsg = error.response?.data?.message || error.message || "An error occurred while saving the task.";
      Swal.fire({
        title: 'Error Saving Task',
        text: errorMsg,
        icon: 'error',
        confirmButtonText: 'OK'
      });
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

  const taskPermissions = userPrivileges['task list'] || { canView: 0, canCreate: 0, canUpdate: 0, canDelete: 0 };
  const newTaskPermissions = userPrivileges['new task'] || { canView: 0, canCreate: 0, canUpdate: 0, canDelete: 0 };
  const isAdmin = currentUser?.role?.toLowerCase() === 'admin' || currentUser?.role?.toLowerCase() === 'super admin';
  const canAccess = isAdmin || (Object.keys(userPrivileges).length === 0) || (
    isEditMode ? taskPermissions.canUpdate === 1 : (taskPermissions.canCreate === 1 && newTaskPermissions.canCreate === 1 && newTaskPermissions.canView === 1)
  );

  // 30-minute edit window check for non-admins (when task data is loaded in edit mode)
  const isEditWindowExpired = (() => {
    if (!isEditMode || isAdmin || !taskToEdit) return false;
    const createdAt = taskToEdit.createdTime || taskToEdit.createdAt || taskToEdit.CreatedTime;
    if (!createdAt) return false;

    // Safely parse the ISO date to force UTC interpretation if no offset is present
    const parseUtcDate = (dateStr) => {
      if (!dateStr) return new Date();
      if (typeof dateStr === 'string' && !dateStr.endsWith('Z') && !dateStr.includes('+') && !dateStr.includes('-')) {
        return new Date(dateStr + 'Z');
      }
      return new Date(dateStr);
    };

    const minutesSince = (Date.now() - parseUtcDate(createdAt).getTime()) / 60000;
    return minutesSince > 30;
  })();

  if (isLoadingData) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center min-h-[400px] animate-[fadeIn_0.5s_ease-out]">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className={cn("text-sm font-medium", isDarkMode ? "text-slate-400" : "text-slate-500")}>Loading task details...</p>
      </div>
    );
  }

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
        <Link to="/tasks" className="mt-6 px-6 py-2.5 rounded-xl font-bold bg-blue-600 hover:bg-blue-700 text-white transition-all duration-300 shadow-sm hover:shadow">
          Back to Task List
        </Link>
      </div>
    );
  }

  if (isEditWindowExpired) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center min-h-[400px] animate-[fadeIn_0.5s_ease-out]">
        <div className="p-4 rounded-full bg-amber-500/10 text-amber-500 mb-4">
          <AlertCircle className="w-12 h-12" />
        </div>
        <h2 className={cn("text-2xl font-bold tracking-tight", isDarkMode ? "text-white" : "text-slate-900")}>Edit Window Expired</h2>
        <p className={cn("text-sm font-medium mt-2 max-w-sm", isDarkMode ? "text-slate-400" : "text-slate-500")}>
          Tasks can only be edited within <span className="font-bold text-amber-500">30 minutes</span> of creation. This task is no longer editable. Please contact an Admin if changes are required.
        </p>
        <Link to="/tasks" className="mt-6 px-6 py-2.5 rounded-xl font-bold bg-blue-600 hover:bg-blue-700 text-white transition-all duration-300 shadow-sm hover:shadow">
          Back to Task List
        </Link>
      </div>
    );
  }

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
            <div className={cn(isEditMode ? "md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-8" : "md:col-span-2")}>
              <div>
                <label className={labelClasses}>Task Title <span className="text-rose-500">*</span></label>
                <input 
                  {...register('title', { 
                    required: 'Task title is required',
                    validate: value => !value.includes('_') || 'Underscores (_) are not allowed. Please use hyphens (-) instead.'
                  })} 
                  className={cn(inputClasses, errors.title && "border-rose-500")} 
                  placeholder="Enter a descriptive task title" 
                />
                {errors.title && <p className="text-rose-500 text-sm font-semibold mt-2">{errors.title.message}</p>}
              </div>

              {isEditMode && (
                <div>
                  <label className={labelClasses}>Task UID</label>
                  <input 
                    type="text" 
                    value={taskToEdit?.taskUid || ''} 
                    readOnly 
                    className={cn(inputClasses, "bg-slate-100/50 dark:bg-slate-900/30 cursor-not-allowed opacity-80")} 
                  />
                </div>
              )}
            </div>

            <div>
              <label className={cn("block text-sm font-bold tracking-wide mb-2", isDarkMode ? "text-slate-300" : "text-slate-700")}>Category <span className="text-rose-500">*</span></label>
              <div className="relative">
                <select 
                  {...register('category', { 
                    required: 'Category is required',
                    onChange: () => {
                      setValue('subCategory', '');
                    }
                  })} 
                  className={cn(inputClasses, "appearance-none cursor-pointer pr-10", errors.category && "border-rose-500")}
                >
                  <option value="">Select Category</option>
                  {categories.map(cat => (
                    <option key={getItemId(cat)} value={getItemId(cat)}>{getItemName(cat)}</option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => setShowAddCategory(true)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-md shadow-blue-500/30 hover:shadow-lg hover:shadow-blue-500/40 hover:scale-110 active:scale-95 transition-all duration-200"
                  title="Add new category"
                >
                  <Plus className="w-4 h-4 stroke-[2.5]" />
                </button>
              </div>
              {errors.category && <p className="text-rose-500 text-sm font-semibold mt-2">{errors.category.message}</p>}
            </div>

            <div>
              <label className={cn("block text-sm font-bold tracking-wide mb-2", isDarkMode ? "text-slate-300" : "text-slate-700")}>Sub Category <span className="text-rose-500">*</span></label>
              <div className="relative">
                <select 
                  {...register('subCategory', { required: 'Sub Category is required' })} 
                  className={cn(inputClasses, "appearance-none cursor-pointer pr-10", errors.subCategory && "border-rose-500")}
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
                <button
                  type="button"
                  disabled={!selectedCategory}
                  onClick={() => setShowAddSubCategory(true)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-md shadow-blue-500/30 hover:shadow-lg hover:shadow-blue-500/40 hover:scale-110 active:scale-95 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:shadow-none"
                  title="Add new sub category"
                >
                  <Plus className="w-4 h-4 stroke-[2.5]" />
                </button>
              </div>
              {errors.subCategory && <p className="text-rose-500 text-sm font-semibold mt-2">{errors.subCategory.message}</p>}
            </div>

            <div>
              <label className={labelClasses}>Created By <span className="text-rose-500">*</span></label>
              <select 
                {...register('assignedBy', { required: 'Created By is required' })} 
                className={cn(inputClasses, "appearance-none cursor-pointer", errors.assignedBy && "border-rose-500")}
              >
                <option value="">Select Creator</option>
                {employees.map(emp => (
                  <option key={getItemId(emp)} value={getItemId(emp)}>{getItemName(emp)}</option>
                ))}
              </select>
              {errors.assignedBy && <p className="text-rose-500 text-sm font-semibold mt-2">{errors.assignedBy.message}</p>}
            </div>

            <div>
              <label className={labelClasses}>Assigned To (Optional)</label>
              <select 
                {...register('assignedTo')} 
                className={cn(inputClasses, "appearance-none cursor-pointer")}
              >
                <option value="">Select Assignee</option>
                {employees.map(emp => {
                  const empId = String(getItemId(emp));
                  const loggedInId = String(currentUser?.employeeId || currentUser?.empId || currentUser?.id || '');
                  const isSelf = empId === loggedInId;
                  return (
                    <option key={empId} value={empId}>
                      {getItemName(emp)} {isSelf ? '(Self)' : ''}
                    </option>
                  );
                })}
              </select>
            </div>

          </div>
        </div>

        {isInternalOrExternal && (
          <div className={cn("p-8 rounded-3xl border shadow-sm transition-all duration-300", isDarkMode ? "bg-slate-800/40 border-slate-700/50" : "bg-white border-slate-200")}>
            <SectionHeader icon={Briefcase} title="Reference & Meeting Details" subtitle="Who referred them, and who are they meeting?" />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              {/* Referrer Details */}
              <div className="space-y-6">
                <h3 className={cn("text-lg font-bold border-b pb-3", isDarkMode ? "border-slate-700 text-slate-200" : "border-slate-200 text-slate-800")}>Referrer Details</h3>
                
                <div>
                  <label className={labelClasses}>Internal or External?</label>
                  <input 
                    type="text" 
                    value={subCategoryName === 'Internal' ? 'Internal Employee' : 'External'} 
                    readOnly 
                    className={cn(inputClasses, "bg-slate-100/50 dark:bg-slate-900/30 cursor-not-allowed opacity-80")} 
                  />
                  <input type="hidden" {...register('referrerDetails.type')} value={subCategoryName} />
                </div>

                <div>
                  <label className={labelClasses}>Referrer Name <span className="text-rose-500">*</span></label>
                  {subCategoryName === 'Internal' ? (
                    <select {...register('referrerDetails.name', { required: isInternalOrExternal })} className={cn(inputClasses, "appearance-none cursor-pointer", errors.referrerDetails?.name && "border-rose-500")}>
                      <option value="">Select Employee...</option>
                      {employees.map(emp => (
                        <option key={getItemId(emp)} value={getItemName(emp)}>{getItemName(emp)}</option>
                      ))}
                    </select>
                  ) : (
                    <input {...register('referrerDetails.name', { required: isInternalOrExternal })} className={cn(inputClasses, errors.referrerDetails?.name && "border-rose-500")} placeholder="Referrer Name" />
                  )}
                </div>

                <div>
                  <label className={labelClasses}>Description (Mobile, Email, Bio ID, Role, etc.)</label>
                  <textarea 
                    {...register('referrerDetails.description')} 
                    rows={4} 
                    className={cn(inputClasses, "resize-y min-h-[100px] py-3")} 
                    placeholder="Enter referrer details like Mobile, Email, Bio ID, Role, etc."
                  />
                </div>
              </div>

              {/* Referred To (Meeting Person) */}
              <div className="space-y-6">
                <h3 className={cn("text-lg font-bold border-b pb-3", isDarkMode ? "border-slate-700 text-slate-200" : "border-slate-200 text-slate-800")}>Referred To (Meeting Person)</h3>
                
                <div>
                  <label className={labelClasses}>Meeting With <span className="text-rose-500">*</span></label>
                  <select {...register('meetingPersonDetails.name', { required: isInternalOrExternal })} className={cn(inputClasses, "appearance-none cursor-pointer", errors.meetingPersonDetails?.name && "border-rose-500")}>
                    <option value="">Select Employee...</option>
                    {employees.map(emp => (
                      <option key={getItemId(emp)} value={getItemName(emp)}>{getItemName(emp)}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className={labelClasses}>Description (Mobile, Email, Bio ID, Role, etc.)</label>
                  <textarea 
                    {...register('meetingPersonDetails.description')} 
                    rows={4} 
                    className={cn(inputClasses, "resize-y min-h-[100px] py-3")} 
                    placeholder="Enter meeting person details like Mobile, Email, Bio ID, Role, etc."
                  />
                </div>
              </div>
            </div>

            {/* Visitor Details */}
            <div className="mt-12 pt-8 border-t dark:border-slate-700/50">
              <div className="flex items-center gap-4 mb-6">
                <div className={cn("p-3 rounded-2xl", isDarkMode ? "bg-blue-500/20 text-blue-400" : "bg-blue-100 text-blue-600")}>
                  <Briefcase className="w-5 h-5" />
                </div>
                <div>
                  <h3 className={cn("text-lg font-bold", isDarkMode ? "text-slate-200" : "text-slate-800")}>Visitor Details</h3>
                  <p className={cn("text-xs font-medium mt-1", isDarkMode ? "text-slate-400" : "text-slate-500")}>Information about the visitor.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className={labelClasses}>Expected Persons Count</label>
                  <input type="number" {...register('visitorDetails.expectedCount')} className={inputClasses} placeholder="e.g. 5" />
                </div>
                <div>
                  <label className={labelClasses}>Visitor Name</label>
                  <input {...register('visitorDetails.name')} className={inputClasses} placeholder="Name (Optional if unknown)" />
                </div>
                <div>
                  <label className={labelClasses}>Visitor Email <span className="text-rose-500">*</span></label>
                  <input 
                    type="email" 
                    {...register('visitorDetails.email', { 
                      required: 'Visitor email is required',
                      validate: (val) => validateEmail(val)
                    })} 
                    className={cn(inputClasses, errors.visitorDetails?.email && "border-rose-500")} 
                    placeholder="e.g. name@domain.com" 
                  />
                  {errors.visitorDetails?.email && <p className="text-rose-500 text-sm font-semibold mt-2">{errors.visitorDetails.email.message}</p>}
                </div>
                <div>
                  <label className={labelClasses}>Visitor Mobile <span className="text-rose-500">*</span></label>
                  <input 
                    {...register('visitorDetails.mobile', { 
                      required: 'Visitor mobile number is required',
                      validate: (val) => validateMobile(val)
                    })} 
                    className={cn(inputClasses, errors.visitorDetails?.mobile && "border-rose-500")} 
                    placeholder="e.g. 9876543210" 
                  />
                  {errors.visitorDetails?.mobile && <p className="text-rose-500 text-sm font-semibold mt-2">{errors.visitorDetails.mobile.message}</p>}
                </div>
                <div>
                  <label className={labelClasses}>Visitor Company</label>
                  <input {...register('visitorDetails.company')} className={inputClasses} placeholder="Company (Optional)" />
                </div>
                <div>
                  <label className={labelClasses}>Visit Date <span className="text-rose-500">*</span></label>
                  <div className="relative">
                    <DatePicker
                      selected={watch('visitorDetails.date') ? new Date(watch('visitorDetails.date')) : null}
                      onChange={(date) => {
                        setValue('visitorDetails.date', date ? date.toISOString().split('T')[0] : '', { shouldValidate: true });
                      }}
                      dateFormat="dd/MM/yyyy"
                      placeholderText="Select visit date"
                      className={cn(inputClasses, "cursor-pointer w-full", errors.visitorDetails?.date && "border-rose-500")}
                      wrapperClassName="w-full"
                      showMonthDropdown
                      showYearDropdown
                      dropdownMode="select"
                    />
                    <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  </div>
                  <input type="hidden" {...register('visitorDetails.date', { required: isInternalOrExternal })} />
                </div>
              </div>

              {/* Extra Members Array */}
              <div className="mt-8 pt-8 border-t dark:border-slate-700/50">
                <div className="flex items-center justify-between mb-6">
                  <h3 className={cn("text-lg font-bold", isDarkMode ? "text-slate-200" : "text-slate-800")}>Extra Members</h3>
                  <button type="button" onClick={() => appendMember({ name: '', role: '', company: '', email: '', mobile: '' })} className="px-4 py-2 bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400 font-bold text-sm rounded-xl hover:bg-blue-200 dark:hover:bg-blue-500/30 transition flex items-center gap-2">
                    <Plus className="w-4 h-4" /> Add Member
                  </button>
                </div>
                
                {extraMembers.length === 0 ? (
                  <p className="text-center text-sm font-medium text-slate-400 italic py-4">No extra members added.</p>
                ) : (
                  <div className="space-y-4">
                    {extraMembers.map((member, index) => (
                      <div key={member.id} className={cn("p-4 rounded-2xl border flex flex-col md:flex-row gap-4 items-start", isDarkMode ? "bg-slate-800/80 border-slate-700" : "bg-slate-50 border-slate-200")}>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4 flex-1 w-full">
                          <div className="w-full">
                            <input 
                              {...register(`visitorDetails.extraMembers.${index}.name`, { required: 'Name is required' })} 
                              placeholder="Name *" 
                              className={cn(inputClasses, errors.visitorDetails?.extraMembers?.[index]?.name && "border-rose-500")} 
                            />
                            {errors.visitorDetails?.extraMembers?.[index]?.name && <p className="text-rose-500 text-xs font-semibold mt-1">{errors.visitorDetails.extraMembers[index].name.message}</p>}
                          </div>
                          <div className="w-full">
                            <input {...register(`visitorDetails.extraMembers.${index}.role`)} placeholder="Role" className={inputClasses} />
                          </div>
                          <div className="w-full">
                            <input {...register(`visitorDetails.extraMembers.${index}.company`)} placeholder="Company" className={inputClasses} />
                          </div>
                          <div className="w-full">
                            <input 
                              {...register(`visitorDetails.extraMembers.${index}.email`, { 
                                required: 'Email is required',
                                validate: (val) => validateEmail(val)
                              })} 
                              placeholder="Email *" 
                              className={cn(inputClasses, errors.visitorDetails?.extraMembers?.[index]?.email && "border-rose-500")} 
                            />
                            {errors.visitorDetails?.extraMembers?.[index]?.email && <p className="text-rose-500 text-xs font-semibold mt-1">{errors.visitorDetails.extraMembers[index].email.message}</p>}
                          </div>
                          <div className="w-full">
                            <input 
                              {...register(`visitorDetails.extraMembers.${index}.mobile`, { 
                                required: 'Mobile is required',
                                validate: (val) => validateMobile(val)
                              })} 
                              placeholder="Mobile *" 
                              className={cn(inputClasses, errors.visitorDetails?.extraMembers?.[index]?.mobile && "border-rose-500")} 
                            />
                            {errors.visitorDetails?.extraMembers?.[index]?.mobile && <p className="text-rose-500 text-xs font-semibold mt-1">{errors.visitorDetails.extraMembers[index].mobile.message}</p>}
                          </div>
                        </div>
                        <button type="button" onClick={() => removeMember(index)} className="p-3.5 rounded-xl bg-rose-100 text-rose-600 hover:bg-rose-200 dark:bg-rose-500/20 dark:text-rose-400 dark:hover:bg-rose-500/30 transition self-end md:self-auto shrink-0">
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

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
              <div className="relative">
                <DatePicker
                  selected={watch('dueDate') ? new Date(watch('dueDate')) : null}
                  onChange={(date) => {
                    if (!date) { setValue('dueDate', '', { shouldValidate: true }); return; }
                    const today = new Date(); today.setHours(0,0,0,0);
                    if (date < today) {
                      Swal.fire({
                        title: 'Are you sure?',
                        text: 'You have selected a past date. Do you want to proceed?',
                        icon: 'warning',
                        showCancelButton: true,
                        confirmButtonColor: '#3085d6',
                        cancelButtonColor: '#d33',
                        confirmButtonText: 'Yes, proceed!'
                      }).then((res) => {
                        if (res.isConfirmed) {
                          setValue('dueDate', date.toISOString().split('T')[0], { shouldValidate: true });
                        }
                      });
                    } else {
                      setValue('dueDate', date.toISOString().split('T')[0], { shouldValidate: true });
                    }
                  }}
                  dateFormat="dd/MM/yyyy"
                  placeholderText="Select due date"
                  className={cn(inputClasses, "cursor-pointer w-full", errors.dueDate && "border-rose-500")}
                  wrapperClassName="w-full"
                  showMonthDropdown
                  showYearDropdown
                  dropdownMode="select"
                  calendarClassName={isDarkMode ? "dark-datepicker" : ""}
                />
                <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
              <input type="hidden" {...register('dueDate', { required: 'Due Date is mandatory' })} />
              {errors.dueDate && <p className="text-rose-500 text-sm font-semibold mt-2">{errors.dueDate.message}</p>}
            </div>

            <div>
              <label className={labelClasses}>Status</label>
              <input
                type="text"
                value={isEditMode && taskToEdit ? (taskToEdit.statusName || taskToEdit.status || 'New Task') : 'New Task'}
                readOnly
                className={cn(inputClasses, "bg-slate-100/50 dark:bg-slate-900/30 cursor-not-allowed opacity-80")}
              />
              <input
                type="hidden"
                {...register('status')}
              />
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
                {...register('description', {
                  validate: value => !value || !value.includes('_') || 'Underscores (_) are not allowed. Please use hyphens (-) instead.'
                })} 
                rows="4" 
                className={cn(inputClasses, "resize-y", errors.description && "border-rose-500")} 
                placeholder="Provide a detailed description of the task..." 
              />
              {errors.description && <p className="text-rose-500 text-sm font-semibold mt-2">{errors.description.message}</p>}
            </div>

            <div>
              <label className={labelClasses}>Notes / Additional Context</label>
              <textarea 
                {...register('notes', {
                  validate: value => !value || !value.includes('_') || 'Underscores (_) are not allowed. Please use hyphens (-) instead.'
                })} 
                rows="2" 
                className={cn(inputClasses, "resize-y", errors.notes && "border-rose-500")} 
                placeholder="Any internal notes, links, or context..." 
              />
              {errors.notes && <p className="text-rose-500 text-sm font-semibold mt-2">{errors.notes.message}</p>}
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div className={cn("flex items-center justify-end gap-4 mt-8 p-6 rounded-3xl border shadow-sm",
          isDarkMode ? "bg-slate-800/40 border-slate-700/50" : "bg-white border-slate-200"
        )}>
          <button 
            type="button" 
            onClick={() => {
              if (!isEditMode) localStorage.removeItem('draftTaskForm');
              navigate('/tasks');
            }}
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

      {/* Modals for Quick Add */}
      {showAddCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className={cn("p-6 rounded-2xl w-full max-w-sm shadow-xl", isDarkMode ? "bg-slate-800" : "bg-white")}>
            <h3 className={cn("text-lg font-bold mb-4", isDarkMode ? "text-white" : "text-slate-900")}>Add New Category</h3>
            <input 
              type="text" 
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              placeholder="Category Name"
              className={cn(inputClasses, "mb-6")}
              autoFocus
            />
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => { setShowAddCategory(false); setNewCategoryName(''); }} className={cn("px-4 py-2 font-bold rounded-lg transition-colors", isDarkMode ? "text-slate-300 hover:bg-slate-700" : "text-slate-600 hover:bg-slate-100")}>Cancel</button>
              <button type="button" onClick={handleAddCategory} className="px-4 py-2 font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors">Add</button>
            </div>
          </div>
        </div>
      )}

      {showAddSubCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className={cn("p-6 rounded-2xl w-full max-w-sm shadow-xl", isDarkMode ? "bg-slate-800" : "bg-white")}>
            <h3 className={cn("text-lg font-bold mb-4", isDarkMode ? "text-white" : "text-slate-900")}>Add New Sub Category</h3>
            <input 
              type="text" 
              value={newSubCategoryName}
              onChange={(e) => setNewSubCategoryName(e.target.value)}
              placeholder="Sub Category Name"
              className={cn(inputClasses, "mb-6")}
              autoFocus
            />
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => { setShowAddSubCategory(false); setNewSubCategoryName(''); }} className={cn("px-4 py-2 font-bold rounded-lg transition-colors", isDarkMode ? "text-slate-300 hover:bg-slate-700" : "text-slate-600 hover:bg-slate-100")}>Cancel</button>
              <button type="button" onClick={handleAddSubCategory} className="px-4 py-2 font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors">Add</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
