


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


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE OR REPLACE FUNCTION "public"."get_dm_inputs"("p_id" integer) RETURNS json
    LANGUAGE "sql"
    AS $$
select json_object_agg(dm_id, dm_data)
from (
  select 
  dm.id as dm_id,
  json_build_object(
    'weights', (
      select json_object_agg(cw.criterion_id, cw.value)
      from criterion_weights cw
      where cw.dm_id = dm.id
    ),
    'ratings', (
      select json_agg(json_build_object(
        'alternative_id', cr.alternative_id,
        'criterion_id', cr.criterion_id,
        'value', cr.value
      ))
      from criterion_ratings cr
      where cr.dm_id = dm.id
    )
  ) as dm_data
  from decision_makers dm
  where dm.project_id = p_id
) sub;
$$;


ALTER FUNCTION "public"."get_dm_inputs"("p_id" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_min_and_max_inputs_by_project"("p_id" integer) RETURNS json
    LANGUAGE "sql"
    AS $$
select json_build_object (
  'weights', (
  select json_object_agg(criterion_id, bounds)
  from (
    select cw.criterion_id, json_build_object(
      'min', MIN(cw.value),
      'max', MAX(cw.value)
    ) as bounds
    from criterion_weights cw
    join criteria c on cw.criterion_id = c.id
    where c.project_id = p_id
    group by cw.criterion_id
  ) sub
  ),
  'ratings', (
    select json_object_agg(alternative_id, criteria_bounds)
  from (
    select cr.alternative_id, json_object_agg(criterion_id, bounds) as criteria_bounds
    from(
    select cr.alternative_id, cr.criterion_id, json_build_object(
      'min', MIN(cr.value),
      'max', MAX(cr.value)
    ) as bounds
    from criterion_ratings cr
    join decision_makers dm on cr.dm_id = dm.id
    where dm.project_id = p_id
    group by cr.alternative_id, cr.criterion_id
  ) cr
  group by cr. alternative_id
) sub
  )
);
$$;


ALTER FUNCTION "public"."get_min_and_max_inputs_by_project"("p_id" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_user_rating_by_project"("p_id" integer) RETURNS json
    LANGUAGE "sql"
    AS $$
  select json_object_agg(criterion_id, agg_values)
  from (
    select cw.criterion_id, array_agg(cw.value order by cw.id) as agg_values
    from (select distinct on (cw.id) cw.id, cw.criterion_id, cw.value
          from criterion_weights cw
          JOIN decision_makers dm on cw.dm_id = dm.id
          where dm.project_id = p_id) cw
    group by cw.criterion_id
  ) subquery;
$$;


ALTER FUNCTION "public"."get_user_rating_by_project"("p_id" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_user_score_avg_by_alternative"("p_id" integer, "a_id" integer[]) RETURNS json
    LANGUAGE "sql"
    AS $$
  select json_object_agg(alternative_id, avg_values)
    from(
        select cr.alternative_id, avg(cr.value) as avg_values
        from criterion_ratings cr
        join alternatives alt on cr.alternative_id = alt.id
        where alt.project_id = p_id
        and cr.alternative_id = any(a_id)
        group by cr.alternative_id
    )
  $$;


ALTER FUNCTION "public"."get_user_score_avg_by_alternative"("p_id" integer, "a_id" integer[]) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_user_score_avg_by_project"("p_id" integer) RETURNS json
    LANGUAGE "sql"
    AS $$
  select json_object_agg(alternative_id, avg_values)
    from(
        select cr.alternative_id, avg(cr.value) as avg_values
        from criterion_ratings cr
        join alternatives alt on cr.alternative_id = alt.id
        where alt.project_id = p_id
        group by cr.alternative_id
    )
  $$;


ALTER FUNCTION "public"."get_user_score_avg_by_project"("p_id" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_weight_avg_by_criterion"("c_id" integer) RETURNS double precision
    LANGUAGE "sql"
    AS $$
  select AVG(cw.value)
  from criterion_weights cw
  where cw.criterion_id = c_id;
$$;


ALTER FUNCTION "public"."get_weight_avg_by_criterion"("c_id" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_weight_avg_by_criterion"("p_id" integer, "c_id" integer[]) RETURNS json
    LANGUAGE "sql"
    AS $$
  select json_object_agg(criterion_id, avg_values)
  from (
    select cw.criterion_id, avg(cw.value) as avg_values
    from criterion_weights cw
    join criteria on cw.criterion_id = criteria.id
    where criteria.project_id = p_id
    and cw.criterion_id = any(c_id)
    group by cw.criterion_id
  ) subquery;
$$;


ALTER FUNCTION "public"."get_weight_avg_by_criterion"("p_id" integer, "c_id" integer[]) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_weight_avg_by_project"("p_id" integer) RETURNS json
    LANGUAGE "sql"
    AS $$
  select json_object_agg(criterion_id, avg_values)
  from (
    select cw.criterion_id, avg(cw.value) as avg_values
    from criterion_weights cw
    join criteria on cw.criterion_id = criteria.id
    where criteria.project_id = p_id
    group by cw.criterion_id
  ) subquery;
$$;


ALTER FUNCTION "public"."get_weight_avg_by_project"("p_id" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_weight_values_by_project"("p_id" integer) RETURNS integer[]
    LANGUAGE "sql"
    AS $$
  select ARRAY_AGG(cw.value)
  from criterion_weights cw
  join decision_makers dm on cw.dm_id = dm.id
  where dm.project_id = p_id;
$$;


ALTER FUNCTION "public"."get_weight_values_by_project"("p_id" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_admin"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  INSERT INTO public.admins (id, username)
  VALUES (
    new.id, 
    SPLIT_PART(new.email, '@', 1)
  );
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_new_admin"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."admins" (
    "username" "text",
    "id" "uuid" NOT NULL
);


ALTER TABLE "public"."admins" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."alternatives" (
    "id" bigint NOT NULL,
    "name" "text" NOT NULL,
    "project_id" bigint
);


ALTER TABLE "public"."alternatives" OWNER TO "postgres";


ALTER TABLE "public"."alternatives" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."alternatives_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."criteria" (
    "id" bigint NOT NULL,
    "label" "text",
    "project_id" bigint
);


ALTER TABLE "public"."criteria" OWNER TO "postgres";


ALTER TABLE "public"."criteria" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."criteria_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."criterion_ratings" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "dm_id" bigint,
    "criterion_id" bigint,
    "alternative_id" bigint,
    "value" real
);


ALTER TABLE "public"."criterion_ratings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."criterion_weights" (
    "id" bigint NOT NULL,
    "value" real,
    "dm_id" bigint,
    "criterion_id" bigint
);


ALTER TABLE "public"."criterion_weights" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."decision_makers" (
    "id" bigint NOT NULL,
    "name" "text" NOT NULL,
    "token" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "is_submitted" boolean DEFAULT false NOT NULL,
    "project_id" bigint
);


ALTER TABLE "public"."decision_makers" OWNER TO "postgres";


ALTER TABLE "public"."decision_makers" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."decision_makers_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."projects" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "admin_id" "uuid"
);


ALTER TABLE "public"."projects" OWNER TO "postgres";


ALTER TABLE "public"."projects" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."projects_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



ALTER TABLE "public"."criterion_ratings" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."responses_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



ALTER TABLE "public"."criterion_weights" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."user_preference_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



ALTER TABLE ONLY "public"."admins"
    ADD CONSTRAINT "admins_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."alternatives"
    ADD CONSTRAINT "alternatives_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."criteria"
    ADD CONSTRAINT "criteria_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."decision_makers"
    ADD CONSTRAINT "decision_makers_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."projects"
    ADD CONSTRAINT "projects_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."criterion_ratings"
    ADD CONSTRAINT "responses_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."criterion_weights"
    ADD CONSTRAINT "user_preference_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."alternatives"
    ADD CONSTRAINT "alternatives_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."criteria"
    ADD CONSTRAINT "criteria_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."decision_makers"
    ADD CONSTRAINT "decision_makers_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON UPDATE CASCADE ON DELETE SET NULL;



ALTER TABLE ONLY "public"."admins"
    ADD CONSTRAINT "fk_supabase_auth" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."projects"
    ADD CONSTRAINT "projects_admin_id_fkey" FOREIGN KEY ("admin_id") REFERENCES "public"."admins"("id") ON UPDATE CASCADE ON DELETE SET NULL;



ALTER TABLE ONLY "public"."criterion_ratings"
    ADD CONSTRAINT "responses_alternative_id_fkey" FOREIGN KEY ("alternative_id") REFERENCES "public"."alternatives"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."criterion_ratings"
    ADD CONSTRAINT "responses_criterion_id_fkey" FOREIGN KEY ("criterion_id") REFERENCES "public"."criteria"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."criterion_ratings"
    ADD CONSTRAINT "responses_dm_id_fkey" FOREIGN KEY ("dm_id") REFERENCES "public"."decision_makers"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."criterion_weights"
    ADD CONSTRAINT "user_preference_criterion_id_fkey" FOREIGN KEY ("criterion_id") REFERENCES "public"."criteria"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."criterion_weights"
    ADD CONSTRAINT "user_preference_dm_id_fkey" FOREIGN KEY ("dm_id") REFERENCES "public"."decision_makers"("id") ON UPDATE CASCADE ON DELETE CASCADE;



CREATE POLICY "Admin full control over Project" ON "public"."alternatives" USING ((EXISTS ( SELECT 1
   FROM "public"."projects"
  WHERE (("projects"."id" = "alternatives"."project_id") AND ("projects"."admin_id" = "auth"."uid"())))));



CREATE POLICY "Admins full control over Project" ON "public"."criteria" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."projects"
  WHERE (("projects"."id" = "criteria"."project_id") AND ("projects"."admin_id" = "auth"."uid"())))));



