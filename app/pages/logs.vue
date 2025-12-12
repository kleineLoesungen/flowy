<template>
  <div class="logs-page">
    <h2 class="page-title">Activity Logs</h2>

    <div class="filters-card">
      <div class="filter-row">
        <div class="filter-item type-filter">
          <label>Type</label>
          <button ref="typeButton" class="type-dropdown-button" @click.stop="openTypeMenu" :title="typeLabel">
            <span class="btn-label">{{ typeLabel }}</span>
            <span class="caret">▾</span>
          </button>

          <teleport to="body">
            <div v-if="showTypeMenu" class="type-menu card" :style="typeMenuStyle" @click.stop>
              <div class="type-menu-list">
                <label class="type-item">
                  <input type="checkbox" :checked="filters.type.length === 0" @change="clearTypes" />
                  <span>All</span>
                </label>
                <label class="type-item" v-for="t in types" :key="t.value">
                  <input type="checkbox" :value="t.value" :checked="filters.type.includes(t.value)" @change="toggleTypeValue(t.value)" />
                  <span>{{ t.label }}</span>
                </label>
              </div>
            </div>
          </teleport>
        </div>

        <div class="filter-item">
          <label>Flow</label>
          <button ref="flowButton" class="type-dropdown-button" @click.stop="openFlowMenu" :title="flowLabel"><span class="btn-label">{{ flowLabel }}</span></button>
          <teleport to="body">
            <div v-if="showFlowMenu" class="type-menu card" :style="flowMenuStyle" @click.stop>
              <div class="type-menu-list">
                <label class="type-item"><input type="radio" name="flow" :checked="!filters.flowId" @change="selectFlow('')" /> <span>(any)</span></label>
                <label class="type-item" v-for="f in flows" :key="f.id"><input type="radio" name="flow" :checked="filters.flowId===f.id" @change="selectFlow(f.id)" /> <span>{{ f.name }} — {{ f.id }}</span></label>
              </div>
            </div>
          </teleport>
        </div>

        <div class="filter-item">
          <label>Template</label>
          <button ref="templateButton" class="type-dropdown-button" @click.stop="openTemplateMenu" :title="templateLabel"><span class="btn-label">{{ templateLabel }}</span></button>
          <teleport to="body">
            <div v-if="showTemplateMenu" class="type-menu card" :style="templateMenuStyle" @click.stop>
              <div class="type-menu-list">
                <label class="type-item"><input type="radio" name="template" :checked="!filters.templateId" @change="selectTemplate('')" /> <span>(any)</span></label>
                <label class="type-item" v-for="t in templates" :key="t.id"><input type="radio" name="template" :checked="filters.templateId===t.id" @change="selectTemplate(t.id)" /> <span>{{ t.name }} — {{ t.id }}</span></label>
              </div>
            </div>
          </teleport>
        </div>

        <div class="filter-item">
          <label>Element</label>
          <button ref="elementButton" class="type-dropdown-button" @click.stop="openElementMenu" :title="elementLabel"><span class="btn-label">{{ elementLabel }}</span></button>
          <teleport to="body">
            <div v-if="showElementMenu" class="type-menu card" :style="elementMenuStyle" @click.stop>
              <div class="type-menu-list">
                <label class="type-item"><input type="radio" name="element" :checked="!filters.elementId" @change="selectElement('')" /> <span>(any)</span></label>
                <label class="type-item" v-for="e in flowElements" :key="e.id"><input type="radio" name="element" :checked="filters.elementId===e.id" @change="selectElement(e.id)" /> <span>{{ e.name }} — {{ e.id }}</span></label>
              </div>
            </div>
          </teleport>
        </div>

        <div class="filter-item small">
          <label>Comment</label>
          <input v-model="filters.commentId" placeholder="comment id" />
        </div>

        <div class="filter-item small">
          <label>Timestamp</label>
          <input type="date" v-model="filters.day" />
        </div>

        <div class="filter-item small">
          <label>User</label>
          <input v-model="filters.changedBy" placeholder="email or id" />
        </div>

        <div class="filter-actions">
          <button class="primary" @click="load">Apply</button>
          <button @click="reset">Reset</button>
        </div>
      </div>
    </div>

    <div class="logs-list card">
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th class="id-col">ID</th>
              <th>Type</th>
              <th class="ts-col">Time</th>
              <th>User</th>
              <th>Message / Details</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in logs" :key="item.id">
              <td class="id-col">{{ item.id }}</td>
              <td><span class="badge">{{ item.type }}</span></td>
              <td class="ts-col">{{ new Date(item.timestamp || item.ts).toLocaleString() }}</td>
              <td>{{ item.changedBy || '-' }}</td>
              <td class="message-col">
                <div>{{ item.message }}</div>
                <div v-if="item.type === 'mail_sent' && item.details && item.details.recipients" class="muted" style="margin-top:6px;font-size:0.9rem">
                  <strong>Recipients:</strong>
                  <span>{{ (item.details.recipients || []).join(', ') }}</span>
                </div>
                <details v-if="item.details" style="margin-top:6px;font-size:0.9rem">
                  <summary class="muted">Details</summary>
                  <pre style="white-space:pre-wrap;margin:6px 0">{{ JSON.stringify(item.details, null, 2) }}</pre>
                </details>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div v-if="!logs.length" class="no-logs">No logs found for the selected filters.</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, nextTick, onBeforeUnmount } from 'vue'

