# define.distillation

## .what

distillation is concept decomposition and condensation into fundamentals — then speech in those
terms, never in the surface the concept happens to wear today.

⇒ the two moves, the drill's floor, and the check that proves the decompose finished are declared
in `rule.require.distillation` and are not restated here.

⇒ **what falls out is a TREE OF FUNDAMENTALS, and that is precisely what
`rule.require.bulletize` renders.** distillation produces the tree; bulletize draws it. the two
are one pipeline, and an author who bulletizes an undrilled concept renders a tree of surfaces.

## .the subject is the CONTENT — the passage drill is a peer rule

there are two drills, and only the first is this rule's:

| drill | the question | it catches | owned by |
|---|---|---|---|
| the content drill | *what root truth does this claim stand on?* | a mechanism stated where its motive was the claim | **this rule** |
| the passage drill | *why must this be said at all?* | a passage that is deep, correct, and needed by no one | `rule.require.purpose-first` |

**both are owed on every passage, and they fail in opposite directions.** the content drill alone
yields a profound passage nobody needed; the passage drill alone yields a needed passage pitched at
the surface.

⇒ they are parted rather than fused because they fire at different moments: `purpose-first`
establishes the target before a word exists; distillation drills the claim as it is formed.

## .why

### 1 · a surface decays with its surface; a fundamental outlives it

| what you wrote | its lifespan |
|---|---|
| the surface — the mechanism, the tool, the shape it wears today | dies with the next refactor |
| the fundamental — the motive, the constraint, the truth beneath | survives every rewrite of the subject it describes |

⇒ this is `def.domain-discovery`'s claim, applied to prose rather than to a name: *"a term that
names the surface decays with it; a term that names the buried truth outlives every rewrite."*

### 2 · a fundamental is checkable; a surface claim often is not

*"this approach is robust"* has no root beneath it, so a reader can neither confirm nor refute it.

⇒ **that is why this and `rule.forbid.subversive-prose` fire on many of the same passages: an
undrilled claim is usually an undisputable one.** they are distinct rules with a shared symptom —
one grades **depth**, the other grades **falsifiability**.

### 3 · a fundamental transfers; a surface does not

- a reader who holds the mechanism can re-derive the surface
- a reader who holds only the surface can derive no part of the mechanism

### 4 · the drill changes what you CONCLUDE, not merely how you say it

the root is often a **different claim** from the one you opened with. so this is a check on the
thought, never a rewrite of the sentence — and that is what parts it from every other rule here.

## .the method — the five whys, already paved

`howto.domain-discovery` (architect) carries the drill: *"ask why ~5x; each why strips a layer of
mechanism; the answer that no longer shifts is the buried motive."*

🟡 **every example there is a dobj/dop name**, so a reader at work on prose reads straight past it.
this is that drill specialized to prose
(`rule.require.specialize-a-rule-its-readers-look-past`).

⇒ the razor that specialization yields is `rule.require.distillation`'s, stated there.

## .the demos

### 👎 bad — the surface, named accurately

> the `.md.min` was lossy — it dropped the word `log` from its source.

🟡 **true, precise, and shallow.** it names *what happened* and stops, so a reader gains a fact and
no way to price it.

### 👍 good — drilled to the root

> **the lossy min is a wrong-fix generator, never a misinformed reader**
> - the `.md.min` is what boots — the precise source is never read
>   - ⇒ so the source is correct and every reader is wrong
> - ⇒ a reader who reached for *"the output file exists"* as the discriminator would tally every
>   skip as a pass

⇒ the drill changed the claim. *"a word was dropped"* became *"a live design decision would be made
wrong"* — which is the fact a reader can act on.

---

### 👎 bad — four surface adjectives

> this approach is robust and scalable, and the implementation is clean.

🟡 **each word is individually defensible and the sentence asserts naught.**
`rule.require.brevity` and `rule.forbid.rambles` do not fire — there is no surplus word to cut.
**only the drill catches it.**

### 👍 good — each adjective replaced by what it stood for

> - retries on `429` with backoff — a rate-limit spike costs latency, never data
> - the work partitions by customer id — a second worker doubles throughput with no coordination
> - one operation per file, named for its motive — a reader finds it with no grep

---

### 👎 bad — the mechanism reported as the request

> the actor asked for a `--verbose` flag, so I added one.

### 👍 good — drilled to the motive

> - the default swallowed the stderr line on a non-zero exit
>   - ⇒ so the actor could not see **why** it failed — the flag was their workaround
>   - ⇒ fixed the default; the flag stays, and few will now reach for it

🟡 **two whys, and the deliverable changed.** at the surface this is a flag; at the root it is a
defect the flag would have papered over.

## .the boundary — where the surface IS the fundamental

| speak at the surface | why |
|---|---|
| a command, path, or literal a reader must type | the exact string is the root truth. never paraphrase it |
| a verbatim quote | never drill someone else's words. quote, then drill beside it |
| a measurement | a number is already a fundamental. state it flat |
| the surface is the subject — a rule about filenames, a hook's exit code | its mechanism is what a reader came for |

🟡 **the drill has a floor: the answer that stops to shift.** to ask past it yields philosophy where
a fact was owed — *"why does the engine tally?"* → *"why do we review at all?"* → you have left
the passage's subject.

## .see also

- `rule.require.distillation` — the trait this definition grounds
- `rule.require.purpose-first` — the passage drill, which parted from this one
- `rule.require.reflexive-condensation` — the reflexive peer: this drills the concept, that cuts the
  draft you just emitted
- `rule.require.bulletize` — what renders the tree this produces
- `rule.forbid.subversive-prose` — the shared symptom: an undrilled claim is usually undisputable
- `howto.domain-discovery` · `def.domain-discovery` (architect) — the five whys, and the decay claim
