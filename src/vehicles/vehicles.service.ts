import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { eq, desc } from 'drizzle-orm';
import { DatabaseService } from '../database/database.service';
import { vehicles } from '../database/schema';

@Injectable()
export class VehiclesService {
  constructor(private database: DatabaseService) {}

  async getByUser(userId: string) {
    return this.database.db
      .select()
      .from(vehicles)
      .where(eq(vehicles.userId, userId))
      .orderBy(desc(vehicles.createdAt));
  }

  async create(userId: string, data: typeof vehicles.$inferInsert) {
    const [vehicle] = await this.database.db
      .insert(vehicles)
      .values({ ...data, userId })
      .returning();

    return vehicle;
  }

  async delete(userId: string, vehicleId: string) {
    const [existing] = await this.database.db
      .select({ userId: vehicles.userId })
      .from(vehicles)
      .where(eq(vehicles.id, vehicleId))
      .limit(1);

    if (!existing) throw new NotFoundException('Vehicle not found');
    if (existing.userId !== userId)
      throw new ForbiddenException('Not your vehicle');

    await this.database.db.delete(vehicles).where(eq(vehicles.id, vehicleId));
    return { deleted: true };
  }
}
