import { useMemo } from 'react';

import { StyleSheet, Text, View } from 'react-native';

import { formatDateOnly } from '../../lib/date';

import { colors } from '../../theme/colors';

import { buildJournalInsights } from './journalInsightsLogic';

import type { CountedInsight } from './journalInsightsLogic';

import type { IntimacyEntryWithAlias, JournalMood, ProtectionMethod } from './types';

type JournalInsightsProps = {
  entries: IntimacyEntryWithAlias[];
};

const protectionLabels: Record<ProtectionMethod | 'not_recorded', string> = {
  barrier: 'Barrier',
  hormonal: 'Hormonal',
  barrier_and_hormonal: 'Barrier + hormonal',
  other: 'Other',
  none_recorded: 'None recorded',
  prefer_not_to_say: 'Prefer not to say',
  not_recorded: 'Not recorded',
};

const moodLabels: Record<JournalMood | 'not_recorded', string> = {
  very_low: '😞 Very low',
  low: '🙁 Low',
  neutral: '😐 Neutral',
  good: '🙂 Good',
  very_good: '😊 Very good',
  prefer_not_to_say: 'Prefer not to say',
  not_recorded: 'Not recorded',
};

export function JournalInsights({ entries }: JournalInsightsProps) {
  const insights = useMemo(() => buildJournalInsights(entries), [entries]);

  if (entries.length === 0) {
    return (
      <View style={styles.emptyCard}>
        <Text style={styles.emptyEmoji}>📊</Text>

        <Text style={styles.emptyTitle}>No insights yet</Text>

        <Text style={styles.emptyText}>Insights will appear after you save private entries.</Text>
      </View>
    );
  }

  return (
    <View style={styles.wrapper}>
      <Text style={styles.intro}>
        These summaries describe your saved entries. They are private patterns, not medical or
        relationship advice.
      </Text>

      <View style={styles.statGrid}>
        <StatCard label="Total entries" value={String(insights.totalEntries)} />

        <StatCard label="This month" value={String(insights.currentMonthEntries)} />
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Latest entry</Text>

        <Text style={styles.latestValue}>
          {insights.latestEntryDate ? formatDateOnly(insights.latestEntryDate) : 'No entry'}
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Last six months</Text>

        {insights.monthlyActivity.map((item) => (
          <InsightRow key={item.monthKey} label={item.label} value={item.count} />
        ))}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Entries by alias</Text>

        <CountList
          emptyText="No alias information recorded."
          items={insights.aliasBreakdown}
          labelForValue={(value) => value}
        />
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Protection summary</Text>

        <CountList
          emptyText="No protection information recorded."
          items={insights.protectionBreakdown}
          labelForValue={(value) => protectionLabels[value]}
        />

        <Text style={styles.disclaimer}>
          Protection records are informational and do not confirm pregnancy or STI outcomes.
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Mood after</Text>

        <CountList
          emptyText="No mood information recorded."
          items={insights.moodAfterBreakdown}
          labelForValue={(value) => moodLabels[value]}
        />
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Common tags</Text>

        {insights.topTags.length > 0 ? (
          <View style={styles.tagContainer}>
            {insights.topTags.map((item) => (
              <View key={item.value} style={styles.tag}>
                <Text style={styles.tagText}>
                  {item.value} · {item.count}
                </Text>
              </View>
            ))}
          </View>
        ) : (
          <Text style={styles.emptyListText}>No tags recorded.</Text>
        )}
      </View>

      <View style={styles.privacyCard}>
        <Text style={styles.privacyTitle}>🔒 Private insights</Text>

        <Text style={styles.privacyText}>
          These summaries remain inside your authenticated Journal and are not included in partner
          sharing.
        </Text>
      </View>
    </View>
  );
}

type StatCardProps = {
  label: string;
  value: string;
};

function StatCard({ label, value }: StatCardProps) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statValue}>{value}</Text>

      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

type InsightRowProps = {
  label: string;
  value: number;
};

function InsightRow({ label, value }: InsightRowProps) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>

      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

type CountListProps<Value extends string> = {
  items: CountedInsight<Value>[];
  emptyText: string;
  labelForValue: (value: Value) => string;
};

function CountList<Value extends string>({
  items,
  emptyText,
  labelForValue,
}: CountListProps<Value>) {
  if (items.length === 0) {
    return <Text style={styles.emptyListText}>{emptyText}</Text>;
  }

  return (
    <>
      {items.map((item) => (
        <InsightRow key={item.value} label={labelForValue(item.value)} value={item.count} />
      ))}
    </>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginTop: 17,
  },
  intro: {
    fontSize: 14,
    lineHeight: 21,
    color: colors.textSecondary,
  },
  statGrid: {
    flexDirection: 'row',
    marginTop: 16,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 4,
    paddingVertical: 20,
    borderRadius: 17,
    backgroundColor: colors.surface,
  },
  statValue: {
    fontSize: 27,
    fontWeight: '800',
    color: colors.primary,
  },
  statLabel: {
    marginTop: 5,
    fontSize: 12,
    color: colors.textMuted,
  },
  card: {
    marginTop: 14,
    padding: 18,
    borderRadius: 17,
    backgroundColor: colors.surface,
  },
  cardTitle: {
    marginBottom: 8,
    fontSize: 17,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  latestValue: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.primary,
  },
  row: {
    minHeight: 42,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.divider,
  },
  rowLabel: {
    flex: 1,
    paddingRight: 12,
    fontSize: 13,
    color: colors.textSecondary,
  },
  rowValue: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primary,
  },
  disclaimer: {
    marginTop: 13,
    padding: 12,
    borderRadius: 11,
    backgroundColor: colors.warningSurface,
    fontSize: 12,
    lineHeight: 18,
    color: colors.warning,
  },
  tagContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  tag: {
    marginRight: 8,
    marginBottom: 8,
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 15,
    backgroundColor: colors.primarySurface,
  },
  tagText: {
    fontSize: 12,
    color: colors.primary,
  },
  privacyCard: {
    marginTop: 14,
    padding: 17,
    borderRadius: 17,
    backgroundColor: colors.primarySurface,
  },
  privacyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  privacyText: {
    marginTop: 6,
    fontSize: 13,
    lineHeight: 19,
    color: colors.textSecondary,
  },
  emptyCard: {
    alignItems: 'center',
    marginTop: 17,
    padding: 30,
    borderRadius: 17,
    backgroundColor: colors.surface,
  },
  emptyEmoji: {
    fontSize: 31,
  },
  emptyTitle: {
    marginTop: 10,
    fontSize: 17,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  emptyText: {
    marginTop: 6,
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
    color: colors.textSecondary,
  },
  emptyListText: {
    paddingVertical: 10,
    fontSize: 13,
    color: colors.textMuted,
  },
});
