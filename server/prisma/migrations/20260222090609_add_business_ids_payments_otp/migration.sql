/*
  Warnings:

  - A unique constraint covering the columns `[phone]` on the table `users` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "clients" ADD COLUMN     "cin" TEXT,
ADD COLUMN     "company_type" TEXT,
ADD COLUMN     "fssai_license" TEXT,
ADD COLUMN     "gstin" TEXT,
ADD COLUMN     "llpin" TEXT,
ADD COLUMN     "msme_udyam" TEXT,
ADD COLUMN     "pan" TEXT,
ADD COLUMN     "state_code" TEXT,
ADD COLUMN     "tan" TEXT;

-- AlterTable
ALTER TABLE "invoices" ADD COLUMN     "e_invoice_data" JSONB,
ADD COLUMN     "irn" TEXT,
ADD COLUMN     "place_of_supply" TEXT,
ADD COLUMN     "supply_type" TEXT DEFAULT 'intra';

-- AlterTable
ALTER TABLE "products" ADD COLUMN     "hsn_code" TEXT;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "bank_account_no" TEXT,
ADD COLUMN     "bank_branch" TEXT,
ADD COLUMN     "bank_ifsc" TEXT,
ADD COLUMN     "bank_name" TEXT,
ADD COLUMN     "cin" TEXT,
ADD COLUMN     "company_type" TEXT,
ADD COLUMN     "dpiit_startup" TEXT,
ADD COLUMN     "email_verified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "fssai_license" TEXT,
ADD COLUMN     "gstin" TEXT,
ADD COLUMN     "iec" TEXT,
ADD COLUMN     "llpin" TEXT,
ADD COLUMN     "msme_udyam" TEXT,
ADD COLUMN     "pan_number" TEXT,
ADD COLUMN     "phone" TEXT,
ADD COLUMN     "phone_verified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "tan" TEXT,
ADD COLUMN     "upi_id" TEXT;

-- CreateTable
CREATE TABLE "subscriptions" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "plan" TEXT NOT NULL DEFAULT 'free_trial',
    "status" TEXT NOT NULL DEFAULT 'active',
    "start_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "end_date" TIMESTAMP(3),
    "trial_ends_at" TIMESTAMP(3),
    "amount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "currency" VARCHAR(3) NOT NULL DEFAULT 'INR',
    "payg_order_key_id" TEXT,
    "last_payment_at" TIMESTAMP(3),
    "cancelled_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payg_transactions" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "order_key_id" TEXT NOT NULL,
    "unique_request_id" TEXT NOT NULL,
    "order_amount" DECIMAL(12,2) NOT NULL,
    "order_status" TEXT,
    "payment_status" INTEGER NOT NULL DEFAULT 0,
    "payment_method" TEXT,
    "payment_transaction_id" TEXT,
    "payment_response_code" INTEGER NOT NULL DEFAULT 0,
    "payment_response_text" TEXT,
    "payment_process_url" TEXT,
    "purpose" TEXT NOT NULL DEFAULT 'subscription',
    "entity_id" INTEGER,
    "raw_response" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payg_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "otp_verifications" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "target" TEXT NOT NULL,
    "target_type" TEXT NOT NULL,
    "otp_code" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "otp_verifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "payg_transactions_unique_request_id_key" ON "payg_transactions"("unique_request_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_phone_key" ON "users"("phone");

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payg_transactions" ADD CONSTRAINT "payg_transactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "otp_verifications" ADD CONSTRAINT "otp_verifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
