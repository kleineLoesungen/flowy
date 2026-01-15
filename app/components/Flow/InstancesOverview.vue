<template>
  <div class="flows-overview">
    <!-- My Actions Section -->
    <div v-if="user" class="section">
      <div class="section-header">
        <div class="section-title">
          <svg class="section-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
          </svg>
          <h3>My Actions</h3>
          <span class="section-count">{{ myActions.length }}</span>
        </div>
      </div>

      <div v-if="myActions.length === 0" class="empty-state">
        <div class="empty-content">
          <div class="empty-icon">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
          </div>
          <h4>No Active Actions</h4>
          <p>You don't have any actions currently in progress.</p>
        </div>
      </div>

      <div v-else class="actions-list">
        <div v-for="action in paginatedMyActions" :key="`${action.flowId}-${action.element.id}`" class="action-row">
          <div class="action-content">
            <div class="action-main">
              <h4>{{ action.element.name }}</h4>
              <div class="action-meta">
                <span class="action-role" :class="action.userRole">{{ action.userRole === 'owner' ? 'Owner' :
                  'Consulted' }}</span>
                <span class="flow-name">from {{ action.flowName }}</span>
                <span v-if="getDateBadge(action.element.expectedEndedAt)" 
                      class="date-badge"
                      :class="`badge-${getDateBadge(action.element.expectedEndedAt).color}`">
                  {{ getDateBadge(action.element.expectedEndedAt).text }}
                </span>
              </div>
            </div>
            <div class="action-links">
              <NuxtLink :to="`/flows/${action.flowId}/work/elements/${action.element.id}?from=dashboard`"
                class="btn btn-xs btn-primary">
                Work
              </NuxtLink>
              <NuxtLink :to="`/flows/${action.flowId}/work`" class="btn btn-icon btn-secondary"
                title="View Flow">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z">
                  </path>
                </svg>
              </NuxtLink>
            </div>
          </div>
        </div>

        <!-- Pagination Controls for My Actions -->
        <div v-if="myActionsTotalPages > 1" class="pagination">
          <button 
            @click="myActionsPage = Math.max(1, myActionsPage - 1)"
            :disabled="myActionsPage === 1"
            class="pagination-btn"
          >
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
            </svg>
          </button>
          <span class="pagination-info">Page {{ myActionsPage }} of {{ myActionsTotalPages }}</span>
          <button 
            @click="myActionsPage = Math.min(myActionsTotalPages, myActionsPage + 1)"
            :disabled="myActionsPage === myActionsTotalPages"
            class="pagination-btn"
          >
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
            </svg>
          </button>
        </div>
      </div>
    </div>

    <!-- Next Actions Section -->
    <div v-if="user" class="section">
      <div class="section-header">
        <div class="section-title">
          <svg class="section-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          <h3>Next Actions</h3>
          <span class="section-count">{{ nextActions.length }}</span>
        </div>
      </div>

      <div v-if="nextActions.length === 0" class="empty-state">
        <div class="empty-content">
          <div class="empty-icon">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
          </div>
          <h4>No Pending Actions</h4>
          <p>You don't have any pending actions waiting to be started.</p>
        </div>
      </div>

      <div v-else class="actions-list">
        <div v-for="action in paginatedNextActions" :key="`${action.flowId}-${action.element.id}`" class="action-row">
          <div class="action-content">
            <div class="action-main">
              <h4>{{ action.element.name }}</h4>
              <div class="action-meta">
                <span class="action-role" :class="action.userRole">{{ action.userRole === 'owner' ? 'Owner' :
                  'Consulted' }}</span>
                <span class="flow-name">from {{ action.flowName }}</span>
                <span v-if="getDateBadge(action.element.expectedEndedAt)" 
                      class="date-badge"
                      :class="`badge-${getDateBadge(action.element.expectedEndedAt).color}`">
                  {{ getDateBadge(action.element.expectedEndedAt).text }}
                </span>
              </div>
            </div>
            <div class="action-links">
              <NuxtLink :to="`/flows/${action.flowId}/work/elements/${action.element.id}?from=dashboard`"
                class="btn btn-xs btn-primary">
                Start
              </NuxtLink>
              <NuxtLink :to="`/flows/${action.flowId}/work`" class="btn btn-icon btn-secondary"
                title="View Flow">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z">
                  </path>
                </svg>
              </NuxtLink>
            </div>
          </div>
        </div>

        <!-- Pagination Controls for Next Actions -->
        <div v-if="nextActionsTotalPages > 1" class="pagination">
          <button 
            @click="nextActionsPage = Math.max(1, nextActionsPage - 1)"
            :disabled="nextActionsPage === 1"
            class="pagination-btn"
          >
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
            </svg>
          </button>
          <span class="pagination-info">Page {{ nextActionsPage }} of {{ nextActionsTotalPages }}</span>
          <button 
            @click="nextActionsPage = Math.min(nextActionsTotalPages, nextActionsPage + 1)"
            :disabled="nextActionsPage === nextActionsTotalPages"
            class="pagination-btn"
          >
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
            </svg>
          </button>
        </div>
      </div>
    </div>

    <!-- Flows Section -->
    <div class="section">
      <div class="section-header">
        <div class="section-title">
          <svg class="section-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2">
            </path>
          </svg>
          <h3>Flows</h3>
          <span class="section-count">{{ currentFlows.length }}</span>
        </div>
        <div class="section-controls">
          <div class="toggle-switch">
            <button @click="showOnlyMyFlows = false" :class="{ active: !showOnlyMyFlows }" class="toggle-btn">
              All Flows
            </button>
            <button @click="showOnlyMyFlows = true" :class="{ active: showOnlyMyFlows }" class="toggle-btn">
              My Flows
            </button>
          </div>
        </div>
      </div>

      <!-- Empty State for Flows -->
      <div v-if="displayedFlows.length === 0" class="empty-state">
        <div class="empty-content">
          <div class="empty-icon">
            <svg v-if="showOnlyMyFlows" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
            </svg>
            <svg v-else fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
                d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2">
              </path>
            </svg>
          </div>
          <h3>{{ showOnlyMyFlows ? 'No matching flows' : 'No flows found' }}</h3>
          <p>
            <span v-if="showOnlyMyFlows">
              You don't own any elements in flows yet.
              <button @click="showOnlyMyFlows = false" class="link-btn">Show all flows</button> to see all available
              flows.
            </span>
            <span v-else>
              Get started by creating your first flow instance from a template.
            </span>
          </p>
        </div>
      </div>

      <!-- Flows List -->
      <div v-else class="flows-list">
        <div class="list-header">
          <div class="col-header col-title">Flow</div>
          <div class="col-header col-dates">Dates</div>
          <div class="col-header col-progress">Progress</div>
          <div class="col-header col-actions">Actions</div>
        </div>

        <div v-for="flow in paginatedActiveFlows" :key="flow.id" class="flow-row">
          <div class="col-title">
            <h3>
              {{ flow.name }}
              <span v-if="flow.hidden" class="badge badge-private">private</span>
            </h3>
          </div>

          <div class="col-dates">
            <div class="dates-info">
              <div v-if="flow.startedAt" class="date-item">
                <span class="date-label">Started:</span>
                <span class="date-value">{{ formatDate(flow.startedAt) }}</span>
              </div>
              <div v-if="flow.expectedEndDate" class="date-item">
                <span class="date-label">Expected:</span>
                <span class="date-value">{{ formatDate(flow.expectedEndDate) }}</span>
              </div>
              <div v-if="flow.completedAt" class="date-item">
                <span class="date-label">Completed:</span>
                <span class="date-value">{{ formatDate(flow.completedAt) }}</span>
              </div>
            </div>
          </div>

          <div class="col-progress">
            <div class="progress-info">
              <div class="progress-bar">
                <div class="progress-fill" :style="{ width: `${getFlowProgress(flow)}%` }"></div>
              </div>
              <span class="progress-text">{{ getFlowProgress(flow) }}%</span>
            </div>
          </div>

          <div class="col-actions">
            <NuxtLink :to="`/flows/${flow.id}/work`" class="btn btn-primary">Work</NuxtLink>
            <NuxtLink v-if="canEditFlow(flow)" :to="`/flows/${flow.id}/edit`" class="btn btn-icon btn-secondary"
              title="Edit flow">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z">
                </path>
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
              </svg>
            </NuxtLink>
            <button v-if="canEditFlow(flow)" @click="$emit('delete', flow)" class="btn btn-icon btn-danger"
              title="Delete flow">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16">
                </path>
              </svg>
            </button>
          </div>
        </div>

        <!-- Pagination Controls for Active Flows -->
        <div v-if="activeFlowsTotalPages > 1" class="pagination">
          <button 
            @click="activeFlowsPage = Math.max(1, activeFlowsPage - 1)"
            :disabled="activeFlowsPage === 1"
            class="pagination-btn"
          >
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
            </svg>
          </button>
          <span class="pagination-info">Page {{ activeFlowsPage }} of {{ activeFlowsTotalPages }}</span>
          <button 
            @click="activeFlowsPage = Math.min(activeFlowsTotalPages, activeFlowsPage + 1)"
            :disabled="activeFlowsPage === activeFlowsTotalPages"
            class="pagination-btn"
          >
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
            </svg>
          </button>
        </div>
      </div>
    </div>

    <!-- Completed Flows Section -->
    <div class="section">
      <div class="section-header">
        <div class="section-title">
          <svg class="section-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          <h3>Completed Flows</h3>
          <span class="section-count">{{ currentCompletedFlows.length }}</span>
        </div>
        <div class="section-controls">
          <div class="toggle-switch" v-if="completedFlowsLoaded">
            <button @click="showOnlyMyCompletedFlows = false" :class="{ active: !showOnlyMyCompletedFlows }" class="toggle-btn">
              All Completed
            </button>
            <button @click="showOnlyMyCompletedFlows = true" :class="{ active: showOnlyMyCompletedFlows }" class="toggle-btn">
              My Completed
            </button>
          </div>
          <button 
            v-if="!completedFlowsLoaded" 
            @click="loadCompletedFlows" 
            :disabled="loadingCompletedFlows"
            class="btn btn-primary load-completed-btn"
          >
            <svg v-if="!loadingCompletedFlows" class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
            </svg>
            <svg v-else class="icon animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
            </svg>
            {{ loadingCompletedFlows ? 'Loading...' : '' }}
          </button>
        </div>
      </div>

      <!-- Empty State for Completed Flows -->
      <div v-if="!completedFlowsLoaded" class="empty-state">
        <div class="empty-content">
          <div class="empty-icon">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
            </svg>
          </div>
          <h3>Load Completed Flows</h3>
          <p>Click the "Load Completed" button above to view completed flows.</p>
        </div>
      </div>

      <div v-else-if="displayedCompletedFlows.length === 0" class="empty-state">
        <div class="empty-content">
          <div class="empty-icon">
            <svg v-if="showOnlyMyCompletedFlows" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
            </svg>
            <svg v-else fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
          </div>
          <h3>{{ showOnlyMyCompletedFlows ? 'No completed flows' : 'No completed flows found' }}</h3>
          <p>
            <span v-if="showOnlyMyCompletedFlows">
              You haven't completed any flows yet.
              <button @click="showOnlyMyCompletedFlows = false" class="link-btn">Show all completed</button> to see all finished flows.
            </span>
            <span v-else>
              No flows have been completed yet.
            </span>
          </p>
        </div>
      </div>

      <!-- Completed Flows List -->
      <div v-else class="flows-list completed-flows">
        <div class="list-header">
          <div class="col-header col-title">Completed Flow</div>
          <div class="col-header col-dates">Completion Date</div>
          <div class="col-header col-duration">Duration</div>
          <div class="col-header col-actions">Actions</div>
        </div>

        <div v-for="flow in paginatedCompletedFlows" :key="flow.id" class="flow-row">
          <div class="col-title">
            <h3>
              {{ flow.name }}
              <span v-if="flow.hidden" class="badge badge-private">private</span>
            </h3>
          </div>

          <div class="col-dates">
            <div class="dates-info">
              <div v-if="flow.completedAt" class="date-item">
                <span class="date-label">Completed:</span>
                <span class="date-value">{{ formatDate(flow.completedAt) }}</span>
              </div>
            </div>
          </div>

          <div class="col-duration">
            <div class="duration-info">
              <span class="duration-text">{{ getFlowDuration(flow) }}</span>
            </div>
          </div>

          <div class="col-actions">
            <NuxtLink :to="`/flows/${flow.id}/work`" class="btn btn-secondary">View</NuxtLink>
            <button v-if="canEditFlow(flow)" @click="reopenFlow(flow)" class="btn btn-icon btn-warning"
              title="Reopen flow">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
              </svg>
            </button>
          </div>
        </div>

        <!-- Pagination Controls for Completed Flows -->
        <div v-if="completedFlowsTotalPages > 1" class="pagination">
          <button 
            @click="completedFlowsPage = Math.max(1, completedFlowsPage - 1)"
            :disabled="completedFlowsPage === 1"
            class="pagination-btn"
          >
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
            </svg>
          </button>
          <span class="pagination-info">Page {{ completedFlowsPage }} of {{ completedFlowsTotalPages }}</span>
          <button 
            @click="completedFlowsPage = Math.min(completedFlowsTotalPages, completedFlowsPage + 1)"
            :disabled="completedFlowsPage === completedFlowsTotalPages"
            class="pagination-btn"
          >
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
            </svg>
          </button>
        </div>
      </div>
    </div>

    <!-- Create New Flow Actions -->
    <div v-if="user" class="flow-actions">
      <NuxtLink to="/flows/add" class="btn btn-primary create-flow-btn">
        <svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
        </svg>
        <span>Flow</span>
      </NuxtLink>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Flow } from '../../../types/Flow'
