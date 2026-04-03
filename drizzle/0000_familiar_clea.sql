CREATE TABLE "approved_domains" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"domain" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "approved_domains_domain_unique" UNIQUE("domain")
);
--> statement-breakpoint
CREATE TABLE "chatrooms" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ride_match_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "chatrooms_ride_match_id_unique" UNIQUE("ride_match_id")
);
--> statement-breakpoint
CREATE TABLE "messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"chatroom_id" uuid NOT NULL,
	"sender_id" uuid NOT NULL,
	"content" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "profiles" (
	"id" uuid PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"firebase_uid" text NOT NULL,
	"workspace_name" text,
	"position" text,
	"avatar_url" text,
	"commute_prefs" jsonb DEFAULT '{}'::jsonb,
	"hobbies" text[] DEFAULT '{}',
	"waitlist_status" text DEFAULT 'pending' NOT NULL,
	"invite_code" text,
	"invited_by" uuid,
	"push_token" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "profiles_firebase_uid_unique" UNIQUE("firebase_uid"),
	CONSTRAINT "profiles_invite_code_unique" UNIQUE("invite_code")
);
--> statement-breakpoint
CREATE TABLE "ride_matches" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ride_id" uuid NOT NULL,
	"ride_request_id" uuid,
	"taker_id" uuid NOT NULL,
	"pickup_point" "geography(Point, 4326)",
	"drop_point" "geography(Point, 4326)",
	"status" text DEFAULT 'offered' NOT NULL,
	"payment_status" text DEFAULT 'pending' NOT NULL,
	"payment_method" text,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "ride_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"taker_id" uuid NOT NULL,
	"from_point" "geography(Point, 4326)" NOT NULL,
	"to_point" "geography(Point, 4326)" NOT NULL,
	"from_address" text,
	"to_address" text,
	"num_riders" integer DEFAULT 1,
	"preferred_time" timestamp with time zone,
	"status" text DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "rides" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"giver_id" uuid NOT NULL,
	"from_point" "geography(Point, 4326)" NOT NULL,
	"to_point" "geography(Point, 4326)" NOT NULL,
	"from_address" text,
	"to_address" text,
	"route_polyline" text,
	"departure_time" timestamp with time zone NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"available_seats" integer DEFAULT 1 NOT NULL,
	"vehicle_id" uuid,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "vehicles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"type" text NOT NULL,
	"make" text NOT NULL,
	"model" text NOT NULL,
	"plate_number" text NOT NULL,
	"price_per_km" numeric(6, 2),
	"seats_to_offer" integer DEFAULT 1,
	"images" text[] DEFAULT '{}',
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "waitlist" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"invite_code" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"invited_by_user_id" uuid,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "chatrooms" ADD CONSTRAINT "chatrooms_ride_match_id_ride_matches_id_fk" FOREIGN KEY ("ride_match_id") REFERENCES "public"."ride_matches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_chatroom_id_chatrooms_id_fk" FOREIGN KEY ("chatroom_id") REFERENCES "public"."chatrooms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_sender_id_profiles_id_fk" FOREIGN KEY ("sender_id") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ride_matches" ADD CONSTRAINT "ride_matches_ride_id_rides_id_fk" FOREIGN KEY ("ride_id") REFERENCES "public"."rides"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ride_matches" ADD CONSTRAINT "ride_matches_ride_request_id_ride_requests_id_fk" FOREIGN KEY ("ride_request_id") REFERENCES "public"."ride_requests"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ride_matches" ADD CONSTRAINT "ride_matches_taker_id_profiles_id_fk" FOREIGN KEY ("taker_id") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ride_requests" ADD CONSTRAINT "ride_requests_taker_id_profiles_id_fk" FOREIGN KEY ("taker_id") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rides" ADD CONSTRAINT "rides_giver_id_profiles_id_fk" FOREIGN KEY ("giver_id") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rides" ADD CONSTRAINT "rides_vehicle_id_vehicles_id_fk" FOREIGN KEY ("vehicle_id") REFERENCES "public"."vehicles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vehicles" ADD CONSTRAINT "vehicles_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_messages_chatroom" ON "messages" USING btree ("chatroom_id","created_at");--> statement-breakpoint
CREATE INDEX "idx_rides_departure" ON "rides" USING btree ("departure_time");--> statement-breakpoint
CREATE INDEX "idx_rides_status" ON "rides" USING btree ("status");