import { IsNotEmpty } from 'class-validator';

export class StartSessionDto {
  @IsNotEmpty({ message: 'gameId é obrigatório.' })
  gameId: number | string;
}
