import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.mobtrack.app',
  appName: 'MobTracker',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};

export default config;
