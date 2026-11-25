import { IsNotEmpty, IsOptional } from 'class-validator';

export class UpsertSaveDto {
  @IsOptional()
  slot?: number | string;

  @IsNotEmpty({ message: 'saveData é obrigatório.' })
  saveData: any;
}