CREATE POLICY "Admins manage participants" ON "public"."decision_makers" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."projects"
  WHERE (("projects"."id" = "decision_makers"."project_id") AND ("projects"."admin_id" = "auth"."uid"())))));



CREATE POLICY "Enable delete for users based on admin_id" ON "public"."projects" FOR DELETE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "admin_id"));



CREATE POLICY "Enable insert for authenticated users only" ON "public"."projects" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "Enable read access for anonymous users" ON "public"."alternatives" FOR SELECT TO "anon" USING ((EXISTS ( SELECT 1
   FROM "public"."decision_makers"
  WHERE ("decision_makers"."project_id" = "alternatives"."project_id"))));



CREATE POLICY "Enable read access for anonymous users" ON "public"."criteria" FOR SELECT TO "anon" USING ((EXISTS ( SELECT 1
   FROM "public"."decision_makers"
  WHERE ("decision_makers"."project_id" = "criteria"."project_id"))));



CREATE POLICY "Enable users to view their own data only" ON "public"."projects" FOR SELECT TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "admin_id"));



CREATE POLICY "Participants only access own answers" ON "public"."criterion_ratings" FOR SELECT TO "anon" USING ((EXISTS ( SELECT 1
   FROM "public"."decision_makers"
  WHERE ("decision_makers"."id" = "criterion_ratings"."dm_id"))));



