import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Home } from 'lucide-react-native';
import Colors from '@/constants/colors';

export default function NotFoundScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Not Found' }} />
      <LinearGradient
        colors={[Colors.dark, Colors.backgroundSecondary]}
        style={styles.gradient}
      >
        <Text style={styles.title}>404</Text>
        <Text style={styles.subtitle}>Page not found</Text>
        <Text style={styles.description}>
          The page you&apos;re looking for doesn&apos;t exist.
        </Text>

        <TouchableOpacity
          onPress={() => router.replace('/')}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={[Colors.primary, Colors.secondary]}
            style={styles.button}
          >
            <Home size={20} color="#FFFFFF" />
            <Text style={styles.buttonText}>Go Home</Text>
          </LinearGradient>
        </TouchableOpacity>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark,
  },
  gradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  title: {
    fontSize: 72,
    fontWeight: '700' as const,
    color: Colors.primary,
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 32,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 16,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#FFFFFF',
  },
});
