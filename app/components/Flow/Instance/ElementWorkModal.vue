<template>
  <div class="element-editor-modal">
    <!-- Modal Overlay -->
    <div class="modal-overlay" @click="handleClose">
      <div class="modal-content" @click="handleModalClick">
        <!-- Modal Header -->
        <div class="modal-header">
          <h2>{{ isReadOnly ? 'View' : 'Work on' }} {{ originalElementData.type?.charAt(0).toUpperCase() + originalElementData.type?.slice(1) || 'Element' }}{{ isReadOnly ? ' (Read Only)' : '' }}</h2>
          <button @click="handleClose" class="close-button">
            <span class="close-icon">×</span>
          </button>
        </div>

        <!-- Element Form -->
        <div class="modal-body" @click.stop>
          <div @click.stop class="element-form">
            <!-- Compact Read-only Info -->
            <div class="readonly-info" @click.stop>
              <div class="readonly-item">
                <span class="readonly-label">Name:</span>
                <span class="readonly-value">{{ originalElementData.name || 'Unnamed Element' }}</span>
              </div>
              <div class="readonly-item" v-if="originalElementData.description">
                <span class="readonly-label">Description:</span>
                <span class="readonly-value">{{ originalElementData.description }}</span>
              </div>
              <div class="readonly-item">
                <span class="readonly-label">Type:</span>
                <span class="readonly-value">{{ getOriginalElementTypeLabel() || 'No type' }}</span>
              </div>
              <div class="readonly-item" v-if="originalElementData.type === 'action' && originalElementData.expectedEndedAt">
                <span class="readonly-label">Expected End:</span>
                <span class="readonly-value">{{ formatExpectedEndDate(originalElementData.expectedEndedAt) }}</span>
              </div>
              <div class="readonly-item">
                <span class="readonly-label">Owner Team:</span>
                <span class="readonly-value">
                  <span v-if="selectedOwner" class="inline-user">
                    <span class="inline-user-avatar">{{ getTeamInitial(selectedOwner) }}</span>
                    {{ selectedOwner.name }}
                  </span>
                  <span v-else class="no-value">No Owner Team</span>
                </span>
              </div>
              <div class="readonly-item" v-if="selectedConsultedTeams.length > 0">
                <span class="readonly-label">Consulted Teams:</span>
                <span class="readonly-value">
                  <span v-for="(team, index) in selectedConsultedTeams" :key="team.id" class="inline-user">
                    <span class="inline-user-avatar">{{ getTeamInitial(team) }}</span>
                    {{ team.name }}<span v-if="index < selectedConsultedTeams.length - 1">, </span>
                  </span>
                </span>
              </div>
              <div class="readonly-item" v-if="elementData.type === 'action' && elementData.status === 'completed' && elementData.completedAt">
                <span class="readonly-label">Completed:</span>
                <span class="readonly-value">{{ formatCompletedDate(elementData.completedAt) }}</span>
              </div>
            </div>

            <!-- Action Controls Row -->
            <div class="controls-row" @click.stop>
              <!-- Status Controls (only for action elements) -->
              <div v-if="elementData.type === 'action'" class="status-controls" @click.stop>
                <!-- Main Status Button -->
                <button 
                  @click.stop="canEditStatus ? (elementData.status === 'completed' || elementData.status === 'aborted' ? toggleStatusDropdown() : toggleStatus()) : null"
                  class="status-btn"
                  :class="[`status-${elementData.status}`, { 'has-changes': elementData.status !== originalElementData.status, 'disabled': !canEditStatus }]"
                >
                  <span class="status-icon">
                    <svg v-if="elementData.status === 'pending'" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                    <svg v-else-if="elementData.status === 'in-progress'" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
                    </svg>
                    <svg v-else-if="elementData.status === 'completed'" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                    <svg v-else fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                  </span>
                  {{ getStatusLabel(elementData.status) }}
                  <!-- Dropdown Arrow for completed/aborted statuses -->
                  <svg v-if="elementData.status === 'completed' || elementData.status === 'aborted'" class="dropdown-arrow" :class="{ 'rotated': statusDropdownOpen }" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
                  </svg>
                </button>

                <!-- Status Dropdown for completed/aborted -->
                <div v-show="statusDropdownOpen && (elementData.status === 'completed' || elementData.status === 'aborted')" class="status-dropdown">
                  <div v-if="canEditStatus" class="status-dropdown-header">Change Status</div>
                  <div v-else class="status-dropdown-restricted">
                    <div class="restricted-header">
                      <svg class="lock-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
                      </svg>
                      Access Restricted
                    </div>
                    <div class="restricted-message">
                      Only the owner or their team members can change this status.
                    </div>
                  </div>
                  <div v-if="canModifyStatus">
                    <div 
                      v-if="elementData.status === 'completed'"
                      class="status-option"
                      @click.stop="changeStatus('in-progress')"
                    >
                      <svg class="status-option-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
                      </svg>
                      <span>Reopen as In Progress</span>
                    </div>
                    <div 
                      v-if="elementData.status === 'aborted'"
                      class="status-option"
                      @click.stop="changeStatus('pending')"
                    >
                      <svg class="status-option-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                      </svg>
                      <span>Reopen as Pending</span>
                    </div>
                    <div 
                      v-if="elementData.status === 'aborted'"
                      class="status-option"
                      @click.stop="changeStatus('in-progress')"
                    >
                      <svg class="status-option-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
                      </svg>
                      <span>Reopen as In Progress</span>
                    </div>
                  </div>
                </div>
              </div>


            </div>

            <!-- Chat/Updates Section -->
            <div v-if="!isNewElement" class="chat-section" @click.stop>
              <div class="chat-header">
                <h3>Updates</h3>
                <span class="comment-count">{{ elementData.comments.length }}</span>
              </div>
              
              <!-- Comment Input (moved to top) -->
              <div class="chat-input-section" @click.stop>
                <div v-if="!canAddComments" class="chat-disabled">
                  <svg class="warning-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.664-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z"/>
                  </svg>
                  <span>{{ isReadOnly ? 'Comments are read-only for completed flows' : 'Please select a user in the navigation to comment' }}</span>
                </div>
                
                <div v-else class="chat-input-container">
                  <div class="input-avatar">
                    {{ getUserInitial(currentUser) }}
                  </div>
                  <textarea
                    v-model="newComment"
                    :placeholder="getPlaceholderText()"
                    class="chat-input"
                    rows="1"
                    @keydown.enter.prevent="handleEnterKey"
                    @input="autoResize"
                    ref="chatInput"
                  ></textarea>
                  <div class="send-button-group">
                    <button
                      v-if="canCompleteOrAbortReadOnly"
                      @click="toggleSendMode"
                      class="send-mode-btn"
                      type="button"
                      :class="`mode-${sendMode}`"
                      :title="getSendModeTooltip()"
                    >
                      <svg v-if="sendMode === 'send'" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
                      </svg>
                      <svg v-else-if="sendMode === 'complete'" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                      </svg>
                      <svg v-else fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                      </svg>
                    </button>
                    <button
                      @click="handleSendAction"
                      :disabled="!newComment.trim()"
                      class="send-btn"
                      type="button"
                      :class="canCompleteOrAbortReadOnly ? `action-${sendMode}` : 'action-send'"
                    >
                      <svg v-if="sendMode === 'send'" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/>
                      </svg>
                      <svg v-else-if="sendMode === 'complete'" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                      </svg>
                      <svg v-else fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
              
              <!-- Comments List -->
              <div class="chat-messages" ref="chatMessages">
                <div v-if="elementData.comments.length === 0" class="no-comments">
                  <svg class="no-comments-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
                  </svg>
                  <p>No updates yet. Start the conversation!</p>
                </div>
                
                <div v-for="(comment, index) in sortedComments" :key="`comment-${index}-${comment.timestamp}`" class="chat-message">
                  <div class="message-avatar">
                    {{ getUserInitial(getUserById(comment.userId)) }}
                  </div>
                  <div class="message-content">
                    <div class="message-header">
                      <span class="message-author">{{ getUserName(getUserById(comment.userId)) }}</span>
                      <span class="message-time">{{ formatTime(comment.timestamp) }}</span>
                      <span v-if="comment.statusTag" class="status-tag" :class="`status-tag-${comment.statusTag}`">
                        <svg v-if="comment.statusTag === 'pending'" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                        </svg>
                        <svg v-else-if="comment.statusTag === 'in-progress'" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
                        </svg>
                        <svg v-else-if="comment.statusTag === 'completed'" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                        </svg>
                        <svg v-else-if="comment.statusTag === 'aborted'" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                        </svg>
                        {{ comment.statusTag.charAt(0).toUpperCase() + comment.statusTag.slice(1).replace('-', ' ') }}
                      </span>
                      <button
                        v-if="canDeleteComments"
                        @click.stop="deleteComment(index)"
                        class="delete-comment-btn"
                        title="Delete comment"
                      >
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                        </svg>
                      </button>
                    </div>
                    <div class="message-text">{{ comment.comment }}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Modal Footer -->
        <div class="modal-footer" @click.stop>
          <div class="footer-left">
            <button 
              v-if="!isNewElement && hasPendingChanges && canEditElement" 
              @click.stop="resetChanges" 
              type="button" 
              class="btn btn-reset"
            >
              Reset Changes
            </button>
          </div>
          <div class="footer-right">
            <button @click.stop="handleClose" type="button" class="btn btn-secondary">
              {{ isReadOnly ? 'Close' : 'Cancel' }}
            </button>
            <button v-if="canEditElement" @click.stop="handleSave" type="button" class="btn btn-primary" :disabled="!isNewElement && !hasPendingChanges">
              {{ isNewElement ? 'Create Element' : (hasPendingChanges ? 'Save Changes' : 'No Changes') }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ElementComment } from '../../../../types/Element'
