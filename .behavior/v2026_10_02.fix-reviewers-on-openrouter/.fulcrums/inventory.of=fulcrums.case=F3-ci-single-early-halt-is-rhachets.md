# F3 — the single early CI halt on an absent key is rhachet's to deliver

## .the fork
- A: pin what holds here (the firewall names the absent key; each suite then refuses with exit 2 and
  the set command), and reseed the halt to `keyrack firewall` in rhachet
- B: add a bespoke step to this repo's `.github/workflows/.test.yml` after the firewall that fails
  when `OPENROUTER_API_KEY` is empty

## .taken
A. the firewall step is the shared declapract workflow, so the halt belongs in `keyrack firewall`
for every repo. B drifts this repo's workflow from the template; the next declapract upgrade would
either overwrite it or flag it as a defect. the teach + loud halves of case 4 already hold and are
tested; only "one red step, not forty" waits.

## .rework
clean — B is one workflow step, addable at any time if the wisher wants it before rhachet ships.

## .confidence
80%. it is low because case 4 is a critipath, and a wisher may prefer the bespoke step now over a
wait on upstream.

## .where
`blackbox/keyrack.firewall-key-absent.acceptance.test.ts` · `1.vision.experience.case=4.key-absent-in-ci.md`
· `dreams/v2026_10_03.reseed.rhachet-keyrack-firewall-halts-on-absent-key.md`

## .verdict
open
