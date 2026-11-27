# F026 — the afterTool notice ships as a skill, not as a hook, until rhachet's dispatcher places `when: 'after'` on PostToolUse

## .fork

the hook map declares `skeptic.notice --when hook.afterTool` on PostToolUse. a role declares it as
`onTool` with `filter.when: 'after'`. declare it now, or hold it back.

## .read

- `rhachet@1.54.1` `dist/domain.operations/brains/dispatch/constants.js`: `onTool: 'PreToolUse'`, with the note
  "`filter.when: 'after'` still lands under PreToolUse, as the adapter places it today"
- the direct adapter `translateHook.js:54-58` would place it on PostToolUse, but this repo syncs through the
  dispatcher: `settings.of.repo.json:353-359` registers `hooks.dispatch.sh … PreToolUse` and no PostToolUse entry
- so the rule runs before the tool, where the payload holds no `tool_response`; `skeptic.notice.sh:54-55` exits 0
  on that. the hook would cost one bash start per tool call and never fire

## .taken, why

hold it back. a hook that cannot fire and taxes every call is worse than none. the skill ships, its suite
clamps it, and the role's test asserts the hook is absent with the reason. the onTalk notice ships, since
onTalk maps to UserPromptSubmit in the same table.

## .rework

clean: one `onTool` entry with `filter: { what: '*', when: 'after' }` once rhachet routes it. a reseed
dream is caught for rhachet.

## .confidence

80%: the placement read from a constants note and the settings file, not from a live PostToolUse run.

## .where

`src/domain.roles/skeptic/getSkepticRole.ts`; `getSkepticRole.test.ts`.

## .verdict

open.
