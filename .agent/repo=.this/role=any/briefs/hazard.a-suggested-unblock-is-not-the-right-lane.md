# hazard.a-suggested-unblock-is-not-the-right-lane

> **a tool's own error text offers an unblock. that is a fact about what WOULD work, never about
> what you SHOULD reach for.**

## .the measured case — a radio push

`rhx radio.task.push --via gh.issues` fails with two offers:

```
✋ github auth via keyrack failed: EHMPATH_BEAVER_GITHUB_TOKEN (status: absent)
  • unblock now — re-run as human: --auth as-human
  • or set the robot token: rhx keyrack set --owner ehmpath --key … --env prep
```

both work. **the first is the correct lane and the second is a defect to create.**

| the lane | what it is |
|---|---|
| `--auth as-human` | 🔴 the channel a radio push goes out on. not a fallback |
| the beaver robot token | absent by intent. it is not this channel's credential |

⇒ so `status: absent` is no gap, and a `keyrack set` filed as a todo asks a human to provision a
credential the design does not use.

## 🔴 .why the mis-read is easy, and what it costs

the error text lists the two as peers, so their order reads as *"quick unblock"* against *"the
real fix"* — which inverts the truth here. and the word `absent` reads as a defect in every other
context a keyrack reports it.

⇒ the cost is not the failed call, which succeeds either way. it is the **recorded caveat**: an
artifact that files the absence as a gap, and an ask that spends a human's attention on work that
should not exist.

## .the test — before you file an absent credential as a gap

> **is this credential absent by ACCIDENT, or by INTENT?**

accident → a real gap · **intent** → the lane that needs it is the wrong lane. use the other one, and
record naught.

🟡 the tell: the tool offers a second lane that needs no credential at all. a genuinely blocked
operation offers one path, and it goes through the credential.

| when… | then… |
|---|---|
| a push fails on an absent token and offers an `as-human` re-run | reach for `as-human`. do not file the token |
| you would write *"a human must run `keyrack set`"* | ask first whether the design uses that key at all |
| a keyrack reports `absent` rather than `locked` | `locked` is a real blocker an unlock clears. `absent` may be the intended state |
| you would record a caveat about an unused credential | the caveat is the defect. cut it |

blocker: an absent-by-intent credential filed as a gap, an ask, or a recorded caveat.
false positive: an absent credential the design genuinely uses — that is a real gap, and it is owed a
push.

⇒ see also: `rule.require.errors-name-the-fix` (ergonomist — an error that offers two fixes must rank
them) · `rule.always.catch-dreams-for-followups` (what a real gap is owed).
