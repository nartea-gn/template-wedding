-- Local development seed. Applied by `supabase db reset` and `supabase start`, never by
-- `supabase db push`: seeds are a CLI-local mechanism and no deploy path reads this file.
--
-- It exists because a freshly reset stack could not exercise the product at all. Without a row in
-- `invitations` the RSVP refuses every submission with `RSVPU`, and without an administrator the
-- panel stops at its login form -- so the two surfaces that hold the most logic were unreachable
-- in local development and in review.
--
-- READ BEFORE EXTENDING
--
-- Every name, message and address below is invented. Do not paste a real guest list in here: this
-- file is versioned, and `rsvp_responses` holds article 9 health data whose retention is stated to
-- the guest in the article 13 notice of the form.
--
-- The password hash is generated with pgcrypto rather than hard-coded, so nothing here is a
-- credential that could be reused anywhere. The account only exists inside a local container.
--
--   email:    admin@ejemplo.local
--   password: Revision2026!

BEGIN;

-- ---------------------------------------------------------------------------------------------
-- The invitation. `default_rsvp_deadline` fills `rsvp_deadline_utc` at 14 days before the date.
-- ---------------------------------------------------------------------------------------------

INSERT INTO public.invitations (wedding_slug, event_date_utc)
VALUES ('gala-y-valentin', '2027-06-12T10:00:00Z')
ON CONFLICT (wedding_slug) DO NOTHING;

-- ---------------------------------------------------------------------------------------------
-- The administrator.
--
-- `capabilities.admin.auth.method` is `password`, so gotrue authenticates against
-- `auth.users.encrypted_password` and expects the matching `auth.identities` row for the email
-- provider. `provision-admins.mjs` is the supported route for a real project -- it goes through
-- the Auth admin API -- but it needs a service key, and a local seed has none.
-- ---------------------------------------------------------------------------------------------

-- Guarded as a whole. `auth.users` and `auth.identities` belong to gotrue's migrations, not to
-- this repository's, and the bare Postgres image ships a reduced `auth.users` without
-- `email_confirmed_at`. Aborting a whole `db reset` over that would cost more than the account is
-- worth, so the seed reports what it skipped and carries on with the rest.
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'auth' AND table_name = 'users' AND column_name = 'email_confirmed_at'
    ) THEN
        RAISE NOTICE 'gotrue has not migrated auth.users yet; skipping the administrator';
        RETURN;
    END IF;

    -- The four token columns are set to '' rather than left NULL. gotrue scans them into
    -- non-pointer strings, so a NULL makes every request to /auth/v1 answer
    -- `500 Database error querying schema` -- the login fails with a message that points at the
    -- database and not at the row that caused it. They are the four columns of `auth.users` that
    -- carry no DEFAULT; the rest fill themselves in.
    INSERT INTO auth.users (
        instance_id, id, aud, role, email, encrypted_password,
        email_confirmed_at, created_at, updated_at,
        raw_app_meta_data, raw_user_meta_data,
        confirmation_token, recovery_token, email_change_token_new, email_change
    )
    VALUES (
        '00000000-0000-0000-0000-000000000000',
        'e5b7c1a4-0000-4000-8000-000000000001',
        'authenticated', 'authenticated',
        'admin@ejemplo.local',
        extensions.crypt('Revision2026!', extensions.gen_salt('bf')),
        now(), now(), now(),
        '{"provider": "email", "providers": ["email"]}'::jsonb,
        '{}'::jsonb,
        '', '', '', ''
    )
    ON CONFLICT (id) DO NOTHING;

    IF to_regclass('auth.identities') IS NOT NULL THEN
        -- `email` is omitted on purpose: gotrue declares it
        -- `GENERATED ALWAYS AS (lower(identity_data->>'email')) STORED`, so naming it fails the
        -- whole seed with `cannot insert a non-DEFAULT value into column "email"` (428C9), and
        -- `supabase start` rolls the stack back on that.
        INSERT INTO auth.identities (provider_id, user_id, identity_data, provider, created_at, updated_at)
        VALUES (
            'e5b7c1a4-0000-4000-8000-000000000001',
            'e5b7c1a4-0000-4000-8000-000000000001',
            '{"sub": "e5b7c1a4-0000-4000-8000-000000000001", "email": "admin@ejemplo.local", "email_verified": true, "phone_verified": false}'::jsonb,
            'email', now(), now()
        )
        ON CONFLICT DO NOTHING;
    END IF;

    INSERT INTO public.invitation_admins (invitation_id, user_id)
    VALUES ('gala-y-valentin', 'e5b7c1a4-0000-4000-8000-000000000001')
    ON CONFLICT DO NOTHING;
END
$$;