import type { FlowTemplate } from '../../../types/FlowTemplate'

// Get current user for authorization
const { user, isAdmin } = useUser()

// Props
const props = defineProps<{
  flows: Flow[]
}>()

// Emits
const emit = defineEmits<{
  delete: [flow: Flow]
}>()

// Load templates to get template names
const { data: templatesData } = await useFetch('/api/templates')
const templates = computed(() => templatesData.value?.data || [])

// Load teams data for team-based filtering
const { data: teamsData } = await useFetch('/api/teams')
const teams = computed(() => teamsData.value?.data || [])

// State for flows loading
const allFlowsLoaded = ref(false)
const loadingAllFlows = ref(false)

// State for completed flows loading
const completedFlowsLoaded = ref(false)
const loadingCompletedFlows = ref(false)
const allCompletedFlowsLoaded = ref(false)
const loadingAllCompletedFlows = ref(false)

// Load user-relevant flows initially
const { data: userFlowsData, refresh: refreshUserFlows } = await useFetch('/api/flows')
const userFlows = computed(() => userFlowsData.value?.data || [])

// Load all flows on demand with full Flow objects (not FlowOverview)
const { data: allFlowsData, refresh: refreshAllFlows } = await useLazyFetch('/api/flows', {
  server: false,
  query: { includeAllUsers: 'true' },
  default: () => ({ data: [] })
})
const allFlows = computed(() => allFlowsData.value?.data || [])

