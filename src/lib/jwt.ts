import jwt from 'jsonwebtoken';

/**
 * Generate JWT token for Rista API authentication
 * Algorithm: HS256
 * Payload: { iss: API_KEY, iat: current_timestamp }
 */
export function generateRistaJWT(): string {
  const apiKey = process.env.RISTA_API_KEY;
  const secretKey = process.env.RISTA_SECRET_KEY;

  if (!apiKey || !secretKey) {
    throw new Error('RISTA_API_KEY and RISTA_SECRET_KEY must be set in environment variables');
  }

  const payload = {
    iss: apiKey,
    iat: Math.floor(Date.now() / 1000), // Current timestamp in seconds
  };

  const token = jwt.sign(payload, secretKey, { algorithm: 'HS256' });
  return token;
}
