import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Put,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';
import { multerOptions } from '../common/multer-options';
import { GamesService } from './games.service';
import { CreateGameDto } from './dto/create-game.dto';
import { UpdateGameDto } from './dto/update-game.dto';

@Controller('api/games')
export class GamesController {
  constructor(private readonly gamesService: GamesService) {}

  @Get()
  @UseGuards(OptionalJwtAuthGuard)
  async findAll() {
    const games = await this.gamesService.findAll();
    return { success: true, data: games, message: 'Jogos carregados.' };
  }

  @Get(':id')
  @UseGuards(OptionalJwtAuthGuard)
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const game = await this.gamesService.findOne(id);
    return { success: true, data: game, message: 'Jogo carregado.' };
  }

  @Post()
  @UseGuards(AdminGuard)
  async create(@Body() dto: CreateGameDto) {
    const game = await this.gamesService.create(dto);
    return { success: true, data: game, message: 'Jogo criado.' };
  }

  @Put(':id')
  @UseGuards(AdminGuard)
  async update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateGameDto) {
    const game = await this.gamesService.update(id, dto);
    return { success: true, data: game, message: 'Jogo atualizado.' };
  }

  @Delete(':id')
  @UseGuards(AdminGuard)
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.gamesService.remove(id);
    return { success: true, data: {}, message: 'Jogo deletado.' };
  }

  @Patch(':id/image')
  @UseGuards(AdminGuard)
  @UseInterceptors(FileInterceptor('image', multerOptions))
  async updateImage(@Param('id', ParseIntPipe) id: number, @UploadedFile() file: Express.Multer.File) {
    const game = await this.gamesService.updateImage(id, file);
    return { success: true, data: game, message: 'Imagem do jogo atualizada.' };
  }

  @Patch(':id/file')
  @UseGuards(AdminGuard)
  @UseInterceptors(FileInterceptor('file', multerOptions))
  async updateFile(@Param('id', ParseIntPipe) id: number, @UploadedFile() file: Express.Multer.File) {
    const game = await this.gamesService.updateFile(id, file);
    return { success: true, data: game, message: 'Arquivo da room atualizado.' };
  }
}
