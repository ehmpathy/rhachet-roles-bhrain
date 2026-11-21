# critique.of=pioneer-achiever-role

the absorption of the pioneer achiever role (uladkasach/nheuron, tree `vlad/feat-2026-11-01`,
`.agent/repo=.this/role=achiever/`, 16 files, read 2026-11-19) into `src/domain.roles/achiever/`.

## .what landed

| pioneer file | bhrain file | change |
|---|---|---|
| `briefs/im_a.achiever.md` | `briefs/im_an.achiever.md` (say) | renamed; owl lineage line; 🏁 → 💎; nheuron role cites cut (see `.mechanisms`) |
| `briefs/rule.always.act-on-sight.{md,md.min,example=…}` | same names | mechanism translated to bhrain skills |
| `briefs/rule.always.build-never-relay.{md,md.min,example=…}` | same names | nheuron role cite cut; the table row holds the behavior |
| `briefs/rule.always.cure-at-the-owner.{md,md.min,example=…}` | same names | nheuron role cites cut; bhrain/ehmpathy kin cited |
| `briefs/rule.always.keep-the-top-goals-in-view.{md,md.min,example=…}` | same names | mechanism rewritten to the achiever's own onBoot hook |
| `briefs/define.achiever.lessons-from-the-greats.md` | same name (ref) | all 21 rows kept; fifth-law pointer restated; one gerund cut |
| `boot.yml` | merged into the extant `boot.yml` | laws at say, canon + cases at ref; budget 7,500 → 9,500 |
| `readme.md` | merged into the extant `readme.md` | the four laws indexed; min-convention line added |

## .every behavior the four laws hold, and where it is kept

| law | behavior | kept at |
|---|---|---|
| act on sight | a defect seen is recorded and its cure begun the same turn | claim, `.md` + `.min` |
| act on sight | own miss / broken tool / stale rule → record, owner, hour, cure | table row 1 (record via `goal.memory.set`; owner and hour in `--status.reason`) |
| act on sight | an act the goal owes → do it, or record it with a done check | table row 2 (`--how.gate`) |
| act on sight | a fault another seat owns → send it to the owner with the read | table row 3, verbatim |
| act on sight | a class met twice owes a trigger and a mechanism | `.mechanism` + `.min` line |
| act on sight | 3 enforcement lines (2 blocker, 1 nitpick) | all 3, `.md` + `.min` |
| build, never relay | a turn ends in a change or a named block with owner and hour | claim |
| build, never relay | relay / re-hour / plan / block → what each turn owes | table, 4 rows verbatim |
| build, never relay | the second re-hour with no act is the tell; a director seats a builder | `.md` + `.min` |
| build, never relay | 3 enforcement lines | all 3 |
| cure at the owner | fix the published source, never a copy; name the owner first | claim |
| cure at the owner | copy / one-tree symptom / peer output → where the cure goes | table, 3 rows |
| cure at the owner | step one: read where the path resolves and who publishes it | `.md` + `.min` |
| cure at the owner | 2 enforcement lines | both |
| keep the top goals in view | goals live outside context; read at boot, resume, compact, report | claim |
| keep the top goals in view | boot / report / new order → the read each owes | table, 3 rows |
| keep the top goals in view | name the top three and each last move, or read first | test |
| keep the top goals in view | 3 enforcement lines | all 3 in `.md`; the `.min` now carries the third, which the pioneer `.min` omitted |
| all four | one dated case each | `.example=` beside each rule |
| all four | the argument and its sources | `.md` `.why` + `.sources`, unchanged |
| persona | the test before each reply; the five stance lines | `im_an.achiever.md` |

⇒ no behavior was dropped. the translations change the tool a behavior names, never the behavior.

## .mechanisms — each critiqued against the bhrain rules

