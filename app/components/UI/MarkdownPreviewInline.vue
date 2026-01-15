<template>
  <div class="markdown-preview-inline" v-html="renderedMarkdown"></div>
</template>

<script setup lang="ts">
import { marked } from 'marked'

interface Props {
  content: string
}

const props = defineProps<Props>()

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
</script>

<style scoped>
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
