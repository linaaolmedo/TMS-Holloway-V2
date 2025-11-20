


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



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
begin
  insert into public.profiles (user_id, full_name, phone)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.email),
    new.raw_user_meta_data->>'phone'
  );
  return new;
end;
$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_location_timestamp"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.current_location_updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_location_timestamp"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."companies" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "type" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "mc_number" "text",
    "contact_person" "text",
    "phone" "text",
    "email" "text",
    "equipment_types" "text"[],
    "do_not_use" boolean DEFAULT false,
    "number_of_trucks" integer,
    "billing_address" "text",
    "preferred_invoice_method" "text",
    "payment_terms" "text",
    "credit_limit" numeric(12,2),
    "shipping_locations" "text"[],
    CONSTRAINT "companies_preferred_invoice_method_check" CHECK (("preferred_invoice_method" = ANY (ARRAY['email'::"text", 'mail'::"text"]))),
    CONSTRAINT "companies_type_check" CHECK (("type" = ANY (ARRAY['shipper'::"text", 'carrier'::"text", 'internal'::"text"])))
);


ALTER TABLE "public"."companies" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."loads" (
    "id" bigint NOT NULL,
    "load_number" "text",
    "status" "text" NOT NULL,
    "dispatcher_id" "uuid",
    "customer_id" "uuid",
    "carrier_id" "uuid",
    "driver_id" "uuid",
    "commodity" "text",
    "equipment_type" "text",
    "pricing_type" "text",
    "customer_rate" numeric(10,2),
    "carrier_rate" numeric(10,2),
    "margin_percent" numeric(5,2) GENERATED ALWAYS AS (
CASE
    WHEN ("customer_rate" > (0)::numeric) THEN ((("customer_rate" - "carrier_rate") / "customer_rate") * (100)::numeric)
    ELSE NULL::numeric
END) STORED,
    "pickup_location" "text",
    "delivery_location" "text",
    "pickup_time" timestamp with time zone,
    "delivery_time" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "weight" numeric(10,2),
    "weight_unit" "text",
    "mileage" numeric(10,2),
    "rate_confirmed" boolean DEFAULT false,
    "rate_confirmed_at" timestamp with time zone,
    "rate_confirmed_by" "uuid",
    "comments" "text",
    "deleted_at" timestamp with time zone,
    "pickup_latitude" numeric(10,8),
    "pickup_longitude" numeric(11,8),
    "delivery_latitude" numeric(10,8),
    "delivery_longitude" numeric(11,8),
    "distance_miles" numeric(10,2),
    "estimated_duration_hours" numeric(5,2),
    "current_latitude" numeric(10,8),
    "current_longitude" numeric(11,8),
    "current_location_updated_at" timestamp with time zone,
    "pallets" integer,
    CONSTRAINT "loads_pricing_type_check" CHECK (("pricing_type" = ANY (ARRAY['flat'::"text", 'per_ton'::"text"]))),
    CONSTRAINT "loads_status_check" CHECK (("status" = ANY (ARRAY['pending_pickup'::"text", 'in_transit'::"text", 'delivered'::"text", 'delayed'::"text", 'cancelled'::"text", 'closed'::"text"])))
);


ALTER TABLE "public"."loads" OWNER TO "postgres";


COMMENT ON COLUMN "public"."loads"."rate_confirmed" IS 'Whether the carrier has confirmed/accepted the offered rate';



COMMENT ON COLUMN "public"."loads"."rate_confirmed_at" IS 'Timestamp when the rate was confirmed by the carrier';



COMMENT ON COLUMN "public"."loads"."rate_confirmed_by" IS 'User ID of the carrier representative who confirmed the rate';



COMMENT ON COLUMN "public"."loads"."comments" IS 'Optional notes or comments about the load';



COMMENT ON COLUMN "public"."loads"."deleted_at" IS 'Timestamp when the load was soft deleted (archived). NULL means active.';



COMMENT ON COLUMN "public"."loads"."pickup_latitude" IS 'Pickup location latitude';



COMMENT ON COLUMN "public"."loads"."pickup_longitude" IS 'Pickup location longitude';



COMMENT ON COLUMN "public"."loads"."delivery_latitude" IS 'Delivery location latitude';



COMMENT ON COLUMN "public"."loads"."delivery_longitude" IS 'Delivery location longitude';



COMMENT ON COLUMN "public"."loads"."distance_miles" IS 'Calculated route distance in miles';



COMMENT ON COLUMN "public"."loads"."estimated_duration_hours" IS 'Estimated travel time in hours';



COMMENT ON COLUMN "public"."loads"."current_latitude" IS 'Current load/truck latitude during transit';



COMMENT ON COLUMN "public"."loads"."current_longitude" IS 'Current load/truck longitude during transit';



COMMENT ON COLUMN "public"."loads"."current_location_updated_at" IS 'Last time current location was updated';



COMMENT ON COLUMN "public"."loads"."pallets" IS 'Optional number of pallets in the load';



CREATE TABLE IF NOT EXISTS "public"."users" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "email" character varying(255) NOT NULL,
    "name" character varying(100),
    "phone" character varying(20),
    "role" "text" NOT NULL,
    "company_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "last_login_at" timestamp with time zone,
    "is_active" boolean DEFAULT true,
    CONSTRAINT "users_role_check" CHECK (("role" = ANY (ARRAY['executive'::"text", 'admin'::"text", 'billing'::"text", 'csr'::"text", 'dispatch'::"text", 'customer'::"text", 'carrier'::"text", 'driver'::"text"])))
);


ALTER TABLE "public"."users" OWNER TO "postgres";


COMMENT ON COLUMN "public"."users"."last_login_at" IS 'Timestamp of user last successful login';



COMMENT ON COLUMN "public"."users"."is_active" IS 'If false, user account is deactivated and cannot login';



CREATE OR REPLACE VIEW "public"."active_load_locations" AS
 SELECT "l"."id",
    "l"."load_number",
    "l"."status",
    "l"."pickup_location",
    "l"."pickup_latitude",
    "l"."pickup_longitude",
    "l"."delivery_location",
    "l"."delivery_latitude",
    "l"."delivery_longitude",
    "l"."current_latitude",
    "l"."current_longitude",
    "l"."current_location_updated_at",
    "l"."distance_miles",
    "l"."estimated_duration_hours",
    "c"."name" AS "carrier_name",
    "u"."name" AS "driver_name"
   FROM (("public"."loads" "l"
     LEFT JOIN "public"."companies" "c" ON (("l"."carrier_id" = "c"."id")))
     LEFT JOIN "public"."users" "u" ON (("l"."driver_id" = "u"."id")))
  WHERE (("l"."status" = ANY (ARRAY['pending_pickup'::"text", 'in_transit'::"text"])) AND ("l"."deleted_at" IS NULL));


