# F2 — the fast path stays a `node -e` command, not a pure-sh cat

- **the fork:** (a) keep `node -e "import(…)"`, fast because the entry module is tiny · (b) a
  `sh -c` command that cats a cache file and only falls to node on a miss
- **taken:** (a). it keeps the command shape the init and its ownership match already know,
  keeps the freshness check in typed, tested code, and cuts 1.27s → ~0.06s. (b) would cut the
  last 0.06s, with a stat-compare in shell across linux and mac
- **rework:** clean — a later sh wrapper can sit in front of the same node entry
- **confidence: 80%**, low because 0.06s × 3/s × 44 seats is still measurable box-wide; the
  wisher may want (b)
- **where:** `init.claude.status-line.jsonc`, the new subpath entry
