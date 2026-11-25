import {
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { NotificationsService } from './notifications.service';

@Controller('api/notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  async list(@Req() req: any) {
    const data = await this.notificationsService.list(req.user.id);
    return { success: true, data, message: 'Notificações listadas.' };
  }

  @Get('unread')
  async unreadCount(@Req() req: any) {
    const data = await this.notificationsService.unreadCount(req.user.id);
    return { success: true, data, message: 'Contagem obtida.' };
  }

  @Patch('read-all')
  async markAllAsRead(@Req() req: any) {
    await this.notificationsService.markAllAsRead(req.user.id);
    return { success: true, data: {}, message: 'Todas marcadas como lidas.' };
  }

  @Patch(':id/read')
  async markAsRead(@Req() req: any, @Param('id', ParseIntPipe) id: number) {
    await this.notificationsService.markAsRead(req.user.id, id);
    return { success: true, data: {}, message: 'Notificação marcada como lida.' };
  }

  @Delete(':id')
  async remove(@Req() req: any, @Param('id', ParseIntPipe) id: number) {
    await this.notificationsService.remove(req.user.id, id);
    return { success: true, data: {}, message: 'Notificação deletada.' };
  }
}
