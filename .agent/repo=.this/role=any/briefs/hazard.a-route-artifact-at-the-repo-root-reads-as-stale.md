# hazard.a-route-artifact-at-the-repo-root-reads-as-stale

> **a route artifact written to a bare `.reviews/` or `.fulcrums/` path lands at the REPO ROOT, where
> the guard cannot see it — and the halt it produces names the right path while it says the wrong
> word.**

## .the shape

the route's artifact dirs are dot-prefixed and route-relative:

```
$route/.reviews/peer/…       # where the guard looks
$route/.fulcrums/…
$route/.seeds/…

.reviews/peer/…              # 🔴 where a bare path lands — the repo root
```

a `Write` to the bare path succeeds, a later `Read` of it succeeds, and the artifact is real. it is
simply not in the route.

🟡 **`Write` creates parent directories**, so a fresh `.reviews/` at the root appears with no
complaint — there was no complaint to make.

## 🔴 .why the halt misleads

`getAllRouteGuardReviewPeersUncontemplated` pairs a taken to a given by the derived path, then
tags the gap by slug:

| the route holds | the tag |
|---|---|
| a taken for this slug from an earlier round, and none at the live given's derived path | 🔴 `stale` |
| no taken for this slug at all | `absent` |

⇒ so a driver whose current taken went to the repo root, and who answered this same reviewer on a
prior round, gets `stale` — *"the reviewer has spoken again"* — which reads as a round-sequence
defect rather than a path one.

🟡 **and the halt prints the exact path it wants, which the driver has already written to
byte-for-byte.** the two strings match; the two directories do not. that is what makes it cost a
round: every check a driver reaches for compares the two strings.

## 🔴 .the check, and the tool trap that doubles the cost

**a wildcard segment does not descend into a dot-prefixed dir. a LITERAL one does.** measured
2026-09-17, on the same four files:

| the call | result |
|---|---|
| `globsafe --pattern '.behavior/**/*i033*taken*'` | 🔴 `files: 0`, exit 0 — `**` refused to cross `.reviews/` |
| `globsafe --pattern '$route/.reviews/peer/*i033*taken*'` | ✅ 4 files |
| `grepsafe --path '$route/.reviews/peer' --glob '*i033*'` | ✅ 4 files |

⇒ 🔴 **row 1 is the trap, and it is a failhide**: `crickets… files: 0` is byte-identical to a genuine
absence. a driver who probes with `**` concludes the artifact was never written, and takes the
diagnosis to the wrong layer.

🟡 the common read — *"the safe tools cannot see dot dirs"* — is wrong, and it is expensive:

- the tools see dot dirs fine; they will not guess them
- spell the dot segment and both tools work

when you do not yet know which dir holds the file, no literal path can be spelled, and `tree -a`
is the instrument:

```sh
tree -a -P '*i033*taken*' --prune --noreport .
```

⇒ run it from the repo root, never from the route — the whole point is to learn which of the two
dirs holds the file, and a run inside the route can only ever report one of them.

## .the cues

| when… | then… |
|---|---|
| a halt says `stale` and your taken sits at the path it printed | 🔴 the strongest cue. check WHICH `.reviews/` holds it |
| you write any `$route`-relative artifact | prefix the full route path. a bare `.reviews/` is the repo root |
| a `Write` to a new dot-dir succeeds with no complaint | that proves the write, never the destination |
| a `**` glob for the artifact returns zero | 🔴 it proves neither absence nor presence — a `**` will not cross a dot dir. re-probe with the dot segment spelled |
| the same round already misfiled one artifact | 🔴 sweep for the rest. this defect arrives in batches |

🟡 measured 2026-09-17, one round, twice: a fulcrum case file, then four `.taken` files. the
first was caught within the turn, because its inventory `Edit` failed loud with *"File does not
exist."* ⇒ **the second cost a full contemplation round, because a `Write` has no such check.**

blocker: a route artifact written to a bare dot-dir path · a `stale` halt diagnosed as a
round-sequence defect with no check of the artifact's own directory.

⇒ see also: `rule.always.reuse-pavement-before-improvise` ·
`hazard.a-status-read-cannot-report-absence` · `rule.forbid.cwd-outside-gitroot`.
