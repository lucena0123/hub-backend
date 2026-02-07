-- Fix: action_approvals.decided_by_user_id must allow NULL for anonymous approvals (optionalAuth)
ALTER TABLE action_approvals ALTER COLUMN decided_by_user_id DROP NOT NULL;
