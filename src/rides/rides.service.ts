import {
  Injectable,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { eq, sql } from 'drizzle-orm';
import { DatabaseService } from '../database/database.service';
import { rides, rideMatches, chatrooms, profiles } from '../database/schema';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class RidesService {
  constructor(
    private database: DatabaseService,
    private notifications: NotificationsService,
  ) {}

  async create(userId: string, rideData: Record<string, unknown>) {
    const fromPoint = rideData.from_point as { lat: number; lng: number };
    const toPoint = rideData.to_point as { lat: number; lng: number };

    if (!fromPoint?.lat || !toPoint?.lat) {
      throw new BadRequestException('from_point and to_point are required');
    }

    const result = await this.database.db.execute(sql`
      INSERT INTO rides (
        giver_id, from_point, to_point, from_address, to_address,
        route_polyline, departure_time, available_seats, vehicle_id
      ) VALUES (
        ${userId},
        ST_MakePoint(${fromPoint.lng}, ${fromPoint.lat})::geography,
        ST_MakePoint(${toPoint.lng}, ${toPoint.lat})::geography,
        ${(rideData.from_address as string) || null},
        ${(rideData.to_address as string) || null},
        ${(rideData.route_polyline as string) || null},
        ${rideData.departure_time as string},
        ${(rideData.available_seats as number) || 1},
        ${(rideData.vehicle_id as string) || null}
      ) RETURNING *,
        ST_Y(from_point::geometry) AS from_lat, ST_X(from_point::geometry) AS from_lng,
        ST_Y(to_point::geometry) AS to_lat, ST_X(to_point::geometry) AS to_lng
    `);

    return result.rows[0];
  }

  async findAvailable(lat: number, lng: number, radiusMeters: number) {
    const result = await this.database.db.execute(sql`
      SELECT
        r.*,
        ST_Y(r.from_point::geometry) AS from_lat,
        ST_X(r.from_point::geometry) AS from_lng,
        ST_Y(r.to_point::geometry) AS to_lat,
        ST_X(r.to_point::geometry) AS to_lng,
        ST_Distance(r.from_point, ST_MakePoint(${lng}, ${lat})::geography) AS distance_m
      FROM rides r
      WHERE r.status = 'active'
        AND r.departure_time > now()
        AND ST_DWithin(r.from_point, ST_MakePoint(${lng}, ${lat})::geography, ${radiusMeters})
      ORDER BY distance_m
    `);

    return result.rows;
  }

  async getByGiver(userId: string) {
    const result = await this.database.db.execute(sql`
      SELECT
        r.*,
        ST_Y(r.from_point::geometry) AS from_lat,
        ST_X(r.from_point::geometry) AS from_lng,
        ST_Y(r.to_point::geometry) AS to_lat,
        ST_X(r.to_point::geometry) AS to_lng,
        row_to_json(v) AS vehicle
      FROM rides r
      LEFT JOIN vehicles v ON v.id = r.vehicle_id
      WHERE r.giver_id = ${userId}
      ORDER BY r.departure_time DESC
    `);

    return result.rows;
  }

  async offerToTaker(
    giverId: string,
    rideId: string,
    body: { taker_id: string; ride_request_id?: string },
  ) {
    const [ride] = await this.database.db
      .select({ giverId: rides.giverId })
      .from(rides)
      .where(eq(rides.id, rideId))
      .limit(1);

    if (ride?.giverId !== giverId) {
      throw new ForbiddenException('You can only offer your own rides');
    }

    const [match] = await this.database.db
      .insert(rideMatches)
      .values({
        rideId,
        takerId: body.taker_id,
        rideRequestId: body.ride_request_id || null,
        status: 'offered',
      })
      .returning();

    await this.database.db.insert(chatrooms).values({
      rideMatchId: match.id,
    });

    const [taker] = await this.database.db
      .select({ pushToken: profiles.pushToken })
      .from(profiles)
      .where(eq(profiles.id, body.taker_id))
      .limit(1);

    if (taker?.pushToken) {
      await this.notifications.sendPush(
        taker.pushToken,
        'Ride Offered!',
        'Someone offered you a ride. Tap to view details.',
      );
    }

    return match;
  }
}
