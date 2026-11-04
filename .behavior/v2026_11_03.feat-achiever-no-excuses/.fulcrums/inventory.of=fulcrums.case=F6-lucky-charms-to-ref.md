# F6 — move lucky-charms and scouts-honor to ref

- fork: (a) keep every extant say brief and add two; (b) move the vocabulary and the borrowed brief to ref (`.min` at say), to make room
- taken: (b)
- why: the cap is 7,500 tokens (`src/domain.roles/achiever/boot.yml`), and the wish asks for briefs small enough to boot beside other roles. scouts-honor is a driver brief, so a clone with driver boots it twice
- rework: clean — a boot.yml line
- risk: none — a boot.yml line in this repo; it touches no credential and writes no prod
- confidence: 70% — lucky-charms sits at say on purpose (a human may say the alias first); a one-line `.min` keeps the alias at say
- verdict: open
