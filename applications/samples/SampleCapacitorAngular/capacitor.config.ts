import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  ios: { handleApplicationNotifications: false },
  appId: 'co.acoustic.mobile.push.samples.android',
  appName: 'Sample',
  webDir: 'dist/sample-capacitor-angular/browser'
};

export default config;
