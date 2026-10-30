# F11 — the bound command clears BASH_ENV

- **the fork:** the vision's settings block reads `"command": "bash <the driver's route.status.line.sh>"`.
  (a) bind exactly that; (b) bind `BASH_ENV= bash <reader>`
- **taken:** (b), by measurement. a non-interactive bash sources the file `$BASH_ENV` names before it
  runs the reader. on this host that file is `~/.bash_aliases`, and it cost ~57ms of cpu per
  repaint (bench arm "reader with rc": 0.065s vs 0.008s with it cleared) — seven times the reader
  itself, the very per-repaint cost the wish set out to remove. the prefix is four bytes and
  changes no output
- **rework:** clean — the command string alone; the init migrates a seat on its next run
- **confidence:** 95%. the doubt: a seat that relies on `BASH_ENV` for its PATH loses naught, since
  the reader needs no PATH (the empty-PATH clamp)
- **where:** `src/domain.roles/driver/inits/init.claude.status-line.jsonc`
