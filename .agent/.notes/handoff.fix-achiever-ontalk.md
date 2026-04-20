# Handoff: fix-achiever-ontalk

## What was done
1. Split combined snapshots in test cases 3 and 4 into individual snapshot assertions per message
2. Added `onTalk` hook to `Role.build()` in `src/domain.roles/achiever/getAchieverRole.ts` (lines 49-55)
3. Removed init workaround files that manually modified settings.json
4. Manually fixed `.claude/settings.json` to use `"UserPromptSubmit"` instead of `"undefined"` for the onTalk hook

## Rhachet bug found
- `npx rhachet init --hooks` registers `onTalk` hooks under `"undefined"` instead of `"UserPromptSubmit"` in claude settings.json
- The map from `role.hooks.onBrain.onTalk` to Claude Code's `UserPromptSubmit` event is broken

## Current state
- `.claude/settings.json` has the correct `UserPromptSubmit` hook that points to `./node_modules/.bin/rhx goal.triage.infer --when hook.onTalk`
- Tests pass (87 tests, 36 snapshots)
- The onTalk hook accumulates user asks into `.behavior/v2026_04_12.fix-achiever-ontalk/.goals/asks.inventory.jsonl`

## What remains
- Fix the bug in rhachet (likely in the hook event name mapper when it processes `onTalk` from role definitions)

## Files changed
- `src/domain.roles/achiever/getAchieverRole.ts` - added onTalk hook to Role.build()
- `.claude/settings.json` - fixed "undefined" to "UserPromptSubmit"
- `blackbox/achiever.goal.onTalk.acceptance.test.ts` - split combined snapshots into individual ones

## Asks in inventory (test data)
The 4 asks in `.goals/asks.inventory.jsonl` are test messages from manual verification - not real user asks that require goals.
