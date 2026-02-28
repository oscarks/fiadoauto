import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import {
  EMAIL_PORT,
  EMAIL_VERIFICATION_TOKEN_REPOSITORY,
  HASHING_PORT,
  REFRESH_TOKEN_REPOSITORY,
  USER_REPOSITORY,
} from './domain/auth.ports';
import { LoginRateLimiter } from './application/login-rate-limiter.service';
import { TokenService } from './application/token.service';
import { LoginUseCase } from './application/login.use-case';
import { RefreshTokenUseCase } from './application/refresh-token.use-case';
import { LogoutUseCase } from './application/logout.use-case';
import { VerifyEmailUseCase } from './application/verify-email.use-case';
import { ForgotPasswordUseCase } from './application/forgot-password.use-case';
import { ResetPasswordUseCase } from './application/reset-password.use-case';
import { GetMeUseCase } from './application/get-me.use-case';
import { ListUsersUseCase } from './application/list-users.use-case';
import { GetUserUseCase } from './application/get-user.use-case';
import { CreateUserUseCase } from './application/create-user.use-case';
import { UpdateUserUseCase } from './application/update-user.use-case';
import { BlockUserUseCase } from './application/block-user.use-case';
import { UnblockUserUseCase } from './application/unblock-user.use-case';
import { DeactivateUserUseCase } from './application/deactivate-user.use-case';
import { BcryptHashingAdapter } from './infrastructure/bcrypt-hashing.adapter';
import { PrismaUserRepository } from './infrastructure/prisma-user.repository';
import { PrismaRefreshTokenRepository } from './infrastructure/prisma-refresh-token.repository';
import { PrismaEmailVerificationTokenRepository } from './infrastructure/prisma-email-verification-token.repository';
import { JwtStrategy } from './infrastructure/jwt.strategy';
import { JwtAuthGuard } from './infrastructure/jwt-auth.guard';
import { AuthController } from './presentation/auth.controller';
import { UsersController } from './presentation/users.controller';
import { ConsoleEmailAdapter } from '../../shared/email/console-email.adapter';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [
    AuditModule,
    PassportModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
      }),
    }),
  ],
  controllers: [AuthController, UsersController],
  providers: [
    JwtStrategy,
    JwtAuthGuard,
    LoginRateLimiter,
    TokenService,
    LoginUseCase,
    RefreshTokenUseCase,
    LogoutUseCase,
    VerifyEmailUseCase,
    ForgotPasswordUseCase,
    ResetPasswordUseCase,
    GetMeUseCase,
    ListUsersUseCase,
    GetUserUseCase,
    CreateUserUseCase,
    UpdateUserUseCase,
    BlockUserUseCase,
    UnblockUserUseCase,
    DeactivateUserUseCase,
    {
      provide: USER_REPOSITORY,
      useClass: PrismaUserRepository,
    },
    {
      provide: REFRESH_TOKEN_REPOSITORY,
      useClass: PrismaRefreshTokenRepository,
    },
    {
      provide: EMAIL_VERIFICATION_TOKEN_REPOSITORY,
      useClass: PrismaEmailVerificationTokenRepository,
    },
    {
      provide: HASHING_PORT,
      useClass: BcryptHashingAdapter,
    },
    {
      provide: EMAIL_PORT,
      inject: [ConfigService, ConsoleEmailAdapter],
      useFactory: (configService: ConfigService, consoleEmailAdapter: ConsoleEmailAdapter) => {
        const provider = configService.get<string>('EMAIL_PROVIDER', 'console');

        if (provider === 'console') {
          return consoleEmailAdapter;
        }

        throw new Error(`EMAIL_PROVIDER não suportado: ${provider}`);
      },
    },
    ConsoleEmailAdapter,
  ],
  exports: [JwtAuthGuard],
})
export class AuthModule {}