CREATE POLICY "Participants only read own answers" ON "public"."criterion_weights" FOR SELECT TO "anon" USING ((EXISTS ( SELECT 1
   FROM "public"."decision_makers"
  WHERE ("decision_makers"."id" = "criterion_weights"."dm_id"))));



CREATE POLICY "Participants with valid dm_id can submit" ON "public"."criterion_ratings" FOR INSERT TO "anon" WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."decision_makers"
  WHERE ("decision_makers"."id" = "criterion_ratings"."dm_id"))));



CREATE POLICY "Participants with valid dm_id can submit" ON "public"."criterion_weights" FOR INSERT TO "anon" WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."decision_makers"
  WHERE ("decision_makers"."id" = "criterion_weights"."dm_id"))));



ALTER TABLE "public"."admins" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."alternatives" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."criteria" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."criterion_ratings" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."criterion_weights" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."decision_makers" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."projects" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";






















































































































































GRANT ALL ON FUNCTION "public"."get_dm_inputs"("p_id" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."get_dm_inputs"("p_id" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_dm_inputs"("p_id" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_min_and_max_inputs_by_project"("p_id" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."get_min_and_max_inputs_by_project"("p_id" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_min_and_max_inputs_by_project"("p_id" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_user_rating_by_project"("p_id" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."get_user_rating_by_project"("p_id" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_user_rating_by_project"("p_id" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_user_score_avg_by_alternative"("p_id" integer, "a_id" integer[]) TO "anon";
GRANT ALL ON FUNCTION "public"."get_user_score_avg_by_alternative"("p_id" integer, "a_id" integer[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_user_score_avg_by_alternative"("p_id" integer, "a_id" integer[]) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_user_score_avg_by_project"("p_id" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."get_user_score_avg_by_project"("p_id" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_user_score_avg_by_project"("p_id" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_weight_avg_by_criterion"("c_id" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."get_weight_avg_by_criterion"("c_id" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_weight_avg_by_criterion"("c_id" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_weight_avg_by_criterion"("p_id" integer, "c_id" integer[]) TO "anon";
GRANT ALL ON FUNCTION "public"."get_weight_avg_by_criterion"("p_id" integer, "c_id" integer[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_weight_avg_by_criterion"("p_id" integer, "c_id" integer[]) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_weight_avg_by_project"("p_id" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."get_weight_avg_by_project"("p_id" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_weight_avg_by_project"("p_id" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_weight_values_by_project"("p_id" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."get_weight_values_by_project"("p_id" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_weight_values_by_project"("p_id" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_admin"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_admin"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_admin"() TO "service_role";


















GRANT ALL ON TABLE "public"."admins" TO "anon";
GRANT ALL ON TABLE "public"."admins" TO "authenticated";
GRANT ALL ON TABLE "public"."admins" TO "service_role";



GRANT ALL ON TABLE "public"."alternatives" TO "anon";
GRANT ALL ON TABLE "public"."alternatives" TO "authenticated";
GRANT ALL ON TABLE "public"."alternatives" TO "service_role";



GRANT ALL ON SEQUENCE "public"."alternatives_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."alternatives_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."alternatives_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."criteria" TO "anon";
GRANT ALL ON TABLE "public"."criteria" TO "authenticated";
GRANT ALL ON TABLE "public"."criteria" TO "service_role";



GRANT ALL ON SEQUENCE "public"."criteria_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."criteria_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."criteria_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."criterion_ratings" TO "anon";
GRANT ALL ON TABLE "public"."criterion_ratings" TO "authenticated";
GRANT ALL ON TABLE "public"."criterion_ratings" TO "service_role";



GRANT ALL ON TABLE "public"."criterion_weights" TO "anon";
GRANT ALL ON TABLE "public"."criterion_weights" TO "authenticated";
GRANT ALL ON TABLE "public"."criterion_weights" TO "service_role";



GRANT ALL ON TABLE "public"."decision_makers" TO "anon";
GRANT ALL ON TABLE "public"."decision_makers" TO "authenticated";
GRANT ALL ON TABLE "public"."decision_makers" TO "service_role";



GRANT ALL ON SEQUENCE "public"."decision_makers_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."decision_makers_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."decision_makers_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."projects" TO "anon";
GRANT ALL ON TABLE "public"."projects" TO "authenticated";
GRANT ALL ON TABLE "public"."projects" TO "service_role";



GRANT ALL ON SEQUENCE "public"."projects_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."projects_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."projects_id_seq" TO "service_role";



GRANT ALL ON SEQUENCE "public"."responses_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."responses_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."responses_id_seq" TO "service_role";



GRANT ALL ON SEQUENCE "public"."user_preference_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."user_preference_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."user_preference_id_seq" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";































