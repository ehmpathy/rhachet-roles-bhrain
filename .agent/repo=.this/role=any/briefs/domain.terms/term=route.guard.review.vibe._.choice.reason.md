# domain.term.choice.reason: vibe

## .etymology
`vibe` names the role's felt identity in its review output — the mascot + catchphrase register that
makes a mechanic's review read as the seaturtle and a bhrain review read as the owl. the word is
already the repo's own casual term for a role's personality (see the role persona briefs
`im_a.bhrain_owl.md`, `rule.im_an.ehmpathy_seaturtle.md`, which describe each role's "vibe" and its
"vibe phrases"), so reuse of it for the config field keeps one word across persona-prose and
contract.

chosen over the rejected synonyms:
- `theme` — reads as a visual color/layout scheme (a ui theme), not a persona. a review has no
  palette; it has a voice.
- `persona` — heavier and more clinical than the codebase's register; the repo already says "vibe"
  in its own persona briefs, so `persona` would be a synonym drift away from the extant word.
- `brand` — org-identity jargon; implies a company mark, not a per-role render voice.
- `style` — too broad; conflates the mascot/artifact identity with format or code style.

## .disputes
none. `vibe` was the field name from the wish's own bonus ask ("allow the mascot and artifact … to
be configurable per role … same with catch phrases"), taken directly; no rival proposal.

## .evidence
- declaration: `ReviewVibe { mascot: string; artifact: string }` in
  `src/domain.operations/review.by/asReviewRubricsConfig.ts`, with `DEFAULT_VIBE = { mascot: '🦉',
  artifact: '🔍' }` and `asVibe` that fills each absent field from the default.
- contract surface: the optional top-level `vibe:` block in a role's `rubrics.yml`, documented in
  `howto.add-review-by-to-a-role.[guide].md`. this is a PUBLISHED interface (a role author writes
  it), so the term's canonical form matters most here (rule.forbid.domain-term-synonyms).
- invariant: `vibe` is optional; an absent or partial `vibe` falls back to the owl default
  field-by-field — never a hard error. a role declares a vibe to override, not to satisfy a
  requirement.
- acceptance: the turtle `🐢` / shell `🐚` override is exercised by the review.by acceptance case13
  (`vibe-override contract stdout`), which confirms mascot + artifact both render from the declared
  block.
