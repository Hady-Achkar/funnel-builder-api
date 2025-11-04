-- CreateEnum
CREATE TYPE "AITokenOperation" AS ENUM ('GENERATION', 'DEDUCTION', 'RESET', 'ADJUSTMENT', 'REFUND');

-- CreateTable
CREATE TABLE "ai_generation_logs" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "workspaceId" INTEGER NOT NULL,
    "funnelId" INTEGER,
    "prompt" TEXT NOT NULL,
    "tokensUsed" INTEGER NOT NULL,
    "pagesGenerated" INTEGER NOT NULL,
    "model" TEXT NOT NULL DEFAULT 'claude-3-5-sonnet-20241022',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_generation_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_token_balances" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "tokensUsed" INTEGER NOT NULL DEFAULT 0,
    "tokensLimit" INTEGER,
    "lastResetAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ai_token_balances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_token_history" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "tokensUsed" INTEGER NOT NULL,
    "operation" "AITokenOperation" NOT NULL,
    "generationLogId" INTEGER,
    "description" TEXT,
    "balanceBefore" INTEGER NOT NULL,
    "balanceAfter" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_token_history_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ai_generation_logs_userId_idx" ON "ai_generation_logs"("userId");

-- CreateIndex
CREATE INDEX "ai_generation_logs_workspaceId_idx" ON "ai_generation_logs"("workspaceId");

-- CreateIndex
CREATE INDEX "ai_generation_logs_createdAt_idx" ON "ai_generation_logs"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "ai_token_balances_userId_key" ON "ai_token_balances"("userId");

-- CreateIndex
CREATE INDEX "ai_token_balances_userId_idx" ON "ai_token_balances"("userId");

-- CreateIndex
CREATE INDEX "ai_token_history_userId_idx" ON "ai_token_history"("userId");

-- CreateIndex
CREATE INDEX "ai_token_history_createdAt_idx" ON "ai_token_history"("createdAt");

-- CreateIndex
CREATE INDEX "ai_token_history_operation_idx" ON "ai_token_history"("operation");

-- AddForeignKey
ALTER TABLE "ai_generation_logs" ADD CONSTRAINT "ai_generation_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_generation_logs" ADD CONSTRAINT "ai_generation_logs_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_generation_logs" ADD CONSTRAINT "ai_generation_logs_funnelId_fkey" FOREIGN KEY ("funnelId") REFERENCES "funnels"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_token_balances" ADD CONSTRAINT "ai_token_balances_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_token_history" ADD CONSTRAINT "ai_token_history_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
