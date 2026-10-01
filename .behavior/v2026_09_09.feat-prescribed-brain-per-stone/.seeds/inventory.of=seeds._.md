# inventory.of=seeds

the wisher's own words, archived verbatim before they were distilled.

## .the axis

`case` — one entry per utterance that changed the work.

## .the summary

| case | title | source | what it settled |
|---|---|---|---|
| [S1](./inventory.of=seeds.case=S1-the-seed-issue-377.md) | the seed issue — a prescribed brain per stone | `ehmpathy/rhachet-roles-bhrain#377` | the field, the applier, the precedent, and four open questions the vision had to answer |
| [S2](./inventory.of=seeds.case=S2-the-fulcrum-council-settles-three.md) | the fulcrum council settles three, and asks after the fourth | the wisher, 2026-09-10 | `F4` — the parser stays permissive, for forward compat · `F10` — the value is the brain-cli's own `/model` argument · `F12` — the key bounds the driver alone. **`F5` was asked after, never settled** |
| [S3](./inventory.of=seeds.case=S3-clone-get-reads-the-reply.md) | `clone get` reads the reply | the wisher, 2026-09-10 | a shipped surface that reads a peer's **own reply** is a detection candidate `F5`'s list graded as a scrape and did not carry. 🔴 and a verdict that changes a value's **vocabulary** re-prices every candidate that compares it — in **both** directions |
| [S4](./inventory.of=seeds.case=S4-set-it-unconditionally.md) | set it unconditionally | the wisher, 2026-09-10 | a guard declares an **end state**, so the applier **converges** rather than diffs. 🔴 a compare-based applier is **blind to out-of-band drift by construction**; a convergent one self-heals it |
| [S5](./inventory.of=seeds.case=S5-the-switch-preserves-the-conversation.md) | the switch preserves the conversation | the wisher, 2026-09-11 | a brain switch changes the **engine**, never the **session**. ⇒ the redundant path is **benign**, so `F14`'s collapse is mandatory. 🔴 one benign-re-run fact deletes **every** compare in front of that operation |
| [S6](./inventory.of=seeds.case=S6-silent-failure-is-fine-for-now.md) | silent failure is fine for now | the wisher, 2026-09-13 | `F5` — an ask on another repo is a **todo**, never a dependency, unless local code is written against it. 🔴 the two halves of a cross-repo fork are decided **separately**, and *"they should have it"* answers only one · **idempotency self-heals drift and loops on a refusal** |
| [S7](./inventory.of=seeds.case=S7-hard-stones-are-front-loaded.md) | the hard stones are front-loaded, and a guard guards spend | the wisher, 2026-09-13 | the hard region is **vision + blueprint**, so the mechanical region is the **body** of the route, never a tail — the **drop back** carries the economy · 🔴 a **guard guards the BUDGET** a stone may spend, so `brain:` joins its concern rather than borrows its file · 🔴 **a forbid list licenses the near-synonyms it does not list** (`phase` held, `stage` leaked ×3 through 5 rounds) |
| [S8](./inventory.of=seeds.case=S8-always-halt.md) | always halt | the wisher, 2026-09-15 | `F1` — an unenrolled driver on a `brain:` stone **halts**, and halts **every time** (never a halt-once-then-warn). 🔴 the "always" rejects the ergonomic middle: a safety gate is a **permanent gate**, not a first-contact courtesy to spend · **a gate that fires on the DEFAULT path matters more, not less** — the blast-radius argument is a reason it earns its keep, never a reason to soften it |
| [S9](./inventory.of=seeds.case=S9-sticky.md) | sticky | the wisher, 2026-09-16 | `F6` — a switched brain **stays** until a later stone changes it; it is not restored on exit. 🔴 the cost is contained by the **route template**, never by a per-stone auto-revert — a sticky tool with per-stone declarations is a garden the template tends, not a stack the mechanism pushes and pops |
| [S10](./inventory.of=seeds.case=S10-effort-is-a-subaxis-of-brain.md) | effort is a subaxis of brain, and the shorthand is the choice | the wisher, 2026-09-25 | the `brain:` contract, specified verbatim — `brain: <x>` is the **choice**; an effort needs an **explode**; a choice may be **omitted** past a declared key. 🔴 an effort level is **model-scoped**, so it is a property OF a brain rather than a peer key beside one · the explode requirement is what keeps the value a **passthrough** — a shorthand that could carry either axis would force this repo to know the brain-cli's level names |
| [S11](./inventory.of=seeds.case=S11-say-order-does-not-matter.md) | the order of the two says does not matter | the wisher, 2026-09-27 | `F29` — `/model` and `/effort` stay unordered and unawaited; a convergent re-dispatch covers a lost race |
| [S12](./inventory.of=seeds.case=S12-effort-parity-with-choice.md) | effort is recorded wherever the choice is | the wisher, 2026-09-27 | `F30` — **parity with the choice** is the test for every surface: the inherited effort is recorded and rendered, as the inherited brain already was. 🟡 the axes still carry on different terms — a level does not outlive a `/model` |
| [S13](./inventory.of=seeds.case=S13-every-stdout-is-mascot-and-treestruct.md) | every stdout is mascot + treestruct | the wisher, 2026-09-28 | 🔴 a correction: three surfaces shipped flat prose, and effort was never pinned on a drive snapshot. every stdout opens with the vibe line and renders as a tree — enruled and clamped by a checker |
| [S14](./inventory.of=seeds.case=S14-every-brain-boundary-has-a-journey.md) | every brain boundary has a journey | the wisher, 2026-09-28 | 🔴 a correction: five happy steps and one halt is a sample, never coverage. each cell of the selection space is walked by an acceptance journey that snapshots its stdout |
| [S15](./inventory.of=seeds.case=S15-effort-gives-the-choice-its-own-row.md) | an effort gives the choice its own row | the wisher, 2026-09-30 | 🔴 a correction: where an effort is listed, `brain` is a bare parent over `choice =` and `effort =` as peers |

## .the counts

- **15** entries
- **0** gaps — verified 2026-09-28 by a `globsafe` of this directory, never by a read of the table

### 🔴 that verification method is the point, and it caught a real gap

on 2026-09-11 this table listed `S4` and **no `S4` file existed on disk.** the row had been written,
the file's write was blocked by a hook, and the retry never happened. every later read of this
summary reported *"0 gaps"* — because the summary was all that anyone read.

⇒ **an inventory cannot audit itself from its own index.**
`rule.require.inventory-for-enumerable-concepts` states it outright: *"the gap check is a `Glob`, not
a read."* the census is a fact about the **filetree**, and a summary is a claim about it.

🟡 **and the failure is silent in the one direction that matters.** a missed entry with no row shows
up the moment someone looks for it; **a row with no entry reads as complete**, and its `.landed`
citations point at a file that is not there.

## 🟡 .why the wish file is not a second entry

`0.wish.md` is already a verbatim, in-repo, version-controlled artifact of the wisher's words. to
copy it into `.seeds/` would be a second home for one text, which is the drift this convention exists
to prevent.

⇒ **S1 exists precisely because the issue is NOT in-repo.** it lives on GitHub, it is editable, and
the vision's whole design traces to its four open questions. an archive of it is what a later reader
checks the distillate against.

## .this round's utterance

the only spoken instruction was *"hi, please drive"* — an instruction to proceed, and no concept. it
settles naught, coins no word, and specifies no contract, so it earns no entry.

## .see also

- `0.wish.md` — the wish, in-repo and already verbatim
- `1.vision.yield.md` — the distillate S1 is checked against
