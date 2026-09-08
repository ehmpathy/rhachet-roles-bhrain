# domain.term.choice.reason: slug

## .etymology

from the print trade: a **slug** is the short draft title a story carries through production —
stable, lowercase, no spaces, safe to file under. the web borrowed it for url paths for the same
property.

this repo borrowed it for the same reason again, and the property that matters is narrower than
*"identifier"*: **a slug is the id a human retypes.** the halt prompt prints
`--as contemplated --that <slug>`, and a driver types it back. so it must be short, stable, and
free of any character that a shell, a glob, or a filename would treat as structure.

### why not the five alternatives

| rejected | for |
|---|---|
| `id` | implies machine-minted and opaque. a slug is authored and read aloud |
| `name` | too loose — a name may hold spaces, case, and punctuation, all of which break the round trip |
| `key` | already carries a hard sense here: `unique` / `primary` key on a `DomainEntity`, and a keyrack key |
| `handle` | a social-media word; and it suggests a reference held, rather than an identity |
| `identifier` | the genus, not the differentia — every one of the above is an identifier |

## .why it is a ROOT, unqualified

`rule.require.boundary-qualified-terms` asks *"a slug, of WHAT?"* and the honest answer is **four
subjects** — a peer reviewer, a self review, a guard artifact, a goal:

| subject | declaration |
|---|---|
| peer reviewer | `RouteStoneGuard.ts:36`, `unique = ['slug']` |
| self review | `RouteStoneGuard.ts:12` — `--as promised --that $slug` |
| self-review artifact | `RouteStoneGuardReviewSelfArtifact.ts:23` |
| goal | `Goal.ts:198` (Achiever) |

⚠️ **four subjects is not four senses.** the rule splits a term when *"two answers = two senses"*; here
the sense is identical in all four — a short, stable, human-typeable id — and only the **subject**
varies. that is the same shape as `artifact` and `route`, which are roots with sub-terms rather than
four qualified clusters.

⇒ so the boundary is `_`, and a subject-specific concern is recorded **within** the root rather than
by a fork. the two-vocabulary rule below is peer-review-specific and lives here for that reason.

## 🔴 .evidence — the raw/sanitized mismatch, measured on this drive 2026-09-04

the write side sanitizes a slug before it builds a `.given` filename
(`runStoneGuardReviews.ts:116`). the config side does **not**, and legitimately cannot: the legacy
flat guard format derives a peer's slug from the review command itself
(`parseStoneGuard.ts:412-413` — `slug: cmd.split(/\s+/)[0]`), so `.test/mock-review.sh` is a real,
live, fully-configured reviewer whose config slug holds a separator.

so two lookups keyed their maps on the **raw** config slug while the slugs they were asked about came
back **sanitized, off disk**:

| site | what the miss did |
|---|---|
| `getOverruledReviewerSlugs` | a human's overrule could never forgive that reviewer |
| `asPeerReviewLevelBySlug`'s predecessor — an inline `.map` | 🔴 **the miss IS the retired test** |

### ⚠️ the consequence is worse than a lost lookup

`computePeerUncontemplatedUnforgiven` reads `retired: !levelBySlug.has(slug)`. so a raw-keyed map does
not merely fail to find a level — **it declares a live, fully-configured reviewer `retired from the
guard config`**, and prints the *"it will not speak again"* copy that the same drive had written to
prevent exactly that confusion.

⇒ **the rule this evidence buys**: the config slug and the disk slug are two vocabularies, and every
time one is compared to the other it goes through `asSanitizedPeerReviewSlug`. the transformer exists
so the swap is **reached for, never re-typed**.

### 🔴 and the lesson that outlived the fix

the transformer was extracted at i004, for two call sites. at i005 a third site was found still keyed
raw.

> **to extract a transformer does not tell you where it must be reached for. you must enumerate the
> sites.**

⚠️ that is a **worse** failure than the original duplication, because the extraction *reads* like the
problem was solved. the clamp is `asPeerReviewLevelBySlug.test.ts [case2][t1]`, which asserts the
consequence (`retired: false` and the real level) rather than merely the key shape — `[t0]` alone
would stay green under a change that loses the level without the retired verdict.

## .disputes

none raised. the word was in use across four declared domain objects before it was itemized; this
cluster documents extant practice rather than settles a contest.

⚠️ **the gap it closes is a real one**: `rule.require.domain-term-itemization` binds a word that
composes a declared dobj or dop, and `slug` composes at least five operations plus a `unique` key. it
went unitemized while eight of its `route.guard.review.*` siblings had clusters — the same class of
absence found for `given` and `taken` earlier the same day.