// Types will be inferred from the API responses

interface Props {
  element?: any | null
  isNewElement?: boolean
  isFlowCompleted?: boolean
}

interface Emits {
  (e: 'save', element: any): void
  (e: 'close'): void
}

const props = withDefaults(defineProps<Props>(), {
  element: null,
  isNewElement: false,
  isFlowCompleted: false
})

const emit = defineEmits<Emits>()

// Initialize element data (original from props)
const originalElementData = ref({
  id: '',
  name: '',
  description: '',
  type: 'action' as 'action' | 'state' | 'artefact',
  status: 'pending' as 'pending' | 'in-progress' | 'completed' | 'aborted',
  ownerTeamId: null,
  consultedTeamIds: [] as string[],
  completedAt: null as string | null,
  expectedEndedAt: null as string | null,
  comments: [] as Array<{ timestamp: string; comment: string; userId: string; statusTag?: 'pending' | 'in-progress' | 'completed' | 'aborted' }>
})

// Working copy for changes (only applied on save)
const elementData = ref({
  id: '',
  name: '',
  description: '',
  type: 'action' as 'action' | 'state' | 'artefact',
  status: 'pending' as 'pending' | 'in-progress' | 'completed' | 'aborted',
  ownerTeamId: null,
  consultedTeamIds: [] as string[],
  completedAt: null as string | null,
  expectedEndedAt: null as string | null,
  comments: [] as Array<{ timestamp: string; comment: string; userId: string; statusTag?: 'pending' | 'in-progress' | 'completed' | 'aborted' }>
})

// Load users and teams
const { data: usersData } = await useFetch('/api/users')
const { data: teamsData } = await useFetch('/api/teams')

const users = computed(() => usersData.value?.data || [])
const teams = computed(() => teamsData.value?.data || [])

// Dropdown state
const ownerDropdownOpen = ref(false)
const consultedDropdownOpen = ref(false)
const typeDropdownOpen = ref(false)
const statusDropdownOpen = ref(false)
const ownerSearchQuery = ref('')
const consultedSearchQuery = ref('')
const typeSearchQuery = ref('')
const statusSearchQuery = ref('')

// Element type options
const elementTypes = ref([
  { value: 'action', label: 'Action' },
  { value: 'state', label: 'State' },
  { value: 'artefact', label: 'Artefact' }
])

