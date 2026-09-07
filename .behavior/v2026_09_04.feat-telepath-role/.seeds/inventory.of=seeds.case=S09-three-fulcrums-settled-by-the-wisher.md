# S09 · three fulcrums settled — F01, F06, F07

## .said

verbatim, 2026-09-04, mid-drive at `1.vision`, three messages, each with the fulcrum row it settles:

> 100%; | F01 | the canon **moves** to telepath; it is not cited in place | 80% |

> both should exist; | F06 | `forbid.narratives` **subsumes** `forbid.chronological-accretion` | 65% |

> it applies to code comments too; | F07 | the lane's subject is **prose-only** and declared | 95% |
>  ; literally any prose

## .settled

three of the ten fulcrums are now the wisher's verdicts rather than the driver's guesses.

| case | the guess | the verdict |
|---|---|---|
| **F01** | the canon moves to telepath — 80% | **taken, 100%** |
| **F06** | `forbid.narratives` **subsumes** `forbid.chronological-accretion` — 65% | **REVERSED — both should exist** |
| **F07** | the reviewer's subject is prose-only — 95% | **taken, and WIDENED — literally any prose, code comments included** |

### F06 is a reversal, and it changes the rule count upward

the guess was that one rule **subsumes** the other, so `forbid.chronological-accretion` would be renamed away. **both should exist**, so:

- `forbid.chronological-accretion` **stays**, under its extant name — which retires the rename risk that made F06 the lowest call on the board
- `forbid.narratives` is a **new peer**, not a replacement
- the four live citations across two repos are **untouched**

⇒ the fulcrum's whole risk was breakage from a rename. **the verdict removes the rename**, so the risk goes with it.

### F07 is widened — `prose` is not `.md`

the guess scoped the reviewer to prose **files**. the verdict is *"literally any prose"*, and it names the case that proves it: **code comments**.

| what the guess covered | what the verdict covers |
|---|---|
| `.behavior/**/*.md`, briefs, yields | ⬆ **plus** every comment, jsdoc header, error string, commit body, and log line |

🟡 **this widens the subject and it does not restore the `--diffs since-main` default.** the reviewer still declines the *code*; it grades the *prose inside* the code. so the scope is a **prose filter**, never a path filter — and a rubric that globs `*.md` implements the guess rather than the verdict.

## .landed

- `.fulcrums/…case=F01` — status `settled`, 100%
- `.fulcrums/…case=F06` — status `settled`, taken option **reversed** to *both exist*
- `.fulcrums/…case=F07` — status `settled`, subject widened to any prose
- `1.vision.yield.md` §6 — the fulcrum table and the wisher-decision list re-read against these three
