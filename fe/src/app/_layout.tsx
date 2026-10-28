
import { Stack } from "expo-router";
import { KeyboardProvider } from "react-native-keyboard-controller";

export default function RootLayout() {
  return (
    <KeyboardProvider>
      <Stack
        screenOptions={{
          headerShown: false,
          animation: "slide_from_right",
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="profile_write/index" />
        <Stack.Screen name="profile_main/index" />
        <Stack.Screen name="profile_list/index" />
        <Stack.Screen name="profile_detail/[id]" />
        <Stack.Screen name="qr_scanner/index" />
      </Stack>
    </KeyboardProvider>
  );
}
