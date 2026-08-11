-- CreateEnum
CREATE TYPE "DiscoverySource" AS ENUM ('OSM_OVERPASS', 'GOOGLE_SEARCH_API', 'BING_SEARCH_API', 'MANUAL_ENTRY');

-- CreateEnum
CREATE TYPE "WebsiteStatus" AS ENUM ('NO_WEBSITE', 'FACEBOOK_ONLY', 'PARKED_DOMAIN', 'OUTDATED_SITE', 'BROKEN_SITE', 'FULLY_FUNCTIONAL');

-- CreateEnum
CREATE TYPE "ContactType" AS ENUM ('BUSINESS_EMAIL', 'BUSINESS_PHONE', 'FACEBOOK_MESSENGER', 'WHATSAPP', 'VIBER');

-- CreateEnum
CREATE TYPE "OutreachStatus" AS ENUM ('DRAFTED', 'PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'QUEUED', 'SENT', 'FAILED', 'REPLIED', 'OPTED_OUT');

-- CreateTable
CREATE TABLE "businesses" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "normalized_name" TEXT NOT NULL,
    "business_category" TEXT NOT NULL,
    "description" TEXT,
    "barangay" TEXT NOT NULL,
    "city" TEXT NOT NULL DEFAULT 'Cebu City',
    "province" TEXT NOT NULL DEFAULT 'Cebu',
    "latitude" DECIMAL(10,8),
    "longitude" DECIMAL(11,8),
    "discovery_source" "DiscoverySource" NOT NULL,
    "source_url" TEXT,
    "date_discovered" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "date_last_checked" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "businesses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "digital_presence" (
    "id" UUID NOT NULL,
    "business_id" UUID NOT NULL,
    "website_url" TEXT,
    "website_status" "WebsiteStatus" NOT NULL DEFAULT 'NO_WEBSITE',
    "http_status_code" INTEGER,
    "has_ssl" BOOLEAN NOT NULL DEFAULT false,
    "is_mobile_responsive" BOOLEAN NOT NULL DEFAULT false,
    "facebook_url" TEXT,
    "instagram_url" TEXT,
    "has_online_booking" BOOLEAN NOT NULL DEFAULT false,
    "has_ecommerce" BOOLEAN NOT NULL DEFAULT false,
    "detected_technologies" JSONB NOT NULL DEFAULT '[]',
    "raw_audit_data" JSONB NOT NULL DEFAULT '{}',
    "audited_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "digital_presence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contacts" (
    "id" UUID NOT NULL,
    "business_id" UUID NOT NULL,
    "contact_type" "ContactType" NOT NULL,
    "contact_value" TEXT NOT NULL,
    "source_url" TEXT,
    "verification_status" TEXT NOT NULL DEFAULT 'UNVERIFIED',
    "do_not_contact" BOOLEAN NOT NULL DEFAULT false,
    "last_verified" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "contacts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "opportunity_analysis" (
    "id" UUID NOT NULL,
    "business_id" UUID NOT NULL,
    "primary_problem" TEXT NOT NULL,
    "recommended_service" TEXT NOT NULL,
    "opportunity_summary" TEXT NOT NULL,
    "recommended_offer" TEXT NOT NULL,
    "lead_score" INTEGER NOT NULL,
    "confidence_score" DECIMAL(3,2) NOT NULL,
    "ai_model" TEXT NOT NULL,
    "analysis_raw_json" JSONB NOT NULL,
    "analyzed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "opportunity_analysis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "outreach" (
    "id" UUID NOT NULL,
    "business_id" UUID NOT NULL,
    "contact_id" UUID,
    "channel" TEXT NOT NULL DEFAULT 'EMAIL',
    "subject" TEXT NOT NULL,
    "message_body" TEXT NOT NULL,
    "status" "OutreachStatus" NOT NULL DEFAULT 'PENDING_APPROVAL',
    "approved_by" TEXT,
    "approved_at" TIMESTAMP(3),
    "rejection_reason" TEXT,
    "sent_at" TIMESTAMP(3),
    "resend_message_id" TEXT,
    "replied_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "outreach_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "followups" (
    "id" UUID NOT NULL,
    "outreach_id" UUID NOT NULL,
    "step_number" INTEGER NOT NULL,
    "scheduled_at" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'SCHEDULED',
    "subject" TEXT NOT NULL,
    "message_body" TEXT NOT NULL,
    "sent_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "followups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "suppression_list" (
    "id" UUID NOT NULL,
    "contact_value" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'USER_OPT_OUT',
    "date_added" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "suppression_list_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" UUID NOT NULL,
    "action" TEXT NOT NULL,
    "actor" TEXT NOT NULL,
    "target_entity" TEXT NOT NULL,
    "target_id" UUID,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_businesses_normalized_name" ON "businesses"("normalized_name");

-- CreateIndex
CREATE INDEX "idx_businesses_barangay" ON "businesses"("barangay");

-- CreateIndex
CREATE INDEX "idx_businesses_category" ON "businesses"("business_category");

-- CreateIndex
CREATE UNIQUE INDEX "digital_presence_business_id_key" ON "digital_presence"("business_id");

-- CreateIndex
CREATE INDEX "idx_contacts_value" ON "contacts"("contact_value");

-- CreateIndex
CREATE UNIQUE INDEX "opportunity_analysis_business_id_key" ON "opportunity_analysis"("business_id");

-- CreateIndex
CREATE INDEX "idx_outreach_status" ON "outreach"("status");

-- CreateIndex
CREATE UNIQUE INDEX "suppression_list_contact_value_key" ON "suppression_list"("contact_value");

-- CreateIndex
CREATE INDEX "idx_suppression_value" ON "suppression_list"("contact_value");

-- AddForeignKey
ALTER TABLE "digital_presence" ADD CONSTRAINT "digital_presence_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contacts" ADD CONSTRAINT "contacts_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "opportunity_analysis" ADD CONSTRAINT "opportunity_analysis_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "outreach" ADD CONSTRAINT "outreach_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "outreach" ADD CONSTRAINT "outreach_contact_id_fkey" FOREIGN KEY ("contact_id") REFERENCES "contacts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "followups" ADD CONSTRAINT "followups_outreach_id_fkey" FOREIGN KEY ("outreach_id") REFERENCES "outreach"("id") ON DELETE CASCADE ON UPDATE CASCADE;
