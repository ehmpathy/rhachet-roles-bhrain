# F24 — the trail gap is measured from the release stamp

## .the fork

`genReviewPrefixPrime` `[case8]` asserts a late lane waits out the reach before it pours. the gap
can be measured from the first lane's review log time (as main did) or from the release stamp
`primedAt` (as this branch does). the stamp precedes the review, so a gap from the stamp can only
read larger, which loosens `≥ reach − 50` by that delay.

## .taken, and why

the stamp. the contract counts reach from the stamp: `asPartOfMeet` maps a recent cold release to
`trail` with `msOfRemainder = reach − (now − primedAt)`. a bound that measures from the review asks
for more than the code promises, and it flaked under host load. the looseness is closed beside it:
the suite asserts the stamp never moves after the first read (`[case11]` clamps the double
release that once re-stamped it), so the anchor is the instant the trailed review departs.

## .rework

clean. the anchor is one line in one test; to move it back is a one-line revert.

## .confidence

85%. two peer reads (i004, i005) graded it a nitpick, and each advised to leave it as is.

## .status

open — for the council.
