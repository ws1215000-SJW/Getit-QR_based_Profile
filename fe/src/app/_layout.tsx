
import { DarkTheme, DefaultTheme, ThemeProvider, Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useColorScheme } from 'react-native';

import { AnimatedSplashOverlay } from '@/components/animated-icon';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider
      value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}
    >
      <AnimatedSplashOverlay />

      <Stack>
        <Stack.Screen
          name="index"
          options={{
            title: 'Getit',
            headerShown: false,
          }}
        />

        <Stack.Screen
          name="profile_write/index"
          options={{
            title: '프로필 작성',
          }}
        />

        <Stack.Screen
          name="profile_main/index"
          options={{
            title: '내 프로필',
          }}
        />

        <Stack.Screen
          name="profile_list/index"
          options={{
            title: '저장된 프로필',
          }}
        />

        <Stack.Screen
          name="profile_detail/[id]"
          options={{
            title: '상대 프로필 상세',
          }}
        />

        <Stack.Screen
          name="qr_scanner/index"
          options={{
            title: 'QR 스캔',
          }}
        />
      </Stack>
    </ThemeProvider>
  );
}
