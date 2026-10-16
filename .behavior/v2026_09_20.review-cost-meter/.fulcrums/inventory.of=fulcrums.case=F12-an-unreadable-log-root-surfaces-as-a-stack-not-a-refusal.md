# F12 — an unreadable log root surfaces as a stack trace, not a 🦉 refusal

- raised 2026-09-22, by `enroll-impl-behavior-intent` (B + C1), at i013
- rework: **clean** — 🔴 **measured**, where the line below was an estimate
- status: ✅ **CLOSED 2026-09-22 — repaired, via A+B, and clamped**
- confidence: **90% / 🔴 45%** — the second figure was measurably wrong; see the verdict

## .the fork, stated fairly

`review._.cost` refuses gracefully on every input defect it was built for — a bad `--of`, a
valueless flag, an absent log dir, a non-numeric `--limit`. each prints a 🦉 block that names the
fix and exits 2.

🔴 **an EACCES on the log root does not join them.** `getAllEntriesInDir` parts absence from every
other errno on purpose and throws `UnexpectedCodePathError` with the path — correct at the
operation grain (`rule.forbid.failhide`). but `reviewCost` has no catch, so it reaches the human
as a bare node stack.

⇒ the one failure mode this otherwise-careful cli does not refuse gracefully, and the lane is
right about that.

## 🔴 .and the peer command does the same — which is what makes it a fork

`review.ts:419-425` DOES carry a top-level catch, and it catches exactly one class:

```ts
} catch (error) {
  if (error instanceof BadRequestError) { … process.exit(2); }
  throw error;            // 🔴 every other class surfaces as a stack
}
```

⇒ so an EACCES escapes `review` as a bare stack too. **the house convention is that an unexpected
error surfaces raw**, and `review._.cost` matches it rather than falls short of it.

🟡 that reframes the question. it is not *"did this command forget a catch?"* but *"should this
subsystem refuse on an unreadable path, and if so, at what grain?"* — and one command answered
alone diverges from its peer, which is the shape `F10` option B was deferred for.

| option | the claim |
|---|---|
| **A — catch in `review._.cost`** | one file, a 🦉 block, exit 1 for a malfunction. diverges from `review` |
| **B — a typed error from `getAllEntriesInDir`** | the readers can discriminate rather than match on a message string. touches 3 callers' contracts |
| **C — leave it, tracked** | matches the house convention; the stack DOES name the path, so it is loud, merely not pretty |

## .rework, and why

**clean, then dirty.** A is one `try/catch` in one file. 🔴 **and A is the one most likely to be
wrong** — a broad catch that renders every unexpected throw as a 🦉 exit-2 refusal would grade a
genuine malfunction as a constraint, which is `rule.forbid.failhide` in the direction the CLI has
so far avoided. to catch narrowly needs B, and B is a contract change on a shared operation.

## .the coverage half (C1)

the EACCES path carries **zero** test coverage at the cli grain. 🟡 it is covered at the operation
grain — `isErrorOfAbsence.integration.test.ts` chmods a parent to `0o000` and asserts
`getAllEntriesInDir` throws rather than answers a corpus of zero. so the **discrimination** is
clamped; what is unclamped is what a human then sees.

⇒ and that split is the load-bearing part: the half that could corrupt a number is tested; the
half that is merely ugly is not.

## 🔴 .confidence, and why the two halves differ

**90% that the friction is real** — a bare stack where every neighbour prints a 🦉 block.

**🔴 45% that a repair belongs in this branch.** it is the peer-command divergence again, and the
branch's declared bound does not include `review`'s error surface. a fix here trades an ugly
failure for an inconsistent pair, and the second is the one a reader cannot see.

## .where

- `src/domain.operations/review/getAllEntriesInDir.ts` — throws with the path, correctly
- `src/contract/cli/review._.cost.ts` — `reviewCost`, no top-level catch
- `src/contract/cli/review.ts:419-425` — the peer, catches `BadRequestError` alone
- `src/domain.operations/review/isErrorOfAbsence.integration.test.ts` — the operation-grain clamp

## .the verdict, once ruled

> **A and B, together — and the "dirty" half of the rework estimate was measurably false.**
> ruled 2026-09-22, at i018, after `enroll-impl-behavior-intent` (r010) raised it a fourth time
> and named it the friction hazard most worth a human's verdict before this ships.

### 🔴 why the estimate was wrong, and how it was caught

the table above deferred on a premise: that B — the errno carried out to a caller — is *"a
contract change on a shared operation"* that *"touches 3 callers' contracts"*. **it does not.**

- a denial ALREADY throws from `getAllEntriesInDir`; the repair changes only WHICH error object
  rides out, so the caller contract — *"a denial throws"* — is byte-for-byte what it was
- the three callers need **no edit**, measured by a read of all three
- every piece the repair needed already existed: `getFsErrorCode` reads errno off the SHAPE,
  `isErrorOfAbsence` is the allowlist pattern to mirror, and the `chmod 0o000` fixture is a
  green, established idiom in four suites

⇒ the deferral rested on a **ripple estimate nobody re-measured across five rounds**, and the
measurement took one read. `rule.always.fix-forward-under-scouts-honor` grades the FIX, and the
fix was SAFE and CLEAN — so the honest disposition flipped the moment it was measured rather
than recalled.

### what shipped

| # | the piece | the shape |
|---|---|---|
| 1 | `isErrorOfDenial.ts` | the exact complement of `CODES_OF_ABSENCE` — `EACCES` + `EPERM`, read off the shape |
| 2 | `getAllEntriesInDir` | a THIRD disposition: a denial rethrows **untouched**, so its errno survives; every other errno keeps the wrap |
| 3 | `review._.cost`'s `withRefusalOnDeniedRead` | ONE wrapper over all three breadths, which allowlists **exactly two codes** and rethrows every other error with its stack |
| 4 | `exitOnDeniedRead` | a 🦉 block that names the fix (`chmod u+rx`), in this command's own refusal shape |

🔴 **option A's stated hazard is answered, not ignored.** the table warned that a catch *"most
likely to be wrong"* is a broad one that grades a malfunction as a constraint. this catch
allowlists two errno codes by name; a genuine defect still reaches the human with its stack —
which is `rule.forbid.failhide`'s own carve-out, and the reason the fold is a named wrapper
rather than a `try` inlined three times.

🟡 **and the peer-command divergence stands, deliberately.** `review.ts` still surfaces an EACCES
raw. the two commands now differ, and that is the smaller cost: `review._.cost` is the command
whose whole subject is *"an absent log is a FACT"*, so a barred dir that reads as an absent one is
a defect **in its domain** and merely ugly in `review`'s. the pair is a dream, not a blocker.

### the clamp, and it was proven to bite

`reviewCost.acceptance.test.ts [case10]` chmods a real log root to `0o000` under a grove root, and
asserts at BOTH breadths that the cli exits 2, says `barred`, carries no node stack, does **not**
say `no reviews to price`, and names `chmod` in its fix.

🔴 **dogfooded per `rule.require.clamp-edge-cases`**: with the denial rethrow disabled, the case
went **red on 4 assertions**; restored, **121 passed**. the clamp exercises the defect rather than
merely coexists with it.
