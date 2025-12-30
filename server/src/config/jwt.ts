import jwt from 'jsonwebtoken';

interface TokenPayload {
  id: string;
}

export const generateAccessToken = (userId: string): string => {
  const secret = process.env.JWT_SECRET || 'default-secret-change-in-production';
  const expiresIn = process.env.JWT_ACCESS_TOKEN_EXPIRE || '15m';

  return jwt.sign({ id: userId }, secret, { expiresIn } as any);
};

export const generateRefreshToken = (userId: string): string => {
  const secret = process.env.REFRESH_TOKEN_SECRET || 'default-refresh-secret-change-in-production';
  const expiresIn = process.env.JWT_REFRESH_TOKEN_EXPIRE || '7d';

  return jwt.sign({ id: userId }, secret, { expiresIn } as any);
};

export const verifyAccessToken = (token: string): TokenPayload | null => {
  try {
    const secret = process.env.JWT_SECRET || 'default-secret-change-in-production';
    const result = jwt.verify(token, secret) as TokenPayload;
    console.log('[JWT] Token verified successfully for user:', result.id);
    return result;
  } catch (error: any) {
    console.error('[JWT] Token verification failed:', error.message);
    return null;
  }
};

export const verifyRefreshToken = (token: string): TokenPayload | null => {
  try {
    const secret = process.env.REFRESH_TOKEN_SECRET || 'default-refresh-secret-change-in-production';
    return jwt.verify(token, secret) as TokenPayload;
  } catch (error) {
    return null;
  }
};

// Backward compatibility - keeping old function name
export const generateToken = generateAccessToken;
export const verifyToken = verifyAccessToken;
