import {
  pgTable,
  uuid,
  text,
  timestamp,
  integer,
  numeric,
  jsonb,
  uniqueIndex,
  index,
  customType,
} from 'drizzle-orm/pg-core';

const geography = customType<{
  data: { lat: number; lng: number };
  driverData: string;
}>({
  dataType() {
    return 'geography(Point, 4326)';
  },
  toDriver(value) {
    return `SRID=4326;POINT(${value.lng} ${value.lat})`;
  },
  fromDriver(value) {
    // PostGIS returns hex-encoded WKB; we use ST_AsText in queries instead
    return value as unknown as { lat: number; lng: number };
  },
});

export const approvedDomains = pgTable('approved_domains', {
  id: uuid('id').primaryKey().defaultRandom(),
  domain: text('domain').notNull().unique(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export const profiles = pgTable('profiles', {
  id: uuid('id').primaryKey(),
  email: text('email').notNull(),
  firebaseUid: text('firebase_uid').notNull().unique(),
  workspaceName: text('workspace_name'),
  position: text('position'),
  avatarUrl: text('avatar_url'),
  commutePrefs: jsonb('commute_prefs').default({}),
  hobbies: text('hobbies').array().default([]),
  waitlistStatus: text('waitlist_status').notNull().default('pending'),
  inviteCode: text('invite_code').unique(),
  invitedBy: uuid('invited_by'),
  pushToken: text('push_token'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

export const waitlist = pgTable('waitlist', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull(),
  inviteCode: text('invite_code'),
  status: text('status').notNull().default('pending'),
  invitedByUserId: uuid('invited_by_user_id'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export const vehicles = pgTable('vehicles', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
  type: text('type').notNull(),
  make: text('make').notNull(),
  model: text('model').notNull(),
  plateNumber: text('plate_number').notNull(),
  pricePerKm: numeric('price_per_km', { precision: 6, scale: 2 }),
  seatsToOffer: integer('seats_to_offer').default(1),
  images: text('images').array().default([]),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export const rides = pgTable(
  'rides',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    giverId: uuid('giver_id').notNull().references(() => profiles.id),
    fromPoint: geography('from_point').notNull(),
    toPoint: geography('to_point').notNull(),
    fromAddress: text('from_address'),
    toAddress: text('to_address'),
    routePolyline: text('route_polyline'),
    departureTime: timestamp('departure_time', { withTimezone: true }).notNull(),
    status: text('status').notNull().default('active'),
    availableSeats: integer('available_seats').notNull().default(1),
    vehicleId: uuid('vehicle_id').references(() => vehicles.id),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  },
  (table) => [
    index('idx_rides_departure').on(table.departureTime),
    index('idx_rides_status').on(table.status),
  ],
);

export const rideRequests = pgTable(
  'ride_requests',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    takerId: uuid('taker_id').notNull().references(() => profiles.id),
    fromPoint: geography('from_point').notNull(),
    toPoint: geography('to_point').notNull(),
    fromAddress: text('from_address'),
    toAddress: text('to_address'),
    numRiders: integer('num_riders').default(1),
    preferredTime: timestamp('preferred_time', { withTimezone: true }),
    status: text('status').notNull().default('active'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  },
);

export const rideMatches = pgTable('ride_matches', {
  id: uuid('id').primaryKey().defaultRandom(),
  rideId: uuid('ride_id').notNull().references(() => rides.id),
  rideRequestId: uuid('ride_request_id').references(() => rideRequests.id),
  takerId: uuid('taker_id').notNull().references(() => profiles.id),
  pickupPoint: geography('pickup_point'),
  dropPoint: geography('drop_point'),
  status: text('status').notNull().default('offered'),
  paymentStatus: text('payment_status').notNull().default('pending'),
  paymentMethod: text('payment_method'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export const chatrooms = pgTable('chatrooms', {
  id: uuid('id').primaryKey().defaultRandom(),
  rideMatchId: uuid('ride_match_id').notNull().unique().references(() => rideMatches.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export const messages = pgTable(
  'messages',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    chatroomId: uuid('chatroom_id').notNull().references(() => chatrooms.id, { onDelete: 'cascade' }),
    senderId: uuid('sender_id').notNull().references(() => profiles.id),
    content: text('content').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  },
  (table) => [
    index('idx_messages_chatroom').on(table.chatroomId, table.createdAt),
  ],
);
