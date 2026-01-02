-- Migration: Add 'closed' status to loan status enum
-- Date: 2026-01-02
-- Description: Adds 'closed' status option to preserve completed loans without deletion

-- Modify the status ENUM to add 'closed' option
ALTER TABLE loans
MODIFY COLUMN status ENUM('active', 'due', 'pastDue', 'paid', 'defaulted', 'closed')
DEFAULT 'active';