// Element status options
const elementStatuses = ref([
  { value: 'pending', label: 'Pending' },
  { value: 'in-progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'aborted', label: 'Aborted' }
])

// Computed properties for filtered teams
const filteredOwnerTeams = computed(() => {
  // If 10 or fewer teams, show all teams (no search needed)
  if (teams.value.length <= 10) return teams.value
  
  // If more than 10 teams, apply search filter
  if (!ownerSearchQuery.value) return teams.value
  const query = ownerSearchQuery.value.toLowerCase()
  return teams.value.filter(team => 
    (team.name && team.name.toLowerCase().includes(query))
  )
})

const filteredConsultedTeams = computed(() => {
  // If 10 or fewer teams, show all teams (no search needed)
  if (teams.value.length <= 10) return teams.value
  
  // If more than 10 teams, apply search filter
  if (!consultedSearchQuery.value) return teams.value
  const query = consultedSearchQuery.value.toLowerCase()
  return teams.value.filter(team => 
    (team.name && team.name.toLowerCase().includes(query))
  )
})

const selectedOwner = computed(() => {
  if (!elementData.value.ownerTeamId) return null
  return teams.value.find(team => team.id === elementData.value.ownerTeamId) || null
})

const selectedConsultedTeams = computed(() => {
  if (!elementData.value.consultedTeamIds?.length) return []
  return teams.value.filter(team => elementData.value.consultedTeamIds.includes(team.id))
})

const filteredElementTypes = computed(() => {
  // If 10 or fewer types, show all types (no search needed)
  if (elementTypes.value.length <= 10) return elementTypes.value
  
  // If more than 10 types, apply search filter
  if (!typeSearchQuery.value) return elementTypes.value
  const query = typeSearchQuery.value.toLowerCase()
  return elementTypes.value.filter(type => 
    type.label.toLowerCase().includes(query) ||
    type.value.toLowerCase().includes(query)
  )
})

const selectedElementType = computed(() => {
  if (!elementData.value.type) return null
  return elementTypes.value.find(type => type.value === elementData.value.type) || null
})

// Check if current user can modify status (owner team members and admins)
const canModifyStatus = computed(() => {
  if (!currentUser.value) return false
  
  // Admins can always modify status
  if (currentUser.value.role === 'admin') return true
  
  // If there's no owner team, everyone can modify status
  if (!elementData.value.ownerTeamId) return true
  
  // Find the owner team
  const ownerTeam = teams.value.find(team => team.id === elementData.value.ownerTeamId)
  if (!ownerTeam) return false
  
  // Check if current user is in the owner team
  const currentUserInOwnerTeam = ownerTeam.users?.some(user => user.id === currentUser.value?.id)
  
  return currentUserInOwnerTeam || false
})

// Check if current user can use complete/abort actions in chat
const canCompleteOrAbort = computed(() => {
  return canModifyStatus.value && elementData.value.type === 'action'
})

// Check if current user can delete comments (same permissions as modify status)
const canDeleteComments = computed(() => {
  return canModifyStatus.value && !props.isFlowCompleted
})

// Check if the modal should be read-only (flow is completed)
const isReadOnly = computed(() => {
  return props.isFlowCompleted
})

// Disable all editing capabilities when flow is completed
const canEditElement = computed(() => {
  return !props.isFlowCompleted
})

const canEditStatus = computed(() => {
  return canModifyStatus.value && !props.isFlowCompleted
})

const canAddComments = computed(() => {
  return !props.isFlowCompleted && currentUser.value
})

const canCompleteOrAbortReadOnly = computed(() => {
  return canCompleteOrAbort.value && !props.isFlowCompleted
})

const filteredElementStatuses = computed(() => {
  // If 10 or fewer statuses, show all statuses (no search needed)
  if (elementStatuses.value.length <= 10) return elementStatuses.value
  
  // If more than 10 statuses, apply search filter
  if (!statusSearchQuery.value) return elementStatuses.value
  const query = statusSearchQuery.value.toLowerCase()
  return elementStatuses.value.filter(status => 
    status.label.toLowerCase().includes(query) ||
    status.value.toLowerCase().includes(query)
  )
})

const selectedElementStatus = computed(() => {
  if (!elementData.value.status) return null
  return elementStatuses.value.find(status => status.value === elementData.value.status) || null
})

// Chat-related computed properties
const currentUser = computed(() => {
  if (typeof localStorage === 'undefined') return null
  const userId = localStorage.getItem('user')
  if (!userId) return null
  return users.value.find(user => user.id === userId) || null
})

const sortedComments = computed(() => {
  return [...elementData.value.comments].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
})

// Chat data
const newComment = ref('')
const chatMessages = ref<HTMLElement | null>(null)
const chatInput = ref<HTMLTextAreaElement | null>(null)
const sendMode = ref<'send' | 'complete' | 'abort'>('send')

// Watch for permission changes and reset send mode if needed
watch(canCompleteOrAbortReadOnly, (newVal) => {
  if (!newVal && (sendMode.value === 'complete' || sendMode.value === 'abort')) {
    sendMode.value = 'send'
  }
})

// Initialize element data when prop changes
watchEffect(() => {
  if (props.element) {
    const initialData = { 
      ...props.element,
      type: props.element.type as 'action' | 'state' | 'artefact',
      status: props.element.status as 'pending' | 'in-progress' | 'completed' | 'aborted',
      ownerTeamId: props.element.ownerTeamId || null,
      consultedTeamIds: [...(props.element.consultedTeamIds || [])],
      completedAt: props.element.completedAt ? (typeof props.element.completedAt === 'number' ? new Date(props.element.completedAt).toISOString() : props.element.completedAt) : null,
      expectedEndedAt: props.element.expectedEndedAt ? (typeof props.element.expectedEndedAt === 'number' ? new Date(props.element.expectedEndedAt).toISOString() : props.element.expectedEndedAt) : null,
      comments: (props.element.comments || []).map((comment: any) => ({ 
        ...comment, 
        timestamp: typeof comment.timestamp === 'number' ? new Date(comment.timestamp).toISOString() : comment.timestamp 
      }))
    }
    originalElementData.value = { ...initialData }
    elementData.value = { 
      ...initialData,
      consultedTeamIds: [...initialData.consultedTeamIds],
      comments: initialData.comments.map((comment: any) => ({ ...comment }))
    }
  } else if (props.isNewElement) {
    const initialData = {
      id: Date.now().toString(36) + Math.random().toString(36).substr(2),
      name: '',
      description: '',
      type: 'action' as 'action' | 'state' | 'artefact',
      status: 'pending' as 'pending' | 'in-progress' | 'completed' | 'aborted',
      ownerTeamId: null,
      consultedTeamIds: [] as string[],
      completedAt: null as string | null,
      expectedEndedAt: null as string | null,
      comments: [] as Array<{ timestamp: string; comment: string; userId: string; statusTag?: 'pending' | 'in-progress' | 'completed' | 'aborted' }>
    }
    originalElementData.value = { ...initialData }
    elementData.value = { ...initialData }
  }
})

// Methods
const toggleOwnerDropdown = () => {
  ownerDropdownOpen.value = !ownerDropdownOpen.value
  if (ownerDropdownOpen.value) {
    consultedDropdownOpen.value = false
    typeDropdownOpen.value = false
    statusDropdownOpen.value = false
    ownerSearchQuery.value = ''
  }
}

const toggleConsultedDropdown = () => {
  consultedDropdownOpen.value = !consultedDropdownOpen.value
  if (consultedDropdownOpen.value) {
    ownerDropdownOpen.value = false
    typeDropdownOpen.value = false
    statusDropdownOpen.value = false
    consultedSearchQuery.value = ''
  }
}

const toggleTypeDropdown = () => {
  typeDropdownOpen.value = !typeDropdownOpen.value
  if (typeDropdownOpen.value) {
    ownerDropdownOpen.value = false
    consultedDropdownOpen.value = false
    statusDropdownOpen.value = false
    typeSearchQuery.value = ''
  }
}

const toggleStatusDropdown = () => {
  statusDropdownOpen.value = !statusDropdownOpen.value
  if (statusDropdownOpen.value) {
    ownerDropdownOpen.value = false
    consultedDropdownOpen.value = false
    typeDropdownOpen.value = false
    statusSearchQuery.value = ''
  }
}

const selectOwner = (team: any) => {
  elementData.value.ownerTeamId = team?.id || null
  ownerDropdownOpen.value = false
}

const selectElementType = (type: any) => {
  elementData.value.type = type.value
  typeDropdownOpen.value = false
}

const selectElementStatus = (status: any) => {
  elementData.value.status = status.value
  statusDropdownOpen.value = false
}

const toggleStatus = () => {
  const currentStatus = elementData.value.status
  let newStatus: string
  
  if (currentStatus === 'pending') {
    newStatus = 'in-progress'
    elementData.value.status = 'in-progress'
  } else if (currentStatus === 'in-progress') {
    newStatus = 'pending'
    elementData.value.status = 'pending'
  } else if (currentStatus === 'completed') {
    // Allow changing back to in-progress
    newStatus = 'in-progress'
    elementData.value.status = 'in-progress'
  } else if (currentStatus === 'aborted') {
    // Allow changing back to pending
    newStatus = 'pending'
    elementData.value.status = 'pending'
  } else {
    return // No change
  }
  
  // Create status change comment
  createStatusChangeComment(currentStatus, newStatus)
  
  // Set completedAt timestamp for completed status
  if (newStatus === 'completed') {
    elementData.value.completedAt = new Date().toISOString()
  } else if (currentStatus === 'completed') {
    // Clear completedAt if moving away from completed status
    elementData.value.completedAt = null
  }
}

const changeStatus = (newStatus: 'pending' | 'in-progress' | 'completed' | 'aborted') => {
  const currentStatus = elementData.value.status
  
  // Only create comment if status actually changes
  if (currentStatus !== newStatus) {
    // Create status change comment
    createStatusChangeComment(currentStatus, newStatus)
    
    // Update status
    elementData.value.status = newStatus
    
    // Set completedAt timestamp for completed status
    if (newStatus === 'completed') {
      elementData.value.completedAt = new Date().toISOString()
    } else if (currentStatus === 'completed') {
      // Clear completedAt if moving away from completed status
      elementData.value.completedAt = null
    }
    
    // Auto-save for completed/aborted status changes to trigger flow progression
    if (newStatus === 'completed' || newStatus === 'aborted') {
      nextTick(() => {
        handleSave()
      })
    }
  }
  
  statusDropdownOpen.value = false
}

const getStatusLabel = (status: string) => {
  const labels = {
    'pending': 'Pending',
    'in-progress': 'In Progress',
    'completed': 'Completed',
    'aborted': 'Aborted'
  }
  return labels[status as keyof typeof labels] || status
}

const getOriginalElementTypeLabel = () => {
  if (!originalElementData.value.type) return null
  return elementTypes.value.find(type => type.value === originalElementData.value.type)?.label || null
}

// Check if there are any pending changes
const hasPendingChanges = computed(() => {
  const statusChanged = elementData.value.status !== originalElementData.value.status
  const ownerChanged = elementData.value.ownerTeamId !== originalElementData.value.ownerTeamId
  const consultedChanged = JSON.stringify(elementData.value.consultedTeamIds?.sort()) !== JSON.stringify(originalElementData.value.consultedTeamIds?.sort())
  
  // Check if comments have changed (length or content)
  const commentsChanged = elementData.value.comments.length !== originalElementData.value.comments.length ||
    elementData.value.comments.some((comment, index) => {
      const originalComment = originalElementData.value.comments[index]
      return !originalComment || 
             comment.comment !== originalComment.comment ||
             comment.userId !== originalComment.userId ||
             comment.timestamp !== originalComment.timestamp
    })

  return statusChanged || ownerChanged || consultedChanged || commentsChanged
})

const removeConsultedTeam = (teamId: string) => {
  toggleConsultedTeam(teamId)
}

const toggleConsultedTeam = (teamId: string) => {
  // Ensure consultedTeamIds is initialized
  if (!elementData.value.consultedTeamIds) {
    elementData.value.consultedTeamIds = []
  }
  
  const index = elementData.value.consultedTeamIds.indexOf(teamId)
  if (index > -1) {
    elementData.value.consultedTeamIds.splice(index, 1)
  } else {
    elementData.value.consultedTeamIds.push(teamId)
  }
}

const handleSave = () => {
  if (!elementData.value.name.trim()) {
    alert('Please enter an element name')
    return
  }

  // Emit the save event with current element data
  emit('save', { ...elementData.value })
  
  // Update original data to reflect the saved state with deep copies
  // This ensures that saved changes (including comments) become the new baseline
  originalElementData.value = { 
    ...elementData.value,
    consultedTeamIds: [...(elementData.value.consultedTeamIds || [])],
    comments: elementData.value.comments.map((comment: any) => ({ ...comment }))
  }
}

const handleClose = () => {
  emit('close')
}

const resetChanges = () => {
  // Create deep copies to avoid reference issues
  elementData.value = { 
    ...originalElementData.value,
    consultedTeamIds: [...(originalElementData.value.consultedTeamIds || [])],
    comments: originalElementData.value.comments.map((comment: any) => ({ ...comment }))
  }
}

// Handle click inside modal to close dropdowns when clicking outside dropdown areas
const handleModalClick = (event: MouseEvent) => {
  const target = event.target as HTMLElement
  if (!target.closest('.searchable-dropdown') && 
      !target.closest('.searchable-multi-dropdown') && 
      !target.closest('.button-dropdown')) {
    ownerDropdownOpen.value = false
    consultedDropdownOpen.value = false
    typeDropdownOpen.value = false
    statusDropdownOpen.value = false
  }
  // Stop event propagation to prevent modal from closing
  event.stopPropagation()
}

// Handle escape key
const handleKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Escape') {
    if (ownerDropdownOpen.value || consultedDropdownOpen.value || typeDropdownOpen.value || statusDropdownOpen.value) {
      ownerDropdownOpen.value = false
      consultedDropdownOpen.value = false
      typeDropdownOpen.value = false
      statusDropdownOpen.value = false
    } else {
      handleClose()
    }
  }
}

