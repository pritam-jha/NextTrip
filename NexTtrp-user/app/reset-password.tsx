/**
 * @file app/reset-password.tsx
 * @description Handles the deep-link redirect from Supabase password-reset emails.
 *
 * Flow:
 *  1. User taps "Reset Password" in email
 *  2. Supabase redirects to  nexttrp://reset-password?code=...
 *     (or  nexttrp://reset-password#access_token=...&type=recovery)
 *  3. Expo Router opens this screen
 *  4. User enters + confirms new password
 *  5. supabase.auth.updateUser({ password }) sets the new password
 *  6. Navigate to login
 *
 * The screen works whether the URL carries a PKCE code (?code=) or
 * legacy implicit tokens (#access_token=).  Supabase's session
 * listener in _layout.tsx automatically exchanges the code/tokens when
 * the app is opened via the deep-link before this screen renders.
 */

import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { supabase } from '../lib/supabase';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Colors } from '../constants/colors';

export default function ResetPasswordScreen(): React.ReactElement {
  const insets = useSafeAreaInsets();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleReset = async (): Promise<void> => {
    setError('');

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) {
        setError(updateError.message);
        return;
      }
      setSuccess(true);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <View style={[styles.root, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 20 }]}>
        <View style={styles.successBox}>
          <Text style={styles.successIcon}>✅</Text>
          <Text style={styles.successTitle}>Password updated!</Text>
          <Text style={styles.successSub}>
            Your password has been changed successfully. You can now log in with your new password.
          </Text>
          <Button
            label="Go to Login"
            onPress={() => router.replace('/(auth)/login')}
            fullWidth
            variant="primary"
            size="large"
          />
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Back */}
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.replace('/(auth)/login')}
          accessibilityRole="button"
        >
          <Ionicons name="arrow-back" size={20} color={Colors.primary} />
          <Text style={styles.backText}>Back to login</Text>
        </TouchableOpacity>

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Set new password</Text>
          <Text style={styles.subtitle}>
            Enter a new password for your account.
          </Text>
        </View>

        {/* Form */}
        <Input
          label="New Password"
          required
          value={password}
          onChangeText={(v) => { setPassword(v); setError(''); }}
          placeholder="At least 6 characters"
          secureTextEntry={!showPassword}
          autoCapitalize="none"
          rightIcon={
            <TouchableOpacity onPress={() => setShowPassword((v) => !v)} hitSlop={8}>
              <Ionicons
                name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                size={20}
                color={Colors.textSecondary}
              />
            </TouchableOpacity>
          }
        />

        <Input
          label="Confirm New Password"
          required
          value={confirmPassword}
          onChangeText={(v) => { setConfirmPassword(v); setError(''); }}
          placeholder="Repeat your new password"
          secureTextEntry={!showPassword}
          autoCapitalize="none"
        />

        {error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <Button
          label={loading ? 'Updating…' : 'Update Password'}
          onPress={() => void handleReset()}
          loading={loading}
          fullWidth
          variant="primary"
          size="large"
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.backgroundBase ?? '#FFF8F0' },
  content: { paddingHorizontal: 24, gap: 16 },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  backText: { fontSize: 14, color: Colors.primary, fontWeight: '600' },
  header: { marginBottom: 8 },
  title: { fontSize: 26, fontWeight: '800', color: Colors.navy ?? '#1A1A2E', marginBottom: 6 },
  subtitle: { fontSize: 14, color: Colors.textSecondary, lineHeight: 20 },
  errorBox: {
    backgroundColor: Colors.errorLight ?? '#FEE2E2',
    borderRadius: 10,
    padding: 12,
  },
  errorText: { color: Colors.error, fontSize: 13, lineHeight: 18 },
  successBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 16,
  },
  successIcon: { fontSize: 56 },
  successTitle: { fontSize: 24, fontWeight: '800', color: Colors.navy ?? '#1A1A2E', textAlign: 'center' },
  successSub: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center', lineHeight: 22 },
});
