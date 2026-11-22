import {
  Controller,
  Get,
  Patch,
  Post,
  Body,
  Param,
  ParseIntPipe,
  Req,
  UseGuards,
  UseInterceptors,
  HttpCode,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { multerOptions } from '../common/multer-options';
import { UsersService } from './users.service';
import { UpdateNameDto } from './dto/update-name.dto';
import { SetUsernameDto } from './dto/set-username.dto';
import { UpdateAvatarUrlDto } from './dto/update-avatar-url.dto';

// @UseGuards no controller inteiro equivale a repetir authMiddleware em
// cada rota do userRoutes.js original — todas as rotas daqui exigem login.
@Controller('api/user')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('profile')
  async getProfile(@Req() req: any) {
    const user = await this.usersService.getProfile(req.user.id);
    return { success: true, data: { user }, message: 'Perfil carregado com sucesso.' };
  }

  @Patch('name')
  async updateName(@Req() req: any, @Body() dto: UpdateNameDto) {
    const data = await this.usersService.updateName(req.user.id, dto.name);
    return { success: true, data, message: 'Nome atualizado com sucesso.' };
  }

  @Patch('username')
  async setUsername(@Req() req: any, @Body() dto: SetUsernameDto) {
    const data = await this.usersService.setUsername(req.user.id, dto.username);
    return { success: true, data, message: 'Username definido com sucesso.' };
  }

  @Patch('avatar-url')
  async updateAvatarUrl(@Req() req: any, @Body() dto: UpdateAvatarUrlDto) {
    const data = await this.usersService.updateAvatarUrl(req.user.id, dto.avatarUrl);
    return { success: true, data, message: 'Avatar atualizado com sucesso.' };
  }

  @Patch('avatar-file')
  @UseInterceptors(FileInterceptor('avatar', multerOptions))
  async updateAvatarFile(@Req() req: any, @UploadedFile() file: Express.Multer.File) {
    const data = await this.usersService.updateAvatarFile(req.user.id, file);
    return { success: true, data, message: 'Avatar atualizado com sucesso.' };
  }

  @Patch('onboarding')
  async completeOnboarding(@Req() req: any) {
    await this.usersService.completeOnboarding(req.user.id);
    return { success: true, data: {}, message: 'Onboarding concluído.' };
  }

  @Get('payments')
  async getPaymentHistory(@Req() req: any) {
    const payments = await this.usersService.getPaymentHistory(req.user.id);
    return { success: true, data: { payments }, message: 'Histórico carregado.' };
  }

  @Post('favorites/:gameId')
  @HttpCode(200)
  async toggleFavorite(@Req() req: any, @Param('gameId', ParseIntPipe) gameId: number) {
    const data = await this.usersService.toggleFavorite(req.user.id, gameId);
    const message = data.favorited ? 'Jogo adicionado aos favoritos.' : 'Jogo removido dos favoritos.';
    return { success: true, data, message };
  }

  @Get('favorites')
  async getFavorites(@Req() req: any) {
    const games = await this.usersService.getFavorites(req.user.id);
    return { success: true, data: { games }, message: 'Favoritos carregados.' };
  }

  // Fica por último porque é uma rota "coringa" (:id) — se viesse antes de
  // /favorites, por exemplo, o Nest tentaria casar "favorites" como se
  // fosse um :id. A ordem das rotas no controller importa, igual importava
  // no Express.
  @Get(':id/public-profile')
  async getPublicProfile(@Req() req: any, @Param('id', ParseIntPipe) id: number) {
    const data = await this.usersService.getPublicProfile(id, req.user.id);
    return { success: true, data, message: 'Perfil carregado.' };
  }
}
