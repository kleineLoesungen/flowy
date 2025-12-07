<template>
  <div class="team-assignment-dialog">
    <!-- Modal Overlay -->
    <div class="modal-overlay" @click="handleClose">
      <div class="modal-content" @click.stop>
        <!-- Modal Header -->
        <div class="modal-header">
          <h2>{{ title }}</h2>
          <button @click="handleClose" class="close-button">
            <span class="close-icon">×</span>
          </button>
        </div>

        <!-- Controls -->
        <div class="controls-section">
          <!-- Search Input -->
          <div class="search-wrapper">
            <input 
              v-model="searchQuery"
              type="text"
              :placeholder="viewMode === 'users' ? 'Search users...' : 'Search teams...'"
              class="search-input"
            />
            <svg class="search-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
            </svg>
          </div>

          <!-- View Toggle -->
          <div class="view-toggle">
            <button 
              @click="viewMode = 'users'" 
              :class="{ active: viewMode === 'users' }" 
              class="toggle-btn"
            >
              <svg class="btn-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m3 4.197V9a3 3 0 00-3-3v0a3 3 0 00-3 3v2.197"></path>
              </svg>
              Users
            </button>
            <button 
              @click="viewMode = 'teams'" 
              :class="{ active: viewMode === 'teams' }" 
              class="toggle-btn"
            >
              <svg class="btn-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
              </svg>
              Teams
            </button>
          </div>
        </div>

        <!-- Content -->
        <div class="modal-body">
          <!-- Users View -->
          <div v-if="viewMode === 'users'" class="users-list">
            <div v-if="filteredUsers.length === 0" class="empty-state">
              <p>No users found</p>
            </div>
            <div v-else>
              <div class="view-instructions">
                <svg class="info-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                <span>Click individual team names to {{ mode === 'owner' ? 'set as owner' : 'add/remove from consulted teams' }}</span>
              </div>
              <div 
                v-for="user in filteredUsers" 
                :key="user.id"
                class="user-item"
              >
                <div class="user-info">
                  <div class="user-name">{{ user.name }}</div>
                  <div class="user-email">{{ user.email }}</div>
                  <div class="user-teams">
                    <button
                      v-for="team in getUserTeams(user.id)" 
                      :key="team.id"
                      @click="handleUserTeamClick(team.id, user.id)"
                      class="team-tag clickable"
                      :class="{ 
                        'selected': mode === 'owner' && workingOwnerTeamId === team.id,
                        'consulted': mode === 'consulted' && isConsultedTeam(team.id)
                      }"
                      :title="getTeamClickTitle(team.id)"
                    >
                      {{ team.name }}
                      <span v-if="mode === 'owner' && workingOwnerTeamId === team.id" class="team-status">✓</span>
                      <span v-if="mode === 'consulted' && isConsultedTeam(team.id)" class="team-status">✓</span>
                    </button>
                    <span v-if="getUserTeams(user.id).length === 0" class="no-teams">
                      No teams
                    </span>
                  </div>
                </div>
                <div class="user-actions">
                  <button
                    v-if="mode === 'owner' && getUserTeams(user.id).length > 1"
                    @click="setOwnerFromUser(user.id)"
                    class="btn btn-sm btn-primary"
                    title="Set user's first team as owner"
                  >
                    Set First
                  </button>
                  <button
                    v-if="mode === 'consulted' && getUserTeams(user.id).length > 1"
                    @click="addConsultedFromUser(user.id)"
                    class="btn btn-sm btn-secondary"
                    title="Add all user's teams to consulted teams"
                  >
                    Add All
                  </button>
                  <div v-if="getUserTeams(user.id).length === 0" class="no-actions">
                    Click teams above to select
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Teams View -->
          <div v-if="viewMode === 'teams'" class="teams-list">
            <div v-if="filteredTeams.length === 0" class="empty-state">
              <p>No teams found</p>
            </div>
            <div v-else>
              <div 
                v-for="team in filteredTeams" 
                :key="team.id"
                class="team-item"
              >
                <div class="team-info">
                  <div class="team-name">{{ team.name }}</div>
                  <div class="team-members">
                    <span 
                      v-for="user in getTeamUsers(team.id)" 
                      :key="user.id"
                      class="member-tag"
                    >
                      {{ user.name }}
                    </span>
                    <span v-if="getTeamUsers(team.id).length === 0" class="no-members">
                      No members
                    </span>
                  </div>
                </div>
                <div class="team-actions">
                  <button
                    v-if="mode === 'owner'"
                    @click="setOwner(team.id)"
                    class="btn btn-sm btn-primary"
                    :class="{ 'selected': currentOwnerTeamId === team.id }"
                  >
                    {{ currentOwnerTeamId === team.id ? 'Owner' : 'Set Owner' }}
                  </button>
                  <button
                    v-if="mode === 'consulted'"
                    @click="toggleConsultedTeam(team.id)"
                    class="btn btn-sm"
                    :class="isConsultedTeam(team.id) ? 'btn-danger' : 'btn-secondary'"
                  >
                    {{ isConsultedTeam(team.id) ? 'Remove' : 'Add' }}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Modal Footer -->
        <div class="modal-footer">
          <div class="current-selection">
            <div v-if="mode === 'owner'" class="selection-info">
              <strong>Owner Team:</strong> 
              {{ currentOwnerTeamName || 'None selected' }}
            </div>
            <div v-if="mode === 'consulted'" class="selection-info">
              <strong>Consulted Teams:</strong> 
              {{ currentConsultedTeamNames.length > 0 ? currentConsultedTeamNames.join(', ') : 'None selected' }}
            </div>
          </div>
          <div class="footer-actions">
            <button @click="handleClose" class="btn btn-secondary">
              Close
            </button>
            <button @click="handleApply" class="btn btn-primary">
              Apply Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { User } from '../../../types_old/User'
