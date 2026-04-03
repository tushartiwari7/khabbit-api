import { Module } from '@nestjs/common';
import { ChatGateway } from './chat.gateway';
import { ChatService } from './chat.service';
import { NotificationsModule } from '../notifications/notifications.module';
import { ProfilesModule } from '../profiles/profiles.module';

@Module({
  imports: [NotificationsModule, ProfilesModule],
  providers: [ChatGateway, ChatService],
  exports: [ChatService],
})
export class ChatModule {}
