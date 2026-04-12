import { Injectable } from '@nestjs/common';
import { pbkdf2Sync, randomBytes, timingSafeEqual } from 'crypto';

@Injectable()
export class PasswordService {
  hash(plainText: string): string {
    const iterations = 120000;
    const salt = randomBytes(16).toString('hex');
    const hash = pbkdf2Sync(plainText, salt, iterations, 64, 'sha512').toString('hex');

    return `pbkdf2$${iterations}$${salt}$${hash}`;
  }

  verify(plainText: string, passwordHash: string): boolean {
    if (!passwordHash.startsWith('pbkdf2$')) {
      return false;
    }

    const [scheme, iterationStr, salt, expectedHash] = passwordHash.split('$');

    if (scheme !== 'pbkdf2' || !iterationStr || !salt || !expectedHash) {
      return false;
    }

    const iterations = Number(iterationStr);
    const actualHash = pbkdf2Sync(plainText, salt, iterations, 64, 'sha512').toString('hex');

    return timingSafeEqual(Buffer.from(actualHash), Buffer.from(expectedHash));
  }
}
