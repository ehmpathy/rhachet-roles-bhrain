# F4 — re-pin openrouter to 0.1.4 and slim the patch to the speed waiver

- **the fork:** (a) pin 0.1.4, keep only the hunk 0.1.4 lacks · (b) hold the pin at 0.1.3 so the
  old patch still applies · (c) drop the patch whole
- **taken:** (a). `rhx upgrade` lifts every rhachet brain to latest, so (b) re-breaks the boot on
  the next upgrade. 0.1.4 ships the host-fault hop (#21) but its source at gitHead `2b306bca`
  still refuses an unmeasured release under a speed promise (#22), so (c) would regress the test
  brain `openrouter/deepseek/flash/speed=min100tps&privacy=full`
- **rework:** clean — the patch drops whole once upstream ships #22
- **confidence: 92%** — verified the hunk applies (`isSpeedUnmeasured` present in the installed dist)
- **where:** `package.json` `pnpm.patchedDependencies`, `patches/rhachet-brains-openrouter@0.1.4.patch`
