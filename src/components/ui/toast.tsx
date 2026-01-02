import React, { createContext, useContext, useCallback, useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Button } from "./button";
import type { ToastProps } from "@/lib/types/components";

// Toast notification data
interface ToastNotification extends Omit<ToastProps, "onClose"> {
  id: string;
  createdAt: Date;
}

// Toast context type
interface ToastContextType {
  toasts: ToastNotification[];
  showToast: (toast: Omit<ToastNotification, "id" | "createdAt">) => string;
  hideToast: (id: string) => void;
  hideAllToasts: () => void;
}

// Create context
const ToastContext = createContext<ToastContextType | null>(null);

/**
 * Hook to use toast notifications
 *
 * @example
 * ```tsx
 * const toast = useToast();
 *
 * const showSuccess = () => {
 *   toast.showToast({
 *     title: "Success!",
 *     description: "Operation completed successfully",
 *     variant: "success",
 *   });
 * };
 *
 * const showError = () => {
 *   toast.showToast({
 *     title: "Error",
 *     description: "Something went wrong",
 *     variant: "error",
 *     duration: 0, // Don't auto-dismiss
 *   });
 * };
 * ```
 */
export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}

/**
 * Individual toast component
 */
const Toast: React.FC<ToastNotification & { onClose: () => void }> = ({
  title,
  description,
  variant = "default",
  duration = 5000,
  action,
  onClose,
  className = "",
}) => {
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(onClose, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  const variantStyles = {
    default: "bg-background border text-foreground",
    success: "bg-green-50 border-green-200 text-green-800 dark:bg-green-950 dark:border-green-800 dark:text-green-200",
    error: "bg-red-50 border-red-200 text-red-800 dark:bg-red-950 dark:border-red-800 dark:text-red-200",
    warning:
      "bg-yellow-50 border-yellow-200 text-yellow-800 dark:bg-yellow-950 dark:border-yellow-800 dark:text-yellow-200",
    info: "bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-950 dark:border-blue-800 dark:text-blue-200",
  };

  const iconMap = {
    default: null,
    success: (
      <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
      </svg>
    ),
    error: (
      <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
      </svg>
    ),
    warning: (
      <svg className="w-5 h-5 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
        />
      </svg>
    ),
    info: (
      <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    ),
  };

  return (
    <div
      role="alert"
      aria-live={variant === "error" ? "assertive" : "polite"}
      className={`
        relative flex items-start gap-3 p-4 rounded-lg border shadow-lg max-w-md w-full
        animate-in slide-in-from-right-full duration-300
        ${variantStyles[variant]}
        ${className}
      `}
    >
      {iconMap[variant] && <div className="flex-shrink-0 mt-0.5">{iconMap[variant]}</div>}

      <div className="flex-1 min-w-0">
        <div className="font-semibold text-sm">{title}</div>
        {description && <div className="mt-1 text-sm opacity-90">{description}</div>}

        {action && (
          <div className="mt-3">
            <Button size="sm" variant="outline" onClick={action.onClick} className="h-7 px-2 text-xs">
              {action.text}
            </Button>
          </div>
        )}
      </div>

      <Button
        variant="ghost"
        size="sm"
        onClick={onClose}
        className="flex-shrink-0 h-6 w-6 p-0 hover:bg-black/10 dark:hover:bg-white/10"
        aria-label="Zamknij powiadomienie"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </Button>
    </div>
  );
};

/**
 * Toast container component
 */
const ToastContainer: React.FC<{ toasts: ToastNotification[]; onClose: (id: string) => void }> = ({
  toasts,
  onClose,
}) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const portalRoot = document.getElementById("toast-root") || document.body;

  return createPortal(
    <div className="fixed top-4 right-4 z-50 space-y-2 pointer-events-none" aria-label="Powiadomienia">
      {toasts.map((toast) => (
        <div key={toast.id} className="pointer-events-auto">
          <Toast {...toast} onClose={() => onClose(toast.id)} />
        </div>
      ))}
    </div>,
    portalRoot
  );
};

/**
 * Toast provider component
 */
export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastNotification[]>([]);

  const showToast = useCallback((toast: Omit<ToastNotification, "id" | "createdAt">) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newToast: ToastNotification = {
      ...toast,
      id,
      createdAt: new Date(),
    };

    setToasts((prev) => [...prev, newToast]);

    return id;
  }, []);

  const hideToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const hideAllToasts = useCallback(() => {
    setToasts([]);
  }, []);

  const contextValue: ToastContextType = {
    toasts,
    showToast,
    hideToast,
    hideAllToasts,
  };

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      <ToastContainer toasts={toasts} onClose={hideToast} />
    </ToastContext.Provider>
  );
};

/**
 * Hook-based utility functions for common toast types
 * Use these inside React components
 */
export function useToastHelpers() {
  const context = useToast();

  return {
    success: (title: string, description?: string, options?: Partial<ToastProps>) => {
      return context.showToast({
        title,
        description,
        variant: "success",
        ...options,
      });
    },

    error: (title: string, description?: string, options?: Partial<ToastProps>) => {
      return context.showToast({
        title,
        description,
        variant: "error",
        duration: 0, // Error toasts don't auto-dismiss by default
        ...options,
      });
    },

    warning: (title: string, description?: string, options?: Partial<ToastProps>) => {
      return context.showToast({
        title,
        description,
        variant: "warning",
        ...options,
      });
    },

    info: (title: string, description?: string, options?: Partial<ToastProps>) => {
      return context.showToast({
        title,
        description,
        variant: "info",
        ...options,
      });
    },

    default: (title: string, description?: string, options?: Partial<ToastProps>) => {
      return context.showToast({
        title,
        description,
        variant: "default",
        ...options,
      });
    },
  };
}

// Note: The toast utility functions above won't work outside components
// Instead, create a toast manager for programmatic access
let toastManager: ToastContextType | null = null;

export const setToastManager = (manager: ToastContextType) => {
  toastManager = manager;
};

export const programmaticToast = {
  success: (title: string, description?: string, options?: Partial<ToastProps>) => {
    toastManager?.showToast({ title, description, variant: "success", ...options });
  },
  error: (title: string, description?: string, options?: Partial<ToastProps>) => {
    toastManager?.showToast({ title, description, variant: "error", duration: 0, ...options });
  },
  warning: (title: string, description?: string, options?: Partial<ToastProps>) => {
    toastManager?.showToast({ title, description, variant: "warning", ...options });
  },
  info: (title: string, description?: string, options?: Partial<ToastProps>) => {
    toastManager?.showToast({ title, description, variant: "info", ...options });
  },
  default: (title: string, description?: string, options?: Partial<ToastProps>) => {
    toastManager?.showToast({ title, description, variant: "default", ...options });
  },
};
