import { Api } from '../generated/rista/ristaApi';
import { generateRistaJWT } from './jwt';

/**
 * Create authenticated Rista API client
 * Injects required headers: x-api-key and x-api-token (JWT)
 */
export function createRistaClient() {
  const apiKey = process.env.RISTA_API_KEY;
  const baseURL = process.env.RISTA_BASE_URL || 'https://api.ristaapps.com/v1';

  if (!apiKey) {
    throw new Error('RISTA_API_KEY must be set in environment variables');
  }

  const token = generateRistaJWT();

  const client = new Api({
    baseUrl: baseURL,
    baseApiParams: {
      headers: {
        'x-api-key': apiKey,
        'x-api-token': token,
      },
    },
  });

  return client;
}
