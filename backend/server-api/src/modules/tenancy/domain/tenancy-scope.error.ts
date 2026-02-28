export class TenancyScopeError extends Error {
  constructor(message = 'providerId é obrigatório para operações tenant-scoped.') {
    super(message);
    this.name = 'TenancyScopeError';
  }
}
