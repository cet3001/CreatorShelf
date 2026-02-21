import { useForm } from '@tanstack/react-form';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, ScrollView } from 'react-native';
import * as z from 'zod';

import { Button, Input, Text, View } from '@/components/ui';
import { getFieldError } from '@/components/ui/form-utils';
import { useAuthStore } from '@/features/auth/use-auth-store';
import { signInWithEmail } from '@/lib/auth';

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

export default function SignInScreen() {
  const router = useRouter();
  const signIn = useAuthStore.use.signIn();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const form = useForm({
    defaultValues: { email: '', password: '' },
    validators: {
      onChange: schemaOnChange as any,
      onSubmit: schemaOnSubmit as any,
    },
    onSubmit: async ({ value }) => {
      setSubmitError(null);
      try {
        const user = await signInWithEmail(value.email, value.password);
        signIn(user);
        router.replace('/(app)');
      }
      catch (err) {
        setSubmitError(authErrorMessage(err));
        throw err;
      }
    },
  });

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding" keyboardVerticalOffset={10}>
      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 24 }}>
        <Text className="pb-4 text-center text-3xl font-bold">Sign in</Text>
        <Text className="mb-6 text-center text-muted-foreground">
          Sign in to CreatorShelf with your email.
        </Text>
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
        {submitError
          ? (
              <Text className="mb-3 text-sm text-danger-600">{submitError}</Text>
            )
          : null}
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
