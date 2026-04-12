export interface AuthUser {
  id: string
  name: string
  email: string
  providerId: string
  conveniadoId?: string | null
  actorType: string
  roles: string[]
}

export interface LoginInput {
  email: string
  password: string
}

export interface LoginResponse {
  accessToken: string
  refreshToken: string
  user: AuthUser
}
