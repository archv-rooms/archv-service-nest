import { IsNotEmpty, IsString } from 'class-validator';

export class UpdateAvatarUrlDto {
  @IsString()
  @IsNotEmpty({ message: 'URL do avatar é obrigatória.' })
  avatarUrl: string;
}
