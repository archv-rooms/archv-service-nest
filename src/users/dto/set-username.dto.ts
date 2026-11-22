import { IsString, MinLength } from 'class-validator';

export class SetUsernameDto {
  @IsString()
  @MinLength(3, { message: 'Username inválido. Mínimo de 3 caracteres.' })
  username: string;
}
