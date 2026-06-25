import type { ComponentProps } from 'react';

import { useMemo, useState } from 'react';

import { StyleSheet, Text, View } from 'react-native';

import { Calendar } from 'react-native-calendars';

import { formatDateOnly, getTodayDateOnly } from './date';

import { buildCycleCalendarModel } from './calendar';

import type { CycleDayInsight } from './calendar';

import type { CycleOverview } from './types';

type CalendarMarkedDates = NonNullable<ComponentProps<typeof Calendar>['markedDates']>;

type CycleCalendarProps = {
  overview: CycleOverview;
};

const markerColors = {
  recordedPeriod: '#C53D4D',
  predictedPeriod: '#E88FA1',
  potentiallyFertile: '#E59B2F',
  estimatedOvulation: '#7D54A3',
  selected: '#6E3B78',
} as const;

function getMarkerForInsight(insight: CycleDayInsight) {
  switch (insight.kind) {
    case 'recorded_period':
      return {
        key: 'recorded-period',
        color: markerColors.recordedPeriod,
      };

    case 'predicted_period':
      return {
        key: 'predicted-period',
        color: markerColors.predictedPeriod,
      };

    case 'potentially_fertile':
      return {
        key: 'potentially-fertile',
        color: markerColors.potentiallyFertile,
      };

    case 'estimated_ovulation':
      return {
        key: 'estimated-ovulation',
        color: markerColors.estimatedOvulation,
      };

    default:
      return null;
  }
}

function getNeutralInsight(date: string): CycleDayInsight {
  return {
    date,
    kind: 'neutral',
    emoji: '📅',
    title: 'No special estimate',
    description: 'No period or higher-fertility estimate is assigned to this date.',
  };
}

export function CycleCalendar({ overview }: CycleCalendarProps) {
  const [selectedDate, setSelectedDate] = useState(getTodayDateOnly());

  const model = useMemo(() => buildCycleCalendarModel(overview), [overview]);

  const markedDates = useMemo<CalendarMarkedDates>(() => {
    const result: CalendarMarkedDates = {};

    for (const [date, insight] of Object.entries(model.days)) {
      const marker = getMarkerForInsight(insight);

      if (marker) {
        result[date] = {
          dots: [marker],
        };
      }
    }

    const existingSelection = result[selectedDate] ?? {};

    result[selectedDate] = {
      ...existingSelection,
      selected: true,
      selectedColor: markerColors.selected,
    };

    return result;
  }, [model.days, selectedDate]);

  const selectedInsight = model.days[selectedDate] ?? getNeutralInsight(selectedDate);

  return (
    <View style={styles.wrapper}>
      <View style={styles.calendarCard}>
        <Calendar
          current={selectedDate}
          enableSwipeMonths
          firstDay={1}
          markedDates={markedDates}
          markingType="multi-dot"
          onDayPress={(day) => {
            setSelectedDate(day.dateString);
          }}
          theme={{
            backgroundColor: '#FFFFFF',
            calendarBackground: '#FFFFFF',
            todayTextColor: '#6E3B78',
            selectedDayBackgroundColor: '#6E3B78',
            selectedDayTextColor: '#FFFFFF',
            arrowColor: '#6E3B78',
            monthTextColor: '#25182E',
            textMonthFontWeight: '700',
            textDayFontWeight: '500',
            textDayHeaderFontWeight: '600',
          }}
        />
      </View>

      <View style={styles.legendCard}>
        <Text style={styles.sectionTitle}>Calendar guide</Text>

        <LegendItem color={markerColors.recordedPeriod} emoji="🩸" label="Recorded period" />

        <LegendItem color={markerColors.predictedPeriod} emoji="🌸" label="Predicted period" />

        {model.fertilityAvailable ? (
          <>
            <LegendItem
              color={markerColors.potentiallyFertile}
              emoji="🌱"
              label="Potentially fertile"
            />

            <LegendItem
              color={markerColors.estimatedOvulation}
              emoji="✨"
              label="Estimated ovulation"
            />

            <LegendItem color="#A8B8D0" emoji="🔹" label="Lower estimated likelihood—not zero" />
          </>
        ) : null}
      </View>

      <View style={styles.selectedCard}>
        <Text style={styles.selectedDate}>{formatDateOnly(selectedDate)}</Text>

        <Text style={styles.selectedTitle}>
          {selectedInsight.emoji} {selectedInsight.title}
        </Text>

        <Text style={styles.selectedDescription}>{selectedInsight.description}</Text>
      </View>

      <View style={styles.noticeCard}>
        <Text style={styles.noticeEmoji}>ℹ️</Text>

        <View style={styles.noticeContent}>
          <Text style={styles.noticeTitle}>Fertility estimate</Text>

          <Text style={styles.noticeText}>{model.fertilityMessage}</Text>

          <Text style={styles.noticeWarning}>
            Calendar estimates are not contraception. Pregnancy may occur outside highlighted dates.
          </Text>
        </View>
      </View>

      <Text style={styles.sectionHeading}>Upcoming</Text>

      <View style={styles.listCard}>
        {model.upcoming.length > 0 ? (
          model.upcoming.map((item, index) => (
            <View key={item.id}>
              <View style={styles.upcomingRow}>
                <Text style={styles.upcomingEmoji}>{item.emoji}</Text>

                <View style={styles.upcomingContent}>
                  <Text style={styles.upcomingTitle}>{item.title}</Text>

                  <Text style={styles.upcomingDate}>
                    {formatDateOnly(item.date)}
                    {item.endDate ? ` – ${formatDateOnly(item.endDate)}` : ''}
                  </Text>

                  <Text style={styles.upcomingDescription}>{item.description}</Text>
                </View>
              </View>

              {index < model.upcoming.length - 1 ? <View style={styles.divider} /> : null}
            </View>
          ))
        ) : (
          <Text style={styles.emptyText}>No upcoming estimates are available yet.</Text>
        )}
      </View>

      <Text style={styles.sectionHeading}>Period history</Text>

      <View style={styles.listCard}>
        {overview.periodEntries.length > 0 ? (
          overview.periodEntries.slice(0, 6).map((entry, index) => (
            <View key={entry.id}>
              <View style={styles.historyRow}>
                <Text style={styles.historyEmoji}>🩸</Text>

                <View style={styles.historyContent}>
                  <Text style={styles.historyTitle}>Period</Text>

                  <Text style={styles.historyDate}>
                    {formatDateOnly(entry.started_on)}
                    {entry.ended_on ? ` – ${formatDateOnly(entry.ended_on)}` : ' — start recorded'}
                  </Text>
                </View>
              </View>

              {index < Math.min(overview.periodEntries.length, 6) - 1 ? (
                <View style={styles.divider} />
              ) : null}
            </View>
          ))
        ) : (
          <Text style={styles.emptyText}>No period history has been recorded.</Text>
        )}
      </View>
    </View>
  );
}

