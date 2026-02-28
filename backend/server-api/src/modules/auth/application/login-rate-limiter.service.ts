import { HttpException, HttpStatus, Injectable } from '@nestjs/common';

interface LoginAttemptRecord {
  count: number;
  firstAttemptAt: number;
  blockedUntil: number | null;
}

@Injectable()
export class LoginRateLimiter {
  private readonly attempts = new Map<string, LoginAttemptRecord>();
  private readonly maxAttempts = 5;
  private readonly windowMs = 15 * 60 * 1000;

  check(email: string, nowTs = Date.now()): void {
    const key = this.normalize(email);
    const record = this.attempts.get(key);

    if (!record) {
      return;
    }

    if (record.blockedUntil && nowTs < record.blockedUntil) {
      throw new HttpException(
        'Muitas tentativas. Tente novamente em alguns minutos.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    if (nowTs - record.firstAttemptAt >= this.windowMs) {
      this.attempts.delete(key);
    }
  }

  registerFailure(email: string, nowTs = Date.now()): void {
    const key = this.normalize(email);
    const current = this.attempts.get(key);

    if (!current || nowTs - current.firstAttemptAt >= this.windowMs) {
      this.attempts.set(key, {
        count: 1,
        firstAttemptAt: nowTs,
        blockedUntil: null,
      });
      return;
    }

    const nextCount = current.count + 1;
    this.attempts.set(key, {
      count: nextCount,
      firstAttemptAt: current.firstAttemptAt,
      blockedUntil: nextCount >= this.maxAttempts ? nowTs + this.windowMs : current.blockedUntil,
    });
  }

  registerSuccess(email: string): void {
    this.attempts.delete(this.normalize(email));
  }

  private normalize(email: string): string {
    return email.trim().toLowerCase();
  }
}
