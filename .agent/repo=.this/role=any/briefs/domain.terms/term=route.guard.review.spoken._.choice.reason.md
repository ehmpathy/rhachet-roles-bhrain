# domain.term.choice.reason: spoken

## .etymology

**spoken** — the past participle of *speak*. it is chosen because the whole peer-review vocabulary
in this repo is already a **conversation** metaphor, and `spoken` is the one candidate that belongs
to it rather than to a database.

the extant words are `given` and `taken` — what the reviewer **gave** and what the driver **took**.
`rule.always.converge-with-reviewers` opens *"a peer review is a conversation, not a verdict"*, and
the halt reads *"the reviewers await your reply"*. a reviewer that has produced a given has
**spoken**; one that has not, has not.

⇒ **the word was not coined for this field. it was already in the prose.**
`getRouteGuardReviewPeerContemplationStatus.ts` documents the union as
*"(configured ∪ spoken), and `spoken` is exactly what this operation already read"* — the field
adopts the word its own docblock had reached for, which is
`rule.always.reuse-pavement-before-improvise` applied to vocabulary.

## .the rejected alternatives

| word | why it was rejected |
|---|---|
| `seen` | names the READER's experience, not the reviewer's act. and it is ambiguous about who saw: the guard? the driver? a human? |
| `observed` | the same defect as `seen`, in lab dress. it also reads as passive surveillance rather than a party to a conversation |
| `known` | 🔴 the worst of the set — "known to whom, and from what?" it collapses the very distinction the field exists to draw, since a *configured* slug is also "known" |
| `present` | ambiguous between "present in the config" and "present on disk", which are the two sets to be told apart |
| `historical` | implies the given is **past** and therefore inert. the opposite holds: a spoken-but-retired reviewer's given still gates. this word would invite a reader to discount exactly the case the union exists to serve |
| `encountered` | machine-flavoured, and it centres the traversal rather than the reviewer |

⇒ the through-line: every rejected word describes what happened **to the reader**. `spoken`
describes what the **reviewer did** — and the reviewer's act is what the set is a set of.

## .evidence

- **the invariant it carries**: `validSlugs = configured ∪ spoken`. a config-only check would throw
  `invalid peer reviewer slug` on the guard's own printed guidance whenever the reviewer is retired
- **the clamp**: `[case7] [t1]` of `routeStoneSetContemplation.acceptance.test.ts` — the union is
  exercised through the spawned command, so the exit code and the stream are pinned too. that
  assertion is only makeable at the CLI grain, because the slug under test is by definition absent
  from the live config
- **the sort**: deduped and sorted at the source (`getRouteGuardReviewPeerContemplationStatus.ts`),
  so the valid-options list is stable per machine rather than in glob order
- **the single-source lineage**: reported from the read this operation already performs, rather
  than a second full corpus scan by the caller (r11 blocker.1 i004; r11 nitpick.1 i005)

## .disputes

none raised. the word arrived from the operation's own docblock rather than from a debate over what
to call it (r1 nitpick.1, raised at i006 · i007 · i010 · i011 — a request for the cluster, never
for a different word).
