export interface AuthContext {
  sub: string;
  providerId: string;
  conveniadoId?: string | null;
  actorType: string;
  roles: string[];
  exp: number;
  iat: number;
}
