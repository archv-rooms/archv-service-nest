import { IsEmail, IsNotEmpty, MinLength } from 'class-validator';

export class RegisterDto {
  @IsNotEmpty({ message: 'Nome é obrigatório.' })
  name: string;

  @IsNotEmpty({ message: 'Username é obrigatório.' })
  username: string;

  @IsEmail({}, { message: 'E-mail inválido.' })
  email: string;

  @MinLength(6, { message: 'Senha deve ter no mínimo 6 caracteres.' })
  password: string;
}
