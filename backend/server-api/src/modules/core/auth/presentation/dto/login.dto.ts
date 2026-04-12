import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @IsEmail({}, { message: 'E-mail invalido' })
  @IsNotEmpty({ message: 'E-mail obrigatorio' })
  email: string;

  @IsString()
  @IsNotEmpty({ message: 'Senha obrigatoria' })
  @MinLength(6, { message: 'Senha deve ter no minimo 6 caracteres' })
  password: string;
}
