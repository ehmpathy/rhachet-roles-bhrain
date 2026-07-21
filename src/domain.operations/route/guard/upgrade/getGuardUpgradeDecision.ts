/**
 * .what = the per-guard upgrade decision, as a discriminated union
 * .why = every outcome is a VALUE (no throws in the decide phase); the one fatal gate
 *   lives at the route level under apply. 'unknown-var' carries its offenders so the
 *   renderer + error can name them.
 */
export type GuardUpgradeDecision =
  | {
      decision:
        | 'skipped'
        | 'kept'
        | 'upgrade'
        | 'absent-source'
        | 'invalid-source';
    }
  | { decision: 'unknown-var'; vars: string[] };

/**
 * .what = decides a guard's upgrade outcome from its provenance, source, and vars
 * .why = ONE honest source of truth for the tree renderer + the apply gate. the
 *   discriminated `source` input makes illegal states unrepresentable: a found source
 *   REQUIRES `next` + `valid`, an absent one forbids them.
 *
 * precedence: no provenance ⟹ skipped; source absent ⟹ absent-source; source invalid
 *   ⟹ invalid-source; any unknown var ⟹ unknown-var; identical ⟹ kept; else upgrade.
 */
export const getGuardUpgradeDecision = (input: {
  provenance: { uri: string } | null;
  source: { found: true; next: string; valid: boolean } | { found: false };
  unknownVars: string[];
  current: string;
}): GuardUpgradeDecision => {
  // no provenance ⟹ never guessed at
  if (!input.provenance) return { decision: 'skipped' };

  // the source template could not be read
  if (!input.source.found) return { decision: 'absent-source' };

  // the fetched source does not parse as a valid guard (D6)
  if (!input.source.valid) return { decision: 'invalid-source' };

  // a $VAR outside the runtime allowlist survived the copy-time replay
  if (input.unknownVars.length > 0)
    return { decision: 'unknown-var', vars: input.unknownVars };

  // identical after replay ⟹ no write. an EOF-newline-only delta is treated as
  // identical (A6) so a cosmetic newline difference is not a false 'upgrade'. note:
  // CRLF vs LF is a SEPARATE, deliberately-documented false-positive (i013 CRLF cut),
  // not smoothed here.
  const stripEndNewlines = (text: string): string => text.replace(/\n+$/, '');
  if (stripEndNewlines(input.current) === stripEndNewlines(input.source.next))
    return { decision: 'kept' };

  // differs ⟹ an upgrade is available
  return { decision: 'upgrade' };
};
