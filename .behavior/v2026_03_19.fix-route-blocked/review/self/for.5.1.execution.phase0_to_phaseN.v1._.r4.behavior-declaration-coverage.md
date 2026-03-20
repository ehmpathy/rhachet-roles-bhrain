# self-review r4: behavior-declaration-coverage

review for coverage of the behavior declaration.

---

## vision requirements checklist

from `.behavior/v2026_03_19.fix-route-blocked/1.vision.md`:

| requirement | implemented? | evidence |
|-------------|--------------|----------|
| tea pause at TOP of output | yes | inserted after header, before `🗿 route.drive` |
| appears when suggestBlocked: true | yes | `if (input.suggestBlocked)` guard |
| shows arrived option | yes | `--as arrived` in output |
| shows passed option | yes | `--as passed` in output |
| shows blocked option | yes | `--as blocked` in output |
| mandate "to refuse is not an option" | yes | exact text in output |
| update route.stone.set.sh header | yes | all four --as options documented |
| boot.yml shows skill on startup | yes | skills.say added |

---

## criteria checklist

from `.behavior/v2026_03_19.fix-route-blocked/2.1.criteria.blackbox.md`:

### usecase.1: driver sees tea pause after repeated hooks

| criterion | implemented? | evidence |
|-----------|--------------|----------|
| tea pause at TOP when count > N | yes | `if (input.suggestBlocked)` = count > 5 |
| shows all three options | yes | arrivedCmd, passedCmd, blockedCmd |
| shows mandate | yes | "to refuse is not an option" |
| NOT shown when count <= N | yes | guard only fires when suggestBlocked |

### usecase.2: driver learns commands on boot

| criterion | implemented? | evidence |
|-----------|--------------|----------|
| route.stone.set header shown | yes | skills.say in boot.yml |
| header documents all options | yes | arrived, passed, approved, blocked |

### usecase.3: driver marks status

| criterion | implemented? | evidence |
|-----------|--------------|----------|
| --as arrived works | yes | extant functionality |
| --as passed works | yes | extant functionality |
| --as blocked works | yes | extant functionality |

### usecase.4: stuck driver escapes loop

| criterion | implemented? | evidence |
|-----------|--------------|----------|
| tea pause appears after N+ loops | yes | suggestBlocked = count > 5 |
| blocked option visible | yes | in tea pause section |

---

## blueprint checklist

from `.behavior/v2026_03_19.fix-route-blocked/3.3.1.blueprint.product.v1.i1.md`:

### filediff tree

| file | change | implemented? |
|------|--------|--------------|
| stepRouteDrive.ts | add tea pause | yes |
| route.stone.set.sh | update header | yes |
| boot.yml | add skills.say | yes |
| stepRouteDrive.test.ts | add tests | yes |

### codepath tree

| component | implemented? |
|-----------|--------------|
| tea pause section | yes |
| tree with three options | yes |
| mandate line | yes |

### implementation details

| detail | implemented? | exact match? |
|--------|--------------|--------------|
| insert after line 409 | yes | yes |
| insert before route.drive | yes | yes |
| if (input.suggestBlocked) guard | yes | yes |
| const arrivedCmd, passedCmd, blockedCmd | yes | yes |
| tree format with 3-space indent | yes | yes |
| mandate text | yes | yes |

---

## gaps found

none.

---

## summary

all vision requirements implemented.
all criteria satisfied.
all blueprint components implemented.

no gaps found.