import type { Team } from '../../../types_old/Team'

interface Props {
  mode: 'owner' | 'consulted'
  currentOwnerTeamId?: string | null
  currentConsultedTeamIds?: string[]
  title?: string
}

interface Emits {
  (e: 'close'): void
  (e: 'apply', data: { ownerTeamId?: string | null, consultedTeamIds?: string[] }): void
}

const props = withDefaults(defineProps<Props>(), {
  currentOwnerTeamId: null,
  currentConsultedTeamIds: () => [],
  title: 'Assign Teams'
})

const emit = defineEmits<Emits>()

// State
const searchQuery = ref('')
const viewMode = ref<'users' | 'teams'>('users')
const workingOwnerTeamId = ref<string | null>(props.currentOwnerTeamId)
const workingConsultedTeamIds = ref<string[]>([...props.currentConsultedTeamIds])

// Load data
const { data: usersData } = await useFetch('/api/users')
const { data: teamsData } = await useFetch('/api/teams')

const users = computed(() => usersData.value?.data || [])
const teams = computed(() => teamsData.value?.data || [])

// Computed properties
const filteredUsers = computed(() => {
  if (!searchQuery.value) return users.value
  const query = searchQuery.value.toLowerCase()
  return users.value.filter(user => 
    user.name?.toLowerCase().includes(query) ||
    user.email?.toLowerCase().includes(query)
  )
})

const filteredTeams = computed(() => {
  if (!searchQuery.value) return teams.value
  const query = searchQuery.value.toLowerCase()
  return teams.value.filter(team => 
    team.name?.toLowerCase().includes(query)
  )
})

const currentOwnerTeamName = computed(() => {
  if (!workingOwnerTeamId.value) return null
  const team = teams.value.find(t => t.id === workingOwnerTeamId.value)
  return team?.name || null
})

const currentConsultedTeamNames = computed(() => {
  return workingConsultedTeamIds.value
    .map(teamId => teams.value.find(t => t.id === teamId)?.name)
    .filter(Boolean) as string[]
})

// Helper methods
const getUserTeams = (userId: string): Team[] => {
  return teams.value.filter(team => 
    team.userIds && team.userIds.includes(userId)
  )
}

