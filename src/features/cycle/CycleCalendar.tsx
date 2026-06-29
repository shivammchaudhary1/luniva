import type { ComponentProps } from 'react';

import { useMemo, useState } from 'react';

import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Calendar } from 'react-native-calendars';

import { addDaysToDateOnly, formatDateOnly, getTodayDateOnly } from './date';

import { buildCycleCalendarModel } from './calendar';

import type { CycleDayInsight, UpcomingCycleItem } from './calendar';

import type { CycleOverview, PeriodEntry } from './types';

import { PeriodHistoryManager } from './PeriodHistoryManager';
import { colors } from '../../theme/colors';

type CalendarMarkedDates = NonNullable<ComponentProps<typeof Calendar>['markedDates']>;

type CycleViewMode = 'calendar' | 'list' | 'guide';

type CycleCalendarProps = {
  overview: CycleOverview;
  onDataChanged: () => Promise<void>;
  onPeriodSaved: (periodEntry: PeriodEntry) => void;
  onPeriodDeleted: (periodEntryId: string) => void;
};

const markerColors = {
  recordedPeriod: colors.periodRecorded,
  predictedPeriod: colors.periodPredicted,
  potentiallyFertile: colors.fertility,
  estimatedOvulation: colors.ovulation,
  lowerLikelihood: colors.lowerLikelihood,
  selected: colors.primary,
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
    description:
      'No recorded period, predicted period, or higher-fertility estimate is assigned to this date.',
  };
}

function getPeriodEnd(entry: PeriodEntry, typicalPeriodLength: number): string {
  return (
    entry.ended_on ?? addDaysToDateOnly(entry.started_on, Math.max(typicalPeriodLength, 1) - 1)
  );
}

function formatDateRange(startDate: string, endDate: string | null): string {
  if (!endDate || endDate === startDate) {
    return formatDateOnly(startDate);
  }

  return `${formatDateOnly(startDate)} – ${formatDateOnly(endDate)}`;
}

export function CycleCalendar({
  overview,
  onDataChanged,
  onPeriodSaved,
  onPeriodDeleted,
}: CycleCalendarProps) {
  const [selectedDate, setSelectedDate] = useState(getTodayDateOnly());

  const [viewMode, setViewMode] = useState<CycleViewMode>('calendar');

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
      <View style={styles.viewSelector}>
        <ViewModeButton
          emoji="📅"
          isSelected={viewMode === 'calendar'}
          label="Calendar"
          onPress={() => {
            setViewMode('calendar');
          }}
        />

        <ViewModeButton
          emoji="📋"
          isSelected={viewMode === 'list'}
          label="List"
          onPress={() => {
            setViewMode('list');
          }}
        />

        <ViewModeButton
          emoji="ℹ️"
          isSelected={viewMode === 'guide'}
          label="Guide"
          onPress={() => {
            setViewMode('guide');
          }}
        />
      </View>

      {viewMode === 'calendar' ? (
        <CalendarView
          markedDates={markedDates}
          model={model}
          onSelectDate={setSelectedDate}
          overview={overview}
          selectedDate={selectedDate}
          selectedInsight={selectedInsight}
        />
      ) : null}

      {viewMode === 'list' ? (
        <ListView
          model={model}
          onDataChanged={onDataChanged}
          onPeriodDeleted={onPeriodDeleted}
          onPeriodSaved={onPeriodSaved}
          overview={overview}
        />
      ) : null}

      {viewMode === 'guide' ? (
        <GuideView
          fertilityAvailable={model.fertilityAvailable}
          fertilityMessage={model.fertilityMessage}
        />
      ) : null}
    </View>
  );
}

type ViewModeButtonProps = {
  emoji: string;
  label: string;
  isSelected: boolean;
  onPress: () => void;
};

