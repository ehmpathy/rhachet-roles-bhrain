# rule.always.reuse-pavement-before-improvise

## .what

**before you improvise an approach, look for the paved one — and when it exists, reuse it.**

a **paved path** is any artifact a past traveler left so the next one would not have to
re-derive: a brief, a howto, a template, a skill, a route, a `domain.terms/` cluster, a resolved
dispute, a rule.

this is the **WITHDRAWAL** half of externalization. `philosophy.pavement-saves-nature` is the why;
this is the how.

## .why — the learner had four rules for DEPOSIT and none for WITHDRAWAL

state the gap plainly. before this rule, the learner carried:

| rule | direction |
|---|---|
| `rule.always.externalize.lessons.into_briefs` | deposit |
| `rule.always.externalize.tactics.into_skills` | deposit |
| `rule.require.domain-term-itemization` | deposit |
| `rule.require.persist-domain-term-evidence` | deposit |
| **this rule** | **withdrawal** |

every one of the first four governs how knowledge gets **written down**. not one governed whether
it is ever **read back** — and the deposit rules are justified *entirely* by a read that is
supposed to follow. `rule.always.externalize.lessons.into_briefs` says *"briefs compound — each
one makes the next traveler faster"*, which is a claim about a read that no rule required.

⇒ **a lesson externalized and never consulted is a lesson lost at HIGHER cost than one never
written** — it consumed the author's time, and it now sits in the repo looking like coverage.

## .the two arguments, and they are peers

most readers stop at the first. **the second is the one that belongs to the learner.**

### 1. it is faster, and it avoids re-derived mistakes

the paved path already carries the incidents that bought it. a re-derivation starts from zero and
will rediscover the same traps by paying for them again.

### 2. 🟡 only a reader can improve the pavement — so a skipped read FREEZES it

this is the argument that makes the rule the learner's rather than merely an efficiency tip.

**pavement compounds only if it is walked, because walkers are what reveal its potholes.** an
unread brief cannot be corrected, so it does not merely fail to help — it silently stops
improving, and drifts from the world it describes.

⇒ the improviser fixes their own run and leaves the hole open for everyone. the reader is the
only one positioned to widen the path for all who follow.

## .where to look — cheapest and most specific first

a **bounded** look, in this order. stop at the first hit:

| # | where | how |
|---|---|---|
| 1 | this repo's briefs | `rhx grepsafe --pattern '<concept>' --path src --glob '*.md'` |
| 2 | this repo's `domain.terms/` | is the word already settled? is a dispute already resolved? |
| 3 | this repo's skills, templates, routes | `rhx globsafe --pattern '.agent/**/skills/*'` |
| 4 | the role's own briefs, then the org's | `rhx git.repo.get lines --repos 'ehmpathy/*' --words '<concept>'` |

### 🟡 scope with `--path`, never with a slash in `--glob`

`grepsafe --glob` matches the file's BASENAME. so a glob that carries a `/` matches no file at
all — and it reports that as a clean, cheerful zero:

| the invocation | what it returns |
|---|---|
| `--glob 'src/**/*.md'` | 0 matches, exit 0, `🐢 crickets...` |
| `--glob '*.md'` | every `.md`, at any depth |
| `--path src --glob '*.md'` | every `.md` under `src/` — the scoped form |

🟡 **that zero is indistinguishable from a genuine absence**, which makes it the exact failure this
rule exists to prevent: a traveler looks for pavement, is told there is none, and improvises. the
tool reports the braided trail's precondition as a completed check.

⇒ and `globsafe` does NOT share the defect — its `--pattern` takes a full path, so the
`.agent/**/skills/*` line in the look-list above is correct as written. two adjacent tools, two
different contracts — which is why the rows above spell each one out rather than assume they rhyme.

### 🟡 and a `grepsafe` sweep does not read a DOT-PREFIXED file, at any scope

the same silence, from a second cause, and no `--glob` or `--path` form repairs it.

| the fixture, measured 2026-09-06 | reported |
|---|---|
| `plain.md` — one marker | yes |
| `.dotfile.md` — the same marker | **no** |

🟡 **91 dot-prefixed markdown files in this repo are invisible to it**, and two of them are the ones
a pavement check most wants: `domain.terms/.readme.md`, this repo's glossary census, and
`.dream/.readme.md`, the dream queue's own contract.

⇒ so a `grepsafe` result is a **lower bound**, never a census. where the answer must be complete,
settle it with a `Glob` or a `Read` — the move
`rule.forbid.itemization-without-coordinates` already prescribes for a gap check. the tool fix is
caught at `.dream/v2026_09_06.reseed.grepsafe-skips-every-dot-prefixed-file-and-reports-a-clean-sweep.md`,
deferred because `grepsafe` belongs to `ehmpathy/rhachet-roles-ehmpathy`.

## .the cues — when → then

| when… | then… |
|---|---|
| you are about to write a **step-by-step approach** for a task the repo has plainly done before | the strongest cue. **grep, do not type** |
| you catch yourself about to say *"the way to do this is…"* | that sentence is a claim the repo may already own |
| you are about to **name** a new artifact, dir, or convention | check what the repo already names. this rule's own repo got that wrong twice in one hour |
| you reach for a **workaround** because a paved path seems inconvenient | that is the braid. mend the tread instead |
| you are about to **cite** a brief as your parent claim | glob for it first — a `.see also` is a promise the file exists |
| a peer repo has a convention you could copy | look, then **test it**. precedent is a reason to look, never a reason to conform |