// Scroll lock functionality
const lockScroll = () => {
  document.body.style.overflow = 'hidden'
  document.body.style.paddingRight = '0px' // Prevent layout shift from scrollbar
}

const unlockScroll = () => {
  document.body.style.overflow = ''
  document.body.style.paddingRight = ''
}

// Chat-related helper methods
const getUserById = (userId: string) => {
  return users.value.find(user => user.id === userId) || null
}

const getUserName = (user: any) => {
  return user ? (user.name || user.email) : 'Unknown User'
}

const getUserInitial = (user: any) => {
  if (!user) return '?'
  const name = user.name || user.email || '?'
  return name.charAt(0).toUpperCase()
}

const getTeamName = (team: any) => {
  return team ? team.name : 'Unknown Team'
}

const getTeamInitial = (team: any) => {
  if (!team) return '?'
  const name = team.name || '?'
  return name.charAt(0).toUpperCase()
}

const getPlaceholderText = () => {
  if (!canCompleteOrAbortReadOnly.value) {
    return 'Type your update...'
  }
  
  switch (sendMode.value) {
    case 'complete':
      return 'Type update and complete element...'
    case 'abort':
      return 'Type update and abort element...'
    default:
      return 'Type your update...'
  }
}

const getSendModeTooltip = () => {
  if (!canCompleteOrAbortReadOnly.value && (sendMode.value === 'complete' || sendMode.value === 'abort')) {
    return isReadOnly.value ? 'Flow is completed - read only mode' : 'Restricted: Only owner or team members can complete/abort'
  }
  
  switch (sendMode.value) {
    case 'complete':
      return 'Click to switch mode (Complete & Comment)'
    case 'abort':
      return 'Click to switch mode (Abort & Comment)'
    default:
      return 'Click to switch mode (Send Comment)'
  }
}

