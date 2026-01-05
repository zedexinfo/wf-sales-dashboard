import jwt from 'jsonwebtoken';

// Token cache with 5 minute (300 second) expiration
interface TokenCache {
  token: string;
  createdAt: number; // Unix timestamp in seconds
}

let tokenCache: TokenCache | null = null;
const TOKEN_EXPIRY_SECONDS = 300; // 5 minutes

/**
 * Generate JWT token for Rista API authentication
 * Algorithm: HS256
 * Payload: { iss: API_KEY, iat: current_timestamp }
 * 
 * Tokens are cached for 5 minutes (300 seconds) to avoid unnecessary regeneration
 */
export function generateRistaJWT(): string {
  const apiKey = process.env.RISTA_API_KEY;
  const secretKey = process.env.RISTA_SECRET_KEY;

  if (!apiKey || !secretKey) {
    throw new Error('RISTA_API_KEY and RISTA_SECRET_KEY must be set in environment variables');
  }

  const currentTimestamp = Math.floor(Date.now() / 1000);

  // Check if cached token exists and is still valid
  if (tokenCache && currentTimestamp < tokenCache.createdAt + TOKEN_EXPIRY_SECONDS) {
    return tokenCache.token;
  }

  // Generate new token
  const payload = {
    iss: apiKey,
    iat: currentTimestamp,
  };

  const token = jwt.sign(payload, secretKey, { algorithm: 'HS256' });
  
  // Cache the new token
  tokenCache = {
    token,
    createdAt: currentTimestamp,
  };

  return token;
}
