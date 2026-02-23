import { useRouter, Stack } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Colors from '@/constants/colors';
import { signUpWithEmail } from '@/lib/auth';
import { createProfile } from '@/features/profile/profile-api';
import { isNetworkError, CONNECTION_FAILED_MSG } from '@/lib/error-message';
import { isSupabaseConfigured } from '@/lib/supabase';
import { getString, ONBOARDING_FIRST_NAME } from '@/lib/storage';

function authErrorMessage(err: unknown): string {
  if (err && typeof err === 'object' && 'message' in err && typeof (err as { message: string }).message === 'string') {
    return (err as { message: string }).message;
  }
  return 'Something went wrong. Please try again.';
}

export default function SignUpScreen() {
  const router = useRouter();
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [emailError, setEmailError] = useState<string>('');
  const [passwordError, setPasswordError] = useState<string>('');
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const insets = useSafeAreaInsets();
  const configured = isSupabaseConfigured();

  const validate = (): boolean => {
    let valid = true;
    setEmailError('');
    setPasswordError('');
    if (!email.trim()) {
      setEmailError('Email is required');
      valid = false;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      setEmailError('Invalid email format');
      valid = false;
    }
    if (!password) {
      setPasswordError('Password is required');
      valid = false;
    } else if (password.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      valid = false;
    }
    return valid;
  };

  const handleSignUp = async () => {
    if (!validate()) return;
    setSubmitError(null);

    if (!configured) {
      setSubmitError('Supabase not configured.');
      return;
    }

    setIsSubmitting(true);
    try {
      const user = await signUpWithEmail(email, password);
      if (user?.id) {
        const savedFirstName = (await getString(ONBOARDING_FIRST_NAME))?.trim() ?? '';
        try {
          await createProfile({ user_id: user.id, first_name: savedFirstName });
        } catch (profileError) {
          console.warn('Profile creation failed:', profileError);
        }
      }
      router.replace('/sign-in?created=1' as any);
    } catch (err) {
      setSubmitError(isNetworkError(err) ? CONNECTION_FAILED_MSG : authErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={10}
      >
        <ScrollView
          contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 40, paddingBottom: insets.bottom + 24 }]}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.brandMark}>
            <View style={styles.logoBg}>
              <Text style={styles.logoText}>CS</Text>
            </View>
            <Text style={styles.title}>Create an account</Text>
            <Text style={styles.subtitle}>Start managing your creator business.</Text>
          </View>

          {!configured && (
            <View style={styles.infoBanner}>
              <Text style={styles.infoText}>
                Supabase not configured. Add your env vars to enable authentication.
              </Text>
            </View>
          )}

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={[styles.input, emailError ? styles.inputErrorBorder : null]}
              value={email}
              onChangeText={(t) => { setEmail(t); setEmailError(''); }}
              placeholder="you@example.com"
              placeholderTextColor={Colors.textMuted}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              testID="sign-up-email"
            />
            {emailError ? <Text style={styles.fieldError}>{emailError}</Text> : null}
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Password</Text>
            <TextInput
              style={[styles.input, passwordError ? styles.inputErrorBorder : null]}
              value={password}
              onChangeText={(t) => { setPassword(t); setPasswordError(''); }}
              placeholder="At least 6 characters"
              placeholderTextColor={Colors.textMuted}
              secureTextEntry
              testID="sign-up-password"
            />
            {passwordError ? <Text style={styles.fieldError}>{passwordError}</Text> : null}
          </View>

          {submitError ? <Text style={styles.submitError}>{submitError}</Text> : null}

          <Pressable
            style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
            onPress={handleSignUp}
            disabled={isSubmitting}
            testID="sign-up-button"
          >
            {isSubmitting ? (
              <ActivityIndicator color={Colors.white} />
            ) : (
              <Text style={styles.buttonText}>Create account</Text>
            )}
          </Pressable>

          <Pressable
            style={({ pressed }) => [styles.outlineButton, pressed && styles.outlineButtonPressed]}
            onPress={() => router.back()}
          >
            <Text style={styles.outlineButtonText}>Already have an account? Sign in</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center' as const,
    padding: 24,
  },
  brandMark: {
    alignItems: 'center' as const,
    marginBottom: 24,
  },
  logoBg: {
    width: 60,
    height: 60,
    borderRadius: 16,
    backgroundColor: Colors.primary,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginBottom: 12,
  },
  logoText: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: Colors.white,
  },
  title: {
    fontSize: 22,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  infoBanner: {
    borderWidth: 1,
    borderColor: Colors.inputBorder,
    backgroundColor: Colors.surface,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  infoText: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  fieldGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: Colors.textSecondary,
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.inputBorder,
    borderRadius: 10,
    backgroundColor: Colors.inputBg,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: Colors.text,
  },
  inputErrorBorder: {
    borderColor: Colors.danger,
  },
  fieldError: {
    fontSize: 12,
    color: Colors.danger,
    marginTop: 4,
  },
  submitError: {
    fontSize: 13,
    color: Colors.danger,
    marginBottom: 12,
  },
  button: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center' as const,
    marginBottom: 12,
  },
  buttonPressed: {
    opacity: 0.85,
  },
  buttonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600' as const,
  },
  outlineButton: {
    borderWidth: 1,
    borderColor: Colors.inputBorder,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center' as const,
  },
  outlineButtonPressed: {
    backgroundColor: Colors.surface,
  },
  outlineButtonText: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: '500' as const,
  },
});