| # | the pioneer mechanism | the rule it meets | verdict | what landed |
|---|---|---|---|---|
| 1 | `rhx init.incident` as the record of a defect seen | `hazard.published-brief-cannot-cite-the-repo-glossary` — a published brief names only what its reader can run | 🔴 no such skill ships here | `rhx goal.memory.set … --status.choice inflight`; owner and hour in `--status.reason`. the incident's postmortem route has no bhrain twin; the record, owner, hour, and cure all hold |
| 2 | `rhx goal.tree set --done`, `rhx goal.tree get`, a "premises rank" | same | 🔴 nheuron-only | `goal.memory.set --how.gate`, `goal.memory.get`; the rank is named as the read's to make. a shell done check is a later stone of this route |
| 3 | cites `role=delegate`, `role=director`, `role=collaborator`, `role=pioneer`, `role=skeptic`, learner `reflect-seven-deep-seven-wide` | same | 🔴 none of these ship in bhrain | cut, or swapped for kin a consumer can enroll: `rule.always.enskill-the-tactics-you-discover` (bhrain learner), `rule.forbid.workarounds` (bhrain driver), `rule.require.solve-at-cause` (ehmpathy architect), `rule.require.review-test-changes` (ehmpathy mechanic). the pair with role=learner stays |
| 4 | the boot hook of the seat above prints goals, "until a hook lands this rule is the trigger" | `rule.require.timeless-lessons` (no "until") · `rule.always.cure-at-the-owner` (the hook's owner is this repo) | 🟡 the temporal clause, and a hook named in another repo | the achiever's own onBoot (`goal.triage.next --when hook.onBoot`) named as the mechanism; record order, never rank. a probable defect in it is caught: `dreams/v2026_11_19.fix.achiever-onboot-goals-may-never-reach-the-brain.md` |
| 5 | `.md` at say booted as `.md.min`, argument in the `.md` | `rule.prefer.rules-that-refout` (librarian) · the bhrain role readme min convention | ✅ the repo's own form | kept; the readme now carries the min-convention line |
| 6 | one `.example=$slug` per rule, out of the boot | `rule.require.rules-are-clusters` · `rule.forbid.itemization-without-coordinates` (librarian) | ✅ one occurrence per file, named by coordinate | kept; moved from `not` to `ref`, as the driver refs its cases, so each stays addressable from its rule at one path line each |
| 7 | the dated demos name a seat and a day, no repo | `rule.require.timeless-lessons` — a demo owes date, repo, path | 🟡 no repo | `repo uladkasach/nheuron` added; "film" → "a read of the transcript" (no bhrain term for it); each demo points up to its rule |
| 8 | `rule.always.$verb-phrase` for all four laws | `on.rules/rules101.structure` — the topic's grammar picks the directive | ✅ all four are verb phrases, so `always` | kept |
| 9 | `- … = **blocker**` / `= **nitpick**` enforcement lines | `contract.reviewer-output` — two kinds only, no third bucket · `rule.forbid.overzealous-blockers` — a blocker names a harm | ✅ two kinds; each blocker names a shipped miss (an unrecorded defect, an unbuilt order, a stale copy, a goal lost at a compaction) | kept |
| 10 | `.what` / `.why` / `.the table` / `.the test` / `.enforcement` / `.sources` | `on.rules/rules101.content` declares a `# tldr` / `# deets` shape with a `## severity:` header | 🟡 the pioneer does not follow rules101.content; neither do the driver, learner, or librarian rules here | kept in the shape the peer roles use; the gap is rules101.content's, repo-wide, and not this change's to settle |
| 11 | `im_a.achiever` with a 🏁 role glyph and a 🦫 footer | `define.bhrain-repo-mascot` — 💎 is the achiever's marker; the owl is the voice · `im_an.obsessive_learner` names the form | 🔴 a second glyph for the achiever, and a mascot not the owl's | `im_an.achiever`, 💎, "extends the bhrain owl"; footers cut |
| 12 | the readme's pioneer status, promotion path, and composed-role note | `rule.forbid.chronological-accretion` · `rule.require.timeless-lessons` | 🟡 a history of nheuron, not a fact of this role | not carried. the retirement of the nheuron copy is the extant reseed dream `v2026_11_03.reseed.nheuron-switches-to-the-achiever-and-deletes-goal-tree` |
| 13 | the fifth law (a cure keeps every prior behavior) cited from the director role | `hazard.published-brief-cannot-cite-the-repo-glossary` | 🟡 out of the four; its rule does not ship | its three lessons (14–16) stay in the canon, which now names the law as unshipped and points to its nearest bhrain-reachable kin |
| 14 | a pioneer boot budget of 3,500 for the laws alone | `roleBootClamps` — budget = least multiple of 250 above the seat payload, cap 10,000 · "never cut a cue to fit" | 🟡 the merged role is 9,321 tokens as a seat | budget 9,500. the shrink lever is the blueprint's own: `define.lucky-charms` and `rule.always.fix-forward-under-scouts-honor` to ref with `.min` peers, and `.min` peers for the two itemize rules (3,385 tokens at say today) |
| 15 | a min whose cue lines no test pins | `rule.require.a-cue-is-not-a-claim` · `roleBootClamps` pins cue lines only for condensed roles | 🟡 achiever is budget-only, so a cut cue passes | caught: `dreams/v2026_11_19.feat.achiever-boot-clamps-its-cue-lines.md` |
| 16 | prose with cited titles and surnames | `rule.forbid.gerunds` hook | 🟡 the hook flags names, titles, and urls; one real gerund in the canon was cut | caught: `dreams/v2026_11_19.reseed.gerund-hook-flags-names-and-citations.md` |

## .what did not land, and why

- the onStop wires and the cure on `blocked` (the two clamps of the wish) — the 5.1 execution stone,
  per the blueprint under review
- the blueprint's three delegate briefs (`achieve-relentlessly`, `track-every-ask`,
  `tolerate-a-blocker`) — the four laws now hold the first; `rule.always.itemize-a-peers-asks-into-tasks`
  already holds the second; the third (a block owes a cure) is the blueprint's clamp 2 and lands with
  it in 5.1
