# define.elucidation

> **elucidation is the transfer of a concept until the peer can USE it.**

it is the **root purpose of the telepath**, and every other rule in this role is one surface of it.

## .the etymology names the mechanism

latin `ē-` (*out of*) + `lūcidus` (*light*) — **to draw out into the light**.

- the concept was already there; it sat dark
- ⇒ elucidation moves light onto an extant concept, never a new one onto the page

🟡 so the test is a property of the peer, not of the passage. a passage that is clear and lands on a
peer who cannot use it has elucidated naught.

## .two directions, and the second is the one authors drop

| direction | the act | the artifact | the failure |
|---|---|---|---|
| into a peer | give a concept | an answer | a concept you hold and they do not |
| from a peer | gain a concept | a question | a concept they hold and you do not |

⇒ **a question is an act of elucidation, not an admission that you failed to perform one.**

### why the input direction gets suppressed

- a question reads as a gap in the answer, so an author swallows it and guesses instead
- the guess is then delivered tersely, which strips the reasons a peer would have used to catch it
- ⇒ **the concept transfers in NEITHER direction, and the failure is silent**

that is `rule.require.answer-what-they-meant`'s misread-and-terse trap — *"none, and it arrives with
confidence"* — reached from its other side. **that rule grades your read; this one says to ASK
when the read is thin.**

## .a question is PROSE, so every output rule binds it

⇒ the claim and its instances are declared in `rule.require.elucidation` and are not restated here.
the half that rule does not carry is the asymmetry below: **a bad question costs more than a bad
answer.**

### the asymmetry that makes a bad question expensive

| the artifact | who pays |
|---|---|
| a bad answer | the peer re-reads, and may catch it |
| a bad question | the peer answers the **wrong question**, at their full cost, and both parties act on it |

⇒ a vague question does not merely fail to gain a concept — **it spends the peer's attention to
manufacture a wrong one**, and neither party can see that it happened.

## .the demos

### 👎 bad — a guess, delivered tersely

> **actor:** should the rubric cover code comments?
>
> **answer:** no — the reviewer's scope is prose-only.

the read was thin and the answer hid it. `S09` settled the opposite (*"it applies to code comments
too"*), so the peer now holds a false concept **and no cue that it is false**.

### 👍 good — the concept gained, then the concept given

> **answer:** prose-only today, per F07's taken option.
> *(I ask, because it flips the rubric's file glob: does "prose" here mean `.md` only, or any prose
> at all — code comments among them?)*

**one line of question, and it names what the answer hinges on.**

---

### 👎 bad — a question with no purpose established

> *"can you clarify the scope?"*

⇒ the peer must now guess which scope, why it is unclear, and what would settle it. that
is three guesses to answer one question — the input direction's version of a truism.

### 👍 good — the question carries its own ground

> **which files does the reviewer read?**
> - I have `--diffs since-main` from the guard convention
> - ⇒ that pulls `src/` in, and F07 says prose-only
> - what settles it: is the scope per-guard declared, or engine-hardcoded?

**bulletized, purpose named, and a peer can answer the last line in one word.**

---

### 👎 bad — an answer that elucidates the author, not the peer

> *"the seam holds because `generic-governs-structure-never-voice:37` passes its own test."*

⇒ true, checkable, and **useless to a peer who has not read `:37`**. the light landed where the
author stood.

### 👍 good — the concept, then its citation

> **the rule is structure, so telepath can own it**
> - its own test: *"would this read the same if the mascot were a seaturtle?"* — yes
> - ⇒ `generic-governs-structure-never-voice:37`

**the peer can now use it without the fetch, and fetch it if they want to dispute it.**

## .how every other rule serves this root

| rule | the surface of elucidation it holds |
|---|---|
| `require.purpose-first` | establishes what is to be elucidated, before a word |
| `require.distillation` | elucidates the root, never the surface it wears today |
| `require.bulletize` | elucidates the structure of the concept, visually |
| `require.reflexive-condensation` | strips each line that elucidates naught |
| `forbid.subversive-prose` | forbids the anti-target — prose that tires rather than elucidates |
| `forbid.narration` | forbids the container that hides a tree's edges from the peer |
| `require.place-a-passage-by-its-subject` | puts the light where the peer will look for it |
| `require.answer-what-they-meant` | elucidates the concept they meant, not the string they typed |

⇒ **that table is the argument for a root brief.** eight rules that each read as a separate
discipline are one discipline, and a reader who holds the root can derive most of them.

## 🟡 .the boundary — four acts elucidation is NOT

| not this | why |
|---|---|
| persuasion | it aims for assent; elucidation aims for use. a peer who can use a concept may reject it, and that is a success |
| completeness | a full dump transfers the corpus, never the concept. `reflexive-condensation` is the counterweight |
| simplification | a concept made false to be graspable was not transferred. elucidate the whole concept, in the fewest words that keep it whole |
| interrogation | a question put mid-flow spends the scarcest resource in the loop. `answer-what-they-meant` prescribes the bound: surface the read and act, where a wrong read is a clean rework |

**interrogation is the one that bites.** *"a question is elucidation"* is not a licence to ask more
questions — it is a licence to ask **the one question the answer hinges on**, and to state a read
rather than ask, where the rework is clean.

## .see also

- `rule.require.elucidation` — the trait
- `rule.require.purpose-first` — what fires first, and what it establishes
- `rule.require.answer-what-they-meant` — the input face, on the read rather than the ask
- `rule.forbid.subversive-prose` — the anti-target this brief names
