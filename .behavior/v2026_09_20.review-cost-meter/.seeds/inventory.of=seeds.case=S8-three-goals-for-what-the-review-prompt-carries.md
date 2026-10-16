# seed S8 — three goals for what the review prompt carries, and in what order

## .said

> and should we ensure target files load before target diffs?
>
> also, targetDiffs shouldn't include conversation right?
>
> and we should probably exclude some common route specific patterns out of the reviewer content
> too right? only fulcrums and seeds and `.yield.md` files should be included by default

🟡 `souldnt` repaired to `shouldn't`; no other word touched.

## .settled

three goals, each about **what the prompt carries** rather than how it is measured. stated as
questions and read as goals, per the wisher's instruction to catch them before they are evaluated.

### G1 — target files sort ahead of target diffs

a target's **file** is its stable representation; its **diff** is recomputed against a base that
moves every round. so the two do not belong interleaved — the stable half leads, the volatile
half trails.

🟡 the current emit is **per target**, so a target's diff and file sit together and the corpus is
ordered by mtime across targets. G1 asks for a **block** split instead: every file, then every
diff.

### G2 — a target diff must not carry conversation

a `<target.diff>` over a route artifact can contain the conversation text as **diff content**,
because the artifact under review IS a review conversation. so the same bytes enter twice — once
as a diff hunk, once as the `<conversation>` block — and the duplicate rides in the volatile half
where it breaks prefixes.

### G3 — a route's own artifacts are excluded by default, except three kinds

the reviewer should not ingest a route's full file set. the **default** allowlist:

- `.fulcrums/**`
- `.seeds/**`
- `*.yield.md`

each other artifact a route carries — reviews, passages, guards, stones, dreams, appendices — is
excluded unless asked for.

## 🔴 .what this is FOR, and the trap in it

each goal cuts prompt bytes, so each reads as a cache lever. **two of the three are primarily
REVIEW-QUALITY decisions**, and to justify them by byte count is to grade them on the wrong axis:

| goal | the byte claim | the quality claim |
|---|---|---|
| G1 | a stable block caches; an interleaved one does not | a reviewer reads the file before the change to it |
| G2 | a duplicate block is paid for twice | 🔴 a reviewer that reads the conversation twice may **weight it twice** |
| G3 | a route's file set is large | 🔴 a reviewer that reads a route's own review reports **treats its own prior verdicts as evidence** |

⇒ G3's quality claim is the sharpest on the board and has no measurement yet: a peer lane whose
target set includes `.reviews/peer/**` can read what other lanes concluded and echo it, which
would make nine independent verdicts less independent than they appear.

## .landed

### G3 — shipped 2026-09-24

- `src/domain.operations/review/isTargetPolluter.ts`
- `src/domain.operations/review/isTargetPolluter.test.ts`
- `src/domain.operations/review/getAllTargetsAskedForByName.ts`
- `src/domain.operations/review/getAllTargetsAskedForByName.test.ts`
- `src/domain.operations/review/stepReview.ts`
- `src/domain.operations/review/stepReview.casePolluters.integration.test.ts`
- `src/contract/cli/review.ts`
- `src/contract/cli/review.parseReviewArgs.test.ts`
- `blackbox/review.failfast-flags.acceptance.test.ts`
- `.agent/repo=.this/role=any/briefs/rule.require.exclude-review-scope-polluters.md`
- `.agent/repo=.this/role=any/briefs/domain.terms/term=review.scope.polluter._.choice._.md`
- `.agent/repo=.this/role=any/briefs/domain.terms/term=review.scope.polluter._.choice.reason.md`

### 🔴 it landed with TWO deviations, in opposite directions

⚠️ **wider in SUBJECT.** the seed says *"route specific patterns"*; the shipped rule also drops
`.dream/**` and three lockfiles — the wisher widened it at directive time. and the route
**variant** is a declared set (`.route`, `.behavior`), never `.behavior` alone, since a behavior
is a KIND of route.

⚠️ 🔴 **narrower in APPLICATION, and this half is the one a reader of the seed would miss.** the
drop is keyed on the **source** a file entered by: a polluter that rode in on a `--diffs` range
is dropped; one that a **specific** `--paths` glob named is the caller's declared subject and is
**kept**, at the default mode, with no flag.

⇒ without that half, this repo's own guards break: **78 binds across 38 guards** name a route's
own deliverable by glob (`--paths-with '$route/3.3.blueprint.*.md'`), and a source-blind drop
empties every one of those lanes and refuses before the brain is reached.

🟡 so the seed as written would read as *"each file in the allowlist's complement is dropped,
always."* it is not, and the exception is load-bearing rather than incidental.

### G1 — open, and the shipped emit runs OPPOSITE to it, on purpose

🔴 *"open"* alone misreads. `compileReviewPrompt:63` emits, per target,
**`<target.diff>` then `<target.file>`** — the reverse of G1 on both axes at once:

| G1 asks for | the code does | the code's stated reason |
|---|---|---|
| a **block** split — every file, then every diff | a **per-target** pair | (unstated) |
| **file** ahead of **diff** | **diff** ahead of **file** | *"diff first (focus), then content (context)"* |

⇒ so G1's evaluation is not a blank page. it is a **contested** choice with a rationale already
in the source, and that rationale — focus ahead of context — is the thing the evaluation must
weigh. a reader who takes *"open"* at face value would evaluate G1 against an empty field and
find no conflict to settle.

🟡 and the two axes may land differently: the block split is a pure cache argument, where the
file-vs-diff order is a **reviewer-attention** argument. the seed's own table already says so —
G1's quality claim is *"a reviewer reads the file before the change to it."*

### G2 — open, and G3's landing NARROWED it

G2's hazard is stated over a route artifact: *"a `<target.diff>` over a route artifact can contain
the conversation text as diff content."*

⇒ G3 now drops a route's own artifacts from the scope by default, so **that hazard cannot arise
on a default lane at all** — the artifact is not a target.

🟡 it is narrowed, never closed. two paths still reach it: a lane that names a route artifact by
`--paths` (kept deliberately, per the by-name exemption above), and `--polluters keep`. so G2
survives as a question about the lanes that opt IN, which is a much smaller question than the
one the seed posed.
