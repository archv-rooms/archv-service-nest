import { IsInt, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateGameDto {
  @IsString({ message: 'Título inválido.' })
  @IsNotEmpty({ message: 'Título é obrigatório.' })
  title: string;

  @IsString({ message: 'Plataforma inválida.' })
  @IsNotEmpty({ message: 'Plataforma é obrigatória.' })
  platform: string;

  @IsOptional()
  @IsString({ message: 'URL da capa inválida.' })
  coverUrl?: string;

  @IsInt({ message: 'Nível de acesso deve ser um número inteiro.' })
  accessLevel: number;

  @IsOptional()
  @IsInt({ message: 'Plano inválido.' })
  planId?: number | null;
}
