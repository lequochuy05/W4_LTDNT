import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.vku.survey',
  appName: 'VKU Field Survey',
  webDir: 'dist',
  plugins: {
    GoogleAuth: {
      scopes: ['profile', 'email'],
      serverClientId: 'mock-google-client-id.apps.googleusercontent.com',
      forceCodeForRefreshToken: true,
    }
  }
};

export default config;
