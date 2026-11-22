import { IsNotEmpty, IsOptional } from 'class-validator';

export class CreateRoomDto {
  @IsNotEmpty({ message: 'gameId é obrigatório.' })
  gameId: number | string;

  @IsOptional()
  maxPlayers?: number | string;
}
