-- Bootstrap the legacy RSVP table when migrations run against an empty project.
-- The production project already records this migration as applied, so this
-- idempotent prelude only affects new installations.
CREATE TABLE IF NOT EXISTS public.rsvp_responses
(
    id
    BIGSERIAL
    PRIMARY
    KEY,
    wedding_slug
    TEXT
    NOT
    NULL
    DEFAULT
    'boda-general',
    full_name
    TEXT
    NOT
    NULL,
    attending
    BOOLEAN
    NOT
    NULL,
    dietary_options
    TEXT[]
    NOT
    NULL
    DEFAULT
    '{}',
    dietary_other
    TEXT,
    bus_option
    TEXT,
    song_request
    TEXT,
    message
    TEXT,
    created_at
    TIMESTAMPTZ
    NOT
    NULL
    DEFAULT
    now
(
)
    );

-- Additive evolution for the configuration-driven RSVP Form Engine.
-- Legacy columns remain available during the compatibility period.
ALTER TABLE public.rsvp_responses
    ADD COLUMN IF NOT EXISTS form_id TEXT,
    ADD COLUMN IF NOT EXISTS form_version INTEGER,
    ADD COLUMN IF NOT EXISTS locale TEXT,
    ADD COLUMN IF NOT EXISTS answers JSONB;

CREATE INDEX IF NOT EXISTS rsvp_responses_form_id_idx
    ON public.rsvp_responses (wedding_slug, form_id);
