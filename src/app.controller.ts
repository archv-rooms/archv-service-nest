import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  @Get()
  status() {
    return { success: true, data: {}, message: 'Archv.rooms OS API Online!' };
  }
}
