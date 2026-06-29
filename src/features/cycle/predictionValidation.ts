import { z } from 'zod';

import { getTodayDateOnly, parseDisplayDateToDateOnly } from '../../lib/date';

export const cyclePredictionResponses = [
  'started_on_predicted_date',
  'not_started_yet',
  'started_on_another_date',
] as const;

const actualStartDateSchema = z
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
        message: 'The period start date cannot be in the future.',
      });
    }
  })
  .transform((value) => parseDisplayDateToDateOnly(value) ?? value);

export const alternatePeriodStartSchema = z.object({
  actualStartOn: actualStartDateSchema,
});

export type AlternatePeriodStartInput = z.input<typeof alternatePeriodStartSchema>;

export type AlternatePeriodStartResult = z.output<typeof alternatePeriodStartSchema>;
