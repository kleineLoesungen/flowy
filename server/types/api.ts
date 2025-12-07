/**
 * API Request and Response Interface Definitions
 * 
 * This file contains TypeScript interface definitions for all API endpoints
 * that are not already covered by the database schema types.
 */

import type { User, Team, Flow, FlowTemplate, FlowElement, FlowRelation, ElementLayout } from '../db/schema'

// ===========================================
// COMMON API TYPES
// ===========================================

export interface ApiResponse<T = any> {
  success: boolean
  message?: string
  data?: T
  error?: string
}

export interface ApiError {
  statusCode: number
  statusMessage: string
  data?: any
}

export interface PaginationParams {
  page?: number
  limit?: number
  offset?: number
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

// ===========================================
// AUTHENTICATION API TYPES
// ===========================================

export interface LoginRequest {
  email: string
  password: string
}

export interface LoginResponse extends ApiResponse {
  data: {
    user: Omit<User, 'passwordHash'> & { hasPassword: boolean }
    token: string
  }
}

export interface RegisterRequest {
  name: string
  email: string
  password: string
}

export interface RegisterResponse extends ApiResponse {
  data: {
    user: Omit<User, 'passwordHash'> & { hasPassword: boolean }
    token: string
  }
}

export interface ChangePasswordRequest {
  currentPassword: string
  newPassword: string
}

export interface ChangePasswordResponse extends ApiResponse {
  data: {
    message: string
  }
}

export interface LogoutResponse extends ApiResponse {
  data: {
    message: string
  }
}

export interface MeResponse extends ApiResponse {
  data: {
    user: Omit<User, 'passwordHash'> & { hasPassword: boolean }
  }
}

// JWT Token Payload
export interface JwtPayload {
  userId: string
  email: string
  role: 'admin' | 'member'
  iat?: number
  exp?: number
}

// ===========================================
// USERS API TYPES
// ===========================================

export interface CreateUserRequest {
  name: string
  email: string
  password?: string
  role?: 'admin' | 'member'
}

export interface UpdateUserRequest {
  name?: string
  email?: string
  role?: 'admin' | 'member'
}

export interface UserResponse {
  id: string
  name: string
  email: string
  role: 'admin' | 'member'
  hasPassword: boolean
  createdAt: string
  updatedAt: string
}

export interface UsersListResponse extends ApiResponse {
  data: UserResponse[]
}

export interface UserDetailsResponse extends ApiResponse {
  data: UserResponse
}

// ===========================================
// TEAMS API TYPES
// ===========================================

export interface CreateTeamRequest {
  name: string
  description?: string
  userIds?: string[]
}

export interface UpdateTeamRequest {
  name?: string
  description?: string
  userIds?: string[]
}

export interface TeamUser {
  id: string
  name: string
  email: string
  role: 'admin' | 'member'
}

export interface TeamResponse {
  id: string
  name: string
  description?: string
  userIds: string[]
  users?: TeamUser[]
  createdAt: string
  updatedAt: string
}

export interface TeamsListResponse extends ApiResponse {
  data: TeamResponse[]
}

export interface TeamDetailsResponse extends ApiResponse {
  data: TeamResponse
}

// ===========================================
// TEMPLATES API TYPES
// ===========================================

export interface CreateTemplateRequest {
  name: string
  description: string
  elements?: FlowElement[]
  relations?: FlowRelation[]
  startingElementId?: string
  layout?: ElementLayout
}

export interface UpdateTemplateRequest {
  name?: string
  description?: string
  elements?: FlowElement[]
  relations?: FlowRelation[]
  startingElementId?: string
  layout?: ElementLayout
}

export interface TemplateResponse {
  id: string
  name: string
  description: string
  elements: FlowElement[]
  relations: FlowRelation[]
  startingElementId: string | null
  layout: ElementLayout | null
  createdAt: string
  updatedAt: string
}

export interface TemplateOverview {
  id: string
  name: string
  description: string
  elementCount: number
  relationCount: number
  createdAt: string
  updatedAt: string
}

export interface TemplatesListResponse extends ApiResponse {
  data: TemplateOverview[]
}

export interface TemplateDetailsResponse extends ApiResponse {
  data: TemplateResponse
}

// Template usage statistics
export interface TemplateUsageResponse extends ApiResponse {
  data: {
    templateId: string
    usageCount: number
    flows: Array<{
      id: string
      name: string
      status: string
      createdAt: string
    }>
  }
}

// ===========================================
// FLOWS API TYPES
// ===========================================

export interface CreateFlowRequest {
  name: string
  description?: string
  templateId?: string
  elements?: FlowElement[]
  relations?: FlowRelation[]
  startingElementId?: string
  startedAt?: string
  expectedEndDate?: string
  layout?: ElementLayout
}

export interface UpdateFlowRequest {
  name?: string
  description?: string
  elements?: FlowElement[]
  relations?: FlowRelation[]
  startingElementId?: string
  startedAt?: string
  expectedEndDate?: string
  completedAt?: string
  hidden?: boolean
  layout?: ElementLayout
}

export interface FlowResponse {
  id: string
  name: string
  description: string | null
  templateId: string | null
  elements: FlowElement[]
  relations: FlowRelation[]
  startingElementId: string
  startedAt: string | null
  expectedEndDate: string | null
  completedAt: string | null
  hidden: boolean
  layout: ElementLayout | null
  createdAt: string
  updatedAt: string
}

export interface FlowOverview {
  id: string
  name: string
  description: string | null
  templateId: string | null
  startedAt: string | null
  expectedEndDate: string | null
  completedAt: string | null
  hidden: boolean
  status: 'pending' | 'in-progress' | 'completed' | 'aborted'
  progress: {
    completed: number
    total: number
    percentage: number
  }
  createdAt: string
  updatedAt: string
}

export interface FlowsListResponse extends ApiResponse {
  data: FlowOverview[]
}

export interface FlowDetailsResponse extends ApiResponse {
  data: FlowResponse
}

// Flow statistics and analytics
export interface FlowStatistics {
  total: number
  completed: number
  inProgress: number
  pending: number
  aborted: number
  averageCompletionTime: number | null
}

export interface FlowStatsResponse extends ApiResponse {
  data: FlowStatistics
}

// Flow reopening
export interface ReopenFlowRequest {
  reason?: string
}

export interface ReopenFlowResponse extends ApiResponse {
  data: {
    flowId: string
    message: string
  }
}

// ===========================================
// FLOW ELEMENTS & RELATIONS TYPES
// ===========================================

export interface UpdateElementRequest {
  name?: string
  description?: string
  ownerTeamId?: string | null
  consultedTeamIds?: string[]
  expectedEndedAt?: string | null
  status?: 'pending' | 'in-progress' | 'completed' | 'aborted'
}

export interface AddCommentRequest {
  comment: string
  statusTag?: 'pending' | 'in-progress' | 'completed' | 'aborted'
}

export interface ElementCommentResponse {
  id: string
  timestamp: string
  comment: string
  userId: string
  userName: string
  userEmail: string
  statusTag?: string
}

// ===========================================
// VALIDATION SCHEMAS
// ===========================================

export interface ValidationError {
  field: string
  message: string
  code: string
}

export interface ValidationErrorResponse extends ApiResponse {
  success: false
  error: string
  data: {
    errors: ValidationError[]
  }
}

// ===========================================
// SEARCH & FILTERING TYPES
// ===========================================

export interface SearchParams {
  query?: string
  type?: 'flows' | 'templates' | 'users' | 'teams'
  filters?: {
    status?: string[]
    dateRange?: {
      start: string
      end: string
    }
    teamIds?: string[]
    userIds?: string[]
  }
  sort?: {
    field: string
    direction: 'asc' | 'desc'
  }
}

export interface SearchResponse<T> extends PaginatedResponse<T> {
  data: T[]
  facets?: {
    [key: string]: Array<{
      value: string
      count: number
    }>
  }
}

// ===========================================
// BULK OPERATIONS TYPES
// ===========================================

export interface BulkOperationRequest<T> {
  operation: 'create' | 'update' | 'delete'
  items: T[]
}

export interface BulkOperationResponse extends ApiResponse {
  data: {
    successful: number
    failed: number
    errors: Array<{
      index: number
      error: string
    }>
  }
}

// ===========================================
// EXPORT TYPES
// ===========================================

export interface ExportRequest {
  format: 'json' | 'csv' | 'xlsx'
  type: 'flows' | 'templates' | 'users' | 'teams'
  filters?: SearchParams['filters']
  includeRelations?: boolean
}

export interface ExportResponse extends ApiResponse {
  data: {
    downloadUrl: string
    expiresAt: string
  }
}

// ===========================================
// WEBHOOK TYPES
// ===========================================

export interface WebhookPayload {
  event: string
  timestamp: string
  data: any
  source: {
    userId?: string
    ipAddress: string
    userAgent: string
  }
}

export interface WebhookResponse {
  received: boolean
  timestamp: string
}

// ===========================================
// ACTIVITY LOG TYPES
// ===========================================

export interface ActivityLogEntry {
  id: string
  userId: string
  userName: string
  action: string
  entityType: 'flow' | 'template' | 'user' | 'team'
  entityId: string
  changes?: {
    field: string
    oldValue: any
    newValue: any
  }[]
  timestamp: string
  ipAddress?: string
}

export interface ActivityLogResponse extends PaginatedResponse<ActivityLogEntry> {
  data: ActivityLogEntry[]
}

// ===========================================
// TYPE GUARDS & UTILITIES
// ===========================================

export function isApiError(obj: any): obj is ApiError {
  return obj && typeof obj === 'object' && 'statusCode' in obj && 'statusMessage' in obj
}

export function isValidRole(role: string): role is 'admin' | 'member' {
  return role === 'admin' || role === 'member'
}

export function isValidElementType(type: string): type is 'action' | 'state' | 'artefact' {
  return type === 'action' || type === 'state' || type === 'artefact'
}

export function isValidElementStatus(status: string): status is 'pending' | 'in-progress' | 'completed' | 'aborted' {
  return status === 'pending' || status === 'in-progress' || status === 'completed' || status === 'aborted'
}

export function isValidRelationType(type: string): type is 'flow' | 'or' | 'and' | 'in' | 'out' {
  return type === 'flow' || type === 'or' || type === 'and' || type === 'in' || type === 'out'
}