ALTER VIEW "public"."active_load_locations" OWNER TO "postgres";


COMMENT ON VIEW "public"."active_load_locations" IS 'Active loads with location data for tracking';



CREATE TABLE IF NOT EXISTS "public"."audit_logs" (
    "id" bigint NOT NULL,
    "entity_type" "text" NOT NULL,
    "entity_id" bigint NOT NULL,
    "action" "text" NOT NULL,
    "user_id" "uuid",
    "user_email" "text",
    "ip_address" "text",
    "user_agent" "text",
    "metadata" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "user_role" "text",
    "impersonated_by" "uuid",
    "changes_made" "jsonb",
    CONSTRAINT "audit_logs_action_check" CHECK (("action" = ANY (ARRAY['generated'::"text", 'downloaded'::"text", 'viewed'::"text", 'uploaded'::"text", 'deleted'::"text", 'created'::"text", 'updated'::"text", 'login'::"text", 'logout'::"text", 'role_changed'::"text", 'impersonated'::"text", 'bulk_update'::"text"]))),
    CONSTRAINT "audit_logs_entity_type_check" CHECK (("entity_type" = ANY (ARRAY['invoice'::"text", 'rate_confirmation'::"text", 'pod'::"text", 'bol'::"text", 'document'::"text", 'user'::"text", 'company'::"text", 'load'::"text", 'setting'::"text", 'system'::"text"])))
);


ALTER TABLE "public"."audit_logs" OWNER TO "postgres";


COMMENT ON COLUMN "public"."audit_logs"."impersonated_by" IS 'If action was performed during impersonation, this is the admin user ID';



COMMENT ON COLUMN "public"."audit_logs"."changes_made" IS 'JSON object containing before/after values for updates';



CREATE SEQUENCE IF NOT EXISTS "public"."audit_logs_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."audit_logs_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."audit_logs_id_seq" OWNED BY "public"."audit_logs"."id";



CREATE TABLE IF NOT EXISTS "public"."bids" (
    "id" bigint NOT NULL,
    "load_id" bigint,
    "carrier_id" "uuid",
    "bid_amount" numeric(10,2) NOT NULL,
    "submitted_at" timestamp with time zone DEFAULT "now"(),
    "status" "text" DEFAULT 'pending'::"text",
    CONSTRAINT "bids_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'accepted'::"text", 'rejected'::"text"])))
);


ALTER TABLE "public"."bids" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."bids_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."bids_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."bids_id_seq" OWNED BY "public"."bids"."id";



CREATE TABLE IF NOT EXISTS "public"."documents" (
    "id" bigint NOT NULL,
    "load_id" bigint,
    "doc_type" "text" NOT NULL,
    "storage_path" "text" NOT NULL,
    "uploaded_by" "uuid",
    "uploaded_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "documents_doc_type_check" CHECK (("doc_type" = ANY (ARRAY['POD'::"text", 'BOL'::"text", 'Invoice'::"text", 'RateConfirmation'::"text"])))
);


ALTER TABLE "public"."documents" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."documents_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."documents_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."documents_id_seq" OWNED BY "public"."documents"."id";



CREATE TABLE IF NOT EXISTS "public"."driver_locations" (
    "id" bigint NOT NULL,
    "driver_id" "uuid",
    "load_id" bigint,
    "latitude" numeric(10,8) NOT NULL,
    "longitude" numeric(11,8) NOT NULL,
    "speed" numeric(5,2),
    "heading" numeric(5,2),
    "accuracy" numeric(8,2),
    "timestamp" timestamp with time zone DEFAULT "now"(),
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."driver_locations" OWNER TO "postgres";


COMMENT ON TABLE "public"."driver_locations" IS 'Real-time GPS location tracking for drivers';



CREATE SEQUENCE IF NOT EXISTS "public"."driver_locations_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."driver_locations_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."driver_locations_id_seq" OWNED BY "public"."driver_locations"."id";



CREATE TABLE IF NOT EXISTS "public"."fleet" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "unit_number" "text" NOT NULL,
    "vin" "text",
    "make" "text",
    "model" "text",
    "year" integer,
    "status" "text" DEFAULT 'available'::"text",
    "price_per_mile" numeric(10,2),
    "assigned_driver_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "trucks_status_check" CHECK (("status" = ANY (ARRAY['available'::"text", 'in_use'::"text", 'maintenance'::"text", 'out_of_service'::"text"])))
);


ALTER TABLE "public"."fleet" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."impersonation_logs" (
    "id" bigint NOT NULL,
    "admin_user_id" "uuid" NOT NULL,
    "target_user_id" "uuid" NOT NULL,
    "started_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "ended_at" timestamp with time zone,
    "reason" "text",
    "ip_address" "text",
    "user_agent" "text",
    "actions_taken" "jsonb" DEFAULT '[]'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."impersonation_logs" OWNER TO "postgres";


COMMENT ON TABLE "public"."impersonation_logs" IS 'Tracks admin user impersonation sessions for audit and security';



COMMENT ON COLUMN "public"."impersonation_logs"."reason" IS 'Admin-provided reason for impersonation';



COMMENT ON COLUMN "public"."impersonation_logs"."actions_taken" IS 'Array of actions performed during impersonation session';



CREATE SEQUENCE IF NOT EXISTS "public"."impersonation_logs_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."impersonation_logs_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."impersonation_logs_id_seq" OWNED BY "public"."impersonation_logs"."id";



CREATE SEQUENCE IF NOT EXISTS "public"."invoice_no_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."invoice_no_seq" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."invoices" (
    "id" bigint NOT NULL,
    "load_id" bigint,
    "customer_id" "uuid",
    "amount" numeric(10,2) NOT NULL,
    "issued_at" timestamp with time zone DEFAULT "now"(),
    "paid_at" timestamp with time zone,
    "status" "text" DEFAULT 'issued'::"text",
    CONSTRAINT "invoices_status_check" CHECK (("status" = ANY (ARRAY['issued'::"text", 'paid'::"text", 'overdue'::"text"])))
);


