import { IsOptional, IsString } from 'class-validator';

export class SendRoomMessageDto {
  @IsOptional()
  @IsString({ message: 'Mensagem inválida.' })
  content?: string;
}
