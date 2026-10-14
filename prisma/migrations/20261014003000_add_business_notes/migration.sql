-- Keep the database schema aligned with the optional notes field on Business.
ALTER TABLE "businesses" ADD COLUMN "notes" TEXT DEFAULT '';
