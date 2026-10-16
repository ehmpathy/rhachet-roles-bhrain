# rule.forbid.hand-rolled-locks

> **never build a lock by hand. a key one actor holds and another actor checks is a
> `withSimpleMutex` call.**

the forbid twin of `rule.require.locks-via-with-simple-mutex` — it names the shapes a reviewer can
point at in a diff.

## .the shapes it forbids

```
👎  fs.openSync(lockPath, 'wx')                     # an exclusive create as a claim
👎  fs.writeFile(`${dir}/${name}.pid=${pid}.lock`)  # a holder carried in a file name
👎  isProcessAlive(readPid(lockPath))               # a crash rule invented per lock
👍  withSimpleMutex(logic, { key, cache, lease, acquire })
```

## .the cue

| when… | then… |
|---|---|
| a diff adds a `'wx'` open, a `.lock` or `.pid` file, or a claim/holder pair | 🔴 it is a hand-rolled lock |
| a reader decides liveness from a pid, a start time, or an mtime | 🔴 a crash rule the package already owns as a lease |
| a hand-rolled lock is kept because the package "lacks a feature" | 🔴 the design is overcomplicated. the hold wraps work; shrink it to a watermark transition and the plain call fits |
| a lock's lease is sized in minutes or hours | 🔴 a long mutex — the antipattern. track the work as state, and lock only the state's update |

blocker: a lock built from a file claim, a pid file, or a name that carries a holder · a liveness
rule invented beside a lock · a hold that spans a unit of work.

⇒ see also: `rule.require.locks-via-with-simple-mutex` (the require twin, with the shapes to use).
