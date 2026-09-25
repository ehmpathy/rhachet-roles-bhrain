# fulcrum F05 — should the guard hunt for a near-miss

**rework** clean · **status** OPEN · **confidence** 75% · **where** cell `c9`, the `absent` verdict

## .the fork, stated fairly

the driver named the **owed** path in `--into` (they copied the command) and wrote the file
**elsewhere** — so the claim is right, the gate reads the owed path, and no file is there.

🌙 **the worked example this fork was raised with is RETIRED.** it read: *"the driver wrote at
`…_.r3.$slug.md`, the guard owes `…_.r2.$slug.md`"* — the `rN` level pitfall, which `S12` removed
outright by a drop of the level from the path. ⇒ **the fulcrum survives its example**: the live
population is now any driver whose file lands somewhere other than the path they correctly named —
a stale editor buffer, a wrong `cd`, a write to the prior stone's dir. smaller than the `rN` case,
and not empty.

| | **report `absent`** | **scan `review/self/` for the slug and offer the stray** |
|---|---|---|
| the verdict | truthful, and incomplete | truthful, and complete |
| the driver | must find their own file | is handed the move command |
| the cost | a `stat` | a directory read per challenge |
| the risk | none | a wrong guess offered with authority — two strays, or a file for a different round |

## .taken, and why at the time

**report `absent`**, at 75%.

the hunt is a heuristic dressed as a verdict. with several candidates it must **rank** them, and a
ranked guess printed beside a definite path reads to the driver as equally certain.

⚠️ **the counter, and it was not weak:** this cell WAS a real measured failure mode — the "level
pitfall" `howto.run-self-reviews` documented, where the driver counts `rN` forward and the guard
*"looks at its path, not yours."* a scan closed it outright.

🌙 **`S12` closed it by a different door, and thereby weakened this fork.** with the level gone the
path keys on `(stone, slug)` — two operands the driver already holds — so the pitfall the counter
cited cannot arise. ⇒ the counter now rests on the smaller residual named above, and the drive's
75% lean against the hunt is **stronger** than when it was cast, not weaker.

⇒ the second reason the drive leans against: ✅ **`F03` ruled REQUIRED (`S15`), and it closes most of
what is left.** with `--into` required and the guard's printed command pre-filled, the driver writes
where the prompt said. the residual population for a hunt is the driver who copied the command
**and** wrote elsewhere.

## .the rework

**clean.** an additive read in one branch of one operation. it changes no verdict — only what the
`absent` message carries.

## .the verdict

_unruled._ ⇒ a middle path worth the council's glance: scan, and print a stray **only when exactly
one candidate is found**. it takes the certain case and declines to rank.
