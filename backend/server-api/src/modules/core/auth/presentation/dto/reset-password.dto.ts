import { IsNotEmpty, IsString, MinLength, Matches } from 'class-validator';

export class ResetPasswordDto {
  @IsString()
  @IsNotEmpty({ message: 'Token é obrigatório' })
  token: string;

  @IsString()
  @MinLength(8, { message: 'Senha deve ter no mínimo 8 caracteres' })
  @Matches(/[A-Z]/, { message: 'Senha deve conter ao menos 1 letra maiúscula' })
  @Matches(/[0-9]/, { message: 'Senha deve conter ao menos 1 número' })
  newPassword: string;
}
