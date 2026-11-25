import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { FriendsService } from './friends.service';
import { SendFriendRequestDto } from './dto/send-friend-request.dto';
import { RespondFriendRequestDto } from './dto/respond-friend-request.dto';

@Controller('api/friends')
@UseGuards(JwtAuthGuard)
export class FriendsController {
  constructor(private readonly friendsService: FriendsService) {}

  @Get('search')
  async search(@Req() req: any, @Query('q') q?: string) {
    const data = await this.friendsService.search(req.user.id, q);
    return { success: true, data, message: 'Usuários encontrados.' };
  }

  @Get('activity')
  async activity(@Req() req: any) {
    const data = await this.friendsService.activity(req.user.id);
    return { success: true, data };
  }

  @Get('pending')
  async pending(@Req() req: any) {
    const data = await this.friendsService.pending(req.user.id);
    return { success: true, data, message: 'Convites pendentes.' };
  }

  @Get()
  async list(@Req() req: any) {
    const data = await this.friendsService.list(req.user.id);
    return { success: true, data, message: 'Amigos listados.' };
  }

  @Post('request')
  async sendRequest(@Req() req: any, @Body() dto: SendFriendRequestDto) {
    const data = await this.friendsService.sendRequest(req.user.id, dto.receiverId);
    return { success: true, data, message: 'Convite enviado!' };
  }

  @Patch(':id/respond')
  async respond(
    @Req() req: any,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: RespondFriendRequestDto,
  ) {
    const data = await this.friendsService.respond(req.user.id, id, dto.status);
    return { success: true, data, message: `Convite ${dto.status}.` };
  }

  @Delete(':id')
  async remove(@Req() req: any, @Param('id', ParseIntPipe) id: number) {
    await this.friendsService.remove(req.user.id, id);
    return { success: true, data: {}, message: 'Amigo removido.' };
  }
}
