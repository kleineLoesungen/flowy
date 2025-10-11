<template>
  <FlowEditor 
    :template="template" 
    :is-editing="isEditing" 
    @save="$emit('save', $event)" 
    @cancel="$emit('cancel')" 
  />
</template>

<script setup lang="ts">
import type { FlowTemplate } from '../../types/FlowTemplate'
import FlowEditor from '~/components/FlowEditor.vue'

defineProps<{
  template?: FlowTemplate | null
  isEditing: boolean
}>()

defineEmits<{
  save: [template: FlowTemplate]
  cancel: []
}>()
</script>