// Load user-relevant completed flows on demand
const { data: completedFlowsData, refresh: refreshCompletedFlows } = await useLazyFetch('/api/flows/completed', {
  server: false,
  default: () => ({ data: [] })
})
const completedFlows = computed(() => completedFlowsData.value?.data || [])

// Load all completed flows on demand
const { data: allCompletedFlowsData, refresh: refreshAllCompletedFlows } = await useLazyFetch('/api/flows/completed/all', {
  server: false,
  default: () => ({ data: [] })
})
const allCompletedFlows = computed(() => allCompletedFlowsData.value?.data || [])

// Get current flows based on toggle state
const currentFlows = computed(() => {
  if (showOnlyMyFlows.value) {
    // Use user-relevant flows (from the updated /api/flows endpoint)
    return userFlows.value
  } else {
    // Use all flows if loaded, otherwise show user flows as fallback
    return allFlowsLoaded.value ? allFlows.value : userFlows.value
  }
})

// Get current completed flows based on toggle state  
const currentCompletedFlows = computed(() => {
  if (showOnlyMyCompletedFlows.value) {
    return completedFlows.value
  } else {
    return allCompletedFlowsLoaded.value ? allCompletedFlows.value : completedFlows.value
  }
})

// Personal dashboard state
const showOnlyMyFlows = ref(true)
const showOnlyMyCompletedFlows = ref(true)

