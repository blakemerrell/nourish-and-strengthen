# Review & Additions on `nourish/pill-fill-and-room`

This note summarizes the comparison between `3b72461` (`Nourish week: a day on target is a full green pill, and the strip gives the meals their room back`) and the 5 items Blake asked for on 2026-10-30, plus the follow-up commit layered directly onto this branch.

---

## 1. What `3b72461` Already Solved Cleanly
1. **Removed `"Tap for day's detail"` (`src/dayfoot.js`)**: Dropped `.mpillwk-hint` (`-44px` vertical height) while keeping `#macroTrayHead` and the active day pill wired to `data-mpilltray="toggle"`.
2. **Full Pill at Target + Over-Target Hairline & Blue → Green → Amber → Red Ramp (`src/weekstrip.js`, `src/style.css`, `tests/macros-meal.test.js`)**:
   - Replaced the old `MWK_GOAL = 0.66` two-thirds rail with `mPillFillHTML(gotRaw, tK)` so `v === 'on'` fills `100%` of the pill well.
   - Added `.mwk-b .mwk-g` hairline at `bottom: (100 / ratio)%` on `over` days with the warm band above it.
3. **Hid `.mlimits` Visually Under the Week Strip (`src/style.css`, `tests/macros.test.js`)**:
   - Clipped `#view-macros .mlimits` to a 1px screen-reader-only live region so fibre & sodium are shown visually via the glowing pill icons without taking vertical space above the meals.
4. **Collapsed `Water & Drinks` by Default (`src/checkin.js`, `src/app.js`, `tests/checkin.test.js`)**:
   - Replaced `S.mHydShut` with `S.mHydOpen` (`var shut = !(S.mHydOpen && S.mHydOpen[k]) && !S.mViewAll;`) so the card starts folded to its 1-line summary bar.

---

## 2. What Was Missing in `3b72461` (Added in Follow-Up Commit on This Branch)

### A. Crio Bru & Drink Recipes in Meals Auto-Counting & Showing Hydration (`src/checkin.js`, `src/myday.js`, `src/app.js`, `src/style.css`)
- **Problem**: Blake logged a Crio Bru recipe for his morning snack (`#26 Crio Bru Power Morning Cocktail`, `#31 Chocolate Mocha Crio Bru Shake`, `#35 Vanilla Chai Crio Bru Latte`, `#40 Cold Brew Crio & Whey Smoothie`, `#47 Salted Caramel Crio Bru Shake`, `#94 Iced Whey Protein Latte`, etc.) and expected the recipe to show hydration on the meal and count toward daily fluid oz.
  - Previously, `mIsMealDrink` / `mItemFluidOz` in `src/checkin.js` only inspected single foods (`f:crio_bru`, `f:milk`) or `r.parts` (saved combos), ignoring recipe `r.ingp` arrays (`[{ k: 'crio_bru', g: 340.2, u: 'oz' }, { k: 'milk', g: 122, u: 'cup' }]`).
  - Additionally, meal cards (`src/myday.js`) showed no hydration indicator on liquid foods or drink recipes.
- **Fix**:
  - Added `mIngFluidG(r)` in `src/checkin.js` to sum liquid ingredient weights (`crio_bru`, `milk`, `evaporated_milk`, `water`, `cola`, `tomato_soup`, `soup_rts`, `cream_soup_chx`, `cream_soup_mush`) divided by `r.servN` for drink/soup recipes (`secName === 'Power Drinks'` or matching drink/soup titles).
  - Updated `mItemFluidOz(r, x)` to compute fluid ounces from `mIngFluidG(r)` (`(ingG / 29.5735) * mult`, e.g. `462.2 g` in `#26 Crio Bru Power Morning Cocktail` = **`16 oz`**) and from `r.parts` for saved combos.
  - Added `mHydChip(r, x)` and `.mfl-hyd` in `src/myday.js` so any food, recipe, or saved meal that contributes hydration displays a compact blue **`💧 16 oz`** badge right next to its name on the meal card (`.mfl-r`) and **`💧 16 oz fluid`** on its macro cost line (`.mfl-q`, `.mfl-mac`, `.mrow-m`).

### B. Full Vibrant Green Pill on On-Target / Over Past Days (`src/style.css`)
- **Problem**: `#view-macros .mwk-d:not(.done) .mwk-b i { opacity: 0.55; }` caused past days that hit their calorie target (`v === 'on'`) to look washed out at `0.55` opacity unless every single item was ticked `.done`.
- **Fix**: Added `#view-macros .mwk-d.on .mwk-b i, #view-macros .mwk-d.over .mwk-b i { opacity: 0.92; }` alongside `.mwk-d.done .mwk-b i` so any on-target or over-target pill renders at full vibrant opacity.

### C. Reclaimed Empty `.mwk-s` Line Under Week Strip Dates (`src/style.css`)
- **Problem**: `<span class="mwk-s">&nbsp;</span>` under each date number in `#view-macros .mwk-d` occupied an empty line across all 7 columns while still needed in the DOM for `tests/macros-ux.test.js:463`.
- **Fix**: Hid `#view-macros .mwk-d .mwk-s { display: none; }` in CSS so the DOM node still answers `.textContent` queries in `macros-ux.test.js` while reclaiming the vertical space for meal cards.
