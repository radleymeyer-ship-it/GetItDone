import { useRouter } from 'expo-router';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '../../components/ui/Button';
import { Theme } from '../../constants/theme';
import { useAuth } from '../../context/AuthContext';

export default function ProviderProfileScreen() {
  const router = useRouter();
  const { user, signOut } = useAuth();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Provider Profile</Text>
        <Text style={styles.email}>{user?.email}</Text>

        {/* Switch Mode Button */}
        <TouchableOpacity
          style={styles.switchBtn}
          onPress={() => router.replace('/(customer)/jobs')}
        >
          <Text style={styles.switchBtnText}>Switch to Customer Mode 👤</Text>
        </TouchableOpacity>

        <View style={styles.spacer} />

        <Button title="Sign Out" variant="outline" onPress={signOut} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Theme.colors.background },
  content: { padding: Theme.spacing.lg, flex: 1 },
  title: { fontSize: 24, fontWeight: '800', color: Theme.colors.textPrimary },
  email: { fontSize: 14, color: Theme.colors.textSecondary, marginTop: 4, marginBottom: 24 },
  switchBtn: {
    backgroundColor: '#DEF7EC',
    borderWidth: 1,
    borderColor: '#03543F',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 10,
    alignItems: 'center',
  },
  switchBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#03543F',
  },
  spacer: { flex: 1 },
});