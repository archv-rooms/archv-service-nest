import { IsNotEmpty, IsString } from 'class-validator';

export class SavePushTokenDto {
  @IsString({ message: 'Token de push inválido.' })
  @IsNotEmpty({ message: 'Token de push inválido.' })
  pushToken: string;
}
