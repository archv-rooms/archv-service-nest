import { IsNotEmpty } from 'class-validator';

export class DirectConversationDto {
  @IsNotEmpty({ message: 'friendId é obrigatório.' })
  friendId: number | string;
}
