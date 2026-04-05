import React, { useEffect, useRef, useState } from 'react';

export default function FilterDropdown({ label, value, onChange, options, allowClear = true, hasError = false }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
      }
    };
    const handleEsc = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEsc);
    };
  }, []);

  const selected = options.find(o => o.value === value) || { label };

  const handleSelect = (val) => {
    // Clicking the same value again clears the filter when allowed (Collection filters)
    if (allowClear && val === value) {
      onChange('');
    } else {
      onChange(val);
    }
    setOpen(false);
  };

  const buttonClasses = `select-pill flex items-center gap-2 min-w-[9rem] justify-between ${
    hasError ? 'border-red-400 bg-red-50 text-red-800' : ''
  }`;

  return (
    <div ref={ref} className="select-pill-wrapper text-sm">
      <button
        type="button"
        className={buttonClasses}
        onClick={() => setOpen(o => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="truncate">{selected.label}</span>
      </button>
      {open && (
        <div className="absolute left-0 mt-2 w-full rounded-2xl bg-ivory shadow-soft border border-charcoal/15 z-30 overflow-hidden">
          <ul className="max-h-60 overflow-auto" role="listbox">
            {options.map(opt => (
              <li key={opt.value ?? 'all'}>
                <button
                  type="button"
                  className={`w-full text-left px-4 py-2 text-sm hover:bg-blush/80 ${
                    opt.value === value ? 'bg-blush/60 font-semibold' : ''
                  }`}
                  onClick={() => handleSelect(opt.value)}
                >
                  {opt.label}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
