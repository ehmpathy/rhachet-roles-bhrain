├─ stdout
│  ├─
│  │
│  │  ## review: `3.3.1.blueprint.product.yield.md`
│  │  
│  │  I re-derived every claim against the live code (not just re-reading the blueprint prose). The grain decomposition (transformer/communicator/orchestrator) is sound and the discriminated-union return is a genuine improvement. But I found real gaps in the two areas that matter most for this wish: the observability marker's actual plumbing, and the brain-dependency's blast radius.
│  │  
│  │  ### 🔴 blocker-grade: the `tallied by reviewer@$brain` marker's plumbing is undercounted
│  │  
│  │  The blueprint treats `formatGuardTree.ts` as "the assembler" (singular hop). Verified in code — it's actually **6 touch points across 2 files**, and the blueprint's filediff tree only names 1 of them:
│  │  
│  │  1. `formatGuardTree.ts:40-43` — `RouteFormatTreeGuardReviewRecord.artifact` is a narrow `Pick<..., 'index'|'path'|'blockers'|'nitpicks'|'exitClass'>` — must widen to add `'tactic'`. **not mentioned.**
│  │  2. `formatGuardTree.ts:276-292` — the function's own top-level `input.guard.reviews: Array<{...}>` inline type — separate flat shape, must also widen. **not mentioned.**
│  │  3. `formatGuardTree.ts:466-478` — hand-built mapping (`artifact: { index, path, blockers, nitpicks, exitClass }`) that converts the flat input into `RouteFormatTreeGuardReviewRecord` — must add `tactic` here too. **not mentioned.**
│  │  4. `formatGuardTree.ts:226` (`asReviewerTreeStateFromMeter`) — the one hop the blueprint *does* call "critical."
│  │  5. **`formatRouteStoneEmit.ts` is entirely absent from the filediff tree**, yet it independently redeclares the identical `guard.reviews: Array<{...}>` shape (its own `FormatInput` type) and is the actual function `setStoneAsPassed.ts` calls before `formatGuardTree` ever runs.
│  │  6. `setStoneAsPassed.ts:~805-817` — the inline builder that maps `RouteStoneGuardReviewArtifact[]` → the flat display shape (`blockers: r.blockers, nitpicks: r.nitpicks, ...`) needs `tactic: r.tactic` added. The blueprint marks this file `[~]` but attributes it solely to context-widening — this second, unrelated edit in the same file goes unmentioned.
│  │  
│  │  Miss any one of these and the marker — the single most emphasized, wisher-confirmed requirement in the whole vision — silently never reaches real stdout, while every unit test built against `formatGuardReviewerTree.ts` in isolation still passes green. This is exactly the class of bug this repo already has a named rule for (`rule.forbid.duplicate-format-tree-operations`, `rule.require.single-source-of-truth-for-render`): the "review display record" shape is independently declared 3 times with 2 manual field-mapping sites. **Recommend**: add `formatRouteStoneEmit.ts` to the filediff tree, enumerate all 6 touch points explicitly in the codepath tree (not just formatGuardTree.ts), and flag the duplicate-shape smell as a named risk — collapsing to one shared exported type is the structural fix, even if out of scope to do now.
│  │  
│  │  ### 🟠 behavior hazard: eager brain construction breaks the "zero cost for conforming reviewers" promise
│  │  
│  │  Verified in `rhachet`'s `genContextBrain`: with `{ choice: FIXED_FALLBACK_BRAIN }` and no explicit `brains`, it runs discovery mode and **resolves/validates the choice synchronously at construction time**, throwing `BrainChoiceNotFoundError` if the brain package isn't discoverable — before any reviewer is known to need a fallback. (Creds are lazy via `withSimpleCache`, so that part's fine — but choice-resolution isn't.)
│  │  
│  │  The blueprint has `route.ts` build this unconditionally on every `route.stone.set --as passed` call, then thread it through 4 hops (`stepRouteStoneSet` → `setStoneAsPassed` → `runStoneGuardReviews` → `runOneStoneGuardReview`) that are otherwise brain-agnostic. Consequence: a brain-package problem (this repo just had one — `ef68d79 "drop unused rhachet-brains-xai"`) would break **100% of stone-passing operations**, even fully-deterministic ones — directly contradicting blackbox usecase.1 ("no extra brain cost is incurred") and the vision's own cost table ("one tiny brain call only on the fallback path").
│  │  
│  │  **Recommend**: defer construction — either build the brain lazily inside `getReviewCountsViaBrain` itself, or thread a cheap memoized *supplier* (`() => Promise<ContextBrain>`) instead of an already-built context. This also narrows the blast radius the vision already conceded as a tradeoff ("wider blast radius than a leaf change... accepted") without contradicting the wisher's "in-process, not subprocess" decision — decompose-for-recompose in practice: push the brain dependency to the one leaf that actually needs it, per `rule.prefer.most-common-denominator`.
│  │  
│  │  ### 🟠 maintenance hazard: render copy doubles as the persisted data format
│  │  
│  │  The cache-survival design recovers `tactic` on reconstruction by regex-matching the literal string `tallied by reviewer@…` in the persisted footer — the exact same string the human-facing render emits. Nothing decouples "what we show the human" from "what we parse back." A future copy tweak (e.g. "counted by" instead of "tallied by") silently breaks tactic-recovery for reconstructed/cached artifacts, with no test failure pointing at the cause. **Recommend**: a shared, named constant (e.g. `TALLIED_FOOTER_PREFIX`) used by both the writer and the two cache-reconstruction parsers, so a copy change can't drift from the parse contract.
│  │  
│  │  ### 🟡 nitpick: naming drift
│  │  
│  │  Blueprint's filediff/prose reference `RouteStoneGuardReviewArtifact` as the type gaining `+tactic`. In code, that's a `@deprecated` re-export — the live interface is `RouteStoneGuardReviewPeerArtifact`. File path is correct; the type name isn't. Minor, but worth fixing before execution to avoid a "which type do I actually edit" stumble.
│  │  
│  │  ### 🟡 nitpick: `evidence` field isn't flagged for wisher confirmation like the other deviation is
│  │  
│  │  The `exitCode`-in-orchestrator deviation gets an explicit "flagged here so a reviewer sees this as a conscious choice" callout. The `evidence` schema field (a real, if small, prompt/schema design addition beyond what the vision specified) gets `[OPIN→adopted]` but no equivalent "flagged for wisher" note, despite being a bigger design decision than the exitCode placement. Suggest the same treatment for consistency.
│  │  
│  │  ### what's solid (no changes needed)
│  │  - Grain split and `ReviewCounts`/`ReviewCountsResolved` union are well-designed; `?? 0` failhide is genuinely closed by the type system.
│  │  - Brain-error → malfunction path is mechanically sound and precedented: `getExitCodeClass` already treats any non-0/non-2 code as malfunction, so synthesizing `exitCode=1` on a caught brain throw reuses the exact mechanism already used for the "no verdict" promotion — no new invention needed.
│  │  - Cache-filter (`exitClass === 'passed'` only) confirms malfunctions never poison the cache — a transient brain fault self-heals on retry.
│  │  - The 4-caller analysis of `getReviewCountsFromContent` is accurate (verified all 4 call sites exist exactly as described).
│  │
│  └─
├─ stderr
│  ├─
│  │
│  │  Warning: no stdin data received in 3s, proceeding without it. If piping from a slow command, redirect stdin explicitly: < /dev/null to skip, or wait longer.
│  │  
│  │  💥 malfunction: reviewer output lacks a numeric blocker/nitpick count (expected `N blockers` and `N nitpicks`; use `0 blockers` / `0 nitpicks` to declare clean). see .agent/repo=bhrain/role=reviewer/briefs/contract.reviewer-output.md
│  │
│  └─
└─ passage blocked
   ├─ blocked by malfunction
   └─ exit code: 1 💥
