# S05 · `--why` is a PATH to a fulcrum, and one fulcrum is one dispute

- **caught** = 2026-09-09 · **kind** = 🔴 **a correction** — the driver designed `--why` as prose;
  the wisher made it a reference

## .said

> but the `--as disputed --why $path` should reference fulcrums

and, on the grain and its reuse:

> yep, and each fulcrum is a single dispute; and they can reuse fulcrums from past disputes

and, on the cardinality per reviewer:

> and they can open multiple disputes w/ multiple fulcrums for the same reviewer if they want too

and, on what the whole mechanism is for:

> the whole purpose is just to get them to formalize what they disputed
> so that we can guarantee to review it later

## .settled

🔴 **`--why` takes a PATH to a fulcrum entry. it never takes prose.**

```sh
rhx route.stone.set --stone <stone> --as disputed --with <slug> \
  --why .fulcrums/inventory.of=fulcrums.case=F00N-<slug>.md
```

**the argument the driver did not have:** a reason and a fulcrum are **one artifact**, and the driver
had designed two.

| the driver's shape | the wisher's shape |
|---|---|
| `--why` carries prose · the command mints an entry from it | 🔴 the driver **authors** the entry · `--why` **points** at it |
| the reason exists twice — a ledger string and an entry body | it exists **once** |
| a re-declaration must decide: findsert, or a second row? | the driver passes the **same path**. that IS the reuse |

⇒ **the design had a duplicate it could not see**, and every open question it raised was a question
about how to keep the two copies consistent.

## 🔴 .the grain — one fulcrum, one dispute; and N per reviewer

> *"and they can open multiple disputes w/ multiple fulcrums for the same reviewer if they want too"*

**a fulcrum entry is not a log of a lane's disagreements. it is ONE.** so a lane with two separate
disputed points owes **two** entries, each with its own path, each passed on its own `--as disputed`.

⇒ that is `rule.require.catalog-is-an-index`'s grain, held: the entry carries **one occurrence**, and
a set of them is the board.

🔴 **and the relation is many-to-one, never one-to-one.** the driver had modelled *"a stance per
lane"*; the wisher's grain is **a dispute per POINT**, and a reviewer may hold several:

| the shape | what it is |
|---|---|
| a **reviewer** | holds N blockers |
| a **dispute** | answers ONE of them, and carries ONE fulcrum |
| ⇒ a **lane** | may carry 0, 1, or N disputes at once |

⚠️ **so `--as disputed --with <slug>` is not idempotent per slug**, and `F009`'s *"a contrary second
stance is refused"* needs a re-read: what is refused is a **contrary stance on the same point**, never
a second dispute on the same reviewer.

⇒ and this is `S03`'s own argument, one grain finer. that seed settled *"a lane carries many
blockers, not one"* against a lane-grain **silence**; this settles the same claim against a
lane-grain **stance**.

## .the reuse — the same path, across generations AND across routes

> *"they can reuse fulcrums from past disputes"*

under `S03`'s fork C a disputed lane returns each artifact generation, so the driver re-declares. **if
the argument still holds, they pass the same path.** and the reuse is not bounded to one stone or one
route — a fulcrum whose subject recurs is cited again rather than re-authored.

⇒ ✅ **so *"can they reuse the same filepath if the answer still holds?"* is answered by the flag
itself**, over by a findsert rule inside a mint.

## .what it retires

| the question | why it is moot |
|---|---|
| *"one fulcrum row per lane, or one per declaration?"* | 🔴 the **driver** decides, per declaration, by which path they pass |
| the mint's findsert key (`F017`, 65%) | there is no key. no collision, no inherited rationale, no post-rewind staleness |
| `fulcrum?: string` as a **derived** field on `PassageReport` | 🔴 it IS the `--why` argument, stored verbatim |

## 🔴 .the purpose, stated by the wisher — and it CORRECTS `S04`

> *"the whole purpose is just to get them to formalize what they disputed
> so that we can guarantee to review it later"*

**two clauses, and they are one mechanism:** the formalization is not the end — it is what makes the
**guarantee** deliverable.

| the clause | what it does |
|---|---|
| *"formalize what they disputed"* | the **author's** half — the articulation, which is `S04`'s nudge |
| 🔴 *"so that we can guarantee to review it later"* | the **reader's** half — the council, and it is a GUARANTEE, over a hope |

### ⚠️ what `S04` over-claimed

that seed reads *"a reason field is a nudge to reconsider, **never evidence for a reader**"*, and
tables the reader's value as unreachable. 🔴 **that goes one step too far.**

- ✅ what holds: **no gate can check the content**, so ungated is the correct shape
- 🔴 what does not: *"unread"* meant **ungated at the moment of the stance**, never *"no reader ever
  comes"*
- ⇒ **the council is the reader, and this verdict makes their read a guarantee rather than a
  convention**

⇒ so the two seeds compose rather than compete: `S04` says **no gate reads it now**; `S05` says **a
human reads it later, and the formalization is what guarantees they can.**

## 🔴 .and a PATH is what converts the guarantee from a hope into a mechanism

the guarantee needs an artifact a council can enumerate. prose in a ledger `reason` string is not
one — it is unaddressable, unsorted, and carries no `rework` grade.

| `--why` as… | can a council guarantee to review it? |
|---|---|
| prose in `passage.jsonl` | 🔴 no. no address, no board, no sort |
| 🔴 **a path to a fulcrum entry** | ✅ yes. it lands on the board `rule.always.defer-fulcrums-to-last` already convenes |

⇒ **that is why the wisher's two verdicts are one verdict.** `--why $path` is not a tidier way to
carry a reason; it is the only shape under which *"we guarantee to review it later"* is a claim a
mechanism can keep.

⚠️ and it is why the two caught dreams matter more than they first read: a guarantee needs
`fulcrum.get --status open`, and a council that never convenes needs an `onStop` nudge.

## .and the formalization is DEEPER than a sentence

- prose at a terminal is one sentence
- a fulcrum entry is `.the fork, stated fairly` · `.taken, and why` · `.rework, and why` ·
  `.what would settle it`
- ⇒ **you cannot fill that in without you state the counter-argument.** far harder to fake past
  yourself than a sentence, and far more use to the council that is guaranteed to read it

## .the cost, stated

- **`F003`'s mint is amended, never overturned.** the command no longer authors the entry from flags;
  it **requires a reference that resolves**. ✅ the *"structurally impossible to violate"* property
  survives — no fulcrum, no dispute — and the mechanism inverts from **write** to **require**
- 🔴 **the ordinal is hand-named today.** that friction is what
  `.dream/v2026_09_09.entool.a-fulcrum-inventory-has-no-operation.md` fixes, ⇒ **the two are now
  coupled: this flag is the consumer that earns that operation**

## .landed

- `.fulcrums/inventory.of=fulcrums.case=F003-who-authors-the-fulcrum-entry.md`
- `.fulcrums/inventory.of=fulcrums.case=F014-why-is-required-and-ungated.md`
- `.fulcrums/inventory.of=fulcrums.case=F017-a-post-rewind-dispute-mints-a-fresh-entry.md`
- `.fulcrums/inventory.of=fulcrums._.md`
- `1.vision.yield.md`
