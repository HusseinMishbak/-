import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.husseinmishbak.orrfrench',
  appName: 'Orr French',
  webDir: 'www',
  bundledWebRuntime: false,
  server: {
    // The first version opens the existing hosted learning platform.
    // Keep HTTPS enabled; remove this URL when bundling the full web app locally.
    url: 'https://husseinmishbak.github.io/-/',
    cleartext: false,
    allowNavigation: ['husseinmishbak.github.io', '*.supabase.co']
  }
};

export default config;
