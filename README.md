# Axiom — Study Operating System Engine

A deterministic, framework-agnostic study engine written in pure TypeScript.
Provides spaced repetition scheduling, study time allocation, and retention risk analysis.

## Setup

```bash
npm install
```

## Run Tests

```bash
# Single run
npm test

# Watch mode
npm run test:watch

# With coverage
npm run test:coverage
```

## Type Checking

```bash
npm run typecheck
```

## Build

```bash
npm run build
```

## Architecture

### Project Structure

```
src/
  domain/
    types.ts              — All domain interfaces and type aliases
    spacedRepetition.ts   — SM-2 variant spaced repetition engine
    scheduler.ts          — Daily study time allocation engine
    retention.ts          — Retention scoring and risk classification
    index.ts              — Barrel export (public API surface)
  tests/
    spacedRepetition.test.ts
    scheduler.test.ts
    retention.test.ts
```

### Design Principles

- **Pure functions only** — Every engine function takes inputs and returns outputs with zero side effects. No `Date.now()`, no mutation, no global state.
- **Deterministic** — Given the same inputs, the output is always the same. Dates are injected, not read from the system clock.
- **Framework-agnostic** — No dependency on Next.js, Express, React, or any framework. The engine is plain TypeScript that compiles to plain JavaScript.
- **No external dependencies** — The domain layer uses only the TypeScript standard library. Vitest is a dev-only dependency for testing.
- **Immutable data flow** — Input objects are never mutated. Every function returns a new object.

---

## Engine Formulas

### 1. Spaced Repetition (SM-2 Variant)

Based on the SuperMemo SM-2 algorithm (Wozniak, 1990).

After each review, the student assigns a quality grade `q ∈ [0, 5]`:

| Grade | Meaning |
|-------|---------|
| 0 | Complete blackout |
| 1 | Incorrect, but recognized the answer |
| 2 | Incorrect, but answer seemed easy |
| 3 | Correct with serious difficulty |
| 4 | Correct after hesitation |
| 5 | Perfect response |

**Repetition counter:**
- `q < 3` → reset to 0 (failed)
- `q ≥ 3` → increment by 1

**Interval:**
- `n = 1` → 1 day
- `n = 2` → 6 days
- `n > 2` → `round(previous_interval × ease_factor)`

**Ease factor update:**
```
EF' = EF + (0.1 − (5 − q) × (0.08 + (5 − q) × 0.02))
EF' = max(EF', 1.3)
```

### 2. Study Scheduler

Allocates daily study hours across courses using weighted urgency:

```
days_left = ceil((exam_date − today) / ms_per_day)
base_urgency = 1 / days_left
proximity_boost = 2.0 if days_left ≤ 7, else 1.0
urgency = base_urgency × difficulty_weight × proximity_boost
allocated_hours = (urgency / total_urgency) × available_hours
```

- Hyperbolic urgency curve: rises sharply as exam approaches
- 2x boost in the final 7 days models "crunch time"
- Difficulty weight (1–5) linearly scales allocation
- Past exams are excluded entirely
- Rounding correction ensures exact sum

### 3. Retention & Risk

Composite score blending three signals:

```
retention_score = 0.60 × accuracy
               + 0.20 × recency_factor
               + 0.20 × exam_proximity_factor
```

**Accuracy:** `correct_reviews / total_reviews` (quality ≥ 3 = correct)

**Recency factor:** `max(0, 1 − review_span_days / 30)` — rewards recent, clustered study activity.

**Exam proximity factor:** `max(0, 1 − days_until_exam / 60)` — higher when exam is near.

**Risk classification:**

| Risk | Condition |
|------|-----------|
| HIGH | accuracy < 0.7 AND exam ≤ 14 days, OR score < 0.4 |
| MEDIUM | accuracy < 0.7, OR score < 0.6 |
| LOW | All other cases |

---

## Integration Guide

This engine is designed to plug into any application layer:

### Next.js / Web App
```typescript
import { reviewFlashcard, generateStudyPlan } from "axiom-study-engine";

// In an API route or server action:
const updatedCard = reviewFlashcard(card, quality, new Date());
// Persist updatedCard to your database
```

### Database Integration
The domain types map directly to database schemas. Use any ORM (Prisma, Drizzle, Kysely) to hydrate `Flashcard`, `Course`, and `ReviewResult` objects from your database, pass them through the engine, and persist the results.

### React Native / Mobile
Since there are no web-specific dependencies, the engine works identically in React Native or any JavaScript runtime.

### Key Integration Points
1. **Hydrate** domain objects from your persistence layer
2. **Call** engine functions with the hydrated data
3. **Persist** the returned results back to your database
4. The engine never reads from or writes to any external system — it is a pure transformation layer

---

## License

MIT