## .the test — forced articulation

before you improvise, answer out loud:

> **"has this repo solved this already, and where would it have put the answer?"**

- you can name the likely path → **look there.** one glob, one grep
- you genuinely cannot → improvise, and **leave a route behind**
  (`rule.always.enskill-the-tactics-you-discover`)

## .when improvisation IS right

the rule is not "never improvise." three cases where it is the correct move:

1. **no pavement exists** — you are the first traveler. honest work; it owes a route at the end
2. **the pavement is measurably wrong** — then **fix it**, per
   `rule.always.externalize.lessons.into_briefs`. do not walk beside it
3. **the paved path is for a different bounded context** and would mislead — say so, and say why,
   so the next reader is not caught by the same near-miss

## 🟡 .do not let this become a stall

**the rule is "look first", not "read everything."** an unbounded search is its own failure mode,
and it would earn this rule a reputation as friction — which is how a rule gets deferred.

- **bounded** = a grep, a glob of the obvious directory, a look at one likely brief
- **unbounded** = a survey of the whole repo before any work begins

⇒ a bounded look, then act. if two searches turn up empty, you have discharged the rule.

## .the anti-patterns

- **the re-derived conclusion** — a traveler settles a question the repo already settled, and the
  re-derivation is **worse**, because it lacks the incidents that bought the original
- **the braided trail** — a second path laid beside a serviceable one, because the author did not
  look for the first (`philosophy.pavement-saves-nature`)
- **the rut** — a found convention adopted with no test of whether it works. the mirror failure:
  the author *did* look, and conformed anyway
- **the phantom path** — a brief cited as the parent claim of an argument, which was never
  written. it reads as authoritative and dereferences to no match
- **the unbounded look** — a survey that never converges, which discredits the rule itself

## .a phantom path is not merely an unresolvable name — mark the FOREIGN one

the phantom path above has a twin that reads identically to a grep and is **not a defect**: a name
that belongs to another repo. the two demand opposite treatment, so a sweep that cannot part them
either deletes real evidence or leaves real phantoms.

| the citation | what it is | the repair |
|---|---|---|
| a **parent claim** — *"per `rule.x`, therefore…"* — with no file | **a phantom path.** the argument rests on a premise nobody wrote | write it, or drop the claim |
| a **prescribed artifact** — a path the rule tells you to create | not a citation at all. it names a future file | state the full path, so the reader knows where |
| a **foreign artifact** — a brief, playbook, or skill in a peer repo | legitimate, and only if it is MARKED | say it is foreign, in the same breath |

🟡 **an unmarked foreign citation is the expensive one, because it costs the READER rather than the
author.** it carries the full authority of a local pointer, so a reader globs, finds no match, and
must then decide whether the repo lost a file or the author cited elsewhere — a judgment they have
no evidence to make.

⇒ **the test is one question, asked of every name you write in backticks:**

> **"does my argument REST on this, or does it merely REPORT it?"**

rests on it → it must exist here, or the claim is unsupported · reports it → say where it lives, in
the same sentence.

## .the evidence — one session, both directions

🟡 **the two artifacts named below are FOREIGN to this tree** — `howto.add-a-new-grove.md` and
`.agent/playbooks/.readme.md` belong to the repo where that session ran. a glob for either here
returns no match, and that is correct: this section is **testimony about a measured session**,
never a set of parent claims this rule leans on. the claims it leans on are stated above it.

**👍 pavement READ.** a new cloud box was handed over. the obvious move was to improvise. instead
`howto.add-a-new-grove.md` was read first, and it named three traps no amount of care would have
caught in the moment — among them a box with **two** login seats, where a run from the wrong one
silently closes 6 of 78 claims **while it reports the same message an unconverged box reports.**
each trap cost a real incident to learn. the read cost about ninety seconds.

**👎 pavement SKIPPED, in the same session.** a cull deleted two spent playbooks.
`.agent/playbooks/.readme.md` already carried a section titled *".the rename check"* for exactly
that moment. it was skipped; a check was improvised from memory; the improvised check looked for
one shape where two existed, and a dangling reference shipped.

🟡 **and the paved check would have missed it too** — it named the same single shape. so the
honest lesson is not *"the pavement was right and I ignored it."* it is sharper:

> **to READ the pavement is also the only way to IMPROVE it.** both checks had the same blind
> spot; only the reader of the paved one was positioned to widen it for everyone.

## .enforcement

- a conclusion re-derived that the repo had already settled, with no look = **blocker**
- a second artifact laid beside a serviceable one, because the first went unread = **blocker**
- a brief cited as a parent claim with no file behind it = **blocker**
- a paved path judged wrong and **worked around** rather than fixed = **blocker** — that is the
  braid, and the fix is to mend the tread
- an unbounded survey that stalls the work = **nitpick** — the rule is a bounded look

## .see also

- `philosophy.pavement-saves-nature` — the why; this rule is how it acts
- `rule.always.externalize.lessons.into_briefs` / `.into_skills` — the deposit half this completes
- `rule.always.enskill-the-tactics-you-discover` — what you owe when no pavement was found
- `im_an.obsessive_learner` — the trait whose mantra this completes: *"and walk the paths that are
  already there"*
- `rule.forbid.domain-term-synonyms` — the glossary is pavement; check it before you coin
