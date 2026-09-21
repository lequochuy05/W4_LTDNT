import { simulateNetwork, ApiError } from './apiClient';
import { mockUser } from './mockData';

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar: string;
}

export interface LoginCredentials {
  email: string;
  password?: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export const authApi = {
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    if (credentials.email === 'test@vku.udn.vn' && credentials.password === 'password') {
      return simulateNetwork({
        token: 'mock_jwt_token_12345',
        user: {
          id: 'u1',
          email: 'test@vku.udn.vn',
          name: 'VKU Inspector',
          role: 'INSPECTOR',
          avatar: 'https://i.pravatar.cc/150?u=1'
        }
      });
    }
    
    // Simulate error
    return simulateNetwork(null as any, 1).then(() => {
      throw new ApiError(401, 'Invalid email or password');
    });
  },

  loginWithGoogle: async (idToken: string): Promise<AuthResponse> => {
    return simulateNetwork({
      token: 'mock_jwt_token_google_' + idToken.substring(0, 5),
      user: {
        id: 'u2',
        email: 'google.user@vku.udn.vn',
        name: 'Google User',
        role: 'INSPECTOR',
        avatar: 'https://i.pravatar.cc/150?u=2'
      }
    });
  },
  
  getCurrentUser: async (token: string): Promise<User> => {
    if (token === 'mock-jwt-token-12345') {
      return simulateNetwork(mockUser);
    }
    throw new ApiError(401, 'Unauthorized');
  }
};