function ViewModeButton({ emoji, label, isSelected, onPress }: ViewModeButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{
        selected: isSelected,
      }}
      onPress={onPress}
      style={[styles.viewButton, isSelected && styles.viewButtonSelected]}
    >
      <Text style={styles.viewButtonEmoji}>{emoji}</Text>

      <Text style={[styles.viewButtonText, isSelected && styles.viewButtonTextSelected]}>
        {label}
      </Text>
    </Pressable>
  );
}

type CalendarViewProps = {
  markedDates: CalendarMarkedDates;
  model: ReturnType<typeof buildCycleCalendarModel>;
  overview: CycleOverview;
  selectedDate: string;
  selectedInsight: CycleDayInsight;
  onSelectDate: (date: string) => void;
};

function CalendarView({
  markedDates,
  model,
  overview,
  selectedDate,
  selectedInsight,
  onSelectDate,
}: CalendarViewProps) {
  return (
    <>
      <View style={styles.calendarCard}>
        <Calendar
          current={selectedDate}
          enableSwipeMonths
          firstDay={1}
          markedDates={markedDates}
          markingType="multi-dot"
          onDayPress={(day) => {
            onSelectDate(day.dateString);
          }}
          theme={{
            backgroundColor: colors.surface,
            calendarBackground: colors.surface,
            todayTextColor: colors.primary,
            selectedDayBackgroundColor: colors.primary,
            selectedDayTextColor: colors.textOnPrimary,
            arrowColor: colors.primary,
            monthTextColor: colors.textPrimary,
            textMonthFontWeight: '700',
            textDayFontWeight: '500',
            textDayHeaderFontWeight: '600',
          }}
        />
      </View>

      <View style={styles.selectedCard}>
        <Text style={styles.selectedDate}>{formatDateOnly(selectedDate)}</Text>

        <Text style={styles.selectedTitle}>
          {selectedInsight.emoji} {selectedInsight.title}
        </Text>

        <Text style={styles.selectedDescription}>{selectedInsight.description}</Text>
      </View>

      <SafetyNotice fertilityMessage={model.fertilityMessage} />

      <Text style={styles.sectionHeading}>Upcoming</Text>

      <UpcomingCards upcoming={model.upcoming} />

      <Text style={styles.sectionHeading}>Period history</Text>

      <HistoryCards overview={overview} />
    </>
  );
}

type ListViewProps = {
  model: ReturnType<typeof buildCycleCalendarModel>;
  overview: CycleOverview;
  onDataChanged: () => Promise<void>;
  onPeriodSaved: (periodEntry: PeriodEntry) => void;
  onPeriodDeleted: (periodEntryId: string) => void;
};

function ListView({
  model,
  overview,
  onDataChanged,
  onPeriodSaved,
  onPeriodDeleted,
}: ListViewProps) {
  const typicalPeriodLength = overview.preferences?.typical_period_length ?? 1;

  return (
    <>
      <Text style={styles.listIntro}>
        View upcoming estimates and recorded periods in a table-style format.
      </Text>

      <Text style={styles.sectionHeading}>Upcoming events</Text>

      <View style={styles.table}>
        <View style={styles.tableHeader}>
          <Text style={[styles.tableHeaderText, styles.eventColumn]}>Event</Text>

          <Text style={[styles.tableHeaderText, styles.dateColumn]}>Date</Text>
        </View>

        {model.upcoming.length > 0 ? (
          model.upcoming.map((item, index) => (
            <UpcomingTableRow
              isLast={index === model.upcoming.length - 1}
              item={item}
              key={item.id}
            />
          ))
        ) : (
          <Text style={styles.emptyText}>No upcoming estimates are available.</Text>
        )}
      </View>

      <Text style={styles.sectionHeading}>Recorded periods</Text>

      <View style={styles.table}>
        <View style={styles.tableHeader}>
          <Text style={[styles.tableHeaderText, styles.eventColumn]}>Record</Text>

          <Text style={[styles.tableHeaderText, styles.dateColumn]}>Date range</Text>
        </View>

        {overview.periodEntries.length > 0 ? (
          overview.periodEntries.map((entry, index) => {
            const endDate = getPeriodEnd(entry, typicalPeriodLength);

            return (
              <View
                key={entry.id}
                style={[
                  styles.tableRow,
                  index !== overview.periodEntries.length - 1 && styles.tableRowBorder,
                ]}
              >
                <View style={styles.eventColumn}>
                  <Text style={styles.tableEventTitle}>🩸 Period</Text>

                  <Text style={styles.tableDescription}>
                    {entry.ended_on ? 'Recorded range' : 'Range based on typical duration'}
                  </Text>
                </View>

                <Text style={[styles.tableDateText, styles.dateColumn]}>
                  {formatDateRange(entry.started_on, endDate)}
                </Text>
              </View>
            );
          })
        ) : (
          <Text style={styles.emptyText}>No periods have been recorded.</Text>
        )}
      </View>

      <SafetyNotice fertilityMessage={model.fertilityMessage} />
      <PeriodHistoryManager
        onDataChanged={onDataChanged}
        onPeriodDeleted={onPeriodDeleted}
        onPeriodSaved={onPeriodSaved}
        periodEntries={overview.periodEntries}
      />
    </>
  );
}

