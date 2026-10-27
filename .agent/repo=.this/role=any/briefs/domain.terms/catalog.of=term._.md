# catalog.of=term — this repo's glossary, as an index

one canonical word per concept. read a term on demand; its path is computable from its name:

```
.agent/repo=.this/role=any/briefs/domain.terms/term=$name._.choice._.md        # the word, synonyms forbidden, .what
.agent/repo=.this/role=any/briefs/domain.terms/term=$name._.choice.reason.md   # why: etymology, disputes, evidence
```

e.g. `route.guard.review.taken` → `domain.terms/term=route.guard.review.taken._.choice._.md`

🟡 **before you name a contract, find its word here.** a word absent from this index is a gap,
never a license to coin a synonym.

## .the terms, by boundary root

| root | terms (each name below is `$name`, prefixed by its root) |
|---|---|
| `route` | route · appendix · archive · bind · fulcrum · stone · stone.entry · stone.passage |
| `route.status.line` | line · pointer |
| `route.brain` | address · halt · halt.cause · inheritance |
| `route.guard` | guard · rung · brain · brain.dispatch · brain.dispatch.claim · brain.effort · brain.switch · budget · budget.grant · budget.grant.refusal · budget.grant.warrant · concurrency · concurrency.group · level · level.pour · level.slot · level.wave |
| `route.guard.review` | review · absorption · absorption.concede · absorption.concede.severity · absorption.dispute · clearance · contemplate · contemplate.absent · contemplate.stale · converse · feedback · forgive · given · given.concern · latest · malfunction · overrule · peer · peer.meter · retired · reviewer · spoken · taken · tallier · terminal · unreadable · vibe |
| `review` | attribution · breadth · breakdown · cost · focus · meter · trace · scope · scope.locus · scope.partition · scope.polluter · scope.split · scope.target |
| `review.grade` | grade · attribution.attributed · attribution.unattributed · cache.cold · cache.warm · honesty · honesty.metered · honesty.refused · honesty.unknown |
| `prompt` | chars · composition · cache · cache.eviction · cache.hit-rate · cache.poke · cache.seam · cache.shared-prefix · cache.stability · cache.touch |
| `prose` | prose · absolute · bulletize · condensation · contrastive · diffusion · distillation · elucidation · emphasis · narration · obfuscation · refout · subversive · subversive.shallow · subversive.squishy · summary |
| `artifact` | artifact · dream · footer · min · seed · tool · tool.skill · trait · withdraw |
| `externalize` | externalize · enbrief · enskill · entool · entrait · learn · pave |
| `glossary` | glossary · domain-term · sweep · sweep.progress · sweep.progress.articulation |
| `itemization` | catalog · census · coordinate · inventory · itemize |
| `git` | grove · tree |
| `fs.error` | absence · denial |
| — (flat) | active · breaker · crash · daemon · display · emit · fault · glyph · jitter · orphan · reminder · slug · stdout.body · survival |

a row's first entry equal to its root's last word is the root term itself (e.g. `route.guard.review`).

## .the rest of the glossary, by path

- `domain.terms/.readme.md` — what lives here and who tends it
- `domain.terms/rule.require.domain-term-itemization.md` · `rule.forbid.domain-term-synonyms.md` — the laws
- `domain.terms/catalog.of=externalization._.md` — the en- verb family, which to reach for
- `domain.terms/inventory.of=gaps._.md` · `gap=$word.md` — words owed and not yet held

🟡 **this index is hand-kept.** add a row when a term cluster lands; the census is a glob of
`term=*._.choice._.md`, and a name on disk absent here is the drift to repair.
