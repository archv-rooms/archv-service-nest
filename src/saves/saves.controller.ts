import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SavesService } from './saves.service';
import { UpsertSaveDto } from './dto/upsert-save.dto';

@Controller('api/saves')
@UseGuards(JwtAuthGuard)
export class SavesController {
  constructor(private readonly savesService: SavesService) {}

  @Get(':gameId')
  async list(@Req() req: any, @Param('gameId') gameId: string) {
    const data = await this.savesService.list(req.user.id, Number(gameId));
    return { success: true, data, message: 'Saves carregados.' };
  }

  @Post(':gameId')
  @HttpCode(200)
  async upsert(@Req() req: any, @Param('gameId') gameId: string, @Body() dto: UpsertSaveDto) {
    const data = await this.savesService.upsert(req.user.id, Number(gameId), dto.slot, dto.saveData);
    return { success: true, data, message: 'Save sincronizado.' };
  }

  @Delete(':gameId/:slot')
  async remove(@Req() req: any, @Param('gameId') gameId: string, @Param('slot') slot: string) {
    await this.savesService.remove(req.user.id, Number(gameId), Number(slot));
    return { success: true, data: {}, message: 'Save apagado.' };
  }
}
