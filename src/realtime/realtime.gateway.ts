import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({ cors: { origin: '*' } })
export class RealtimeGateway {
  @WebSocketServer()
  server: Server;

  @SubscribeMessage('join_conversation')
  joinConversation(@ConnectedSocket() client: Socket, @MessageBody() conversationId: number | string) {
    client.join(`conversation_${conversationId}`);
  }

  @SubscribeMessage('leave_conversation')
  leaveConversation(@ConnectedSocket() client: Socket, @MessageBody() conversationId: number | string) {
    client.leave(`conversation_${conversationId}`);
  }

  emitRoomsUpdated() {
    this.server?.emit('rooms_updated');
  }

  emitNewMessage(conversationId: number, message: unknown) {
    this.server?.to(`conversation_${conversationId}`).emit('new_message', message);
  }
}
