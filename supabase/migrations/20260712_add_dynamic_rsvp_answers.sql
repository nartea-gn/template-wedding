-- Additive migration for the configuration-driven RSVP Form Engine.
-- Legacy columns remain available during the compatibility period.
ALTER TABLE rsvp_responses
    ADD COLUMN IF NOT EXISTS form_id TEXT,
    ADD COLUMN IF NOT EXISTS form_version INTEGER,
    ADD COLUMN IF NOT EXISTS locale TEXT,
    ADD COLUMN IF NOT EXISTS answers JSONB;

CREATE INDEX IF NOT EXISTS rsvp_responses_form_id_idx
    ON rsvp_responses (wedding_slug, form_id);
