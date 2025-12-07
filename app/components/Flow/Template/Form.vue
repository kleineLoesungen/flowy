<template>
  <TemplateEditor 
    :template="template" 
    :is-editing="isEditing" 
    @save="$emit('save', $event)" 
    @cancel="$emit('cancel')" 
  />
</template>

<script setup lang="ts">
import TemplateEditor from './Editor.vue'

// Use the same local type definition as the Editor
type ElementTemplate = {
  id: string
  name: string
  description: string
  ownerTeamId: string | null
  durationDays: number | null
  type: 'action' | 'state' | 'artefact'
  consultedTeamIds: string[]
}

type Relation = {
  id: string
  type: 'flow' | 'or' | 'and' | 'in' | 'out'
  connections: Array<{
    fromElementId: string
    toElementId: string
    sourceHandle?: string
    targetHandle?: string
  }>
}

type FlowTemplate = {
  id: string
  name: string
  description: string
  elements: ElementTemplate[]
  relations: Relation[]
  startingElementId: string | null
  layout?: { [elementId: string]: { x: number; y: number } } | null
}

defineProps<{
  template?: FlowTemplate | null
  isEditing: boolean
}>()

defineEmits<{
  save: [template: FlowTemplate]
  cancel: []
}>()
</script>