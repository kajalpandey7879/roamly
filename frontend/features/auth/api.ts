import { apiRequest } from '@/shared/api/http-client';

export interface MockUser {
  id: number;
  name: string;
  avatar: string;
  role: 'guest' | 'host';
  joined_year: number;
  is_superhost: number;
  email?: string | null;
  email_verified?: number;
  auth_provider?: string;
}

export interface EmailChallenge {
  challenge_id: string;
  expires_in: number;
  delivery_hint: string;
}

export interface AuthResult {
  user: MockUser;
  access_token: string;
  token_type: 'bearer';
  expires_in: number;
}

export const authApi = {
  getMockUser: () => apiRequest<MockUser>('/auth/mock-user?user_id=1'),
  requestEmailCode: (email: string) =>
    apiRequest<EmailChallenge>('/auth/email/request-code', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),
  verifyEmailCode: (email: string, challengeId: string, code: string) =>
    apiRequest<AuthResult>('/auth/email/verify', {
      method: 'POST',
      body: JSON.stringify({ email, challenge_id: challengeId, code }),
    }),
  me: (token: string) =>
    apiRequest<MockUser>('/auth/me', { headers: { Authorization: `Bearer ${token}` } }),
  logout: (token: string) =>
    apiRequest<void>('/auth/logout', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    }),
};
