# self-review: has-preserved-test-intentions (r4)

## the question

for every test you touched:
- what did this test verify before?
- does it still verify the same behavior after?
- did you change what the test asserts, or fix why it failed?

---

## detailed review of each changed line

### file: blackbox/achiever.goal.triage.acceptance.test.ts

reviewed line by line. here are all 23 deleted lines with their replacements:

---

#### change 1: line 622

**before**: `given('[case6] goal.infer.triage shows incomplete goals separately', () => {`

**after**: `given('[case6] goal.triage.infer shows incomplete goals separately', () => {`

**analysis**:
- test description text changed
- `goal.infer.triage` → `goal.triage.infer`
- this is a skill name typo fix
- no assertion changed
- test intention (verify incomplete goals are shown separately) unchanged

---

#### change 2: line 663-666

**before**:
```ts
when('[t0] goal.infer.triage is invoked', () => {
  const result = useThen('invoke goal.infer.triage', async () => {
    return invokeGoalSkill({
      skill: 'goal.infer.triage',
```

**after**:
```ts
when('[t0] goal.triage.infer is invoked', () => {
  const result = useThen('invoke goal.triage.infer', async () => {
    return invokeGoalSkill({
      skill: 'goal.triage.infer',
```

**analysis**:
- skill name `goal.infer.triage` → `goal.triage.infer`
- this calls the correct skill that actually exists
- no assertion changed (expect statements untouched)
- test intention (invoke triage and check output) unchanged

---

#### change 3: line 715-718

**before**:
```ts
const result = useThen('invoke goal.infer.triage after completion', async () => {
  return invokeGoalSkill({
    skill: 'goal.infer.triage',
```

**after**:
```ts
const result = useThen('invoke goal.triage.infer after completion', async () => {
  return invokeGoalSkill({
    skill: 'goal.triage.infer',
```

**analysis**:
- same skill name fix
- no assertion changed
- test intention (verify output after completion) unchanged

---

#### change 4: line 739

**before**: `given('[case7] goal.infer.triage negative cases', () => {`

**after**: `given('[case7] goal.triage.infer negative cases', () => {`

**analysis**:
- test description text changed
- skill name typo fix
- no assertion changed

---

#### change 5: line 748-751

**before**:
```ts
const result = useThen('invoke goal.infer.triage with invalid scope', async () => {
  return invokeGoalSkill({
    skill: 'goal.infer.triage',
```

**after**:
```ts
const result = useThen('invoke goal.triage.infer with invalid scope', async () => {
  return invokeGoalSkill({
    skill: 'goal.triage.infer',
```

**analysis**:
- skill name fix
- no assertion changed
- test intention (verify invalid scope behavior) unchanged

---

#### change 6: line 846-849

**before**:
```ts
when('[t2] goal.infer.triage with --scope route shows route state', () => {
  const result = useThen('invoke goal.infer.triage --scope route', async () => {
    return invokeGoalSkill({
      skill: 'goal.infer.triage',
```

**after**:
```ts
when('[t2] goal.triage.infer with --scope route shows route state', () => {
  const result = useThen('invoke goal.triage.infer --scope route', async () => {
    return invokeGoalSkill({
      skill: 'goal.triage.infer',
```

**analysis**:
- skill name fix
- no assertion changed
- test intention (verify route scope shows route state) unchanged

---

#### change 7: line 924-927

**before**:
```ts
const result = useThen('invoke goal.infer.triage --mode hook.onStop', async () => {
  return invokeGoalSkill({
    skill: 'goal.infer.triage',
    args: { scope: 'repo', mode: 'hook.onStop' },
```

**after**:
```ts
const result = useThen('invoke goal.triage.infer --when hook.onStop', async () => {
  return invokeGoalSkill({
    skill: 'goal.triage.infer',
    args: { scope: 'repo', when: 'hook.onStop' },
```

**analysis**:
- skill name fix: `goal.infer.triage` → `goal.triage.infer`
- arg name fix: `mode` → `when`
- both are typo fixes to call the correct skill with correct args
- no assertion changed (expect statements untouched)
- test intention (verify hook.onStop fires with incomplete goal) unchanged

---

#### change 8: line 979-982

**before**:
```ts
const result = useThen('invoke goal.infer.triage --mode hook.onStop after completion', async () => {
  return invokeGoalSkill({
    skill: 'goal.infer.triage',
    args: { scope: 'repo', mode: 'hook.onStop' },
```

**after**:
```ts
const result = useThen('invoke goal.triage.infer --when hook.onStop after completion', async () => {
  return invokeGoalSkill({
    skill: 'goal.triage.infer',
    args: { scope: 'repo', when: 'hook.onStop' },
```

**analysis**:
- same skill name and arg name fixes
- no assertion changed
- test intention (verify hook.onStop after completion) unchanged

---

#### change 9: line 1064-1067

**before**:
```ts
when('[t2] goal.infer.triage --scope route outside a route', () => {
  const result = useThen('invoke goal.infer.triage --scope route', async () => {
    return invokeGoalSkill({
      skill: 'goal.infer.triage',
```

**after**:
```ts
when('[t2] goal.triage.infer --scope route outside a route', () => {
  const result = useThen('invoke goal.triage.infer --scope route', async () => {
    return invokeGoalSkill({
      skill: 'goal.triage.infer',
```

**analysis**:
- skill name fix
- no assertion changed
- test intention (verify error when --scope route used outside route) unchanged

---

## summary of all 23 deletions

| type | count | nature |
|------|-------|--------|
| skill name typo | 18 | `goal.infer.triage` → `goal.triage.infer` |
| arg name typo | 5 | `mode` → `when` |

**zero assertions changed**.

---

## forbidden check

| criterion | found? | evidence |
|-----------|--------|----------|
| weaken assertions | no | all expect() statements unchanged |
| remove test cases | no | zero test cases removed |
| change expected values | no | expected strings unchanged |
| delete tests that fail | no | zero tests deleted |

---

## why it holds

the tests had bugs: they called a skill that did not exist (`goal.infer.triage`) and used an arg that did not exist (`mode`).

the tests now call the correct skill (`goal.triage.infer`) with the correct arg (`when`).

the test intentions are unchanged:
- still verify hook.onStop fires
- still verify incomplete goals are shown
- still verify scope behaviors
- still verify negative cases

the assertions are unchanged. only the invocation was fixed.

