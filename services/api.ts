
import { User, AnalyticsSummary } from '../types';

/**
 * Lightweight virtual gateway facade that simulates the real WoT backend.
 * Each function wraps its work in a Promise to mimic asynchronous network IO
 * and always produces explicit, user-facing errors so the UI can react properly.
 */
export class GatewayError extends Error {
  code: string;

  constructor(code: string, message: string) {
    super(message);
    this.code = code;
    this.name = 'GatewayError';
  }
}

const createFakeJwt = (username: string, scopes: string[]): string => {
  const header = { alg: 'HS256', typ: 'JWT' };
  const payload = { sub: username, scopes, iat: Math.floor(Date.now() / 1000) };
  // Just base64 encode for simulation, no real signature
  return `${btoa(JSON.stringify(header))}.${btoa(JSON.stringify(payload))}.fakesignature`;
};

const users: Record<string, { password: string; scopes: string[] }> = {
  admin: { password: 'password', scopes: ['admin', 'read:things', 'write:things'] },
  visitor: { password: 'password', scopes: ['read:things'] },
};

export const apiService = {
  /**
   * Validates the provided credentials and returns a fake JWT, emulating a gateway login.
   * Explicit errors are returned so the caller can give actionable feedback to the user.
   */
  login: (username: string, password: string): Promise<User> => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        try {
          if (!username?.trim() || !password?.trim()) {
            throw new GatewayError(
              'AUTH_VALIDATION_ERROR',
              'Username and password are required to start a session.'
            );
          }

          const userCredentials = users[username.trim()];

          if (userCredentials && userCredentials.password === password) {
            const token = createFakeJwt(username.trim(), userCredentials.scopes);
            resolve({ username: username.trim(), token, scopes: userCredentials.scopes });
            return;
          }

          throw new GatewayError(
            'AUTH_INVALID_CREDENTIALS',
            'The provided credentials are invalid. Try admin/password or visitor/password.'
          );
        } catch (error) {
          reject(error instanceof Error ? error : new GatewayError('AUTH_UNKNOWN_ERROR', 'Unexpected login failure.'));
        }
      }, 500);
    });
  },

  /**
   * Returns synthetic analytics data with a stable structure so that the dashboard
   * can render charts even when the physical gateways are offline.
   */
  getAnalyticsSummary: (): Promise<AnalyticsSummary> => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        try {
          const now = new Date();
          const temperatureHistory = Array.from({ length: 24 }, (_, i) => {
            const hour = (now.getHours() - (23 - i) + 24) % 24;
            return {
              hour: `${hour.toString().padStart(2, '0')}:00`,
              avgTemp: 19.5 + Math.sin(i / 6) * 2 + Math.random(),
            };
          });
          
          const powerHistory = Array.from({ length: 7 }, (_, i) => {
            const date = new Date();
            date.setDate(now.getDate() - (6 - i));
            const day = date.toLocaleDateString('en-US', { weekday: 'short' });
            return {
              day,
              totalPower: 1200 + Math.random() * 500,
            };
          });
          
          const motionHistory = Array.from({ length: 24 }, (_, i) => {
            const hour = (now.getHours() - (23 - i) + 24) % 24;
            const isActivePeriod = hour > 7 && hour < 22;
            const detections = Math.floor(Math.random() * (isActivePeriod ? 15 : 3));
            return {
              hour: `${hour.toString().padStart(2, '0')}:00`,
              detections,
            };
          });

          resolve({
            temperatureHistory,
            powerHistory,
            motionHistory,
          });
        } catch (error) {
          reject(
            error instanceof Error
              ? error
              : new GatewayError('ANALYTICS_GENERATION_ERROR', 'Analytics summary could not be generated.')
          );
        }
      }, 800);
    });
  },
};
