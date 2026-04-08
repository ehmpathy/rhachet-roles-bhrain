# self-review: behavior-declaration-adherance (r7)

## stone
5.1.execution.phase0_to_phaseN.v1

## question
does the implementation match the vision, criteria, and blueprint?

## answer
yes. all requirements satisfied. hooks implemented via workaround.

## fresh verification

### hooks implementation corrected (not deferred)

prior reviews incorrectly stated hooks were deferred. fresh read of actual code reveals:

**onStop hook — implemented via Role.build():**
```
getAchieverRole.ts:25-30
hooks: {
  onBrain: {
    onStop: [{
      command: './node_modules/.bin/rhx goal.infer.triage --mode hook.onStop',
      timeout: 'PT10S',
    }],
  },
},
```

**onTalk hook — implemented via init workaround:**
```
inits/init.claude.hooks.sh — adds UserPromptSubmit hook to settings.json
inits/claude.hooks/userpromptsubmit.ontalk.sh — runs on each user message
```

reason for workaround: rhachet Role.build() supports onBoot, onTool, onStop but not onTalk. init bypasses abstraction and configures Claude settings directly.

**verdict:** hooks ARE implemented. prior review was outdated.

---

### domain objects adherance

| object | vision requirement | implementation |
|--------|-------------------|----------------|
| Goal.slug | string identifier | `Goal.ts:118` ✓ |
| Goal.why | ask, purpose, benefit | `Goal.ts:24-39` ✓ |
| Goal.what | outcome | `Goal.ts:47-52` ✓ |
| Goal.how | task, gate | `Goal.ts:60-70` ✓ |
| Goal.status | choice, reason | `Goal.ts:78-88` ✓ |
| Goal.when | goal or event | `Goal.ts:98-108` ✓ |
| Goal.source | peer:human, peer:robot, self | `Goal.ts:18` ✓ |
| Ask.hash | sha256 of content | `Ask.ts:14` ✓ |
| Coverage.goalSlug | maps hash to goal | `Coverage.ts:14` ✓ |

---

### persistence adherance

| vision requirement | implementation |
|-------------------|----------------|
| .goals/$branch/ for repo scope | `goal.ts:46` ✓ |
| $route/.goals/ for route scope | `goal.ts:51-65` ✓ |
| $offset.$slug.goal.yaml | `setGoal.ts:45-52` ✓ |
| $offset.$slug.status=$choice.flag | `setGoal.ts:52` ✓ |
| asks.inventory.jsonl | `setAsk.ts:16` ✓ |
| asks.coverage.jsonl | `setCoverage.ts:16` ✓ |
| 7-digit leftpad offset | `setGoal.ts:42` ✓ |
| goals on main forbidden | `goal.ts:43-45` ✓ |

---

### triage flow adherance

| vision requirement | implementation |
|-------------------|----------------|
| hook.onTalk accumulates asks | `userpromptsubmit.ontalk.sh` via init ✓ |
| hook.onStop halts until covered | `getAchieverRole.ts:25-30` ✓ |
| getTriageState returns uncovered | `getTriageState.ts:14` ✓ |
| setCoverage marks ask as covered | `setCoverage.ts:11` ✓ |

---

### briefs adherance

| brief | required content | found |
|-------|------------------|-------|
| philosophy | "to forget an ask is to break a promise" | line 44 ✓ |
| guide | triage workflow steps | present ✓ |

---

## conclusion

fresh verification confirms all requirements satisfied. hooks implemented via workaround, not deferred. implementation fully adheres to behavior declaration.

