// Unified Schema for both SQLite and PostgreSQL
import { sql } from 'drizzle-orm'
import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core'
import { pgTable, text as pgText, integer as pgInteger, timestamp, boolean, jsonb } from 'drizzle-orm/pg-core'

// Determine which database we're using
const isPostgres = !!process.env.PG_ConnectionString

// Users table
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

// Teams table
export const teams = isPostgres
  ? pgTable('teams', {
      id: pgText('id').primaryKey(),
      name: pgText('name').notNull(),
      userIds: jsonb('user_ids').$type<string[]>().default([]),
      createdAt: timestamp('created_at').notNull().defaultNow(),
      updatedAt: timestamp('updated_at').notNull().defaultNow()
    })
  : sqliteTable('teams', {
      id: text('id').primaryKey(),
      name: text('name').notNull(),
      userIds: text('user_ids', { mode: 'json' }).$type<string[]>().default([]),
      createdAt: text('created_at').notNull().default(sql`(datetime('now'))`),
      updatedAt: text('updated_at').notNull().default(sql`(datetime('now'))`)
    })

// Flow Templates table
export const flowTemplates = isPostgres
  ? pgTable('flow_templates', {
      id: pgText('id').primaryKey(),
      name: pgText('name').notNull(),
      description: pgText('description').notNull(),
      elements: jsonb('elements').$type<Array<{
        id: string;
        name: string;
        description: string;
        type: 'action' | 'state' | 'artefact';
        ownerTeamId: string | null;
        durationDays: number | null;
        consultedTeamIds: string[];
      }>>().default([]),
      relations: jsonb('relations').$type<Array<{
        id: string;
        type: 'flow' | 'or' | 'and' | 'in' | 'out';
        connections: Array<{
          fromElementId: string;
          toElementId: string;
          sourceHandle?: string;
          targetHandle?: string;
        }>;
      }>>().default([]),
      startingElementId: pgText('starting_element_id'),
      layout: jsonb('layout').$type<{ [elementId: string]: { x: number; y: number } }>(),
      createdAt: timestamp('created_at').notNull().defaultNow(),
      updatedAt: timestamp('updated_at').notNull().defaultNow()
    })
  : sqliteTable('flow_templates', {
      id: text('id').primaryKey(),
      name: text('name').notNull(),
      description: text('description').notNull(),
      elements: text('elements', { mode: 'json' }).$type<Array<{
        id: string;
        name: string;
        description: string;
        type: 'action' | 'state' | 'artefact';
        ownerTeamId: string | null;
        durationDays: number | null;
        consultedTeamIds: string[];
      }>>().default([]),
      relations: text('relations', { mode: 'json' }).$type<Array<{
        id: string;
        type: 'flow' | 'or' | 'and' | 'in' | 'out';
        connections: Array<{
          fromElementId: string;
          toElementId: string;
          sourceHandle?: string;
          targetHandle?: string;
        }>;
      }>>().default([]),
      startingElementId: text('starting_element_id'),
      layout: text('layout', { mode: 'json' }).$type<{ [elementId: string]: { x: number; y: number } }>(),
      createdAt: text('created_at').notNull().default(sql`(datetime('now'))`),
      updatedAt: text('updated_at').notNull().default(sql`(datetime('now'))`)
    })

// Flows table (instances of flow templates)
export const flows = isPostgres
  ? pgTable('flows', {
      id: pgText('id').primaryKey(),
      name: pgText('name').notNull(),
      description: pgText('description'),
      templateId: pgText('template_id'),
      elements: jsonb('elements').$type<Array<{
        id: string;
        name: string;
        description: string;
        ownerTeamId: string | null;
        consultedTeamIds: string[];
        completedAt: string | null;
        expectedEndedAt: string | null;
        type: 'action' | 'state' | 'artefact';
        status: 'pending' | 'in-progress' | 'completed' | 'aborted';
        comments: Array<{
          id: string;
          timestamp: string;
          comment: string;
          userId: string;
          userName?: string;
          userEmail?: string;
          statusTag?: 'pending' | 'in-progress' | 'completed' | 'aborted';
        }>;
      }>>().default([]),
      relations: jsonb('relations').$type<Array<{
        id: string;
        type: 'flow' | 'or' | 'and' | 'in' | 'out';
        connections: Array<{
          fromElementId: string;
          toElementId: string;
          sourceHandle?: string;
          targetHandle?: string;
        }>;
      }>>().default([]),
      startingElementId: pgText('starting_element_id').notNull(),
      startedAt: pgText('started_at'),
      expectedEndDate: pgText('expected_end_date'),
      completedAt: pgText('completed_at'),
      hidden: boolean('hidden').default(false),
      layout: jsonb('layout').$type<{ [elementId: string]: { x: number; y: number } }>(),
      createdAt: timestamp('created_at').notNull().defaultNow(),
      updatedAt: timestamp('updated_at').notNull().defaultNow()
    })
  : sqliteTable('flows', {
      id: text('id').primaryKey(),
      name: text('name').notNull(),
      description: text('description'),
      templateId: text('template_id'),
      elements: text('elements', { mode: 'json' }).$type<Array<{
        id: string;
        name: string;
        description: string;
        ownerTeamId: string | null;
        consultedTeamIds: string[];
        completedAt: string | null;
        expectedEndedAt: string | null;
        type: 'action' | 'state' | 'artefact';
        status: 'pending' | 'in-progress' | 'completed' | 'aborted';
        comments: Array<{
          id: string;
          timestamp: string;
          comment: string;
          userId: string;
          userName?: string;
          userEmail?: string;
          statusTag?: 'pending' | 'in-progress' | 'completed' | 'aborted';
        }>;
      }>>().default([]),
      relations: text('relations', { mode: 'json' }).$type<Array<{
        id: string;
        type: 'flow' | 'or' | 'and' | 'in' | 'out';
        connections: Array<{
          fromElementId: string;
          toElementId: string;
          sourceHandle?: string;
          targetHandle?: string;
        }>;
      }>>().default([]),
      startingElementId: text('starting_element_id').notNull(),
      startedAt: text('started_at'),
      expectedEndDate: text('expected_end_date'),
      completedAt: text('completed_at'),
      hidden: integer('hidden', { mode: 'boolean' }).default(false),
      layout: text('layout', { mode: 'json' }).$type<{ [elementId: string]: { x: number; y: number } }>(),
      createdAt: text('created_at').notNull().default(sql`(datetime('now'))`),
      updatedAt: text('updated_at').notNull().default(sql`(datetime('now'))`)
    })

// Create aliases for backward compatibility
export const pgUsers = users
export const pgTeams = teams  
export const pgFlowTemplates = flowTemplates
export const pgFlows = flows

export const sqliteUsers = users
export const sqliteTeams = teams
export const sqliteFlowTemplates = flowTemplates  
export const sqliteFlows = flows

// Type exports that work for both databases
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Team = typeof teams.$inferSelect;
export type NewTeam = typeof teams.$inferInsert;
export type FlowTemplate = typeof flowTemplates.$inferSelect;
export type NewFlowTemplate = typeof flowTemplates.$inferInsert;
export type Flow = typeof flows.$inferSelect;
export type NewFlow = typeof flows.$inferInsert;
