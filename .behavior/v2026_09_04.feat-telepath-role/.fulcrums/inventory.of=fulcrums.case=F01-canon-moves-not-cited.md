# F01 · the canon MOVES to telepath; it is not cited in place

- **rework** = clean · **status** = open · **confidence** = 80%

## .the fork, stated fairly

telepath's output-half canon lives in `rhachet-roles-ehmpathy` under `mechanic` + `architect` `lang.prose/`. three ways to give telepath a rubric over it:

| option | what it means |
|---|---|
| **A · cite in place** | telepath's `rubrics.yml` names `.agent/repo=ehmpathy/...` paths |
| **B · copy** | duplicate the briefs into telepath, leave ehmpathy's alone |
| **C · move** | the briefs relocate to telepath; ehmpathy adopts by reference |

## .taken, and why at the time

**C** — and the reason is mechanical, never aesthetic:

- `rhachet-roles-ehmpathy` is a devDependency of this repo (`package.json:133`), never a dependency
- a consumer that enrolls telepath does not thereby get ehmpathy's briefs
- ⇒ under A, telepath's rules glob matches zero files on any consumer that never enrolled ehmpathy's mechanic
- and a zero-match rules glob throws `BadRequestError` (`stepReview.integration.test.ts:116-136`), so every stone blocks

⇒ A makes a generic role unusable outside one peer's dependency set. B creates two homes for one rule, which drift on the structural half — the exact failure `rule.require.generic-governs-structure-never-voice` names.

C is also what the extant seam brief already declares: *"when it happens, `lang.prose/` moves and `lang.tones/` stays."*

## .the canon is ALREADY FORKED — so "move" is a MERGE, and the fork is deliberate

measured 2026-09-04, by a glob of `node_modules/rhachet-roles-ehmpathy/dist/domain.roles/*/briefs/practices/lang.prose/*.md`:

| role | files |
|---|---|
| mechanic | 11 |
| architect | 8 — every name a subset of mechanic's |

⇒ **the 8 shared names are not the same file.** a diff of `rule.require.brevity.md` shows divergence in four sections at once:

| section | architect's copy | mechanic's copy |
|---|---|---|
| `.scope` | *"all technical prose the architect writes"* | a four-row list: code · docs · comms · logs |
| examples | prose (*"operations compose into larger flows"*) | ts code comments |
| `.why` | 3 bullets | 4 bullets, one of them `max signal per token` |
| `.the test` | absent | present |

🟡 the divergence is role-tailored, never accidental. the architect's `define.simplified-technical-english` says so outright: *"the mechanic role holds the full overlay … the architect adopts that full overlay by reference; the four above are the architect-primary set."* so the fork is a declared relationship with a declared direction.

⇒ option C is a merge with a reconciliation, never a relocation. the merged brief must decide:

- what happens to a code-comment example in a role whose readers write prose
- what happens to a prose example in a role whose readers write code
- ⇒ a real design question this fulcrum stated as a file move

### .and the reconciliation is ALREADY SETTLED — by the seam brief this fulcrum cites

the question read as a design fork with no answer. it has one, in the brief F01 already quotes:

> *"an **example** needs a concrete message to show the shape | use this repo's voice — **an example illustrates, it does not prescribe**"*
> — `rule.require.generic-governs-structure-never-voice:32`, and its `false positive` clause repeats it at line 66

⇒ **so both examples are legal in one merged brief.** the ts-comment example and the prose example each *illustrate* the same structural rule; neither prescribes, so neither carries voice, so neither blocks adoption.

🟡 the merge keeps both rather than a pick between them — and that is strictly better than either copy is today, since each currently shows the rule to only half its audience.

⇒ what actually remains is smaller than it looked: the two copies' `.scope` sections differ, and the merged rule needs one scope that covers both readers. that is a sentence, not a design round.

🟡 it strengthens the case FOR C — a fork that already drifted in four sections is the exact failure `rule.require.generic-governs-structure-never-voice` names. it does not strengthen the confidence, because the work was mis-scoped.

## .rework, and why

**clean.** at vision stage this is a decision, never a diff. reversal costs an edit to a plan.

🟡 it becomes **dirty** once the move lands — `rhachet-roles-ehmpathy` would then depend on `rhachet-roles-bhrain`, and a reversal is a teardown. **so this fulcrum is cheap to overturn now and expensive later.**

## .the cycle question is answered — and C splits into TWO sub-options

`rhachet-roles-ehmpathy@1.38.12` `package.json:105`, read 2026-09-04:

```json
"devDependencies": { …, "rhachet-roles-bhrain": "0.32.1", … }
```

⇒ ehmpathy already depends on bhrain — and bhrain on ehmpathy (`package.json:133`). the cycle exists today, in both directions, and is tolerated.

🟡 it does not refute C, because both edges are `devDependencies`. a dev edge never enters a consumer's resolution graph, so the cycle is benign and already the status quo. what matters is the runtime direction after the move, and it splits C in two:

| sub-option | what ehmpathy does with the canon | dependency consequence |
|---|---|---|
| **C-refer** | mechanic + architect keep the canon on their boot list, cited from telepath | ehmpathy must promote bhrain from dev → real. the runtime graph then reads `ehmpathy → bhrain`, one way only (bhrain's edge stays dev) — ⇒ feasible, and no runtime cycle |
| **C-drop** | mechanic + architect drop the prose canon from their boot; whoever wants it enrolls telepath | no dependency change at all. the cheapest path, and it shrinks both roles' boot footprints |

⇒ this sub-fork was absent from the option table above, and it is the part of C that carries the real cost. the rename/merge is work; the dependency promotion is a release-order constraint across two repos.

🟡 **C-drop is likely correct and needs a wisher call** — it means ehmpathy's mechanic and architect *lose* rules they carry today unless their consumers enroll telepath. that is a behavior change to a published role, not a refactor.

## .confidence, and why it is not higher

80%, lowered from 88% by the fork measured above and held there by the sub-fork just named:

- the cycle question is closed — it exists, it is dev-only, and it does not refute C
- **C splits into C-refer and C-drop, and the vision took C without a choice between them.** the two differ in a published role's behavior, so the wisher owns it
- the wisher may prefer B as an interim, to unblock the reviewer without a cross-repo release
- the work was scoped as a move and is a merge. two divergent copies, deliberately tailored per role, must reconcile into one — and the merged brief's examples must serve both a prose reader and a code reader. that is design work this fulcrum did not price

## .where

- `1.vision.experience.case=5.an-absent-canon-fails-loud.md` — the demo that forced it
- `src/domain.roles/telepath/readme.md:43-46` — the debt this settles

## .the verdict

_unruled._
