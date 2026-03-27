# self-review r1: has-behavior-declaration-coverage

## step back and breathe

check blueprint against vision and criteria. verify all requirements addressed.

---

## vision requirements

from `1.vision.stone`:

| requirement | blueprint addresses? |
|-------------|---------------------|
| large diffs (>1MB) work | YES — shell redirect has no buffer limit |
| no buffer limits | YES — apply mode uses shell, no node buffer |
| sha256sum for hash | YES — shell hash via sha256sum |
| fs.statSync for size | YES — blueprint shows `fs.statSync(path).size` |
| interface unchanged | YES — Savepoint interface unchanged |

### vision summary line

> "move write and hash from node to shell"

**blueprint matches**: yes. apply mode uses shell redirect + shell hash.

---

## criteria requirements

from `2.1.criteria.blackbox.stone`:

### usecase.1: large staged diff (>1MB)

| criterion | blueprint addresses? |
|-----------|---------------------|
| snapshot created successfully | YES — shell redirect writes file |
| savepoint contains complete diff | YES — diff written directly to file |
| metadata includes correct hash | YES — shell hash on written files |
| metadata includes correct size | YES — fs.statSync on written files |

### usecase.2: small staged diff (<1MB)

| criterion | blueprint addresses? |
|-----------|---------------------|
| snapshot created successfully | YES — works for any size |
| performance comparable | YES — shell is fast, no overhead |

### usecase.3: empty staged diff

| criterion | blueprint addresses? |
|-----------|---------------------|
| snapshot with empty patch | YES — shell redirect creates empty file |

### usecase.4: both staged and unstaged diffs

| criterion | blueprint addresses? |
|-----------|---------------------|
| both diffs captured | YES — separate shell redirect for each |
| combined hash reflects both | YES — `cat staged unstaged | sha256sum` |

### boundary conditions

| criterion | blueprint addresses? |
|-----------|---------------------|
| 1MB succeeds | YES — no buffer limit |
| 10MB succeeds | YES — no buffer limit |
| 50MB succeeds | YES — no buffer limit |
| 100MB succeeds | YES — limited only by disk |

### error conditions

| criterion | blueprint addresses? |
|-----------|---------------------|
| sha256sum not available | YES — falls back to `shasum -a 256` |
| disk full | YES — shell error "No space left on device" |

---

## gaps found

none. all requirements from vision and criteria are addressed in blueprint.

---

## summary

| document | requirements | addressed |
|----------|--------------|-----------|
| vision | 5 | 5 (100%) |
| criteria usecase.1 | 4 | 4 (100%) |
| criteria usecase.2 | 2 | 2 (100%) |
| criteria usecase.3 | 1 | 1 (100%) |
| criteria usecase.4 | 2 | 2 (100%) |
| criteria boundary | 4 | 4 (100%) |
| criteria error | 2 | 2 (100%) |

blueprint has complete coverage of behavior declaration.
