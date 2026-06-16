import React from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { cn } from '../utils/cn';
import { ArrowLeft, Save, User, Shield, MapPin, Key } from 'lucide-react';

const SectionHeader = ({ icon: Icon, title, subtitle, isDarkMode }) => (
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

export default function EmployeeForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { employees, addEmployee, updateEmployee, isDarkMode, roles, places } = useStore();
  
  const isEditMode = Boolean(id);
  const empToEdit = isEditMode ? employees.find(e => e.id === id) : null;

  const { register, handleSubmit, setValue, formState: { errors } } = useForm({
    defaultValues: {
      name: empToEdit?.name || '',
      email: empToEdit?.email || '',
      avatar: empToEdit?.avatar || '',
      bioId: empToEdit?.bioId || '',
      password: empToEdit?.password || '',
      place: empToEdit?.place || '',
      role: empToEdit?.role || ''
    }
  });

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setValue('avatar', reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const onSubmit = (data) => {
    if (isEditMode) {
      updateEmployee(id, data);
    } else {
      addEmployee(data);
    }
    navigate('/employees');
  };

  const inputClasses = cn(
    "w-full px-4 py-3.5 rounded-xl border outline-none transition-all duration-300 text-sm font-semibold",
    isDarkMode 
      ? "bg-slate-900/50 border-slate-700 text-slate-100 focus:border-blue-500 focus:bg-slate-900 focus:ring-4 focus:ring-blue-500/10" 
      : "bg-slate-50 border-slate-200 text-slate-900 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
  );
  
  const labelClasses = cn("block text-sm font-bold mb-2 tracking-wide", isDarkMode ? "text-slate-300" : "text-slate-700");


  return (
    <div className="w-full space-y-8 animate-[fadeIn_0.5s_ease-out]">
      <div className="flex items-center gap-4">
        <Link to="/employees" className={cn("p-3 rounded-2xl transition-all duration-300 shadow-sm hover:-translate-y-0.5", isDarkMode ? "bg-slate-800 hover:bg-slate-700 text-slate-200" : "bg-white border border-slate-200 hover:bg-slate-50 text-slate-700")}>
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className={cn("text-4xl font-extrabold tracking-tight", isDarkMode ? "text-white" : "text-slate-900")}>{isEditMode ? 'Edit Employee' : 'Add New Employee'}</h1>
          <p className={cn("mt-2 font-medium", isDarkMode ? "text-slate-400" : "text-slate-500")}>
            {isEditMode ? `Updating details for ${id}` : 'Create a new employee profile in the system.'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8" autoComplete="off">
        
        {/* Personal Details Section */}
        <div className={cn("p-8 rounded-3xl border shadow-sm transition-all duration-300", isDarkMode ? "bg-slate-800/40 border-slate-700/50" : "bg-white border-slate-200")}>
          <SectionHeader icon={User} title="Personal Details" subtitle="Basic employee information and contact details." isDarkMode={isDarkMode} />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <label className={labelClasses}>Full Name <span className="text-rose-500">*</span></label>
              <input 
                {...register('name', { required: 'Name is required' })} 
                className={cn(inputClasses, errors.name && "border-rose-500 focus:border-rose-500 focus:ring-rose-500/20")} 
                placeholder="e.g. Mial" 
              />
              {errors.name && <p className="text-rose-500 text-sm font-semibold mt-2">{errors.name.message}</p>}
            </div>

            <div>
              <label className={labelClasses}>Email Address <span className="text-rose-500">*</span></label>
              <input 
                type="email"
                {...register('email', { 
                  required: 'Email is required',
                  pattern: { value: /^\S+@\S+$/i, message: 'Invalid email address' }
                })} 
                className={cn(inputClasses, errors.email && "border-rose-500 focus:border-rose-500 focus:ring-rose-500/20")} 
                placeholder="e.g. mial@gmail.com" 
              />
              {errors.email && <p className="text-rose-500 text-sm font-semibold mt-2">{errors.email.message}</p>}
            </div>

            <div className="md:col-span-2">
              <label className={labelClasses}>Profile Image</label>
              <input 
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className={cn(inputClasses, "file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-bold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer")} 
              />
              <p className="text-xs mt-2 text-slate-500 dark:text-slate-400 font-medium">Browse for a profile picture. The image will be securely stored.</p>
            </div>
          </div>
        </div>

        {/* Access & Role Section */}
        <div className={cn("p-8 rounded-3xl border shadow-sm transition-all duration-300", isDarkMode ? "bg-slate-800/40 border-slate-700/50" : "bg-white border-slate-200")}>
          <SectionHeader icon={Shield} title="Access & Role" subtitle="System credentials and organizational role." isDarkMode={isDarkMode} />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <label className={labelClasses}>Bio ID <span className="text-rose-500">*</span></label>
              <input 
                {...register('bioId', { required: 'Bio ID is required' })} 
                className={cn(inputClasses, errors.bioId && "border-rose-500")} 
                placeholder="e.g. 20250744" 
              />
              {errors.bioId && <p className="text-rose-500 text-sm font-semibold mt-2">{errors.bioId.message}</p>}
            </div>

            <div>
              <label className={labelClasses}>Password <span className="text-rose-500">*</span></label>
              <div className="relative">
                <input 
                  type="password"
                  autoComplete="new-password"
                  {...register('password', { required: 'Password is required', minLength: { value: 6, message: 'Minimum 6 characters' } })} 
                  className={cn(inputClasses, errors.password && "border-rose-500")} 
                  placeholder="Enter secure password" 
                />
                <Key className="w-5 h-5 absolute right-4 top-3.5 text-slate-400" />
              </div>
              {errors.password && <p className="text-rose-500 text-sm font-semibold mt-2">{errors.password.message}</p>}
            </div>

            <div>
              <label className={labelClasses}>Role <span className="text-rose-500">*</span></label>
              <select 
                {...register('role', { required: 'Role is required' })} 
                className={cn(inputClasses, "appearance-none cursor-pointer", errors.role && "border-rose-500")}
              >
                <option value="">Select Role</option>
                {roles.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
              {errors.role && <p className="text-rose-500 text-sm font-semibold mt-2">{errors.role.message}</p>}
            </div>

            <div>
              <label className={labelClasses}>Work Location (Place) <span className="text-rose-500">*</span></label>
              <div className="relative">
                <select 
                  {...register('place', { required: 'Place is required' })} 
                  className={cn(inputClasses, "appearance-none cursor-pointer", errors.place && "border-rose-500")}
                >
                  <option value="">Select Location</option>
                  {places.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
                <MapPin className="w-5 h-5 absolute right-4 top-3.5 text-slate-400 pointer-events-none" />
              </div>
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div className={cn("flex items-center justify-end gap-4 mt-8 p-6 rounded-3xl border shadow-sm",
          isDarkMode ? "bg-slate-800/40 border-slate-700/50" : "bg-white border-slate-200"
        )}>
          <button 
            type="button" 
            onClick={() => navigate('/employees')}
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
            <Save className="w-5 h-5" /> {isEditMode ? 'Save Changes' : 'Save Employee'}
          </button>
        </div>
        
      </form>
    </div>
  );
}
