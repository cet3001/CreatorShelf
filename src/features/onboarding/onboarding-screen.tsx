import { useRouter } from 'expo-router';
import * as React from 'react';
import {
  Dimensions,
  View as RNView,
  ScrollView,
  StyleSheet,
  TextInput,
} from 'react-native';

import {
  Button,
  FocusAwareStatusBar,
  Text,
  View,
} from '@/components/ui';
import { useIsFirstTime } from '@/lib/hooks';
import { ONBOARDING_FIRST_NAME, storage } from '@/lib/storage';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const TOTAL_STEPS = 3;

function ProgressDots({ current }: { current: number }) {
  return (
    <RNView style={styles.dotsRow}>
      {Array.from({ length: TOTAL_STEPS }, (_, i) => (
        <RNView
          key={i}
          style={[styles.dot, i === current && styles.dotActive]}
        />
      ))}
    </RNView>
  );
}

function LogoMark() {
  return (
    <RNView style={styles.logoBg}>
      <Text style={styles.logoText}>CS</Text>
    </RNView>
  );
}

type Step1Props = { onNext: () => void };
function Step1({ onNext }: Step1Props) {
  return (
    <RNView style={styles.stepContainer}>
      <LogoMark />
      <Text style={styles.h1}>Your creator business, all in one place.</Text>
      <Text style={styles.body}>
        CreatorShelf helps you plan promos, track income, manage Spark codes, and stay on top of
        contracts, all from one clean app.
      </Text>
      <ProgressDots current={0} />
      <Button label="Next" onPress={onNext} className="mt-6" />
    </RNView>
  );
}

const FEATURES = [
  { icon: '📅', label: 'Plan your content', desc: 'Schedule seasonal promos and product launches.' },
  { icon: '💰', label: 'Track your income', desc: 'See your daily, weekly, and monthly earnings.' },
  { icon: '🔗', label: 'Manage Spark codes', desc: 'Save codes, video links, and expiry dates.' },
  { icon: '📄', label: 'Track contracts', desc: 'Store deals, deliverables, and payment terms.' },
] as const;

type Step2Props = { onNext: () => void };
function Step2({ onNext }: Step2Props) {
  return (
    <RNView style={styles.stepContainer}>
      <Text style={styles.h1}>What you can do</Text>
      <RNView style={styles.featureList}>
        {FEATURES.map(({ icon, label, desc }) => (
          <RNView key={label} style={styles.featureRow}>
            <Text style={styles.featureIcon}>{icon}</Text>
            <RNView style={styles.featureTextWrap}>
              <Text style={styles.featureLabel}>{label}</Text>
              <Text style={styles.featureDesc}>{desc}</Text>
            </RNView>
          </RNView>
        ))}
      </RNView>
      <ProgressDots current={1} />
      <Text style={styles.stepHint}>Step 2 of 3</Text>
      <Button label="Next" onPress={onNext} className="mt-4" />
    </RNView>
  );
}

type Step3Props = {
  firstName: string;
  setFirstName: (v: string) => void;
  onGetStarted: () => void;
};
function Step3({ firstName, setFirstName, onGetStarted }: Step3Props) {
  const [error, setError] = React.useState<string | null>(null);

  const handleGetStarted = () => {
    const trimmed = firstName.trim();
    if (!trimmed) {
      setError('First name is required.');
      return;
    }
    storage.set(ONBOARDING_FIRST_NAME, trimmed);
    onGetStarted();
  };

  return (
    <RNView style={styles.stepContainer}>
      <Text style={styles.h1}>What should we call you?</Text>
      <Text style={styles.body}>We'll use your name to personalize your experience.</Text>
      <TextInput
        style={[styles.input, error && styles.inputError]}
        value={firstName}
        onChangeText={(t) => {
          setFirstName(t);
          setError(null);
        }}
        placeholder="First name"
        placeholderTextColor="#9AA3AE"
        autoCapitalize="words"
      />
      {error ? <Text style={styles.inputErrorText}>{error}</Text> : null}
      <ProgressDots current={2} />
      <Button label="Get started" onPress={handleGetStarted} className="mt-6" />
    </RNView>
  );
}

export function OnboardingScreen() {
  const [step, setStep] = React.useState(0);
  const [firstName, setFirstName] = React.useState('');
  const [, setIsFirstTime] = useIsFirstTime();
  const router = useRouter();
  const scrollRef = React.useRef<ScrollView>(null);

  const goNext = React.useCallback(() => {
    if (step < TOTAL_STEPS - 1) {
      setStep(s => s + 1);
      scrollRef.current?.scrollTo({ x: (step + 1) * SCREEN_WIDTH, animated: true });
    }
  }, [step]);

  const handleGetStarted = React.useCallback(() => {
    setIsFirstTime(false);
    router.replace('/(auth)/sign-in');
  }, [router, setIsFirstTime]);

  return (
    <View className="flex-1 bg-background-dark">
      <FocusAwareStatusBar />
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEventThrottle={16}
        onMomentumScrollEnd={(e) => {
          const idx = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
          setStep(idx);
        }}
        scrollEnabled
      >
        <RNView style={[styles.page, { width: SCREEN_WIDTH }]}>
          <Step1 onNext={goNext} />
        </RNView>
        <RNView style={[styles.page, { width: SCREEN_WIDTH }]}>
          <Step2 onNext={goNext} />
        </RNView>
        <RNView style={[styles.page, { width: SCREEN_WIDTH }]}>
          <Step3
            firstName={firstName}
            setFirstName={setFirstName}
            onGetStarted={handleGetStarted}
          />
        </RNView>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    paddingHorizontal: 28,
    paddingTop: 64,
    paddingBottom: 24,
  },
  stepContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoBg: {
    width: 88,
    height: 88,
    borderRadius: 24,
    backgroundColor: '#0D9488',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  logoText: {
    fontSize: 36,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: -1,
  },
  h1: {
    fontSize: 24,
    fontWeight: '700',
    color: '#F2F4F6',
    textAlign: 'center',
    marginBottom: 12,
  },
  body: {
    fontSize: 16,
    color: '#9AA3AE',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
    paddingHorizontal: 8,
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#2C3036',
  },
  dotActive: {
    backgroundColor: '#0D9488',
  },
  stepHint: {
    fontSize: 13,
    color: '#5A6370',
  },
  featureList: {
    width: '100%',
    gap: 16,
    marginBottom: 24,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  featureIcon: {
    fontSize: 28,
    width: 40,
    textAlign: 'center',
  },
  featureTextWrap: {
    flex: 1,
  },
  featureLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F2F4F6',
  },
  featureDesc: {
    fontSize: 14,
    color: '#9AA3AE',
    marginTop: 2,
  },
  input: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#2C3036',
    borderRadius: 12,
    backgroundColor: '#1A1D21',
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#F2F4F6',
    marginTop: 16,
  },
  inputError: {
    borderColor: '#dc2626',
  },
  inputErrorText: {
    fontSize: 14,
    color: '#dc2626',
    marginTop: 4,
    alignSelf: 'flex-start',
  },
});
