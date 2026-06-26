import React, { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { cn } from '../utils/cn';
import { Key, X, Eye, EyeOff, Lock, CheckCircle2, AlertCircle } from 'lucide-react';
import { authService } from '../services/authService';

export default function ChangePasswordModal({ isOpen, onClose, employee, onSuccess }) {
  const { currentUser, isDarkMode } = useStore();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setError('');
      setSuccess(false);
    }
  }, [isOpen]);

  if (!isOpen || !employee) return null;

  // Admin users do not need to provide the current password (backend only checks for non-admins)
  const isAdmin = currentUser?.role?.toLowerCase() === 'admin' || currentUser?.role?.toLowerCase() === 'super admin';
  const requireCurrentPassword = !isAdmin;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (requireCurrentPassword && !currentPassword) {
      setError('Current password is required.');
      return;
    }

    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('New password and confirm password do not match.');
      return;
    }

    setLoading(true);
    try {
      // Map properties to backend parameters
      const targetId = employee.id || employee.empId || employee.employeeId || employee._id;
      
      const payload = {
        targetEmployeeId: parseInt(targetId, 10) || 0,
        currentPassword: requireCurrentPassword ? currentPassword : "",
        newPassword: newPassword
      };

      const response = await authService.changePassword(payload);

      if (response?.isSuccess || response?.data === true) {
        setSuccess(true);
        if (onSuccess) {
          onSuccess();
        }
        setTimeout(() => {
          onClose();
        }, 1500);
      } else {
        setError(response?.message || 'Failed to change password. Please check your credentials.');
      }
    } catch (err) {
      console.error('Password change error:', err);
      setError(err.response?.data?.message || err.message || 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const inputClasses = cn(
    "w-full px-4 py-3 pl-11 pr-11 rounded-xl border outline-none transition-all duration-300 text-sm font-semibold",
    isDarkMode 
      ? "bg-slate-900 border-slate-700 text-slate-100 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20" 
      : "bg-slate-50 border-slate-200 text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
  );

  const labelClasses = cn("block text-xs font-bold mb-1.5", isDarkMode ? "text-slate-300" : "text-slate-700");

  const empName = employee.name || employee.empName || employee.employeeName || 'Selected User';
  const empBioId = employee.bioId || employee.bioid || employee.empBioId || employee.id || 'N/A';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-[fadeIn_0.2s_ease-out]">
      <div className={cn("relative w-full max-w-md p-8 rounded-[2rem] shadow-2xl animate-[slideUp_0.3s_ease-out] border transition-all duration-300", 
        isDarkMode ? "bg-slate-800 border-slate-700" : "bg-white border-slate-200"
      )}>
        <button 
          onClick={onClose}
          disabled={loading || success}
          className={cn("absolute top-4 right-4 p-2 rounded-full transition-colors", 
            isDarkMode ? "hover:bg-slate-700 text-slate-400" : "hover:bg-slate-100 text-slate-500"
          )}
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex flex-col items-center text-center mb-6">
          <div className={cn("p-4 rounded-full mb-4 bg-gradient-to-tr", 
            success 
              ? "from-emerald-500 to-teal-500 text-white" 
              : "from-blue-500 to-indigo-500 text-white"
          )}>
            <Key className="w-8 h-8 animate-pulse" />
          </div>
          <h2 className={cn("text-2xl font-black tracking-tight", isDarkMode ? "text-white" : "text-slate-900")}>
            {success ? "Success!" : "Change Password"}
          </h2>
          <p className={cn("text-sm font-semibold mt-1", isDarkMode ? "text-slate-400" : "text-slate-500")}>
            {success 
              ? "Password updated successfully." 
              : `Setting new credentials for ${empName} (ID: ${empBioId})`
            }
          </p>
        </div>

        {error && (
          <div className="p-3 mb-6 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-sm font-bold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success ? (
          <div className="flex flex-col items-center justify-center p-8 space-y-3">
            <CheckCircle2 className="w-16 h-16 text-emerald-500 animate-bounce" />
            <p className="text-sm font-bold text-slate-500 dark:text-slate-400">Closing dialog...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5" autoComplete="off">
            {requireCurrentPassword && (
              <div>
                <label className={labelClasses}>Current Password</label>
                <div className="relative group">
                  <Lock className="w-4 h-4 absolute left-4 top-3.5 text-slate-400 group-focus-within:text-blue-500" />
                  <input 
                    type={showCurrent ? "text" : "password"} 
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className={inputClasses}
                    placeholder="Enter current password"
                    required
                  />
                  <button 
                    type="button"
                    onClick={() => setShowCurrent(!showCurrent)}
                    className="absolute right-4 top-3 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            )}

            <div>
              <label className={labelClasses}>New Password</label>
              <div className="relative group">
                <Lock className="w-4 h-4 absolute left-4 top-3.5 text-slate-400 group-focus-within:text-blue-500" />
                <input 
                  type={showNew ? "text" : "password"} 
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className={inputClasses}
                  placeholder="At least 6 characters"
                  required
                />
                <button 
                  type="button"
                  onClick={() => setShowNew(!showNew)}
                  className="absolute right-4 top-3 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className={labelClasses}>Confirm New Password</label>
              <div className="relative group">
                <Lock className="w-4 h-4 absolute left-4 top-3.5 text-slate-400 group-focus-within:text-blue-500" />
                <input 
                  type={showConfirm ? "text" : "password"} 
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={inputClasses}
                  placeholder="Repeat new password"
                  required
                />
                <button 
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-4 top-3 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="pt-4 flex gap-3">
              <button 
                type="button" 
                onClick={onClose}
                disabled={loading}
                className={cn("flex-1 py-3 rounded-xl font-bold transition-all border", 
                  isDarkMode ? "bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700" : "bg-white border-slate-300 text-slate-700 hover:bg-slate-50"
                )}
              >
                Cancel
              </button>
              <button 
                type="submit" 
                disabled={loading}
                className="flex-1 py-3 rounded-xl font-bold bg-blue-600 hover:bg-blue-700 text-white transition-all shadow-lg shadow-blue-600/30 hover:-translate-y-0.5 flex justify-center items-center"
              >
                {loading ? "Updating..." : "Change Password"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
