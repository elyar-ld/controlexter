<template>
  <div class="toast-container">
    <transition-group name="toast-list">
      <div
        v-for="toast in toastState.toasts"
        :key="toast.id"
        class="toast-card"
        :class="toast.type"
      >
        <div class="toast-content">
          <span class="mdi toast-icon" :class="getIcon(toast.type)"></span>
          <div class="toast-text">
            <div class="toast-message">{{ toast.message }}</div>
            <div v-if="toast.details" class="toast-details">{{ toast.details }}</div>
          </div>
          <button class="toast-close" @click="dismiss(toast.id)">
            <span class="mdi mdi-close"></span>
          </button>
        </div>
      </div>
    </transition-group>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { toastState, dismissToast } from '../utils/toast';

export default defineComponent({
  name: 'ToastContainer',
  setup() {
    const dismiss = (id: string) => {
      dismissToast(id);
    };

    const getIcon = (type: 'error' | 'success' | 'info') => {
      switch (type) {
        case 'error':
          return 'mdi-alert-circle';
        case 'success':
          return 'mdi-check-circle';
        case 'info':
          return 'mdi-information';
      }
    };

    return {
      toastState,
      dismiss,
      getIcon,
    };
  },
});
</script>

<style scoped>
.toast-container {
  position: fixed;
  top: 24px;
  right: 24px;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-width: 400px;
  width: 90%;
  pointer-events: none;
}

.toast-card {
  pointer-events: auto;
  background: white;
  border-radius: 12px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.12);
  padding: 16px;
  border-left: 5px solid #ccc;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  transition: all 0.3s ease;
}

.toast-card.error {
  border-left-color: #f44336;
  background: #fff5f5;
}

.toast-card.success {
  border-left-color: #27b100;
  background: #f5fff5;
}

.toast-card.info {
  border-left-color: #2196f3;
  background: #f5faff;
}

.toast-content {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.toast-icon {
  font-size: 1.4rem;
  margin-top: 1px;
}

.error .toast-icon {
  color: #f44336;
}

.success .toast-icon {
  color: #27b100;
}

.info .toast-icon {
  color: #2196f3;
}

.toast-text {
  flex: 1;
}

.toast-message {
  font-size: 0.95rem;
  font-weight: 600;
  color: #333;
  line-height: 1.4;
  white-space: pre-line;
}

.toast-details {
  font-size: 0.8rem;
  color: #666;
  margin-top: 6px;
  background: rgba(0, 0, 0, 0.04);
  padding: 6px 10px;
  border-radius: 6px;
  font-family: monospace;
  word-break: break-all;
  max-height: 120px;
  overflow-y: auto;
}

.toast-close {
  background: transparent;
  border: none;
  color: #999;
  cursor: pointer;
  padding: 2px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 0.15s;
}

.toast-close:hover {
  color: #333;
}

/* Animations */
.toast-list-enter-from {
  opacity: 0;
  transform: translateX(50px) scale(0.9);
}
.toast-list-leave-to {
  opacity: 0;
  transform: translateX(50px);
}

/* Dark mode overrides */
@media (prefers-color-scheme: dark) {
  .toast-card {
    background: #222;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
  }
  .toast-card.error {
    background: #2a1515;
  }
  .toast-card.success {
    background: #152a15;
  }
  .toast-card.info {
    background: #15202a;
  }
  .toast-message {
    color: #e0e0e0;
  }
  .toast-details {
    color: #aaa;
    background: rgba(255, 255, 255, 0.05);
  }
  .toast-close:hover {
    color: #e0e0e0;
  }
}
</style>
