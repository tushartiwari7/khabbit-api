import { Injectable } from '@nestjs/common';
import { eq, asc, sql } from 'drizzle-orm';
import { DatabaseService } from '../database/database.service';
import { messages } from '../database/schema';

@Injectable()
export class ChatService {
  constructor(private database: DatabaseService) {}

  async getMessages(chatroomId: string) {
    return this.database.db
      .select()
      .from(messages)
      .where(eq(messages.chatroomId, chatroomId))
      .orderBy(asc(messages.createdAt));
  }

  async sendMessage(chatroomId: string, senderId: string, content: string) {
    const [message] = await this.database.db
      .insert(messages)
      .values({ chatroomId, senderId, content })
      .returning();

    return message;
  }

  async isParticipant(chatroomId: string, profileId: string): Promise<boolean> {
    const result = await this.database.db.execute(sql`
      SELECT 1
      FROM chatrooms c
      JOIN ride_matches rm ON rm.id = c.ride_match_id
      JOIN rides r ON r.id = rm.ride_id
      WHERE c.id = ${chatroomId}
        AND (rm.taker_id = ${profileId} OR r.giver_id = ${profileId})
      LIMIT 1
    `);

    return result.rows.length > 0;
  }

  async getChatroomsForUser(profileId: string) {
    const result = await this.database.db.execute(sql`
      SELECT c.*, rm.taker_id, r.giver_id,
        (SELECT content FROM messages m WHERE m.chatroom_id = c.id ORDER BY m.created_at DESC LIMIT 1) AS last_message
      FROM chatrooms c
      JOIN ride_matches rm ON rm.id = c.ride_match_id
      JOIN rides r ON r.id = rm.ride_id
      WHERE rm.taker_id = ${profileId} OR r.giver_id = ${profileId}
      ORDER BY c.created_at DESC
    `);

    return result.rows;
  }
}
