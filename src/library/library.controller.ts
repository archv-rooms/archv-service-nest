import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { LibraryService } from './library.service';

@Controller('api/library')
@UseGuards(JwtAuthGuard)
export class LibraryController {
  constructor(private readonly libraryService: LibraryService) {}

  @Get()
  async getLibrary() {
    const games = await this.libraryService.getLibrary();
    return { success: true, data: { games }, message: 'Biblioteca carregada com sucesso.' };
  }
}