ALTER TABLE "public"."invoices" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."invoices_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."invoices_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."invoices_id_seq" OWNED BY "public"."invoices"."id";



CREATE TABLE IF NOT EXISTS "public"."load_locations" (
    "id" bigint NOT NULL,
    "load_id" bigint NOT NULL,
    "pickup_lat" numeric(10,7),
    "pickup_lng" numeric(11,7),
    "delivery_lat" numeric(10,7),
    "delivery_lng" numeric(11,7),
    "geocoded_at" timestamp with time zone DEFAULT "now"(),
    "geocoding_accuracy" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."load_locations" OWNER TO "postgres";


COMMENT ON TABLE "public"."load_locations" IS 'Geocoded coordinates for load pickup and delivery locations';



CREATE SEQUENCE IF NOT EXISTS "public"."load_locations_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."load_locations_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."load_locations_id_seq" OWNED BY "public"."load_locations"."id";



CREATE SEQUENCE IF NOT EXISTS "public"."load_no_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."load_no_seq" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."loads_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."loads_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."loads_id_seq" OWNED BY "public"."loads"."id";



CREATE TABLE IF NOT EXISTS "public"."messages" (
    "id" bigint NOT NULL,
    "sender_id" "uuid" NOT NULL,
    "recipient_id" "uuid" NOT NULL,
    "load_id" bigint,
    "message" "text" NOT NULL,
    "read" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."messages" OWNER TO "postgres";


COMMENT ON TABLE "public"."messages" IS 'Messages between users (primarily driver-dispatch communication)';



COMMENT ON COLUMN "public"."messages"."sender_id" IS 'User who sent the message';



COMMENT ON COLUMN "public"."messages"."recipient_id" IS 'User who receives the message';



COMMENT ON COLUMN "public"."messages"."load_id" IS 'Optional reference to related load';



COMMENT ON COLUMN "public"."messages"."message" IS 'Message content';



COMMENT ON COLUMN "public"."messages"."read" IS 'Whether the message has been read by recipient';



CREATE SEQUENCE IF NOT EXISTS "public"."messages_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."messages_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."messages_id_seq" OWNED BY "public"."messages"."id";



CREATE TABLE IF NOT EXISTS "public"."notifications" (
    "id" bigint NOT NULL,
    "recipient_id" "uuid" NOT NULL,
    "type" "text" NOT NULL,
    "title" "text" NOT NULL,
    "message" "text" NOT NULL,
    "link" "text",
    "read" boolean DEFAULT false,
    "related_entity_type" "text",
    "related_entity_id" bigint,
    "metadata" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "notifications_related_entity_type_check" CHECK (("related_entity_type" = ANY (ARRAY['bid'::"text", 'load'::"text", 'carrier'::"text", 'customer'::"text", 'driver'::"text"]))),
    CONSTRAINT "notifications_type_check" CHECK (("type" = ANY (ARRAY['bid'::"text", 'shipment_request'::"text", 'driver_activity'::"text", 'status_update'::"text", 'general'::"text"])))
);


ALTER TABLE "public"."notifications" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."notifications_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."notifications_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."notifications_id_seq" OWNED BY "public"."notifications"."id";



CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "user_id" "uuid" NOT NULL,
    "full_name" "text",
    "phone" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."route_stops" (
    "id" bigint NOT NULL,
    "driver_id" "uuid" NOT NULL,
    "load_id" bigint,
    "stop_sequence" integer NOT NULL,
    "location" "text" NOT NULL,
    "latitude" numeric(10,7),
    "longitude" numeric(11,7),
    "stop_type" "text" NOT NULL,
    "scheduled_time" timestamp with time zone,
    "completed_at" timestamp with time zone,
    "status" "text" DEFAULT 'pending'::"text",
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "route_stops_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'en_route'::"text", 'arrived'::"text", 'completed'::"text", 'skipped'::"text"]))),
    CONSTRAINT "route_stops_stop_type_check" CHECK (("stop_type" = ANY (ARRAY['pickup'::"text", 'delivery'::"text", 'waypoint'::"text"])))
);


ALTER TABLE "public"."route_stops" OWNER TO "postgres";


COMMENT ON TABLE "public"."route_stops" IS 'Multi-stop route planning and optimization for drivers';



CREATE SEQUENCE IF NOT EXISTS "public"."route_stops_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."route_stops_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."route_stops_id_seq" OWNED BY "public"."route_stops"."id";



CREATE TABLE IF NOT EXISTS "public"."route_tracking" (
    "id" bigint NOT NULL,
    "load_id" bigint NOT NULL,
    "driver_id" "uuid" NOT NULL,
    "current_lat" numeric(10,7),
    "current_lng" numeric(11,7),
    "eta_pickup" timestamp with time zone,
    "eta_delivery" timestamp with time zone,
    "distance_remaining" numeric(10,2),
    "route_progress" numeric(5,2),
    "status" "text",
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "route_tracking_status_check" CHECK (("status" = ANY (ARRAY['en_route_pickup'::"text", 'at_pickup'::"text", 'en_route_delivery'::"text", 'at_delivery'::"text", 'completed'::"text"])))
);


ALTER TABLE "public"."route_tracking" OWNER TO "postgres";


COMMENT ON TABLE "public"."route_tracking" IS 'Real-time route progress tracking with ETAs and distance remaining';



CREATE SEQUENCE IF NOT EXISTS "public"."route_tracking_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."route_tracking_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."route_tracking_id_seq" OWNED BY "public"."route_tracking"."id";



CREATE TABLE IF NOT EXISTS "public"."status_history" (
    "id" bigint NOT NULL,
    "load_id" bigint,
    "status" "text" NOT NULL,
    "changed_at" timestamp with time zone DEFAULT "now"(),
    "updated_by" "uuid"
);


ALTER TABLE "public"."status_history" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."status_history_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."status_history_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."status_history_id_seq" OWNED BY "public"."status_history"."id";



CREATE TABLE IF NOT EXISTS "public"."system_settings" (
    "id" bigint NOT NULL,
    "setting_key" "text" NOT NULL,
    "setting_value" "jsonb" NOT NULL,
    "setting_type" "text" NOT NULL,
    "category" "text" NOT NULL,
    "description" "text",
    "is_public" boolean DEFAULT false,
    "updated_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "system_settings_category_check" CHECK (("category" = ANY (ARRAY['general'::"text", 'notifications'::"text", 'documents'::"text", 'pricing'::"text", 'features'::"text", 'security'::"text"]))),
    CONSTRAINT "system_settings_setting_type_check" CHECK (("setting_type" = ANY (ARRAY['string'::"text", 'number'::"text", 'boolean'::"text", 'json'::"text", 'template'::"text"])))
);


ALTER TABLE "public"."system_settings" OWNER TO "postgres";


COMMENT ON TABLE "public"."system_settings" IS 'Global system configuration settings manageable through admin portal';



COMMENT ON COLUMN "public"."system_settings"."is_public" IS 'If true, setting can be read by non-admin users';



CREATE SEQUENCE IF NOT EXISTS "public"."system_settings_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."system_settings_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."system_settings_id_seq" OWNED BY "public"."system_settings"."id";



CREATE TABLE IF NOT EXISTS "public"."truck_locations" (
    "id" bigint NOT NULL,
    "truck_id" bigint,
    "load_id" bigint,
    "latitude" numeric(10,8) NOT NULL,
    "longitude" numeric(11,8) NOT NULL,
    "speed" numeric(5,2),
    "heading" numeric(5,2),
    "accuracy" numeric(8,2),
    "timestamp" timestamp with time zone DEFAULT "now"(),
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."truck_locations" OWNER TO "postgres";


COMMENT ON TABLE "public"."truck_locations" IS 'Historical GPS tracking data for trucks';



COMMENT ON COLUMN "public"."truck_locations"."speed" IS 'Speed in miles per hour';



COMMENT ON COLUMN "public"."truck_locations"."heading" IS 'Direction of travel in degrees (0-360)';



COMMENT ON COLUMN "public"."truck_locations"."accuracy" IS 'GPS accuracy in meters';



CREATE SEQUENCE IF NOT EXISTS "public"."truck_locations_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."truck_locations_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."truck_locations_id_seq" OWNED BY "public"."truck_locations"."id";



CREATE TABLE IF NOT EXISTS "public"."trucks" (
    "id" bigint NOT NULL,
    "unit_number" "text" NOT NULL,
    "vin" "text",
    "make" "text",
    "model" "text",
    "year" integer,
    "status" "text" DEFAULT 'available'::"text",
    "price_per_mile" numeric(10,2),
    "current_latitude" numeric(10,8),
    "current_longitude" numeric(11,8),
    "current_location_updated_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "trucks_status_check1" CHECK (("status" = ANY (ARRAY['available'::"text", 'in_use'::"text", 'maintenance'::"text", 'out_of_service'::"text"])))
);


ALTER TABLE "public"."trucks" OWNER TO "postgres";


COMMENT ON TABLE "public"."trucks" IS 'Fleet trucks with location tracking';



CREATE SEQUENCE IF NOT EXISTS "public"."trucks_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."trucks_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."trucks_id_seq" OWNED BY "public"."trucks"."id";



CREATE TABLE IF NOT EXISTS "public"."user_sessions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "session_token" "text" NOT NULL,
    "ip_address" "text",
    "user_agent" "text",
    "login_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "last_activity_at" timestamp with time zone DEFAULT "now"(),
    "logout_at" timestamp with time zone,
    "forced_logout" boolean DEFAULT false,
    "forced_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."user_sessions" OWNER TO "postgres";


COMMENT ON TABLE "public"."user_sessions" IS 'Tracks active user sessions for security monitoring and force logout capability';



COMMENT ON COLUMN "public"."user_sessions"."forced_logout" IS 'True if session was terminated by admin';



COMMENT ON COLUMN "public"."user_sessions"."forced_by" IS 'Admin user who forced the logout';



ALTER TABLE ONLY "public"."audit_logs" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."audit_logs_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."bids" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."bids_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."documents" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."documents_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."driver_locations" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."driver_locations_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."impersonation_logs" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."impersonation_logs_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."invoices" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."invoices_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."load_locations" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."load_locations_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."loads" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."loads_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."messages" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."messages_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."notifications" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."notifications_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."route_stops" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."route_stops_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."route_tracking" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."route_tracking_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."status_history" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."status_history_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."system_settings" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."system_settings_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."truck_locations" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."truck_locations_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."trucks" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."trucks_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."audit_logs"
    ADD CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."bids"
    ADD CONSTRAINT "bids_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."companies"
    ADD CONSTRAINT "companies_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."documents"
    ADD CONSTRAINT "documents_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."driver_locations"
    ADD CONSTRAINT "driver_locations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."impersonation_logs"
    ADD CONSTRAINT "impersonation_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."invoices"
    ADD CONSTRAINT "invoices_load_id_key" UNIQUE ("load_id");



ALTER TABLE ONLY "public"."invoices"
    ADD CONSTRAINT "invoices_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."load_locations"
    ADD CONSTRAINT "load_locations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."loads"
    ADD CONSTRAINT "loads_load_number_key" UNIQUE ("load_number");



ALTER TABLE ONLY "public"."loads"
    ADD CONSTRAINT "loads_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."messages"
    ADD CONSTRAINT "messages_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("user_id");



ALTER TABLE ONLY "public"."route_stops"
    ADD CONSTRAINT "route_stops_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."route_tracking"
    ADD CONSTRAINT "route_tracking_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."status_history"
    ADD CONSTRAINT "status_history_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."system_settings"
    ADD CONSTRAINT "system_settings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."system_settings"
    ADD CONSTRAINT "system_settings_setting_key_key" UNIQUE ("setting_key");



ALTER TABLE ONLY "public"."truck_locations"
    ADD CONSTRAINT "truck_locations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."fleet"
    ADD CONSTRAINT "trucks_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."trucks"
    ADD CONSTRAINT "trucks_pkey1" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."fleet"
    ADD CONSTRAINT "trucks_unit_number_key" UNIQUE ("unit_number");



ALTER TABLE ONLY "public"."trucks"
    ADD CONSTRAINT "trucks_unit_number_key1" UNIQUE ("unit_number");



ALTER TABLE ONLY "public"."user_sessions"
    ADD CONSTRAINT "user_sessions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_email_key" UNIQUE ("email");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_pkey" PRIMARY KEY ("id");



CREATE INDEX "idx_audit_logs_created" ON "public"."audit_logs" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_audit_logs_entity" ON "public"."audit_logs" USING "btree" ("entity_type", "entity_id");



CREATE INDEX "idx_audit_logs_impersonated" ON "public"."audit_logs" USING "btree" ("impersonated_by") WHERE ("impersonated_by" IS NOT NULL);



CREATE INDEX "idx_audit_logs_user" ON "public"."audit_logs" USING "btree" ("user_id");



CREATE INDEX "idx_audit_logs_user_role" ON "public"."audit_logs" USING "btree" ("user_role");



CREATE INDEX "idx_companies_type" ON "public"."companies" USING "btree" ("type");



CREATE INDEX "idx_driver_locations_driver_id" ON "public"."driver_locations" USING "btree" ("driver_id");



CREATE INDEX "idx_driver_locations_driver_timestamp" ON "public"."driver_locations" USING "btree" ("driver_id", "timestamp" DESC);



CREATE INDEX "idx_driver_locations_load_id" ON "public"."driver_locations" USING "btree" ("load_id");



CREATE INDEX "idx_driver_locations_timestamp" ON "public"."driver_locations" USING "btree" ("timestamp" DESC);



CREATE INDEX "idx_impersonation_logs_active" ON "public"."impersonation_logs" USING "btree" ("admin_user_id", "target_user_id") WHERE ("ended_at" IS NULL);



CREATE INDEX "idx_impersonation_logs_admin" ON "public"."impersonation_logs" USING "btree" ("admin_user_id");



CREATE INDEX "idx_impersonation_logs_started" ON "public"."impersonation_logs" USING "btree" ("started_at" DESC);



CREATE INDEX "idx_impersonation_logs_target" ON "public"."impersonation_logs" USING "btree" ("target_user_id");



CREATE INDEX "idx_load_locations_delivery" ON "public"."load_locations" USING "btree" ("delivery_lat", "delivery_lng");



CREATE UNIQUE INDEX "idx_load_locations_load_id" ON "public"."load_locations" USING "btree" ("load_id");



CREATE INDEX "idx_load_locations_pickup" ON "public"."load_locations" USING "btree" ("pickup_lat", "pickup_lng");



CREATE INDEX "idx_loads_current_location" ON "public"."loads" USING "btree" ("current_latitude", "current_longitude") WHERE (("current_latitude" IS NOT NULL) AND ("current_longitude" IS NOT NULL));



CREATE INDEX "idx_loads_deleted_at" ON "public"."loads" USING "btree" ("deleted_at") WHERE ("deleted_at" IS NULL);



CREATE INDEX "idx_loads_delivery_location" ON "public"."loads" USING "btree" ("delivery_latitude", "delivery_longitude") WHERE (("delivery_latitude" IS NOT NULL) AND ("delivery_longitude" IS NOT NULL));



CREATE INDEX "idx_loads_pickup_location" ON "public"."loads" USING "btree" ("pickup_latitude", "pickup_longitude") WHERE (("pickup_latitude" IS NOT NULL) AND ("pickup_longitude" IS NOT NULL));



CREATE INDEX "idx_loads_rate_confirmed" ON "public"."loads" USING "btree" ("rate_confirmed");



CREATE INDEX "idx_loads_status" ON "public"."loads" USING "btree" ("status");



CREATE INDEX "idx_messages_created_at" ON "public"."messages" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_messages_load" ON "public"."messages" USING "btree" ("load_id");



CREATE INDEX "idx_messages_read" ON "public"."messages" USING "btree" ("recipient_id", "read");



CREATE INDEX "idx_messages_recipient" ON "public"."messages" USING "btree" ("recipient_id");



CREATE INDEX "idx_messages_sender" ON "public"."messages" USING "btree" ("sender_id");



CREATE INDEX "idx_notifications_created" ON "public"."notifications" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_notifications_recipient" ON "public"."notifications" USING "btree" ("recipient_id", "read", "created_at" DESC);



CREATE INDEX "idx_notifications_type" ON "public"."notifications" USING "btree" ("type");



CREATE INDEX "idx_route_stops_active" ON "public"."route_stops" USING "btree" ("driver_id", "status", "scheduled_time");



CREATE INDEX "idx_route_stops_driver_id" ON "public"."route_stops" USING "btree" ("driver_id");



CREATE INDEX "idx_route_stops_load_id" ON "public"."route_stops" USING "btree" ("load_id");



CREATE INDEX "idx_route_stops_sequence" ON "public"."route_stops" USING "btree" ("driver_id", "stop_sequence", "status");



CREATE INDEX "idx_route_tracking_active" ON "public"."route_tracking" USING "btree" ("load_id", "status", "updated_at" DESC);



CREATE INDEX "idx_route_tracking_driver_id" ON "public"."route_tracking" USING "btree" ("driver_id");



CREATE INDEX "idx_route_tracking_load_id" ON "public"."route_tracking" USING "btree" ("load_id");



CREATE INDEX "idx_route_tracking_status" ON "public"."route_tracking" USING "btree" ("status");



CREATE INDEX "idx_system_settings_category" ON "public"."system_settings" USING "btree" ("category");



CREATE INDEX "idx_system_settings_key" ON "public"."system_settings" USING "btree" ("setting_key");



CREATE INDEX "idx_system_settings_public" ON "public"."system_settings" USING "btree" ("is_public") WHERE ("is_public" = true);



CREATE INDEX "idx_truck_locations_load_id" ON "public"."truck_locations" USING "btree" ("load_id");



CREATE INDEX "idx_truck_locations_timestamp" ON "public"."truck_locations" USING "btree" ("timestamp" DESC);



CREATE INDEX "idx_truck_locations_truck_id" ON "public"."truck_locations" USING "btree" ("truck_id");



CREATE INDEX "idx_trucks_current_location" ON "public"."trucks" USING "btree" ("current_latitude", "current_longitude") WHERE (("current_latitude" IS NOT NULL) AND ("current_longitude" IS NOT NULL));



CREATE INDEX "idx_trucks_status" ON "public"."fleet" USING "btree" ("status");



CREATE INDEX "idx_user_sessions_active" ON "public"."user_sessions" USING "btree" ("user_id", "logout_at") WHERE ("logout_at" IS NULL);



CREATE INDEX "idx_user_sessions_login" ON "public"."user_sessions" USING "btree" ("login_at" DESC);



CREATE INDEX "idx_user_sessions_token" ON "public"."user_sessions" USING "btree" ("session_token");



CREATE INDEX "idx_user_sessions_user" ON "public"."user_sessions" USING "btree" ("user_id");



CREATE INDEX "idx_users_active" ON "public"."users" USING "btree" ("is_active");



CREATE INDEX "idx_users_last_login" ON "public"."users" USING "btree" ("last_login_at" DESC NULLS LAST);



CREATE OR REPLACE TRIGGER "trigger_loads_current_location_timestamp" BEFORE UPDATE OF "current_latitude", "current_longitude" ON "public"."loads" FOR EACH ROW WHEN ((("new"."current_latitude" IS NOT NULL) AND ("new"."current_longitude" IS NOT NULL))) EXECUTE FUNCTION "public"."update_location_timestamp"();



CREATE OR REPLACE TRIGGER "trigger_trucks_current_location_timestamp" BEFORE UPDATE OF "current_latitude", "current_longitude" ON "public"."trucks" FOR EACH ROW WHEN ((("new"."current_latitude" IS NOT NULL) AND ("new"."current_longitude" IS NOT NULL))) EXECUTE FUNCTION "public"."update_location_timestamp"();



ALTER TABLE ONLY "public"."audit_logs"
    ADD CONSTRAINT "audit_logs_impersonated_by_fkey" FOREIGN KEY ("impersonated_by") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."audit_logs"
    ADD CONSTRAINT "audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."bids"
    ADD CONSTRAINT "bids_carrier_id_fkey" FOREIGN KEY ("carrier_id") REFERENCES "public"."companies"("id");



ALTER TABLE ONLY "public"."bids"
    ADD CONSTRAINT "bids_load_id_fkey" FOREIGN KEY ("load_id") REFERENCES "public"."loads"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."documents"
    ADD CONSTRAINT "documents_load_id_fkey" FOREIGN KEY ("load_id") REFERENCES "public"."loads"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."documents"
    ADD CONSTRAINT "documents_uploaded_by_fkey" FOREIGN KEY ("uploaded_by") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."driver_locations"
    ADD CONSTRAINT "driver_locations_driver_id_fkey" FOREIGN KEY ("driver_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."driver_locations"
    ADD CONSTRAINT "driver_locations_load_id_fkey" FOREIGN KEY ("load_id") REFERENCES "public"."loads"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."impersonation_logs"
    ADD CONSTRAINT "impersonation_logs_admin_user_id_fkey" FOREIGN KEY ("admin_user_id") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."impersonation_logs"
    ADD CONSTRAINT "impersonation_logs_target_user_id_fkey" FOREIGN KEY ("target_user_id") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."invoices"
    ADD CONSTRAINT "invoices_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "public"."companies"("id");



ALTER TABLE ONLY "public"."invoices"
    ADD CONSTRAINT "invoices_load_id_fkey" FOREIGN KEY ("load_id") REFERENCES "public"."loads"("id");



ALTER TABLE ONLY "public"."load_locations"
    ADD CONSTRAINT "load_locations_load_id_fkey" FOREIGN KEY ("load_id") REFERENCES "public"."loads"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."loads"
    ADD CONSTRAINT "loads_carrier_id_fkey" FOREIGN KEY ("carrier_id") REFERENCES "public"."companies"("id");



ALTER TABLE ONLY "public"."loads"
    ADD CONSTRAINT "loads_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "public"."companies"("id");



ALTER TABLE ONLY "public"."loads"
    ADD CONSTRAINT "loads_dispatcher_id_fkey" FOREIGN KEY ("dispatcher_id") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."loads"
    ADD CONSTRAINT "loads_driver_id_fkey" FOREIGN KEY ("driver_id") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."loads"
    ADD CONSTRAINT "loads_rate_confirmed_by_fkey" FOREIGN KEY ("rate_confirmed_by") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."messages"
    ADD CONSTRAINT "messages_load_id_fkey" FOREIGN KEY ("load_id") REFERENCES "public"."loads"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."messages"
    ADD CONSTRAINT "messages_recipient_id_fkey" FOREIGN KEY ("recipient_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."messages"
    ADD CONSTRAINT "messages_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_recipient_id_fkey" FOREIGN KEY ("recipient_id") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."route_stops"
    ADD CONSTRAINT "route_stops_driver_id_fkey" FOREIGN KEY ("driver_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."route_stops"
    ADD CONSTRAINT "route_stops_load_id_fkey" FOREIGN KEY ("load_id") REFERENCES "public"."loads"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."route_tracking"
    ADD CONSTRAINT "route_tracking_driver_id_fkey" FOREIGN KEY ("driver_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."route_tracking"
    ADD CONSTRAINT "route_tracking_load_id_fkey" FOREIGN KEY ("load_id") REFERENCES "public"."loads"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."status_history"
    ADD CONSTRAINT "status_history_load_id_fkey" FOREIGN KEY ("load_id") REFERENCES "public"."loads"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."status_history"
    ADD CONSTRAINT "status_history_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."system_settings"
    ADD CONSTRAINT "system_settings_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."truck_locations"
    ADD CONSTRAINT "truck_locations_load_id_fkey" FOREIGN KEY ("load_id") REFERENCES "public"."loads"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."truck_locations"
    ADD CONSTRAINT "truck_locations_truck_id_fkey" FOREIGN KEY ("truck_id") REFERENCES "public"."trucks"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."fleet"
    ADD CONSTRAINT "trucks_assigned_driver_id_fkey" FOREIGN KEY ("assigned_driver_id") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."user_sessions"
    ADD CONSTRAINT "user_sessions_forced_by_fkey" FOREIGN KEY ("forced_by") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."user_sessions"
    ADD CONSTRAINT "user_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id");



CREATE POLICY "Allow authenticated users to create status history" ON "public"."status_history" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "Allow authenticated users to read bids" ON "public"."bids" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Allow authenticated users to read companies" ON "public"."companies" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Allow authenticated users to read documents" ON "public"."documents" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Allow authenticated users to read fleet" ON "public"."fleet" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Allow authenticated users to read invoices" ON "public"."invoices" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Allow authenticated users to read loads" ON "public"."loads" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Allow authenticated users to read status history" ON "public"."status_history" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Allow carriers to create bids" ON "public"."bids" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND ("users"."role" = 'carrier'::"text") AND ("users"."company_id" = "bids"."carrier_id")))));



CREATE POLICY "Allow carriers to update their assigned loads" ON "public"."loads" FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND ("users"."role" = 'carrier'::"text") AND ("users"."company_id" = "loads"."carrier_id")))));



CREATE POLICY "Allow customers to create load requests" ON "public"."loads" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND ("users"."role" = 'customer'::"text") AND ("users"."company_id" = "loads"."customer_id")))));



