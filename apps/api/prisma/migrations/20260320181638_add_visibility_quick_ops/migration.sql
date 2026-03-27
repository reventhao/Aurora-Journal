-- AlterTable
ALTER TABLE "Category" ADD COLUMN     "visible" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "Tag" ADD COLUMN     "visible" BOOLEAN NOT NULL DEFAULT true;
