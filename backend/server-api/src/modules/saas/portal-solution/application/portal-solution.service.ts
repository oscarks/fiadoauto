import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
} from '@nestjs/common';
import { AuthService } from '../../../core/auth/application/auth.service';
import { PasswordService } from '../../../core/auth/application/password.service';
import { AuditService } from '../../../core/audit/application/audit.service';
import { PortalSolutionRepository } from '../infrastructure/portal-solution.repository';

interface RegisterProviderInput {
  legalName: string;
  tradeName: string;
  cnpj: string;
  email: string;
  phone?: string;
  address?: {
    street: string;
    number: string;
    complement?: string;
    city: string;
    state: string;
    zipCode: string;
    country?: string;
  };
  admin: {
    name: string;
    email: string;
    password: string;
  };
  acceptTerms: boolean;
  ipAddress: string;
}

@Injectable()
export class PortalSolutionService {
  private readonly logger = new Logger(PortalSolutionService.name);

  constructor(
    private readonly repository: PortalSolutionRepository,
    private readonly passwordService: PasswordService,
    private readonly authService: AuthService,
    private readonly auditService: AuditService,
  ) {}

  async registerProvider(input: RegisterProviderInput) {
    if (!input.acceptTerms) {
      throw new BadRequestException('Aceite dos termos é obrigatório');
    }

    if (!this.validateCnpj(input.cnpj)) {
      throw new BadRequestException('CNPJ inválido');
    }

    const existingProvider = await this.repository.findProviderByCnpj(input.cnpj);
    if (existingProvider) {
      throw new ConflictException('CNPJ já cadastrado');
    }

    const existingUser = await this.repository.findUserByEmail(input.admin.email);
    if (existingUser) {
      throw new ConflictException('Email já cadastrado');
    }

    const role = await this.repository.findRoleByName('PROVIDER_ADMIN');
    if (!role) {
      throw new BadRequestException('Role PROVIDER_ADMIN não encontrada');
    }

    const passwordHash = this.passwordService.hash(input.admin.password);
    const { token, expiresAt } = this.authService.generateActivationToken();

    const { provider, user } = await this.repository.createProviderWithAdmin({
      provider: {
        legalName: input.legalName,
        tradeName: input.tradeName,
        cnpj: input.cnpj,
        email: input.email,
        phone: input.phone,
        addressJson: input.address
          ? { ...input.address, country: input.address.country ?? 'BR' }
          : undefined,
      },
      admin: {
        name: input.admin.name,
        email: input.admin.email,
        passwordHash,
        activationToken: token,
        tokenExpiresAt: expiresAt,
      },
      roleId: role.id,
    });

    // TODO: Send confirmation email (Sprint 9 - Notifications module)
    this.logger.log(`Activation token for ${user.email}: ${token}`);

    await this.auditService.log({
      providerId: provider.id,
      actorUserId: user.id,
      actorType: 'PROVIDER_USER',
      action: 'PROVIDER_REGISTERED',
      entityType: 'Provider',
      entityId: provider.id,
      details: { cnpj: input.cnpj, email: input.email },
      ipAddress: input.ipAddress,
    });

    return {
      provider: {
        id: provider.id,
        legalName: provider.legalName,
        tradeName: provider.tradeName,
        cnpj: provider.cnpj,
        email: provider.email,
        status: provider.status,
        createdAt: provider.createdAt,
      },
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        status: user.status,
        actorType: user.actorType,
        roles: ['PROVIDER_ADMIN'],
      },
      message: 'Email de confirmação enviado',
    };
  }

  async listPlans() {
    const plans = await this.repository.findActiveSaasPlans();

    return {
      plans: plans.map((plan) => ({
        id: plan.id,
        name: plan.name,
        code: plan.code,
        baseMonthlyPrice: plan.baseMonthlyPrice,
        features: {
          maxConvenios: plan.maxConvenios,
          maxVehicles: plan.maxVehicles,
          maxTransactionsMonth: plan.maxTransactionsMonth,
          extraTxPrice: plan.extraTxPrice,
          whitelabelType: plan.whitelabelType,
          trialDays: plan.trialDays,
          suspensionMode: plan.suspensionMode,
          gracePeriodDays: plan.gracePeriodDays,
        },
        isActive: plan.isActive,
      })),
    };
  }

  private validateCnpj(cnpj: string): boolean {
    const digits = cnpj.replace(/\D/g, '');
    if (digits.length !== 14) return false;
    if (/^(\d)\1+$/.test(digits)) return false;

    const calcDigit = (slice: string, weights: number[]): number => {
      let sum = 0;
      for (let i = 0; i < slice.length; i++) {
        sum += Number(slice[i]) * weights[i];
      }
      const remainder = sum % 11;
      return remainder < 2 ? 0 : 11 - remainder;
    };

    const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];

    const d1 = calcDigit(digits.slice(0, 12), weights1);
    const d2 = calcDigit(digits.slice(0, 13), weights2);

    return Number(digits[12]) === d1 && Number(digits[13]) === d2;
  }
}
