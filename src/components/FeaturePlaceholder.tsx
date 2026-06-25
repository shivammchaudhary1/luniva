import type { ComponentProps } from 'react';

import { SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';

import Ionicons from '@expo/vector-icons/Ionicons';

type IconName = ComponentProps<typeof Ionicons>['name'];

type FeaturePlaceholderProps = {
  eyebrow: string;
  title: string;
  description: string;
  nextStep: string;
  icon: IconName;
};

export function FeaturePlaceholder({
  eyebrow,
  title,
  description,
  nextStep,
  icon,
}: FeaturePlaceholderProps) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <Text style={styles.eyebrow}>{eyebrow}</Text>

        <Text style={styles.title}>{title}</Text>

        <Text style={styles.description}>{description}</Text>

        <View style={styles.card}>
          <View style={styles.iconContainer}>
            <Ionicons color="#6E3B78" name={icon} size={32} />
          </View>

          <Text style={styles.cardTitle}>Module foundation ready</Text>

          <Text style={styles.cardDescription}>{nextStep}</Text>
        </View>

        <View style={styles.privacyCard}>
          <Ionicons color="#1D8A57" name="shield-checkmark-outline" size={22} />

          <Text style={styles.privacyText}>
            Your information remains private and protected by your authenticated account.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8F6FB',
  },
  container: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 38,
    paddingBottom: 40,
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
  description: {
    marginTop: 10,
    fontSize: 16,
    lineHeight: 24,
    color: '#685E6D',
  },
  card: {
    alignItems: 'center',
    marginTop: 30,
    paddingHorizontal: 24,
    paddingVertical: 34,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
  },
  iconContainer: {
    width: 68,
    height: 68,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 34,
    backgroundColor: '#F0E7F3',
  },
  cardTitle: {
    marginTop: 20,
    fontSize: 19,
    fontWeight: '700',
    textAlign: 'center',
    color: '#25182E',
  },
  cardDescription: {
    marginTop: 9,
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    color: '#685E6D',
  },
  privacyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
    padding: 18,
    borderRadius: 16,
    backgroundColor: '#EAF6F0',
  },
  privacyText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 14,
    lineHeight: 20,
    color: '#286347',
  },
});
