# Flight Physics Tuning

The active flight profile is defined in [`client/src/physics/settings.ts`](../client/src/physics/settings.ts) and keeps the
configuration aligned with the "after" calculations from the latest tuning review.

| Attitude    | Lift | Gravity | Net |
|-------------|------|---------|-----|
| Neutral     | 1.5  | 1.5     | 0.0 |
| Dive        | 2.7  | 1.5     | 1.2 |
| Max Climb   | 3.7  | 1.5     | 2.2 |

These values reduce the previous excess lift that prevented dives while preserving enough margin to climb when pitching up.
