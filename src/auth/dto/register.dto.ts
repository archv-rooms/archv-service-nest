import { IsEmail, IsNotEmpty, MinLength } from 'class-validator';

// Cada decorator abaixo substitui uma verificação manual que existia no
// controller do Express (o "if (!name || !email || !password || !username)").
// Se algum campo não passar na validação, o Nest já responde 400 antes
// mesmo do controller ser chamado.
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
