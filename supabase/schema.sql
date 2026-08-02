


-- Generated from the validated local schema. Migrations remain the executable source of truth.
-- This snapshot contains structure and privileges only; it never contains RSVP data.

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE SCHEMA IF NOT EXISTS "public";


ALTER SCHEMA "public" OWNER TO "pg_database_owner";


COMMENT ON SCHEMA "public" IS 'standard public schema';


SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."invitation_admins" (
    "invitation_id" "text" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "invitation_admins_invitation_id_check" CHECK ((("char_length"("btrim"("invitation_id")) >= 1) AND ("char_length"("btrim"("invitation_id")) <= 100)))
);


ALTER TABLE "public"."invitation_admins" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."rsvp_responses" (
    "id" bigint NOT NULL,
    "wedding_slug" "text" DEFAULT 'boda-general'::"text" NOT NULL,
    "full_name" "text" NOT NULL,
    "attending" boolean NOT NULL,
    "dietary_options" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    "dietary_other" "text",
    "bus_option" "text",
    "song_request" "text",
    "message" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "form_id" "text",
    "form_version" integer,
    "locale" "text",
    "answers" "jsonb",
    CONSTRAINT "rsvp_responses_answers_check" CHECK ((("answers" IS NULL) OR (("jsonb_typeof"("answers") = 'object'::"text") AND ("octet_length"(("answers")::"text") <= 16384)))),
    CONSTRAINT "rsvp_responses_bus_option_check" CHECK ((("bus_option" IS NULL) OR ("char_length"("bus_option") <= 100))),
    CONSTRAINT "rsvp_responses_dietary_options_check" CHECK ((("cardinality"("dietary_options") <= 16) AND ("octet_length"(("dietary_options")::"text") <= 2000))),
    CONSTRAINT "rsvp_responses_dietary_other_check" CHECK ((("dietary_other" IS NULL) OR ("char_length"("dietary_other") <= 1000))),
    CONSTRAINT "rsvp_responses_form_id_check" CHECK ((("form_id" IS NULL) OR (("char_length"("btrim"("form_id")) >= 1) AND ("char_length"("btrim"("form_id")) <= 100)))),
    CONSTRAINT "rsvp_responses_form_version_check" CHECK ((("form_version" IS NULL) OR ("form_version" >= 1))),
    CONSTRAINT "rsvp_responses_full_name_check" CHECK ((("char_length"("btrim"("full_name")) >= 1) AND ("char_length"("btrim"("full_name")) <= 200))),
    CONSTRAINT "rsvp_responses_locale_check" CHECK ((("locale" IS NULL) OR (("char_length"("locale") >= 2) AND ("char_length"("locale") <= 35)))),
    CONSTRAINT "rsvp_responses_message_check" CHECK ((("message" IS NULL) OR ("char_length"("message") <= 4000))),
    CONSTRAINT "rsvp_responses_song_request_check" CHECK ((("song_request" IS NULL) OR ("char_length"("song_request") <= 500))),
    CONSTRAINT "rsvp_responses_wedding_slug_check" CHECK ((("char_length"("btrim"("wedding_slug")) >= 1) AND ("char_length"("btrim"("wedding_slug")) <= 100)))
);


ALTER TABLE "public"."rsvp_responses" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."rsvp_responses_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."rsvp_responses_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."rsvp_responses_id_seq" OWNED BY "public"."rsvp_responses"."id";



ALTER TABLE ONLY "public"."rsvp_responses" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."rsvp_responses_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."invitation_admins"
    ADD CONSTRAINT "invitation_admins_pkey" PRIMARY KEY ("invitation_id", "user_id");



ALTER TABLE ONLY "public"."rsvp_responses"
    ADD CONSTRAINT "rsvp_responses_pkey" PRIMARY KEY ("id");



CREATE INDEX "rsvp_responses_form_id_idx" ON "public"."rsvp_responses" USING "btree" ("wedding_slug", "form_id");



ALTER TABLE ONLY "public"."invitation_admins"
    ADD CONSTRAINT "invitation_admins_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE "public"."invitation_admins" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "invitation_admins_select_own" ON "public"."invitation_admins" FOR SELECT TO "authenticated" USING (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



ALTER TABLE "public"."rsvp_responses" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "rsvp_responses_insert_anon" ON "public"."rsvp_responses" FOR INSERT TO "anon" WITH CHECK (((("char_length"("btrim"("wedding_slug")) >= 1) AND ("char_length"("btrim"("wedding_slug")) <= 100)) AND (("char_length"("btrim"("full_name")) >= 1) AND ("char_length"("btrim"("full_name")) <= 200)) AND ("cardinality"("dietary_options") <= 16) AND ("octet_length"(("dietary_options")::"text") <= 2000) AND ("form_id" IS NOT NULL) AND (("char_length"("btrim"("form_id")) >= 1) AND ("char_length"("btrim"("form_id")) <= 100)) AND ("form_version" IS NOT NULL) AND ("form_version" >= 1) AND ("locale" IS NOT NULL) AND (("char_length"("locale") >= 2) AND ("char_length"("locale") <= 35)) AND ("answers" IS NOT NULL) AND ("jsonb_typeof"("answers") = 'object'::"text") AND ("octet_length"(("answers")::"text") <= 16384) AND ("answers" ? 'fullName'::"text") AND ("answers" ? 'attending'::"text") AND (("answers" ->> 'fullName'::"text") = "full_name") AND (("answers" -> 'attending'::"text") = "to_jsonb"("attending"))));



CREATE POLICY "rsvp_responses_select_admin" ON "public"."rsvp_responses" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."invitation_admins" "membership"
  WHERE (("membership"."invitation_id" = "rsvp_responses"."wedding_slug") AND ("membership"."user_id" = ( SELECT "auth"."uid"() AS "uid"))))));



GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";



GRANT ALL ON TABLE "public"."invitation_admins" TO "service_role";
GRANT SELECT ON TABLE "public"."invitation_admins" TO "authenticated";



GRANT ALL ON TABLE "public"."rsvp_responses" TO "service_role";
GRANT SELECT ON TABLE "public"."rsvp_responses" TO "authenticated";



GRANT INSERT("wedding_slug") ON TABLE "public"."rsvp_responses" TO "anon";



GRANT INSERT("full_name") ON TABLE "public"."rsvp_responses" TO "anon";



GRANT INSERT("attending") ON TABLE "public"."rsvp_responses" TO "anon";



GRANT INSERT("dietary_options") ON TABLE "public"."rsvp_responses" TO "anon";



GRANT INSERT("dietary_other") ON TABLE "public"."rsvp_responses" TO "anon";



GRANT INSERT("bus_option") ON TABLE "public"."rsvp_responses" TO "anon";



GRANT INSERT("song_request") ON TABLE "public"."rsvp_responses" TO "anon";



GRANT INSERT("message") ON TABLE "public"."rsvp_responses" TO "anon";



GRANT INSERT("form_id") ON TABLE "public"."rsvp_responses" TO "anon";



GRANT INSERT("form_version") ON TABLE "public"."rsvp_responses" TO "anon";



GRANT INSERT("locale") ON TABLE "public"."rsvp_responses" TO "anon";



GRANT INSERT("answers") ON TABLE "public"."rsvp_responses" TO "anon";



GRANT ALL ON SEQUENCE "public"."rsvp_responses_id_seq" TO "service_role";
GRANT USAGE ON SEQUENCE "public"."rsvp_responses_id_seq" TO "anon";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT UPDATE ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT UPDATE ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT UPDATE ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLES TO "service_role";
