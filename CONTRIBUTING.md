# Contributing

## Development workflow

```bash
npm install
npm run typecheck
npm test
npm run build
```

## Adding a rule

1. Extend `src/domain/rules/typescript-rules.ts` or `python-rules.ts` with a `GovernanceRule` entry in the `*_RULE_DEFINITIONS` array.
2. Implement detection logic in the same module.
3. If the rule is auto-fixable, add a transformation in `src/domain/fixers/` and extend `applyFixes` in `src/domain/fixers/fixer-engine.ts`.
4. Add or extend Vitest coverage under `src/domain/**/*.test.ts`.

## Hook protocol

Hook scripts must emit JSON on stdout only. Use stderr for diagnostics. See `src/boundary/hook-cli.ts` for the reference implementation.
