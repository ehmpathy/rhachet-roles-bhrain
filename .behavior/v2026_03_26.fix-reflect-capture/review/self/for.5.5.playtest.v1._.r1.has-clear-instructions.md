# self-review r1: has-clear-instructions

## step back and breathe

question: are the instructions followable?

I will trace through every command in the playtest as if I were the foreman.

---

## trace through the playtest

### prerequisites (lines 3-9)

I read `5.5.playtest.v1.i1.md` line by line.

**before my fix:**
```
- git repository with staged changes
```

**issue found:** this was inaccurate. the playtest creates its own temp repo via `mkdir -p .temp/playtest-reflect` and `git init`. foreman doesn't need to start in a repo.

**fix applied to playtest:**
```
- bash shell
...
note: the playtest creates its own temp git repo — no need to be in a repo
```

### happy path 1: small diff (lines 17-46)

**command trace:**

| line | command | cwd after | notes |
|------|---------|-----------|-------|
| 21 | `mkdir -p .temp/playtest-reflect` | unchanged | creates dir |
| 22 | `cd .temp/playtest-reflect` | `.temp/playtest-reflect` | changes cwd |
| 25-27 | git init + config | same | initializes repo |
| 30-32 | echo + git add + commit | same | creates initial commit |
| 35-36 | echo + git add | same | creates staged change |
| 39 | `cd ../..` | back to gitroot | **required** for rhx |
| 40 | `rhx reflect.savepoint set --cwd ...` | gitroot | uses --cwd flag |

**issue check:** the `cd ../..` on line 39 is necessary because `rhx` may need to run from gitroot. the `--cwd` flag tells it where the target repo is.

**verdict:** commands are correct and sequenced properly.

### happy path 2: large diff (lines 48-63)

**command trace:**

| line | command | notes |
|------|---------|-------|
| 52 | `cd .temp/playtest-reflect` | back to temp repo |
| 53 | `for i in {1..15000}; do ...` | creates ~1.2MB file |
| 54 | `git add large.txt` | stages large file |
| 57 | `cd ../..` | back to gitroot |
| 58 | `rhx reflect.savepoint set ...` | run command |

**size calculation:**

```
"line NNNNN: the quick brown fox jumps over the lazy dog repeated many times"
```

each line is ~80 characters. 15,000 lines × 80 chars = 1,200,000 bytes = ~1.2MB > 1MB ✓

**issue found in review:** the original had 10,000 lines which would be ~800KB < 1MB. I fixed this to 15,000 lines.

### other commands verified

| section | commands | copy-paste? | output explicit? |
|---------|----------|-------------|------------------|
| happy path 1 | git init, echo, git add | yes | yes |
| happy path 2 | for loop, git add | yes | yes |
| apply mode | rhx --mode apply | yes | yes |
| empty diff | git reset | yes | yes |
| cleanup | rm -rf | yes | n/a |

---

## found issues and fixes

### issue 1: incorrect prerequisite

**problem:** said "git repository with staged changes" but playtest creates its own temp repo

**fix applied:** changed to "bash shell" and added note: "the playtest creates its own temp git repo — no need to be in a repo"

### issue 2: loop count too small for >1MB

**problem:** 10,000 lines × 80 chars = 800KB < 1MB (wouldn't trigger ENOBUFS)

**fix applied:** increased to 15,000 lines (1.2MB > 1MB)

---

## why it holds after fixes

1. **prerequisites are accurate** — foreman knows they just need bash and rhx, no prior repo needed
2. **commands are sequenced** — cd commands properly manage cwd between temp repo and gitroot
3. **output is explicit** — each step says what to expect (exit 0, specific output strings)
4. **size threshold is met** — 15,000 lines ensures >1MB which would have triggered ENOBUFS before the fix

---

## summary

| check | status | evidence |
|-------|--------|----------|
| followable without context | yes | prerequisites fixed, note added |
| commands copy-pasteable | yes | traced each command |
| outcomes explicit | yes | expected outcome after each step |
| size threshold correct | yes | 15,000 × 80 = 1.2MB |

**conclusion:** instructions are clear and followable after the two fixes applied in review.

r1 complete.

