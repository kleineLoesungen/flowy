<template>
  <div class="markdown-editor">
    <!-- Mode Toggle -->
    <div class="editor-toolbar">
      <div class="mode-toggle">
        <button 
          @click="mode = 'edit'" 
          :class="{ active: mode === 'edit' }"
          class="mode-btn"
          type="button"
        >
          <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
          </svg>
          Edit
        </button>
        <button 
          @click="mode = 'preview'" 
          :class="{ active: mode === 'preview' }"
          class="mode-btn"
          type="button"
        >
          <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
          </svg>
          Preview
        </button>
      </div>
    </div>

    <!-- Editor or Preview -->
    <div class="editor-content">
      <!-- Edit Mode -->
      <textarea
        v-if="mode === 'edit'"
        :value="modelValue"
        @input="$emit('update:modelValue', ($event.target as HTMLTextAreaElement).value)"
        :placeholder="placeholder"
        :rows="rows"
        :disabled="disabled"
        class="markdown-textarea"
      ></textarea>

      <!-- Preview Mode -->
      <div v-else class="markdown-preview-wrapper">
        <button type="button" @click="copyContent" class="copy-btn" :class="{ 'copied': isCopied }">
          <svg v-if="!isCopied" width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/>
          </svg>
          <svg v-else width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
          </svg>
        </button>
        <div
          class="markdown-preview"
          v-html="renderedMarkdown"
        ></div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { marked } from 'marked'

interface Props {
  modelValue: string
  placeholder?: string
  rows?: number
  disabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: 'Enter markdown text...',
  rows: 10,
  disabled: false
})

defineEmits<{
  'update:modelValue': [value: string]
}>()

const mode = ref<'edit' | 'preview'>('preview')
const isCopied = ref(false)

// Configure marked for security
marked.setOptions({
  breaks: true,
  gfm: true
})

const renderedMarkdown = computed(() => {
  if (!props.modelValue || !props.modelValue.trim()) {
    return '<p class="empty-preview">No content yet. Switch to edit mode to add content.</p>'
  }
  return marked.parse(props.modelValue)
})

const copyContent = async (event: MouseEvent) => {
  event.preventDefault()
  event.stopPropagation()
  try {
    await navigator.clipboard.writeText(props.modelValue)
    isCopied.value = true
    setTimeout(() => {
      isCopied.value = false
    }, 2000)
  } catch (err) {
    console.error('Failed to copy:', err)
  }
}
</script>

<style scoped>
.markdown-editor {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  width: 100%;
}

.editor-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(248, 250, 252, 0.9) 100%);
  border: 1px solid rgba(148, 163, 184, 0.2);
  border-radius: 8px 8px 0 0;
}

.mode-toggle {
  display: flex;
  gap: 0.25rem;
  background: rgba(255, 255, 255, 0.5);
  padding: 0.25rem;
  border-radius: 6px;
}

.mode-btn {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.375rem 0.75rem;
  background: transparent;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 500;
  color: #64748b;
  transition: all 0.2s ease;
}

.mode-btn svg {
  width: 16px;
  height: 16px;
}

.mode-btn:hover {
  background: rgba(102, 126, 234, 0.1);
  color: #667eea;
}