// Pagination state
const myActionsPage = ref(1)
const nextActionsPage = ref(1)
const activeFlowsPage = ref(1)
const completedFlowsPage = ref(1)
const actionsPerPage = 5
const flowsPerPage = 5

// Watch for toggle changes to load data as needed
watch(showOnlyMyFlows, async (newValue) => {
  if (!newValue) {
    // Switching to "All Flows" - load all flows if not already loaded
    await loadAllFlows()
  }
})

watch(showOnlyMyCompletedFlows, async (newValue) => {
  if (!newValue && completedFlowsLoaded.value) {
    // Switching to "All Completed Flows" - load all completed flows if not already loaded
    await loadAllCompletedFlows()
  }
})

// Helper computed property to get user's team IDs from team data
const userTeamIds = computed(() => {
  if (!user.value) return new Set<string>()
  
  const teamIds = new Set<string>()
  teams.value.forEach(team => {
    if (team.userIds && team.userIds.includes(user.value!.id)) {
      teamIds.add(team.id)
    }
  })
  return teamIds
})

// Helper function to check if user can view a flow (considering hidden attribute)
const canViewFlow = (flow: Flow): boolean => {
  // Admin users can always see all flows
  if (isAdmin.value) {
    return true
  }

  // If flow is not hidden, everyone can see it
  if (!flow.hidden) {
    return true
  }

  // For hidden flows, check if user is logged in
  if (!user.value) {
    return false
  }

  // Check if any element has team assignments
  const hasTeamAssignments = flow.elements.some(element => 
    element.ownerTeamId || (element.consultedTeamIds && element.consultedTeamIds.length > 0)
  )

  // If no elements have team assignments, everyone can see the flow (as per requirement)
  if (!hasTeamAssignments) {
    return true
  }

  // For hidden flows with team assignments, only team members can see them
  return flow.elements.some(element => {
    // Check if user owns this element
    if (element.ownerTeamId && userTeamIds.value.has(element.ownerTeamId)) {
      return true
    }
    // Check if user is consulted on this element
    if (element.consultedTeamIds && element.consultedTeamIds.some(teamId => userTeamIds.value.has(teamId))) {
      return true
    }
    return false
  })
}

// Personal actions computed properties
const myActions = computed(() => {
  if (!user.value) return []

  const actions: Array<{
    flowId: string
    flowName: string
    element: any
    userRole: 'owner' | 'consulted'
  }> = []

  // Only show actions from flows the user can view (considering hidden attribute)
  currentFlows.value.filter(canViewFlow).forEach(flow => {
    flow.elements
      .filter(element => element.type === 'action' && element.status === 'in-progress')
      .forEach(element => {
        let userRole: 'owner' | 'consulted' | null = null

        // Check if user owns this element
        if (element.ownerTeamId && userTeamIds.value.has(element.ownerTeamId)) {
          userRole = 'owner'
        }
        // Check if user is consulted on this element
        else if (element.consultedTeamIds && element.consultedTeamIds.some(teamId => userTeamIds.value.has(teamId))) {
          userRole = 'consulted'
        }

        if (userRole) {
          actions.push({
            flowId: flow.id,
            flowName: flow.name,
            element,
            userRole
          })
        }
      })
  })

  // Sort by expectedEndedAt (oldest first)
  return actions.sort((a, b) => {
    const dateA = a.element.expectedEndedAt ? new Date(a.element.expectedEndedAt).getTime() : Infinity
    const dateB = b.element.expectedEndedAt ? new Date(b.element.expectedEndedAt).getTime() : Infinity
    return dateA - dateB
  })
})

const nextActions = computed(() => {
  if (!user.value || !currentFlows.value) return []

  const actions: Array<{
    flowId: string
    flowName: string
    element: any
    userRole: 'owner' | 'consulted'
  }> = []

  // Only show actions from flows the user can view (considering hidden attribute)
  currentFlows.value.filter(canViewFlow).forEach(flow => {
    flow.elements
      .filter(element => element.type === 'action' && element.status === 'pending')
      .forEach(element => {
        let userRole: 'owner' | 'consulted' | null = null

        // Check if user owns this element
        if (element.ownerTeamId && userTeamIds.value.has(element.ownerTeamId)) {
          userRole = 'owner'
        }
        // Check if user is consulted on this element
        else if (element.consultedTeamIds && element.consultedTeamIds.some(teamId => userTeamIds.value.has(teamId))) {
          userRole = 'consulted'
        }

        if (userRole) {
          actions.push({
            flowId: flow.id,
            flowName: flow.name,
            element,
            userRole
          })
        }
      })
  })

  // Sort by expectedEndedAt (oldest first)
  return actions.sort((a, b) => {
    const dateA = a.element.expectedEndedAt ? new Date(a.element.expectedEndedAt).getTime() : Infinity
    const dateB = b.element.expectedEndedAt ? new Date(b.element.expectedEndedAt).getTime() : Infinity
    return dateA - dateB
  })
})

