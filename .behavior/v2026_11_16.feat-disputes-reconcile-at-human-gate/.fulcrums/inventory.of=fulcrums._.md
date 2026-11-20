# inventory.of=fulcrums — v2026_11_16.feat-disputes-reconcile-at-human-gate

each row reads from its entry's frontmatter; the entry is the record.

| case | title | rework | status | owed | confidence |
|---|---|---|---|---|---|
| F1 | the dispute's confidence is read from its fulcrum frontmatter, `--confidence` is not a second home | clean | ruled | none | 0.75 |
| F2 | the human's verdict lever is `route.fulcrum.rule`, not a new `--as` value on `route.stone.set` | clean | ruled | none | 0.60 |
| F3 | the approval halt reads every open `owed: human` fulcrum on the route, not only this stone's | clean | held | none | 0.85 |
| F4 | a dispute on the DIRTY ground owes a human at any confidence; only WRONG ∧ ≥ 0.90 owes a reflection | clean | ruled | none | 0.70 |
| F5 | a route with no human gate refuses its last stone while an `owed: human` dispute is open | clean | ruled | none | 0.55 |
| F6 | a human's conceded verdict does not re-hold the stone; the human withholds approval | clean | ruled | none | 0.65 |
| F7 | no blueprint stone; the route stays as declared | clean | ruled | none | 0.70 |
| F8 | the `.husky` hooks are out of this route's scope | clean | open | human | 0.85 |
| F9 | the repo's extant conventions (`assert*` prefix, optional cli flags) are kept, not reformed here | clean | open | human | 0.75 |
| F10 | the route's record stands as approved: F1–F7 entries exist; the vision is not amended | clean | open | human | 0.80 |
| F11 | the verdict ledger is tracked at `.fulcrums/verdicts.jsonl`, beside the yaml it proves | clean | superseded by F17 | none | 0.80 |
| F12 | four concerns grade code absent from the reviewed tree; reflected as ehmpathy/rhachet-roles-bhrain#804 | clean | open | reflect | 0.97 |
| F13 | the summary-row derive ships in its own route; the linter enforces the frontmatter here | dirty | open | human | 0.70 |
| F14 | the lever's verdict words are `upheld \| conceded` | dirty | open | human | 0.60 |
| F15 | the `--reflect` ref is checked by shape, never by a live lookup | dirty | open | human | 0.65 |
| F16 | the frontmatter keeps `rework`, `status`, and `holds` typed, as the wish lists them | dirty | open | human | 0.70 |
| F17 | the verdict ledger sits under the route seal, as its own file | clean | open | none | 0.85 |
| F18 | `--reflect` is refused on a dispute that owes a human | clean | open | none | 0.80 |
| F19 | the budget refusal on a disputed lane keeps today's bytes | clean | open | none | 0.75 |
| F20 | the approval refusal's scope stays route-wide | clean | open | none | 0.70 |

F1, F2, F4–F7 are design calls the wisher settled at a stone gate. each verdict lives in its
entry's `.verdict` section; the yaml `verdict` stays `null`, since a design call owes no dispute
and no human lever wrote a row the ledger could prove.

F8–F10 and F13–F16 hold the concerns disputed at 5.1. they owe a human verdict, so 5.1 cannot pass until a
human runs `rhx route.fulcrum.rule` on each.
