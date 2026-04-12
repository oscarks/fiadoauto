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

    if (!userId) {
      return;
    }

    await this.authService.logout({ userId });
  }

  @Get('me')
  me(@Req() request: RequestWithAuth) {
    return this.authService.me(request.authContext!.sub);
  }
}