CREATE POLICY "Allow drivers and carriers to upload documents" ON "public"."documents" FOR INSERT TO "authenticated" WITH CHECK (("uploaded_by" = "auth"."uid"()));



CREATE POLICY "Allow drivers to update their assigned loads" ON "public"."loads" FOR UPDATE TO "authenticated" USING (("driver_id" = "auth"."uid"()));



CREATE POLICY "Allow internal users to create loads" ON "public"."loads" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND ("users"."role" = ANY (ARRAY['executive'::"text", 'admin'::"text", 'dispatch'::"text", 'csr'::"text"]))))));



CREATE POLICY "Allow internal users to manage bids" ON "public"."bids" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND ("users"."role" = ANY (ARRAY['executive'::"text", 'admin'::"text", 'dispatch'::"text"]))))));



CREATE POLICY "Allow internal users to manage companies" ON "public"."companies" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND ("users"."role" = ANY (ARRAY['executive'::"text", 'admin'::"text", 'dispatch'::"text", 'csr'::"text"]))))));



CREATE POLICY "Allow internal users to manage documents" ON "public"."documents" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND ("users"."role" = ANY (ARRAY['executive'::"text", 'admin'::"text", 'dispatch'::"text", 'billing'::"text"]))))));



CREATE POLICY "Allow internal users to manage fleet" ON "public"."fleet" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND ("users"."role" = ANY (ARRAY['executive'::"text", 'admin'::"text", 'dispatch'::"text"]))))));



