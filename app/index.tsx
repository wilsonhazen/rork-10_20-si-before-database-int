import { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter, SplashScreen } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import Colors from '@/constants/colors';

export default function IndexScreen() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { isLoading: dataLoading } = useData();

  useEffect(() => {
    const navigate = async () => {
      if (!authLoading && !dataLoading) {
        await SplashScreen.hideAsync();
        
        if (isAuthenticated) {
          router.replace('/(tabs)/home');
        } else {
          router.replace('/onboarding');
        }
      }
    };

    navigate();
  }, [isAuthenticated, authLoading, dataLoading, router]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={Colors.primary} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
