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
import { RoomsService } from './rooms.service';
import { CreateRoomDto } from './dto/create-room.dto';
import { SetReadyDto } from './dto/set-ready.dto';
import { SendRoomMessageDto } from './dto/send-room-message.dto';

@Controller('api/rooms')
@UseGuards(JwtAuthGuard)
export class RoomsController {
  constructor(private readonly roomsService: RoomsService) {}

  @Get()
  async list(@Req() req: any) {
    const data = await this.roomsService.list(req.user.id);
    return { success: true, data };
  }

  @Post()
  async create(@Req() req: any, @Body() dto: CreateRoomDto) {
    const data = await this.roomsService.create(req.user.id, dto);
    return { success: true, data };
  }

  @Post(':id/join')
  @HttpCode(200)
  async join(@Req() req: any, @Param('id', ParseIntPipe) id: number) {
    const data = await this.roomsService.join(req.user.id, id);
    return { success: true, data };
  }

  @Post(':id/leave')
  @HttpCode(200)
  async leave(@Req() req: any, @Param('id', ParseIntPipe) id: number) {
    const data = await this.roomsService.leave(req.user.id, id);
    return { success: true, data };
  }

  @Get(':id/state')
  async getState(@Req() req: any, @Param('id', ParseIntPipe) id: number) {
    const data = await this.roomsService.getState(req.user.id, id);
    return { success: true, data };
  }

  @Post(':id/ready')
  @HttpCode(200)
  async setReady(@Req() req: any, @Param('id', ParseIntPipe) id: number, @Body() dto: SetReadyDto) {
    const data = await this.roomsService.setReady(req.user.id, id, dto.ready);
    return { success: true, data };
  }

  @Post(':id/messages')
  @HttpCode(200)
  async sendMessage(
    @Req() req: any,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: SendRoomMessageDto,
  ) {
    const data = await this.roomsService.sendMessage(req.user.id, id, dto.content);
    return { success: true, data };
  }

  @Post(':id/start')
  @HttpCode(200)
  async start(@Req() req: any, @Param('id', ParseIntPipe) id: number) {
    const data = await this.roomsService.start(req.user.id, id);
    return { success: true, data };
  }
}
