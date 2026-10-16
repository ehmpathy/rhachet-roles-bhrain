# F240 — the repo-rules i004 holds: sweeps, a judge pour, and premises that do not hold

- raised 2026-10-12, by `repo-rules` (blocker.2, blocker.4, blocker.5, nitpick.1, nitpick.4,
  nitpick.5, nitpick.6, nitpick.7, nitpick.9, nitpick.10, nitpick.11, nitpick.13, nitpick.16,
  nitpick.17, nitpick.21, nitpick.22), at 5.3 i004
- rework: **clean** — each row is a rename the compiler walks, a stream or label move plus a
  resnap, or a hoist. none ripples into a contract a caller outside this repo hardened against
- status: 🟡 **BEST-GUESSED — disputed**
- confidence: **76%**

## .the fork, stated fairly

the i004 r001 `repo-rules` lane raised five blockers and twenty-two nitpicks. eleven were repaired
this round. the sixteen below either rest on a premise that does not hold, or carry a cure that
sweeps files three peer lanes edit in this same round.

| option | the claim |
|---|---|
| **A — hold, and record each tradeoff** | no row ships a harm a user would meet. the sweeps collide with concurrent lane edits; the false premises owe no repair |
| **B — repair now** | each is a rule the lane named; the rules do not wait for a quiet tree |

| global | concern | why it holds |
|---|---|---|
| blocker.2 | partition id is `slug` at parse, `name` on the split types | held at i003 (F237 nitpick.3). the rename reaches ~60 sites over ~25 files and integration fixtures, while lanes r2, r4, r6 edit the same partition and guard files this round. internal only — no published contract carries `name` |
| blocker.4 | `runStoneGuardJudges` runs judges in a serial loop | held at i002 (F229). `rule.forbid.serial-reviews-that-could-pour` scopes to **reviews**; a judge is a local deterministic command, one or two per guard, milliseconds each. a pour interleaves the judges' live progress emits, which makes the streamed snapshot order nondeterministic — a real cost for no wall-time gain |
| blocker.5 | `route.stone.set` prints its halt tree on stdout, then exits 2 | held at i003 (F237 blocker.3). extant on main byte for byte; a stream move rewrites the halt contract of every guard halt and every acceptance case that pins `stderr === ''` |
| nitpick.1 | `inflight.json` records `since` in epoch ms | held at F89. the file is gitignored machine state, read only by the warmer, under an injected clock — not a route artifact under `rule.forbid.timestamps-in-route-artifacts` |
| nitpick.4 · nitpick.7 | `corpus` in the tree meter and the census row | held at i003 (F237 nitpick.6). `term=review.scope._.choice.reason.md` records `corpus` as the snapshot set, so the word is overloaded either way; the cure is a new canonical word plus a ~31-line snapshot sweep across the meter, which other lanes touch this round |
| nitpick.5 | `asPathLines` vs `asPathListLines` | two renders with two contracts: one renders a bare path list, the other a capped list with a `--full` remainder line. a merge adds a mode flag — the shape `rule.prefer.wet-over-dry` names as abstracted too early |
| nitpick.6 | `withStdoutToStderr` holds `SWAP.held` | an in-process reentrancy refcount, not a lock: no actor waits, skips, or refuses on it — `rule.require.locks-via-with-simple-mutex` defines a lock as a claim another actor checks. it is the refcount `rule.forbid.serial-reviews-that-could-pour` prescribes |
| nitpick.9 | the verdict summary renders in `genReviewFileHeader` and `genReviewOutputStdout` | two surfaces with two headers: the file says `✨ all clear`; stdout says `🦉 not even a vole` and adds an `all good 👍` row. both read the same `asCountedNoun`, so the arithmetic cannot drift; the docblock states they are peers by design |
| nitpick.10 | `asPeerReviewLevelBySlug` checks `review.level` | a fail-fast assert of the parse guarantee at the read site (`rule.require.failfast`); its removal would let a malformed guard read as level 1 in silence |
| nitpick.11 | the word `lane` in guard malfunction text and `GuardMalfunctionLane` | a rename across guard text, a type, and snapshots that lanes r2 and r6 edit this round. `lane` is a forbidden synonym of `reviewer`, yet `rule.forbid.domain-term-ambiguity` records `reviewer` as overloaded with `lane` its one candidate cure — the settlement is owed to the glossary first |
| nitpick.13 | `enumRouteFiles` uses `cwd: input.route` | pre-extant; the glob enumerates only the route dir, and the call returns route-relative paths its callers join. a move to repo-root cwd changes the returned path shape for every caller. no subprocess and no skill lookup rides that cwd |
| nitpick.16 | reflect `DEFAULT_BRAIN` is `anthropic/claude/sonnet-4` | `rhachet-brains-anthropic@0.4.3` ships no `latest` map (`dist` holds no match for `latest`), so a `…/latest` slug would throw at `getOneBrainChoicePinned`. `rule.require.versionless-brain-defaults` itself names this case: name it in `PACKAGE_BY_PROVIDER`, or pass a pinned slug and say why |
| nitpick.17 | the reflect failfast-brain suite uses the reviewer role path | premise false: `reflect.sh` lives at `src/domain.roles/reviewer/skills/reflect.sh`; the reflector role holds only `reflect.savepoint.sh` and `reflect.snapshot.sh` |
| nitpick.21 | the `✋ ConstraintError:` literal in `asOpenerFailureNote` | held at i003 (F237 nitpick.11). ~15 literal sites over five cli files; `asConstraintErrorHeader` takes a caught error, so no shared prefix unit exists to call |
| nitpick.22 | `FileChangeKind` uses `new` / `edited` / `deleted` | held at i002 (F229). no `domain.terms` cluster declares `additions` / `mutations` / `deletions` as canonical; the lane cites a vocabulary the glossary does not hold |

## .taken, and why

**A**, for all sixteen. three rest on a false premise (nitpick.13 partly, nitpick.16, nitpick.17);
the rest are `better` cures whose sweeps would collide with three concurrent lane edits. none
ships a harm a user would meet.

## .rework, and why

**clean.** each row is mechanical: a rename the compiler walks, a stream swap plus a resnap, a
constant hoist. none forks a shape a caller outside this repo leans on.

## .confidence, and why it is not higher

blocker.4 and blocker.5 are graded blocker by the lane; a strict reader holds the judge loop as a
pour defect regardless of its two-item size, and the halt stream as a live
`rule.forbid.stdout-on-exit-errors` blocker whatever its age on main. blocker.2 is a fourth
re-raise, which by `rule.forbid.overzealous-blockers` the lane should re-grade; it did not.

## .where

`src/domain.operations/review/partition/` · `src/domain.operations/route/judges/runStoneGuardJudges.ts` ·
`src/contract/cli/route.ts` · `src/domain.operations/review/warmer/` ·
`src/domain.operations/review/asPromptInputsCensusLines.ts` ·
`src/domain.operations/review/genReviewFileHeader.ts` · `src/domain.operations/review/genReviewOutputStdout.ts` ·
`src/domain.operations/reflect/` · `src/contract/cli/asOpenerFailureNote.ts`

## .verdict

— (awaits the council)
