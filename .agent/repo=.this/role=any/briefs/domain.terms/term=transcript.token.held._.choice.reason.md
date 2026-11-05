# domain.term.choice.reason: held

## .etymology
a context holds its blocks; a compaction releases them. `held` names the relation between a block
and the context, which is what repaid charges for, and it composes into the stdout leaf
`held N calls`.

chosen over:
- `alive` / `live` — biological; and `live` already names a session in progress elsewhere here
- `resident` — memory-management jargon, and it reads as a place rather than a hold

## .disputes
none raised.

## .evidence
- invariant: the blocks held at the last call sum to that call's context; clamped in
  `getOneTokenInventory.test.ts` (case1, and case2 after a compaction)
- a compaction ends every block held before it; the re-based context is held anew from that call
