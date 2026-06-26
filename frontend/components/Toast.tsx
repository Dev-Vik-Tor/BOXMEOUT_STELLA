"use client";

import { useEffect } from "react";

export type ToastType = "success" | "error" | "info";

export interface ToastProps {
  id: string;
  message: string;
  type: ToastType;
  onDismiss: (id: string) => void;
}

/**
 * Non-blocking notification shown after wallet transactions.
 * success=green, error=red, info=blue styling.
 * Auto-dismisses after 5 seconds. Manual close button available.
 */
export function Toast({ id, message, type, onDismiss }: ToastProps): JSX.Element {
  useEffect(() => {
    const timer = window.setTimeout(() => onDismiss(id), 5000);
    return () => window.clearTimeout(timer);
  }, [id, onDismiss]);

  const styles: Record<ToastType, string> = {
    success: "border-emerald-200 bg-emerald-50 text-emerald-800",
    error: "border-rose-200 bg-rose-50 text-rose-800",
    info: "border-sky-200 bg-sky-50 text-sky-800",
  };

  return (
    <div className={`flex items-start justify-between rounded-lg border px-4 py-3 text-sm shadow-sm ${styles[type]}`}>
      <span>{message}</span>
      <button type="button" className="ml-3 font-semibold" onClick={() => onDismiss(id)}>
        ×
      </button>
    </div>
  );
}
