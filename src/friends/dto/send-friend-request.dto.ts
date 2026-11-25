import { IsNotEmpty } from 'class-validator';

export class SendFriendRequestDto {
  @IsNotEmpty({ message: 'receiverId é obrigatório.' })
  receiverId: number | string;
}
