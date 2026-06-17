import { reactive } from 'vue';

export interface Toast {
  id: string;
  type: 'error' | 'success' | 'info';
  message: string;
  details?: string;
  duration?: number;
}

export const toastState = reactive({
  toasts: [] as Toast[],
});

export function showToast(message: string, details?: string, type: 'error' | 'success' | 'info' = 'error', duration = 6000) {
  const id = Math.random().toString(36).substring(2, 9);
  const toast: Toast = { id, type, message, details, duration };
  toastState.toasts.push(toast);
  
  if (duration > 0) {
    setTimeout(() => {
      dismissToast(id);
    }, duration);
  }
}

export function dismissToast(id: string) {
  const index = toastState.toasts.findIndex(t => t.id === id);
  if (index !== -1) {
    toastState.toasts.splice(index, 1);
  }
}

export function extractApiError(e: any): { message: string; details?: string } {
  if (e?.response?.data) {
    const data = e.response.data;
    if (typeof data === 'object' && data !== null) {
      const message = data.error || data.message || 'Error del servidor';
      const details = data.details || undefined;
      return { message, details };
    }
  }
  return {
    message: e.message || 'Ocurrió un error inesperado al conectar con el servidor.',
    details: e.toString()
  };
}
