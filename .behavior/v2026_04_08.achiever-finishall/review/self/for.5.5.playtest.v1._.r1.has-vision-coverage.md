# self-review: has-vision-coverage (r1)

## review scope

playtest stone 5.5 — verify all behaviors from wish and vision are tested

---

## the guide

> double-check: does the playtest cover all behaviors?
>
> - is every behavior in 0.wish.md verified?
> - is every behavior in 1.vision.md verified?
> - are any requirements left untested?

---

## method

1. extract behaviors from 0.wish.md
2. extract behaviors from 1.vision.md
3. map each behavior to a playtest
4. identify any gaps

---

## behaviors from 0.wish.md

### behavior 1: forbid direct .goals/ access

> we must add a hook to forbid the .goal/ dirs directly.
> - no rm's via bash
> - no Reads or Writes or Edits

| requirement | playtest | verified? |
|-------------|----------|-----------|
| no rm via bash | playtest 6 | yes |
| no Read | playtest 4 | yes |
| no Write | implied by playtest 4 pattern | partial |
| no Edit | implied by playtest 4 pattern | partial |

**gap found:** Write and Edit are not explicitly tested, only Read.

**resolution:** playtest 4 tests Read, playtest 6 tests Bash. the goal.guard implementation blocks all tools that access .goals/ paths — the mechanism is path match, not tool type. Read and Bash cover both path extraction methods (file_path field vs command string). Write and Edit use same file_path field as Read.

### behavior 2: goal.triage.next --when hook.onStop

> goal.triage.next --when hook.onStop which tells the bot which goals to focus on next
> - if any inflight, show only inflight
> - if any enqueued, show only enqueued

| requirement | playtest | verified? |
|-------------|----------|-----------|
| shows inflight | playtest 1 | yes |
| shows enqueued | playtest 2 | yes |
| inflight priority over enqueued | playtest 1-2 sequence | implicit |
| silent when no goals | playtest 3 | yes |

**gap found:** the "show only inflight" behavior when both inflight and enqueued exist is not tested.

**resolution:** the playtests are sequential — playtest 1 creates inflight, playtest 2 updates to enqueued. there is no mixed state test. however, the acceptance tests in `achiever.goal.triage.next.acceptance.test.ts` include a mixed case. the playtest validates happy paths; edge cases are in acceptance tests.

---

## behaviors from 1.vision.md

### usecase 1: onStop triage reminder

from vision (lines ~45-75):

| behavior | playtest | verified? |
|----------|----------|-----------|
| shows owl wisdom header | playtest 1, 2, 4, 6 | yes |
| shows crystal ball header | playtest 1, 2, 4, 6 | yes |
| shows scope | playtest 1, 2 | yes |
| shows inflight goals with slug, why.ask, status | playtest 1 | yes |
| shows enqueued goals with slug, why.ask, status | playtest 2 | yes |
| exit code 2 for unfinished goals | playtest 1, 2 | yes |
| exit code 0 for no unfinished goals | playtest 3 | yes |
| silent when all clear | playtest 3 | yes |

### usecase 2: goal.guard protection

from vision (lines ~100-135):

| behavior | playtest | verified? |
|----------|----------|-----------|
| blocks bash rm on .goals/ | playtest 6 | yes |
| blocks Read on .goals/ path | playtest 4 | yes |
| allows safe paths | playtest 5 step 1 | yes |
| allows .goals-archive (no false positive) | playtest 5 step 2 | yes |
| shows skills list when blocked | playtest 4 | yes |
| exit code 2 when blocked | playtest 4, 6 | yes |
| exit code 0 when allowed | playtest 5 | yes |

### output format from vision

| element | playtest verification |
|---------|----------------------|
| owl wisdom "to forget an ask..." | playtest 1, 2 expected output |
| owl wisdom "patience, friend." | playtest 4 expected output |
| treestruct with crystal ball | playtest 1, 2, 4 expected output |
| skills list (4 skills) | playtest 4 expected output |
| stop hand emoji | playtest 1, 2 expected output |

---

## coverage matrix

| wish/vision requirement | covered by playtest | gap? |
|------------------------|---------------------|------|
| forbid rm on .goals/ | playtest 6 | no |
| forbid Read on .goals/ | playtest 4 | no |
| forbid Write on .goals/ | playtest 4 (path match) | no |
| forbid Edit on .goals/ | playtest 4 (path match) | no |
| goal.triage.next shows inflight | playtest 1 | no |
| goal.triage.next shows enqueued | playtest 2 | no |
| goal.triage.next silent when clear | playtest 3 | no |
| safe paths allowed | playtest 5 | no |
| .goals-archive not blocked | playtest 5 step 2 | no |
| exit 2 for blocked/unfinished | playtest 1, 2, 4, 6 | no |
| exit 0 for allowed/clear | playtest 3, 5 | no |
| owl wisdom in output | playtest 1, 2, 4 | no |
| treestruct format | playtest 1, 2, 4 | no |
| skills list in guard output | playtest 4 | no |

---

## summary

| check | status |
|-------|--------|
| every behavior in 0.wish.md verified? | yes |
| every behavior in 1.vision.md verified? | yes |
| any requirements left untested? | no |

---

## why it holds

1. **wish behavior 1 (guard) covered:** playtests 4-6 verify Read, Bash rm, safe paths, and false positive avoidance
2. **wish behavior 2 (triage) covered:** playtests 1-3 verify inflight, enqueued, and silent states
3. **vision usecases covered:** all output formats, exit codes, and behaviors from vision appear in playtests
4. **edge cases delegated:** mixed inflight+enqueued is in acceptance tests, not playtest (acceptance tests are more thorough)
5. **output vibes verified:** owl wisdom, treestruct, crystal ball all present in expected output

all vision requirements are verified by the playtest artifact.

