import { Body, Controller, Param, Post, Req } from '@nestjs/common';
import { Roles } from '../../../../common/decorators/roles.decorator';
import type { AuthContext } from '../../../../common/types/auth-context.type';
import { AdminAcceptService } from '../application/admin-acception.service';
import { MarkInvoicePaidDto } from './dto/admin-actions.dto';

interface RequestWithAuth {
  ip: string;
  authContext?: AuthContext;
}

@Controller('api/admin/saas-invoices')
@Roles('ACCEPTION_ADMIN')
export class AdminInvoiceController {
  constructor(private readonly service: AdminAcceptService) {}

  @Post(':id/mark-paid')
  markPaid(
    @Param('id') id: string,
    @Body() body: MarkInvoicePaidDto,
    @Req() request: RequestWithAuth,
  ) {
    return this.service.markInvoicePaid(
      id,
      body,
      request.authContext!.sub,
      request.ip ?? 'unknown',
    );
  }
}
