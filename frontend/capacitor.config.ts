import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.sbe.stock.app',
  appName: 'SBE',
  webDir: 'dist',
  server: {
    url: 'http://192.168.29.186:5173',
    cleartext: true
  }
};

export default config;
