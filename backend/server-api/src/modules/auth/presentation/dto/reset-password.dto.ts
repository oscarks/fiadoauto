import { IsString, IsUUID, Matches, MinLength } from 'class-validator';

export class ResetPasswordDto {
  @IsUUID()
  token!: string;

  @IsString()
  @MinLength(8)
  @Matches(/^(?=.*[A-Z])(?=.*\d).+$/, {
    message: 'newPassword must contain at least one uppercase letter and one number',
  })
  newPassword!: string;
}
