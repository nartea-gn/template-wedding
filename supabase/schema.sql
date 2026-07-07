CREATE TABLE rsvp_responses
(
    id              uuid PRIMARY KEY     DEFAULT gen_random_uuid(),
    wedding_slug    TEXT        NOT NULL DEFAULT 'boda-general',
    full_name       TEXT        NOT NULL,
    attending       BOOLEAN     NOT NULL,
    dietary_options TEXT[] NOT NULL DEFAULT '{}',
    dietary_other   TEXT,
    bus_option      TEXT,
    song_request    TEXT,
    message         TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Habilitar seguridad
ALTER TABLE rsvp_responses ENABLE ROW LEVEL SECURITY;

-- Permite que cualquier invitado anónimo inserte respuestas
CREATE
POLICY "Permitir inserciones públicas"
ON rsvp_responses FOR INSERT TO anon WITH CHECK (true);

-- Permite lecturas anónimas globales (nuestro frontend filtrará por slug y contraseña)
CREATE
POLICY "Permitir lecturas públicas anon"
ON rsvp_responses FOR
SELECT TO anon USING (true);