/**
 * Embedded SQL migrations for production builds
 * These are bundled into the code so they don't need to be loaded from the filesystem
 */

export interface Migration {
  name: string
  sql: string
}

export const postgresMigrations: Migration[] = [
  {
    name: '0001_initial.sql',
    sql: `-- PostgreSQL Migration: Initial schema
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('member', 'admin')),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS teams (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  user_ids JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS flow_templates (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  elements JSONB NOT NULL DEFAULT '[]',
  relations JSONB NOT NULL DEFAULT '[]',
  starting_element_id TEXT,
  layout JSONB,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS flows (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  template_id TEXT,
  elements JSONB NOT NULL DEFAULT '[]',
  relations JSONB NOT NULL DEFAULT '[]',
  starting_element_id TEXT NOT NULL,
  started_at TEXT,
  expected_end_date TEXT,
  completed_at TEXT,
  hidden BOOLEAN NOT NULL DEFAULT FALSE,
  layout JSONB,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);`
  }
]
