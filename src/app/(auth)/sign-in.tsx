import { useForm } from '@tanstack/react-form';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, ScrollView } from 'react-native';
import * as z from 'zod';

import { Button, Input, SupabaseNotConfiguredBanner, Text, View } from '@/components/ui';
import { getFieldError } from '@/components/ui/form-utils';
import { useAuthStore } from '@/features/auth/use-auth-store';
import { signInWithEmail } from '@/lib/auth';
import { CONNECTION_FAILED_MSG, isNetworkError } from '@/lib/error-message';
import { isSupabaseConfigured } from '@/lib/supabase';

const schemaOnChange = z.object({
  email: z.string(),
  password: z.string(),
});

const schemaOnSubmit = z.object({
  email: z.string().min(1, 'Email is required').email('Invalid email format'),
  password: z.string().min(1, 'Password is required').min(6, 'Password must be at least 6 characters'),
});

function authErrorMessage(err: unknown): string {
  if (err && typeof err === 'object' && 'message' in err && typeof (err as { message: string }).message === 'string') {
    return (err as { message: string }).message;
  }
  return 'Something went wrong. Please try again.';
}

const SUPABASE_AUTH_HINT = 'Add EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY to .env in the project root (see .env.example), then restart Metro: stop the server and run `npx expo start -c`.';

function BrandMark() {
  return (
    <View className="mb-6 items-center">
      <View style={{ width: 60, height: 60, borderRadius: 16, backgroundColor: '#0D9488', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
        <Text style={{ fontSize: 24, fontWeight: '700', color: '#fff' }}>CS</Text>
      </View>
      <Text className="text-xl font-bold text-foreground">Welcome back</Text>
      <Text className="mt-1 text-center text-muted-foreground">Sign in to your CreatorShelf account.</Text>
    </View>
  );
}

function EmailNotConfirmedBanner() {
  return (
    <View className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-950/50">
      <Text className="text-sm text-amber-800 dark:text-amber-200">
        Please confirm your email before signing in. Check your inbox for a confirmation link.
      </Text>
    </View>
  );
}

export default function SignInScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ created?: string }>();
  const signIn = useAuthStore.use.signIn();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [emailNotConfirmedBanner, setEmailNotConfirmedBanner] = useState(false);
  const configured = isSupabaseConfigured();
  const showAccountCreated = params.created === '1';

  const form = useForm({
    defaultValues: { email: '', password: '' },
    validators: {
      onChange: schemaOnChange as any,
      onSubmit: schemaOnSubmit as any,
    },
    onSubmit: async ({ value }) => {
      setSubmitError(null);
      setEmailNotConfirmedBanner(false);
      if (!configured) {
        setSubmitError('Supabase not configured. Add the two env vars to .env and restart Metro with: npx expo start -c');
        return;
      }
      try {
        const user = await signInWithEmail(value.email, value.password);
        signIn(user);
        router.replace('/(app)');
      }
      catch (err) {
        const msg = isNetworkError(err) ? CONNECTION_FAILED_MSG : authErrorMessage(err);
        setSubmitError(msg);
        const rawMsg = err && typeof err === 'object' && 'message' in err ? String((err as { message: unknown }).message) : '';
        if (rawMsg.toLowerCase().includes('email not confirmed'))
          setEmailNotConfirmedBanner(true);
        throw err;
      }
    },
  });

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding" keyboardVerticalOffset={10}>
      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 24 }}>
        <BrandMark />
        {showAccountCreated && <Text className="mb-4 text-center text-sm text-primary-600 dark:text-primary-400">Account created. Please sign in.</Text>}
        {emailNotConfirmedBanner && <EmailNotConfirmedBanner />}
        {!configured && (
          <View className="mb-4">
            <SupabaseNotConfiguredBanner
              title="Sign-in not available"
              hint={SUPABASE_AUTH_HINT}
            />
          </View>
        )}
        <form.Field
          name="email"
          children={field => (
            <Input
              label="Email"
              keyboardType="email-address"
              autoCapitalize="none"
              value={field.state.value}
              onBlur={field.handleBlur}
              onChangeText={field.handleChange}
              error={getFieldError(field)}
              placeholder="you@example.com"
            />
          )}
        />
        <form.Field
          name="password"
          children={field => (
            <Input
              label="Password"
              secureTextEntry
              value={field.state.value}
              onBlur={field.handleBlur}
              onChangeText={field.handleChange}
              error={getFieldError(field)}
              placeholder="•••"
            />
          )}
        />
        {submitError ? <Text className="mb-3 text-sm text-danger-600">{submitError}</Text> : null}
        <form.Subscribe
          selector={state => [state.isSubmitting]}
          children={([isSubmitting]) => (
            <Button
              label="Sign in"
              variant="secondary"
              onPress={form.handleSubmit}
              loading={isSubmitting}
            />
          )}
        />
        <View className="mt-4">
          <Button
            label="Create an account"
            variant="outline"
            onPress={() => router.push('/(auth)/sign-up')}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
