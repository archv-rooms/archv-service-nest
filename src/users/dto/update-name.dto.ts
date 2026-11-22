import { IsString, MinLength } from 'class-validator';

export class UpdateNameDto {
  @IsString()
  @MinLength(2, { message: 'Nome inválido. Mínimo de 2 caracteres.' })
  name: string;
}
