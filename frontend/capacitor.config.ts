import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.sbe.stock.app',
  appName: 'SBE',
  webDir: 'dist',
  server: {
    url: 'https://sahilsync07.github.io/sbe/',
    cleartext: false
  }
};

export default config;