// Pagination computed properties
const myActionsTotalPages = computed(() => Math.ceil(myActions.value.length / actionsPerPage))
const nextActionsTotalPages = computed(() => Math.ceil(nextActions.value.length / actionsPerPage))

const paginatedMyActions = computed(() => {
  const start = (myActionsPage.value - 1) * actionsPerPage
  const end = start + actionsPerPage
  return myActions.value.slice(start, end)
})

const paginatedNextActions = computed(() => {
  const start = (nextActionsPage.value - 1) * actionsPerPage
  const end = start + actionsPerPage
  return nextActions.value.slice(start, end)
})

// Reset pagination when actions change
watch(myActions, () => {
  if (myActionsPage.value > myActionsTotalPages.value && myActionsTotalPages.value > 0) {
    myActionsPage.value = 1
  }
})

watch(nextActions, () => {
  if (nextActionsPage.value > nextActionsTotalPages.value && nextActionsTotalPages.value > 0) {
    nextActionsPage.value = 1
  }
})

// Helper function to check if user is involved in a flow (owns or consulted on elements)
const isUserInvolvedInFlow = (flow: Flow): boolean => {
  if (!user.value) return false
  
  return flow.elements.some(element => {
    // Check if user owns this element
    if (element.ownerTeamId && userTeamIds.value.has(element.ownerTeamId)) {
      return true
    }
    // Check if user is consulted on this element
    if (element.consultedTeamIds && element.consultedTeamIds.some(teamId => userTeamIds.value.has(teamId))) {
      return true
    }
    return false
  })
}

const displayedFlows = computed(() => {
  let flows: Flow[] = []
  
  // If "My Flows" is selected, filter to only flows where user is involved
  if (showOnlyMyFlows.value && user.value) {
    flows = currentFlows.value.filter(isUserInvolvedInFlow)
  } else {
    flows = currentFlows.value
  }
  
  // Sort by expected end date (oldest first)
  return flows.slice().sort((a, b) => {
    const dateA = a.expectedEndDate ? new Date(a.expectedEndDate).getTime() : Infinity
    const dateB = b.expectedEndDate ? new Date(b.expectedEndDate).getTime() : Infinity
    return dateA - dateB
  })
})

const displayedCompletedFlows = computed(() => {
  // Only show if completed flows have been loaded
  if (!completedFlowsLoaded.value) {
    return []
  }

  let flows: Flow[] = []
  
  // If "My Completed" is selected, filter to only flows where user is involved
  if (showOnlyMyCompletedFlows.value && user.value) {
    flows = currentCompletedFlows.value.filter(isUserInvolvedInFlow)
  } else {
    flows = currentCompletedFlows.value
  }
  
  // Sort by completed date (newest first)
  return flows.slice().sort((a, b) => {
    const dateA = a.completedAt ? new Date(a.completedAt).getTime() : 0
    const dateB = b.completedAt ? new Date(b.completedAt).getTime() : 0
    return dateB - dateA
  })
})

// Flows pagination computed properties
const activeFlowsTotalPages = computed(() => Math.ceil(displayedFlows.value.length / flowsPerPage))
const completedFlowsTotalPages = computed(() => Math.ceil(displayedCompletedFlows.value.length / flowsPerPage))

const paginatedActiveFlows = computed(() => {
  const start = (activeFlowsPage.value - 1) * flowsPerPage
  const end = start + flowsPerPage
  return displayedFlows.value.slice(start, end)
})

const paginatedCompletedFlows = computed(() => {
  const start = (completedFlowsPage.value - 1) * flowsPerPage
  const end = start + flowsPerPage
  return displayedCompletedFlows.value.slice(start, end)
})

// Reset pagination when flows change
watch(displayedFlows, () => {
  if (activeFlowsPage.value > activeFlowsTotalPages.value && activeFlowsTotalPages.value > 0) {
    activeFlowsPage.value = 1
  }
})

watch(displayedCompletedFlows, () => {
  if (completedFlowsPage.value > completedFlowsTotalPages.value && completedFlowsTotalPages.value > 0) {
    completedFlowsPage.value = 1
  }
})

// Methods
const loadAllFlows = async () => {
  if (allFlowsLoaded.value) return
  
  loadingAllFlows.value = true
  try {
    await refreshAllFlows()
    allFlowsLoaded.value = true
  } catch (error) {
    console.error('Error loading all flows:', error)
  } finally {
    loadingAllFlows.value = false
  }
}

const loadCompletedFlows = async () => {
  if (completedFlowsLoaded.value) return
  
  loadingCompletedFlows.value = true
  try {
    await refreshCompletedFlows()
    completedFlowsLoaded.value = true
    
    // If user is viewing "All Completed Flows", also load all completed flows
    if (!showOnlyMyCompletedFlows.value) {
      await loadAllCompletedFlows()
    }
  } catch (error) {
    console.error('Error loading completed flows:', error)
  } finally {
    loadingCompletedFlows.value = false
  }
}

