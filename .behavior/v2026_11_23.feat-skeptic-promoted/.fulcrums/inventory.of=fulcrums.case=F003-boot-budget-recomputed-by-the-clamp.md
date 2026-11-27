# F003 — the boot budget is measured here

- **fork**: carry a budget from the pioneer, or measure one here
- **read**: the source ships no `boot.yml`; #818's 7,432-token measure was taken over 24 rules, and the source holds 30 plus #834's one. `roleBootClamps.integration.test.ts:316-337` fails any budget other than the least multiple of 250 above the seat payload; the cap is 10,000
- **taken**: write `boot.yml` here; measure the payload; set the budget the clamp demands. if the payload crosses 10,000, boot the rules as a catalog (`rule.always.boot-an-oversized-subdomain-as-its-catalog`)
- **rework**: clean — one number, or a catalog brief
- **confidence**: 95% on the method; the figure is unread until execution. a linear scale of 7,432 / 24 rules gives ~9,600 for 31 mins, or ~5,600 for the 18 F15 ships (the persona's, 17 rules'); the catalog branch is live only if F15 is refused
- **where**: `src/domain.roles/skeptic/boot.yml`, `BUDGET_SET_BY_OWNER` if the role joins it
- **verdict**: open
