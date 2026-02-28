import { HttpException, HttpStatus } from '@nestjs/common';
import { LoginRateLimiter } from './login-rate-limiter.service';

describe('LoginRateLimiter', () => {
  let limiter: LoginRateLimiter;

  beforeEach(() => {
    limiter = new LoginRateLimiter();
  });

  it('should allow attempts below the limit', () => {
    const now = 1_000;
    limiter.registerFailure('user@example.com', now);
    limiter.registerFailure('user@example.com', now + 1_000);
    limiter.registerFailure('user@example.com', now + 2_000);

    expect(() => limiter.check('user@example.com', now + 3_000)).not.toThrow();
  });

  it('should block after 5 failures in window', () => {
    const now = 1_000;
    for (let i = 0; i < 5; i += 1) {
      limiter.registerFailure('user@example.com', now + i * 1_000);
    }

    try {
      limiter.check('user@example.com', now + 5_000);
      fail('Expected rate limiter to throw');
    } catch (error) {
      expect(error).toBeInstanceOf(HttpException);
      expect((error as HttpException).getStatus()).toBe(HttpStatus.TOO_MANY_REQUESTS);
    }
  });

  it('should reset after window expires', () => {
    const now = 1_000;
    for (let i = 0; i < 5; i += 1) {
      limiter.registerFailure('user@example.com', now + i * 1_000);
    }

    expect(() => limiter.check('user@example.com', now + 16 * 60 * 1000)).not.toThrow();
  });
});
