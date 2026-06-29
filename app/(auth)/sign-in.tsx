import { useState } from 'react';

import { BrandLogo } from '../../src/components/BrandLogo';

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

import { Link } from 'expo-router';

import { signInSchema } from '../../src/features/auth/validation';
import { supabase } from '../../src/lib/supabase/client';
import { colors } from '../../src/theme/colors';

export default function SignInScreen() {
  const [email, setEmail] = useState('');

  const [password, setPassword] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSignIn = async () => {
    if (isSubmitting) {
      return;
    }

    const result = signInSchema.safeParse({
      email,
      password,
    });

    if (!result.success) {
      Alert.alert(
        'Check your details',
        result.error.issues[0]?.message ?? 'Enter valid login details.',
      );

      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: result.data.email,
        password: result.data.password,
      });

      if (error) {
        Alert.alert('Unable to sign in', error.message);

        return;
      }

      // AuthProvider receives the SIGNED_IN event.
      // Protected routes automatically open the app.
    } catch {
      Alert.alert(
        'Unable to sign in',
        'Something went wrong. Check your internet connection and try again.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.keyboardView}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.logoContainer}>
          <BrandLogo size={170} />
        </View>

        <Text style={styles.eyebrow}>WELCOME BACK</Text>

        <Text style={styles.title}>Welcome back</Text>

        <Text style={styles.subtitle}>Access your private wellness dashboard.</Text>

        <View style={styles.form}>
          <Text style={styles.label}>Email</Text>

          <TextInput
            autoCapitalize="none"
            autoComplete="email"
            autoCorrect={false}
            editable={!isSubmitting}
            keyboardType="email-address"
            onChangeText={setEmail}
            placeholder="you@example.com"
            placeholderTextColor={colors.textDisabled}
            returnKeyType="next"
            style={styles.input}
            textContentType="emailAddress"
            value={email}
          />

          <Text style={styles.label}>Password</Text>

          <TextInput
            autoCapitalize="none"
            autoComplete="password"
            editable={!isSubmitting}
            onChangeText={setPassword}
            onSubmitEditing={() => {
              void handleSignIn();
            }}
            placeholder="Enter your password"
            placeholderTextColor={colors.textDisabled}
            returnKeyType="done"
            secureTextEntry
            style={styles.input}
            textContentType="password"
            value={password}
          />

          <Pressable
            accessibilityRole="button"
            disabled={isSubmitting}
            onPress={() => {
              void handleSignIn();
            }}
            style={({ pressed }) => [
              styles.primaryButton,
              pressed && styles.buttonPressed,
              isSubmitting && styles.buttonDisabled,
            ]}
          >
            {isSubmitting ? (
              <ActivityIndicator color={colors.textOnPrimary} />
            ) : (
              <Text style={styles.primaryButtonText}>Sign in</Text>
            )}
          </Pressable>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>New to Luniva?</Text>

          <Link href="/sign-up" asChild>
            <Pressable accessibilityRole="link" disabled={isSubmitting}>
              <Text style={styles.linkText}>Create an account</Text>
            </Pressable>
          </Link>
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
    marginTop: 32,
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
  primaryButton: {
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    borderRadius: 14,
    backgroundColor: colors.primary,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textOnPrimary,
  },
  buttonPressed: {
    opacity: 0.86,
  },
  buttonDisabled: {
    opacity: 0.55,
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
