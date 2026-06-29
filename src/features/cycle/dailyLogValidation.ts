import { z } from 'zod';

import { getTodayDateOnly, parseDisplayDateToDateOnly } from '../../lib/date';

export const cycleFlowLevels = ['spotting', 'light', 'medium', 'heavy'] as const;

export const cycleDailyMoods = ['very_low', 'low', 'neutral', 'good', 'very_good'] as const;

export const cycleEnergyLevels = ['very_low', 'low', 'medium', 'high', 'very_high'] as const;

export const cycleSymptoms = [
  'cramps',
  'bloating',
  'headache',
  'backache',
  'fatigue',
  'breast_tenderness',
  'nausea',
  'acne',
  'cravings',
  'mood_changes',
  'sleep_changes',
  'other',
] as const;

const loggedOnSchema = z
  .string()
  .trim()
  .regex(/^\d{2}\/\d{2}\/\d{4}$/, 'Use the date format DD/MM/YYYY.')
  .superRefine((value, context) => {
    const internalDate = parseDisplayDateToDateOnly(value);

    if (!internalDate) {
      context.addIssue({
        code: 'custom',
        message: 'Enter a valid calendar date.',
      });

      return;
    }

    if (internalDate > getTodayDateOnly()) {
      context.addIssue({
        code: 'custom',
        message: 'A daily log cannot be recorded for a future date.',
      });
    }
  })
  .transform((value) => parseDisplayDateToDateOnly(value) ?? value);

export const dailyCycleLogSchema = z.object({
  loggedOn: loggedOnSchema,

  flowLevel: z.enum(cycleFlowLevels).nullable(),

  mood: z.enum(cycleDailyMoods).nullable(),

  energyLevel: z.enum(cycleEnergyLevels).nullable(),

  symptoms: z
    .array(z.enum(cycleSymptoms))
    .max(12, 'Choose no more than 12 symptoms.')
    .refine(
      (values) => new Set(values).size === values.length,
      'Duplicate symptoms are not allowed.',
    ),

  privateNote: z
    .string()
    .trim()
    .max(1000, 'Private notes must contain 1,000 characters or fewer.')
    .transform((value) => (value.length > 0 ? value : null)),
});

export type DailyCycleLogFormInput = z.input<typeof dailyCycleLogSchema>;

export type DailyCycleLogResult = z.output<typeof dailyCycleLogSchema>;
