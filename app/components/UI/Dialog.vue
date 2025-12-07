<template>
  <div v-if="show" class="dialog-overlay" @click="handleOverlayClick">
    <div class="dialog" @click.stop>
      <div class="dialog-header" v-if="title">
        <h3>{{ title }}</h3>
        <button v-if="showCloseButton" @click="handleClose" class="close-btn">
          <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      
      <div class="dialog-content">
        <div v-if="icon" class="dialog-icon" :class="iconClass">
          <component :is="iconComponent" />
        </div>
        
        <div class="dialog-message">
          <p v-if="message">{{ message }}</p>
          <slot v-else></slot>
        </div>
      </div>
      
      <div class="dialog-actions" v-if="type !== 'custom'">
        <button 
          v-if="type === 'confirm' || type === 'save-confirm'"
          @click="handleCancel" 
          class="btn btn-secondary"
        >
          {{ cancelText }}
        </button>
        <button 
          @click="handleConfirm" 
          class="btn"
          :class="confirmButtonClass"
        >
          {{ confirmText }}
        </button>
      </div>
      
      <div class="dialog-actions" v-else>
        <slot name="actions"></slot>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// Icon components
const InfoIcon = () => h('svg', { width: 24, height: 24, fill: 'currentColor', viewBox: '0 0 24 24' }, [
  h('path', { d: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z' })
])

const WarningIcon = () => h('svg', { width: 24, height: 24, fill: 'currentColor', viewBox: '0 0 24 24' }, [
  h('path', { d: 'M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z' })
])

const ErrorIcon = () => h('svg', { width: 24, height: 24, fill: 'currentColor', viewBox: '0 0 24 24' }, [
  h('path', { d: 'M12 2C6.47 2 2 6.47 2 12s4.47 10 10 10 10-4.47 10-10S17.53 2 12 2zm5 13.59L15.59 17 12 13.41 8.41 17 7 15.59 10.59 12 7 8.41 8.41 7 12 10.59 15.59 7 17 8.41 13.41 12 17 15.59z' })
])

const SaveIcon = () => h('svg', { width: 24, height: 24, fill: 'currentColor', viewBox: '0 0 24 24' }, [
  h('path', { d: 'M17 3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V7l-4-4zm-5 16c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3zm3-10H5V5h10v4z' })
])

interface Props {
  show: boolean
  type?: 'info' | 'warning' | 'error' | 'confirm' | 'save-confirm' | 'custom'
  title?: string
  message?: string
  icon?: 'info' | 'warning' | 'error' | 'save'
  confirmText?: string
  cancelText?: string
  showCloseButton?: boolean
  closeOnOverlayClick?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  type: 'info',
  confirmText: 'OK',
  cancelText: 'Cancel',
  showCloseButton: true,
  closeOnOverlayClick: true
})

const emit = defineEmits<{
  confirm: []
  cancel: []
  close: []
}>()

const iconComponent = computed(() => {
  switch (props.icon) {
    case 'info': return InfoIcon
    case 'warning': return WarningIcon
    case 'error': return ErrorIcon
    case 'save': return SaveIcon
    default: return null
  }
})

const iconClass = computed(() => {
  switch (props.icon) {
    case 'info': return 'icon-info'
    case 'warning': return 'icon-warning'
    case 'error': return 'icon-error'
    case 'save': return 'icon-save'
    default: return ''
  }
})

const confirmButtonClass = computed(() => {
  switch (props.type) {
    case 'error': return 'btn-danger'
    case 'save-confirm': return 'btn-success'
    case 'warning': return 'btn-warning'
    default: return 'btn-primary'
  }
})

const handleConfirm = () => {
  emit('confirm')
}

const handleCancel = () => {
  emit('cancel')
}

const handleClose = () => {
  emit('close')
}

const handleOverlayClick = () => {
  if (props.closeOnOverlayClick) {
    emit('close')
  }
}
</script>

<style scoped>
.dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  animation: fadeIn 0.2s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.dialog {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 250, 252, 0.95) 100%);
  backdrop-filter: blur(20px);
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.3);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
  min-width: 400px;
  max-width: 600px;
  max-height: 80vh;
  overflow: hidden;
  animation: slideIn 0.3s ease-out;
}

@keyframes slideIn {
  from { 
    opacity: 0;
    transform: scale(0.9) translateY(-20px);
  }
  to { 
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

.dialog-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.5rem 2rem 0 2rem;
}

.dialog-header h3 {
  margin: 0;
  color: #2d3748;
  font-size: 1.25rem;
  font-weight: 600;
}

.close-btn {
  background: none;
  border: none;
  color: #64748b;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 8px;
  transition: all 0.2s ease;
}

.close-btn:hover {
  background: rgba(100, 116, 139, 0.1);
  color: #475569;
}

.dialog-content {
  padding: 1.5rem 2rem;
  display: flex;
  align-items: flex-start;
  gap: 1.5rem;
}

.dialog-icon {
  flex-shrink: 0;
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.icon-info {
  background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
  color: white;
}

.icon-warning {
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
  color: white;
}

.icon-error {
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
  color: white;
}

.icon-save {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
}

.dialog-message {
  flex: 1;
  min-width: 0;
}

.dialog-message p {
  margin: 0;
  color: #475569;
  font-size: 1rem;
  line-height: 1.6;
}

.dialog-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  padding: 0 2rem 2rem 2rem;
}

.btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s ease;
  font-size: 0.875rem;
}

.btn-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.btn-primary:hover {
  background: linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%);
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
}

.btn-secondary {
  background: linear-gradient(135deg, #e2e8f0 0%, #cbd5e1 100%);
  color: #475569;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.btn-secondary:hover {
  background: linear-gradient(135deg, #cbd5e1 0%, #b0bec5 100%);
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
}

.btn-success {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
}

.btn-success:hover {
  background: linear-gradient(135deg, #0d9488 0%, #047857 100%);
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(16, 185, 129, 0.4);
}

.btn-warning {
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
  color: white;
  box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3);
}

.btn-warning:hover {
  background: linear-gradient(135deg, #e59400 0%, #c2610c 100%);
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(245, 158, 11, 0.4);
}

.btn-danger {
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
  color: white;
  box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
}

.btn-danger:hover {
  background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(239, 68, 68, 0.4);
}

/* Responsive */
@media (max-width: 768px) {
  .dialog {
    min-width: 300px;
    margin: 1rem;
    max-width: calc(100vw - 2rem);
  }
  
  .dialog-content {
    flex-direction: column;
    text-align: center;
  }
  
  .dialog-actions {
    flex-direction: column;
  }
}
</style>