CREATE POLICY "Allow internal users to manage invoices" ON "public"."invoices" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND ("users"."role" = ANY (ARRAY['executive'::"text", 'admin'::"text", 'billing'::"text", 'dispatch'::"text"]))))));



CREATE POLICY "Allow internal users to update loads" ON "public"."loads" FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND ("users"."role" = ANY (ARRAY['executive'::"text", 'admin'::"text", 'dispatch'::"text", 'csr'::"text"]))))));



CREATE POLICY "Recipients can mark messages as read" ON "public"."messages" FOR UPDATE USING (("auth"."uid"() = "recipient_id")) WITH CHECK (("auth"."uid"() = "recipient_id"));



CREATE POLICY "System can insert notifications" ON "public"."notifications" FOR INSERT WITH CHECK (true);



CREATE POLICY "Users can delete their sent messages" ON "public"."messages" FOR DELETE USING (("auth"."uid"() = "sender_id"));



CREATE POLICY "Users can send messages" ON "public"."messages" FOR INSERT WITH CHECK (("auth"."uid"() = "sender_id"));



CREATE POLICY "Users can update their own notifications" ON "public"."notifications" FOR UPDATE USING (("auth"."uid"() = "recipient_id"));



CREATE POLICY "Users can view their own messages" ON "public"."messages" FOR SELECT USING ((("auth"."uid"() = "sender_id") OR ("auth"."uid"() = "recipient_id")));



