import { sql } from 'drizzle-orm'
import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core'
import { pgTable, text as pgText, timestamp, boolean, jsonb } from 'drizzle-orm/pg-core'

// Environment detection
const isPostgres = !!process.env.PG_ConnectionString || !!process.env.PG_CONNECTION_STRING || !!process.env.DATABASE_URL?.startsWith('postgres')

/** Users */
export const users = isPostgres 
  ? pgTable('users', {
      id: pgText('id').primaryKey(),
      name: pgText('name').notNull(),
      email: pgText('email').notNull().unique(),
      passwordHash: pgText('password_hash'),
      role: pgText('role').$type<'member' | 'admin'>().notNull().default('member'),
      createdAt: timestamp('created_at').notNull().defaultNow(),
      updatedAt: timestamp('updated_at').notNull().defaultNow()
    })
  : sqliteTable('users', {
      id: text('id').primaryKey(),
      name: text('name').notNull(),
      email: text('email').notNull().unique(),
      passwordHash: text('password_hash'),
      role: text('role', { enum: ['member', 'admin'] }).notNull().default('member'),
      createdAt: text('created_at').notNull().default(sql`(datetime('now'))`),
      updatedAt: text('updated_at').notNull().default(sql`(datetime('now'))`)
    })

export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert
export type UpdateUser = Partial<Omit<NewUser, 'id' | 'createdAt' | 'updatedAt'>>

/** Teams */ 
export const teams = isPostgres
  ? pgTable('teams', {
      id: pgText('id').primaryKey(),
      name: pgText('name').notNull(),
      userIds: jsonb('user_ids').$type<string[]>().notNull().default([]),
      createdAt: timestamp('created_at').notNull().defaultNow(),
      updatedAt: timestamp('updated_at').notNull().defaultNow()
    })
  : sqliteTable('teams', {
      id: text('id').primaryKey(),
      name: text('name').notNull(),
      userIds: text('user_ids', { mode: 'json' }).$type<string[]>().notNull().default([]),
      createdAt: text('created_at').notNull().default(sql`(datetime('now'))`),
      updatedAt: text('updated_at').notNull().default(sql`(datetime('now'))`)
    })

export type Team = typeof teams.$inferSelect
export type NewTeam = typeof teams.$inferInsert
export type UpdateTeam = Partial<Omit<NewTeam, 'id' | 'createdAt' | 'updatedAt'>>

// Element type definitions for type safety
export const elementTypes = ['action', 'state', 'artefact'] as const
export const elementStatuses = ['pending', 'in-progress', 'completed', 'aborted'] as const
export const relationTypes = ['flow', 'or', 'and', 'in', 'out'] as const


/** Flow Element */
export interface ElementComment {
  id: string
  timestamp: string
  comment: string
  userId: string
  userName?: string
  userEmail?: string
  statusTag?: typeof elementStatuses[number]
}
export interface FlowElement {
  id: string
  name: string
  description: string
  type: typeof elementTypes[number]
  ownerTeamId: string | null
  consultedTeamIds: string[]
  completedAt: string | null
  expectedEndedAt: string | null
  status: typeof elementStatuses[number]
  comments: ElementComment[]
}

/** Flow Relation */
export interface FlowRelation {
  id: string
  type: typeof relationTypes[number]
  connections: Array<{
    fromElementId: string
    toElementId: string
    sourceHandle?: string
    targetHandle?: string
  }>
}

/** Flow Layout */
export interface ElementLayout {
  [elementId: string]: {
    x: number
    y: number
  }
}

/** Flow Templates */
export const flowTemplates = isPostgres
  ? pgTable('flow_templates', {
      id: pgText('id').primaryKey(),
      name: pgText('name').notNull(),
      description: pgText('description').notNull(),
      elements: jsonb('elements').$type<FlowElement[]>().notNull().default([]),
      relations: jsonb('relations').$type<FlowRelation[]>().notNull().default([]),
      startingElementId: pgText('starting_element_id'),
      layout: jsonb('layout').$type<ElementLayout>(),
      createdAt: timestamp('created_at').notNull().defaultNow(),
      updatedAt: timestamp('updated_at').notNull().defaultNow()
    })
  : sqliteTable('flow_templates', {
      id: text('id').primaryKey(),
      name: text('name').notNull(),
      description: text('description').notNull(),
      elements: text('elements', { mode: 'json' }).$type<FlowElement[]>().notNull().default([]),
      relations: text('relations', { mode: 'json' }).$type<FlowRelation[]>().notNull().default([]),
      startingElementId: text('starting_element_id'),
      layout: text('layout', { mode: 'json' }).$type<ElementLayout>(),
      createdAt: text('created_at').notNull().default(sql`(datetime('now'))`),
      updatedAt: text('updated_at').notNull().default(sql`(datetime('now'))`)
    })

export type FlowTemplate = typeof flowTemplates.$inferSelect
export type NewFlowTemplate = typeof flowTemplates.$inferInsert
export type UpdateFlowTemplate = Partial<Omit<NewFlowTemplate, 'id' | 'createdAt' | 'updatedAt'>>

// Flows table (instances of flow templates)
export const flows = isPostgres
  ? pgTable('flows', {
      id: pgText('id').primaryKey(),
      name: pgText('name').notNull(),
      description: pgText('description'),
      templateId: pgText('template_id'),
      elements: jsonb('elements').$type<FlowElement[]>().notNull().default([]),
      relations: jsonb('relations').$type<FlowRelation[]>().notNull().default([]),
      startingElementId: pgText('starting_element_id').notNull(),
      startedAt: pgText('started_at'),
      expectedEndDate: pgText('expected_end_date'),
      completedAt: pgText('completed_at'),
      hidden: boolean('hidden').notNull().default(false),
      layout: jsonb('layout').$type<ElementLayout>(),
      createdAt: timestamp('created_at').notNull().defaultNow(),
      updatedAt: timestamp('updated_at').notNull().defaultNow()
    })
  : sqliteTable('flows', {
      id: text('id').primaryKey(),
      name: text('name').notNull(),
      description: text('description'),
      templateId: text('template_id'),
      elements: text('elements', { mode: 'json' }).$type<FlowElement[]>().notNull().default([]),
      relations: text('relations', { mode: 'json' }).$type<FlowRelation[]>().notNull().default([]),
      startingElementId: text('starting_element_id').notNull(),
      startedAt: text('started_at'),
      expectedEndDate: text('expected_end_date'),
      completedAt: text('completed_at'),
      hidden: integer('hidden', { mode: 'boolean' }).notNull().default(false),
      layout: text('layout', { mode: 'json' }).$type<ElementLayout>(),
      createdAt: text('created_at').notNull().default(sql`(datetime('now'))`),
      updatedAt: text('updated_at').notNull().default(sql`(datetime('now'))`)
    })

export type Flow = typeof flows.$inferSelect
export type NewFlow = typeof flows.$inferInsert
export type UpdateFlow = Partial<Omit<NewFlow, 'id' | 'createdAt' | 'updatedAt'>>

// FIXME:
// Note: Zod validation schemas can be added by installing drizzle-zod and zod packages
// Example: export const insertUserSchema = createInsertSchema(users)

// Validation helper for API endpoints
export function validateDrizzleInsert<T>(data: T): T {
  // Drizzle handles validation through schema constraints
  // This helper can be used for additional runtime checks if needed
  return data
}

// Export for both database types
export const schema = {
  users,
  teams,
  flowTemplates,
  flows
}

export type DatabaseSchema = typeof schema