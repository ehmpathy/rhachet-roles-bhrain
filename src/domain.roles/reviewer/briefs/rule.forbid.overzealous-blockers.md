# rule.forbid.overzealous-blockers

> **grade a point a blocker only when you can name a harm that ships with it. otherwise grade it a
> nitpick.**

`contract.reviewer-output` gives you two severities. this says where the line sits: a blocker means
*"do not ship this"* — not *"this is a real defect"*, not *"this violates a rule."*

## .the test

per point: **what harm does a user or an on-call engineer suffer if this ships?**

- you can name it → **blocker**. write that line in the review
- you cannot name it → **nitpick**

harm lines look like: *"a caller sees X and concludes Y"* · *"an on-call engineer debugs Z for an
hour"* · *"a future reader trusts a baseline that lies."*

⚠️ **a rule violation is not a harm.** most rules keep a codebase workable, which is a cost the team
pays and the user does not. a rule's `severity:` header is the author's default for the class
(`rules101.content`), never a verdict on your instance.

## .why an overzealous blocker is expensive

| what it does | the cost |
|---|---|
| stops a release | the fix ships later, and all else queued behind it ships later too |
| 🔴 devalues real blockers | a driver who answered four style blockers reads the fifth with less care |
| can be unclosable | a cosmetic point that needs a credential or a quota halts the stone permanently |
| turns a conversation into a gate | a nitpick invites *"good catch, next round"*; a blocker demands a `.taken` and a re-run |

a point can be correct and belong at nitpick. **severity measures harm, never correctness.**

## 🔴 .after 3 rounds, re-grade before you re-raise

the driver read your point, answered it, and did not close it. pick one explanation and write it down
before the fourth raise:

| explanation | what you do |
|---|---|
| the driver misread it | re-state it plainly, with the concrete fix. keep it a blocker |
| the driver **cannot** close it — needs a credential, quota, or scope call | 🔴 re-grade to nitpick, and say why |
| it is correct and cosmetic | 🔴 re-grade to nitpick |

⚠️ **row 2 is the one that gets missed.** *permitted* is narrower than *possible*
(`rule.always.raise-a-blocker-a-taken-cannot-close`, driver): a test the driver could write but cannot
run without a key they do not hold is not permitted. to hold the release on it holds it on a **human's**
inaction while the halt names the driver.

a nitpick is still counted, still in the report, still in the conversation. it drops exactly one claim:
*"do not ship."*

## .the worked pair

two points, one review round, same rubric family, opposite correct grades:

| the point | grade | why |
|---|---|---|
| three adjacent `then` blocks call one local operation with identical input — a true `redundant-expensive-operations` violation | **nitpick** | suite green, no user harmed, no engineer paged |
| a snapshot pins `malfunctioned 💥` for cases whose own names say the guard **approves** | **blocker** | the test proves the opposite of its own claim, so every future reader trusts a lie |

what separates them is whether the artifact **misleads in production** — never the reviewer's
confidence, nor how strongly the cited rule is worded.

⇒ the full record, with the verbatim quotes and the cost it charged:
`rule.forbid.overzealous-blockers.example=the-tidiness-blocker-and-the-false-green.md`

## ⚠️ .the bound — this is not a licence to soften

a real blocker stays a blocker under a long round count, a tired driver, and a deadline alike.
`philosophy.verification-strictness` holds: zero deferrals, zero fake tests, zero skips. **the target
is a MIS-GRADE, never a defect.**

both mis-grades are real: a nitpick graded blocker stalls a release for no gain; a blocker graded
nitpick ships the defect. **name the harm and you catch both.**

blocker: a blocker with no stated harm · a third raise of one point with no re-grade and no
re-statement · a blocker the driver is not **permitted** to close, held past one round.
nitpick: a correct-but-cosmetic point graded blocker.

⇒ see also: `contract.reviewer-output` (the two severities) · `on.rules/rules101.content.[article]` ·
`rule.always.raise-a-blocker-a-taken-cannot-close` (driver — the mirror: what a driver does when a
correct blocker is unclosable) · `philosophy.verification-strictness` (behaver — the bound above).