const formatTime = (timestamp: string) => {
  const date = new Date(timestamp)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / (1000 * 60))
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return date.toLocaleDateString()
}

const formatCompletedDate = (timestamp: string) => {
  const date = new Date(timestamp)
  return date.toLocaleDateString() + ' at ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

const formatExpectedEndDate = (timestamp: string | null): string => {
  if (!timestamp) return 'Not set'
  const date = new Date(timestamp)
  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const year = date.getFullYear()
  return `${day}.${month}.${year}`
}

const addComment = () => {
  if (!newComment.value.trim() || !currentUser.value) return

  const comment: ElementComment = {
    id: Date.now().toString(36) + Math.random().toString(36).substr(2),
    userId: currentUser.value.id,
    userName: currentUser.value.name || currentUser.value.email,
    userEmail: currentUser.value.email,
    comment: newComment.value.trim(),
    timestamp: new Date().toISOString()
  }

  // Add comment to working data
  elementData.value.comments.push(comment)
  newComment.value = ''

  // Auto-resize textarea back to single line
  nextTick(() => {
    if (chatInput.value) {
      chatInput.value.style.height = 'auto'
    }
  })
}

const handleEnterKey = (event: KeyboardEvent) => {
  if (!event.shiftKey) {
    // Enter without shift sends the message
    handleSendAction()
  } else {
    // Shift+Enter adds a new line (default behavior)
    autoResize()
  }
}

const autoResize = () => {
  nextTick(() => {
    if (chatInput.value) {
      chatInput.value.style.height = 'auto'
      chatInput.value.style.height = chatInput.value.scrollHeight + 'px'
    }
  })
}

const toggleSendMode = () => {
  if (!canCompleteOrAbortReadOnly.value) {
    // If user can't complete or abort, only allow send mode
    sendMode.value = 'send'
    return
  }

  if (sendMode.value === 'send') {
    sendMode.value = 'complete'
  } else if (sendMode.value === 'complete') {
    sendMode.value = 'abort'
  } else {
    sendMode.value = 'send'
  }
}

// Helper method to create status change comment
const createStatusChangeComment = (fromStatus: string, toStatus: string) => {
  if (!currentUser.value) return
  
  const statusLabels = {
    'pending': 'Pending',
    'in-progress': 'In Progress',
    'completed': 'Completed',
    'aborted': 'Aborted'
  }
  
  const comment: ElementComment = {
    id: Date.now().toString(36) + Math.random().toString(36).substr(2),
    userId: currentUser.value.id,
    userName: currentUser.value.name || currentUser.value.email,
    userEmail: currentUser.value.email,
    comment: `Changed status from ${statusLabels[fromStatus as keyof typeof statusLabels]} to ${statusLabels[toStatus as keyof typeof statusLabels]}`,
    timestamp: new Date().toISOString()
  }
  
  // Add status tag for all status changes
  comment.statusTag = toStatus as 'pending' | 'in-progress' | 'completed' | 'aborted'
  
  elementData.value.comments.push(comment)
}

const deleteComment = (sortedIndex: number) => {
  if (!canDeleteComments.value) return
  
  if (confirm('Are you sure you want to delete this comment?')) {
    // Get the comment from sorted array to find its original timestamp
    const commentToDelete = sortedComments.value[sortedIndex]
    if (!commentToDelete) return
    
    // Find and remove the comment from the original array by timestamp
    const originalIndex = elementData.value.comments.findIndex(
      comment => comment.timestamp === commentToDelete.timestamp
    )
    
    if (originalIndex > -1) {
      elementData.value.comments.splice(originalIndex, 1)
    }
  }
}

const handleSendAction = () => {
  if (!newComment.value.trim() || !currentUser.value) return

  const baseComment: ElementComment = {
    id: Date.now().toString(36) + Math.random().toString(36).substr(2),
    userId: currentUser.value.id,
    userName: currentUser.value.name || currentUser.value.email,
    userEmail: currentUser.value.email,
    comment: newComment.value.trim(),
    timestamp: new Date().toISOString()
  }

  if (sendMode.value === 'send') {
    // Regular comment
    elementData.value.comments.push(baseComment)
  } else if (sendMode.value === 'complete' && canCompleteOrAbortReadOnly.value) {
    // Complete with comment (only if authorized)
    elementData.value.comments.push({
      ...baseComment,
      statusTag: 'completed' as 'completed'
    })
    elementData.value.status = 'completed'
    elementData.value.completedAt = new Date().toISOString()
    
    // Auto-save to trigger flow progression
    nextTick(() => {
      handleSave()
    })
  } else if (sendMode.value === 'abort' && canCompleteOrAbortReadOnly.value) {
    // Abort with comment (only if authorized)
    elementData.value.comments.push({
      ...baseComment,
      statusTag: 'aborted' as 'aborted'
    })
    elementData.value.status = 'aborted'
    
    // Auto-save to trigger flow progression
    nextTick(() => {
      handleSave()
    })
  } else if ((sendMode.value === 'complete' || sendMode.value === 'abort') && !canCompleteOrAbortReadOnly.value) {
    // Unauthorized attempt - just send as regular comment with a note
    elementData.value.comments.push({
      ...baseComment,
      comment: `${baseComment.comment} (Note: insufficient permissions for ${sendMode.value} action)`
    })
  }

  newComment.value = ''
  sendMode.value = 'send' // Reset to default after action

  // Auto-resize textarea back to single line
  nextTick(() => {
    if (chatInput.value) {
      chatInput.value.style.height = 'auto'
    }
  })
}

onMounted(() => {
  document.addEventListener('keydown', handleKeydown)
  lockScroll()
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
  unlockScroll()
})
</script>

<style scoped>
.element-editor-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 10001;
}

