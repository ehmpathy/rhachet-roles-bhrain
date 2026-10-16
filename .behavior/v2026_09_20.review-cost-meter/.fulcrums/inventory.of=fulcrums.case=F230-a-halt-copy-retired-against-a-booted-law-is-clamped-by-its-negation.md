# F230 — a halt copy retired against a booted law is clamped by its negation

- raised 2026-10-12, by `mech-test-intent` (blocker.5, blocker.6, nitpick.4), at 5.3 i003
- rework: **clean** — copy plus snapshot; a revert restores the old line and drops one negation
- status: 🟡 **BEST-GUESSED — disputed; the council rules on the copy**
- confidence: **85%**

## .the fork, stated fairly

three thens changed what a halt tells the driver. the reviewer reads each as a test rewritten to
fit new behavior, which `rule.forbid.test-intent-violations` asks a human to approve.

| option | the claim |
|---|---|
| **A — keep the new copy, clamp the old by negation** | each old line told the driver to do what a booted law forbids. the new then names the act the law asks, and a negation keeps the old line from return |
| **B — restore the old copy** | the old thens were the contract, and a test changed to fit is a test that lost its intent |

## .taken, and why

**A.** each retirement removes a copy that misdirects the driver:

| concern | old copy | the law it broke | the clamp |
|---|---|---|---|
| blocker.5 | dispute ack: `drive on` (to `--as passed`) | the entrance gate needs `--as absorbed` before a re-arrival (`howto.drive-routes`, `rule.always.absorb-every-concern`) | `formatRouteGuardReviewPeerAbsorptionAck.test.ts` `not.toContain('--as passed')` |
| blocker.6 | malfunction halt: `please tell a human` / `human must fix` | a malfunction is driver-diagnosable (`rule.always.diagnose-reviewer-malfunctions`) | `stepRouteDrive.test.ts:248`, `:262`; `stepRouteDrive.integration.test.ts:697`, `:1009` |
| nitpick.4 | re-arrival tail: `--as passed` | `re-arrive` names `--as arrived` | `formatRouteDriveHalts.test.ts:207` |

the failsafe half of blocker.6 (`reviewer or judge malfunctioned` → `1 of 1 reviewer
malfunctioned`) narrows the reason to the party and the count — the `F221` shape.

## .rework, and why

**clean.** each change is one line of copy and one snapshot. a reversal is a revert plus the removal
of one negation.

## .confidence, and why it is not higher

the rule's `.note` asks for explicit approval of a changed requirement. this row is that approval
channel: it puts each retirement before the council, next to the law that forced it.

## .where

`src/domain.operations/route/guard/review/peer/formatRouteGuardReviewPeerAbsorptionAck.ts` ·
`src/domain.operations/route/stepRouteDrive.ts` · `src/domain.operations/route/drive/formatRouteDriveHalts.ts`

## .verdict

— (awaits the council)
