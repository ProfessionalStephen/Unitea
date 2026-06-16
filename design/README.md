# design/ — resolved theme tokens + the accessibility gate

These `*.tokens.json` files are the **resolved** colors/targets/signal-roles used by the dashboard's
Reports tab, captured so the design-system accessibility gate can be re-run against them. They follow
the Atelier "validate-then-apply" methodology (Design Craft vault): a theme that fails any WCAG 2.2 AA
invariant is fixed *before* it ships.

- `reports-dark.tokens.json` — dark theme (card surface `#2E3138`)
- `reports-light.tokens.json` — light theme (card surface `#E8E8E8`)

The chart/RAG palette these encode lives in code at `src/chart-utils.ts` (`chartColors(dark)`).
Keep the two in sync: if you change a chart/RAG/muted color, update the matching `.tokens.json` and
re-run the gate.

## Run the gate

```bash
node "<DesignCraft>/skills/design-craft/tools/validate-theme.mjs" design/reports-dark.tokens.json
node "<DesignCraft>/skills/design-craft/tools/validate-theme.mjs" design/reports-light.tokens.json
```

Checks: text ≥ 4.5:1, large/UI ≥ 3:1, pointer targets ≥ 24px, signal roles mutually distinct
(color-difference — guards the red/green colorblind trap). Exit 0 = may ship, exit 1 = fix and re-run.
Both files currently pass (25/25 dark, 23/23 light).
