import { create } from 'zustand';

export interface Toast {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message?: string;
  duration?: number;
}

interface UIState {
  isLoginOpen:    boolean;
  isRegisterOpen: boolean;
  toasts:         Toast[];
  isPageLoading:  boolean;

  openLogin:     () => void;
  closeLogin:    () => void;
  openRegister:  () => void;
  closeRegister: () => void;
  addToast:      (toast: Omit<Toast, 'id'>) => void;
  removeToast:   (id: string) => void;
  setPageLoading:(v: boolean) => void;
}

export const useUIStore = create<UIState>((set) => ({
  isLoginOpen:    false,
  isRegisterOpen: false,
  toasts:         [],
  isPageLoading:  false,

  openLogin:      () => set({ isLoginOpen: true,  isRegisterOpen: false }),
  closeLogin:     () => set({ isLoginOpen: false }),
  openRegister:   () => set({ isRegisterOpen: true,  isLoginOpen: false }),
  closeRegister:  () => set({ isRegisterOpen: false }),
  addToast: (toast) =>
    set((s) => ({
      toasts: [
        ...s.toasts,
        { ...toast, id: `${Date.now()}-${Math.random().toString(36).slice(2)}` },
      ],
    })),
  removeToast: (id) =>
    set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
  setPageLoading: (v) => set({ isPageLoading: v }),
}));
