import { IsIn } from 'class-validator';

export class RespondFriendRequestDto {
  @IsIn(['accepted', 'rejected'], { message: 'Status inválido.' })
  status: string;
}
