
import { View, Button } from "react-native";
import { router } from "expo-router";

export default function HomeScreen() {
  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        padding: 24,
        gap: 12,
      }}
    >
      <Button
        title="프로필 작성"
        onPress={() => router.push("/profile_write")}
      />

      <Button
        title="내 프로필"
        onPress={() => router.push("/profile_main")}
      />

      <Button
        title="저장 프로필"
        onPress={() => router.push("/profile_list")}
      />

      <Button
        title="QR 스캔"
        onPress={() => router.push("/qr_scanner")}
      />
    </View>
  );
}
