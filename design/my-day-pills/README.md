# My Day — week-of-pills summary (design handoff)

Mockups for replacing the Nourish "My Day" summary (calorie ring + P/F/C bars + fibre/salt
lines + day tiles) with a compact week of pills that expands into a detail tray.

**Chosen direction: `Weekrings.dc.html` (option C).** `Main.dc.html` (A, dot-ring hero) and
`Strip.dc.html` (B, slim strip) are the rejected alternatives, kept for reference.

These are prototypes (Claude Design canvas files), not production code. Rebuild them in the
app's plain-script parts; match the visuals, not the prototype's internals. All numbers are
sample data.

## The pill (one per day, Mon–Sun)

- Shape: tall stadium, 40×112 px in the week row; today gets a cream outline ring.
- **Outline dots = macros.** Dots run clockwise from top centre: protein, then fat, then carbs,
  each arc sized to the plan's calorie share (e.g. 48 / 39 / 13), one empty slot between arcs.
- **Fill = calories**, rising from the bottom as a % of the day's target (muted green `#4F8A5E`).
  Over target: fire cap `#FF6B3D` at the top.
- **Inside, stacked line-art icons:** fibre (leaf), salt (shaker), workout (dumbbell).

### Heat-map rules

| Element | Below target | At target | Over target |
|---|---|---|---|
| Macro dots (lit) | segment colour, opacity 0.25 → 0.85 with progress | full colour + soft glow | fire `#FF6B3D` + stronger glow |
| Unlit dots | `#3A332C` @ 0.45 | — | — |
| Fibre icon (a floor) | cream, opacity 0.15 → 0.85 | cream + glow | — |
| Workout icon | dim when planned, hidden on rest days | cream + glow when logged | — |
| **Salt icon (a ceiling — warning, never "success")** | < 70 %: faint neutral; 70–90 %: amber, rising opacity | ≥ 90 %: amber glow | > 100 %: fire glow |

Macro colours: P `#7CC48A`, F `#E0A15A`, C `#A99BE0`. Water `#6FB3E0`.

## Card header

`1,338 / 1,413 kcal` (serif number) and water `1.8 / 3 L` with a drop icon. Tap anywhere on
the pill row to expand.

## Expanded tray (scrolls; sections stacked)

1. **Energy balance** — eaten · burned (watch estimate) · net, shown as `≈ −1,072`. Below it, a
   thick bar of the actual P/F/C calorie split over a thin bar of the plan split.
2. **Fuel detail** (2-col tiles) — floors fill green (fibre, potassium); ceilings go
   neutral → amber → fire (sodium, sugar, sat fat, cholesterol).
3. **Meals** — one row per meal: time, name, a bar sized by kcal and split P/F/C, kcal.
4. **Move** (Health Connect) — steps vs goal with an hourly bar strip, distance, active burn,
   workout session.
5. **Heart** — resting bpm, heart-rate line for the day, HRV, blood oxygen.
6. **Recover** — sleep (with deep sleep), weight trend.

## Data and caveats

- Source: Health Connect, fed by Google Fit on the phone, synced to the watch.
- Likely available: steps, distance, heart rate, resting HR, active/total calories burned,
  exercise sessions, sleep duration.
- **Not confirmed from Google Fit:** HRV, blood oxygen, sleep stages, weight (only if logged or
  a scale is connected). Tiles with no data should hide, not show blanks.
- "Burned" is a watch estimate and can be off by a few hundred kcal; the UI keeps it marked as
  an estimate and net as approximate.
- Micronutrient tiles depend on food-log coverage; flag partial data when coverage is thin.

## Open question

Whether the tray sections collapse individually or always show in full.
