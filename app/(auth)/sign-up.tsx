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

import { Link, router } from 'expo-router';

import { signUpSchema } from '../../src/features/auth/validation';
import { supabase } from '../../src/lib/supabase/client';

export default function SignUpScreen() {
  const [name, setName] = useState('');

  const [email, setEmail] = useState('');

  const [password, setPassword] = useState('');

  const [confirmPassword, setConfirmPassword] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSignUp = async () => {
    if (isSubmitting) {
      return;
    }

    const result = signUpSchema.safeParse({
      name,
      email,
      password,
      confirmPassword,
    });

    if (!result.success) {
      Alert.alert(
        'Check your details',
        result.error.issues[0]?.message ?? 'Enter valid account details.',
      );

      return;
    }

    setIsSubmitting(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email: result.data.email,
        password: result.data.password,
        options: {
          data: {
            display_name: result.data.name,
          },
        },
      });

      if (error) {
        Alert.alert('Unable to create account', error.message);

        return;
      }

      //   if (!data.session) {
      //     Alert.alert(
      //       'Check your email',
      //       'Your account was created. Confirm your email, then return to Luniva and sign in.',
      //       [
      //         {
      //           text: 'Go to sign in',
      //           onPress: () => {
      //             router.replace('/sign-in');
      //           },
      //         },
      //       ],
      //     );

      //     return;
      //   }

      if (!data.session) {
        router.replace({
          pathname: '/verify-email',
          params: {
            email: result.data.email,
          },
        });

        return;
      }

      // When confirmation is disabled, Supabase creates
      // a session immediately. AuthProvider receives it
      // and Protected Routes open the dashboard.
    } catch {
      Alert.alert(
        'Unable to create account',
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
        <Text style={styles.eyebrow}>CREATE ACCOUNT</Text>

        <Text style={styles.title}>Start with Luniva</Text>

        <Text style={styles.subtitle}>
          Your personal information stays private and belongs to you.
        </Text>

        <View style={styles.form}>
          <Text style={styles.label}>Name</Text>

          <TextInput
            autoCapitalize="words"
            autoComplete="name"
            editable={!isSubmitting}
            onChangeText={setName}
            placeholder="Your name"
            placeholderTextColor="#9B929F"
            returnKeyType="next"
            style={styles.input}
            textContentType="name"
            value={name}
          />

          <Text style={styles.label}>Email</Text>

          <TextInput
            autoCapitalize="none"
            autoComplete="email"
            autoCorrect={false}
            editable={!isSubmitting}
            keyboardType="email-address"
            onChangeText={setEmail}
            placeholder="you@example.com"
            placeholderTextColor="#9B929F"
            returnKeyType="next"
            style={styles.input}
            textContentType="emailAddress"
            value={email}
          />

          <Text style={styles.label}>Password</Text>

          <TextInput
            autoCapitalize="none"
            autoComplete="new-password"
            editable={!isSubmitting}
            onChangeText={setPassword}
            placeholder="At least 8 characters"
            placeholderTextColor="#9B929F"
            returnKeyType="next"
            secureTextEntry
            style={styles.input}
            textContentType="newPassword"
            value={password}
          />

          <Text style={styles.label}>Confirm password</Text>

          <TextInput
            autoCapitalize="none"
            autoComplete="new-password"
            editable={!isSubmitting}
            onChangeText={setConfirmPassword}
            onSubmitEditing={() => {
              void handleSignUp();
            }}
            placeholder="Enter the password again"
            placeholderTextColor="#9B929F"
            returnKeyType="done"
            secureTextEntry
            style={styles.input}
            textContentType="newPassword"
            value={confirmPassword}
          />

          <Pressable
            accessibilityRole="button"
            disabled={isSubmitting}
            onPress={() => {
              void handleSignUp();
            }}
            style={({ pressed }) => [
              styles.primaryButton,
              pressed && styles.buttonPressed,
              isSubmitting && styles.buttonDisabled,
            ]}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.primaryButtonText}>Create account</Text>
            )}
          </Pressable>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Already registered?</Text>

          <Link href="/sign-in" asChild>
            <Pressable accessibilityRole="link" disabled={isSubmitting}>
              <Text style={styles.linkText}>Sign in</Text>
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
    backgroundColor: '#F8F6FB',
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
    color: '#6E3B78',
  },
  title: {
    marginTop: 10,
    fontSize: 34,
    fontWeight: '800',
    color: '#25182E',
  },
  subtitle: {
    marginTop: 10,
    fontSize: 16,
    lineHeight: 23,
    color: '#685E6D',
  },
  form: {
    marginTop: 28,
  },
  label: {
    marginBottom: 8,
    fontSize: 14,
    fontWeight: '600',
    color: '#3E3145',
  },
  input: {
    minHeight: 52,
    marginBottom: 16,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#DED6E2',
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    fontSize: 16,
    color: '#25182E',
  },
  primaryButton: {
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    borderRadius: 14,
    backgroundColor: '#6E3B78',
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  buttonPressed: {
    opacity: 0.85,
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
    color: '#685E6D',
  },
  linkText: {
    marginLeft: 6,
    fontSize: 15,
    fontWeight: '700',
    color: '#6E3B78',
  },
});
