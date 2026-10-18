import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.husseinmishbak.orrfrench',
  appName: 'Orr French',
  webDir: 'www',
  bundledWebRuntime: false,
  backgroundColor: '#f5f7fc',
  ios: {
    contentInset: 'automatic',
    scrollEnabled: true
  },
  android: {
    allowMixedContent: false
  }
};

export default config;
