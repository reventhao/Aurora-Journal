ALTER TABLE "Media"
ADD COLUMN IF NOT EXISTS "folderId" TEXT;

CREATE TABLE IF NOT EXISTS "MediaFolder" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MediaFolder_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "MediaFolder_slug_key" ON "MediaFolder"("slug");
CREATE INDEX IF NOT EXISTS "Media_folderId_idx" ON "Media"("folderId");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE constraint_schema = 'public'
      AND table_name = 'Media'
      AND constraint_name = 'Media_folderId_fkey'
  ) THEN
    ALTER TABLE "Media"
    ADD CONSTRAINT "Media_folderId_fkey"
    FOREIGN KEY ("folderId") REFERENCES "MediaFolder"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
