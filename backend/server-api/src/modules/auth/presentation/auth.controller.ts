import { Body, Controller, Get, HttpCode, Post, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { AuthenticatedRequestUser } from '../application/access-token-payload.type';
import { ForgotPasswordUseCase } from '../application/forgot-password.use-case';
import { GetMeUseCase } from '../application/get-me.use-case';
import { LoginUseCase } from '../application/login.use-case';
import { LogoutUseCase } from '../application/logout.use-case';
import { RefreshTokenUseCase } from '../application/refresh-token.use-case';
import { ResetPasswordUseCase } from '../application/reset-password.use-case';
import { VerifyEmailUseCase } from '../application/verify-email.use-case';
import { JwtAuthGuard } from '../infrastructure/jwt-auth.guard';
import { Public } from '../../rbac/presentation/public.decorator';
import { AuthTokensDto } from './dto/auth-tokens.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { LoginDto } from './dto/login.dto';
import { LogoutDto } from './dto/logout.dto';
import { MessageDto } from './dto/message.dto';
import { RefreshDto } from './dto/refresh.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { UserProfileDto } from './dto/user-profile.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly loginUseCase: LoginUseCase,
    private readonly refreshTokenUseCase: RefreshTokenUseCase,
    private readonly logoutUseCase: LogoutUseCase,
    private readonly verifyEmailUseCase: VerifyEmailUseCase,
    private readonly forgotPasswordUseCase: ForgotPasswordUseCase,
    private readonly resetPasswordUseCase: ResetPasswordUseCase,
    private readonly getMeUseCase: GetMeUseCase,
  ) {}

  @Post('login')
  @Public()
  @HttpCode(200)
  login(@Body() body: LoginDto): Promise<AuthTokensDto> {
    return this.loginUseCase.execute(body);
  }

  @Post('refresh')
  @Public()
  @HttpCode(200)
  refresh(@Body() body: RefreshDto): Promise<AuthTokensDto> {
    return this.refreshTokenUseCase.execute(body);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(204)
  async logout(@Body() body: LogoutDto): Promise<void> {
    await this.logoutUseCase.execute(body);
  }

  @Post('verify-email')
  @Public()
  @HttpCode(200)
  verifyEmail(@Body() body: VerifyEmailDto): Promise<MessageDto> {
    return this.verifyEmailUseCase.execute(body);
  }

  @Post('forgot-password')
  @Public()
  @HttpCode(200)
  forgotPassword(@Body() body: ForgotPasswordDto): Promise<MessageDto> {
    return this.forgotPasswordUseCase.execute(body);
  }

  @Post('reset-password')
  @Public()
  @HttpCode(200)
  resetPassword(@Body() body: ResetPasswordDto): Promise<MessageDto> {
    return this.resetPasswordUseCase.execute(body);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @HttpCode(200)
  me(@Req() request: Request & { user: AuthenticatedRequestUser }): Promise<UserProfileDto> {
    return this.getMeUseCase.execute(request.user.userId);
  }
}
