import type { ConfigContext, ExpoConfig } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'Luniva',
  slug: 'luniva',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/images/icon.png',
  scheme: 'luniva',
  userInterfaceStyle: 'automatic',
  newArchEnabled: true,
  ios: {
    ...config.ios,
    supportsTablet: true,
    bundleIdentifier: 'com.shivamchaudhary.luniva',
  },
  android: {
    ...config.android,
    package: 'com.shivamchaudhary.luniva',
    adaptiveIcon: {
      backgroundColor: '#FFF8FA',
      foregroundImage: './assets/images/android-icon-foreground.png',
      backgroundImage: './assets/images/android-icon-background.png',
      monochromeImage: './assets/images/android-icon-monochrome.png',
    },
    edgeToEdgeEnabled: true,
    predictiveBackGestureEnabled: false,
  },
  web: {
    ...config.web,
    bundler: 'metro',
    output: 'static',
    favicon: './assets/images/favicon.png',
  },
  plugins: [
    'expo-router',
    [
      'expo-splash-screen',
      {
        image: './assets/branding/luniva-logo.png',
        imageWidth: 260,
        resizeMode: 'contain',
        backgroundColor: '#FFFFFF',
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
  },
});
