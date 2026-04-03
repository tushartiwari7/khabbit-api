import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Logger, Inject } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import * as admin from 'firebase-admin';
import { ChatService } from './chat.service';
import { ProfilesService } from '../profiles/profiles.service';
import { NotificationsService } from '../notifications/notifications.service';

@WebSocketGateway({ cors: { origin: '*' } })
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server!: Server;
  private readonly logger = new Logger(ChatGateway.name);
  private socketToProfile = new Map<string, string>();

  constructor(
    @Inject('FIREBASE_APP') private firebaseApp: admin.app.App,
    private chatService: ChatService,
    private profilesService: ProfilesService,
    private notifications: NotificationsService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth?.token;
      if (!token) {
        client.disconnect();
        return;
      }

      const decoded = await this.firebaseApp.auth().verifyIdToken(token);
      const profile = await this.profilesService.getByFirebaseUid(decoded.uid);
      this.socketToProfile.set(client.id, profile.id);
      this.logger.log(`Client connected: ${profile.id}`);
    } catch {
      this.logger.warn(`Unauthorized socket connection attempt`);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    const profileId = this.socketToProfile.get(client.id);
    this.socketToProfile.delete(client.id);
    if (profileId) {
      this.logger.log(`Client disconnected: ${profileId}`);
    }
  }

  @SubscribeMessage('joinRoom')
  async handleJoinRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { chatroomId: string },
  ) {
    const profileId = this.socketToProfile.get(client.id);
    if (!profileId) return;

    const isParticipant = await this.chatService.isParticipant(
      data.chatroomId,
      profileId,
    );

    if (!isParticipant) {
      client.emit('error', { message: 'Not a participant of this chatroom' });
      return;
    }

    client.join(data.chatroomId);
    const messages = await this.chatService.getMessages(data.chatroomId);
    client.emit('messageHistory', messages);
  }

  @SubscribeMessage('leaveRoom')
  handleLeaveRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { chatroomId: string },
  ) {
    client.leave(data.chatroomId);
  }

  @SubscribeMessage('sendMessage')
  async handleSendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { chatroomId: string; content: string },
  ) {
    const profileId = this.socketToProfile.get(client.id);
    if (!profileId) return;

    const isParticipant = await this.chatService.isParticipant(
      data.chatroomId,
      profileId,
    );
    if (!isParticipant) return;

    const message = await this.chatService.sendMessage(
      data.chatroomId,
      profileId,
      data.content,
    );

    this.server.to(data.chatroomId).emit('newMessage', message);
  }
}
