import { isValidCnpj, normalizeCnpj } from './cnpj.util';

describe('cnpj util', () => {
  it('should normalize cnpj', () => {
    expect(normalizeCnpj('12.345.678/0001-95')).toBe('12345678000195');
  });

  it('should validate correct cnpj', () => {
    expect(isValidCnpj('12345678000195')).toBe(true);
  });

  it('should invalidate incorrect cnpj', () => {
    expect(isValidCnpj('11111111111111')).toBe(false);
    expect(isValidCnpj('123')).toBe(false);
  });
});
