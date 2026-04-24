-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('user', 'admin');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('active', 'banned');

-- CreateEnum
CREATE TYPE "BillingMode" AS ENUM ('newapi_ratio', 'detailed_token', 'fixed');

-- CreateEnum
CREATE TYPE "BillStatus" AS ENUM ('pending', 'success', 'failed', 'refunded', 'estimated');

-- CreateEnum
CREATE TYPE "BalanceLogType" AS ENUM ('redeem', 'pre_hold', 'refund_hold', 'final_charge', 'extra_deduct', 'admin_add', 'admin_reduce');

-- CreateEnum
CREATE TYPE "RedeemCodeStatus" AS ENUM ('unused', 'used', 'disabled', 'expired');

-- CreateEnum
CREATE TYPE "AnnouncementType" AS ENUM ('global', 'dashboard', 'maintenance', 'model');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "passwordHash" TEXT NOT NULL,
    "nickname" TEXT,
    "avatar" TEXT,
    "balance" DECIMAL(18,6) NOT NULL DEFAULT 0,
    "frozenBalance" DECIMAL(18,6) NOT NULL DEFAULT 0,
    "status" "UserStatus" NOT NULL DEFAULT 'active',
    "role" "UserRole" NOT NULL DEFAULT 'user',
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiModel" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "modelKey" TEXT NOT NULL,
    "newapiModelName" TEXT NOT NULL,
    "provider" TEXT,
    "description" TEXT,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "visible" BOOLEAN NOT NULL DEFAULT true,
    "sort" INTEGER NOT NULL DEFAULT 0,
    "billingMode" "BillingMode" NOT NULL DEFAULT 'newapi_ratio',
    "quotaType" INTEGER NOT NULL DEFAULT 0,
    "modelRatio" DECIMAL(18,6) NOT NULL DEFAULT 1,
    "completionRatio" DECIMAL(18,6) NOT NULL DEFAULT 1,
    "groupRatio" DECIMAL(18,6) NOT NULL DEFAULT 1,
    "modelPrice" DECIMAL(18,6) NOT NULL DEFAULT 0,
    "quotaToCnyRate" DECIMAL(18,6) NOT NULL DEFAULT 0.000015,
    "inputPricePer1kCny" DECIMAL(18,6) NOT NULL DEFAULT 0,
    "outputPricePer1kCny" DECIMAL(18,6) NOT NULL DEFAULT 0,
    "cacheReadPricePer1kCny" DECIMAL(18,6) NOT NULL DEFAULT 0,
    "cacheWritePricePer1kCny" DECIMAL(18,6) NOT NULL DEFAULT 0,
    "reasoningPricePer1kCny" DECIMAL(18,6) NOT NULL DEFAULT 0,
    "imageInputPricePer1kCny" DECIMAL(18,6) NOT NULL DEFAULT 0,
    "audioInputPricePer1kCny" DECIMAL(18,6) NOT NULL DEFAULT 0,
    "audioOutputPricePer1kCny" DECIMAL(18,6) NOT NULL DEFAULT 0,
    "fixedCostCny" DECIMAL(18,6) NOT NULL DEFAULT 0,
    "fixedPriceCny" DECIMAL(18,6) NOT NULL DEFAULT 0,
    "profitRate" DECIMAL(18,6) NOT NULL DEFAULT 1.6,
    "depositAmount" DECIMAL(18,6) NOT NULL DEFAULT 0.2,
    "minChargeAmount" DECIMAL(18,6) NOT NULL DEFAULT 0.001,
    "maxContextTokens" INTEGER NOT NULL DEFAULT 32000,
    "maxOutputTokens" INTEGER NOT NULL DEFAULT 4096,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AiModel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Conversation" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "modelKey" TEXT NOT NULL,
    "systemPrompt" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Conversation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Message" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "modelKey" TEXT NOT NULL,
    "promptTokens" INTEGER NOT NULL DEFAULT 0,
    "completionTokens" INTEGER NOT NULL DEFAULT 0,
    "totalTokens" INTEGER NOT NULL DEFAULT 0,
    "cachedTokens" INTEGER NOT NULL DEFAULT 0,
    "reasoningTokens" INTEGER NOT NULL DEFAULT 0,
    "imageTokens" INTEGER NOT NULL DEFAULT 0,
    "audioTokens" INTEGER NOT NULL DEFAULT 0,
    "billId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChatBill" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "conversationId" TEXT,
    "modelId" TEXT,
    "modelKey" TEXT NOT NULL,
    "newapiModelName" TEXT NOT NULL,
    "billingMode" "BillingMode" NOT NULL,
    "quotaType" INTEGER NOT NULL,
    "promptTokens" INTEGER NOT NULL DEFAULT 0,
    "completionTokens" INTEGER NOT NULL DEFAULT 0,
    "totalTokens" INTEGER NOT NULL DEFAULT 0,
    "cachedTokens" INTEGER NOT NULL DEFAULT 0,
    "nonCachedPromptTokens" INTEGER NOT NULL DEFAULT 0,
    "reasoningTokens" INTEGER NOT NULL DEFAULT 0,
    "imageTokens" INTEGER NOT NULL DEFAULT 0,
    "audioInputTokens" INTEGER NOT NULL DEFAULT 0,
    "audioOutputTokens" INTEGER NOT NULL DEFAULT 0,
    "modelRatio" DECIMAL(18,6) NOT NULL DEFAULT 1,
    "completionRatio" DECIMAL(18,6) NOT NULL DEFAULT 1,
    "groupRatio" DECIMAL(18,6) NOT NULL DEFAULT 1,
    "modelPrice" DECIMAL(18,6) NOT NULL DEFAULT 0,
    "quotaToCnyRate" DECIMAL(18,6) NOT NULL DEFAULT 0.000015,
    "quota" DECIMAL(18,6) NOT NULL DEFAULT 0,
    "costCny" DECIMAL(18,6) NOT NULL DEFAULT 0,
    "userCostCny" DECIMAL(18,6) NOT NULL DEFAULT 0,
    "profitCny" DECIMAL(18,6) NOT NULL DEFAULT 0,
    "profitRate" DECIMAL(18,6) NOT NULL DEFAULT 1,
    "depositAmount" DECIMAL(18,6) NOT NULL DEFAULT 0,
    "refundAmount" DECIMAL(18,6) NOT NULL DEFAULT 0,
    "extraDeductAmount" DECIMAL(18,6) NOT NULL DEFAULT 0,
    "status" "BillStatus" NOT NULL DEFAULT 'pending',
    "errorMessage" TEXT,
    "rawUsage" JSONB,
    "rawResponseId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "settledAt" TIMESTAMP(3),

    CONSTRAINT "ChatBill_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BalanceLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "billId" TEXT,
    "redeemCodeId" TEXT,
    "type" "BalanceLogType" NOT NULL,
    "amount" DECIMAL(18,6) NOT NULL,
    "balanceBefore" DECIMAL(18,6) NOT NULL,
    "balanceAfter" DECIMAL(18,6) NOT NULL,
    "frozenBefore" DECIMAL(18,6) NOT NULL DEFAULT 0,
    "frozenAfter" DECIMAL(18,6) NOT NULL DEFAULT 0,
    "remark" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BalanceLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RedeemCode" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "amount" DECIMAL(18,6) NOT NULL,
    "status" "RedeemCodeStatus" NOT NULL DEFAULT 'unused',
    "batchNo" TEXT,
    "remark" TEXT,
    "usedByUserId" TEXT,
    "usedAt" TIMESTAMP(3),
    "expiredAt" TIMESTAMP(3),
    "createdByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RedeemCode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SystemSetting" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "description" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SystemSetting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Announcement" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "type" "AnnouncementType" NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Announcement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_phone_key" ON "User"("phone");

