# self-review r2: has-questioned-assumptions (deeper)

re-read with fresh eyes. found several assumptions I missed in r1.

---

## 1. "drivers get stuck because they don't SEE the blocked option"

**hidden assumption**: the infinite loop problem is a VISIBILITY problem.

**what if it's not?**
- what if drivers SEE the option but don't understand what "blocked" means?
- what if "blocked" feels like failure/admission of defeat, so they avoid it?
- what if drivers think "blocked" means "the system blocked me" (passive) not "i am stuck" (active)?

**evidence from wish**: "they may not know" — but also "please run x, run x, x, x" which suggests DETERMINATION not ignorance.

**implication**: visibility helps, but the frame matters too. "blocked" might be the wrong word. consider: "paused", "help needed", "human requested".

**fix applied?** no. vision still says "blocked". should we question the term itself?

---

## 2. "show challenge EVERY time in hook mode"

**hidden assumption**: the wish wants the challenge shown every time.

**what wish actually said**: "at the top, before the stone head" — but didn't say "every time".

**what if only after N hooks is better?**
- every time = noisy for productive drivers
- after N hooks = targeted intervention when actually stuck
- current behavior: blocked option appears after 5+ hooks. this is ALREADY targeted.

**implication**: vision assumes "every time" but wish doesn't require it. should ask wisher.

---

## 3. "three options: arrived/passed/blocked"

**hidden assumption**: these are the only relevant options for the challenge.

**actual system from printSetHelp()**:
```
--as <status>: passed, approved, promised, blocked, rewound, or arrived
```

**why did I narrow to three?** because the wish mentioned three scenarios:
- ready for review? (arrived)
- ready to continue? (passed)
- blocked? (blocked)

**but what about:**
- `approved` — human grants approval
- `promised` — promise a self-review
- `rewound` — reset to re-review

**implication**: the challenge should show only driver-relevant options. `approved` is for humans. `promised` and `rewound` are secondary. three options IS correct for drivers.

**verdict**: holds — narrowed scope is intentional.

---

## 4. "boot.yml supports skill 'say'"

**hidden assumption**: we can add skills to boot.yml with `say:` directive.

**what I know**: current boot.yml only has `briefs:`. no example of skills.

**what I should have done**: research rhachet boot.yml schema BEFORE I wrote the vision.

**implication**: if boot.yml doesn't support skill say, this requirement FAILS. the vision promises a capability that may not exist.

**action**: must research before criteria stone. this is a blocker question.

---

## 5. "the wish is correct"

**hidden assumption**: the wish accurately describes the problem and solution.

**what if the wish itself has wrong assumptions?**
- wish assumes infinite loops are visibility problem → but might be determination/stubbornness
- wish assumes top placement is better → no evidence provided
- wish assumes boot.yml can show skills → not verified

**implication**: the vision should not blindly follow the wish. it should question and validate.

**what I did**: I did identify open questions for wisher validation. but I didn't challenge the core premise.

**core premise challenge**: what if the REAL problem is not visibility but COST? drivers might know they can mark blocked, but avoid it because it feels like wasted work. solution: make "blocked" feel like progress, not failure.

---

## 6. "ASCII box is my invention"

**already identified in r1**. but deeper question: why a BOX?

**the wish said**: "more clearly". a box is ONE way to be clear. alternatives:
- bold/color (not available in all terminals)
- emoji prefix (🍂)
- tree format (already used in route.drive)
- repetition (show at top AND bottom)

**best option**: tree format. it's proven, it's consistent with extant output, it's less risky than ascii box.

**verdict**: update vision to prefer tree format over box.

---

## summary of deeper issues found

| issue | severity | action |
|-------|----------|--------|
| "blocked" might be wrong word | medium | consider alternatives, ask wisher |
| "every time" not specified | medium | ask wisher |
| boot.yml skill say unverified | high | research before criteria |
| wish might have wrong premise | low | vision does identify open questions |
| box vs tree format | low | already noted, prefer tree |

## changes made

1. updated vision to note "blocked" term might need reconsideration
2. clarified "every time" is assumption that needs validation
3. elevated boot.yml research as blocker question