const filters = ref({ type: [] as string[], flowId: '', elementId: '', templateId: '', day: '', commentId: '', changedBy: '' })
const logs = ref<any[]>([])
const flows = ref<any[]>([])
const templates = ref<any[]>([])
const flowElements = ref<any[]>([])

const types = [
  { value: 'comment_added', label: 'Comment Added', short: 'Comment+' },
  { value: 'comment_deleted', label: 'Comment Deleted', short: 'Comment-' },
  { value: 'flow_created', label: 'Flow Created', short: 'Flow+' },
  { value: 'flow_deleted', label: 'Flow Deleted', short: 'Flow-' },
  { value: 'flow_completed', label: 'Flow Completed', short: 'Completed' },
  { value: 'flow_updated', label: 'Flow Updated', short: 'FlowΔ' },
  { value: 'template_created', label: 'Template Created', short: 'Tpl+' },
  { value: 'template_deleted', label: 'Template Deleted', short: 'Tpl-' },
  { value: 'template_updated', label: 'Template Updated', short: 'TplΔ' },
  { value: 'element_created', label: 'Element Created', short: 'El+' },
  { value: 'element_deleted', label: 'Element Deleted', short: 'El-' },
  { value: 'element_updated', label: 'Element Updated', short: 'ElΔ' },
  { value: 'mail_sent', label: 'Mail Sent', short: 'Mail' }
]

function toggleType(t: string) {
  filters.value.type = [t]
}

const showTypeMenu = ref(false)
const typeButton = ref<HTMLElement | null>(null)
const typeMenuPos = ref({ top: 0, left: 0 })
const typeMenuStyle = computed(() => ({ position: 'fixed', top: typeMenuPos.value.top + 'px', left: typeMenuPos.value.left + 'px' }) as any)

const showFlowMenu = ref(false)
const flowButton = ref<HTMLElement | null>(null)
const flowMenuPos = ref({ top: 0, left: 0 })
const flowMenuStyle = computed(() => ({ position: 'fixed', top: flowMenuPos.value.top + 'px', left: flowMenuPos.value.left + 'px' }) as any)

const showTemplateMenu = ref(false)
const templateButton = ref<HTMLElement | null>(null)
const templateMenuPos = ref({ top: 0, left: 0 })
const templateMenuStyle = computed(() => ({ position: 'fixed', top: templateMenuPos.value.top + 'px', left: templateMenuPos.value.left + 'px' }) as any)

const showElementMenu = ref(false)
const elementButton = ref<HTMLElement | null>(null)
const elementMenuPos = ref({ top: 0, left: 0 })
const elementMenuStyle = computed(() => ({ position: 'fixed', top: elementMenuPos.value.top + 'px', left: elementMenuPos.value.left + 'px' }) as any)

function positionMenu(buttonEl: HTMLElement | null, posRef: { value: { top: number; left: number } }) {
  if (!buttonEl) return
  const rect = buttonEl.getBoundingClientRect()
  const top = rect.bottom + 6
  let left = rect.left
  // keep within viewport
  const maxLeft = window.innerWidth - 260
  if (left > maxLeft) left = Math.max(8, maxLeft)
  posRef.value.top = top
  posRef.value.left = left
}

