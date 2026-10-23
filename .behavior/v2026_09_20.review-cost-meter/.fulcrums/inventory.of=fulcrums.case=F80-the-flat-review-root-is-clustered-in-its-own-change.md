# F80 — the flat review root is clustered in its own change

- rework = **dirty** — a subdomain split moves 100+ files and re-points every import that reaches them, in this repo and in the published cli subpaths
- confidence = 🟡 **80%**
- raised.by = r027 enroll-impl-arch-defects-review-ops (nitpick.3), at i036

## .the fork

`src/domain.operations/review/` holds 100+ files of mixed grain at its root. this branch added to it, beside the subdomains it did cluster (`meter/`, `grove/`, `warmer/`, `fleet/`).

| option | what it yields |
|---|---|
| concede | a mass move in a cost-meter branch: every import of a root file re-pointed, a diff no reviewer can read for its subject, and a merge race against main's own edits to the same root |
| dispute + dream | the new subdomains this branch authored stay clustered; the root split ships as its own change, where the move is the whole diff |

## .taken — dispute, with a dream

- the branch clustered what it authored as a unit (`meter/`, `grove/`, `warmer/`); the root files it touched were extant there on main
- `rule.prefer.most-common-denominator` and `rule.prefer.scouts-honor` bound a fix-forward to what rides the diff; a 100-file move does not ride it — it is the smuggled refactor `rule.prefer.wickup-touched-prose` names
- no harm ships: the shape costs navigation, never behavior

⇒ the work is caught in `dreams/v2026_10_01.fix.the-flat-review-root-wants-subdomain-clusters.md`.

## .why confidence is not higher

a reader may hold that every file this branch added to the root, rather than to a subdomain, is in reach. some were.

## .verdict

🟡 BEST-GUESSED 2026-10-01 — dispute.
