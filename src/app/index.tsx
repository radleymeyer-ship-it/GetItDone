import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Theme } from '../constants/theme';
import { supabase } from '../lib/supabase';

export default function AuthScreen() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAuth = async () => {
    const cleanEmail = email.trim();
    const cleanPassword = password.trim();
    const cleanFullName = fullName.trim();

    if (!cleanEmail || !cleanPassword) {
      Alert.alert('Missing Fields', 'Please enter both email and password.');
      return;
    }

    if (isSignUp && !cleanFullName) {
      Alert.alert('Missing Fields', 'Please enter your full name.');
      return;
    }

    setLoading(true);

    try {
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({
          email: cleanEmail,
          password: cleanPassword,
          options: {
            data: { full_name: cleanFullName },
          },
        });

        if (error) {
          console.error('Sign Up Error:', error);
          Alert.alert('Sign Up Error', error.message);
        } else if (data?.session) {
          Alert.alert('Success', 'Account created! Logging you in...');
        } else {
          Alert.alert(
            'Check Email',
            'Account created! If email confirmation is enabled, please verify your email before logging in.'
          );
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password: cleanPassword,
        });

        if (error) {
          console.error('Sign In Error:', error);
          Alert.alert('Sign In Failed', error.message);
        } else {
          console.log('Sign in successful! User ID:', data.user?.id);
        }
      }
    } catch (err: any) {
      console.error('Auth Unexpected Error:', err);
      Alert.alert('Authentication Error', err.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {/* Header Branding */}
        <View style={styles.header}>
          <View style={styles.badge}>
            <Text style={styles.badgeIcon}>⚡</Text>
          </View>
          <Text style={styles.appName}>GetItDone</Text>
        </View>

        {/* Title */}
        <Text style={styles.title}>{isSignUp ? 'Create Account' : 'Welcome Back'}</Text>
        <Text style={styles.subtitle}>
          {isSignUp
            ? 'Sign up to start posting jobs and requesting quotes.'
            : 'Log in to manage your local jobs and quotes.'}
        </Text>

        {/* Form Controls */}
        {isSignUp && (
          <Input
            label="Full Name"
            placeholder="John Doe"
            value={fullName}
            onChangeText={setFullName}
          />
        )}

        <Input
          label="Email Address"
          placeholder="name@example.co.za"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />

        <Input
          label="Password"
          placeholder="••••••••"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        {/* Action Button */}
        <Button
          title={loading ? 'Processing...' : isSignUp ? 'Sign Up' : 'Sign In'}
          onPress={handleAuth}
          loading={loading}
          style={styles.authBtn}
        />

        {/* Mode Toggle */}
        <Pressable onPress={() => setIsSignUp(!isSignUp)} style={styles.toggleBtn}>
          <Text style={styles.toggleText}>
            {isSignUp
              ? 'Already have an account? Sign In'
              : "Don't have an account? Sign Up"}
          </Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Theme.colors.background },
  scrollContent: { padding: Theme.spacing.lg, justifyContent: 'center', flexGrow: 1 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: Theme.spacing.lg },
  badge: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: Theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  badgeIcon: { color: '#FFF', fontSize: 18 },
  appName: { fontSize: 22, fontWeight: '800', color: Theme.colors.textPrimary },
  title: { fontSize: 28, fontWeight: '800', color: Theme.colors.textPrimary, marginBottom: 4 },
  subtitle: { fontSize: 14, color: Theme.colors.textSecondary, marginBottom: Theme.spacing.lg },
  authBtn: { marginTop: Theme.spacing.md },
  toggleBtn: { marginTop: Theme.spacing.lg, alignItems: 'center' },
  toggleText: { color: Theme.colors.primary, fontWeight: '600', fontSize: 14 },
});