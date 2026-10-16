# F72 — an exit-0 header names its class when the caller must act

- rework = **clean** — one header line in `asOpenerFailureNote.ts` and its snapshot
- confidence = 🟡 **75%**
- raised.by = self, at i033 (r011 ergo-friction-hazards blocker.1)

## .the fork

two peer lanes asked for opposite headers on the `--open` failure note, which prints after the
review is written and the process exits 0:

| lane, round | asked for | its ground |
|---|---|---|
| ergo-friction-hazards, i013 | no class — an owl aside | an error class over exit 0 reads as a failed run |
| mech-failhides, i014 | `✋ ConstraintError:` | `rule.require.qualified-error-headers` — every human-read error names its class |

the i013 repair landed, then the i014 repair reverted it. at i033 the ergo lane re-raised.

## .taken — keep the class

the class keys on **who must act**, never on the exit code — the qualified-headers rule says so in
its own `.the two classes` table, and its PreToolUse exception proves the glyph and the exit code
are allowed to disagree.

| surface | exit | must the caller act? | header |
|---|---|---|---|
| `--open` failure | 0 | ✅ — open the file by hand, or fix the `--open` program | `✋ ConstraintError:` |
| `census.review-prefix` empty corpus | 0 | ❌ — the corpus is empty, a fact | plain notice |

⇒ the two surfaces follow one rule, so the convention is learnable: a class appears exactly where
someone has a step to take.

## .why confidence is not higher

the ergo lane's view — that a `✋` over a success misleads — is fair for a header a human scans. a
later council may prefer a softer glyph with the class word kept.

## .verdict

🟡 BEST-GUESSED 2026-10-01 — keep `✋ ConstraintError:`; dispute the i033 re-raise.

🟡 APPLIED 2026-10-06 (5.1 i002, `mech-failhides` nitpick.2) — the warmer refusal had been filed
as a "no one has a step" aside. that premise was false: the arm is reached only past
`input.plan === null`, so the caller passed `--warmer`, and `--warmer off` is their step. by this
fulcrum's own key, it now opens `✋ ConstraintError: warmer: none — …`.
