import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Req,
} from '@nestjs/common';
import { Public } from '../../../../common/decorators/public.decorator';
import { Audited } from '../../../../common/decorators/audited.decorator';
import { AuthService } from '../application/auth.service';
import type { AuthContext } from '../../../../common/types/auth-context.type';
import { LoginDto } from './dto/login.dto';
import { RefreshDto } from './dto/refresh.dto';
import { ConfirmEmailDto } from './dto/confirm-email.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

interface RequestWithAuth {
  ip: string;
  authContext?: AuthContext;
}

@Controller('api/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @HttpCode(200)
  @Post('login')
  login(@Body() body: LoginDto, @Req() request: RequestWithAuth) {
    return this.authService.login({
      email: body.email,
      password: body.password,
      ipAddress: request.ip ?? 'unknown',
    });
  }

  @Public()
  @HttpCode(200)
  @Post('refresh')
  refresh(@Body() body: RefreshDto) {
    return this.authService.refresh({
      refreshToken: body.refreshToken,
    });
  }

  @Audited('AUTH_LOGOUT')
  @HttpCode(204)
  @Post('logout')
  async logout(@Req() request: RequestWithAuth): Promise<void> {
    const userId = request.authContext?.sub;
    if (!userId) return;
    await this.authService.logout({ userId });
  }

  @Get('me')
  me(@Req() request: RequestWithAuth) {
    return this.authService.me(request.authContext!.sub);
  }

  @Public()
  @HttpCode(200)
  @Post('confirm-email')
  confirmEmail(@Body() body: ConfirmEmailDto) {
    return this.authService.confirmEmail({ token: body.token });
  }

  @Public()
  @HttpCode(200)
  @Post('forgot-password')
  forgotPassword(@Body() body: ForgotPasswordDto) {
    return this.authService.forgotPassword({ email: body.email });
  }

  @Public()
  @HttpCode(200)
  @Post('reset-password')
  resetPassword(@Body() body: ResetPasswordDto) {
    return this.authService.resetPassword({
      token: body.token,
      newPassword: body.newPassword,
    });
  }
}