async function openTypeMenu() {
  showTypeMenu.value = !showTypeMenu.value
  await nextTick()
  if (showTypeMenu.value) positionMenu(typeButton.value, typeMenuPos)
}

async function openFlowMenu() {
  showFlowMenu.value = !showFlowMenu.value
  await nextTick()
  if (showFlowMenu.value) positionMenu(flowButton.value, flowMenuPos)
}

async function openTemplateMenu() {
  showTemplateMenu.value = !showTemplateMenu.value
  await nextTick()
  if (showTemplateMenu.value) positionMenu(templateButton.value, templateMenuPos)
}

async function openElementMenu() {
  showElementMenu.value = !showElementMenu.value
  await nextTick()
  if (showElementMenu.value) positionMenu(elementButton.value, elementMenuPos)
}

function selectFlow(id: string) {
  filters.value.flowId = id
  showFlowMenu.value = false
  onFlowChange()
}

function selectTemplate(id: string) {
  filters.value.templateId = id
  showTemplateMenu.value = false
  onTemplateChange()
}

function selectElement(id: string) {
  filters.value.elementId = id
  showElementMenu.value = false
}

const flowLabel = computed(() => {
  if (!filters.value.flowId) return '(any)'
  const f = flows.value.find((x: any) => x.id === filters.value.flowId)
  return f ? f.name : filters.value.flowId
})

const templateLabel = computed(() => {
  if (!filters.value.templateId) return '(any)'
  const t = templates.value.find((x: any) => x.id === filters.value.templateId)
  return t ? t.name : filters.value.templateId
})

const elementLabel = computed(() => {
  if (!filters.value.elementId) return '(any)'
  const e = flowElements.value.find((x: any) => x.id === filters.value.elementId)
  return e ? e.name : filters.value.elementId
})

function closeAllMenus() {
  showTypeMenu.value = false
  showFlowMenu.value = false
  showTemplateMenu.value = false
  showElementMenu.value = false
}

function onDocClick(e: Event) {
  closeAllMenus()
}

onMounted(() => {
  window.addEventListener('click', onDocClick)
})

onBeforeUnmount(() => {
  window.removeEventListener('click', onDocClick)
})

function toggleTypeValue(v: string) {
  const arr = filters.value.type as string[]
  const idx = arr.indexOf(v)
  if (idx === -1) arr.push(v)
  else arr.splice(idx, 1)
}

function clearTypes() {
  filters.value.type = []
}

const typeLabel = computed(() => {
  const arr = filters.value.type as string[]
  if (!arr || arr.length === 0) return 'All'
  if (arr.length === 1) {
    const found = types.find(t => t.value === arr[0])
    return found ? found.short : arr[0]
  }
  return `${arr.length} selected`
})

async function loadFlows() {
  try {
    const res = await $fetch('/api/flows/all') as any
    flows.value = res.data || []
  } catch (e) { flows.value = [] }
}

async function loadTemplates() {
  try {
    const res = await $fetch('/api/templates') as any
    templates.value = res.data || []
  } catch (e) { templates.value = [] }
}

async function load() {
  const params = new URLSearchParams()
  if (filters.value.type && (filters.value.type as string[]).length) {
    for (const t of (filters.value.type as string[])) params.append('type', t)
  }
  if (filters.value.flowId) params.set('flowId', filters.value.flowId)
  // prefer element from flow when set
  if (filters.value.elementId) params.set('elementId', filters.value.elementId)
  if (filters.value.templateId) params.set('templateId', filters.value.templateId)
  if (filters.value.day) params.set('day', filters.value.day)
  if (filters.value.commentId) params.set('commentId', filters.value.commentId)
  if (filters.value.changedBy) params.set('changedBy', filters.value.changedBy)

  const res = await $fetch('/api/logs?' + params.toString()) as any
  logs.value = res.data || []
}

function reset() {
  filters.value = { type: [] as string[], flowId: '', elementId: '', templateId: '', day: '', commentId: '', changedBy: '' }
  flowElements.value = []
  load()
}

