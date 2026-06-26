import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { cn } from '../utils/cn';
import { ArrowLeft, Save, User, Shield, MapPin, Key } from 'lucide-react';
import { employeeService } from '../services/employeeService';
import { roleService } from '../services/roleService';
import { validateEmail } from '../utils/validation';

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
  const { isDarkMode, places, userPrivileges, currentUser } = useStore(); // roles removed from useStore

  const isEditMode = Boolean(id);
  const [loading, setLoading] = useState(isEditMode);
  const [apiRoles, setApiRoles] = useState([]);

  const { register, handleSubmit, watch, setValue, reset, formState: { errors } } = useForm({
    defaultValues: {
      name: '',
      email: '',
      avatar: '',
      bioId: '',
      password: '',
      place: '',
      role: '' // This will now store the roleId as string
    }
  });

  useEffect(() => {
    // Fetch dynamic roles from API
    const fetchRoles = async () => {
      try {
        const data = await roleService.getAllRoles();
        const rolesArr = Array.isArray(data) ? data : (data?.data || data?.items || []);
        setApiRoles(rolesArr);
      } catch (e) {
        console.error("Error fetching roles", e);
      }
    };
    fetchRoles();

    if (isEditMode) {
      const fetchEmp = async () => {
        try {
          const res = await employeeService.getEmployeeById(id);
          let data = res.data || res;
          if (Array.isArray(data)) data = data[0] || {};
          else if (data && Array.isArray(data.items)) data = data.items[0] || {};

          reset({
            name: data.employeeName || data.name || data.empName || '',
            email: data.email || '',
            avatar: data.avatar || '',
            bioId: data.bioid || data.bioId || data.empBioId || data.employeeId || '',
            password: data.password || '',
            place: data.location || data.place || data.workPlace || '',
            role: data.roleId?.toString() || data.role || data.roleName || ''
          });
        } catch (error) {
          console.error("Error fetching employee", error);
        } finally {
          setLoading(false);
        }
      };
      fetchEmp();
    }
  }, [id, isEditMode, reset]);

  const avatarImage = watch('avatar');

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

  const onSubmit = async (data) => {
    try {
      const payload = {
        employeeId: isEditMode ? parseInt(id, 10) : 0,
        employeeName: data.name?.trim(),
        bioid: parseInt(data.bioId, 10) || 0,
        email: data.email?.trim(),
        roleId: parseInt(data.role, 10) || 0,
        location: data.place,
        avatar: data.avatar || null
      };

      if (!isEditMode) {
        payload.password = data.password;
      }

      if (isEditMode) {
        await employeeService.updateEmployee(id, payload);
      } else {
        await employeeService.createEmployee(payload);
      }
      navigate('/employees');
    } catch (error) {
      console.error("Failed to save employee", error);
      alert("Failed to save employee. Please check console.");
    }
  };

  const inputClasses = cn(
    "w-full px-4 py-3.5 rounded-xl border outline-none focus:outline-none focus:ring-0 transition-all duration-300 text-sm font-semibold",
    isDarkMode
      ? "bg-slate-900/50 border-slate-700 text-slate-100 focus:border-blue-500 focus:bg-slate-900"
      : "bg-slate-50 border-slate-200 text-slate-900 focus:border-blue-500 focus:bg-white"
  );

  const labelClasses = cn("block text-sm font-bold mb-2 tracking-wide", isDarkMode ? "text-slate-300" : "text-slate-700");


  const empPermissions = userPrivileges['employees'] || { canView: 0, canCreate: 0, canUpdate: 0, canDelete: 0 };
  const addEmpPermissions = userPrivileges['add employee'] || { canView: 0, canCreate: 0, canUpdate: 0, canDelete: 0 };
  const isAdmin = currentUser?.role?.toLowerCase() === 'admin' || currentUser?.role?.toLowerCase() === 'super admin';
  const canAccess = isAdmin || (Object.keys(userPrivileges).length === 0) || (
    isEditMode ? empPermissions.canUpdate === 1 : (empPermissions.canCreate === 1 && addEmpPermissions.canCreate === 1 && addEmpPermissions.canView === 1)
  );

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
        <Link to="/employees" className="mt-6 px-6 py-2.5 rounded-xl font-bold bg-blue-600 hover:bg-blue-700 text-white transition-all duration-300 shadow-sm hover:shadow">
          Back to Employees
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full space-y-8 animate-[fadeIn_0.5s_ease-out]">
      <div className="flex items-center gap-4">
        <Link to="/employees" className={cn("p-3 rounded-2xl transition-all duration-300 shadow-sm hover:-translate-y-0.5", isDarkMode ? "bg-slate-800 hover:bg-slate-700 text-slate-200" : "bg-white border border-slate-200 hover:bg-slate-50 text-slate-700")}>
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className={cn("text-4xl font-extrabold tracking-tight", isDarkMode ? "text-white" : "text-slate-900")}>{isEditMode ? 'Edit Employee' : 'Add New Employee'}</h1>
          <p className={cn("mt-2 font-medium", isDarkMode ? "text-slate-400" : "text-slate-500")}>
            {isEditMode ? `Updating details for employee` : 'Create a new employee profile in the system.'}
          </p>
        </div>
      </div>

      {loading ? (
        <div className="text-center p-16 font-bold text-slate-500">Loading employee details...</div>
      ) : (
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
                    validate: (val) => validateEmail(val)
                  })}
                  className={cn(inputClasses, errors.email && "border-rose-500 focus:border-rose-500 focus:ring-rose-500/20")}
                  placeholder="e.g. mial@gmail.com"
                />
                {errors.email && <p className="text-rose-500 text-sm font-semibold mt-2">{errors.email.message}</p>}
              </div>

              <div className="md:col-span-2">
                <label className={labelClasses}>Profile Image</label>
                {avatarImage ? (
                  <div className="flex items-center gap-6 mt-2">
                    <div className="w-24 h-24 rounded-full overflow-hidden border-4 shadow-md bg-gradient-to-tr from-blue-500 to-indigo-500 flex items-center justify-center text-white text-3xl font-bold border-white dark:border-slate-800">
                      <img src={avatarImage} alt="Profile preview" className="w-full h-full object-cover" />
                    </div>
                    <button
                      type="button"
                      onClick={() => setValue('avatar', '')}
                      className="px-4 py-2 rounded-xl text-sm font-bold bg-rose-50 hover:bg-rose-100 text-rose-600 dark:bg-rose-500/10 dark:hover:bg-rose-500/20 dark:text-rose-400 transition-colors"
                    >
                      Remove Image
                    </button>
                  </div>
                ) : (
                  <>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className={cn(inputClasses, "file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-bold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer")}
                    />
                    <p className="text-xs mt-2 text-slate-500 dark:text-slate-400 font-medium">Browse for a profile picture. The image will be securely stored.</p>
                  </>
                )}
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

              {!isEditMode && (
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
              )}

              <div>
                <label className={labelClasses}>Role <span className="text-rose-500">*</span></label>
                <select
                  {...register('role', { required: 'Role is required' })}
                  className={cn(inputClasses, "appearance-none cursor-pointer", errors.role && "border-rose-500")}
                >
                  <option value="">Select Role</option>
                  {apiRoles.map(r => {
                    const roleId = r.id || r._id || r.roleId || r.value;
                    const roleName = r.name || r.roleName || r.title || r.value;
                    return <option key={roleId} value={roleId}>{roleName}</option>;
                  })}
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
      )}
    </div>
  );
}