.modal-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.3);
  backdrop-filter: blur(3px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
}

.modal-content {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 250, 252, 0.95) 100%);
  backdrop-filter: blur(20px);
  border-radius: 24px;
  border: 1px solid rgba(255, 255, 255, 0.3);
  box-shadow: 
    0 32px 64px rgba(102, 126, 234, 0.15),
    0 16px 32px rgba(102, 126, 234, 0.1),
    0 8px 16px rgba(0, 0, 0, 0.05);
  max-width: 600px;
  width: 100%;
  max-height: 80vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 2rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.03) 100%);
  backdrop-filter: blur(10px);
}

.modal-header h2 {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 700;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.close-button {
  width: 32px;
  height: 32px;
  border: none;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #64748b;
  transition: all 0.3s ease;
  backdrop-filter: blur(10px);
}

.close-button:hover {
  background: rgba(102, 126, 234, 0.1);
  color: #667eea;
  transform: scale(1.1);
}

.close-icon {
  font-size: 18px;
  line-height: 1;
}

.modal-body {
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
}

.element-form {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-group label {
  font-weight: 600;
  color: #374151;
  font-size: 0.9rem;
}

.form-control {
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 0.9rem;
  transition: all 0.2s ease;
  font-family: inherit;
}

.form-control:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.form-control::placeholder {
  color: #9ca3af;
}

.readonly-field {
  background: #f9fafb !important;
  color: #6b7280 !important;
  cursor: not-allowed !important;
  border-color: #e5e7eb !important;
}

.readonly-field:focus {
  box-shadow: none !important;
  border-color: #e5e7eb !important;
}

/* Compact readonly info section */
.readonly-info {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 0.5rem;
  margin-bottom: 0.5rem;
}

.readonly-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.25rem;
}

.readonly-item:last-child {
  margin-bottom: 0;
}

.readonly-label {
  font-weight: 600;
  color: #64748b;
  font-size: 0.8rem;
  min-width: 100px;
}

.readonly-value {
  color: #475569;
  font-size: 0.85rem;
  flex: 1;
}

.inline-user {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  margin-right: 0.5rem;
}

.inline-user-avatar {
  width: 1.25rem;
  height: 1.25rem;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 0.65rem;
  flex-shrink: 0;
}

.no-value {
  color: #9ca3af;
  font-style: italic;
}

/* Controls row layout */
.controls-row {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  margin-bottom: 0.5rem;
}

/* Status controls */
.status-controls {
  flex-shrink: 0;
  position: relative;
}

.status-btn {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.375rem 0.5rem;
  border: none;
  border-radius: 6px;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  min-width: 100px;
  justify-content: center;
}

.status-pending {
  background: #fef3c7;
  color: #d97706;
  border: 1px solid #f59e0b;
}

.status-pending:hover {
  background: #fde68a;
  transform: translateY(-1px);
}

.status-in-progress {
  background: #dbeafe;
  color: #2563eb;
  border: 1px solid #3b82f6;
}

.status-in-progress:hover {
  background: #bfdbfe;
  transform: translateY(-1px);
}

.status-completed {
  background: #d1fae5;
  color: #059669;
  border: 1px solid #10b981;
  cursor: pointer;
}

.status-completed:hover {
  background: #a7f3d0;
  transform: translateY(-1px);
}

.status-aborted {
  background: #fee2e2;
  color: #dc2626;
  border: 1px solid #ef4444;
  cursor: pointer;
}

.status-aborted:hover {
  background: #fecaca;
  transform: translateY(-1px);
}

.status-btn.disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.status-btn.disabled:hover {
  transform: none;
}

.status-icon {
  display: flex;
  align-items: center;
  width: 16px;
  height: 16px;
}

.status-icon svg {
  width: 16px;
  height: 16px;
}

/* User info section */
.user-info {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  flex: 1;
}

.user-info-item {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  min-height: 2.25rem;
}

.user-info-label {
  font-weight: 600;
  color: #64748b;
  font-size: 0.8rem;
  min-width: 80px;
  flex-shrink: 0;
  padding-top: 0.25rem;
}

.user-info-value {
  flex: 1;
}

.user-display {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.user-display:last-child {
  margin-bottom: 0;
}

.user-avatar {
  width: 1.5rem;
  height: 1.5rem;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 0.7rem;
  flex-shrink: 0;
}

.consulted-users-list {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.no-user {
  color: #9ca3af;
  font-style: italic;
  font-size: 0.85rem;
  padding-top: 0.25rem;
}

/* User controls section - kept for backward compatibility but now unused */
.user-controls {
  display: flex;
  gap: 0.75rem;
  flex: 1;
}

/* Button dropdown styles */
.button-dropdown {
  position: relative;
  flex: 1;
}

.dropdown-btn {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 0.5rem 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  background: white;
  color: #6b7280;
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.dropdown-btn:hover {
  border-color: #9ca3af;
  background: #f9fafb;
}

.dropdown-btn.has-selection {
  color: #374151;
  border-color: #667eea;
  background: #f0f4ff;
}

.dropdown-btn.has-changes {
  border-left: 3px solid #f59e0b;
  background: #fef3c7;
}

.status-btn.has-changes {
  border-left: 3px solid #f59e0b;
  position: relative;
}

.status-btn.has-changes::after {
  content: '●';
  position: absolute;
  top: 2px;
  right: 4px;
  font-size: 8px;
  color: #f59e0b;
}

.btn-text {
  flex: 1;
  text-align: left;
  font-weight: 500;
}

.dropdown-arrow {
  width: 16px;
  height: 16px;
  color: #6b7280;
  transition: transform 0.2s ease;
  flex-shrink: 0;
  margin-left: 0.5rem;
}

.dropdown-arrow.rotated {
  transform: rotate(180deg);
}

/* Selected users section in consulted dropdown */
.selected-users-section {
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
}

.section-header {
  padding: 0.5rem 0.75rem;
  font-size: 0.75rem;
  font-weight: 600;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.selected-user {
  background: #eff6ff !important;
  border-left: 3px solid #3b82f6;
}

.section-divider {
  height: 1px;
  background: #e2e8f0;
}

.remove-btn {
  background: #ef4444;
  color: white;
  border: none;
  border-radius: 4px;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 14px;
  line-height: 1;
  margin-left: auto;
  transition: background-color 0.2s ease;
}

.remove-btn:hover {
  background: #dc2626;
}

.consulted-users-checkboxes {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  max-height: 150px;
  overflow-y: auto;
  padding: 0.5rem;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #f9fafb;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 4px;
  transition: background-color 0.2s ease;
}

.checkbox-label:hover {
  background: #f3f4f6;
}

.checkbox-label input[type="checkbox"] {
  margin: 0;
}

.modal-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  padding: 1rem 2rem;
  border-top: 1px solid rgba(255, 255, 255, 0.2);
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.02) 0%, rgba(118, 75, 162, 0.01) 100%);
  backdrop-filter: blur(10px);
}

.footer-left {
  flex: 1;
}

.footer-right {
  display: flex;
  gap: 1rem;
}

.btn {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
  font-size: 0.85rem;
  transition: all 0.2s ease;
}

.btn-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  box-shadow: 0 8px 16px rgba(102, 126, 234, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.btn-primary:hover {
  background: linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%);
  transform: translateY(-2px);
  box-shadow: 0 12px 24px rgba(102, 126, 234, 0.3);
}

.btn-secondary {
  background: rgba(255, 255, 255, 0.7);
  color: #374151;
  border: 1px solid rgba(255, 255, 255, 0.3);
  backdrop-filter: blur(10px);
}

.btn-secondary:hover {
  background: rgba(255, 255, 255, 0.9);
  transform: translateY(-1px);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
}

.btn-reset {
  background: rgba(239, 68, 68, 0.1);
  color: #ef4444;
  border: 1px solid rgba(239, 68, 68, 0.3);
  backdrop-filter: blur(10px);
}

.btn-reset:hover {
  background: rgba(239, 68, 68, 0.2);
  transform: translateY(-1px);
  box-shadow: 0 4px 15px rgba(239, 68, 68, 0.2);
}

.btn-primary:disabled {
  background: rgba(156, 163, 175, 0.5);
  color: #9ca3af;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.btn-primary:disabled:hover {
  background: rgba(156, 163, 175, 0.5);
  transform: none;
  box-shadow: none;
}

/* Searchable Dropdown Styles */
.searchable-dropdown,
.searchable-multi-dropdown {
  position: relative;
}

.dropdown-input {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  background: white;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.2s ease;
  min-height: 45px;
}

.dropdown-input:hover {
  border-color: #9ca3af;
}

.dropdown-input.open {
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.dropdown-input.multi {
  min-height: auto;
  align-items: flex-start;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.placeholder {
  color: #9ca3af;
}

.selected-value {
  color: #374151;
}

.selected-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  flex: 1;
}

.tag {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  background: #667eea;
  color: white;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.8rem;
}

.tag-remove {
  background: none;
  border: none;
  color: white;
  cursor: pointer;
  padding: 0;
  margin-left: 0.25rem;
  font-size: 1rem;
  line-height: 1;
  width: 16px;
  height: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 2px;
  transition: background-color 0.2s ease;
}

.tag-remove:hover {
  background: rgba(255, 255, 255, 0.2);
}

.dropdown-arrow {
  width: 20px;
  height: 20px;
  color: #6b7280;
  transition: transform 0.2s ease;
  flex-shrink: 0;
}

.dropdown-arrow.rotated {
  transform: rotate(180deg);
}

.dropdown-menu {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: white;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  margin-top: 4px;
  max-height: 300px;
  overflow: hidden;
}

.search-input-wrapper {
  padding: 0.75rem;
  border-bottom: 1px solid #e5e7eb;
}

.search-input {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 0.9rem;
  outline: none;
  transition: border-color 0.2s ease;
}

.search-input:focus {
  border-color: #667eea;
}

.dropdown-options {
  max-height: 200px;
  overflow-y: auto;
}

.dropdown-option {
  display: flex;
  align-items: center;
  padding: 0.75rem;
  cursor: pointer;
  transition: background-color 0.2s ease;
  gap: 0.5rem;
}

.dropdown-option:hover {
  background: #f3f4f6;
}

.dropdown-option.selected {
  background: #eff6ff;
  color: #1d4ed8;
}

.checkbox-option input[type="checkbox"] {
  margin: 0;
  pointer-events: none;
}

.no-results {
  padding: 0.75rem;
  color: #6b7280;
  font-style: italic;
  text-align: center;
}

/* Status dropdown specific styles */
.status-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  background: white;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  margin-top: 4px;
  min-width: 200px;
  overflow: hidden;
}

.status-dropdown-header {
  padding: 0.75rem;
  background: #f9fafb;
  border-bottom: 1px solid #e5e7eb;
  font-weight: 600;
  font-size: 0.85rem;
  color: #374151;
}

.status-option {
  display: flex;
  align-items: center;
  padding: 0.75rem;
  cursor: pointer;
  transition: background-color 0.2s ease;
  gap: 0.75rem;
}

.status-option:hover {
  background: #f3f4f6;
}

.status-option-icon {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
}

.status-dropdown-restricted {
  padding: 1rem;
  text-align: center;
  background: #fef3c7;
  border-top: 1px solid #f59e0b;
}

.restricted-header {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  font-weight: 600;
  color: #d97706;
  margin-bottom: 0.5rem;
  font-size: 0.875rem;
}

.lock-icon {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
}

.restricted-message {
  color: #92400e;
  font-size: 0.75rem;
  line-height: 1.4;
}

/* Responsive design */
@media (max-width: 768px) {
  .modal-overlay {
    padding: 1rem;
  }
  
  .modal-header,
  .modal-body,
  .modal-footer {
    padding-left: 1.5rem;
    padding-right: 1.5rem;
  }
  
  .modal-footer {
    flex-direction: column;
  }

  .footer-left {
    flex: none;
    width: 100%;
  }

  .footer-right {
    flex-direction: column;
    width: 100%;
  }
  
  .btn {
    width: 100%;
    justify-content: center;
  }

  .dropdown-menu {
    max-height: 250px;
  }

  .dropdown-options {
    max-height: 150px;
  }
}

/* Chat/Comments Section Styles */
.chat-section {
  margin-top: 0.75rem;
  border-top: 1px solid rgba(229, 231, 235, 0.8);
  padding-top: 0.75rem;
}

.chat-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
}

.chat-header h3 {
  margin: 0;
  font-size: 1.125rem;
  font-weight: 600;
  color: #374151;
}

.comment-count {
  background: #f3f4f6;
  color: #6b7280;
  padding: 0.25rem 0.5rem;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
}

.chat-messages {
  margin-bottom: 1rem;
  border: 1px solid rgba(229, 231, 235, 0.6);
  border-radius: 0.75rem;
  background: rgba(249, 250, 251, 0.5);
  backdrop-filter: blur(10px);
}

.no-comments {
  text-align: center;
  padding: 2rem 1rem;
  color: #9ca3af;
}

.no-comments-icon {
  width: 2.5rem;
  height: 2.5rem;
  margin: 0 auto 0.75rem;
  opacity: 0.6;
}

.no-comments p {
  margin: 0;
  font-size: 0.875rem;
}

.chat-message {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  border-bottom: 1px solid rgba(229, 231, 235, 0.4);
}

.chat-message:last-child {
  border-bottom: none;
}

.message-avatar {
  width: 2rem;
  height: 2rem;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 0.875rem;
  flex-shrink: 0;
}

.message-content {
  flex: 1;
  min-width: 0;
}

.message-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.25rem;
}

