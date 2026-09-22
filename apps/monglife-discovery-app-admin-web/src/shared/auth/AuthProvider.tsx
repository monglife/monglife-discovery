import { createContext, useCallback, useMemo, useState, type ReactNode } from 'react';
import { api } from '@/shared/api/client';
import { tokenStorage } from './tokenStorage';

export interface EmailCodeResponse {
  /** 코드 유효 시간(초) */
  expiresIn: number;
  /** 재발송 가능까지(초) */
  resendAfter: number;
  /** true 면 코드가 발송되지 않았고 아무 코드로 verify 하면 된다 (서버 local/dev) */
  skipVerify?: boolean;
}

interface VerifyResponse {
  accountId: number;
  accessToken: string;
  refreshToken: string;
}

export interface AuthContextValue {
  isAuthenticated: boolean;
  /** 1단계: 관리자 이메일로 인증 코드 발송 */
  requestEmailCode: (email: string) => Promise<EmailCodeResponse>;
  /** 2단계: 코드 검증 → 토큰 저장 */
  verifyEmailCode: (email: string, code: string) => Promise<void>;
  logout: () => Promise<void>;
}

// eslint-disable-next-line react-refresh/only-export-components
export const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setAuthenticated] = useState(() => !!tokenStorage.getAccessToken());

  const requestEmailCode = useCallback(
    (email: string) => api.post<EmailCodeResponse>('/public/admin/auth/email/code', { email }),
    [],
  );

  const verifyEmailCode = useCallback(async (email: string, code: string) => {
    const res = await api.post<VerifyResponse>('/public/admin/auth/email/verify', { email, code });
    tokenStorage.set(res.accessToken, res.refreshToken);
    setAuthenticated(true);
  }, []);

  const logout = useCallback(async () => {
    const refreshToken = tokenStorage.getRefreshToken();
    try {
      if (refreshToken) await api.post('/public/auth/logout', { refreshToken });
    } finally {
      tokenStorage.clear();
      setAuthenticated(false);
    }
  }, []);

  const value = useMemo(
    () => ({ isAuthenticated, requestEmailCode, verifyEmailCode, logout }),
    [isAuthenticated, requestEmailCode, verifyEmailCode, logout],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
