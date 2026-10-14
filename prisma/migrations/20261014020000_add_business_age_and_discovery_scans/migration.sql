-- Store a public establishment year separately from the date the lead was discovered.
ALTER TABLE "businesses"
ADD COLUMN "established_year" INTEGER,
ADD COLUMN "established_year_source" TEXT;

-- Persist scan progress so the UI can report the real background-job state.
CREATE TABLE "discovery_scans" (
    "id" UUID NOT NULL,
    "category" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "barangay" TEXT,
    "status" TEXT NOT NULL DEFAULT 'QUEUED',
    "message" TEXT NOT NULL DEFAULT 'Waiting to start',
    "found_count" INTEGER NOT NULL DEFAULT 0,
    "added_count" INTEGER NOT NULL DEFAULT 0,
    "updated_count" INTEGER NOT NULL DEFAULT 0,
    "skipped_count" INTEGER NOT NULL DEFAULT 0,
    "error" TEXT,
    "started_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "discovery_scans_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "idx_discovery_scans_status_created"
ON "discovery_scans"("status", "created_at");
