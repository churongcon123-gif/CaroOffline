import { create } from 'zustand';

/**
 * useToastStore — Zustand store quản lý các thông báo (toast notifications)
 * 
 * Methods:
 *   addToast(message, type, duration) - Hiển thị thông báo mới
 *   removeToast(id) - Xóa thông báo thủ công
 */
const useToastStore = create((set) => ({
  toasts: [],

  addToast: (message, type = 'info', duration = 4000) => {
    const id = Date.now() + Math.random();
    set((state) => ({
      toasts: [...state.toasts, { id, message, type }]
    }));

    setTimeout(() => {
      set((state) => ({
        toasts: state.toasts.filter((t) => t.id !== id)
      }));
    }, duration);
  },

  removeToast: (id) => {
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id)
    }));
  }
}));

export default useToastStore;
