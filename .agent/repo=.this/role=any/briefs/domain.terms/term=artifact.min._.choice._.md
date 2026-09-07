# domain.term: min

term.chosen   = min
term.kind     = noun
term.boundary = artifact  # a min is a rendition OF an artifact — the same claim at lower fidelity
term.synonyms.forbidden:
- summary      # already claimed: an itemization's `._.` root IS a summary
               # (`rule.require.summary-at-the-cluster-root`), and it indexes MEMBERS.
               # a min indexes no member — one word, two concepts
- condensed    # an adjective, and it names the ACT rather than the artifact. the act
               # already has its own word: `condense`
- digest       # implies a lossy roll-up of MANY sources; a min has exactly one
- tldr         # a section header inside a rule (`rules101.content`), never a file
- abridged     # names what was removed; `min` names what the file IS
- compressed   # implies reversibility, which a min does not have

## .what

a min is a hand-written sidecar that carries an artifact's FIRING content at a fraction of its
size — and which boot loads in place of its source.

```
$brief.md        # the source — the claim, its argument, its evidence, its worked cases
$brief.md.min    # the min — the cue, the test, the enforcement. this is what boots
```

🟡 **the `.min` suffix is not a variant marker, it is a PREFERENCE.** boot prefers the sidecar even
though `boot.yml` names the `.md` path, so wherever a min exists it is the copy a reader gets.

## .the split it draws

| the source holds | the min holds |
|---|---|
| WHY the rule holds | WHAT to do, and when |
| the worked case, the measurement, the counter-argument | the when-then cue table |
| the full enforcement rationale | the blocker list |

⇒ it is the `say` / `ref` split applied **within one artifact** rather than between two files: the
min is what fires unprompted, and the source is what a reader dereferences.

## .the invariant

**a min may drop an ARGUMENT. it may never drop a CLAIM.** a reader who sees only the min must
still obey the rule correctly; what they forgo is the means to judge an edge case the rule does not
enumerate.

## .refs

- `src/domain.roles/driver/briefs/*.md.min`
- `src/domain.roles/learner/briefs/*.md.min`
- `.agent/repo=.this/role=any/briefs/*.md.min`

## .reason

see the ref-level cluster beside this choice:
- `term=artifact.min._.choice.reason.md` — the etymology, the rejected synonyms, the evidence