CREATE POLICY "Users can view their own notifications" ON "public"."notifications" FOR SELECT USING (("auth"."uid"() = "recipient_id"));



CREATE POLICY "Users can view their own profile" ON "public"."profiles" FOR SELECT USING (("auth"."uid"() = "user_id"));



ALTER TABLE "public"."bids" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."companies" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."documents" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."driver_locations" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "driver_locations_insert_policy" ON "public"."driver_locations" FOR INSERT WITH CHECK (("auth"."uid"() = "driver_id"));



CREATE POLICY "driver_locations_select_policy" ON "public"."driver_locations" FOR SELECT USING ((("auth"."uid"() = "driver_id") OR (EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND ("users"."role" = ANY (ARRAY['admin'::"text", 'dispatch'::"text", 'executive'::"text"])))))));



ALTER TABLE "public"."fleet" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."invoices" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."load_locations" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "load_locations_insert_policy" ON "public"."load_locations" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND ("users"."role" = ANY (ARRAY['admin'::"text", 'dispatch'::"text", 'csr'::"text"]))))));



CREATE POLICY "load_locations_select_policy" ON "public"."load_locations" FOR SELECT USING (("auth"."uid"() IS NOT NULL));



CREATE POLICY "load_locations_update_policy" ON "public"."load_locations" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND ("users"."role" = ANY (ARRAY['admin'::"text", 'dispatch'::"text", 'csr'::"text"]))))));



