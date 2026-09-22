import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    SafeAreaView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';
import { supabase } from '../lib/supabase';

export default function AuthScreen() {
  const router = useRouter();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [userType, setUserType] = useState<'customer' | 'pro'>('customer');
  const [loading, setLoading] = useState(false);

  const handleAuth = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields.');
      return;
    }

    setLoading(true);

    if (isSignUp) {
      // 1. Sign up the user in Supabase Auth
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        Alert.alert('Sign Up Error', error.message);
        setLoading(false);
        return;
      }

      // 2. Save additional user details to the profiles table
      if (data.user) {
        const { error: profileError } = await supabase.from('profiles').insert([
          {
            id: data.user.id,
            full_name: fullName,
            user_type: userType,
          },
        ]);

        if (profileError) {
          Alert.alert('Profile Setup Error', profileError.message);
        } else {
          Alert.alert('Success', 'Account created! You can now log in.');
          setIsSignUp(false);
        }
      }
    } else {
      // Handle Login
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        Alert.alert('Login Error', error.message);
      } else {
        router.replace('/(tabs)' as any);
      }
    }

    setLoading(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.innerContainer}
      >
        <Text style={styles.title}>{isSignUp ? 'Create Account' : 'Welcome Back'}</Text>
        <Text style={styles.subtitle}>
          {isSignUp
            ? 'Join GetItDone to connect or offer services'
            : 'Sign in to manage your jobs'}
        </Text>

        <View style={styles.form}>
          {isSignUp && (
            <>
              <Text style={styles.label}>Full Name</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Thabo Mokoena"
                placeholderTextColor="#6B7280"
                value={fullName}
                onChangeText={setFullName}
              />

              <Text style={styles.label}>I want to:</Text>
              <View style={styles.roleContainer}>
                <Pressable
                  style={[
                    styles.roleButton,
                    userType === 'customer' && styles.roleButtonActive,
                  ]}
                  onPress={() => setUserType('customer')}
                >
                  <Text style={styles.roleText}>Hire Pros (Customer)</Text>
                </Pressable>

                <Pressable
                  style={[
                    styles.roleButton,
                    userType === 'pro' && styles.roleButtonActive,
                  ]}
                  onPress={() => setUserType('pro')}
                >
                  <Text style={styles.roleText}>Offer Services (Pro)</Text>
                </Pressable>
              </View>
            </>
          )}

          <Text style={styles.label}>Email Address</Text>
          <TextInput
            style={styles.input}
            placeholder="name@example.com"
            placeholderTextColor="#6B7280"
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />

          <Text style={styles.label}>Password</Text>
          <TextInput
            style={styles.input}
            placeholder="••••••••"
            placeholderTextColor="#6B7280"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />

          <Pressable
            style={[styles.submitButton, loading && styles.buttonDisabled]}
            onPress={handleAuth}
            disabled={loading}
          >
            <Text style={styles.submitButtonText}>
              {loading ? 'Processing...' : isSignUp ? 'Sign Up' : 'Log In'}
            </Text>
          </Pressable>

          <Pressable
            style={styles.toggleButton}
            onPress={() => setIsSignUp(!isSignUp)}
          >
            <Text style={styles.toggleText}>
              {isSignUp
                ? 'Already have an account? Log In'
                : "Don't have an account? Sign Up"}
            </Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#080A0F',
  },
  innerContainer: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#9CA3AF',
    marginBottom: 32,
  },
  form: {
    gap: 12,
  },
  label: {
    color: '#D1D5DB',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 4,
  },
  input: {
    backgroundColor: '#1F2937',
    color: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    fontSize: 16,
  },
  roleContainer: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 8,
  },
  roleButton: {
    flex: 1,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#374151',
    borderRadius: 10,
    alignItems: 'center',
  },
  roleButtonActive: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  roleText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 13,
  },
  submitButton: {
    backgroundColor: '#2563EB',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  toggleButton: {
    alignItems: 'center',
    marginTop: 16,
  },
  toggleText: {
    color: '#3B82F6',
    fontSize: 14,
    fontWeight: '600',
  },
});