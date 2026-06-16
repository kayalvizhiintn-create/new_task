import React, { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { cn } from '../utils/cn';
import { ShieldAlert, Key, RefreshCw, X } from 'lucide-react';

const generateCaptcha = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  let captcha = '';
  for (let i = 0; i < 6; i++) {
    captcha += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return captcha;
};

export default function ReauthModal({ isOpen, onClose, onSuccess, actionDescription = "perform this action" }) {
  const { currentUser, isDarkMode } = useStore();
  const [bioId, setBioId] = useState('');
  const [password, setPassword] = useState('');
  const [captchaInput, setCaptchaInput] = useState('');
  const [captchaCode, setCaptchaCode] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setBioId('');
      setPassword('');
      setCaptchaInput('');
      setError('');
      setCaptchaCode(generateCaptcha());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (captchaInput.toLowerCase() !== captchaCode.toLowerCase()) {
      setError('Incorrect Captcha. Please try again.');
      setCaptchaCode(generateCaptcha());
      setCaptchaInput('');
      return;
    }

    if (bioId !== currentUser?.bioId || password !== currentUser?.password) {
      setError('Invalid Bio ID or Password.');
      setCaptchaCode(generateCaptcha());
      setCaptchaInput('');
      setPassword('');
      return;
    }

    onSuccess();
  };

  const inputClasses = cn(
    "w-full px-4 py-3 rounded-xl border outline-none transition-all text-sm font-semibold",
    isDarkMode 
      ? "bg-slate-900 border-slate-700 text-slate-100 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20" 
      : "bg-slate-50 border-slate-200 text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-[fadeIn_0.2s_ease-out]">
      <div className={cn("relative w-full max-w-md p-8 rounded-3xl shadow-2xl animate-[slideUp_0.3s_ease-out]", 
        isDarkMode ? "bg-slate-800 border border-slate-700" : "bg-white"
      )}>
        <button 
          onClick={onClose}
          className={cn("absolute top-4 right-4 p-2 rounded-full transition-colors", 
            isDarkMode ? "hover:bg-slate-700 text-slate-400" : "hover:bg-slate-100 text-slate-500"
          )}
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex flex-col items-center text-center mb-8">
          <div className={cn("p-4 rounded-full mb-4", isDarkMode ? "bg-rose-500/20 text-rose-400" : "bg-rose-100 text-rose-600")}>
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h2 className={cn("text-2xl font-black", isDarkMode ? "text-white" : "text-slate-900")}>Security Verification</h2>
          <p className={cn("text-sm font-medium mt-2", isDarkMode ? "text-slate-400" : "text-slate-500")}>
            Please re-authenticate to {actionDescription}.
          </p>
        </div>

        {error && (
          <div className="p-3 mb-6 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-sm font-bold text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className={cn("block text-xs font-bold mb-1.5", isDarkMode ? "text-slate-300" : "text-slate-700")}>Verify Bio ID</label>
            <input 
              type="text" 
              value={bioId}
              onChange={(e) => setBioId(e.target.value)}
              className={inputClasses}
              placeholder="e.g. BIO-1001"
              required
            />
          </div>

          <div>
            <label className={cn("block text-xs font-bold mb-1.5", isDarkMode ? "text-slate-300" : "text-slate-700")}>Password</label>
            <div className="relative">
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={inputClasses}
                placeholder="Enter your password"
                required
              />
              <Key className="w-4 h-4 absolute right-4 top-3.5 text-slate-400 pointer-events-none" />
            </div>
          </div>

          <div>
            <label className={cn("block text-xs font-bold mb-1.5", isDarkMode ? "text-slate-300" : "text-slate-700")}>Security Captcha</label>
            <div className="flex gap-3">
              <div className="relative flex-1">
                <input 
                  type="text" 
                  value={captchaInput}
                  onChange={(e) => setCaptchaInput(e.target.value)}
                  className={inputClasses}
                  placeholder="Type the code"
                  required
                />
              </div>
              <div className={cn("flex-1 rounded-xl flex items-center justify-center gap-2 select-none overflow-hidden border", 
                isDarkMode ? "bg-slate-900 border-slate-700" : "bg-slate-100 border-slate-200"
              )}>
                <span className="font-mono text-xl font-bold tracking-widest text-slate-600 dark:text-slate-300 line-through decoration-slate-400 decoration-2 select-none opacity-80" style={{ transform: 'skewX(-15deg)' }}>
                  {captchaCode}
                </span>
                <button type="button" onClick={() => setCaptchaCode(generateCaptcha())} className="p-1 hover:text-blue-500 transition-colors text-slate-400">
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          <div className="pt-4 flex gap-3">
            <button 
              type="button" 
              onClick={onClose}
              className={cn("flex-1 py-3 rounded-xl font-bold transition-all border", 
                isDarkMode ? "bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700" : "bg-white border-slate-300 text-slate-700 hover:bg-slate-50"
              )}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="flex-1 py-3 rounded-xl font-bold bg-rose-600 hover:bg-rose-700 text-white transition-all shadow-lg shadow-rose-600/30 hover:-translate-y-0.5"
            >
              Verify & Confirm
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
