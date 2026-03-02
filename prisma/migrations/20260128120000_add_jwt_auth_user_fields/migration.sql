-- AlterTable: make clerkId optional, add email and passwordHash for JWT auth
ALTER TABLE "User" ALTER COLUMN "clerkId" DROP NOT NULL;
ALTER TABLE "User" ADD COLUMN "email" TEXT;
ALTER TABLE "User" ADD COLUMN "passwordHash" TEXT;

-- CreateIndex: unique email for login
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