type UpcomingTableRowProps = {
  item: UpcomingCycleItem;
  isLast: boolean;
};

function UpcomingTableRow({ item, isLast }: UpcomingTableRowProps) {
  return (
    <View style={[styles.tableRow, !isLast && styles.tableRowBorder]}>
      <View style={styles.eventColumn}>
        <Text style={styles.tableEventTitle}>
          {item.emoji} {item.title}
        </Text>

        <Text style={styles.tableDescription}>{item.description}</Text>
      </View>

      <Text style={[styles.tableDateText, styles.dateColumn]}>
        {formatDateRange(item.date, item.endDate)}
      </Text>
    </View>
  );
}

type GuideViewProps = {
  fertilityAvailable: boolean;
  fertilityMessage: string;
};

function GuideView({ fertilityAvailable, fertilityMessage }: GuideViewProps) {
  return (
    <>
      <View style={styles.guideCard}>
        <Text style={styles.guideTitle}>Calendar guide</Text>

        <GuideRow
          color={markerColors.recordedPeriod}
          description="Dates saved as part of a recorded bleeding range."
          emoji="🩸"
          title="Recorded period"
        />

        <GuideRow
          color={markerColors.predictedPeriod}
          description="Estimated upcoming period dates based on cycle history."
          emoji="🌸"
          title="Predicted period"
        />

        {fertilityAvailable ? (
          <>
            <GuideRow
              color={markerColors.potentiallyFertile}
              description="Calendar-estimated dates with a potentially higher likelihood of conception."
              emoji="🌱"
              title="Potentially fertile"
            />

            <GuideRow
              color={markerColors.estimatedOvulation}
              description="Approximate ovulation estimate based on cycle timing."
              emoji="✨"
              title="Estimated ovulation"
            />

            <GuideRow
              color={markerColors.lowerLikelihood}
              description="Lower estimated likelihood does not mean pregnancy is impossible."
              emoji="🔹"
              title="Lower estimated likelihood"
            />
          </>
        ) : null}
      </View>

      <View style={styles.guideCard}>
        <Text style={styles.guideTitle}>Understanding estimates</Text>

        <Text style={styles.guideParagraph}>{fertilityMessage}</Text>

        <Text style={styles.guideParagraph}>
          Cycle dates may change because of stress, illness, travel, medication, sleep, hormonal
          changes, and other factors.
        </Text>

        <Text style={styles.guideWarning}>
          ⚠️ Do not use “lower likelihood” dates as guaranteed safe days. Calendar predictions are
          not a contraceptive method or medical diagnosis.
        </Text>
      </View>

      <View style={styles.guideCard}>
        <Text style={styles.guideTitle}>Date format</Text>

        <Text style={styles.guideParagraph}>
          All dates in Luniva are displayed using DD/MM/YYYY.
        </Text>

        <Text style={styles.guideExample}>Example: 15/06/2026</Text>
      </View>
    </>
  );
}

