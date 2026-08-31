# domain.term.choice.reason: learn

## .etymology
to **learn** — from old english *leornian*, to gain knowledge and hold it. it names the
learner role's whole purpose: durable retention, so a lesson hardwon once is never lost. chosen
over `study` (names the effort, not the retention — one can study and forget), `train` (implies
an external drill of a subject, not the self-directed retention the learner does), and `memorize`
(rote + shallow, the opposite of the learner's crystallize-and-externalize act).

## .disputes

### dispute: pave  —  raised 2026-08-12  —  status: RESOLVED (both stand; distinct concepts)
- raised.by  = driver, mid-vision for `feat-adopt-seeded-briefs`
- claim      = the learner's own briefs and its onStop hook both say **pave** beside **learn**
               ("pave the path for the next traveler", "pave the path for any new ones"). two
               words for one act would be synonym drift, so one of them should be forbidden
- counter    = they are not one act. they differ in **beneficiary and direction**:
               **learn** = durably retain a lesson so it is not re-derived — the beneficiary is
               the retainer. **pave** = lay a reusable path — the beneficiary is a future
               traveler who never had the lesson at all
- the decisive case = a lesson can be **learned and never paved**: retained by one clone,
               unavailable to the next. that gap is precisely the arrears the seeded-briefs
               behavior exists to pay, so the distinction carries real weight, not academic
- resolution = both words stand; neither becomes a forbidden synonym of the other. dispute closed
- see also   = `pave` carries its own cluster at `term=externalize.pave._.choice.*`. whether it earned one is
               a separate, separately-recorded dispute — see
               *"whether `pave` earns a cluster at all"* in `term=externalize.pave._.choice.reason.md`

## .evidence
- discovery: the peer reviewer (repo-rules) flagged that `learn` composes the declared operation
  `learn.domain.terms` (a published cli contract) yet was not itemized — the same
  `rule.require.domain-term-itemization` this feature enforces, applied to the feature's own
  flagship verb. captured to converge, and because the omission was real: the feature that
  itemizes terms must itemize its own core verb, exactly as it itemized `glossary`
- invariants: `learn` is a domain verb of THIS repo (it names the learner role + the
  `src/domain.operations/learn/` namespace), not generic english like `run`/`file` — so it is in
  scope, not excluded
