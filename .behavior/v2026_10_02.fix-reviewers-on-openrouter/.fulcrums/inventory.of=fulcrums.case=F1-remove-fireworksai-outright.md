# F1 — remove fireworksai outright

## .the fork
- A: uninstall `rhachet-brains-fireworksai`, drop `FIREWORKS_API_KEY` from every keyrack manifest
- B: keep the package and key, only switch the default slugs to openrouter

## .taken
A. the wish says "instead" and requires that no fireworksai credential be needed. under B, the
keyrack firewall would still declare FIREWORKS, and a stale fireworks slug would still be
accepted, then fail against a suspended account. that fails slower and less clearly than a refusal.

## .rework
clean — re-add one devDependency and one keyrack line.

## .confidence
85%. it is low because "use openrouter as the brain wherever fireworksai is used" could also read
as B.

## .where
package.json · .agent/keyrack.yml · src/domain.roles/reviewer/keyrack.yml · blackbox fixtures

## .verdict
ruled: confirmed — A, remove fireworks outright (S02)
