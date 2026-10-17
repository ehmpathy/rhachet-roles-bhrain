# F6 · claude code honors statusLine from the `--settings` file

## .the fork
- (a) assume the `--settings` file is a full settings layer, so `statusLine` there renders
- (b) treat it as unproven, and pick a target claude code reads at the user or project rank

## .taken, and why at the time
(a). rhachet loads the actor's `settings.of.repo.json` via `--settings` (`asBrainCliSpawnArgs.js`),
and today hooks and permissions in that very file take effect in every clone — it is read as a
whole settings layer, not a hooks-only file. (b) has no target: the user rank is the grove (the
human's own file), and the project rank is not loaded for a clone.

## .rework
clean — the target choice is one line; the contract and the tests hold either way.

## .confidence — 88%, and why it is not higher
no clone in this session was observed to render a line from that file; the claim rests on the
schema, not a watched render. 5.3 closes it: enroll a driver clone and confirm the line.

## .where
`1.vision.yield.md` · open questions & assumptions

## .verdict
confirmed, 2026-10-16 — a watched render. the init wrote `statusLine` into
`actor.via.repo=ambient/brain/.claude/settings.of.repo.json`; a fresh `@repo=ambient` session,
spawned with the user source rank plus `--settings <that file>`, showed the route status line at
its foot. ⇒ (a) holds.

🟡 a session that was live at the write did NOT show it: claude code reads the `--settings` file
once, at spawn. the bind lands at the next session, never the current one.
