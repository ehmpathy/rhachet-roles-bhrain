# F71 — the fireworks lanes move to `glm/flash` while `deepseek/flash` stalls

- rework = **clean** — one `--brain` flag per `$rhx review` lane in the guard; revert by removal
- confidence = 🟡 **65%**
- raised.by = self, at i032

## .the fork

every level-1 lane calls `fireworks/deepseek/flash/latest` and meets the openai sdk's 10m client
timeout, which `rhachet-brains-fireworksai` leaves at its default
(`.dream/v2026_09_26.reseed.fireworks-atom-sets-no-client-timeout.md`). a lane that times out
returns no verdict, and a malfunction blocks passage.

| option | what it does | cost |
|---|---|---|
| A — wait | re-arrive on the same model until the provider recovers | each round burns a budget round per lane and returns no verdict |
| **B — swap** | `--brain fireworks/glm/flash/latest` on every `$rhx review` lane | the reviewers change model; the cache history resets |
| C — patch the client | set a timeout inside `node_modules` | a workaround in another repo's code, forbidden; the reseed dream owns it |

## .taken — B, and why

- **the stall is sustained, never a blip.** from the route's own arrival records: i029 returned
  8 fresh fireworks lanes in 135–621s; i030 and i031, seven hours apart, returned **1 each** of
  ~15; i032 opened with three more timeouts
- **size is not the cause.** `repo-rules-briefs` timed out at i031 on a 102k prompt, half of
  what lanes cleared at i029; the arch lanes, narrowed by `.agent/**` and `.scratch/**`, still
  timed out at i032
- **`glm/flash/5.3` is the nearest peer by spec**: the same 1M context (every lane's prompt runs
  to ~340k), a rated 160 tok/s against deepseek's 150, $0.15/1M input against $0.22. it is a
  separate deployment, so a deepseek-side stall does not reach it
- the brain is a guard field, so the swap is the driver's lever
  (`rule.always.spend-own-levers-before-escalation`); C is not

## .why confidence is low

- no latency on `glm/flash` has been measured in this repo; its rated speed is the package's
  config, never an observation
- a new model may grade the same corpus differently, and lanes cached as approved re-run if the
  cache keys on the run line
- the cost research this route leans on was measured on `deepseek/flash`; the swap is for
  passage, never a claim about which model reviews better

## .where

`5.1.execution.from_vision.guard` — every `run: $rhx review` line.

## .verdict

🟡 BEST-GUESSED 2026-09-30 — option B. applied after i032, where 13 of 14 fresh lanes timed out:
23 `$rhx review` lanes now carry `--brain fireworks/glm/flash/latest`.
