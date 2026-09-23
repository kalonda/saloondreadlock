import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.saloon.crossplatform',
  appName: 'Saloon MS Luxe',
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