-- CreateIndex
CREATE INDEX "User_role_status_idx" ON "User"("role", "status");

-- CreateIndex
CREATE INDEX "User_createdAt_idx" ON "User"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "AiModel_modelKey_key" ON "AiModel"("modelKey");

-- CreateIndex
CREATE INDEX "AiModel_enabled_visible_sort_idx" ON "AiModel"("enabled", "visible", "sort");

-- CreateIndex
CREATE INDEX "Conversation_userId_updatedAt_idx" ON "Conversation"("userId", "updatedAt");

-- CreateIndex
CREATE INDEX "Conversation_modelKey_idx" ON "Conversation"("modelKey");

-- CreateIndex
CREATE INDEX "Message_conversationId_createdAt_idx" ON "Message"("conversationId", "createdAt");

-- CreateIndex
CREATE INDEX "Message_userId_createdAt_idx" ON "Message"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "Message_billId_idx" ON "Message"("billId");

-- CreateIndex
CREATE UNIQUE INDEX "ChatBill_requestId_key" ON "ChatBill"("requestId");

-- CreateIndex
CREATE INDEX "ChatBill_userId_createdAt_idx" ON "ChatBill"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "ChatBill_conversationId_idx" ON "ChatBill"("conversationId");

-- CreateIndex
CREATE INDEX "ChatBill_modelId_idx" ON "ChatBill"("modelId");

-- CreateIndex
CREATE INDEX "ChatBill_status_createdAt_idx" ON "ChatBill"("status", "createdAt");

-- CreateIndex
CREATE INDEX "BalanceLog_userId_createdAt_idx" ON "BalanceLog"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "BalanceLog_billId_idx" ON "BalanceLog"("billId");

-- CreateIndex
CREATE INDEX "BalanceLog_redeemCodeId_idx" ON "BalanceLog"("redeemCodeId");

-- CreateIndex
CREATE INDEX "BalanceLog_type_createdAt_idx" ON "BalanceLog"("type", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "RedeemCode_code_key" ON "RedeemCode"("code");

-- CreateIndex
CREATE INDEX "RedeemCode_status_expiredAt_idx" ON "RedeemCode"("status", "expiredAt");

-- CreateIndex
CREATE INDEX "RedeemCode_batchNo_idx" ON "RedeemCode"("batchNo");

-- CreateIndex
CREATE INDEX "RedeemCode_createdAt_idx" ON "RedeemCode"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "SystemSetting_key_key" ON "SystemSetting"("key");

-- CreateIndex
CREATE INDEX "Announcement_type_enabled_createdAt_idx" ON "Announcement"("type", "enabled", "createdAt");

-- AddForeignKey
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_billId_fkey" FOREIGN KEY ("billId") REFERENCES "ChatBill"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatBill" ADD CONSTRAINT "ChatBill_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatBill" ADD CONSTRAINT "ChatBill_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatBill" ADD CONSTRAINT "ChatBill_modelId_fkey" FOREIGN KEY ("modelId") REFERENCES "AiModel"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BalanceLog" ADD CONSTRAINT "BalanceLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BalanceLog" ADD CONSTRAINT "BalanceLog_billId_fkey" FOREIGN KEY ("billId") REFERENCES "ChatBill"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BalanceLog" ADD CONSTRAINT "BalanceLog_redeemCodeId_fkey" FOREIGN KEY ("redeemCodeId") REFERENCES "RedeemCode"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RedeemCode" ADD CONSTRAINT "RedeemCode_usedByUserId_fkey" FOREIGN KEY ("usedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RedeemCode" ADD CONSTRAINT "RedeemCode_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

