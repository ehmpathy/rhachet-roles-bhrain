# F15 — the `model:` warn is a structured advisory, never a process write

**rework** = 🔴 dirty · **status** = ✅ settled 2026-09-14 — the structured form built · **confidence** = settled

## .the fork

| | the mechanism |
|---|---|
| a | `console.warn` from inside `parseStoneGuard`, straight to process stderr |
| b | a structured warn, rendered by the caller — the repo's convention (`getBudgetClobberWarnings.ts`: *"pure … the renderer owns the prose"*) |

(a) was the only non-test `console.warn` in `src`, and it bypassed the engine's
`{ emit: { stdout, stderr } }`. with `F4` permissive, this warn is `case=4`'s whole fail-safe — so a
suppressed stderr makes the fail-safe absent, not degraded.

## .what was built

(b), by a third candidate the dirty grade never enumerated: a second pure read of the guard file, so
`parseStoneGuard`'s signature is untouched.

```
GuardParseWarning          the type — key-unknown, key-alias, key-empty, key-unreadable
getGuardParseWarnings      the collector — pure, yields structured advisories
formatGuardParseWarnings   the renderer — owns the prose
```

🔴 **unwired.** no production surface calls the collector or the renderer
(`stepRouteDrive.ts:90` says so), so `case=4`'s advisory does not reach a driver today. the work is
caught at `.dream/v2026_09_27.fix.wire-the-guard-parse-warnings-to-a-surface.md`.

⇒ a dirty grade is computed over the candidates you enumerated; one outside the set can be clean.

⇒ the full entry: `../appendix/.fulcrums/inventory.of=fulcrums.case=F15-a-parser-warn-writes-to-the-process.md`
