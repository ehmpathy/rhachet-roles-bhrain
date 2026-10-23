# howto.partition-an-overflowed-review

## .what

when a review's targets overflow its context window, the caller declares how they split. each
**partition** is a set of files a reviewer can judge on its own; the partitions run at once and
merge into ONE verdict under the review's own `--output`.

two ways to declare them — one primitive, one convenience over it:

| form | where | for |
|---|---|---|
| `rhx review --partition '<slug>=<globs>'` | the review itself | any review — a hand run, a ci job, no route needed |
| `rhx route.guard.partition --for review --peer @all` | once per route, for every reviewer | a guarded route; every peer's review reads the same set |

## .the one claim a partition makes

> **each partition holds all its own files need to be judged alone.**

only the caller can know that, so the tool never guesses a split. a test with its subject, a module
with the types it imports, the route spec with all of it. if a partition cannot stand alone, it
lacks an overlap — add it.

## .partition through vertical domains, never through horizontal layers

a partition is one operation, or one subdomain of operations, with every layer that serves it —
source, tests, snapshots together. a partition of one layer (every test, every contract) holds a
slice of every domain and the whole of none, so no file in it can be graded alone. see
`rule.forbid.horizontal-partitions`.

## .overlap is the point, and it is computed

partitions **may overlap, and should**. you declare only the partitions; the tool sorts each file:

- **common** — a file in two or more partitions. it leads every prompt that carries it, so one
  cached prefix serves them all. it is **graded once**, in the first partition that lists it, and
  read as context in the rest — so a concern is never counted twice
- **narrow** — a file in exactly one partition. graded there, and only there

## .form 1 — the primitive, on `rhx review`

```sh
rhx review --rules 'rules/*.md' --diffs since-main --paths-with '{src,blackbox}/**' \
  --partition 'review=src/domain.operations/review/**,blackbox/review.*,src/domain.objects/**' \
  --partition 'route=src/domain.operations/route/**,blackbox/driver.*,src/domain.objects/**' \
  --partition 'reflect=src/domain.operations/reflect/**,blackbox/reflect.*,src/domain.objects/**' \
  --output .review/out.md
```

- `--partition '<slug>=<globs>'` — one partition per flag; a comma list gives it several globs, which
  is how an overlap is written. a repeated slug merges its globs into one partition. a member may
  hold a brace set of its own — `route=src/route/*,src/route/{stones,judges}/**` is two members
- `*` stays within one path segment and `**` spans them, so `src/route/*` claims the files
  directly in `src/route/` and none below; a glob with no `/` tests the basename at any depth
- a member with a `!` at its head subtracts what it matches: `review=src/review/*,!src/review/compile*`.
  it is how a FLAT dir is carved — a dir with no subdirs offers no prefix to cut along, so name the
  slice in its own partition and subtract it from the rest. an exclusion of a test excludes its
  snapshot too
- order decides only which partition grades a common file: the FIRST that lists it
- 🔴 keep the partitions' own globs disjoint. a file two partitions list is common, and read as
  context in each — so a catch-all like `rest=src/**` carries every other partition's files and
  shrinks naught. name each partition for its domain; never declare a catch-all
- **the flags are inert until the review overflows.** a review that fits runs whole
- `--mode plan` previews the split and sends naught to a brain:

```
🦉 split into 3 partitions (plan)
   ├─ common
   │  ├─ globs
   │  │  └─ src/domain.objects/**
   │  └─ cost
   │     └─ common:  18 files    41k tokens
   ├─ narrow
   │  ├─ review
   │  │  ├─ globs
   │  │  │  ├─ src/domain.operations/review/**
   │  │  │  ├─ blackbox/review.*
   │  │  │  └─ src/domain.objects/**
   │  │  └─ cost
   │  │     ├─ narrow:  63 files   148k tokens
   │  │     ├─ common:  18 files    41k tokens
   │  │     └─ total:   81 files   192k tokens ✓
   │  ├─ route
   │  │  ├─ globs
   │  │  │  ├─ src/domain.operations/route/**
   │  │  │  ├─ blackbox/driver.*
   │  │  │  └─ src/domain.objects/**
   │  │  └─ cost
   │  │     ├─ narrow:  22 files    97k tokens
   │  │     ├─ common:  18 files    41k tokens
   │  │     └─ total:   40 files   141k tokens ✓
   │  └─ reflect
   │     ├─ globs
   │     │  ├─ src/domain.operations/reflect/**
   │     │  ├─ blackbox/reflect.*
   │     │  └─ src/domain.objects/**
   │     └─ cost
   │        ├─ narrow:  40 files    88k tokens
   │        ├─ common:  18 files    41k tokens
   │        └─ total:   58 files   132k tokens ✓
   └─ unclaimed: 0
```

