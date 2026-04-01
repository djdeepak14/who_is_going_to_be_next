"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";

type ToastType = "success" | "error" | "info";

type ToastInput = {
  title: string;
  message?: string;
  type?: ToastType;
  durationMs?: number;
};

type ToastItem = ToastInput & {
  id: string;
  type: ToastType;
  durationMs: number;
};

type ToastContextType = {
  showToast: (toast: ToastInput) => void;
};

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback((toast: ToastInput) => {
    const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const nextToast: ToastItem = {
      id,
      title: toast.title,
      message: toast.message,
      type: toast.type || "info",
      durationMs: toast.durationMs || 3500,
    };

    setToasts((prev) => [...prev, nextToast]);

    window.setTimeout(() => {
      removeToast(id);
    }, nextToast.durationMs);
  }, [removeToast]);

  const value = useMemo(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed top-20 right-4 z-[100] w-[min(92vw,380px)] space-y-2">
        {toasts.map((toast) => {
          const toneClass =
            toast.type === "success"
              ? "border-green-500/30 bg-green-500/10 text-green-700"
              : toast.type === "error"
                ? "border-red-500/30 bg-red-500/10 text-red-700"
                : "border-primary/30 bg-primary/10 text-on-surface";

          return (
            <div
              key={toast.id}
              className={`pointer-events-auto rounded-xl border px-4 py-3 shadow-md backdrop-blur-sm ${toneClass}`}
              role="status"
              aria-live="polite"
            >
              <p className="text-sm font-bold">{toast.title}</p>
              {toast.message ? <p className="mt-0.5 text-xs opacity-90">{toast.message}</p> : null}
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return context;
}
