-- Migration: Token-based to Prompt-based System
-- This migration renames all token-related tables and columns to prompt-based equivalents

-- Step 1: Rename tables
ALTER TABLE "ai_token_balances" RENAME TO "ai_prompt_balances";
ALTER TABLE "ai_token_history" RENAME TO "ai_prompt_history";

-- Step 2: Rename columns in ai_prompt_balances
ALTER TABLE "ai_prompt_balances" RENAME COLUMN "tokensUsed" TO "promptsUsed";
ALTER TABLE "ai_prompt_balances" RENAME COLUMN "tokensLimit" TO "promptsLimit";

-- Step 3: Rename columns in ai_prompt_history
ALTER TABLE "ai_prompt_history" RENAME COLUMN "tokensUsed" TO "promptsUsed";

-- Step 4: Update ai_generation_logs table
ALTER TABLE "ai_generation_logs" RENAME COLUMN "tokensUsed" TO "actualTokensUsed";
ALTER TABLE "ai_generation_logs" ADD COLUMN "promptsUsed" INTEGER NOT NULL DEFAULT 1;

-- Step 5: Rename enum type
ALTER TYPE "AITokenOperation" RENAME TO "AIPromptOperation";

-- Step 6: Add new PURCHASE operation to enum
ALTER TYPE "AIPromptOperation" ADD VALUE IF NOT EXISTS 'PURCHASE';

-- Step 7: Reset all prompt balances to 0 (dev mode)
UPDATE "ai_prompt_balances" SET "promptsUsed" = 0;

-- Step 8: Rename indexes
ALTER INDEX "ai_token_balances_userId_key" RENAME TO "ai_prompt_balances_userId_key";
ALTER INDEX "ai_token_balances_userId_idx" RENAME TO "ai_prompt_balances_userId_idx";
ALTER INDEX "ai_token_history_userId_idx" RENAME TO "ai_prompt_history_userId_idx";
ALTER INDEX "ai_token_history_createdAt_idx" RENAME TO "ai_prompt_history_createdAt_idx";
ALTER INDEX "ai_token_history_operation_idx" RENAME TO "ai_prompt_history_operation_idx";
