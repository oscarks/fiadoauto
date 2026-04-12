import { Injectable } from '@nestjs/common';

@Injectable()
export class RbacService {
  hasAnyRole(userRoles: string[], requiredRoles: string[]): boolean {
    if (requiredRoles.length === 0) {
      return true;
    }

    return requiredRoles.some((role) => userRoles.includes(role));
  }
}
