import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { eq, sql } from 'drizzle-orm';
import { DatabaseService } from '../database/database.service';
import { rideMatches, rides } from '../database/schema';

@Injectable()
export class RideMatchesService {
  constructor(private database: DatabaseService) {}

  async accept(userId: string, matchId: string) {
    const [match] = await this.database.db
      .select()
      .from(rideMatches)
      .where(eq(rideMatches.id, matchId))
      .limit(1);

    if (!match) throw new NotFoundException('Match not found');
    if (match.takerId !== userId)
      throw new ForbiddenException('Only the taker can accept');

    const [updated] = await this.database.db
      .update(rideMatches)
      .set({ status: 'accepted' })
      .where(eq(rideMatches.id, matchId))
      .returning();

    return updated;
  }

  async confirmPayment(
    userId: string,
    matchId: string,
    body: { status: 'paid' | 'received'; method?: string },
  ) {
    const rows = await this.database.db.execute(sql`
      SELECT rm.*, r.giver_id
      FROM ride_matches rm
      JOIN rides r ON r.id = rm.ride_id
      WHERE rm.id = ${matchId}
      LIMIT 1
    `);

    const match = rows[0] as any;
    if (!match) throw new NotFoundException('Match not found');

    const isGiver = match.giver_id === userId;
    const isTaker = match.taker_id === userId;

    if (body.status === 'paid' && !isTaker)
      throw new ForbiddenException('Only taker can mark as paid');
    if (body.status === 'received' && !isGiver)
      throw new ForbiddenException('Only giver can mark as received');

    const updateData: Record<string, unknown> = {
      paymentStatus: body.status,
    };
    if (body.method) updateData.paymentMethod = body.method;

    const [updated] = await this.database.db
      .update(rideMatches)
      .set(updateData)
      .where(eq(rideMatches.id, matchId))
      .returning();

    return updated;
  }
}
