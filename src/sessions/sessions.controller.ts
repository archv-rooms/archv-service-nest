import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SessionsService } from './sessions.service';
import { StartSessionDto } from './dto/start-session.dto';

@Controller('api/sessions')
@UseGuards(JwtAuthGuard)
export class SessionsController {
  constructor(private readonly sessionsService: SessionsService) {}

  @Post('start')
  async start(@Req() req: any, @Body() dto: StartSessionDto) {
    const data = await this.sessionsService.start(req.user.id, dto.gameId);
    return { success: true, data, message: 'Sessão iniciada.' };
  }

  @Get('history')
  async history(@Req() req: any) {
    const data = await this.sessionsService.history(req.user.id);
    return { success: true, data, message: 'Histórico carregado.' };
  }

  @Patch(':id/end')
  async end(@Req() req: any, @Param('id', ParseIntPipe) id: number) {
    const data = await this.sessionsService.end(req.user.id, id);
    return { success: true, data, message: 'Sessão encerrada.' };
  }
}
