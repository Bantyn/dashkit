import { Injectable, signal } from '@angular/core';

export type ToastType = 'success' | 'error' | 'info' | 'warning' | 'default';

export interface ToastAction {
  label: string;
  onClick: () => void;
  variant?: 'default' | 'outline' | 'ghost';
}

export interface Toast {
  id: string;
  title?: string;
  message: string;
  type: ToastType;
  duration?: number;
  highlightTitle?: boolean;
  actions?: ToastAction;
  onDismiss?: () => void;
}

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  toasts = signal<Toast[]>([]);

  show(message: string, typeOrOptions: ToastType | Partial<Omit<Toast, 'id' | 'message'>> = 'info') {
    const id = Math.random().toString(36).substring(2, 9);
    
    let options: Partial<Omit<Toast, 'id' | 'message'>> = {};
    if (typeof typeOrOptions === 'string') {
      options = { type: typeOrOptions };
    } else {
      options = typeOrOptions;
    }

    const type = options.type || 'info';
    const duration = options.duration !== undefined ? options.duration : 4000;

    const newToast: Toast = {
      id,
      message,
      type,
      duration,
      title: options.title,
      highlightTitle: options.highlightTitle,
      actions: options.actions,
      onDismiss: options.onDismiss
    };

    this.toasts.update(t => [...t, newToast]);

    if (duration > 0) {
      setTimeout(() => {
        this.remove(id);
      }, duration);
    }
  }

  showSuccess(message: string, title?: string, actions?: ToastAction) {
    this.show(message, { type: 'success', title, actions });
  }

  showError(message: string, title?: string, actions?: ToastAction) {
    this.show(message, { type: 'error', title, actions });
  }

  showWarning(message: string, title?: string, actions?: ToastAction) {
    this.show(message, { type: 'warning', title, actions });
  }

  showInfo(message: string, title?: string, actions?: ToastAction) {
    this.show(message, { type: 'info', title, actions });
  }

  remove(id: string) {
    const found = this.toasts().find(t => t.id === id);
    if (found?.onDismiss) {
      try {
        found.onDismiss();
      } catch (e) {
        console.error(e);
      }
    }
    this.toasts.update(t => t.filter(toast => toast.id !== id));
  }
}
