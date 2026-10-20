-- AlterTable
ALTER TABLE "Booking" ADD COLUMN     "accessToken" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Booking_accessToken_key" ON "Booking"("accessToken");

