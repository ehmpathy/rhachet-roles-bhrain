# F012 — hooks on the role, not written into settings

- **fork**: ship `init.skeptic.hooks`, which writes the hooks into the repo actor's settings; or declare them on `Role.build`
- **read**: `init.skeptic.hooks.sh` header — it exists because "a repo-local role declares no hooks rhachet can sync". `src/domain.roles/driver/getDriverRole.ts:38-78` declares onBoot, onTool, and onStop on `Role.build`. rhachet 1.54.1 `RoleHooksOnBrain.d.ts` holds `onBoot`, `onTool`, `onStop`, `onTalk`; `BrainHookEvent.d.ts` maps onTool → PreToolUse/PostToolUse (`BrainHookFilter.when: 'before' | 'after'`) and onTalk → UserPromptSubmit
- **verdict**: declare every hook in `getSkepticRole.ts`; `init.skeptic.hooks` does not ship. the map: `onStop` (the checks), `onTool` `when: 'before'` on Write/Edit (`razor.brief.check`, if F11 keeps it), `onTool` `when: 'after'` (`skeptic.notice --when hook.afterTool`), `onTalk` (`skeptic.notice --when hook.onTalk`)
- **rework**: n/a — every event the source uses has a role-level slot
- **confidence**: 95%
- **where**: `src/domain.roles/skeptic/getSkepticRole.ts`
