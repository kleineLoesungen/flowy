<template>
  <div class="flow-instances-overview">
    <!-- Empty state -->
    <div v-if="flows.length === 0" class="empty-state">
      <p>No flow instances found</p>
    </div>

    <!-- Flows list -->
    <div v-else class="instances-list">
      <div class="list-header">
        <div class="col-title">Flow Instances</div>
        <div class="col-status"></div>
        <div class="col-progress"></div>
        <div class="col-actions"></div>
      </div>
      
      <div 
        v-for="flow in flows" 
        :key="flow.id" 
        class="instance-row"
      >
        <div class="col-title">
          <h3>{{ flow.name }}</h3>
          <p class="description">{{ flow.description }}</p>
        </div>
        
        <div class="col-status">
          <span class="status-badge" :class="flow.status">
            {{ flow.status }}
          </span>
        </div>
        
        <div class="col-progress">
          <div class="progress-bar">
            <div class="progress-fill" :style="{ width: `${flow.progress || 0}%` }"></div>
          </div>
          <span class="progress-text">{{ flow.progress || 0 }}%</span>
        </div>
        
        <div class="col-actions">
          <button @click="$emit('work', flow)" class="btn btn-primary">
            Work
          </button>
          <button @click="$emit('delete', flow)" class="btn btn-danger">
            Delete
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// Props
defineProps<{
  flows: any[]
}>()

// Emits
defineEmits<{
  work: [flow: any]
  delete: [flow: any]
}>()
</script>

<style scoped>
.flow-instances-overview {
  width: 100%;
}

.empty-state {
  text-align: center;
  padding: 4rem;
  color: #64748b;
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%);
  backdrop-filter: blur(10px);
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.3);
  box-shadow: 0 8px 32px rgba(102, 126, 234, 0.08);
}

.instances-list {
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 20px;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(15px);
  box-shadow: 0 8px 32px rgba(102, 126, 234, 0.1);
}

.list-header {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 1fr;
  gap: 1rem;
  padding: 1.5rem 2rem;
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%);
  border-bottom: 1px solid rgba(255, 255, 255, 0.3);
  font-weight: 700;
  color: #475569;
  font-size: 0.875rem;
  text-transform: uppercase;
  letter-spacing: 0.8px;
}

.instance-row {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 1fr;
  gap: 1rem;
  padding: 1.5rem 2rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
  transition: all 0.3s ease;
  position: relative;
}

.instance-row:hover {
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.08) 0%, rgba(118, 75, 162, 0.08) 100%);
  transform: translateY(-1px);
  box-shadow: 0 4px 20px rgba(102, 126, 234, 0.1);
}

.instance-row:last-child {
  border-bottom: none;
}

.col-title h3 {
  margin: 0 0 0.25rem 0;
  background: linear-gradient(135deg, #475569 0%, #334155 100%);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  font-size: 1.1rem;
  font-weight: 700;
}

.description {
  margin: 0;
  color: #64748b;
  font-size: 0.875rem;
  line-height: 1.5;
}

.col-status,
.col-progress {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.status-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
}

.status-badge.active {
  background: rgba(34, 197, 94, 0.1);
  color: #059669;
  border: 1px solid rgba(34, 197, 94, 0.2);
}

.status-badge.pending {
  background: rgba(251, 191, 36, 0.1);
  color: #d97706;
  border: 1px solid rgba(251, 191, 36, 0.2);
}

.status-badge.completed {
  background: rgba(59, 130, 246, 0.1);
  color: #2563eb;
  border: 1px solid rgba(59, 130, 246, 0.2);
}

.progress-bar {
  width: 80px;
  height: 6px;
  background: rgba(203, 213, 225, 0.5);
  border-radius: 3px;
  overflow: hidden;
  margin-bottom: 0.25rem;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
  border-radius: 3px;
  transition: width 0.3s ease;
}

.progress-text {
  font-size: 0.75rem;
  color: #64748b;
  font-weight: 500;
}

.col-actions {
  display: flex;
  gap: 0.5rem;
  align-items: center;
  justify-content: flex-end;
}

.btn {
  padding: 0.6rem 1.2rem;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s ease;
  font-size: 0.85rem;
  position: relative;
  overflow: hidden;
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

.btn-danger {
  background: linear-gradient(135deg, #f87171 0%, #dc2626 100%);
  color: white;
  box-shadow: 0 4px 12px rgba(220, 38, 38, 0.3);
}

.btn-danger:hover {
  background: linear-gradient(135deg, #ef4444 0%, #b91c1c 100%);
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(220, 38, 38, 0.4);
}

/* Responsive design */
@media (max-width: 768px) {
  .list-header,
  .instance-row {
    grid-template-columns: 1fr;
    gap: 0.5rem;
  }
  
  .list-header {
    display: none;
  }
  
  .instance-row {
    padding: 1rem;
  }
  
  .col-title,
  .col-status,
  .col-progress,
  .col-actions {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  
  .col-status::before {
    content: 'Status:';
    font-weight: 600;
    color: #34495e;
  }
  
  .col-progress::before {
    content: 'Progress:';
    font-weight: 600;
    color: #34495e;
  }
  
  .col-actions {
    justify-content: flex-start;
    margin-top: 1rem;
    padding-top: 1rem;
    border-top: 1px solid #f0f0f0;
  }
}
</style>