ALTER TABLE "public"."loads" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."messages" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."notifications" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."route_stops" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "route_stops_dispatch_policy" ON "public"."route_stops" USING ((EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND ("users"."role" = ANY (ARRAY['admin'::"text", 'dispatch'::"text"]))))));



CREATE POLICY "route_stops_driver_policy" ON "public"."route_stops" USING (("auth"."uid"() = "driver_id"));



CREATE POLICY "route_stops_select_policy" ON "public"."route_stops" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM ("public"."loads" "l"
     JOIN "public"."users" "u" ON ((("u"."company_id" = "l"."customer_id") OR ("u"."company_id" = "l"."carrier_id"))))
  WHERE (("l"."id" = "route_stops"."load_id") AND ("u"."id" = "auth"."uid"())))));



ALTER TABLE "public"."route_tracking" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "route_tracking_driver_policy" ON "public"."route_tracking" USING (("auth"."uid"() = "driver_id"));



CREATE POLICY "route_tracking_select_policy" ON "public"."route_tracking" FOR SELECT USING (((EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND ("users"."role" = ANY (ARRAY['admin'::"text", 'dispatch'::"text", 'executive'::"text"]))))) OR (EXISTS ( SELECT 1
   FROM ("public"."loads" "l"
     JOIN "public"."users" "u" ON (("u"."company_id" = "l"."customer_id")))
  WHERE (("l"."id" = "route_tracking"."load_id") AND ("u"."id" = "auth"."uid"())))) OR (EXISTS ( SELECT 1
   FROM ("public"."loads" "l"
     JOIN "public"."users" "u" ON (("u"."company_id" = "l"."carrier_id")))
  WHERE (("l"."id" = "route_tracking"."load_id") AND ("u"."id" = "auth"."uid"()))))));



