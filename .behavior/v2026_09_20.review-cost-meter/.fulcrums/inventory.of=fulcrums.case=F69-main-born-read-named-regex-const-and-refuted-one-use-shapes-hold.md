# fulcrum F69 — a main-born file read, a named regex const, and three refuted one-use shapes hold

- rework = 🟢 **clean** — each is an extraction or a rename that lands alone
- status = 🟡 **BEST-GUESSED 2026-09-29 — hold all four**
- confidence = 🟡 **70%**
- raised.by = `arch-opport-decomposition` r006 and `mech-decode-friction` r005, i028

## .per concern

| concern | disposition | why |
|---|---|---|
| r006 blocker.2 — raw `fs.readFile` inline in `getOneLatestReviewArtifactForSlug` | 🟡 **disputed** | the line is unchanged from `main` (`git show origin/main:…/getLatestReviewArtifactForSlug.ts` carries the same `fs.readFile(latestFile, 'utf-8')`); this branch renamed the file and replaced its hash regex, never the read. six production readers in `route/guard/review/**` read a file the same way; a single-use communicator around one named stdlib call is the premature abstraction `rule.prefer.wet-over-dry` grades, and to extract all six is a sweep this wish did not scope |
| r006 nitpick.1 — `asBrainProviderFromChoice` / `asLatestSlugHint` at one usage each | 🟡 **disputed** | refuted in a prior round; each names a decode (`split('/')[0]`, a hint string) that `rule.forbid.inline-decode-friction` asks be named. the two rules pull opposite ways on a one-liner, and the named form was chosen |
| r006 nitpick.3 — `PeerReviewOutputParts` a named interface at two usages | 🟡 **disputed** | refuted in a prior round; it is the shared shape of a round-trip PAIR (name ↔ parts), whose whole point is that the two sides cannot drift. inline copies would reintroduce the six-way drift `F16` repaired |
| r005 nitpick.2 — `PATTERN_OF_RUNTIME_VARS` built by an inline sort/map/join | 🟡 **disputed** | the derivation already sits behind a named module constant with a docblock that states why the longest name comes first. a transformer around a one-time constant adds a name for a value that already has one |

## .repaired in the same round, for the record

r006 blocker.1 (`isRefExtant` → `getOneRefExtantVerdict`), r006 blocker.3 (`assertGuardCmdHasNoNpx` →
`asGuardCmdFreeOfNpx`, an `as*` cast), r006 nitpick.2 (`getAllOverruledReviewerSlugs`,
`getAllReviewLevelsByIndex`), and r005 nitpick.1 (the nested ternary is now a pattern table).

## .the verdict

open — for the council.
