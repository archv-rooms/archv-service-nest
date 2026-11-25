import { IsEmail, IsNotEmpty, MinLength } from 'class-validator';

export class RegisterDto {
  @IsNotEmpty({ message: 'Nome, nick, e-mail e senha são obrigatórios.' })
  name: string;

  @IsNotEmpty({ message: 'Nome, nick, e-mail e senha são obrigatórios.' })
  username: string;

  @IsEmail({}, { message: 'E-mail inválido.' })
  email: string;

  @MinLength(6, { message: 'Senha deve ter no mínimo 6 caracteres.' })
  password: string;
}