const getTeamUsers = (teamId: string): User[] => {
  const team = teams.value.find(t => t.id === teamId)
  if (!team || !team.userIds) return []
  return users.value.filter(user => team.userIds!.includes(user.id))
}

const isConsultedTeam = (teamId: string): boolean => {
  return workingConsultedTeamIds.value.includes(teamId)
}

// Actions
const setOwner = (teamId: string) => {
  workingOwnerTeamId.value = teamId
}

const setOwnerFromUser = (userId: string) => {
  const userTeams = getUserTeams(userId)
  if (userTeams.length > 0 && userTeams[0]) {
    workingOwnerTeamId.value = userTeams[0].id
  }
}

const toggleConsultedTeam = (teamId: string) => {
  const index = workingConsultedTeamIds.value.indexOf(teamId)
  if (index > -1) {
    workingConsultedTeamIds.value.splice(index, 1)
  } else {
    workingConsultedTeamIds.value.push(teamId)
  }
}

const addConsultedFromUser = (userId: string) => {
  const userTeams = getUserTeams(userId)
  userTeams.forEach(team => {
    if (!workingConsultedTeamIds.value.includes(team.id)) {
      workingConsultedTeamIds.value.push(team.id)
    }
  })
}

// Handle individual team selection from user view
const handleUserTeamClick = (teamId: string, userId: string) => {
  if (props.mode === 'owner') {
    setOwner(teamId)
  } else {
    toggleConsultedTeam(teamId)
  }
}

// Get title for team click action
const getTeamClickTitle = (teamId: string): string => {
  if (props.mode === 'owner') {
    return workingOwnerTeamId.value === teamId ? 'Currently selected as owner' : 'Click to set as owner team'
  } else {
    return isConsultedTeam(teamId) ? 'Click to remove from consulted teams' : 'Click to add to consulted teams'
  }
}

const handleApply = () => {
  if (props.mode === 'owner') {
    emit('apply', { ownerTeamId: workingOwnerTeamId.value })
  } else {
    emit('apply', { consultedTeamIds: workingConsultedTeamIds.value })
  }
}

const handleClose = () => {
  emit('close')
}

// Initialize working state when props change
watchEffect(() => {
  workingOwnerTeamId.value = props.currentOwnerTeamId
  workingConsultedTeamIds.value = [...props.currentConsultedTeamIds]
})

// Handle escape key
const handleKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Escape') {
    handleClose()
  }
}

// Scroll lock functionality
const lockScroll = () => {
  document.body.style.overflow = 'hidden'
}

const unlockScroll = () => {
  document.body.style.overflow = ''
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
.team-assignment-dialog {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 3000;
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
  padding: 2rem;
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
  max-width: 700px;
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

.controls-section {
  display: flex;
  gap: 1rem;
  padding: 1rem 2rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
  background: rgba(102, 126, 234, 0.02);
}

.search-wrapper {
  position: relative;
  flex: 1;
}

.search-input {
  width: 100%;
  padding: 0.75rem 1rem 0.75rem 2.5rem;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 0.9rem;
  outline: none;
  transition: border-color 0.2s ease;
}

.search-input:focus {
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.search-icon {
  position: absolute;
  left: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  width: 18px;
  height: 18px;
  color: #9ca3af;
}

.view-toggle {
  display: flex;
  background: #f1f5f9;
  border-radius: 8px;
  padding: 0.125rem;
  border: 1px solid #e2e8f0;
}

.toggle-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  font-size: 0.85rem;
  font-weight: 500;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  color: #64748b;
  background: transparent;
  white-space: nowrap;
}

.toggle-btn.active {
  background: white;
  color: #3b82f6;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.toggle-btn:hover:not(.active) {
  color: #475569;
}

.btn-icon {
  width: 16px;
  height: 16px;
}

.modal-body {
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
}

.view-instructions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: rgba(59, 130, 246, 0.05);
  border: 1px solid rgba(59, 130, 246, 0.15);
  border-radius: 8px;
  margin-bottom: 1rem;
  font-size: 0.85rem;
  color: #1e40af;
}

.info-icon {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
}

.users-list,
.teams-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.user-item,
.team-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 12px;
  transition: all 0.2s ease;
}

