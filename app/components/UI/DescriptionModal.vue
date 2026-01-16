<template>
  <Teleport to="body">
    <div v-if="isOpen" class="description-modal-overlay" @click="handleClose">
      <div class="description-modal" @click.stop>
        <div class="modal-header">
          <h3>{{ title || 'Description' }}</h3>
          <div class="header-actions">
            <button type="button" @click="copyContent" class="copy-button" :class="{ 'copied': isCopied }">
              <svg v-if="!isCopied" width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/>
              </svg>
              <svg v-else width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
              </svg>
            </button>
            <button @click="handleClose" class="close-button">
              <span class="close-icon">×</span>
            </button>
          </div>
        </div>
        <div class="modal-body">
          <div class="markdown-content" v-html="renderedMarkdown"></div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { marked } from 'marked'

interface Props {
  isOpen: boolean
  title?: string
  content: string
}

const props = defineProps<Props>()
const emit = defineEmits<{
  close: []
}>()

const isCopied = ref(false)

// Configure marked
marked.setOptions({
  breaks: true,
  gfm: true
})

const renderedMarkdown = computed(() => {
  if (!props.content || !props.content.trim()) {
    return '<p class="no-content">No description available</p>'
  }
  return marked.parse(props.content)
})

const copyContent = async (event: MouseEvent) => {
  event.preventDefault()
  event.stopPropagation()
  try {
    await navigator.clipboard.writeText(props.content)
    isCopied.value = true
    setTimeout(() => {
      isCopied.value = false
    }, 2000)
  } catch (err) {
    console.error('Failed to copy:', err)
  }
}

const handleClose = () => {
  emit('close')
}

// Close on escape key
const handleKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Escape' && props.isOpen) {
    handleClose()
  }
}

watch(() => props.isOpen, (newValue) => {
  if (newValue) {
    document.addEventListener('keydown', handleKeydown)
  } else {
    document.removeEventListener('keydown', handleKeydown)
  }
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
})
</script>

<style scoped>
.description-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  padding: 2rem;
}

.description-modal {
  background: white;
  border-radius: 16px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  max-width: 800px;
  width: 100%;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem 2rem;
  border-bottom: 1px solid #e2e8f0;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
}

.modal-header h3 {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 700;
  color: #1e293b;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.copy-button {
  width: 36px;
  height: 36px;
  border: none;
  border-radius: 50%;
  background: rgba(226, 232, 240, 0.5);
  color: #64748b;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.copy-button:hover {
  background: rgba(102, 126, 234, 0.1);
  color: #667eea;
  transform: scale(1.05);
}

.copy-button.copied {
  background: #22c55e;
  color: white;
}

.copy-button svg {
  width: 18px;
  height: 18px;
}

.close-button {
  width: 36px;
  height: 36px;
  border: none;
  border-radius: 50%;
  background: rgba(226, 232, 240, 0.5);
  color: #64748b;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.close-button:hover {
  background: #ef4444;
  color: white;
  transform: scale(1.1);
}

.close-icon {
  font-size: 1.5rem;
  font-weight: bold;
  line-height: 1;
}

.modal-body {
  padding: 2rem;
  overflow-y: auto;
  flex: 1;
}

.markdown-content {
  color: #334155;
  line-height: 1.7;
}

.no-content {
  color: #94a3b8;
  font-style: italic;
  text-align: center;
  padding: 2rem;
}

/* Markdown styling */
.markdown-content :deep(h1),
.markdown-content :deep(h2),
.markdown-content :deep(h3),
.markdown-content :deep(h4),
.markdown-content :deep(h5),
.markdown-content :deep(h6) {
  margin-top: 1.5em;
  margin-bottom: 0.5em;
  font-weight: 700;
  line-height: 1.3;
  color: #1e293b;
}

.markdown-content :deep(h1) {
  font-size: 2em;
  border-bottom: 2px solid #e2e8f0;
  padding-bottom: 0.3em;
}

.markdown-content :deep(h2) {
  font-size: 1.5em;
  border-bottom: 1px solid #e2e8f0;
  padding-bottom: 0.3em;
}

.markdown-content :deep(h3) {
  font-size: 1.25em;
}

.markdown-content :deep(h4) {
  font-size: 1.1em;
}

.markdown-content :deep(p) {
  margin-bottom: 1em;
}

.markdown-content :deep(strong),
.markdown-content :deep(b) {
  font-weight: 600;
  color: #0f172a;
}

.markdown-content :deep(em),
.markdown-content :deep(i) {
  font-style: italic;
}

.markdown-content :deep(code) {
  background: #f1f5f9;
  padding: 0.2em 0.4em;
  border-radius: 4px;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 0.9em;
  color: #e11d48;
}

.markdown-content :deep(pre) {
  background: #1e293b;
  color: #e2e8f0;
  padding: 1em;
  border-radius: 8px;
  overflow-x: auto;
  margin: 1em 0;
}

.markdown-content :deep(pre code) {
  background: none;
  padding: 0;
  color: inherit;
  font-size: 0.875em;
}

.markdown-content :deep(blockquote) {
  border-left: 4px solid #667eea;
  padding-left: 1em;
  margin: 1em 0;
  color: #475569;
  font-style: italic;
}

.markdown-content :deep(ul),
.markdown-content :deep(ol) {
  margin: 1em 0;
  padding-left: 2em;
  list-style-position: outside;
}

.markdown-content :deep(ul) {
  list-style-type: disc;
  display: block;
}

.markdown-content :deep(ol) {
  list-style-type: decimal;
  display: block;
}

.markdown-content :deep(li) {
  margin: 0.5em 0;
  display: list-item;
}

.markdown-content :deep(a) {
  color: #667eea;
  text-decoration: none;
  border-bottom: 1px solid transparent;
  transition: border-color 0.2s;
}

.markdown-content :deep(a:hover) {
  border-bottom-color: #667eea;
}

.markdown-content :deep(table) {
  border-collapse: collapse;
  width: 100%;
  margin: 1em 0;
}

.markdown-content :deep(th),
.markdown-content :deep(td) {
  border: 1px solid #e2e8f0;
  padding: 0.75em;
  text-align: left;
}

.markdown-content :deep(th) {
  background: #f8fafc;
  font-weight: 600;
}

.markdown-content :deep(hr) {
  border: none;
  border-top: 2px solid #e2e8f0;
  margin: 2em 0;
}

.markdown-content :deep(img) {
  max-width: 100%;
  height: auto;
  border-radius: 8px;
  margin: 1em 0;
}

@media (max-width: 768px) {
  .description-modal-overlay {
    padding: 1rem;
  }

  .description-modal {
    max-height: 90vh;
  }

  .modal-header {
    padding: 1rem 1.5rem;
  }

  .modal-header h3 {
    font-size: 1.25rem;
  }

  .modal-body {
    padding: 1.5rem;
  }
}
</style>
