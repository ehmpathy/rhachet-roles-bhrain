# domain.term.choice.reason: absent

## .etymology

`absent` is the repo's already-canonical word for *"not there"*. it was not chosen fresh here —
it was **inherited**, and that is the whole argument for it:

- `rule.forbid.gerunds` (ehmpathy/mechanic) names `absent` as the replacement for the gerund form
- `rule.forbid.term-*` blocks the vague-negation word, with `absent` among its alternatives
- `keyrack` already prints `status: absent 🫧` for a key that has no value

⇒ **the word was settled repo-wide before this behavior needed it**, so to reach for any other
would have been drift rather than choice.

chosen over:

| rejected | why |
|---|---|
| `unanswered` | describes the **critique**, never the file. and it is the prose word for the whole uncontemplated state, which would collide with the tag |
| `empty` | an empty `.taken` **does** exist — it is a real and distinct failure the engine cannot detect (`setStoneAsContemplated.ts:77` tests existence, never content). to name the no-file case `empty` would fuse the two |
| `none` / `null` | machine words. the tag is read by a human in a halt tree |

## 🔴 .why the `empty` rejection is the load-bearing one

the engine tests that a `.taken` **exists**, never what it says. so there are three states, and
only two have tags:

| the file | tag | who catches it |
|---|---|---|
| no file | `absent` | ✅ the **engine** |
| a file answering a superseded given | `stale` | ✅ the **engine** |
| a file with a token or empty answer | ⛔ untagged | 🔴 only the **reviewer**, next round |

⇒ **`absent` must not stretch to cover the third row.** a driver who reads *"absent"* and writes
an empty file has satisfied the engine and answered no one — which is precisely the forbidden exit
`rule.forbid.unanswered-exits-from-a-blocker` names (*"the engine tests that the file exists,
never what it says. it costs a round and is re-raised"*).

⚠️ the third row's untagged state is a **stated limit of the gate**, recorded in
`1.vision.yield.md`: *"the gate cannot check that an answer is real."*

## 🔴 .the OVERLOAD — shared with its peer, and recorded once for the pair

`absent` carries a second sense in this repo's prose, exactly as `stale` does: the **evidence
rung** where a snapshot has no bytes, so any authored value asserts output never observed.

**both halves of one axis are overloaded by both halves of another**, which is what makes the
collision worth a record rather than a shrug — a reader who learns one *"stale vs absent"* pair
will read the other one wrong.

⇒ the full argument, the measurement, and why no rename was made this round live in the peer's
reason file rather than duplicated here:
`term=route.guard.review.contemplate.stale._.choice.reason.md`, § *"the OVERLOAD"*.

## .evidence

- the contract value, read from source: `getRouteGuardReviewPeerContemplationStatus.ts:32`
- the untagged third state: `setStoneAsContemplated.ts:77`
- the stated limit: `1.vision.yield.md`, § *"the contract"*

## .see also

- `term=route.guard.review.contemplate.stale._.choice._.md` — the peer value on the same axis
- `term=route.guard.review.contemplate._.choice._.md` — the act these tags qualify
- `rule.forbid.unanswered-exits-from-a-blocker` (bhrain/driver) — why the empty-file case must stay untagged by this word
