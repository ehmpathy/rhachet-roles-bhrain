# fix(roles): clamp the learner, driver, and librarian boots to a declared budget

## what

each role's booted briefs now carry only their cue (the claim, the test, every when/then row,
every enforcement line). the argument (why-paragraphs, measured cases, history) stays in the full
`.md` beside each `.md.min`, one Read away. each `boot.yml` declares `budget: tokens:`, so the
next edit that bloats a min halts `roles boot` here, with its fix printed.

## before / after (`npx rhachet roles cost --all`, o200k_base)

| role | before | after | after, as a seat boots it | budget |
|---|---|---|---|---|
| learner | 26,846 | 20,536 | 20,691 | 20,750 |
| driver | 25,672 | 19,847 | 20,002 | 20,250 |
| librarian | 14,116 | 11,912 | 12,017 | 12,250 |
| **sum** | **66,634** | **52,295** | **52,710** | — |

🟡 **needs director sign-off: this ships at 52.7k a seat, not the ~29k proposed.** every cue is
intact; the tighten that closes the gap (~40% of each boot) is its own pr (F10).

a 22% cut. a seat boots each role from `.agent/repo=bhrain/role=<slug>/`, and every booted path
rides in the payload, so the seat form costs ~105–155 more than the `src/` form. each budget is
the least multiple of 250 strictly above the seat form, which the clamp boots and pins. the
director's proposals (12k · 12k · 5k) need a tighten pass over cue rows, which
is deferred to its own pr so a cut cannot hide among reworded rows
(`.dream/v2026_10_21.feat.tighten-the-role-boot-cues-to-the-proposed-budgets.md`).

## how

- every min rewritten toward its cue. `rhx census.cues --emit` before and after
  (`.behavior/v2026_10_21.fix-clamp-role-boot-budgets/.census/`), sorted by `rhx census.cuesdiff`:
  of 1,458 markup-cue lines, 85 left the mins. 37 sit verbatim in the `.md` beside them; 48 are
  min compressions of a `.md` passage that the `.md` still carries in its longer words (spot-read:
  seven of seven found reworded in the `.md`, none lost). 62 arrived, most of them `rule.forbid.verbatim-quotes-outside-seeds`, which the driver
  now boots. the markup classifier cannot see a cue written as prose, so it ranks briefs and never
  gates a cut; the clamp snapshot below pins every booted line instead
- every `## .why` section with no cue line moved out of its min to the `.md` (13 sections), via a
  new repo-local `rhx brief.min.moveout`. it names each section it moves, holds any section with a
  cue line (the shared classifier) or whose header the `.md` lacks, and reads a `#` inside a fence
  as no section end
- `src/domain.roles/roleBootClamps.integration.test.ts`: the roles that declare a budget are
  exactly these three. per role, it runs the real `rhachet roles boot` (exit 0 under budget) and
  snapshots the budget, the `not` list, every line of every brief booted at say, and every brief
  booted at ref, so a later cut, a reworded cue, or a raised budget is a snapshot diff. it checks
  every booted min has its `.md` beside it, no booted header stands over an emptied section
  (`asHeadersOrphanedOfText`, unit-tested), the boot carries the readme line that points each min
  to its `.md`, and the budget `roles boot` enforces equals the one `boot.yml` declares. an
  over-budget fixture snaps the halt (exit 2, with its four fixes); an at-limit fixture, whose
  budget equals its payload, boots (exit 0). a seat-form case copies each role (symlinks
  dereferenced) to `.agent/repo=bhrain/role=<slug>/` in a temp dir, boots it there, and pins its
  payload; a plain copy halts on overshoot where a linked spec only warns. it also asserts each
  budget is the least multiple of 250 strictly above that payload, every brief declared at say
  and ref is booted (a typo or a dangled link no longer drops a cue in silence), and a linked
  seat over budget warns at exit 0 (what a seat in this repo or a consumer sees)
- `blackbox/roles.boot.consumer-seat.acceptance.test.ts`: per budgeted role, a bare consumer repo
  runs `roles link` against the built package and boots it: under budget, every booted min has
  its `.md` beside it, and the readme line reaches the boot
- one cue classifier, `src/domain.operations/learn/asBriefLinesByCue.ts`, shared by the
  repo-local `rhx census.cues` and `rhx brief.min.moveout`; one glob helper shared by the three
  repo-local census and moveout skills, which halts on a glob that names no file
- `src/domain.roles/getRoleRegistry.integration.test.ts` clamps every role's readme uri to a file
  named `readme.md` that exists (proven red under the librarian's former `.readme.[seed].md`)
- learner `rule.forbid.native-memory` moves to ref: `memory.guard` prints its redirect at the act.
  driver `howto.run-self-reviews` moves to ref too: the self-review guard prints the guide, the
  path, and each fix at the ask. `rule.always.absorb-every-concern` stays at say, since its refusal
  prints the commands but not the judgment
- every booted min in `dist` has its `.md` beside it (65 of 65). the build now copies with
  `rsync --copy-links`, so a brief symlinked into a role ships as a regular file, not a link that
  dangles in a consumer's `node_modules` (clamped in `getRoleRegistry.integration.test.ts`;
  red without the flag)
- driver boots the learner's `verbatim-quotes` min via a symlink; librarian names its unlisted
  `knowledge/` members under `not`, and its role now points at a shipped `readme.md` (the build
  copies only `**/readme.md`, so the `.readme.[seed].md` it named never reached dist; thinker's
  shape)
- one convention line per readme: each `X.md.min` condenses the `X.md` beside it
- role=any boots the learner persona's min too, via a symlink beside its `.md`
- reviewer: untouched

## note

an extant seat picks up the librarian's new `readme.md` (and its min → `.md` line) only once it
re-links: `npx rhachet roles link --role librarian`, or a fresh `rhx init`. until then its boot
emits no librarian readme.

the rhachet-brains-openrouter patch retires when rhachet-brains-openrouter.beav.fix-429-hop-and-tier-fallback releases.

rhachet is pinned to the published `1.50.1`, which carries rhachet#636 (`fix(clone): a leaf clone may not spawn; a work clone may spawn at any depth`), the fix the l3 review lanes need.

the 5.1 judge (j1) counts no `better` concession on an exhausted lane, so it needed no patch here.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
