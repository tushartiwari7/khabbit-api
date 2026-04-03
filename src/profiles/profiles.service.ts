import { Injectable, NotFoundException } from '@nestjs/common';
import { eq, sql } from 'drizzle-orm';
import { DatabaseService } from '../database/database.service';
import { profiles, approvedDomains, waitlist } from '../database/schema';

@Injectable()
export class ProfilesService {
  constructor(private database: DatabaseService) {}

  async getByFirebaseUid(firebaseUid: string) {
    const [profile] = await this.database.db
      .select()
      .from(profiles)
      .where(eq(profiles.firebaseUid, firebaseUid))
      .limit(1);

    if (!profile) throw new NotFoundException('Profile not found');
    return profile;
  }

  async getById(profileId: string) {
    const [profile] = await this.database.db
      .select()
      .from(profiles)
      .where(eq(profiles.id, profileId))
      .limit(1);

    if (!profile) throw new NotFoundException('Profile not found');
    return profile;
  }

  async createOnSignup(firebaseUid: string, email: string, inviteCode?: string) {
    const domain = email.split('@')[1];

    const [approved] = await this.database.db
      .select()
      .from(approvedDomains)
      .where(eq(approvedDomains.domain, domain))
      .limit(1);

    let invitedBy: string | null = null;
    let isApproved = !!approved;

    if (inviteCode) {
      const [referrer] = await this.database.db
        .select({ id: profiles.id })
        .from(profiles)
        .where(eq(profiles.inviteCode, inviteCode))
        .limit(1);

      if (referrer) {
        invitedBy = referrer.id;
        isApproved = true;
      }
    }

    const [profile] = await this.database.db
      .insert(profiles)
      .values({
        id: sql`gen_random_uuid()`,
        firebaseUid,
        email,
        waitlistStatus: isApproved ? 'approved' : 'pending',
        inviteCode: sql`encode(gen_random_bytes(6), 'hex')`,
        invitedBy,
      })
      .returning();

    if (!isApproved) {
      await this.database.db.insert(waitlist).values({
        email,
        inviteCode: inviteCode || null,
        status: 'pending',
        invitedByUserId: invitedBy,
      });
    }

    return profile;
  }

  async update(profileId: string, updateData: Partial<typeof profiles.$inferInsert>) {
    const [updated] = await this.database.db
      .update(profiles)
      .set({ ...updateData, updatedAt: new Date() })
      .where(eq(profiles.id, profileId))
      .returning();

    if (!updated) throw new NotFoundException('Profile not found');
    return updated;
  }
}
