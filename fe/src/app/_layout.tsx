
import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
      }}
    >
      {/* 홈 화면 */}
      <Stack.Screen
        name="index"
        options={{
          title: 'Getit 홈',
          headerShown: false,
        }}
      />

      {/* 프로필 작성 */}
      <Stack.Screen
        name="profile_write/index"
        options={{
          title: '프로필 작성',
        }}
      />

      {/* 내 프로필 */}
      <Stack.Screen
        name="profile_main/index"
        options={{
          title: '내 프로필',
        }}
      />

      {/* 저장된 프로필 */}
      <Stack.Screen
        name="profile_list/index"
        options={{
          title: '저장 프로필',
        }}
      />

      {/* 상대 프로필 상세 */}
      <Stack.Screen
        name="profile_detail/[id]"
        options={{
          title: '상대 프로필 상세',
        }}
      />

      {/* QR 스캔 */}
      <Stack.Screen
        name="qr_scanner/index"
        options={{
          title: 'QR 스캔',
        }}
      />
    </Stack>
  );
}
