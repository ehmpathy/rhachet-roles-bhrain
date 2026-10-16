# rule.always.reuse-pavement-before-improvise

## .what

before you improvise an approach, look for the paved one — and when it exists, reuse it.

a paved path is any artifact a past traveler left so the next one need not re-derive: a brief, a
howto, a template, a skill, a route, a `domain.terms/` cluster, a resolved dispute, a rule.

this is the withdrawal half of externalization. `philosophy.pavement-saves-nature` is the why;
this is the how.

## .why — the learner has rules for deposit and none for withdrawal

before this rule, the learner carried deposit-only rules: `rule.always.externalize.lessons.into_briefs`,
`.into_skills`, `rule.require.domain-term-itemization`, `rule.require.persist-domain-term-evidence`.
each governs how knowledge gets written down. none governs whether it is ever read back — and the
deposit rules are justified entirely by a read that no rule required.

a lesson externalized and never consulted is a lesson lost at higher cost than one never written
— it consumed the author's time, and it now sits in the repo looking like coverage.

## .the two arguments, and they are peers

### 1. it is faster, and it avoids re-derived mistakes

the paved path already carries the incidents that bought it. a re-derivation starts from zero and
repays for the same traps.

### 2. only a reader can improve the pavement — so a skipped read freezes it

pavement compounds only if it is walked, because walkers reveal its potholes. an unread brief
cannot be corrected, so it does not merely fail to help — it silently stops improving, and drifts
from the world it describes. the improviser fixes their own run and leaves the hole open for
everyone else. the reader alone is positioned to widen the path for those who follow.

## .where to look — cheapest and most specific first

a bounded look, in this order. stop at the first hit:

| # | where | how |
|---|---|---|
| 1 | this repo's briefs | `rhx grepsafe --pattern '<concept>' --path src --glob '*.md'` |
| 2 | this repo's `domain.terms/` | is the word already settled? is a dispute already resolved? |
| 3 | this repo's skills, templates, routes | `rhx globsafe --pattern '.agent/**/skills/*'` |
| 4 | the role's own briefs, then the org's | `rhx git.repo.get lines --repos 'ehmpathy/*' --words '<concept>'` |

### scope with `--path`, never with a slash in `--glob`

`grepsafe --glob` matches the file's basename. a glob with a `/` matches no file at all — and
reports that as a clean, cheerful zero:

| the invocation | what it returns |
|---|---|
| `--glob 'src/**/*.md'` | 0 matches, exit 0 |
| `--glob '*.md'` | every `.md`, at any depth |
| `--path src --glob '*.md'` | every `.md` under `src/` — the scoped form |

that zero is indistinguishable from a genuine absence — a traveler looks for pavement, is told
there is none, and improvises.

`globsafe` does not share this defect — its `--pattern` takes a full path, so the
`.agent/**/skills/*` row above is correct as written. two adjacent tools, two different contracts.

### and a `grepsafe` sweep does not read a dot-prefixed file, at any scope

