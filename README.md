# Luniva Mobile

Privacy-first cycle care and personal wellness application built with Expo SDK 54.

## Requirements

- Node.js LTS
- npm
- Expo Go for SDK 54, or Android/iOS simulators

## Setup

```bash
npm install
cp .env.example .env
npm run start
```

## Quality checks

```bash
npm run quality
npm run expo:doctor
```

## Current architecture

- `app/`: Expo Router routes
- `src/components/ui/`: reusable interface primitives
- `src/config/`: validated public runtime configuration
- `src/features/`: feature modules
- `src/theme/`: design tokens
- `src/types/`: shared TypeScript types
- `supabase/`: added in Step 2

## Security note

Never store secrets in variables prefixed with `EXPO_PUBLIC_`; Expo embeds them in the client bundle.
