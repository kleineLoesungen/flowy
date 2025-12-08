-- PostgreSQL Migration: Make template description optional
-- This migration alters the flow_templates table to allow NULL values for the description column

ALTER TABLE flow_templates 
  ALTER COLUMN description DROP NOT NULL;

-- Update existing records with NULL descriptions to empty strings for consistency
UPDATE flow_templates 
  SET description = '' 
  WHERE description IS NULL;