type LegendItemProps = {
  emoji: string;
  label: string;
  color: string;
};

function LegendItem({ emoji, label, color }: LegendItemProps) {
  return (
    <View style={styles.legendRow}>
      <View
        style={[
          styles.legendDot,
          {
            backgroundColor: color,
          },
        ]}
      />

      <Text style={styles.legendEmoji}>{emoji}</Text>

      <Text style={styles.legendLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginTop: 24,
  },
  calendarCard: {
    overflow: 'hidden',
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
  },
  legendCard: {
    marginTop: 14,
    padding: 18,
    borderRadius: 17,
    backgroundColor: '#FFFFFF',
  },
  sectionTitle: {
    marginBottom: 6,
    fontSize: 16,
    fontWeight: '700',
    color: '#25182E',
  },
  legendRow: {
    minHeight: 34,
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
  },
  legendEmoji: {
    marginLeft: 10,
    fontSize: 17,
  },
  legendLabel: {
    marginLeft: 8,
    fontSize: 14,
    color: '#3E3145',
  },
  selectedCard: {
    marginTop: 14,
    padding: 19,
    borderRadius: 17,
    backgroundColor: '#F0E7F3',
  },
  selectedDate: {
    fontSize: 13,
    fontWeight: '700',
    color: '#6E3B78',
  },
  selectedTitle: {
    marginTop: 8,
    fontSize: 19,
    fontWeight: '700',
    color: '#25182E',
  },
  selectedDescription: {
    marginTop: 7,
    fontSize: 14,
    lineHeight: 21,
    color: '#685E6D',
  },
  noticeCard: {
    flexDirection: 'row',
    marginTop: 14,
    padding: 17,
    borderRadius: 17,
    backgroundColor: '#FFF7E7',
  },
  noticeEmoji: {
    fontSize: 21,
  },
  noticeContent: {
    flex: 1,
    marginLeft: 11,
  },
  noticeTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#614918',
  },
  noticeText: {
    marginTop: 5,
    fontSize: 13,
    lineHeight: 19,
    color: '#79612A',
  },
  noticeWarning: {
    marginTop: 8,
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 19,
    color: '#8A4D26',
  },
  sectionHeading: {
    marginTop: 25,
    marginBottom: 10,
    fontSize: 19,
    fontWeight: '700',
    color: '#25182E',
  },
  listCard: {
    paddingHorizontal: 18,
    borderRadius: 17,
    backgroundColor: '#FFFFFF',
  },
  upcomingRow: {
    flexDirection: 'row',
    paddingVertical: 16,
  },
  upcomingEmoji: {
    width: 32,
    fontSize: 21,
  },
  upcomingContent: {
    flex: 1,
  },
  upcomingTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#25182E',
  },
  upcomingDate: {
    marginTop: 4,
    fontSize: 14,
    fontWeight: '600',
    color: '#6E3B78',
  },
  upcomingDescription: {
    marginTop: 4,
    fontSize: 13,
    lineHeight: 18,
    color: '#685E6D',
  },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
  },
  historyEmoji: {
    width: 32,
    fontSize: 21,
  },
  historyContent: {
    flex: 1,
  },
  historyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#25182E',
  },
  historyDate: {
    marginTop: 4,
    fontSize: 14,
    color: '#685E6D',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#E7E0E9',
  },
  emptyText: {
    paddingVertical: 20,
    fontSize: 14,
    lineHeight: 20,
    color: '#807585',
  },
});
