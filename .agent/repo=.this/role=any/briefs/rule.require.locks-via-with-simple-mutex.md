# rule.require.locks-via-with-simple-mutex

> **every lock goes through `with-simple-mutex`. if a lock need seems to exceed it, the design is
> overcomplicated — the need is the antipattern, never the package's gap.**

🔴 **the measured case.** three hand-rolled locks here each claimed a need the package could not
meet — a hold handed from parent to child, a held-check that names the holder's pid without a
claim, a crash release keyed on pid liveness. every one of those needs existed only because the
lock held a key across a whole unit of work. once each hold shrank to one watermark transition,
every "gap" vanished and the plain call sufficed. ⇒ **a gap you find is a hold that is too long.**

a **lock** = any mechanism where one actor claims a key so another actor waits, skips, or refuses
while the claim stands: an exclusive create, a pid file, a lock file whose name carries a holder, an
in-flight mark another process reads.

## .why

- **the primitive already exists, and it is the org's own.** `withSimpleMutex(logic, { key, cache })`
  holds a key over a conditional-write cache. the isolation scope is a choice of cache —
  `simple-in-memory-cache` per process, `simple-on-disk-cache` per machine, a cloud disk global — so
  every lock need is one call with a different cache, never a new mechanism
- **a hand-rolled lock re-derives it, worse.** each one invents its own claim (an `'wx'` open, a
  file name), its own crash rule (pid liveness, a start time, a timer, none), and its own errors.
  three such locks are three crash rules, three test suites, and three places a race can hide
- **it is correct by construction.** acquire is one put-if-absent; release is a delete
  conditioned on the holder's own version; a stalled holder fails fast with a typed
  `SimpleMutexLeaseExpiredError` rather than run on unprotected
- **every error is a `ConstraintError` or a `MalfunctionError`**, so a lock fault is loud and
  classed the same way the rest of the repo's faults are

## .the shapes

| the need | the call |
|---|---|
| one holder at a time, others wait | `withSimpleMutex(logic, { key, cache })` |
| one holder, others **skip** (run exactly once) | `acquire: { timeout: { milliseconds: 0 } }`; catch `SimpleMutexAcquireTimeoutError` |
| one holder, others **refuse** with a message | the same try-once acquire; render the refusal in the catch |
| across processes on one machine | `simple-on-disk-cache` with a local directory |
| within one process | `simple-in-memory-cache`, constructed **once** at module scope |

## 🔴 .a hold spans a state transition, never a unit of work

> **a lock guards the read-check-write of a watermark. it never guards the work the watermark
> describes.**

a long hold is the antipattern itself: its lease must outlast the work, so a crashed holder
blocks its key for as long as the work might have run. a short hold has no such trade — its
lease is seconds, so a crash frees the key at once.

| the long-hold shape | the short-hold shape |
|---|---|
| hold a key for a whole round so a rewind refuses | each given write checks a **generation** the round captured at start; a rewind bumps it; a stale round's writes are discarded |
| hold a key while the leader primes so waiters wait | the leader writes **claimed-at**, primes, writes **primed-at**; waiters read the watermark, never the lock |

⇒ the question *"is this work still in flight?"* is a question about **state**, answered by a
watermark — never a question about a **lock**.

🟡 **the lease must exceed the critical section's worst case** — and a critical section that is
one watermark transition has a worst case of milliseconds. a lease sized in minutes or hours is
the cue that the hold wraps work, not a transition.

## .the test

> **does this code let one actor hold a key that another actor checks?**

yes → it is a lock, and it is a `withSimpleMutex` call · no → this rule says naught about it.

| when… | then… |
|---|---|
| you reach for `fs.openSync(path, 'wx')` or `flag: 'wx'` to claim a key | 🔴 that is a lock. use `withSimpleMutex` |
| you write a pid into a file so another process can see who holds it | 🔴 that is a lock. use `withSimpleMutex` |
| a reader only needs to know **whether** a key is held | acquire with a zero timeout and release at once; if that does not fit, the query is a feature owed to `with-simple-mutex` |
| the lease model releases a crashed holder too late for your case | 🔴 the hold is too long. shrink it to the watermark transition; the lease then lapses in seconds |
| you need a hold that outlives one process (a parent hands it to a child) | the hold wraps work. let each process check the watermark itself |
| you dedupe concurrent in-process calls with a promise map | that is a memo, not a lock — `with-simple-cache`, not this rule |

blocker: a lock built on aught but `withSimpleMutex` · a lock cache constructed per call (no
lock at all) · a lease with no stated worst case behind it · a hold that spans a unit of work
rather than one watermark transition.

⇒ see also: `rule.forbid.hand-rolled-locks` (the forbid twin) ·
`rule.always.reuse-pavement-before-improvise` (bhrain/role=learner — the check that would have
found this package before three locks were built) · `rule.forbid.workarounds` (bhrain/role=driver —
a lock gap is fixed in the package, never patched beside it).
