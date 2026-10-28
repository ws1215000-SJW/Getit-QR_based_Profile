
import { useCallback, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  Alert,
  StyleSheet,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import {
  getMyProfile,
  deleteMyProfile,
  MyProfile,
} from '../../lib/profileStorage';

export default function ProfileMainScreen() {
  const [profile, setProfile] = useState<MyProfile | null>(null);

  useFocusEffect(
    useCallback(() => {
      let active = true;

      async function loadProfile() {
        try {
          const data = await getMyProfile();

          if (!active) return;

          if (!data) {
            router.replace('/profile_write');
            return;
          }

          setProfile(data);
        } catch (error) {
          console.error('프로필 조회 실패:', error);
          Alert.alert('오류', '프로필을 불러오지 못했습니다.');
        }
      }

      loadProfile();

      return () => {
        active = false;
      };
    }, [])
  );

  // 개발 중 최초 작성 흐름 재테스트용
  const resetProfile = async () => {
    try {
      await deleteMyProfile();
      setProfile(null);
      router.replace('/profile_write');
    } catch (error) {
      console.error('프로필 삭제 실패:', error);
      Alert.alert('오류', '테스트 데이터를 삭제하지 못했습니다.');
    }
  };

  if (!profile) {
    return (
      <View style={styles.container}>
        <Text>프로필 불러오는 중...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>나의 프로필</Text>

      <Text style={styles.info}>이름: {profile.name}</Text>
      <Text style={styles.info}>나이: {profile.age}</Text>
      <Text style={styles.info}>학교: {profile.school}</Text>
      <Text style={styles.info}>학과: {profile.department}</Text>
      <Text style={styles.info}>학번: {profile.studentId || '-'}</Text>
      <Text style={styles.info}>MBTI: {profile.mbti || '-'}</Text>
      <Text style={styles.info}>
        Instagram: {profile.instagram || '-'}
      </Text>
      <Text style={styles.info}>
        동아리: {profile.clubs.join(', ') || '-'}
      </Text>

      <Pressable style={styles.button} onPress={resetProfile}>
        <Text style={styles.buttonText}>
          테스트용 프로필 삭제
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    backgroundColor: '#F5F3FF',
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 24,
    color: '#302B40',
  },
  info: {
    fontSize: 16,
    marginBottom: 12,
    color: '#302B40',
  },
  button: {
    marginTop: 24,
    backgroundColor: '#7357F6',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
});
