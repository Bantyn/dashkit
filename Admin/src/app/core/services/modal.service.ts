import { Injectable, signal } from '@angular/core';

export interface ModalOptions {
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmBtnClass?: string;
  showFooter?: boolean;
  isInputConfirm?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class ModalService {
  private _isOpen = signal(false);
  private _options = signal<ModalOptions>({
    title: 'Confirm Action',
    message: 'Are you sure you want to proceed?',
    confirmLabel: 'Confirm',
    cancelLabel: 'Cancel',
    confirmBtnClass: 'bg-primary-600 hover:bg-primary-700',
    showFooter: true,
    isInputConfirm: false
  });

  readonly confirmText = signal('');

  private _onConfirm: (() => void) | null = null;
  private _onCancel: (() => void) | null = null;

  get isOpen() { return this._isOpen(); }
  get options() { return this._options(); }

  get confirmDisabled() {
    return this._options().isInputConfirm ? this.confirmText() !== 'CONFIRM' : false;
  }

  updateConfirmText(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    this.confirmText.set(value);
  }

  open(options: ModalOptions): Promise<boolean> {
    this.confirmText.set('');
    this._options.set({
      confirmLabel: 'Confirm',
      cancelLabel: 'Cancel',
      confirmBtnClass: 'bg-primary-600 hover:bg-primary-700',
      showFooter: true,
      isInputConfirm: false,
      ...options
    });
    this._isOpen.set(true);

    return new Promise((resolve) => {
      this._onConfirm = () => {
        this.close();
        resolve(true);
      };
      this._onCancel = () => {
        this.close();
        resolve(false);
      };
    });
  }

  confirm() {
    if (this._onConfirm) this._onConfirm();
  }

  cancel() {
    if (this._onCancel) this._onCancel();
  }

  close() {
    this._isOpen.set(false);
  }
}
