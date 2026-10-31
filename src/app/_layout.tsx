import { Observe, ObserveRoot } from 'expo-observe';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useColorScheme } from 'react-native';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { PreferencesProvider, usePreferences } from '@/hooks/use-preferences';

Observe.configure({ integrations: { 'expo-router': true } });

SplashScreen.preventAutoHideAsync();

function RootStack() {
  const { ready, onboarded } = usePreferences();

  // Keep the native splash up until saved preferences are read.
  if (!ready) return null;

  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Protected guard={onboarded}>
          <Stack.Screen name="(tabs)" />
        </Stack.Protected>
        <Stack.Protected guard={!onboarded}>
          <Stack.Screen name="onboarding" />
        </Stack.Protected>
      </Stack>
      <AnimatedSplashOverlay />
    </>
  );
}

function RootLayout() {
  const colorScheme = useColorScheme();
  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <PreferencesProvider>
        <RootStack />
      </PreferencesProvider>
    </ThemeProvider>
  );
}

export default ObserveRoot.wrap(RootLayout);