type GuideRowProps = {
  color: string;
  emoji: string;
  title: string;
  description: string;
};

function GuideRow({ color, emoji, title, description }: GuideRowProps) {
  return (
    <View style={styles.guideRow}>
      <View
        style={[
          styles.guideColor,
          {
            backgroundColor: color,
          },
        ]}
      />

      <Text style={styles.guideEmoji}>{emoji}</Text>

      <View style={styles.guideContent}>
        <Text style={styles.guideRowTitle}>{title}</Text>

        <Text style={styles.guideDescription}>{description}</Text>
      </View>
    </View>
  );
}

type UpcomingCardsProps = {
  upcoming: UpcomingCycleItem[];
};

function UpcomingCards({ upcoming }: UpcomingCardsProps) {
  return (
    <View style={styles.listCard}>
      {upcoming.length > 0 ? (
        upcoming.map((item, index) => (
          <View key={item.id}>
            <View style={styles.upcomingRow}>
              <Text style={styles.upcomingEmoji}>{item.emoji}</Text>

              <View style={styles.upcomingContent}>
                <Text style={styles.upcomingTitle}>{item.title}</Text>

                <Text style={styles.upcomingDate}>{formatDateRange(item.date, item.endDate)}</Text>

                <Text style={styles.upcomingDescription}>{item.description}</Text>
              </View>
            </View>

            {index < upcoming.length - 1 ? <View style={styles.divider} /> : null}
          </View>
        ))
      ) : (
        <Text style={styles.emptyText}>No upcoming estimates are available yet.</Text>
      )}
    </View>
  );
}

type HistoryCardsProps = {
  overview: CycleOverview;
};

function HistoryCards({ overview }: HistoryCardsProps) {
  const typicalPeriodLength = overview.preferences?.typical_period_length ?? 1;

  return (
    <View style={styles.listCard}>
      {overview.periodEntries.length > 0 ? (
        overview.periodEntries.slice(0, 6).map((entry, index) => {
          const endDate = getPeriodEnd(entry, typicalPeriodLength);

          return (
            <View key={entry.id}>
              <View style={styles.historyRow}>
                <Text style={styles.historyEmoji}>🩸</Text>

                <View style={styles.historyContent}>
                  <Text style={styles.historyTitle}>Period</Text>

                  <Text style={styles.historyDate}>
                    {formatDateRange(entry.started_on, endDate)}
                  </Text>
                </View>
              </View>

              {index < Math.min(overview.periodEntries.length, 6) - 1 ? (
                <View style={styles.divider} />
              ) : null}
            </View>
          );
        })
      ) : (
        <Text style={styles.emptyText}>No period history has been recorded.</Text>
      )}
    </View>
  );
}

type SafetyNoticeProps = {
  fertilityMessage: string;
};

