# self-review r6: has-ergonomics-validated

sixth pass: wish alignment check.

---

## original wish

from `0.wish.md`:

> today,
>
>      │
>      └─ are you blocked? if so, run
>         └─ rhx route.stone.set --stone 5.1.execution.phase0_to_phaseN.v1 --as blocked
>
> only shows up at the bottom of the route.drive hook stdout
>
> lets add a separate dedicated fallen-leaf challenge section at the top

---

## wish requirements

| requirement | implementation | status |
|-------------|----------------|--------|
| blocked option at top | tea pause at top with blocked | ✓ |
| separate section | tea pause is distinct from route.drive | ✓ |
| challenge format | "you must choose one" | ✓ |
| not optional | "to refuse is not an option" | ✓ |

---

## wish quote: "repeat the options"

> it should say
>
> 'are you blocked? or have you decided not to try?'
>
> and it shoudl repeat the options
>
> are you ready for review?
> are you ready to continue?
> are you blocked?

**implementation:**

```
├─ you must choose one
│  ├─ ready for review?
│  │  └─ rhx route.stone.set --stone 1.vision --as arrived
│  │
│  ├─ ready to continue?
│  │  └─ rhx route.stone.set --stone 1.vision --as passed
│  │
│  └─ blocked and need help?
│     └─ rhx route.stone.set --stone 1.vision --as blocked
```

all three options are shown with question labels.

**status:** ✓ fulfilled

---

## wish quote: "make it clear it must pick one"

> and should make it clear that it must pick one or continue to work. its not an option to refuse.

**implementation:**

```
└─ ⚠️ to refuse is not an option.
   work on the stone, or mark your status.
```

mandate is explicit.

**status:** ✓ fulfilled

---

## conclusion

all wish requirements fulfilled:
- blocked at top ✓
- separate section ✓
- three options shown ✓
- mandate clear ✓

ergonomics match original intent.

