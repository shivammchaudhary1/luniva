import { SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';

import Ionicons from '@expo/vector-icons/Ionicons';

import { BrandLogo } from '../../../src/components/BrandLogo';

import { PartnerAliasManager } from '../../../src/features/journal/PartnerAliasManager';

import { colors } from '../../../src/theme/colors';

export default function JournalScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.logoContainer}>
          <BrandLogo size={105} />
        </View>

        <Text style={styles.eyebrow}>PRIVATE JOURNAL</Text>

        <Text style={styles.title}>Your private space</Text>

        <Text style={styles.subtitle}>
          Create discreet aliases before recording personal journal entries.
        </Text>

        <View style={styles.privacyCard}>
          <View style={styles.privacyIcon}>
            <Ionicons color={colors.primary} name="lock-closed" size={25} />
          </View>

          <View style={styles.privacyContent}>
            <Text style={styles.privacyTitle}>Private by default</Text>

            <Text style={styles.privacyText}>
              Aliases remain inside your authenticated account. No contact is searched, connected,
              or notified.
            </Text>
          </View>
        </View>

        <PartnerAliasManager />

        <View style={styles.nextCard}>
          <Text style={styles.nextEyebrow}>NEXT JOURNAL STEP</Text>

          <Text style={styles.nextTitle}>Private journal entries</Text>

          <Text style={styles.nextText}>
            After aliases are verified, the next step will add date, approximate time, general
            location, protection, mood, tags, and optional private notes.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    paddingHorizontal: 24,
    paddingTop: 25,
    paddingBottom: 50,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 5,
  },
  eyebrow: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 1.2,
    color: colors.primary,
  },
  title: {
    marginTop: 8,
    fontSize: 34,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  subtitle: {
    marginTop: 9,
    fontSize: 16,
    lineHeight: 23,
    color: colors.textSecondary,
  },
  privacyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 24,
    padding: 18,
    borderRadius: 18,
    backgroundColor: colors.primarySurface,
  },
  privacyIcon: {
    width: 50,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 25,
    backgroundColor: colors.surface,
  },
  privacyContent: {
    flex: 1,
    marginLeft: 13,
  },
  privacyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  privacyText: {
    marginTop: 5,
    fontSize: 13,
    lineHeight: 19,
    color: colors.textSecondary,
  },
  nextCard: {
    marginTop: 28,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 18,
    backgroundColor: colors.surface,
  },
  nextEyebrow: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    color: colors.primary,
  },
  nextTitle: {
    marginTop: 8,
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  nextText: {
    marginTop: 7,
    fontSize: 14,
    lineHeight: 21,
    color: colors.textSecondary,
  },
});
