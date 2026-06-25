import { z } from 'zod';

export const genderOptions = ['female', 'male', 'non_binary', 'prefer_not_to_say'] as const;

export const onboardingSchema = z
  .object({
    displayName: z
      .string()
      .trim()
      .min(2, 'Name must contain at least 2 characters.')
      .max(80, 'Name must contain fewer than 80 characters.'),

    gender: z.enum(genderOptions).nullable(),

    ageConfirmed: z.boolean(),

    cycleModuleEnabled: z.boolean(),

    journalModuleEnabled: z.boolean(),
  })
  .refine(({ ageConfirmed }) => ageConfirmed, {
    message: 'You must confirm that you are at least 18 years old.',
    path: ['ageConfirmed'],
  })
  .refine(
    ({ cycleModuleEnabled, journalModuleEnabled }) => cycleModuleEnabled || journalModuleEnabled,
    {
      message: 'Select at least one Luniva feature.',
      path: ['cycleModuleEnabled'],
    },
  );

export type OnboardingInput = z.infer<typeof onboardingSchema>;
