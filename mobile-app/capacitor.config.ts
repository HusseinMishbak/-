import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.husseinmishbak.orrfrench',
  appName: 'Orr French',
  webDir: 'www',
  bundledWebRuntime: false,
  backgroundColor: '#25295b',
  ios: {
    contentInset: 'automatic',
    scrollEnabled: true,
    preferredContentMode: 'mobile'
  },
  android: {
    allowMixedContent: false
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1100,
      launchAutoHide: true,
      backgroundColor: '#25295b',
      showSpinner: false,
      androidScaleType: 'CENTER_CROP',
      splashImmersive: false
    },
    StatusBar: {
      style: 'LIGHT',
      backgroundColor: '#25295b',
      overlaysWebView: false
    },
    Keyboard: {
      resize: 'native',
      resizeOnFullScreen: true
    }
  }
};

export default config;
