import { Controller, Get } from '@nestjs/common';
import { PlatformsService } from './platforms.service';

@Controller('api/platforms')
export class PlatformsController {
  constructor(private readonly platformsService: PlatformsService) {}

  @Get()
  async getPlatforms() {
    const data = await this.platformsService.getPlatforms();
    return { success: true, data };
  }
}
