<template>
  <div class="flow-templates-overview">
    <!-- Empty state -->
    <div v-if="templates.length === 0" class="empty-state">
      <p>No flow templates found</p>
    </div>

    <!-- Templates list -->
    <div v-else class="templates-list">
      <div class="list-header">
        <div class="col-title">Templates</div>
        <div class="col-elements"></div>
        <div class="col-duration"></div>
        <div class="col-actions"></div>
      </div>
      
      <div 
        v-for="template in templates" 
        :key="template.id" 
        class="template-row"
      >
        <div class="col-title">
          <h3>{{ template.name }}</h3>
          <p class="description">{{ template.description }}</p>
        </div>
        
        <div class="col-elements">
          <span class="count">{{ template.elements.length }}</span>
          <span class="label">{{ template.elements.length === 1 ? 'element' : 'elements' }}</span>
        </div>
        
        <div class="col-duration">
          <div class="duration-info">
            <span class="duration-main">
              {{ formatDurationRange(calculateFlowDuration(template)) }}
            </span>
            <span class="label">
              {{ getDurationLabel(calculateFlowDuration(template)) }}
            </span>
          </div>
        </div>
        
        <div class="col-actions">
          <button @click="viewTemplate(template)" class="btn btn-primary">
            View
          </button>
          <button @click="$emit('edit', template)" class="btn btn-secondary">
            Edit
          </button>
          <button @click="$emit('delete', template)" class="btn btn-danger">
            Delete
          </button>
        </div>
      </div>
    </div>
  </div>

  <!-- Flow Viewer Modal -->
  <FlowViewer 
    v-if="showVisualizationModal"
    :template="selectedTemplate"
    @close="closeVisualizationModal"
  />
</template>

<script setup lang="ts">
import type { FlowTemplate } from '../../types/FlowTemplate'
import { 
  calculateTotalDuration, 
  calculateFlowDuration, 
  formatDurationRange, 
  getDurationLabel 
} from '../../utils/flowDurationCalculator'

// Props
defineProps<{
  templates: FlowTemplate[]
}>()

// Emits
defineEmits<{
  edit: [template: FlowTemplate]
  delete: [template: FlowTemplate]
}>()

// Reactive state for modal
const showVisualizationModal = ref(false)
const selectedTemplate = ref<FlowTemplate | null>(null)

// View template in modal
const viewTemplate = (template: FlowTemplate) => {
  selectedTemplate.value = template
  showVisualizationModal.value = true
}

// Close visualization modal
const closeVisualizationModal = () => {
  showVisualizationModal.value = false
  selectedTemplate.value = null
}
</script>

<style scoped>
.flow-templates-overview {
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

.templates-list {
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

.template-row {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 1fr;
  gap: 1rem;
  padding: 1.5rem 2rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
  transition: all 0.3s ease;
  position: relative;
}

.template-row:hover {
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.08) 0%, rgba(118, 75, 162, 0.08) 100%);
  transform: translateY(-1px);
  box-shadow: 0 4px 20px rgba(102, 126, 234, 0.1);
}

.template-row:last-child {
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

.col-elements,
.col-duration {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.count,
.duration-main {
  font-size: 1.25rem;
  font-weight: 600;
  color: #2c3e50;
  line-height: 1;
}

.duration-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.duration-detail {
  font-size: 0.7rem;
  color: #95a5a6;
  margin-top: 0.125rem;
  font-style: italic;
}

.duration-help {
  display: inline-block;
  width: 18px;
  height: 18px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 50%;
  font-size: 0.7rem;
  font-weight: bold;
  text-align: center;
  line-height: 18px;
  margin-left: 0.5rem;
  cursor: help;
  font-style: normal;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
}

.duration-help:hover {
  background: linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%);
  transform: scale(1.1);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.label {
  font-size: 0.75rem;
  color: #7f8c8d;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-top: 0.25rem;
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
  .template-row {
    grid-template-columns: 1fr;
    gap: 0.5rem;
  }
  
  .list-header {
    display: none; /* Hide header on mobile */
  }
  
  .template-row {
    padding: 1rem;
  }
  
  .col-title,
  .col-elements,
  .col-duration,
  .col-actions {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  
  .col-elements::before {
    content: 'Elements:';
    font-weight: 600;
    color: #34495e;
  }
  
  .col-duration::before {
    content: 'Duration:';
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