const loadAllCompletedFlows = async () => {
  if (allCompletedFlowsLoaded.value) return
  
  loadingAllCompletedFlows.value = true
  try {
    await refreshAllCompletedFlows()
    allCompletedFlowsLoaded.value = true
  } catch (error) {
    console.error('Error loading all completed flows:', error)
  } finally {
    loadingAllCompletedFlows.value = false
  }
}

const getTemplateName = (templateId: string): string => {
  const template = templates.value.find(t => t.id === templateId)
  return template?.name || 'Unknown Template'
}

// Helper function to calculate days until expected date and get badge color
const getDateBadge = (expectedEndedAt: string | null) => {
  if (!expectedEndedAt) return null
  
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  const expectedDate = new Date(expectedEndedAt)
  expectedDate.setHours(0, 0, 0, 0)
  
  const diffTime = expectedDate.getTime() - today.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  
  let color = 'grey' // future dates
  let text = ''
  
  if (diffDays < 0) {
    color = 'red' // overdue
    text = `${Math.abs(diffDays)}d overdue`
  } else if (diffDays === 0) {
    color = 'yellow' // today
    text = 'Today'
  } else {
    color = 'grey' // future
    text = `${diffDays}d left`
  }
  
  return { color, text, days: diffDays }
}

const getFlowStatus = (flow: Flow): string => {
  if (flow.completedAt) return 'completed'
  if (!flow.startedAt) return 'not-started'

  // Check if overdue
  if (flow.expectedEndDate && new Date(flow.expectedEndDate) < new Date()) {
    return 'overdue'
  }

  return 'in-progress'
}

const getFlowProgress = (flow: Flow): number => {
  if (flow.completedAt) return 100
  if (!flow.startedAt) return 0

  // Only count action elements for progress (state and artefact are more status-oriented)
  const totalElements = flow.elements.filter(el => el.type === 'action').length

  if (totalElements === 0) return 0

  // Count completed action elements
  const completedElements = flow.elements.filter(el =>
    el.type === 'action' && el.status === 'completed'
  ).length

  return Math.round((completedElements / totalElements) * 100)
}

const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString()
}

const getFlowDuration = (flow: Flow): string => {
  if (!flow.startedAt || !flow.completedAt) return 'N/A'
  
  const startDate = new Date(flow.startedAt)
  const completedDate = new Date(flow.completedAt)
  const diffTime = Math.abs(completedDate.getTime() - startDate.getTime())
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  
  if (diffDays === 1) return '1 day'
  return `${diffDays} days`
}

const reopenFlow = async (flow: Flow) => {
  if (!confirm(`Are you sure you want to reopen "${flow.name}"? This will remove the completion date and make the flow active again.`)) {
    return
  }

  try {
    await $fetch(`/api/flows/${flow.id}/reopen`, {
      method: 'POST'
    })
    
    // Force refresh the page to reload all data
    window.location.reload()
  } catch (error) {
    console.error('Error reopening flow:', error)
    alert('Error reopening flow. Please try again.')
  }
}

// Authorization function to check if user can edit/delete a flow
const canEditFlow = (flow: Flow): boolean => {
  // Admin users can edit any flow
  if (isAdmin.value) {
    return true
  }

  // Check if user is not logged in
  if (!user.value) {
    return false
  }

  // Check if any element has an owner
  const hasElementOwners = flow.elements.some(element => element.ownerTeamId)
  
  // If no elements have owners, no one can edit the flow (except admins)
  if (!hasElementOwners) {
    return true
  }

  // Check each element to see if user's team owns it
  return flow.elements.some(element => {
    if (!element.ownerTeamId) return false
    return userTeamIds.value.has(element.ownerTeamId)
  })
}
</script>

<style scoped>
.flows-overview {
  width: 100%;
}

/* Personal Dashboard Sections */
.section {
  margin-bottom: 2rem;
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  border: 1px solid #f1f5f9;
  overflow: hidden;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.5rem;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  border-bottom: 1px solid #f1f5f9;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.section-icon {
  width: 20px;
  height: 20px;
  color: #3b82f6;
}

.section-title h3 {
  margin: 0;
  font-size: 1.125rem;
  font-weight: 600;
  color: #334155;
}

.section-count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 1.5rem;
  height: 1.5rem;
  padding: 0 0.375rem;
  background: #3b82f6;
  color: white;
  font-size: 0.75rem;
  font-weight: 600;
  border-radius: 0.75rem;
}

