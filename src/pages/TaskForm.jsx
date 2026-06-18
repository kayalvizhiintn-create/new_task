import React, { useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { cn } from '../utils/cn';
import { ArrowLeft, Save, Briefcase, Calendar, AlignLeft, Plus, Trash2, AlertCircle } from 'lucide-react';

export default function TaskForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { tasks, employees, currentUser, addTask, updateTask, isDarkMode, categories, statuses, priorities } = useStore();
  
  const isEditMode = Boolean(id);
  const taskToEdit = isEditMode ? tasks.find(t => t.id === id) : null;

  const { register, handleSubmit, watch, setValue, control, formState: { errors } } = useForm({
    defaultValues: {
      title: taskToEdit?.title || '',
      category: taskToEdit?.category || '',
      subCategory: taskToEdit?.subCategory || '',
      assignedBy: taskToEdit?.assignedBy || currentUser?.name || '',
      reviewTo: taskToEdit?.reviewTo || '',
      assignedTo: taskToEdit?.assignedTo || '',
      priority: taskToEdit?.priority || 'Medium',
      dueDate: taskToEdit?.dueDate || '',
      status: taskToEdit?.status || 'New Task',
      stage: taskToEdit?.stage || 'Requirements',
      description: taskToEdit?.description || '',
      notes: taskToEdit?.notes || '',
      visitorName: taskToEdit?.visitorDetails?.name || '',
      visitorEmail: taskToEdit?.visitorDetails?.email || '',
      visitorMobile: taskToEdit?.visitorDetails?.mobile || '',
      visitorCompany: taskToEdit?.visitorDetails?.company || '',
      visitorDate: taskToEdit?.visitorDetails?.date || '',
      expectedCount: taskToEdit?.visitorDetails?.expectedCount || '',
      extraMembers: taskToEdit?.visitorDetails?.extraMembers || [],
      referrerType: taskToEdit?.referrerDetails?.type || 'Internal',
      referrerName: taskToEdit?.referrerDetails?.name || '',
      referrerCompany: taskToEdit?.referrerDetails?.company || '',
      referrerRole: taskToEdit?.referrerDetails?.role || '',
      referrerBioId: taskToEdit?.referrerDetails?.bioId || '',
      referrerEmail: taskToEdit?.referrerDetails?.email || '',
      referrerMobile: taskToEdit?.referrerDetails?.mobile || '',
      meetingPersonName: taskToEdit?.meetingPersonDetails?.name || '',
      meetingPersonRole: taskToEdit?.meetingPersonDetails?.role || '',
      meetingPersonBioId: taskToEdit?.meetingPersonDetails?.bioId || '',
      meetingPersonEmail: taskToEdit?.meetingPersonDetails?.email || '',
      meetingPersonMobile: taskToEdit?.meetingPersonDetails?.mobile || ''
    }
  });

  const selectedCategory = watch('category');
  const selectedSubCategory = watch('subCategory');
  const reviewToVal = watch('reviewTo');
  const referrerTypeVal = watch('referrerType');

  const { fields: extraMemberFields, append: appendExtraMember, remove: removeExtraMember } = useFieldArray({
    control,
    name: "extraMembers"
  });

  useEffect(() => {
    if (!isEditMode || (isEditMode && selectedCategory !== taskToEdit?.category)) {
      setValue('subCategory', '');
    }
  }, [selectedCategory, isEditMode, setValue, taskToEdit]);

  const onSubmit = (data) => {
    const finalData = {
      title: data.title,
      category: data.category,
      subCategory: data.subCategory,
      assignedBy: data.assignedBy,
      reviewTo: data.reviewTo,
      assignedTo: data.assignedTo,
      priority: data.priority,
      dueDate: data.dueDate,
      status: data.reviewTo && !isEditMode ? 'Open for review' : data.status,
      stage: (data.category === 'Development' && data.subCategory === 'Software Development') ? data.stage : undefined,
      description: data.description,
      notes: data.notes
    };

    if (data.category === 'Visits') {
      finalData.visitorDetails = {
        expectedCount: data.expectedCount,
        name: data.visitorName,
        email: data.visitorEmail,
        mobile: data.visitorMobile,
        company: data.visitorCompany,
        date: data.visitorDate,
        extraMembers: data.extraMembers || []
      };
      finalData.referrerDetails = {
        type: data.referrerType,
        name: data.referrerName,
        email: data.referrerEmail,
        mobile: data.referrerMobile,
        company: data.referrerType === 'External' ? data.referrerCompany : undefined,
        role: data.referrerType === 'Internal' ? data.referrerRole : undefined,
        bioId: data.referrerType === 'Internal' ? data.referrerBioId : undefined
      };
      finalData.meetingPersonDetails = {
        name: data.meetingPersonName,
        role: data.meetingPersonRole,
        bioId: data.meetingPersonBioId,
        email: data.meetingPersonEmail,
        mobile: data.meetingPersonMobile
      };
    }

    if (isEditMode) {
      updateTask(id, finalData);
    } else {
      addTask(finalData);
    }
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
              <label className={labelClasses}>Task Title <span className="text-rose-500">*</span></label>
              <input 
                {...register('title', { required: 'Task title is required' })} 
                className={cn(inputClasses, errors.title && "border-rose-500 focus:border-rose-500 focus:ring-rose-500/20")} 
                placeholder="Enter a descriptive task title" 
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
                {Object.keys(categories).map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
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
                {selectedCategory && categories[selectedCategory] && categories[selectedCategory].map(sub => (
                  <option key={sub} value={sub}>{sub}</option>
                ))}
              </select>
              {errors.subCategory && <p className="text-rose-500 text-sm font-semibold mt-2">{errors.subCategory.message}</p>}
            </div>

            <div>
              <label className={labelClasses}>Assigned By <span className="text-rose-500">*</span></label>
              <input 
                {...register('assignedBy', { required: 'Assigned By is required' })} 
                readOnly
                className={cn(inputClasses, "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 cursor-not-allowed")} 
              />
            </div>

            <div>
              <label className={labelClasses}>Review To</label>
              <select 
                {...register('reviewTo')} 
                className={cn(inputClasses, "appearance-none cursor-pointer")}
              >
                <option value="">Select Reviewer (Optional)</option>
                {employees.map(emp => (
                  <option key={emp.id} value={emp.name}>{emp.name}</option>
                ))}
              </select>
            </div>


          </div>
        </div>

        {selectedCategory === 'Visits' && (
          <div className={cn("p-8 rounded-3xl border shadow-sm transition-all duration-300", isDarkMode ? "bg-slate-800/40 border-slate-700/50" : "bg-white border-slate-200")}>
            
            {/* 1. Reference & Meeting Details */}
            <div>
              <SectionHeader icon={AlignLeft} title="Reference & Meeting Details" subtitle="Who referred them, and who are they meeting?" />
              
              <div className="flex flex-col lg:flex-row gap-8">
                {/* Left Side: Referrer */}
                <div className="flex-1 space-y-6">
                  <h3 className={cn("text-lg font-bold tracking-tight border-b pb-2", isDarkMode ? "text-slate-200 border-slate-700" : "text-slate-800 border-slate-200")}>Referrer Details</h3>
                  <div>
                    <label className={labelClasses}>Internal or External?</label>
                    <select {...register('referrerType')} className={cn(inputClasses, "appearance-none cursor-pointer w-full")}>
                      <option value="Internal">Internal Employee</option>
                      <option value="External">External Person</option>
                    </select>
                  </div>

                  <div>
                    <label className={labelClasses}>Referrer Name <span className="text-rose-500">*</span></label>
                    {referrerTypeVal === 'Internal' ? (
                      <select 
                        {...register('referrerName', { required: 'Name is required' })} 
                        className={cn(inputClasses, "appearance-none cursor-pointer", errors.referrerName && "border-rose-500")}
                        onChange={(e) => {
                          const emp = employees.find(emp => emp.name === e.target.value);
                          if (emp) {
                             setValue('referrerRole', emp.role);
                             setValue('referrerBioId', emp.bioId);
                             setValue('referrerEmail', emp.email);
                             setValue('referrerMobile', emp.mobile);
                          }
                        }}
                      >
                        <option value="">Select Employee...</option>
                        {employees.map(emp => <option key={emp.id} value={emp.name}>{emp.name}</option>)}
                      </select>
                    ) : (
                      <input {...register('referrerName', { required: 'Name is required' })} className={cn(inputClasses, errors.referrerName && "border-rose-500")} placeholder="Enter Name" />
                    )}
                  </div>

                  {referrerTypeVal === 'Internal' ? (
                    <>
                      <div>
                        <label className={labelClasses}>Role <span className="text-rose-500">*</span></label>
                        <input {...register('referrerRole', { required: 'Role is required' })} className={cn(inputClasses, errors.referrerRole && "border-rose-500")} />
                      </div>
                      <div>
                        <label className={labelClasses}>Bio ID <span className="text-rose-500">*</span></label>
                        <input {...register('referrerBioId', { required: 'Bio ID is required' })} className={cn(inputClasses, errors.referrerBioId && "border-rose-500")} />
                      </div>
                    </>
                  ) : (
                    <div>
                      <label className={labelClasses}>Company Name</label>
                      <input {...register('referrerCompany')} className={cn(inputClasses)} placeholder="Company Name" />
                    </div>
                  )}

                  <div>
                    <label className={labelClasses}>Email</label>
                    <input type="email" {...register('referrerEmail')} className={cn(inputClasses)} placeholder="Email (Optional)" />
                  </div>
                  <div>
                    <label className={labelClasses}>Mobile <span className="text-rose-500">*</span></label>
                    <input {...register('referrerMobile', { required: 'Mobile is required' })} className={cn(inputClasses, errors.referrerMobile && "border-rose-500")} />
                  </div>
                </div>

                {/* Vertical Divider */}
                <div className={cn("hidden lg:block w-px rounded-full", isDarkMode ? "bg-slate-700/50" : "bg-slate-200")}></div>
                {/* Horizontal Divider for mobile */}
                <div className={cn("block lg:hidden h-px w-full rounded-full my-4", isDarkMode ? "bg-slate-700/50" : "bg-slate-200")}></div>

                {/* Right Side: Meeting Person */}
                <div className="flex-1 space-y-6">
                  <h3 className={cn("text-lg font-bold tracking-tight border-b pb-2", isDarkMode ? "text-slate-200 border-slate-700" : "text-slate-800 border-slate-200")}>Referred To (Meeting Person)</h3>
                  
                  <div>
                    <label className={labelClasses}>Meeting With <span className="text-rose-500">*</span></label>
                    <select 
                      {...register('meetingPersonName', { required: 'Meeting person is required' })} 
                      className={cn(inputClasses, "appearance-none cursor-pointer", errors.meetingPersonName && "border-rose-500")}
                      onChange={(e) => {
                        const emp = employees.find(emp => emp.name === e.target.value);
                        if (emp) {
                           setValue('meetingPersonRole', emp.role);
                           setValue('meetingPersonBioId', emp.bioId);
                           setValue('meetingPersonEmail', emp.email);
                           setValue('meetingPersonMobile', emp.mobile);
                        }
                      }}
                    >
                      <option value="">Select Employee...</option>
                      {employees.map(emp => <option key={emp.id} value={emp.name}>{emp.name}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className={labelClasses}>Role <span className="text-rose-500">*</span></label>
                    <input {...register('meetingPersonRole', { required: 'Role is required' })} className={cn(inputClasses, errors.meetingPersonRole && "border-rose-500")} />
                  </div>
                  <div>
                    <label className={labelClasses}>Bio ID <span className="text-rose-500">*</span></label>
                    <input {...register('meetingPersonBioId', { required: 'Bio ID is required' })} className={cn(inputClasses, errors.meetingPersonBioId && "border-rose-500")} />
                  </div>
                  <div>
                    <label className={labelClasses}>Email</label>
                    <input type="email" {...register('meetingPersonEmail')} className={cn(inputClasses)} placeholder="Email (Optional)" />
                  </div>
                  <div>
                    <label className={labelClasses}>Mobile <span className="text-rose-500">*</span></label>
                    <input {...register('meetingPersonMobile', { required: 'Mobile is required' })} className={cn(inputClasses, errors.meetingPersonMobile && "border-rose-500")} />
                  </div>
                </div>
              </div>
            </div>

            {/* 2. Visitor Details */}
            <div className="mt-8 border-t border-slate-200 dark:border-slate-700/50 pt-8">
              <SectionHeader icon={Briefcase} title="Visitor Details" subtitle="Information about the visitor." />
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-8">
                <div>
                  <label className={labelClasses}>Expected Persons Count</label>
                  <input type="number" min="1" {...register('expectedCount')} className={cn(inputClasses)} placeholder="e.g. 5" />
                </div>
                <div>
                  <label className={labelClasses}>Visitor Name</label>
                  <input {...register('visitorName')} className={cn(inputClasses)} placeholder="Name (Optional if unknown)" />
                </div>
                <div>
                  <label className={labelClasses}>Visitor Email</label>
                  <input type="email" {...register('visitorEmail')} className={cn(inputClasses)} placeholder="Email (Optional)" />
                </div>
                <div>
                  <label className={labelClasses}>Visitor Mobile</label>
                  <input {...register('visitorMobile')} className={cn(inputClasses)} placeholder="Mobile (Optional)" />
                </div>
                <div>
                  <label className={labelClasses}>Visitor Company</label>
                  <input {...register('visitorCompany')} className={cn(inputClasses)} placeholder="Company (Optional)" />
                </div>
                <div>
                  <label className={labelClasses}>Visit Date <span className="text-rose-500">*</span></label>
                  <input type="date" {...register('visitorDate', { required: 'Visit date is required' })} className={cn(inputClasses, "cursor-pointer", errors.visitorDate && "border-rose-500")} />
                </div>
              </div>
            </div>

            {/* 3. Extra Members */}
            <div className="mt-8 border-t border-slate-200 dark:border-slate-700/50 pt-8">
              <div className="flex justify-between items-center mb-6">
                <h3 className={cn("text-lg font-bold tracking-tight", isDarkMode ? "text-slate-200" : "text-slate-800")}>Extra Members</h3>
                <button
                  type="button"
                  onClick={() => appendExtraMember({ name: '', email: '', mobile: '', company: '', role: '' })}
                  className="px-4 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 dark:bg-blue-500/20 dark:hover:bg-blue-500/30 dark:text-blue-400 rounded-lg font-bold text-sm transition-colors flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" /> Add Member
                </button>
              </div>
              <div className="space-y-4">
                {extraMemberFields.map((field, index) => (
                  <div key={field.id} className="flex gap-4 items-start flex-wrap">
                    <div className="flex-1 min-w-[150px]">
                      <input 
                        {...register(`extraMembers.${index}.name`, { required: 'Name is required' })} 
                        placeholder="Member Name"
                        className={cn(inputClasses, errors?.extraMembers?.[index]?.name && "border-rose-500")} 
                      />
                    </div>
                    <div className="flex-1 min-w-[150px]">
                      <input 
                        type="email"
                        {...register(`extraMembers.${index}.email`, { required: 'Email is required' })} 
                        placeholder="Member Email"
                        className={cn(inputClasses, errors?.extraMembers?.[index]?.email && "border-rose-500")} 
                      />
                    </div>
                    <div className="flex-1 min-w-[150px]">
                      <input 
                        {...register(`extraMembers.${index}.mobile`, { required: 'Mobile is required' })} 
                        placeholder="Member Mobile"
                        className={cn(inputClasses, errors?.extraMembers?.[index]?.mobile && "border-rose-500")} 
                      />
                    </div>
                    <div className="flex-1 min-w-[150px]">
                      <input 
                        {...register(`extraMembers.${index}.company`, { required: 'Company is required' })} 
                        placeholder="Company Name"
                        className={cn(inputClasses, errors?.extraMembers?.[index]?.company && "border-rose-500")} 
                      />
                    </div>
                    <div className="flex-1 min-w-[150px]">
                      <input 
                        {...register(`extraMembers.${index}.role`, { required: 'Role is required' })} 
                        placeholder="Role"
                        className={cn(inputClasses, errors?.extraMembers?.[index]?.role && "border-rose-500")} 
                      />
                    </div>
                    <button 
                      type="button" 
                      onClick={() => removeExtraMember(index)}
                      className="p-3 mt-0.5 text-rose-500 hover:bg-rose-500/10 rounded-xl transition-colors shrink-0"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                ))}
                {extraMemberFields.length === 0 && (
                  <p className={cn("text-sm font-medium italic text-center py-4", isDarkMode ? "text-slate-500" : "text-slate-400")}>No extra members added.</p>
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
                {priorities.map(p => <option key={p} value={p}>{p}</option>)}
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
                className={cn(inputClasses, "appearance-none cursor-pointer", errors.status && "border-rose-500", !isEditMode && "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 cursor-not-allowed")}
              >
                {isEditMode ? (
                  statuses.map(s => <option key={s} value={s}>{s}</option>)
                ) : (
                  <>
                    <option value="Open">Open (Default)</option>
                    <option value="Open for review">Open for review</option>
                  </>
                )}
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
              <label className={labelClasses}>Description</label>
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
            className="flex items-center gap-2 px-10 py-3.5 rounded-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white transition-all duration-300 shadow-lg shadow-blue-600/30 hover:shadow-blue-600/50 hover:-translate-y-0.5"
          >
            <Save className="w-5 h-5" /> {isEditMode ? 'Save Changes' : 'Create Task'}
          </button>
        </div>
        
      </form>
    </div>
  );
}
