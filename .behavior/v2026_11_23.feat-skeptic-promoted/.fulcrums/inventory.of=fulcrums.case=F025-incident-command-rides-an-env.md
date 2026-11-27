# F025 — the incident command of check (f) rides an env, `SKEPTIC_INCIDENT_COMMAND`

## .the fork

case=10 leaves open how a consumer passes its record command to `skeptic.answer.check` (f): an env, or a
role option rhachet carries.

## .taken, why

an env. a role hook on `Role.build({ hooks: { onBrain } })` is a bare command (`getDriverRole.ts:36-78`
declares `command`, `timeout`, `filter`, no per-consumer option), so no role option reaches the skill. an
env set in the consumer's settings does, with no rhachet change.

- absent or empty → (f) does not run
- set (e.g. `rhx director.incident set`) → (f) refuses an admission unless a Bash call of the turn holds
  that command; the fix line names it

the source's second cover, a cite of an `inc-YYYYMMDD-HHMMSS` id under a route's `incidents/` dir or the
surdirector tree, reads nheuron paths only. it is cut; a consumer re-runs its command in the turn.

## .rework

clean. a role option, if rhachet grows one, replaces one read of the env; the check's law is unchanged.

## .confidence

75%: rhachet's hook surface read in one role file only, not in rhachet's own types.

## .where

`src/domain.roles/skeptic/skills/skeptic.answer.check.sh` (f); its suite, the two branches of case=10.

## .verdict

open.