.section-controls {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.toggle-switch {
  display: flex;
  background: #f1f5f9;
  border-radius: 8px;
  padding: 0.125rem;
  border: 1px solid #e2e8f0;
}

.toggle-btn {
  padding: 0.375rem 0.75rem;
  font-size: 0.75rem;
  font-weight: 500;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  color: #64748b;
  background: transparent;
}

.toggle-btn.active {
  background: white;
  color: #3b82f6;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.toggle-btn:hover:not(.active) {
  color: #475569;
}

/* Actions Lists */
.actions-list {
  padding: 0;
}

.action-row {
  padding: 1rem 1.5rem;
  border-bottom: 1px solid #f1f5f9;
  transition: background-color 0.2s ease;
}

.action-row:hover {
  background: #f8fafc;
}

.action-row:last-child {
  border-bottom: none;
}

.action-content {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
}

.action-main {
  flex: 1;
}

.action-main h4 {
  margin: 0 0 0.5rem 0;
  font-size: 1rem;
  font-weight: 600;
  color: #1e293b;
}

.action-meta {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.action-role {
  display: inline-flex;
  align-items: center;
  padding: 0.125rem 0.5rem;
  font-size: 0.75rem;
  font-weight: 500;
  border-radius: 12px;
  border: 1px solid;
}

.action-role.owner {
  color: #059669;
  background: #ecfdf5;
  border-color: #a7f3d0;
}

.action-role.consulted {
  color: #0284c7;
  background: #eff6ff;
  border-color: #bfdbfe;
}

.flow-name {
  font-size: 0.75rem;
  color: #64748b;
  font-style: italic;
}

.date-badge {
  display: inline-flex;
  align-items: center;
  padding: 0.125rem 0.5rem;
  font-size: 0.75rem;
  font-weight: 600;
  border-radius: 12px;
  border: 1px solid;
}

.date-badge.badge-grey {
  color: #64748b;
  background: #f8fafc;
  border-color: #cbd5e1;
}

.date-badge.badge-yellow {
  color: #d97706;
  background: #fef3c7;
  border-color: #fcd34d;
}

.date-badge.badge-red {
  color: #dc2626;
  background: #fee2e2;
  border-color: #fca5a5;
}

.action-links {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  flex-shrink: 0;
}

/* Empty States */
.empty-state {
  padding: 3rem 1.5rem;
  text-align: center;
}

.empty-content {
  max-width: 400px;
  margin: 0 auto;
}

.empty-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 3rem;
  height: 3rem;
  background: #f1f5f9;
  border-radius: 50%;
  margin-bottom: 1rem;
}

.empty-icon svg {
  width: 1.5rem;
  height: 1.5rem;
  color: #64748b;
}

.empty-content h4 {
  margin: 0 0 0.5rem 0;
  font-size: 1.125rem;
  font-weight: 600;
  color: #334155;
}

.empty-content p {
  margin: 0;
  font-size: 0.875rem;
  color: #64748b;
  line-height: 1.5;
}

/* Status Badges */
.status-badge {
  display: inline-flex;
  align-items: center;
  padding: 0.125rem 0.5rem;
  font-size: 0.75rem;
  font-weight: 500;
  border-radius: 12px;
  border: 1px solid;
}

.status-badge.status-pending {
  color: #f59e0b;
  background: #fef3c7;
  border-color: #fde68a;
}

.status-badge.status-in-progress {
  color: #0284c7;
  background: #eff6ff;
  border-color: #bfdbfe;
}

.status-badge.status-completed {
  color: #059669;
  background: #ecfdf5;
  border-color: #a7f3d0;
}

.status-badge.status-overdue {
  color: #dc2626;
  background: #fef2f2;
  border-color: #fecaca;
}

.status-badge.status-aborted {
  color: #6b7280;
  background: #f9fafb;
  border-color: #e5e7eb;
}

/* Private Badge */
.badge-private {
  display: inline-flex;
  align-items: center;
  padding: 0.125rem 0.5rem;
  margin-left: 0.5rem;
  font-size: 0.625rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.025em;
  border-radius: 4px;
  color: #7c3aed;
  background: #f3e8ff;
  border: 1px solid #e9d5ff;
}

/* Flows List Styles */
.flows-list {
  background: rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(10px);
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.3);
  overflow: hidden;
  box-shadow: 0 8px 32px rgba(102, 126, 234, 0.08);
}

.list-header {
  display: grid;
  grid-template-columns: 2fr 180px 120px 180px;
  gap: 1rem;
  padding: 1rem 1.5rem;
  background: rgba(102, 126, 234, 0.05);
  border-bottom: 1px solid rgba(102, 126, 234, 0.1);
  font-weight: 600;
  color: #374151;
  font-size: 0.85rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.flow-row {
  display: grid;
  grid-template-columns: 2fr 180px 120px 180px;
  gap: 1rem;
  padding: 1.5rem;
  border-bottom: 1px solid rgba(102, 126, 234, 0.05);
  align-items: center;
  transition: all 0.3s ease;
}

.flow-row:hover {
  background: rgba(102, 126, 234, 0.03);
}

.flow-row:last-child {
  border-bottom: none;
}

/* Specific grid layout for completed flows */
.completed-flows .list-header {
  grid-template-columns: 2fr 180px 120px 180px;
}

.completed-flows .flow-row {
  grid-template-columns: 2fr 180px 120px 180px;
}

.col-title h3 {
  margin: 0 0 0.25rem 0;
  font-size: 1rem;
  font-weight: 600;
  color: #374151;
  display: flex;
  align-items: center;
}

.col-title .description {
  margin: 0;
  color: #6b7280;
  font-size: 0.85rem;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.dates-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.date-item {
  display: flex;
  flex-direction: column;
  font-size: 0.75rem;
}

.date-label {
  color: #9ca3af;
  font-weight: 500;
  margin-bottom: 0.1rem;
}

.date-value {
  color: #374151;
  font-weight: 600;
}

.progress-info {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  align-items: center;
}

.progress-bar {
  width: 60px;
  height: 8px;
  background: rgba(107, 114, 128, 0.2);
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  transition: width 0.3s ease;
}

.progress-fill.completed {
  background: linear-gradient(135deg, #059669 0%, #047857 100%);
}

.progress-text {
  font-size: 0.75rem;
  font-weight: 600;
  color: #374151;
}

.progress-text.completed {
  color: #059669;
  font-weight: 700;
}

.duration-info {
  display: flex;
  align-items: center;
  justify-content: center;
}

.duration-text {
  font-size: 0.875rem;
  font-weight: 600;
  color: #374151;
  text-align: center;
}

.col-actions {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

/* Link Button Styles */
.link-btn {
  background: none;
  border: none;
  color: #667eea;
  text-decoration: underline;
  cursor: pointer;
  font-weight: 500;
}

.link-btn:hover {
  color: #5a67d8;
}

/* Load Completed Button */
.load-completed-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.6rem 1.2rem;
  font-size: 0.85rem;
  font-weight: 600;
  white-space: nowrap;
  border-radius: 10px;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.load-completed-btn .icon {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
}

.load-completed-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
  transform: none;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.2);
}

.load-completed-btn:not(:disabled):hover {
  background: linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%);
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
}

/* Animation for spinning icon */
@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.animate-spin {
  animation: spin 1s linear infinite;
}

/* Button Styles */
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
  text-decoration: none;
  display: inline-block;
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

.btn-warning {
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
  color: white;
  box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3);
}

