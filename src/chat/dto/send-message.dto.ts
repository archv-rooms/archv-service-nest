import { IsNotEmpty, IsString } from 'class-validator';

export class SendMessageDto {
  @IsString({ message: 'Mensagem vazia.' })
  @IsNotEmpty({ message: 'Mensagem vazia.' })
  content: string;
}
