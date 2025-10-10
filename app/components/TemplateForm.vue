<template>
  <div class="template-form">
    <!-- Visual Flow Editor -->
    <FlowEditor 
      :template="template"
      :is-editing="isEditing"
      @save="handleSave"
      @cancel="$emit('cancel')"
    />
  </div>
</template>

<script setup lang="ts">
import type { FlowTemplate } from '../../types/FlowTemplate'
import FlowEditor from './FlowEditor.vue'

// Props and emits
const props = defineProps<{
  template?: FlowTemplate | null
  isEditing: boolean
}>()

const emit = defineEmits<{
  save: [template: FlowTemplate]
  cancel: []
}>()

// Handler for visual editor save
const handleSave = (template: FlowTemplate) => {
  emit('save', template)
}
</script>

<style scoped>
.template-form {
  width: 100%;
  height: 100%;
}
</style>