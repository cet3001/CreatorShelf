import { useForm } from '@tanstack/react-form';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, ScrollView } from 'react-native';
import * as z from 'zod';

import { Button, Input, SupabaseNotConfiguredBanner, Text, View } from '@/components/ui';
import { getFieldError } from '@/components/ui/form-utils';
import { createProfile } from '@/features/profile/profile.api';
import { signUpWithEmail } from '@/lib/auth';
import { CONNECTION_FAILED_MSG, isNetworkError } from '@/lib/error-message';
import { ONBOARDING_FIRST_NAME, storage } from '@/lib/storage';
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

/* eslint-disable max-lines-per-function -- sign-up form: email, password, banner, actions */
export default function SignUpScreen() {
  const router = useRouter();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const configured = isSupabaseConfigured();

  const form = useForm({
    defaultValues: { email: '', password: '' },
    validators: {
      onChange: schemaOnChange as any,
      onSubmit: schemaOnSubmit as any,
    },
    onSubmit: async ({ value }) => {
      setSubmitError(null);
      if (!configured) {
        setSubmitError('Supabase not configured. Add the two env vars to .env and restart Metro with: npx expo start -c');
        return;
      }
      try {
        const user = await signUpWithEmail(value.email, value.password);
        if (user?.id) {
          const savedFirstName = storage.getString(ONBOARDING_FIRST_NAME)?.trim() ?? '';
          try {
            await createProfile({ user_id: user.id, first_name: savedFirstName });
          }
          catch (profileError) {
            console.warn('Profile creation failed:', profileError);
          }
        }
        router.replace('/(auth)/sign-in?created=1');
      }
      catch (err) {
        setSubmitError(isNetworkError(err) ? CONNECTION_FAILED_MSG : authErrorMessage(err));
        throw err;
      }
    },
  });

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding" keyboardVerticalOffset={10}>
      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 24 }}>
        {/* Brand mark */}
        <View className="mb-6 items-center">
          <View style={{ width: 60, height: 60, borderRadius: 16, backgroundColor: '#0D9488', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
            <Text style={{ fontSize: 24, fontWeight: '700', color: '#fff' }}>CS</Text>
          </View>
          <Text style={{ fontSize: 22, fontWeight: '700' }} className="text-foreground">Create an account</Text>
          <Text className="mt-1 text-center text-muted-foreground">Start managing your creator business.</Text>
        </View>
        {!configured && (
          <View className="mb-4">
            <SupabaseNotConfiguredBanner
              title="Sign-up not available"
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
              placeholder="At least 6 characters"
            />
          )}
        />
        {submitError
          ? (
              <Text className="mb-3 text-sm text-danger-600">{submitError}</Text>
            )
          : null}
        <form.Subscribe
          selector={state => [state.isSubmitting]}
          children={([isSubmitting]) => (
            <Button
              label="Create account"
              variant="secondary"
              onPress={form.handleSubmit}
              loading={isSubmitting}
            />
          )}
        />
        <View className="mt-4">
          <Button
            label="Already have an account? Sign in"
            variant="outline"
            onPress={() => router.back()}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