.message-author {
  font-weight: 600;
  color: #374151;
  font-size: 0.875rem;
}

.message-time {
  color: #9ca3af;
  font-size: 0.75rem;
}

.status-tag {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.125rem 0.5rem;
  border-radius: 0.75rem;
  font-size: 0.65rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.025em;
  margin-left: 0.5rem;
  margin-right: auto;
}

.status-tag svg {
  width: 0.75rem;
  height: 0.75rem;
}

.status-tag-pending {
  background: rgba(251, 191, 36, 0.1);
  color: #d97706;
  border: 1px solid rgba(251, 191, 36, 0.2);
}

.status-tag-in-progress {
  background: rgba(59, 130, 246, 0.1);
  color: #2563eb;
  border: 1px solid rgba(59, 130, 246, 0.2);
}

.status-tag-completed {
  background: rgba(5, 150, 105, 0.1);
  color: #059669;
  border: 1px solid rgba(5, 150, 105, 0.2);
}

.status-tag-aborted {
  background: rgba(220, 38, 38, 0.1);
  color: #dc2626;
  border: 1px solid rgba(220, 38, 38, 0.2);
}

.delete-comment-btn {
  background: none;
  border: none;
  color: #9ca3af;
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 0.25rem;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  margin-left: 0.5rem;
}

