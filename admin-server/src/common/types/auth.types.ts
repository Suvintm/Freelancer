export interface JwtPayload {
  sub: string;
  email: string;
  sessionId: string;
  jti: string;
  mfaVerified: boolean;
  role: string;
  iat?: number;
  exp?: number;
}

export interface AuthPayload {
  id: string;
  email: string;
  role: string;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export interface LoginResponse extends Partial<TokenPair> {
  requiresMfa: boolean;
  mfaToken?: string;
  admin?: any;
}
