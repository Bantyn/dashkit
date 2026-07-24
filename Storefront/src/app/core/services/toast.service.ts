import { Injectable, signal } from '@angular/core';

export interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info' | 'default';
  message: string;
  title?: string;
  duration?: number;
  highlightTitle?: boolean;
  actions?: {
    label: string;
    variant?: string;
    onClick: () => void;
  };
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  toasts = signal<Toast[]>([]);

  private add(toast: Omit<Toast, 'id'>) {
    const id = Math.random().toString(36).slice(2);
    const duration = toast.duration ?? 4000;
    this.toasts.update((current) => [...current, { ...toast, id }]);
    setTimeout(() => this.remove(id), duration);
  }

  remove(id: string) {
    this.toasts.update((current) => current.filter((t) => t.id !== id));
  }

  showSuccess(message: string, title?: string) {
    this.add({ type: 'success', message, title });
  }

  showError(message: string, title?: string) {
    this.add({ type: 'error', message, title });
  }

  showWarning(message: string, title?: string) {
    this.add({ type: 'warning', message, title });
  }

  showInfo(message: string, title?: string) {
    this.add({ type: 'info', message, title });
  }
}
