# rule.forbid.shared-bytes-behind-narrow-bytes

> **never place a block that N requests share behind a block only one of them sends.**

the forbid twin of `rule.require.order-prompt-bytes-by-reuse-breadth` — it names the one shape
that voids the whole gain, so a reviewer can point at it in a diff.

## .the shape it forbids

```
👎  [system] [partition's own files] [route spec, shared by all N] [diffs]
         → the shared prefix ends at the first own file; each of N pays the spec in full

👍  [system] [route spec, shared by all N] [partition's own files] [diffs]
         → N−1 read the spec from cache
```

## .the cue

| when… | then… |
|---|---|
| a sort over prompt blocks keys on mtime, hash, or path alone | 🔴 it cannot see breadth, so a shared block edited this round sorts last |
| a fan-out builds each request from shared + narrow bytes (for a partition, the `common` + `narrow` fields of `ReviewPartitionOfTargets`) | 🔴 assert the shared bytes lead, in a test |
| a shared block is volatile across rounds | still leads. volatility is the second key, never the first |
| 🔴 a renderer regroups blocks by KIND (bodies, then diffs) after the planner ordered them by breadth | the regroup re-sorts on key 2 and voids key 1. group within each breadth band, never across them (`asTargetSection`'s `shared`) |

blocker: a shared block (carried by N ≥ 2 requests of one round) placed behind a narrow block.

⇒ see also: `rule.require.order-prompt-bytes-by-reuse-breadth` (the require twin) ·
`getAllTargetsOfPartition` (`src/domain.operations/review/partition/getAllTargetsOfPartition.ts`
— where one partition's order is set; the shared/narrow split it reads is `getAllTargetsByPartition`).

second worked example: 2026-10-12, `5.3.verification i004`, partition `14.cli`. the planner
put the shared route first, and the renderer then grouped every target by kind. the route files
are additions, so they rendered in the diff group, behind 75k chars of the partition's own
edited bodies. 1.07M shared chars were sent behind narrow bytes, and the run cached 0.3%.

worked example: 2026-10-06, the route spec (200.8k of a 336.0k prompt) sorted to the tail of
each of nine partitions by mtime, so every partition paid it at full rate.
