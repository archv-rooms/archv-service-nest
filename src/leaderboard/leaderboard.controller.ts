import { Controller, Get, Param, Query, Req, UseGuards } from '@nestjs/common';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';
import { LeaderboardService } from './leaderboard.service';

@Controller('api/leaderboard')
@UseGuards(OptionalJwtAuthGuard)
export class LeaderboardController {
  constructor(private readonly leaderboardService: LeaderboardService) {}

  @Get('ranking')
  async ranking(@Query('gameId') gameId?: string) {
    const data = await this.leaderboardService.globalRanking(gameId);
    return { success: true, data, message: 'Ranking global.' };
  }

  @Get('history')
  async history(@Query('gameId') gameId?: string) {
    const data = await this.leaderboardService.gameHistory(gameId);
    return { success: true, data, message: 'Histórico de partidas.' };
  }

  @Get('games')
  async games() {
    const data = await this.leaderboardService.games();
    return { success: true, data, message: 'Jogos listados.' };
  }

  @Get('profile/:username')
  async profile(@Req() req: any, @Param('username') username: string) {
    const data = await this.leaderboardService.playerProfile(username, req.user?.id);
    return { success: true, data };
  }
}
