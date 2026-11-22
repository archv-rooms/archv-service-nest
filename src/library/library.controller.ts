import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SubscriptionGuard } from '../auth/guards/subscription.guard';
import { LibraryService } from './library.service';

@Controller('api/library')
@UseGuards(JwtAuthGuard, SubscriptionGuard)
export class LibraryController {
  constructor(private readonly libraryService: LibraryService) {}

  @Get()
  async getLibrary(@Req() req: any) {
    const games = await this.libraryService.getLibrary(req.accessLevel);
    return { success: true, data: { games }, message: 'Biblioteca carregada com sucesso.' };
  }
}
