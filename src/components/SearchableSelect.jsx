import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Search } from 'lucide-react';
import { cn } from '../utils/cn';

const SearchableSelect = React.forwardRef(({
  options = [], // [{ value: '...', label: '...' }]
  value,
  defaultValue = '',
  onChange,
  onBlur,
  name,
  placeholder = "Select Option",
  className,
  triggerClassName,
  disabled = false,
  isDarkMode = false,
  error = false,
  ...rest
}, ref) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedValue, setSelectedValue] = useState(value !== undefined ? value : defaultValue);
  const containerRef = useRef(null);
  const triggerRef = useRef(null);
  const inputRef = useRef(null);

  // Sync internal selectedValue with value prop if controlled
  useEffect(() => {
    if (value !== undefined) {
      setSelectedValue(value);
    }
  }, [value]);

  // Combine forwarded ref and local inputRef
  useEffect(() => {
    if (!ref) return;
    if (typeof ref === 'function') {
      ref(inputRef.current);
    } else {
      ref.current = inputRef.current;
    }
  }, [ref]);

  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;

    // Intercept programmatic value changes (e.g. from react-hook-form reset() or setValue())
    const descriptor = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value');
    if (descriptor && descriptor.set) {
      const originalSet = descriptor.set;
      Object.defineProperty(el, 'value', {
        set(val) {
          originalSet.call(el, val);
          setSelectedValue(val);
        },
        get() {
          return descriptor.get.call(el);
        },
        configurable: true
      });
    }

    // Intercept focus() to focus the custom trigger instead of hidden input
    el.focus = () => {
      if (triggerRef.current) {
        triggerRef.current.focus();
      }
    };
  }, []);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (val) => {
    setSelectedValue(val);
    setIsOpen(false);
    setSearch('');

    if (inputRef.current) {
      inputRef.current.value = val;
    }

    // Call onChange with synthetic event to work with react-hook-form
    if (onChange) {
      onChange({
        target: {
          name: name,
          value: val
        }
      });
    }
  };

  const filteredOptions = options.filter(opt => {
    const label = opt?.label || opt?.toString() || '';
    return label.toLowerCase().includes(search.toLowerCase());
  });

  const selectedOption = options.find(opt => String(opt.value) === String(selectedValue));
  const displayLabel = selectedOption ? selectedOption.label : placeholder;

  return (
    <div ref={containerRef} className={cn("relative w-full", className)}>
      {/* Visually hidden but focusable input for react-hook-form integration */}
      <input
        type="text"
        className="sr-only"
        tabIndex={-1}
        readOnly
        name={name}
        value={selectedValue}
        ref={inputRef}
        onBlur={onBlur}
        {...rest}
      />

      {/* Trigger Button */}
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-full px-4 py-3.5 rounded-xl border outline-none transition-all duration-300 text-sm font-semibold text-left flex items-center justify-between shadow-sm",
          isDarkMode
            ? "bg-slate-900/50 border-slate-700 text-slate-100 hover:border-slate-600 focus:border-blue-500 focus:bg-slate-900 focus:ring-4 focus:ring-blue-500/10"
            : "bg-slate-50 border-slate-200 text-slate-900 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10",
          error && "border-rose-500 focus:border-rose-500 focus:ring-rose-500/10",
          disabled && "opacity-50 cursor-not-allowed",
          triggerClassName
        )}
      >
        <span className="truncate">{displayLabel}</span>
        <ChevronDown className={cn("w-4 h-4 ml-2 transition-transform shrink-0 text-slate-400 pointer-events-none", isOpen && "transform rotate-180")} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && !disabled && (
        <div className={cn(
          "absolute z-50 w-full mt-2 rounded-2xl border shadow-xl flex flex-col overflow-hidden max-h-72 animate-[fadeIn_0.15s_ease-out]",
          isDarkMode
            ? "bg-slate-800 border-slate-700 text-slate-200"
            : "bg-white border-slate-200 text-slate-800"
        )}>
          {/* Search Input Container */}
          <div className={cn(
            "p-2.5 border-b flex items-center gap-2",
            isDarkMode ? "border-slate-700 bg-slate-900/40" : "border-slate-100 bg-slate-50/50"
          )}>
            <Search className="w-4 h-4 text-slate-400 shrink-0 ml-1" />
            <input
              type="text"
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={cn(
                "w-full bg-transparent border-none outline-none text-xs font-semibold py-1 focus:ring-0",
                isDarkMode ? "text-slate-100 placeholder:text-slate-500" : "text-slate-800 placeholder:text-slate-400"
              )}
              autoFocus
            />
          </div>

          {/* Options List */}
          <div className="overflow-y-auto py-1 max-h-52 custom-scrollbar">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((opt) => {
                const isSelected = String(opt.value) === String(selectedValue);
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => handleSelect(opt.value)}
                    className={cn(
                      "w-full text-left px-4 py-3 text-xs font-semibold transition-colors flex items-center justify-between",
                      isDarkMode
                        ? (isSelected ? "bg-blue-600 text-white" : "hover:bg-slate-700/60 text-slate-200")
                        : (isSelected ? "bg-blue-600 text-white" : "hover:bg-slate-50 text-slate-700")
                    )}
                  >
                    <span>{opt.label}</span>
                  </button>
                );
              })
            ) : (
              <div className="px-4 py-3 text-xs text-slate-400 text-center font-semibold">
                No results found
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
});

SearchableSelect.displayName = 'SearchableSelect';

export default SearchableSelect;
