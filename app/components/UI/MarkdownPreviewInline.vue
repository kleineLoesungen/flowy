<template>
  <div class="markdown-preview-inline-wrapper">
    <div class="markdown-preview-inline" v-html="renderedMarkdown"></div>
    <button 
      @click.stop="copyContent" 
      class="copy-btn"
      :class="{ 'copied': isCopied }"
      title="Copy content"
    >
      <svg v-if="!isCopied" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/>
      </svg>
      <svg v-else fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
      </svg>
    </button>
  </div>
</template>

<script setup lang="ts">
import { marked } from 'marked'

interface Props {
  content: string
}

const props = defineProps<Props>()

const isCopied = ref(false)

// Configure marked for security and inline rendering
marked.setOptions({
  breaks: true,
  gfm: true
})

const renderedMarkdown = computed(() => {
  if (!props.content || !props.content.trim()) {
    return ''
  }
  return marked.parse(props.content)
})

const copyContent = async () => {
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
</script>

<style scoped>
.markdown-preview-inline-wrapper {
  position: relative;
}

.copy-btn {
  position: absolute;
  top: 0;
  right: 0;
  width: 20px;
  height: 20px;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid #e2e8f0;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s ease;
  opacity: 0;
}

.markdown-preview-inline-wrapper:hover .copy-btn {
  opacity: 1;
}

.copy-btn:hover {
  background: #f8fafc;
  border-color: #cbd5e1;
}

.copy-btn.copied {
  background: #22c55e;
  border-color: #22c55e;
  color: white;
}

.copy-btn svg {
  width: 12px;
  height: 12px;
  color: inherit;
}

.copy-btn.copied svg {
  stroke: white;
}
.markdown-preview-inline {
  font-size: 0.8rem;
  color: #64748b;
  line-height: 1.4;
  overflow: hidden;
  text-overflow: ellipsis;
  max-height: 3.5em;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
}

/* Markdown content styling - compact for node display */
.markdown-preview-inline :deep(p) {
  margin: 0;
  display: inline;
}

.markdown-preview-inline :deep(strong),
.markdown-preview-inline :deep(b) {
  font-weight: 600;
}

.markdown-preview-inline :deep(em),
.markdown-preview-inline :deep(i) {
  font-style: italic;
}

.markdown-preview-inline :deep(code) {
  background: rgba(241, 245, 249, 0.8);
  padding: 0.1em 0.3em;
  border-radius: 3px;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 0.9em;
}

.markdown-preview-inline :deep(a) {
  color: #667eea;
  text-decoration: none;
}

.markdown-preview-inline :deep(ul),
.markdown-preview-inline :deep(ol) {
  display: none; /* Hide lists in compact view */
}

.markdown-preview-inline :deep(h1),
.markdown-preview-inline :deep(h2),
.markdown-preview-inline :deep(h3),
.markdown-preview-inline :deep(h4),
.markdown-preview-inline :deep(h5),
.markdown-preview-inline :deep(h6) {
  display: inline;
  font-size: inherit;
  font-weight: 600;
  margin: 0;
}
</style>
