# domain.term: slug

term.chosen   = slug
term.kind     = noun
term.boundary = _ (a ROOT — one sense, reused across every subject that needs a human-typeable id)
term.synonyms.forbidden:
- id
- name
- key
- handle
- identifier

## .what

a short, stable, human-typeable identifier for one member of a named set.

a slug is the word a human **types back** — `--that <slug>`, `--peer <slug>` — so its whole job is to
survive the round trip from a printed prompt to a keyboard to a filename.

## 🔴 .the two vocabularies — a slug has a CONFIG form and a DISK form

they are one concept in two encodings, never two concepts, and **every comparison between them must
cross through `asSanitizedPeerReviewSlug`**:

| form | where it lives | may hold a separator? |
|---|---|---|
| **config** | the guard file — and the legacy flat format derives it from the review command itself | ✅ **yes** — `.test/mock-review.sh` is a real, live reviewer |
| **disk** | the `.given` / `.taken` filename the write side builds | ⛔ never — separators are swapped first |

⚠️ a raw config slug compared against a disk slug **misses**, and a miss is not merely a lost lookup —
see the reason file.

## .refs

- `src/domain.objects/Driver/RouteStoneGuard.ts:36` — `RouteStoneGuardReviewPeer.slug`, and
  `:74` `public static unique = ['slug']`
- `src/domain.objects/Driver/RouteStoneGuard.ts:12` — the `review.self` slug
- `src/domain.objects/Driver/RouteStoneGuardReviewSelfArtifact.ts:23`
- `src/domain.objects/Achiever/Goal.ts:198` — the goal slug
- `asSanitizedPeerReviewSlug` · `asPeerReviewLevelBySlug` · `getLatestPeerGivensPerSlug` ·
  `getOverruledReviewerSlugs` · `asRouteGuardReviewPeerSlugList`

## .reason

- `term=slug._.choice.reason.md`
