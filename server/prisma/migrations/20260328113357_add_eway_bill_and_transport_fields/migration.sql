-- AlterTable
ALTER TABLE "invoices" ADD COLUMN     "distance_km" INTEGER,
ADD COLUMN     "eway_bill_number" TEXT,
ADD COLUMN     "sent_at" TIMESTAMP(3),
ADD COLUMN     "transport_mode" TEXT,
ADD COLUMN     "transporter_gstin" TEXT,
ADD COLUMN     "transporter_name" TEXT,
ADD COLUMN     "vehicle_number" TEXT;
