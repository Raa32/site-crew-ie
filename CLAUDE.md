# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Irish Construction Connection — React Native (Expo) mobile app + Node.js/Firebase Functions backend matching workers with construction jobs in Ireland.

## Commands

```bash
# Install
npm install

# Mobile dev
npx expo start
npx expo start --ios
npx expo start --android

# Type-check
npx tsc --noEmit

# Lint
npx eslint . --ext .ts,.tsx

# Tests
npx jest
npx jest --testPathPattern=<file>     # single file

# Firebase Functions
cd functions && npm run serve         # local emulator
cd functions && npm run deploy
```

## Architecture

```
types/index.ts              — shared domain types (Worker, Job, Rating)
src/utils/ireland_compliance.ts — Safe Pass validity + RCT net-pay calculation
src/utils/trust_score.ts    — worker reliability scoring (no-show = -40%)
components/                 — React Native UI components
functions/                  — Firebase Cloud Functions (Node.js/TypeScript)
```

### Domain rules baked into logic

- **RCT rates** (`rctRate: 0 | 20 | 35`): Relevant Contracts Tax withheld at source by principal contractor. 0% = Revenue-verified subcontractor; 20% = registered; 35% = unregistered. `calculateNetPay` in `ireland_compliance.ts` handles deduction.
- **Safe Pass**: Irish site safety card, valid 4 years. `isSafePassValid` compares expiry against `new Date()` at runtime. `JobCard` renders badge red when expired.
- **Trust score**: composite of `reliabilityScore` (0–1) and `qualityScore` (1–5, normalised). Any `isNoShow: true` in the ratings array multiplies final score by 0.6 (–40%). Implemented in `trust_score.ts`.
- **Escrow**: `Job.escrowStatus` tracks payment state (`held → released | disputed`). Escrow transitions are managed by Firebase Functions, not client code.

### Data flow

Mobile app → Firebase Auth → Firestore (jobs, workers, ratings) → Cloud Functions trigger on Firestore writes for escrow transitions and trust score recalculation.

### Key type constraints

`Worker.rctRate` is a union `0 | 20 | 35` — never a raw `number`. Pass it directly to `calculateNetPay`; TypeScript will catch invalid rates at compile time.
