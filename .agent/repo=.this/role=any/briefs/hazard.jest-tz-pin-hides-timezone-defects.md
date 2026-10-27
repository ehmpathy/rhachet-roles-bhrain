# hazard.jest-tz-pin-hides-timezone-defects

> **this repo's jest config pins `process.env.TZ = 'UTC'`, and an in-test `process.env.TZ = …`
> does not move node's clock zone. so no unit or integration test here can see a defect that
> only shows off utc.**

## .what it hides

a stamp built in LOCAL wall time reads correct on a utc host. on a seat in CT it names an
instant 5–6h off, and every age, expiry, or "is it fresh?" check built on it is wrong.

measured 2026-10-24: `iso-time@1.11.1`'s `asIsoTimeStamp` formats local time with a literal `Z`.
adopted for the status line cache stamp, every unit and integration test passed, and on a CT
host every repaint would have missed its own cache.

## .what to do

| need | do |
|---|---|
| a clamp for any code that stamps, parses, or compares a time | spawn a real process with `env: { ...process.env, TZ: 'America/Chicago' }` (acceptance grain) — e.g. `routeStatusLine.acceptance` `[case19]` |
| a stamp of "now" | `date.toISOString()` names the true utc instant on every host; narrow it to `IsoTimeStamp` by a guard, never a cast |
| you adopt a time library's cast | read its source first (`rule.require.read-package-docs-before-use`). a `format(...)` with a quoted `'Z'` is local time in disguise |

blocker: time code clamped only by tests that run under the jest zone pin.

⇒ see also: `rule.forbid.any-time` (ehmpathy/mechanic — right rule; check the cast it points to) ·
first seen in `.behavior/v2026_10_24.fix-status-line-cpu` (the dream it caught:
`.dream/v2026_10_24.reseed.iso-time-stamp-is-local-wall-time-with-a-z.md`).
