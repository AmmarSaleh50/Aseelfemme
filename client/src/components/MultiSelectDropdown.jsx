import React, { useEffect, useRef, useState } from 'react';

export default function MultiSelectDropdown({ label, values, onChange, options }) {
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

  const selectedValues = Array.isArray(values) ? values : [];

  const toggleValue = (val) => {
    if (selectedValues.includes(val)) {
      onChange(selectedValues.filter((v) => v !== val));
    } else {
      onChange([...selectedValues, val]);
    }
  };

  const selectedLabels = options
    .filter((opt) => selectedValues.includes(opt.value))
    .map((opt) => opt.label);

  let summary = label;
  if (selectedLabels.length === 1) {
    summary = selectedLabels[0];
  } else if (selectedLabels.length > 1) {
    summary = `${selectedLabels[0]} + ${selectedLabels.length - 1}`;
  }

  return (
    <div ref={ref} className="select-pill-wrapper text-sm">
      <button
        type="button"
        className="select-pill flex items-center gap-2 min-w-[9rem] justify-between"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="truncate">{summary}</span>
      </button>
      {open && (
        <div className="absolute left-0 mt-2 w-full rounded-2xl bg-ivory shadow-soft border border-charcoal/15 z-30 overflow-hidden">
          <ul className="max-h-60 overflow-auto" role="listbox" aria-multiselectable="true">
            {options.map((opt) => {
              const active = selectedValues.includes(opt.value);
              return (
                <li key={opt.value}>
                  <button
                    type="button"
                    className={`w-full text-left px-4 py-2 text-sm flex items-center justify-between hover:bg-blush/80 ${
                      active ? 'bg-blush/60 font-semibold' : ''
                    }`}
                    onClick={() => toggleValue(opt.value)}
                  >
                    <span>{opt.label}</span>
                    {active && (
                      <span className="text-[10px] uppercase tracking-[0.16em] text-black/50">
                        ✓
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