.mode-btn.active {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.editor-content {
  min-height: 200px;
  position: relative;
}

.markdown-preview-wrapper {
  position: relative;
  min-height: 200px;
}

.markdown-textarea {
  width: 100%;
  min-height: 200px;
  padding: 1rem;
  border: 1px solid rgba(148, 163, 184, 0.2);
  border-radius: 0 0 8px 8px;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 0.875rem;
  line-height: 1.6;
  resize: vertical;
  background: white;
  color: #2d3748;
}

.markdown-textarea:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.markdown-textarea:disabled {
  background: #f8fafc;
  cursor: not-allowed;
  opacity: 0.6;
}

.markdown-preview-wrapper .copy-btn {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  padding: 0.5rem;
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  cursor: pointer;
  opacity: 0;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
}

.markdown-preview-wrapper:hover .copy-btn {
  opacity: 1;
}

.markdown-preview-wrapper .copy-btn:hover {
  background: rgba(255, 255, 255, 1);
  border-color: #667eea;
}

.markdown-preview-wrapper .copy-btn.copied {
  background: #22c55e;
  border-color: #22c55e;
  opacity: 1;
}

.markdown-preview-wrapper .copy-btn.copied svg {
  stroke: white;
}

.markdown-preview-wrapper .copy-btn svg {
  width: 16px;
  height: 16px;
  stroke: #64748b;
}

.markdown-preview {
  min-height: 200px;
  padding: 1rem;
  border: 1px solid rgba(148, 163, 184, 0.2);
  border-radius: 0 0 8px 8px;
  background: white;
  color: #2d3748;
  line-height: 1.6;
  overflow-wrap: break-word;
}

/* Markdown content styling */
.markdown-preview :deep(h1),
.markdown-preview :deep(h2),
.markdown-preview :deep(h3),
.markdown-preview :deep(h4),
.markdown-preview :deep(h5),
.markdown-preview :deep(h6) {
  margin-top: 1.5em;
  margin-bottom: 0.5em;
  font-weight: 600;
  line-height: 1.25;
  color: #1e293b;
}

.markdown-preview :deep(h1) {
  font-size: 1.875rem;
  border-bottom: 2px solid #e2e8f0;
  padding-bottom: 0.3em;
}

.markdown-preview :deep(h2) {
  font-size: 1.5rem;
  border-bottom: 1px solid #e2e8f0;
  padding-bottom: 0.3em;
}

.markdown-preview :deep(h3) {
  font-size: 1.25rem;
}

.markdown-preview :deep(h4) {
  font-size: 1.125rem;
}

.markdown-preview :deep(p) {
  margin-top: 0;
  margin-bottom: 1em;
}

.markdown-preview :deep(ul),
.markdown-preview :deep(ol) {
  margin-top: 0;
  margin-bottom: 1em;
  padding-left: 2em;
  list-style-position: outside;
}

.markdown-preview :deep(ul) {
  list-style-type: disc;
  display: block;
}

.markdown-preview :deep(ol) {
  list-style-type: decimal;
  display: block;
}

.markdown-preview :deep(li) {
  margin-bottom: 0.25em;
  display: list-item;
}

.markdown-preview :deep(code) {
  background: #f1f5f9;
  padding: 0.2em 0.4em;
  border-radius: 3px;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 0.875em;
  color: #e74c3c;
}

.markdown-preview :deep(pre) {
  background: #1e293b;
  color: #f8fafc;
  padding: 1em;
  border-radius: 6px;
  overflow-x: auto;
  margin-bottom: 1em;
}

.markdown-preview :deep(pre code) {
  background: none;
  padding: 0;
  color: inherit;
  font-size: 0.875rem;
}

.markdown-preview :deep(blockquote) {
  border-left: 4px solid #667eea;
  padding-left: 1em;
  margin-left: 0;
  color: #64748b;
  font-style: italic;
}

.markdown-preview :deep(a) {
  color: #667eea;
  text-decoration: none;
  border-bottom: 1px solid transparent;
  transition: border-color 0.2s;
}

.markdown-preview :deep(a:hover) {
  border-bottom-color: #667eea;
}

.markdown-preview :deep(hr) {
  border: none;
  border-top: 2px solid #e2e8f0;
  margin: 2em 0;
}

.markdown-preview :deep(table) {
  border-collapse: collapse;
  width: 100%;
  margin-bottom: 1em;
}

.markdown-preview :deep(th),
.markdown-preview :deep(td) {
  border: 1px solid #e2e8f0;
  padding: 0.5em 1em;
  text-align: left;
}

.markdown-preview :deep(th) {
  background: #f8fafc;
  font-weight: 600;
}

.markdown-preview :deep(img) {
  max-width: 100%;
  height: auto;
  border-radius: 6px;
}

.markdown-preview :deep(.empty-preview) {
  color: #94a3b8;
  font-style: italic;
}
</style>