-- ---------------------------------------------------------------------------------------------
-- Responses.
--
-- Enough of them to exercise what a handful cannot: the filters, the sort, the pagination and the
-- CSV export all behave differently past one page. Names are generated so they stay unique --
-- `rsvp_responses_identity_unique` covers (wedding_slug, identity_key) for live rows.
--
-- Inserted as the table owner, so the closure gate in `require_rsvp_open()` does not apply: it is
-- scoped to `anon` and `authenticated`, the roles that reach the API.
--
-- Guarded on the slug being empty rather than relying on ON CONFLICT, which never fires here:
-- `rsvp_responses_20_redirect_duplicate` returns NULL first, so a second run turned all 60 rows
-- into guest corrections -- 58 `corrected` audit entries -- and re-inserted the two soft-deleted
-- ones, which sit outside the partial unique index. A no-op is the only safe second run, and
-- deleting rows to make room would be the wrong instinct in a file a human can point at a real
-- database by hand.
-- ---------------------------------------------------------------------------------------------

DO $seed_responses$
BEGIN

IF EXISTS (SELECT 1 FROM public.rsvp_responses WHERE wedding_slug = 'gala-y-valentin') THEN
    RAISE NOTICE 'gala-y-valentin already has responses; leaving them untouched';
    RETURN;
END IF;

INSERT INTO public.rsvp_responses (
    wedding_slug, full_name, attending, dietary_options, dietary_other,
    bus_option, song_request, message, form_id, form_version, locale, answers, created_at
)
SELECT
    'gala-y-valentin',
    guest.full_name,
    guest.attending,
    guest.dietary_options,
    guest.dietary_other,
    guest.bus_option,
    guest.song_request,
    guest.message,
    'wedding-rsvp',
    2,
    guest.locale,
    jsonb_strip_nulls(jsonb_build_object(
        'fullName', guest.full_name,
        'attending', guest.attending,
        'dietaryConsent', guest.dietary_options <> '{}'::text[],
        'dietaryOptions', to_jsonb(guest.dietary_options),
        'dietaryOther', guest.dietary_other,
        'busOption', guest.bus_option,
        'songRequest', guest.song_request,
        'message', guest.message
    )),
    now() - (guest.position || ' hours')::interval
FROM (
    SELECT
        position,
        (ARRAY['Ana','Bruno','Carla','Dario','Elena','Fermin','Gala','Hugo','Iria','Jon',
               'Lucia','Mateo','Nerea','Oscar','Paula','Quim','Rocio','Samuel','Teresa','Unai'])
            [1 + (position % 20)]
        || ' '
        || (ARRAY['Lopez','Diaz','Ruiz','Sanz','Vega','Mora','Pardo','Nieto','Bravo','Solis'])
            [1 + ((position / 20) % 10)]
        || ' ' || position AS full_name,
        position % 5 <> 0 AS attending,
        CASE position % 6
            WHEN 0 THEN '{}'::text[]
            WHEN 1 THEN ARRAY['none']
            WHEN 2 THEN ARRAY['gluten']
            WHEN 3 THEN ARRAY['vegetarian','lactose']
            WHEN 4 THEN ARRAY['nuts_seafood']
            ELSE ARRAY['none']
        END AS dietary_options,
        CASE WHEN position % 11 = 0 THEN 'Alergia leve a los frutos secos' END AS dietary_other,
        -- Los tokens que `weddingRsvpForm` declara realmente (rsvpForm.ts:108-111). La primera
        -- version invento 'ida-y-vuelta'/'solo-ida'/'no-necesito', que no existen: el panel los
        -- imprimia crudos y `needsTransport` contaba como usuarios de autobus a los 12 invitados
        -- que habian dicho que no lo necesitaban -- 36 en lugar de ~22.
        CASE position % 5
            WHEN 0 THEN NULL
            WHEN 1 THEN 'ida_vuelta'
            WHEN 2 THEN 'solo_ida'
            WHEN 3 THEN 'solo_vuelta'
            ELSE 'no'
        END AS bus_option,
        CASE WHEN position % 3 = 0 THEN 'Cancion de prueba ' || position END AS song_request,
        CASE WHEN position % 7 = 0 THEN 'Mensaje ficticio de prueba numero ' || position END AS message,
        (ARRAY['es','es','es','en','bg'])[1 + (position % 5)] AS locale
    FROM generate_series(1, 60) AS position
) AS guest;

-- Two soft-deleted rows, so the panel's deleted filter and its restore action have something to
-- act on. Done as an UPDATE rather than an INSERT so `stamp_deletion` and the audit trigger run
-- exactly as they do in production.
UPDATE public.rsvp_responses
SET deleted_at = now() - interval '2 days'
WHERE wedding_slug = 'gala-y-valentin'
  AND full_name IN ('Bruno Lopez 1', 'Carla Lopez 2');

END
$seed_responses$;

COMMIT;
