import type { FormType } from './components/login-form';

import { useRouter } from 'expo-router';
import * as React from 'react';
import { useState } from 'react';
import { FocusAwareStatusBar, Text, View } from '@/components/ui';
import { signInWithEmail } from '@/lib/auth';
import { LoginForm } from './components/login-form';
import { useAuthStore } from './use-auth-store';

function authErrorMessage(err: unknown): string {
  if (err && typeof err === 'object' && 'message' in err && typeof (err as { message: string }).message === 'string') {
    return (err as { message: string }).message;
  }
  return 'Something went wrong. Please try again.';
}

export function LoginScreen() {
  const router = useRouter();
  const signIn = useAuthStore.use.signIn();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const onSubmit = async (data: FormType) => {
    setSubmitError(null);
    try {
      const user = await signInWithEmail(data.email, data.password);
      signIn(user);
      router.replace('/(app)');
    }
    catch (err) {
      setSubmitError(authErrorMessage(err));
      throw err;
    }
  };

  return (
    <>
      <FocusAwareStatusBar />
      {submitError
        ? (
            <View className="px-4 pt-4">
              <Text className="text-sm text-danger-600">{submitError}</Text>
            </View>
          )
        : null}
      <LoginForm onSubmit={onSubmit} />
    </>
  );
}
