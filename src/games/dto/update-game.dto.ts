import { IsInt, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class UpdateGameDto {
  @IsOptional()
  @IsString({ message: 'Título inválido.' })
  @IsNotEmpty({ message: 'Título não pode ser vazio.' })
  title?: string;

  @IsOptional()
  @IsString({ message: 'Plataforma inválida.' })
  @IsNotEmpty({ message: 'Plataforma não pode ser vazia.' })
  platform?: string;

  @IsOptional()
  @IsString({ message: 'URL da capa inválida.' })
  coverUrl?: string;

  @IsOptional()
  @IsInt({ message: 'Nível de acesso deve ser um número inteiro.' })
  accessLevel?: number;

  @IsOptional()
  @IsInt({ message: 'Plano inválido.' })
  planId?: number | null;
}
