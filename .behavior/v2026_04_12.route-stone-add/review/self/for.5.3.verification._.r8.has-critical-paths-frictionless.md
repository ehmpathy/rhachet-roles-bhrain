# self-review: has-critical-paths-frictionless (r8)

## the claim

critical paths work without friction. users can complete primary workflows without confusion or unnecessary steps.

## critical paths for route.stone.add

### 1. add stone from literal content

```sh
rhx route.stone.add --stone 3.1.research.custom --from 'my content' --mode apply
```

**friction-free?**: yes
- single command
- clear flags
- immediate feedback with tree output
- suggests next step (`rhx route.drive`)

### 2. add stone from template

```sh
rhx route.stone.add --stone 3.1.research.adhoc --from 'template($behavior/refs/template.stone)' --mode apply
```

**friction-free?**: yes
- template syntax is explicit
- template path resolved relative to route
- error if template not found (clear message)

### 3. add stone from stdin

```sh
echo "content" | rhx route.stone.add --stone 3.2.research.api --from @stdin --mode apply
```

**friction-free?**: yes
- standard @stdin convention
- clear error if stdin is empty

### 4. plan before apply

```sh
rhx route.stone.add --stone 3.1.research.custom --from 'content'
# shows preview, no --mode defaults to plan
rhx route.stone.add --stone 3.1.research.custom --from 'content' --mode apply
# applies
```

**friction-free?**: yes
- plan is default (safe)
- preview shows exact content to be written
- rerun with --mode apply to execute

## error paths

all error paths provide actionable messages:

- collision: says "stone already exists; use different name or `route.stone.del` first"
- invalid name: says "stone name must have numeric prefix followed by at least one alpha segment"
- absent args: says "--stone is required" / "--from is required"
- empty stdin: says "no content provided via stdin"
- template not found: says "template file not found" with path
- route not found: says "route not found" with path

## manual verification (this session)

### verified: plan mode
```
$ rhx route.stone.add --stone 99.1.test.frictionless --from 'test content' --mode plan
🦉 another stone on the path
🗿 route.stone.add --mode plan
   ├─ stone  = 99.1.test.frictionless
   ├─ route  = .behavior/v2026_04_12.route-stone-add
   ├─ source = test content
   ├─ preview
   │  ├─
   │  │  test content
   │  └─
   └─ create = no (plan mode)
rerun with --mode apply to execute
```
**result**: frictionless — clear output, safe default

### verified: apply mode
```
$ rhx route.stone.add --stone 99.2.test.apply --from 'apply test' --mode apply
🦉 another stone on the path
🗿 route.stone.add --mode apply
   ├─ stone  = 99.2.test.apply
   └─ created = .behavior/.../99.2.test.apply.stone
the way continues, run
   └─ rhx route.drive
```
**result**: frictionless — immediate creation, next step suggested

### verified: collision error
```
$ rhx route.stone.add --stone 99.2.test.apply --from 'collision' --mode apply
error: BadRequestError: stone already exists; use different name or `route.stone.del` first
{
  "stone": "99.2.test.apply",
  "path": ".behavior/.../99.2.test.apply.stone"
}
```
**result**: frictionless — clear error, actionable hint

### verified: stdin path
```
$ echo "stdin content" | rhx route.stone.add --stone 99.3.test.stdin --from @stdin --mode apply
🦉 another stone on the path
🗿 route.stone.add --mode apply
   └─ created = .behavior/.../99.3.test.stdin.stone
```
**result**: frictionless — standard @stdin convention works

## note: no repros artifact

guide references `.behavior/*/3.2.distill.repros.*.md` but this behavior has no such artifact. critical paths derived from criteria, not reproduced user friction.

## the result

- all primary workflows complete in 1-2 commands
- error messages are specific and actionable
- plan mode is default (safe preview before apply)
- output suggests next steps
- **manually verified in this session**

