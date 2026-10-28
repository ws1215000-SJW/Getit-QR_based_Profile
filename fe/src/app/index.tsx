
import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { getMyProfile } from '../lib/profileStorage';

export default function HomeScreen() {
  useEffect(() => {
    let active = true;

    async function checkProfile() {
      try {
        const profile = await getMyProfile();

        if (!active) return;

        if (profile) {
          router.replace('/profile_main');
        } else {
          router.replace('/profile_write');
        }
      } catch (error) {
        console.error('프로필 확인 실패:', error);
      }
    }

    checkProfile();

    return () => {
      active = false;
    };
  }, []);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#7357F6" />
      <Text style={styles.text}>프로필 확인 중...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  text: {
    marginTop: 16,
    fontSize: 15,
    color: '#77718C',
  },
});
