import { envValidationSchema } from './env.validation';

describe('envValidationSchema', () => {
  it('should validate required environment variables', () => {
    const { error, value } = envValidationSchema.validate({
      DATABASE_URL: 'postgresql://postgres:postgres@localhost:5432/fiadoauto?schema=public',
      JWT_SECRET: 'super-secret-key-with-at-least-32-chars',
      SEED_ADMIN_PASSWORD: 'Admin@123',
    });

    expect(error).toBeUndefined();
    expect(value.JWT_ACCESS_EXPIRATION).toBe(900);
    expect(value.JWT_REFRESH_EXPIRATION).toBe(604800);
    expect(value.SEED_ADMIN_EMAIL).toBe('admin@acception.com');
  });

  it('should fail when JWT_SECRET is missing', () => {
    const { error } = envValidationSchema.validate({
      DATABASE_URL: 'postgresql://postgres:postgres@localhost:5432/fiadoauto?schema=public',
      SEED_ADMIN_PASSWORD: 'Admin@123',
    });

    expect(error).toBeDefined();
  });
});
