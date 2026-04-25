import { createContext } from 'react';

export type ToastVariant = 'info' | 'success' | 'warning' | 'error';

export type Toast = {
  id: string;
  variant: ToastVariant;
  title: string;
  description?: string;
  durationMs?: number;
};

export type ToastContextValue = {
  show: (toast: Omit<Toast, 'id'>) => string;
  dismiss: (id: string) => void;
};

export const ToastContext = createContext<ToastContextValue | null>(null);
