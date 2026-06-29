import { useState } from 'react';

import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { router, useLocalSearchParams } from 'expo-router';

import { BrandLogo } from '../../src/components/BrandLogo';
import { emailSchema, verifyEmailSchema } from '../../src/features/auth/validation';
import { supabase } from '../../src/lib/supabase/client';
import { colors } from '../../src/theme/colors';

type VerificationParams = {
  email?: string | string[];
};

export default function VerifyEmailScreen() {
  const params = useLocalSearchParams<VerificationParams>();

  const initialEmail = Array.isArray(params.email) ? (params.email[0] ?? '') : (params.email ?? '');

  const [email, setEmail] = useState(initialEmail);

  const [code, setCode] = useState('');

  const [isVerifying, setIsVerifying] = useState(false);

  const [isResending, setIsResending] = useState(false);

  const handleVerify = async () => {
    if (isVerifying || isResending) {
      return;
    }

    const result = verifyEmailSchema.safeParse({
      email,
      code,
    });

    if (!result.success) {
      Alert.alert(
        'Check your details',
        result.error.issues[0]?.message ?? 'Enter a valid email and verification code.',
      );

      return;
    }

    setIsVerifying(true);

    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email: result.data.email,
        token: result.data.code,
        type: 'email',
      });

      if (error) {
        Alert.alert('Unable to verify email', error.message);

        return;
      }

      if (!data.session) {
        Alert.alert(
          'Verification incomplete',
          'Your code was accepted, but no login session was created. Please sign in.',
          [
            {
              text: 'Go to sign in',
              onPress: () => {
                router.replace('/sign-in');
              },
            },
          ],
        );

        return;
      }

      Alert.alert('Email verified', 'Your Luniva account is ready.', [
        {
          text: 'Continue',
          onPress: () => {
            router.replace('/');
          },
        },
      ]);
    } catch {
      Alert.alert(
        'Unable to verify email',
        'Something went wrong. Check your internet connection and try again.',
      );
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResend = async () => {
    if (isVerifying || isResending) {
      return;
    }

    const emailResult = emailSchema.safeParse(email);

    if (!emailResult.success) {
      Alert.alert(
        'Check your email',
        emailResult.error.issues[0]?.message ?? 'Enter a valid email address.',
      );

      return;
    }

    setIsResending(true);

    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: emailResult.data,
      });

      if (error) {
        Alert.alert('Unable to resend code', error.message);

        return;
      }

      setCode('');

      Alert.alert('Code sent', 'A new verification code was sent to your email.');
    } catch {
      Alert.alert('Unable to resend code', 'Check your internet connection and try again.');
    } finally {
      setIsResending(false);
    }
  };

  const isBusy = isVerifying || isResending;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.keyboardView}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.logoContainer}>
          <BrandLogo size={170} />
        </View>

        <Text style={styles.eyebrow}>VERIFY YOUR EMAIL</Text>

        <Text style={styles.title}>Verify your email</Text>

        <Text style={styles.subtitle}>We sent a verification code to your email address.</Text>

        <View style={styles.form}>
          <Text style={styles.label}>Email</Text>

          <TextInput
            autoCapitalize="none"
            autoComplete="email"
            autoCorrect={false}
            editable={!isBusy}
            keyboardType="email-address"
            onChangeText={setEmail}
            placeholder="you@example.com"
            placeholderTextColor={colors.textDisabled}
            style={styles.input}
            textContentType="emailAddress"
            value={email}
          />

          <Text style={styles.label}>Verification code</Text>

          <TextInput
            autoComplete="one-time-code"
            editable={!isBusy}
            keyboardType="number-pad"
            maxLength={10}
            onChangeText={(value) => {
              setCode(value.replace(/\D/g, ''));
            }}
            onSubmitEditing={() => {
              void handleVerify();
            }}
            placeholder="Enter Code"
            placeholderTextColor={colors.textDisabled}
            returnKeyType="done"
            style={[styles.input, styles.codeInput]}
            textContentType="oneTimeCode"
            value={code}
          />

          <Pressable
            accessibilityRole="button"
            disabled={isBusy}
            onPress={() => {
              void handleVerify();
            }}
            style={({ pressed }) => [
              styles.primaryButton,
              pressed && styles.buttonPressed,
              isBusy && styles.buttonDisabled,
            ]}
          >
            {isVerifying ? (
              <ActivityIndicator color={colors.textOnPrimary} />
            ) : (
              <Text style={styles.primaryButtonText}>Verify email</Text>
            )}
          </Pressable>

          <Pressable
            accessibilityRole="button"
            disabled={isBusy}
            onPress={() => {
              void handleResend();
            }}
            style={({ pressed }) => [
              styles.secondaryButton,
              pressed && styles.buttonPressed,
              isBusy && styles.buttonDisabled,
            ]}
          >
            {isResending ? (
              <ActivityIndicator color={colors.primary} />
            ) : (
              <Text style={styles.secondaryButtonText}>Resend code</Text>
            )}
          </Pressable>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Already verified?</Text>

          <Pressable
            accessibilityRole="link"
            disabled={isBusy}
            onPress={() => {
              router.replace('/sign-in');
            }}
          >
            <Text style={styles.linkText}>Sign in</Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboardView: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 48,
  },
  eyebrow: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 1.2,
    color: colors.primary,
  },
  title: {
    marginTop: 10,
    fontSize: 34,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  subtitle: {
    marginTop: 10,
    fontSize: 16,
    lineHeight: 23,
    color: colors.textSecondary,
  },
  form: {
    marginTop: 30,
  },
  label: {
    marginBottom: 8,
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  input: {
    minHeight: 52,
    marginBottom: 18,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    backgroundColor: colors.surface,
    fontSize: 16,
    color: colors.textPrimary,
  },
  codeInput: {
    textAlign: 'center',
    fontSize: 26,
    fontWeight: '700',
    letterSpacing: 5,
  },
  primaryButton: {
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
    borderRadius: 14,
    backgroundColor: colors.primary,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textOnPrimary,
  },
  secondaryButton: {
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 14,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 14,
    backgroundColor: colors.surface,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.primary,
  },
  buttonPressed: {
    opacity: 0.86,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 28,
  },
  footerText: {
    fontSize: 15,
    color: colors.textSecondary,
  },
  linkText: {
    marginLeft: 6,
    fontSize: 15,
    fontWeight: '700',
    color: colors.primary,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 4,
  },
});
