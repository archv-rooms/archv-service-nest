import { IsBoolean, IsOptional } from 'class-validator';

export class SetReadyDto {
  @IsOptional()
  @IsBoolean({ message: 'ready deve ser verdadeiro ou falso.' })
  ready?: boolean;
}
