# S3 · status line becomes a role-level brain-cli feature upstream; accept the copy leak meanwhile

## .said

> well, lets just ask an upstream support for status line per brain cli; e.g., frame lines or something like that, per role, top level supported. and yeah, accept the copy leak for now

## .settled

- a status line is a feature a ROLE declares, top-level, and the brain cli adapter renders —
  never a settings key a role init merges into a file the enroll layer rebuilds
- the precise rule (only actors enrolled with that role get it, per actor, across rebuilds) is
  owed upstream, in rhachet, where the actor settings are derived
- meanwhile the init binds the repo actor's `settings.of.repo.json`, and every actor derived from
  it inherits the line — a leak to non-driver actors, accepted

## .landed

- `.dream/v2026_10_16.reseed.rhachet-role-declared-frame-lines-per-brain-cli.md`
- `src/domain.roles/driver/inits/init.claude.status-line.sh`
