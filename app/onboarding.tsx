import { useRouter } from 'expo-router';
import React, { useCallback, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Colors from '@/constants/colors';
import { setString, ONBOARDING_FIRST_NAME } from '@/lib/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { IS_FIRST_TIME_KEY } from '@/lib/storage';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const TOTAL_STEPS = 3;

const FEATURES = [
  { icon: '📅', label: 'Plan your content', desc: 'Schedule seasonal promos and product launches.' },
  { icon: '💰', label: 'Track your income', desc: 'See your daily, weekly, and monthly earnings.' },
  { icon: '🔗', label: 'Manage Spark codes', desc: 'Save codes, video links, and expiry dates.' },
  { icon: '📄', label: 'Track contracts', desc: 'Store deals, deliverables, and payment terms.' },
] as const;

function ProgressDots({ current }: { current: number }) {
  return (
    <View style={styles.dotsRow}>
      {Array.from({ length: TOTAL_STEPS }, (_, i) => (
        <View
          key={i}
          style={[styles.dot, i === current && styles.dotActive]}
        />
      ))}
    </View>
  );
}

export default function OnboardingScreen() {
  const [step, setStep] = useState<number>(0);
  const [firstName, setFirstName] = useState<string>('');
  const [nameError, setNameError] = useState<string | null>(null);
  const router = useRouter();
  const scrollRef = useRef<ScrollView>(null);
  const insets = useSafeAreaInsets();

  const goNext = useCallback(() => {
    if (step < TOTAL_STEPS - 1) {
      const nextStep = step + 1;
      setStep(nextStep);
      scrollRef.current?.scrollTo({ x: nextStep * SCREEN_WIDTH, animated: true });
    }
  }, [step]);

  const handleGetStarted = useCallback(async () => {
    const trimmed = firstName.trim();
    if (!trimmed) {
      setNameError('First name is required.');
      return;
    }
    await setString(ONBOARDING_FIRST_NAME, trimmed);
    await AsyncStorage.setItem(IS_FIRST_TIME_KEY, 'false');
    router.replace('/sign-in' as any);
  }, [firstName, router]);

  const onScroll = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const idx = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
    setStep(idx);
  }, []);

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEventThrottle={16}
        onMomentumScrollEnd={onScroll}
      >
        <View style={[styles.page, { width: SCREEN_WIDTH }]}>
          <View style={styles.stepContainer}>
            <View style={styles.logoBg}>
              <Text style={styles.logoText}>CS</Text>
            </View>
            <Text style={styles.h1}>Your creator business, all in one place.</Text>
            <Text style={styles.body}>
              CreatorShelf helps you plan promos, track income, manage Spark codes, and stay on top of contracts.
            </Text>
            <ProgressDots current={0} />
            <Pressable style={styles.button} onPress={goNext}>
              <Text style={styles.buttonText}>Next</Text>
            </Pressable>
          </View>
        </View>

        <View style={[styles.page, { width: SCREEN_WIDTH }]}>
          <View style={styles.stepContainer}>
            <Text style={styles.h1}>What you can do</Text>
            <View style={styles.featureList}>
              {FEATURES.map(({ icon, label, desc }) => (
                <View key={label} style={styles.featureRow}>
                  <Text style={styles.featureIcon}>{icon}</Text>
                  <View style={styles.featureTextWrap}>
                    <Text style={styles.featureLabel}>{label}</Text>
                    <Text style={styles.featureDesc}>{desc}</Text>
                  </View>
                </View>
              ))}
            </View>
            <ProgressDots current={1} />
            <Pressable style={styles.button} onPress={goNext}>
              <Text style={styles.buttonText}>Next</Text>
            </Pressable>
          </View>
        </View>

        <View style={[styles.page, { width: SCREEN_WIDTH }]}>
          <View style={styles.stepContainer}>
            <Text style={styles.h1}>What should we call you?</Text>
            <Text style={styles.body}>We'll use your name to personalize your experience.</Text>
            <TextInput
              style={[styles.input, nameError ? styles.inputError : null]}
              value={firstName}
              onChangeText={(t) => {
                setFirstName(t);
                setNameError(null);
              }}
              placeholder="First name"
              placeholderTextColor={Colors.textMuted}
              autoCapitalize="words"
            />
            {nameError ? <Text style={styles.inputErrorText}>{nameError}</Text> : null}
            <ProgressDots current={2} />
            <Pressable style={styles.button} onPress={handleGetStarted}>
              <Text style={styles.buttonText}>Get started</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  page: {
    flex: 1,
    paddingHorizontal: 28,
    paddingTop: 64,
    paddingBottom: 24,
  },
  stepContainer: {
    flex: 1,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  logoBg: {
    width: 88,
    height: 88,
    borderRadius: 24,
    backgroundColor: Colors.primary,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginBottom: 24,
  },
  logoText: {
    fontSize: 36,
    fontWeight: '700' as const,
    color: Colors.white,
    letterSpacing: -1,
  },
  h1: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: Colors.text,
    textAlign: 'center' as const,
    marginBottom: 12,
  },
  body: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center' as const,
    lineHeight: 24,
    marginBottom: 24,
    paddingHorizontal: 8,
  },
  dotsRow: {
    flexDirection: 'row' as const,
    gap: 8,
    marginBottom: 24,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.surfaceLight,
  },
  dotActive: {
    backgroundColor: Colors.primary,
  },
  featureList: {
    width: '100%',
    gap: 16,
    marginBottom: 24,
  },
  featureRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 16,
  },
  featureIcon: {
    fontSize: 28,
    width: 40,
    textAlign: 'center' as const,
  },
  featureTextWrap: {
    flex: 1,
  },
  featureLabel: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  featureDesc: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  input: {
    width: '100%',
    borderWidth: 1,
    borderColor: Colors.inputBorder,
    borderRadius: 12,
    backgroundColor: Colors.inputBg,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: Colors.text,
    marginTop: 16,
    marginBottom: 16,
  },
  inputError: {
    borderColor: Colors.danger,
  },
  inputErrorText: {
    fontSize: 14,
    color: Colors.danger,
    marginTop: 4,
    alignSelf: 'flex-start' as const,
    marginBottom: 8,
  },
  button: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 32,
    width: '100%',
    alignItems: 'center' as const,
  },
  buttonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600' as const,
  },
});
