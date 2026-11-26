import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  ParseIntPipe,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ChatService } from './chat.service';
import { DirectConversationDto } from './dto/direct-conversation.dto';
import { SendMessageDto } from './dto/send-message.dto';

@Controller('api/chat')
@UseGuards(JwtAuthGuard)
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get('conversations')
  async conversations(@Req() req: any) {
    const data = await this.chatService.conversations(req.user.id);
    return { success: true, data };
  }

  @Post('conversations/direct')
  @HttpCode(200)
  async direct(@Req() req: any, @Body() dto: DirectConversationDto) {
    const data = await this.chatService.directConversation(req.user.id, dto.friendId);
    return { success: true, data };
  }

  @Get('conversations/:conversationId/messages')
  async messages(@Req() req: any, @Param('conversationId', ParseIntPipe) conversationId: number) {
    const data = await this.chatService.messages(req.user.id, conversationId);
    return { success: true, data };
  }

  @Post('conversations/:conversationId/messages')
  @HttpCode(200)
  async sendMessage(
    @Req() req: any,
    @Param('conversationId', ParseIntPipe) conversationId: number,
    @Body() dto: SendMessageDto,
  ) {
    const data = await this.chatService.sendMessage(req.user.id, conversationId, dto.content);
    return { success: true, data };
  }
}
