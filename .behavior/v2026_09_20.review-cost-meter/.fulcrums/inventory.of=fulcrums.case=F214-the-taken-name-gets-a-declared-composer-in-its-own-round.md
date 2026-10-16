# F214 — the taken name gets a declared composer in its own round

## .the fork

i040 r030 nitpick.2 asked two things of the peer-review filename grammar:

1. replace the three hand parses in `getAllRouteGuardReviewPeerConversationFiles.ts`
   (the generation-key regex, the current-generation infix, the three per-lane suffixes)
   with reads of the declared grammar
2. give `._.taken.by_self.` a declared write and read half, so the absorption gate reads it
   by the same declaration

## .taken

- **(1) repaired, this round.** `GRAMMAR_OF_PEER_CONVERSATION_FILE` now shares its head
  (`SOURCE_OF_PEER_REVIEW_HEAD`) with `GRAMMAR_OF_PEER_REVIEW_OUTPUT`, and
  `asPeerConversationFileParts` is its parser. the expander keys generations and lanes on
  its parts. clamp: `asPeerConversationFileParts.test.ts` round-trips every name the guard
  writes, and goes red when the slug turns greedy
- **(2) deferred.** four modules read or compose the `taken` name by hand today:
  `getRouteGuardReviewPeerPathTaken` (the composer, by infix swap),
  `getRouteGuardReviewPeerPathMeta` and `asPeerReviewSlugFromPath` (two parsers), and the
  `enumRouteGuardReviewPeerFiles` glob. each sits on the absorption gate's path

## .rework — dirty

a declared `taken` composer means four modules move onto it, plus their tests, and every one
is on the gate that decides whether a driver may re-arrive. a defect there either holds a
stone that should pass or passes one that owes a `.taken`. that ripple belongs in a round
whose whole subject is the gate, with its own review, not ridden along under a nitpick.

## .confidence — 80%, and why it is not higher

the reviewer graded it `better` and named no shipped harm, and the parser half that guards
dialogue reads is now declared. the 20% is that the gate's four hand reads could drift from
the guard's writer before the dream is picked up, with no red test between them.

## .where

- dream: `.dream/v2026_10_10.repair.declare-the-taken-name-composer.md`
- repaired half: `src/domain.operations/asPeerConversationFileParts.ts`

## .verdict

open — for the council.
