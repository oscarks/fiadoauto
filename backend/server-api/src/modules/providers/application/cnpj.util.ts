export function normalizeCnpj(value: string): string {
  return value.replace(/\D/g, '');
}

export function isValidCnpj(value: string): boolean {
  const cnpj = normalizeCnpj(value);
  if (cnpj.length !== 14) {
    return false;
  }
  if (/^(\d)\1+$/.test(cnpj)) {
    return false;
  }

  const calcCheckDigit = (base: string, factors: number[]): number => {
    const sum = base.split('').reduce((acc, digit, index) => {
      return acc + Number(digit) * factors[index];
    }, 0);
    const remainder = sum % 11;
    return remainder < 2 ? 0 : 11 - remainder;
  };

  const firstFactor = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const secondFactor = [6, ...firstFactor];

  const firstDigit = calcCheckDigit(cnpj.slice(0, 12), firstFactor);
  const secondDigit = calcCheckDigit(cnpj.slice(0, 12) + firstDigit, secondFactor);

  return cnpj.endsWith(`${firstDigit}${secondDigit}`);
}