the same silence, from a second cause, with no `--glob`/`--path` repair. measured: 91
dot-prefixed markdown files in this repo are invisible to it, among them `domain.terms/.readme.md`
(the glossary census) and `.dream/.readme.md` (the dream queue's own contract).

a `grepsafe` result is a lower bound, never a census. where the answer must be complete, settle
it with a `Glob` or a `Read` — the move `rule.forbid.itemization-without-coordinates` already
prescribes for a gap check.

### and the third cause is not the tool's at all — it is the pattern you wrote

the two causes above are tool limits; a traveler who learns them concludes "a clean `--path` and
no dotfile means the zero is real." it is not. the third cause survives both repairs, because it
lives in the pattern:

| searched for | the file says | why the search missed |
|---|---|---|
| `FAIL` | `**FAIL**` | the emphasis markers sit inside the phrase |
| `withdrawn` | `WITHDREW` | a different inflection, and upper case |
| `cast*` | `asStripeCustomer` | the concept was renamed; the old word is the one you recall |

prose is the worst corpus for a literal pattern: markdown puts `**`, `_`, and `` ` `` between the
letters of the phrase a reader sees, a writer inflects freely, and a settled rename leaves the old
term live only in memory. so the discipline is not a better pattern; it is to read an empty
result as evidence about the pattern first, the corpus second. where silence would change a
verdict, open the file — one read settles it, and it is the cheapest check on this page.

the asymmetry is why this cause outlives the other two: a false positive is read and dismissed in
seconds; a false negative returns silence, indistinguishable from absence, so it is believed. that
is the braided trail's precondition, made real by the check meant to prevent it.

and it cuts the other way too: a search that matches two words in one file reports co-occurrence,
never a relation. a grep that found `markup` and `scaffold` together read as a synonym collision;
one read of the module between them showed a hierarchy (`scaffold ⊃ markup`) and retired a
half-drafted blocker. a search proposes; only a read disposes.

## .the cues — when → then

| when… | then… |
|---|---|
| you write a step-by-step approach for a task the repo has plainly done before | the strongest cue. grep, do not type |
| you catch yourself about to say "the way to do this is…" | that sentence is a claim the repo may already own |
| you name a new artifact, dir, or convention | check what the repo already names |
| you reach for a workaround because a paved path seems inconvenient | that is the braid. mend the tread instead |
| you cite a brief as your parent claim | glob for it first — a `.see also` is a promise the file exists |
| a peer repo has a convention you could copy | look, then test it. precedent is a reason to look, never to conform |
| a search comes back empty, and that zero would change your verdict | read the file. the pattern is the likelier defect, and its failure is silent |
| a search matches two words in one file and you read a relation into it | it reports co-occurrence, never a relation |

## .the test — forced articulation

before you improvise, answer out loud:

> "has this repo solved this already, and where would it have put the answer?"

- you can name the likely path → look there. one glob, one grep
- you genuinely cannot → improvise, and leave a route behind
  (`rule.always.enskill-the-tactics-you-discover`)

## .when improvisation is right

three cases where it is the correct move:

1. no pavement exists — you are the first traveler. honest work; it owes a route at the end
2. the pavement is measurably wrong — then fix it, per `rule.always.externalize.lessons.into_briefs`.
   do not walk beside it
3. the paved path is for a different bounded context and would mislead — say so, and why

## .do not let this become a stall

the rule is "look first", not "read all of it." a bounded look is a grep, a glob of the obvious
directory, a look at one likely brief; an unbounded look is a survey of the whole repo before any
work begins. a bounded look, then act. two empty searches discharge the rule.

two empty searches with the same pattern are one search. this bound is a budget, never a licence
to believe a silence — a pattern that misses does so quietly, so the second zero feels like a
confirmation when it is a repetition. vary one of these before it counts:

| vary | example |
|---|---|
| the inflection | `withdrawn` → `withdrew` → `withdraw` |
| the emphasis | `FAIL` → `**FAIL**` (markdown puts `**` inside the phrase) |
| the era | the word this repo renamed from — `cast*` before `as*` |
| the layer | the identifier → the word it renders as. `byRound` → `by round` |

the last row misses by construction, never by luck: a blackbox test asserts on rendered output,
so it carries the human's word and cannot carry the implementation name. a search for an
identifier across `*.test.ts` finds every white-box test and misses every black-box one — and the
black-box ones are precisely the coverage you went to look for.

measured: `byRound` returned zero across every test file in `src/domain.operations/review`. the
axis is covered by a dedicated case with a fourteen-line rationale; the suite says "by round",
because it reads stdout. one pattern away from a false gap in a verification yield.

otherwise you discharge the rule on a pattern defect and improvise beside pavement that stood
there the whole time.

## .the anti-patterns

- **the re-derived conclusion** — a traveler settles a question the repo already settled, and the
  re-derivation is worse, because it lacks the incidents that bought the original
- **the braided trail** — a second path laid beside a serviceable one, because the author did not
  look for the first
- **the rut** — a found convention adopted with no test of whether it works
- **the phantom path** — a brief cited as the parent claim of an argument, which was never
  written. it reads as authoritative and dereferences to no match
- **the unbounded look** — a survey that never converges, which discredits the rule itself

## .a phantom path is not merely an unresolvable name — mark the foreign one

the phantom path above has a twin that reads identically to a grep and is not a defect: a name
that belongs to another repo. the two demand opposite treatment, so a sweep that cannot part them
either deletes real evidence or leaves real phantoms.

| the citation | what it is | the repair |
|---|---|---|
| a parent claim — "per `rule.x`, therefore…" — with no file | a phantom path. the argument rests on a premise nobody wrote | write it, or drop the claim |
| a prescribed artifact — a path the rule tells you to create | not a citation at all. it names a future file | state the full path |
| a foreign artifact — a brief, playbook, or skill in a peer repo | legitimate, only if marked | say it is foreign, in the same breath |

an unmarked foreign citation is the expensive one, because it costs the reader rather than the
author: it carries the full authority of a local pointer, so a reader globs, finds no match, and
must then decide whether the repo lost a file or the author cited elsewhere — a judgment they have
no evidence to make.

the test, for every name you write in backticks: "does my argument rest on this, or does it
merely report it?" rests on it → it must exist here, or the claim is unsupported. reports it →
say where it lives, in the same sentence.

## .the evidence — one session, both directions

the two artifacts named below belong to a different repo — `howto.add-a-new-grove.md` and
`.agent/playbooks/.readme.md` sit in the repo where that session ran. this section is testimony
about a measured session, never a set of parent claims this rule leans on.

pavement read: a new cloud box was handed over. the obvious move was to improvise. instead
`howto.add-a-new-grove.md` was read first, and it named three traps no amount of care would have
caught in the moment — among them a box with two login seats, where a run from the wrong one
silently closes 6 of 78 claims while it reports the same message an unconverged box reports. each
trap cost a real incident to learn. the read cost about ninety seconds.

pavement skipped, in the same session: a cull deleted two spent playbooks.
`.agent/playbooks/.readme.md` already carried a section titled ".the rename check" for exactly
that moment. it was skipped; a check was improvised from memory; the improvised check looked for
one shape where two existed, and a dangling reference shipped.

and the paved check would have missed it too — it named the same single shape. so the honest
lesson is sharper than "the pavement was right and i ignored it": to read the pavement is also
the only way to improve it. both checks had the same blind spot; only the reader of the paved one
was positioned to widen it for everyone.

## .enforcement

- a conclusion re-derived that the repo had already settled, with no look = blocker
- a second artifact laid beside a serviceable one, because the first went unread = blocker
- a brief cited as a parent claim with no file behind it = blocker
- a paved path judged wrong and worked around rather than fixed = blocker — that is the braid,
  and the fix is to mend the tread
- a verdict changed on a search's silence, where one read would have settled it = blocker — the
  silence is evidence about the pattern first, and believed silence is how the braid starts
- an unbounded survey that stalls the work = nitpick — the rule is a bounded look
- two empty searches that differ in no way but the file they scanned = nitpick — that is one
  search run twice, and the bound above asks for two

## .see also

- `philosophy.pavement-saves-nature` — the why; this rule is how it acts
- `rule.always.externalize.lessons.into_briefs` / `.into_skills` — the deposit half this completes
- `rule.always.enskill-the-tactics-you-discover` — what you owe when no pavement was found
- `im_an.obsessive_learner` — the trait whose mantra this completes: "and walk the paths that are
  already there"
- `rule.forbid.domain-term-synonyms` — the glossary is pavement; check it before you coin
