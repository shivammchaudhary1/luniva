import { z } from 'zod';

import { getTodayDateOnly, isValidDateOnly } from './date';

const cycleLengthSchema = z
  .string()
  .trim()
  .min(1, 'Enter your typical cycle length.')
  .regex(/^\d+$/, 'Cycle length must be a whole number.')
  .transform(Number)
  .refine((value) => value >= 15 && value <= 60, 'Cycle length must be between 15 and 60 days.');

const periodLengthSchema = z
  .string()
  .trim()
  .min(1, 'Enter your typical period duration.')
  .regex(/^\d+$/, 'Period duration must be a whole number.')
  .transform(Number)
  .refine((value) => value >= 1 && value <= 15, 'Period duration must be between 1 and 15 days.');

export const cycleSetupSchema = z
  .object({
    lastPeriodStartedOn: z
      .string()
      .trim()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Use the date format YYYY-MM-DD.')
      .refine(isValidDateOnly, 'Enter a valid calendar date.')
      .refine(
        (value) => value <= getTodayDateOnly(),
        'The last period date cannot be in the future.',
      ),

    typicalCycleLength: cycleLengthSchema,

    typicalPeriodLength: periodLengthSchema,

    cycleRegular: z.boolean(),

    fertilityInsightsEnabled: z.boolean(),
  })
  .refine((data) => data.typicalPeriodLength < data.typicalCycleLength, {
    message: 'Period duration must be shorter than cycle length.',
    path: ['typicalPeriodLength'],
  });

export type CycleSetupFormInput = z.input<typeof cycleSetupSchema>;

export type CycleSetupResult = z.output<typeof cycleSetupSchema>;
