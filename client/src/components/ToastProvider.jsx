import React, { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext(null);

let idCounter = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((message, type = 'success') => {
    if (!message) return;
    const id = ++idCounter;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => removeToast(id), 3500);
  }, [removeToast]);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed inset-x-0 top-4 sm:top-6 z-[70] flex justify-center sm:justify-end pointer-events-none">
        <div className="w-full max-w-sm px-4 sm:pr-6 flex flex-col gap-2 items-stretch">
          {toasts.map((toast) => (
            <div
              key={toast.id}
              className={
                `pointer-events-auto rounded-2xl border px-4 py-3 text-sm shadow-soft bg-white flex items-start gap-3` +
                (toast.type === 'success'
                  ? ' border-mint/60 text-charcoal'
                  : toast.type === 'error'
                  ? ' border-red-200 text-red-800'
                  : ' border-black/10 text-charcoal')
              }
            >
              <div className="flex-1">{toast.message}</div>
              <button
                type="button"
                onClick={() => removeToast(toast.id)}
                className="text-[11px] uppercase tracking-[0.16em] text-black/40 hover:text-black/70"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return ctx;
}
