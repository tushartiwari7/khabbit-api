import { Injectable, NotFoundException } from '@nestjs/common';
import { eq, sql } from 'drizzle-orm';
import { DatabaseService } from '../database/database.service';
import { rideRequests } from '../database/schema';

@Injectable()
export class RideRequestsService {
  constructor(private database: DatabaseService) {}

  async create(userId: string, requestData: Record<string, unknown>) {
    const fromPoint = requestData.from_point as { lat: number; lng: number };
    const toPoint = requestData.to_point as { lat: number; lng: number };

    const result = await this.database.db.execute(sql`
      INSERT INTO ride_requests (
        taker_id, from_point, to_point, from_address, to_address,
        num_riders, preferred_time
      ) VALUES (
        ${userId},
        ST_MakePoint(${fromPoint.lng}, ${fromPoint.lat})::geography,
        ST_MakePoint(${toPoint.lng}, ${toPoint.lat})::geography,
        ${(requestData.from_address as string) || null},
        ${(requestData.to_address as string) || null},
        ${(requestData.num_riders as number) || 1},
        ${(requestData.preferred_time as string) || null}
      ) RETURNING *,
        ST_Y(from_point::geometry) AS from_lat, ST_X(from_point::geometry) AS from_lng,
        ST_Y(to_point::geometry) AS to_lat, ST_X(to_point::geometry) AS to_lng
    `);

    return result.rows[0];
  }

  async getByTaker(userId: string) {
    const result = await this.database.db.execute(sql`
      SELECT
        rr.*,
        ST_Y(rr.from_point::geometry) AS from_lat,
        ST_X(rr.from_point::geometry) AS from_lng,
        ST_Y(rr.to_point::geometry) AS to_lat,
        ST_X(rr.to_point::geometry) AS to_lng
      FROM ride_requests rr
      WHERE rr.taker_id = ${userId}
      ORDER BY rr.created_at DESC
    `);

    return result.rows;
  }

  async findMatchingRides(requestId: string) {
    const [request] = await this.database.db
      .select()
      .from(rideRequests)
      .where(eq(rideRequests.id, requestId))
      .limit(1);

    if (!request) throw new NotFoundException('Ride request not found');

    const result = await this.database.db.execute(sql`
      SELECT
        r.*,
        ST_Y(r.from_point::geometry) AS from_lat,
        ST_X(r.from_point::geometry) AS from_lng,
        ST_Y(r.to_point::geometry) AS to_lat,
        ST_X(r.to_point::geometry) AS to_lng,
        ST_Distance(r.from_point, rr.from_point) AS distance_from_m,
        ST_Distance(r.to_point, rr.to_point) AS distance_to_m
      FROM rides r, ride_requests rr
      WHERE rr.id = ${requestId}
        AND r.status = 'active'
        AND r.departure_time > now()
        AND r.available_seats >= rr.num_riders
        AND ST_DWithin(r.from_point, rr.from_point, 5000)
        AND ST_DWithin(r.to_point, rr.to_point, 5000)
      ORDER BY ST_Distance(r.from_point, rr.from_point)
    `);

    return result.rows;
  }
}
