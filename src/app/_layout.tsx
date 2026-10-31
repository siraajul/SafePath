import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Observe, ObserveRoot } from 'expo-observe';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useTranslation } from 'react-i18next';
import { useColorScheme } from 'react-native';

import { AnimatedSplashOverlay } from '@/components/splash-overlay';
import { PreferencesProvider, usePreferences } from '@/hooks/use-preferences';
import { useTheme } from '@/hooks/use-theme';

Observe.configure({ integrations: { 'expo-router': true } });

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function RootStack() {
  const { ready, onboarded } = usePreferences();
  const { t } = useTranslation();
  const theme = useTheme();

  // Keep the native splash up until saved preferences are read.
  if (!ready) return null;

  const header = (title: string) => ({
    headerShown: true,
    title,
    headerBackButtonDisplayMode: 'minimal' as const,
    headerStyle: { backgroundColor: theme.background },
    headerTintColor: theme.brand,
    headerTitleStyle: { color: theme.text },
    headerShadowVisible: false,
  });

  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Protected guard={onboarded}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="search" options={{ ...header(t('search.title')), presentation: 'modal' }} />
          <Stack.Screen name="routes" options={header(t('routes.title'))} />
          <Stack.Screen name="route-detail" options={header(t('detail.title'))} />
          <Stack.Screen name="navigation" options={{ headerShown: false, gestureEnabled: false }} />
          <Stack.Screen name="share" options={{ ...header(t('share.title')), presentation: 'modal' }} />
          <Stack.Screen name="contacts" options={header(t('contacts.title'))} />
          <Stack.Screen name="reports" options={header(t('reports.title'))} />
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
      <QueryClientProvider client={queryClient}>
        <PreferencesProvider>
          <RootStack />
        </PreferencesProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default ObserveRoot.wrap(RootLayout);