- `globs` is the declaration verbatim; `cost` is what it costs — the files this partition alone
  holds (`narrow`) and the shared files it carries (`common`)
- `total` adds the head every prompt carries — rules, refs, conversation (3k above) — and is
  checked against the window: ✓ fits, ✗ refuses
- a slug's `common` figure counts only the shared files THAT partition carries, so it can differ
  from slug to slug

## .form 2 — the guard convenience, `route.guard.partition`

whether code splits cleanly is a fact about the code, never about the rubric that reads it — so a
route declares its partitions ONCE, and every reviewer on every stone reuses them.

```sh
# declare the whole set — plan by default, --mode apply to write it
rhx route.guard.partition --for review --peer @all \
  --partition 'review=src/domain.operations/review/**,blackbox/review.*,.behavior/<route>/**' \
  --partition 'route=src/domain.operations/route/**,blackbox/driver.*,.behavior/<route>/**' \
  --partition 'reflect=src/domain.operations/reflect/**,blackbox/reflect.*,.behavior/<route>/**'

# grow one held partition — every other partition is kept as held
rhx route.guard.partition --for review --peer @all \
  --claim 'src/domain.operations/review/prime/**' --into review
```

- **a `--partition` declaration names the WHOLE set, and replaces whatever stood before.** so
  coverage is checked against the full set before it is written: a target in no partition, or a
  partition that lacks the route, refuses and writes naught
- **`--claim <glob> --into <slug>` adds a glob to a held partition** and writes the full set back,
  under the same coverage check. it repeats; one `--into` serves every claim. a slug the scope
  does not hold is refused with the held slugs listed — a claim never creates a partition
- a gap refusal prints the smallest repair: a `--claim` per gap that fits a held partition, or
  else the whole set with one new partition named for its domain. it never proposes a catch-all
- `--peer @all` is the standard form. a `--peer <slug> --stone <s>` declaration overrides it for
  that one peer — whole, never merged slug by slug
- `--partition none` clears a scope: an override is removed, so its peer reads `@all` again; a
  cleared `@all` lets every lane run whole
- each lane applies the set to its own targets: a partition that claims none of a lane's targets
  drops out of that lane, and the window check runs per lane
- a driver may apply it, as with the budget lever; the plan makes the change visible first

## .what refuses, and what warns

every refusal is exit 2, and fires before any brain is called — at plan time AND at review time,
so a hand-edited guard cannot slip past:

| when | what you see |
|---|---|
| a target sits in no partition | ✋ each file, and the partition to add it to |
| 🔴 a route is bound and a partition lacks it | ✋ each partition that lacks it, and the route glob to add |
| a partition still overflows alone | ✋ that partition, and its total against the window |
| no file is common at all | ⚠️ a warn — partitions with no overlap are rarely truly independent |

🔴 **the bound route is the one overlap that is never optional.** it is the spec a reviewer grades
against; a partition without it grades blind. with no route bound — a plain `rhx review` — there is
no route check.

## .how you meet it — the overflow refusal

an overflow refuses and prints a `lever` branch, read off the masses the prompt held. when the mass
is work the rubric must read, it guides to a partition and names the command for your form — the
`--partition` flag on a hand run, or `route.guard.partition` on a guarded peer. its suggested globs
are sized to fit, not to cohere: **move each boundary to where the code actually separates**, and
add the overlaps each side leans on.

⚠️ never exclude `.behavior/**` to make a review fit. the spec is what the review grades against.

## .what a merged run reports

- one stdout tally — `N blockers` / `N nitpicks` — so `contract.reviewer-output` holds
- one report at `--output`, one section per partition slug
- each partition writes its own report under `.partition=<n>.<slug>/` beside the output
- a partition that fails keeps its section and counts as a blocker; the others keep their verdicts

## .see also

- `contract.reviewer-output` — the one tally a merged run owes
- `rule.always.diagnose-reviewer-malfunctions` (driver) — the overflow as a malfunction
- `rule.forbid.hand-run-reviews` (driver) — on a route, the split lives on the guard, never a hand run
