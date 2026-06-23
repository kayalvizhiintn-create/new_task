import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { cn } from '../utils/cn';
import { Lock, UserCircle, ArrowRight, ShieldCheck, CheckCircle2, LayoutDashboard } from 'lucide-react';
import logo1 from '../assets/logo1.jpg';
import { authService } from '../services/authService';
import { decodeToken } from '../utils/jwt';

export default function Login() {
  const navigate = useNavigate();
  const login = useStore(state => state.login);
  const isDarkMode = useStore(state => state.isDarkMode);

  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm();

  const onSubmit = async (data) => {
    setErrorMsg('');
    setLoading(true);
    try {
      const payload = {
        bioId: data.bioId,
        password: data.password
      };
      
      // Call the API endpoint: http://192.23.2.9:8004/api/v1/auth/login
      const response = await authService.login(payload);
      
      // Save token if returned by the backend
      const token = response?.token || response?.data?.token;
      let decodedUser = null;
      if (token) {
        localStorage.setItem('token', token);
        decodedUser = decodeToken(token);
      }
      
      if (response?.isSuccess === false || response?.status === false) {
        setErrorMsg(response?.message || 'Access denied. Invalid credentials.');
      } else {
        const userObj = {
          ...(response?.user || response?.data || {}),
          ...(decodedUser || {}),
          bioId: decodedUser?.bioId || data.bioId,
          name: decodedUser?.name || response?.data?.employeeName || 'User'
        };
        // Success: Update Zustand store to reflect authentication
        useStore.setState({ 
          isAuthenticated: true, 
          currentUser: userObj
        });
        navigate('/dashboard');
      }
    } catch (error) {
      setErrorMsg(error.response?.data?.message || error.message || 'Server error. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const inputClasses = cn(
    "w-full px-5 py-4 pl-12 rounded-2xl border outline-none transition-all duration-300 font-medium",
    isDarkMode
      ? "bg-slate-900/60 border-slate-700/50 text-white focus:border-blue-500 focus:bg-slate-900 focus:ring-4 focus:ring-blue-500/20"
      : "bg-white/60 border-slate-200/80 text-slate-900 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/20"
  );

  return (
    <div className={cn("min-h-screen w-full relative overflow-hidden flex items-center justify-center transition-colors duration-700",
      isDarkMode ? "bg-[#050B14]" : "bg-[#F1F5F9]"
    )}>

      {/* Immersive Mesh Background */}
      <div className="absolute inset-0 w-full h-full">
        <div className={cn("absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full blur-[140px] opacity-40 transition-colors duration-700",
          isDarkMode ? "bg-indigo-600" : "bg-indigo-300"
        )}></div>
        <div className={cn("absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] rounded-full blur-[140px] opacity-40 transition-colors duration-700",
          isDarkMode ? "bg-blue-600" : "bg-blue-300"
        )}></div>
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.04] mix-blend-overlay"></div>
      </div>

      {/* Floating UI Elements (Background Depth) */}
      <div className="absolute inset-0 w-full h-full hidden lg:block pointer-events-none perspective-[1000px]">
        {/* Floating Card 1 */}
        <div className={cn("absolute top-[20%] left-[15%] w-64 p-6 rounded-3xl border shadow-2xl backdrop-blur-md transform -rotate-12 translate-z-[100px] opacity-60 transition-colors duration-700",
          isDarkMode ? "bg-slate-800/40 border-slate-700/50" : "bg-white/60 border-white"
        )}>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-blue-500" />
            </div>
            <div className="space-y-1 text-left flex-1">
              <div className={cn("w-24 h-2.5 rounded-full", isDarkMode ? "bg-slate-700" : "bg-slate-200")}></div>
              <div className={cn("w-16 h-2 rounded-full", isDarkMode ? "bg-slate-700" : "bg-slate-200")}></div>
            </div>
          </div>
          <div className="space-y-2">
            <div className={cn("w-full h-2 rounded-full", isDarkMode ? "bg-slate-700/50" : "bg-slate-200/50")}></div>
            <div className={cn("w-4/5 h-2 rounded-full", isDarkMode ? "bg-slate-700/50" : "bg-slate-200/50")}></div>
          </div>
        </div>

        {/* Floating Card 2 */}
        <div className={cn("absolute bottom-[20%] right-[15%] w-72 p-6 rounded-3xl border shadow-2xl backdrop-blur-md transform rotate-12 translate-z-[50px] opacity-60 transition-colors duration-700",
          isDarkMode ? "bg-slate-800/40 border-slate-700/50" : "bg-white/60 border-white"
        )}>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
            </div>
            <div className="space-y-1 text-left flex-1">
              <div className={cn("w-20 h-2.5 rounded-full", isDarkMode ? "bg-slate-700" : "bg-slate-200")}></div>
              <div className={cn("w-28 h-2 rounded-full", isDarkMode ? "bg-slate-700" : "bg-slate-200")}></div>
            </div>
          </div>
          <div className="flex gap-2">
            <div className={cn("w-full h-8 rounded-lg", isDarkMode ? "bg-slate-700/50" : "bg-slate-200/50")}></div>
            <div className={cn("w-full h-8 rounded-lg", isDarkMode ? "bg-slate-700/50" : "bg-slate-200/50")}></div>
          </div>
        </div>
      </div>

      {/* Main Login Glass Card */}
      <div className={cn("relative z-20 w-full max-w-lg mx-4 p-8 sm:p-12 rounded-[2.5rem] border shadow-2xl backdrop-blur-2xl animate-[fadeIn_0.6s_ease-out] transition-colors duration-700",
        isDarkMode ? "bg-slate-900/40 border-slate-700/50 shadow-black/50" : "bg-white/60 border-white/80 shadow-indigo-500/10"
      )}>

        <div className="flex flex-col items-center mb-10 text-center">
          <img src={logo1} alt="NavaNala Logo" className="w-16 h-16 rounded-2xl object-contain bg-white p-1 mb-6 shadow-xl shadow-blue-500/30" />
          <h1 className={cn("text-3xl sm:text-4xl font-extrabold tracking-tight transition-colors duration-700", isDarkMode ? "text-white" : "text-slate-900")}>
            NavaNala
          </h1>
          <p className={cn("mt-3 text-base font-medium max-w-sm transition-colors duration-700", isDarkMode ? "text-slate-400" : "text-slate-500")}>
            Authenticate your credentials to access the enterprise workspace.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {errorMsg && (
            <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-sm font-bold flex items-center justify-center animate-[shake_0.4s_ease-in-out]">
              {errorMsg}
            </div>
          )}

          <div className="space-y-2">
            <div className="relative group">
              <UserCircle className={cn("absolute left-4 top-4 w-5 h-5 transition-colors duration-300",
                isDarkMode ? "text-slate-500 group-focus-within:text-blue-400" : "text-slate-400 group-focus-within:text-blue-500"
              )} />
              <input
                type="text"
                {...register('bioId', { required: 'Bio ID is required' })}
                className={cn(inputClasses, errors.bioId && "border-rose-500 focus:border-rose-500 focus:ring-rose-500/20")}
                placeholder="Corporate Bio ID (e.g. BIO-1001)"
              />
            </div>
            {errors.bioId && <p className="text-rose-500 text-xs font-bold pl-2">{errors.bioId.message}</p>}
          </div>

          <div className="space-y-2">
            <div className="relative group">
              <Lock className={cn("absolute left-4 top-4 w-5 h-5 transition-colors duration-300",
                isDarkMode ? "text-slate-500 group-focus-within:text-blue-400" : "text-slate-400 group-focus-within:text-blue-500"
              )} />
              <input
                type="password"
                {...register('password', { required: 'Password is required' })}
                className={cn(inputClasses, errors.password && "border-rose-500 focus:border-rose-500 focus:ring-rose-500/20")}
                placeholder="Security Password"
              />
            </div>
            {errors.password && <p className="text-rose-500 text-xs font-bold pl-2">{errors.password.message}</p>}
          </div>

          <div className="flex items-center justify-between px-2 pt-2 pb-4">
            <label className="flex items-center gap-3 cursor-pointer group">
              <div className="relative flex items-center justify-center">
                <input type="checkbox" className="w-5 h-5 rounded-md border-slate-300 text-blue-600 focus:ring-blue-500/30 cursor-pointer peer" />
              </div>
              <span className={cn("text-sm font-semibold transition-colors duration-300", isDarkMode ? "text-slate-400 group-hover:text-slate-300" : "text-slate-600 group-hover:text-slate-900")}>Keep me signed in</span>
            </label>
            <button type="button" className="text-sm font-bold text-blue-600 hover:text-blue-700 transition-colors">
              Recovery
            </button>
          </div>

          <button
            type="submit"
            className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl font-bold text-base bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white transition-all duration-300 shadow-xl shadow-blue-600/20 hover:shadow-blue-600/40 hover:-translate-y-1"
          >
            Authorize Access <ArrowRight className="w-5 h-5" />
          </button>
        </form>

      </div>
    </div>
  );
}