.user-item:hover,
.team-item:hover {
  background: rgba(255, 255, 255, 0.8);
  transform: translateY(-1px);
}

.user-info,
.team-info {
  flex: 1;
}

.user-name,
.team-name {
  font-weight: 600;
  color: #374151;
  margin-bottom: 0.25rem;
}

.user-email {
  font-size: 0.85rem;
  color: #6b7280;
  margin-bottom: 0.5rem;
}

.user-teams,
.team-members {
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem;
}

.team-tag,
.member-tag {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.125rem 0.5rem;
  background: #eff6ff;
  color: #1d4ed8;
  font-size: 0.75rem;
  border-radius: 4px;
  border: 1px solid #bfdbfe;
}

.team-tag.clickable {
  cursor: pointer;
  transition: all 0.2s ease;
  border: none;
  background: #eff6ff;
}

.team-tag.clickable:hover {
  background: #dbeafe;
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(29, 78, 216, 0.2);
}

.team-tag.clickable.selected {
  background: linear-gradient(135deg, #059669 0%, #047857 100%);
  color: white;
  border: 1px solid #047857;
}

.team-tag.clickable.consulted {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: 1px solid #5a6fd8;
}

.team-status {
  font-weight: bold;
  font-size: 0.7rem;
}

.no-teams,
.no-members,
.no-actions {
  font-size: 0.75rem;
  color: #9ca3af;
  font-style: italic;
}

.user-actions,
.team-actions {
  display: flex;
  gap: 0.5rem;
  flex-shrink: 0;
}

.btn {
  padding: 0.375rem 0.75rem;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  font-size: 0.8rem;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.btn-sm {
  padding: 0.25rem 0.5rem;
  font-size: 0.75rem;
}

.btn-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  box-shadow: 0 4px 8px rgba(102, 126, 234, 0.2);
}

.btn-primary:hover {
  background: linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%);
  transform: translateY(-1px);
  box-shadow: 0 6px 12px rgba(102, 126, 234, 0.3);
}

.btn-primary.selected {
  background: linear-gradient(135deg, #059669 0%, #047857 100%);
}

.btn-secondary {
  background: rgba(255, 255, 255, 0.7);
  color: #374151;
  border: 1px solid rgba(255, 255, 255, 0.3);
}

.btn-secondary:hover {
  background: rgba(255, 255, 255, 0.9);
  transform: translateY(-1px);
}

.btn-danger {
  background: linear-gradient(135deg, #f87171 0%, #dc2626 100%);
  color: white;
}

.btn-danger:hover {
  background: linear-gradient(135deg, #ef4444 0%, #b91c1c 100%);
  transform: translateY(-1px);
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

.btn:disabled:hover {
  transform: none;
}

.empty-state {
  text-align: center;
  padding: 2rem;
  color: #6b7280;
  font-style: italic;
}

.modal-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  padding: 1rem 2rem;
  border-top: 1px solid rgba(255, 255, 255, 0.2);
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.02) 0%, rgba(118, 75, 162, 0.01) 100%);
}

.current-selection {
  flex: 1;
}

.selection-info {
  font-size: 0.85rem;
  color: #374151;
}

.footer-actions {
  display: flex;
  gap: 1rem;
}

/* Responsive design */
@media (max-width: 768px) {
  .modal-overlay {
    padding: 1rem;
  }
  
  .controls-section {
    flex-direction: column;
    gap: 0.75rem;
  }
  
  .user-item,
  .team-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.75rem;
  }
  
  .user-actions,
  .team-actions {
    align-self: stretch;
  }
  
  .btn {
    flex: 1;
    text-align: center;
  }
  
  .modal-footer {
    flex-direction: column;
    align-items: stretch;
  }
  
  .footer-actions {
    justify-content: stretch;
  }
  
  .footer-actions .btn {
    flex: 1;
  }
}
</style>