.btn-warning:hover {
  background: linear-gradient(135deg, #f59e0b 0%, #b45309 100%);
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(245, 158, 11, 0.4);
}

.btn-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  padding: 0;
  border-radius: 8px;
}

.btn-icon svg {
  width: 18px;
  height: 18px;
}

/* Small button styles for actions */
.btn-sm {
  padding: 0.375rem 0.75rem;
  font-size: 0.75rem;
  font-weight: 500;
  line-height: 1;
  white-space: nowrap;
}

.btn-sm.btn-icon {
  width: 32px;
  height: 32px;
  padding: 0;
}

.btn-sm.btn-icon svg {
  width: 16px;
  height: 16px;
}

/* Extra small button styles for actions */
.btn-xs {
  padding: 0.25rem 0.5rem;
  font-size: 0.75rem;
  font-weight: 500;
  line-height: 1;
  white-space: nowrap;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
}

/* Create Flow Actions */
.flow-actions {
  margin-top: 2rem;
  display: flex;
  justify-content: flex-end;
  padding: 0 0.5rem;
}

.create-flow-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  font-size: 0.875rem;
  font-weight: 600;
  border-radius: 12px;
  transition: all 0.3s ease;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
}

.create-flow-btn .icon {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
}

.create-flow-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 15px -3px rgba(102, 126, 234, 0.3), 0 4px 6px -2px rgba(102, 126, 234, 0.2);
}

/* Small button styles for actions */
.btn-sm {
  padding: 0.375rem 0.75rem;
  font-size: 0.75rem;
  font-weight: 500;
  line-height: 1;
  white-space: nowrap;
}

/* Pagination styles */
.pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  margin-top: 1.5rem;
  padding-top: 1rem;
  border-top: 1px solid rgba(148, 163, 184, 0.2);
}

.pagination-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  padding: 0;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(248, 250, 252, 0.9) 100%);
  border: 1px solid rgba(148, 163, 184, 0.2);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  color: #475569;
}

.pagination-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-color: transparent;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.pagination-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.pagination-btn svg {
  width: 18px;
  height: 18px;
}

.pagination-info {
  font-size: 0.875rem;
  color: #64748b;
  font-weight: 500;
  min-width: 120px;
  text-align: center;
}

/* Responsive adjustments for personal dashboard */
@media (max-width: 768px) {
  .section-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.75rem;
  }

  .section-controls {
    align-self: stretch;
  }

  .toggle-switch {
    width: 100%;
  }

  .toggle-btn {
    flex: 1;
    text-align: center;
  }

  .action-content {
    flex-direction: column;
    gap: 0.75rem;
  }

  .action-links {
    align-self: stretch;
    justify-content: stretch;
  }

  .action-links .btn {
    flex: 1;
    text-align: center;
  }

  .action-meta {
    gap: 0.5rem;
  }

  .flow-actions {
    justify-content: center;
  }

  .create-flow-btn {
    min-width: 140px;
  }

  /* Responsive flows list */
  .list-header {
    display: none;
  }

  .flow-row {
    display: block;
    padding: 1rem;
    border-radius: 12px;
    margin-bottom: 0.75rem;
    background: rgba(255, 255, 255, 0.8);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  }

  .col-title {
    margin-bottom: 1rem;
  }

  .col-title h3 {
    font-size: 1.1rem;
    margin-bottom: 0.5rem;
  }

  .col-dates,
  .col-progress,
  .col-duration {
    margin-bottom: 1rem;
  }

  .dates-info {
    flex-direction: row;
    flex-wrap: wrap;
    gap: 1rem;
  }

  .progress-info {
    flex-direction: row;
    align-items: center;
    gap: 1rem;
  }

  .progress-bar {
    flex: 1;
    max-width: 120px;
  }

  .duration-info {
    padding: 0.5rem;
    background: #f8fafc;
    border-radius: 6px;
    text-align: center;
  }

  .col-actions {
    justify-content: stretch;
  }

  .col-actions .btn:not(.btn-icon) {
    flex: 1;
    text-align: center;
  }

  .pagination {
    gap: 0.5rem;
  }

  .pagination-info {
    font-size: 0.75rem;
    min-width: 100px;
  }
}
</style>