function SafetyNotice({ fertilityMessage }: SafetyNoticeProps) {
  return (
    <View style={styles.noticeCard}>
      <Text style={styles.noticeEmoji}>ℹ️</Text>

      <View style={styles.noticeContent}>
        <Text style={styles.noticeTitle}>Fertility estimate</Text>

        <Text style={styles.noticeText}>{fertilityMessage}</Text>

        <Text style={styles.noticeWarning}>
          Calendar estimates are not contraception. Pregnancy may occur outside highlighted dates.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginTop: 24,
  },
  viewSelector: {
    flexDirection: 'row',
    padding: 4,
    borderRadius: 15,
    backgroundColor: colors.surfaceMuted,
  },
  viewButton: {
    flex: 1,
    minHeight: 46,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
  },
  viewButtonSelected: {
    backgroundColor: colors.surface,
  },
  viewButtonEmoji: {
    fontSize: 16,
  },
  viewButtonText: {
    marginLeft: 6,
    fontSize: 13,
    fontWeight: '600',
    color: colors.textMuted,
  },
  viewButtonTextSelected: {
    color: colors.primary,
  },
  calendarCard: {
    overflow: 'hidden',
    marginTop: 16,
    borderRadius: 20,
    backgroundColor: colors.surface,
  },
  selectedCard: {
    marginTop: 14,
    padding: 19,
    borderRadius: 17,
    backgroundColor: colors.primarySurface,
  },
  selectedDate: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
  },
  selectedTitle: {
    marginTop: 8,
    fontSize: 19,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  selectedDescription: {
    marginTop: 7,
    fontSize: 14,
    lineHeight: 21,
    color: colors.textSecondary,
  },
  noticeCard: {
    flexDirection: 'row',
    marginTop: 14,
    padding: 17,
    borderRadius: 17,
    backgroundColor: colors.warningSurface,
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
    color: colors.warning,
  },
  noticeText: {
    marginTop: 5,
    fontSize: 13,
    lineHeight: 19,
    color: colors.warning,
  },
  noticeWarning: {
    marginTop: 8,
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 19,
    color: colors.warning,
  },
  sectionHeading: {
    marginTop: 25,
    marginBottom: 10,
    fontSize: 19,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  listIntro: {
    marginTop: 18,
    fontSize: 15,
    lineHeight: 22,
    color: colors.textSecondary,
  },
  listCard: {
    paddingHorizontal: 18,
    borderRadius: 17,
    backgroundColor: colors.surface,
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
    color: colors.textPrimary,
  },
  upcomingDate: {
    marginTop: 4,
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  upcomingDescription: {
    marginTop: 4,
    fontSize: 13,
    lineHeight: 18,
    color: colors.textSecondary,
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
    color: colors.textPrimary,
  },
  historyDate: {
    marginTop: 4,
    fontSize: 14,
    color: colors.textSecondary,
  },
  table: {
    overflow: 'hidden',
    borderRadius: 17,
    backgroundColor: colors.surface,
  },
  tableHeader: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 13,
    backgroundColor: colors.primarySurface,
  },
  tableHeaderText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.4,
    color: colors.primary,
  },
  tableRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 15,
  },
  tableRowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.divider,
  },
  eventColumn: {
    flex: 1.25,
    paddingRight: 10,
  },
  dateColumn: {
    flex: 1,
  },
  tableEventTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  tableDescription: {
    marginTop: 4,
    fontSize: 12,
    lineHeight: 17,
    color: colors.textMuted,
  },
  tableDateText: {
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 19,
    textAlign: 'right',
    color: colors.textSecondary,
  },
  guideCard: {
    marginTop: 16,
    padding: 18,
    borderRadius: 17,
    backgroundColor: colors.surface,
  },
  guideTitle: {
    marginBottom: 6,
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  guideRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 15,
  },
  guideColor: {
    width: 10,
    height: 10,
    marginTop: 6,
    borderRadius: 5,
  },
  guideEmoji: {
    marginLeft: 10,
    fontSize: 18,
  },
  guideContent: {
    flex: 1,
    marginLeft: 9,
  },
  guideRowTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  guideDescription: {
    marginTop: 3,
    fontSize: 13,
    lineHeight: 19,
    color: colors.textSecondary,
  },
  guideParagraph: {
    marginTop: 11,
    fontSize: 14,
    lineHeight: 21,
    color: colors.textSecondary,
  },
  guideWarning: {
    marginTop: 14,
    padding: 14,
    borderRadius: 12,
    backgroundColor: colors.warningSurface,
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 20,
    color: colors.warning,
  },
  guideExample: {
    marginTop: 10,
    fontSize: 16,
    fontWeight: '700',
    color: colors.primary,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.divider,
  },
  emptyText: {
    padding: 20,
    fontSize: 14,
    lineHeight: 20,
    color: colors.textMuted,
  },
});