ALTER TABLE "public"."status_history" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."users" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "users_read_policy" ON "public"."users" FOR SELECT USING (true);





ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";






GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";

























































































































































GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_location_timestamp"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_location_timestamp"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_location_timestamp"() TO "service_role";


















GRANT ALL ON TABLE "public"."companies" TO "anon";
GRANT ALL ON TABLE "public"."companies" TO "authenticated";
GRANT ALL ON TABLE "public"."companies" TO "service_role";



GRANT ALL ON TABLE "public"."loads" TO "anon";
GRANT ALL ON TABLE "public"."loads" TO "authenticated";
GRANT ALL ON TABLE "public"."loads" TO "service_role";



GRANT ALL ON TABLE "public"."users" TO "anon";
GRANT ALL ON TABLE "public"."users" TO "authenticated";
GRANT ALL ON TABLE "public"."users" TO "service_role";



GRANT ALL ON TABLE "public"."active_load_locations" TO "anon";
GRANT ALL ON TABLE "public"."active_load_locations" TO "authenticated";
GRANT ALL ON TABLE "public"."active_load_locations" TO "service_role";



GRANT ALL ON TABLE "public"."audit_logs" TO "anon";
GRANT ALL ON TABLE "public"."audit_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."audit_logs" TO "service_role";



GRANT ALL ON SEQUENCE "public"."audit_logs_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."audit_logs_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."audit_logs_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."bids" TO "anon";
GRANT ALL ON TABLE "public"."bids" TO "authenticated";
GRANT ALL ON TABLE "public"."bids" TO "service_role";



GRANT ALL ON SEQUENCE "public"."bids_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."bids_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."bids_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."documents" TO "anon";
GRANT ALL ON TABLE "public"."documents" TO "authenticated";
GRANT ALL ON TABLE "public"."documents" TO "service_role";



GRANT ALL ON SEQUENCE "public"."documents_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."documents_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."documents_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."driver_locations" TO "anon";
GRANT ALL ON TABLE "public"."driver_locations" TO "authenticated";
GRANT ALL ON TABLE "public"."driver_locations" TO "service_role";



GRANT ALL ON SEQUENCE "public"."driver_locations_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."driver_locations_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."driver_locations_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."fleet" TO "anon";
GRANT ALL ON TABLE "public"."fleet" TO "authenticated";
GRANT ALL ON TABLE "public"."fleet" TO "service_role";



GRANT ALL ON TABLE "public"."impersonation_logs" TO "anon";
GRANT ALL ON TABLE "public"."impersonation_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."impersonation_logs" TO "service_role";



GRANT ALL ON SEQUENCE "public"."impersonation_logs_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."impersonation_logs_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."impersonation_logs_id_seq" TO "service_role";



GRANT ALL ON SEQUENCE "public"."invoice_no_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."invoice_no_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."invoice_no_seq" TO "service_role";



GRANT ALL ON TABLE "public"."invoices" TO "anon";
GRANT ALL ON TABLE "public"."invoices" TO "authenticated";
GRANT ALL ON TABLE "public"."invoices" TO "service_role";



GRANT ALL ON SEQUENCE "public"."invoices_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."invoices_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."invoices_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."load_locations" TO "anon";
GRANT ALL ON TABLE "public"."load_locations" TO "authenticated";
GRANT ALL ON TABLE "public"."load_locations" TO "service_role";



GRANT ALL ON SEQUENCE "public"."load_locations_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."load_locations_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."load_locations_id_seq" TO "service_role";



GRANT ALL ON SEQUENCE "public"."load_no_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."load_no_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."load_no_seq" TO "service_role";



GRANT ALL ON SEQUENCE "public"."loads_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."loads_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."loads_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."messages" TO "anon";
GRANT ALL ON TABLE "public"."messages" TO "authenticated";
GRANT ALL ON TABLE "public"."messages" TO "service_role";



GRANT ALL ON SEQUENCE "public"."messages_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."messages_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."messages_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."notifications" TO "anon";
GRANT ALL ON TABLE "public"."notifications" TO "authenticated";
GRANT ALL ON TABLE "public"."notifications" TO "service_role";



GRANT ALL ON SEQUENCE "public"."notifications_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."notifications_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."notifications_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";



GRANT ALL ON TABLE "public"."route_stops" TO "anon";
GRANT ALL ON TABLE "public"."route_stops" TO "authenticated";
GRANT ALL ON TABLE "public"."route_stops" TO "service_role";



GRANT ALL ON SEQUENCE "public"."route_stops_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."route_stops_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."route_stops_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."route_tracking" TO "anon";
GRANT ALL ON TABLE "public"."route_tracking" TO "authenticated";
GRANT ALL ON TABLE "public"."route_tracking" TO "service_role";



GRANT ALL ON SEQUENCE "public"."route_tracking_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."route_tracking_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."route_tracking_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."status_history" TO "anon";
GRANT ALL ON TABLE "public"."status_history" TO "authenticated";
GRANT ALL ON TABLE "public"."status_history" TO "service_role";



GRANT ALL ON SEQUENCE "public"."status_history_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."status_history_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."status_history_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."system_settings" TO "anon";
GRANT ALL ON TABLE "public"."system_settings" TO "authenticated";
GRANT ALL ON TABLE "public"."system_settings" TO "service_role";



GRANT ALL ON SEQUENCE "public"."system_settings_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."system_settings_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."system_settings_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."truck_locations" TO "anon";
GRANT ALL ON TABLE "public"."truck_locations" TO "authenticated";
GRANT ALL ON TABLE "public"."truck_locations" TO "service_role";



GRANT ALL ON SEQUENCE "public"."truck_locations_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."truck_locations_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."truck_locations_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."trucks" TO "anon";
GRANT ALL ON TABLE "public"."trucks" TO "authenticated";
GRANT ALL ON TABLE "public"."trucks" TO "service_role";



GRANT ALL ON SEQUENCE "public"."trucks_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."trucks_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."trucks_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."user_sessions" TO "anon";
GRANT ALL ON TABLE "public"."user_sessions" TO "authenticated";
GRANT ALL ON TABLE "public"."user_sessions" TO "service_role";









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































