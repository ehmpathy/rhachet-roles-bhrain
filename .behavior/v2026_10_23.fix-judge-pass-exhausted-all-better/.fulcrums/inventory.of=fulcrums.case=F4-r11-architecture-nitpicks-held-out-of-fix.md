# F4 — four r11 architecture nitpicks are held out of this fix route

## .the fork

r11 (enroll-impl-arch-defects, i002) raised seven `better` nitpicks. three were repaired (#2 the
command head via `asRouteStoneSetCommandHead`, #3 one owner label as a shared constant, #5
`ReviewAbsorption` in its own file). four are held:

| # | the point | held because |
|---|---|---|
| 1 | a stance's `given` is a bare `string`; cast it to a key once at the ledger read and compare with `===` | the one predicate `isReviewAbsorptionOnGiven` already owns the compare, with unit clamps on both row forms. a typed key would re-shape `ReviewAbsorption`, the ledger read, and every peer caller — a contract change beyond the fix |
| 4 | the driver brief says a judge threshold prints a remedy list with no owner column | the brief is accurate: the generic threshold halt still prints none. the urgent halt is a separate surface, and its owner line is F2's open call |
| 6 | `judgeReviewed` reads the stance corpus three times | repaired in round i003: the judge reads it once, to narrow the givens to counted lanes (F5) |
| 7 | `asAbsorptionIsNotContrary` compares `--why` paths raw | the same class, but a loud refusal with a retry, never a silent lapse. dreamed |

## .taken — hold, and dispute each one

each is `better` by the reviewer's own grade; no shipped harm. #1, #6, #7 are dirty to pull into a
fix route (they ripple into callers or extant flows this fix does not open); #4 is not a defect.

## .rework — dirty (#1, #7)

the grade is the cost to do the held fix, per `rule.always.defer-fulcrums-to-last`:

- #1 — a typed key re-shapes `ReviewAbsorption`, the ledger read, R3, the judge shed, and the
  undeclared halt: callers hardened against the bare `string`. dirty
- #7 — a fulcrum has no route-relative key yet (a basename is not unique across dirs, and a
  symlinked route needs a realpath, which no pure transformer holds); the fix needs that key
  designed first, and it rides into R3's re-cite refusal. dirty

a dirt deferral owes a dream AND a fulcrum (`rule.always.catch-dreams-for-followups`): the
dream records the work, this entry records the call to defer it, and the per-concern stance is a
dispute because the driver holds the code as fit to ship. #1 and #7 carry dreams with the shape of the fix:
`dreams/v2026_10_23.fix.stance-given-carries-a-typed-key.md` ·
`dreams/v2026_10_23.fix.contrary-check-compares-why-paths-raw.md`. #4 is not a defect, so it owes
no dream; #6 was repaired.

## .confidence — 80%, and why it is low

#1 is the strongest of the four: a typed key would make the defect class unrepresentable. a council
may prefer it in this PR.

## .where

`src/domain.operations/route/guard/review/peer/` — `ReviewAbsorption.ts`, `getStoneReviewAbsorptions.ts`,
`asAbsorptionIsNotContrary.ts`; `src/contract/cli/route.ts` `judgeReviewed`.

## .verdict

held; open — for the council.
