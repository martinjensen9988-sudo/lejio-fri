-- Migration: Add feature_flags JSONB field to profiles
ALTER TABLE profiles ADD COLUMN feature_flags JSONB DEFAULT '{}'::jsonb;