async function onFlowChange() {
  filters.value.elementId = ''
  if (!filters.value.flowId) {
    // no flow selected -> if a template is selected, show its elements
    if (filters.value.templateId) {
      try {
        const res = await $fetch(`/api/templates/${filters.value.templateId}`) as any
        flowElements.value = (res.data?.elements || []).map((e: any) => ({ id: e.id, name: e.name }))
        return
      } catch (e) { flowElements.value = [] }
    }
    flowElements.value = []
    return
  }
  try {
    const res = await $fetch(`/api/flows/${filters.value.flowId}`) as any
    flowElements.value = (res.data?.elements || []).map((e: any) => ({ id: e.id, name: e.name }))
  } catch (e) { flowElements.value = [] }
}

// when template changes, if no flow is selected populate elements from template
async function onTemplateChange() {
  filters.value.elementId = ''
  if (filters.value.flowId) {
    // flow has precedence for elements
    return
  }
  if (!filters.value.templateId) {
    flowElements.value = []
    return
  }
  try {
    const res = await $fetch(`/api/templates/${filters.value.templateId}`) as any
    flowElements.value = (res.data?.elements || []).map((e: any) => ({ id: e.id, name: e.name }))
  } catch (e) { flowElements.value = [] }
}

onMounted(async () => {
  await Promise.all([loadFlows(), loadTemplates(), load()])
})
</script>

<style scoped>
.logs-page { padding: 1.25rem; }
.page-title { margin: 0 0 0.75rem 0; font-size: 1.25rem }
.filters-card { background: white; border: 1px solid #eef2f7; padding: 0.75rem; border-radius: 10px; margin-bottom: 1rem }
.filter-row { display: flex; gap: 0.75rem; align-items: end; flex-wrap: nowrap; overflow-x: auto; padding-bottom: 0.25rem }
.filter-row::-webkit-scrollbar { height: 8px }
.filter-row::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.08); border-radius: 6px }
.filter-item { min-width: 160px }
.filter-item.small { min-width: 120px }
.type-buttons { display:flex; gap:6px; flex-wrap:nowrap }
.type-buttons button { padding:6px 8px; border-radius:8px; border:1px solid #e6eef6; background:white; font-size:0.85rem }
.type-buttons button.active { background:#eef2ff; color:#1e3a8a; border-color:#cfe0ff }
.type-dropdown-button { display:inline-flex; align-items:center; gap:8px; padding:8px 10px; border-radius:8px; border:1px solid #e6eef6; background:white; cursor:pointer }
.type-dropdown-button .caret { opacity:0.7 }
.type-menu { position:absolute; top:100%; left:0; margin-top:8px; min-width:220px; z-index:10000; padding:8px; box-shadow:0 6px 18px rgba(15,23,42,0.08); border-radius:8px; background: white; border: 1px solid #eef2f7; color: inherit }
.type-menu-list { display:flex; flex-direction:column; gap:6px; max-height:320px; overflow:auto }
.type-item { display:flex; gap:8px; align-items:center }
.type-item input { width:16px; height:16px }
.type-dropdown-button .btn-label { display:inline-block; max-width:160px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis }
.filter-item label { display:block; font-size:0.85rem; color:#475569; margin-bottom:0.35rem }
.filter-item select, .filter-item input { width:100%; padding:8px 10px; border:1px solid #e6eef6; border-radius:8px }
.filter-actions { display:flex; gap:0.5rem; align-items:center }
.filter-actions .primary { background:linear-gradient(135deg,#667eea,#764ba2); color:white; border:none; padding:8px 12px; border-radius:8px }
.filter-actions button { padding:8px 12px; border-radius:8px; border:1px solid #e6eef6; background:white }

.logs-list.card { background:white; border:1px solid #eef2f7; border-radius:10px; padding:0.5rem }
.table-wrap { overflow:auto }
table { width:100%; border-collapse:collapse }
th, td { padding:10px 12px; border-bottom:1px solid #f1f5f9; text-align:left }
tbody tr:nth-child(odd) { background:#fbfdff }
.ts-col { width:160px; white-space:nowrap }
.message-col { max-width:480px; word-break:break-word }
.badge { background:#eef2ff; color:#1e3a8a; padding:4px 8px; border-radius:999px; font-size:0.8rem }
.no-logs { padding: 1rem; color:#64748b }
.muted { color:#94a3b8; font-size:0.9rem }
</style>
