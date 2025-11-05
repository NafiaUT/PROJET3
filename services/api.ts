
import { User, AnalyticsSummary } from '../types';

// This is a mock service. In a real application, it would make HTTP requests.

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
  login: (username: string, password: string): Promise<User> => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const userCredentials = users[username];
        if (userCredentials && userCredentials.password === password) {
          const token = createFakeJwt(username, userCredentials.scopes);
          resolve({ username, token, scopes: userCredentials.scopes });
        } else {
          reject(new Error('Invalid username or password'));
        }
      }, 500);
    });
  },

  getAnalyticsSummary: (): Promise<AnalyticsSummary> => {
    return new Promise((resolve) => {
      setTimeout(() => {
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
                day: day,
                totalPower: 1200 + Math.random() * 500
            };
        });
        
        const motionHistory = Array.from({ length: 24 }, (_, i) => {
          const hour = (now.getHours() - (23 - i) + 24) % 24;
          let detections = 0;
          // More detections during waking hours
          if (hour > 7 && hour < 22) {
             detections = Math.floor(Math.random() * 15);
          } else {
             detections = Math.floor(Math.random() * 3);
          }
          return {
            hour: `${hour.toString().padStart(2, '0')}:00`,
            detections,
          };
        });

        resolve({
          temperatureHistory,
          powerHistory,
          motionHistory
        });
      }, 800);
    });
  },
};