.chat-message:hover .delete-comment-btn {
  opacity: 1;
}

.delete-comment-btn:hover {
  background: rgba(239, 68, 68, 0.1);
  color: #ef4444;
  transform: scale(1.1);
}

.delete-comment-btn svg {
  width: 0.875rem;
  height: 0.875rem;
}

.message-text {
  color: #4b5563;
  line-height: 1.5;
  word-wrap: break-word;
  white-space: pre-wrap;
}

.chat-input-section {
  border-top: 1px solid rgba(229, 231, 235, 0.6);
  padding-top: 1rem;
  margin-bottom: 1.5rem;
}

.chat-disabled {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem;
  background: rgba(254, 243, 199, 0.5);
  border: 1px solid rgba(251, 191, 36, 0.3);
  border-radius: 0.75rem;
  color: #92400e;
  font-size: 0.875rem;
}

.warning-icon {
  width: 1.25rem;
  height: 1.25rem;
  flex-shrink: 0;
}

.chat-input-container {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  background: rgba(255, 255, 255, 0.8);
  border: 1px solid rgba(209, 213, 219, 0.6);
  border-radius: 0.75rem;
  padding: 0.75rem;
  backdrop-filter: blur(10px);
  transition: all 0.2s ease;
}

.chat-input-container:focus-within {
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.input-avatar {
  width: 1.75rem;
  height: 1.75rem;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 0.75rem;
  flex-shrink: 0;
}

.chat-input {
  flex: 1;
  border: none;
  background: transparent;
  color: #374151;
  font-size: 0.875rem;
  line-height: 1.5;
  resize: none;
  max-height: 100px;
  min-height: 1.25rem;
  outline: none;
  padding: 0;
}

.chat-input::placeholder {
  color: #9ca3af;
}

.send-btn {
  background: #667eea;
  color: white;
  border: none;
  border-radius: 0.5rem;
  padding: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  cursor: pointer;
  flex-shrink: 0;
}

.send-btn:hover:not(:disabled) {
  background: #5a67d8;
  transform: translateY(-1px);
}

.send-btn:disabled {
  background: #d1d5db;
  cursor: not-allowed;
  transform: none;
}

.send-btn svg {
  width: 1rem;
  height: 1rem;
}

/* Send Button Group Styles */
.send-button-group {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.send-mode-btn {
  background: rgba(255, 255, 255, 0.8);
  color: #6b7280;
  border: 1px solid rgba(209, 213, 219, 0.6);
  border-radius: 0.5rem;
  padding: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  cursor: pointer;
  flex-shrink: 0;
}

.send-mode-btn:hover {
  background: rgba(255, 255, 255, 0.95);
  border-color: #9ca3af;
}

.send-mode-btn.mode-send {
  border-color: #667eea;
  background: rgba(102, 126, 234, 0.1);
  color: #667eea;
}

.send-mode-btn.mode-complete {
  border-color: #059669;
  background: rgba(5, 150, 105, 0.1);
  color: #059669;
}

.send-mode-btn.mode-abort {
  border-color: #dc2626;
  background: rgba(220, 38, 38, 0.1);
  color: #dc2626;
}

.send-mode-btn.restricted {
  border-color: #d1d5db !important;
  background: rgba(156, 163, 175, 0.1) !important;
  color: #9ca3af !important;
  cursor: not-allowed !important;
}

.send-mode-btn svg {
  width: 1rem;
  height: 1rem;
}

.send-btn.action-send {
  background: #667eea;
}

.send-btn.action-send:hover:not(:disabled) {
  background: #5a67d8;
}

.send-btn.action-complete {
  background: #059669;
}

.send-btn.action-complete:hover:not(:disabled) {
  background: #047857;
}

.send-btn.action-abort {
  background: #dc2626;
}

.send-btn.action-abort:hover:not(:disabled) {
  background: #b91c1c;
}

.send-btn.restricted {
  background: #d1d5db !important;
  cursor: not-allowed !important;
}
</style>