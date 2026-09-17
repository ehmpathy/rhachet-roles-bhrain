# F34 · defer the end-to-end fs clamp on the concession-exhaustion composition

- **rework** = clean · **status** = 🔴 **best-guessed** (enroll-impl-behavior-intent blocker.2, r010 i007) — the council rules
- **confidence** = 80%
- **where** = `getRouteDriveExhaustedMessage.ts` — the onStop/onBoot/direct exhausted-message composition · its `{ stdout, blocksStop }` return

## .the concern, verbatim

> blocker.2 — onStop concession-exhaustion: exit code (persisted) vs. message (live) can diverge,
> and the whole branch has zero test coverage.

## .the fork, stated fairly

| fork | this round would… |
|---|---|
| **A — defer the fs-composition clamp** *(taken)* | ship the [REPAIR] (single-source, divergence structurally impossible) + the exhaustively-clamped constituents, and defer the heavy end-to-end fs clamp as a caught dream + this fulcrum |
| **B — write the fs-composition clamp now** | build the `genRouteScene`-style fixture (guard levels + budgets, exhausted meter jsonl, passage stance row keyed to the live given) and pin `better → blocksStop:true` / `none → blocksStop:false` end to end this round |

## .taken, and why at the time

**A.** the reported defect is fixed and its constituents are fully clamped; the residual the fs clamp
would lock is narrow, and its fixture is dirty:

1. **the divergence is structurally impossible.** `getRouteDriveExhaustedMessage.ts:63-82` reads
   `concession` once and feeds both `stdout` (`:70-78`) and `blocksStop` (`:82`); onStop consumes both
   from one call (`stepRouteDrive.ts:294-298`). the old persisted-reason read is gone, so no fixture
   can drive the two apart — a runtime divergence clamp is green-before (toothless), the vision §5
   acceptance-#5 case.
2. **every constituent classification is exhaustively clamped.** `computeConcessionExhaustionKind`
   (8-case, `getStoneConcededLaneSlugs.test.ts`), `asRouteStoneDisposition` (`asRouteStoneDisposition.test.ts`),
   the render (`formatRouteDriveHalts.test.ts` case1b/1c/2).
3. **the fs-composition clamp is dirt.** it needs a guard-config + meter jsonl + passage stance-row
   fixture — three surfaces this change does not otherwise open — to lock a 3-line link the shared
   `const` already guarantees. under the SAFE/CLEAN test that is not clean, so it is caught, not
   smuggled: `.dream/v2026_09_15.feat.a-concession-exhaustion-composition-has-no-fs-clamp.md`.

## 🟡 .the honest case FOR B, which A does not fully answer

- `rule.require.clamp-edge-cases` binds a defect fix to a clamp with teeth, and the composition clamp
  DOES have teeth against a flipped `=== 'better'`. an fs clamp that pins the whole onStop path end to
  end is stronger evidence than three isolated constituent clamps plus a structural argument.
- so B is not a stretch — it is the strict read of clamp-edge-cases, and a reasonable engineer writes
  the fixture rather than argue the constituents bear the load.

⇒ this is why the call sits at 80%, not higher: A rests on "constituents + structure suffice," and a
council may hold that the composition itself owes a direct clamp.

## .what would settle it

| evidence | it would move the call toward |
|---|---|
| a council read that the constituent clamps + the structural single-source argument suffice | **A** |
| a council read that clamp-edge-cases demands a direct end-to-end clamp regardless | **B** |
| a measured regression in the composition that the constituent clamps did not catch | **B** |

## .the verdict

*(unruled — the council rules at the close)*

---

## 🔴 addendum — repo-rules nitpick.2, r001 i009 (mis-filed here; a driver typo, not a new argument)

a SEPARATE, unrelated dispute got cited against this fulcrum's path by driver error — the
`--why` on `repo-rules nitpick.2` (i009) should have pointed at a fresh fulcrum, and instead
pointed here. over a full `--as rewound` (which voids every peer verdict and budget on the
stone) to correct one mis-cited path, the argument for THAT concern is appended here, at the
path the ledger already records.

**the concern**: *"the noun `absorption` composes many new declared operations — confirm its
term cluster is itemized."*

**the argument**: the confirm-side hedge, and it confirms clean. `term=route.guard.review
.absorption._.choice._.md` + `.reason.md` exist on disk, plus `.absorption.concede`,
`.absorption.concede.severity`, and `.absorption.dispute` — 8 files, the `absorb` / `absorption`
/ `absorbed` family in full. no action owed.

**rework**: clean. **confidence**: 95%.
