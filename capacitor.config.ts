import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.saloon.crossplatform',
  appName: 'DREADLOCKS AND HAIR DRESSING SALOON',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#0b0f19',
      showSpinner: true,
      spinnerColor: '#a855f7'
    }
  }
};

export default config;
