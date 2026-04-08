import { Coverage } from '@src/domain.objects/Achiever/Coverage';

/**
 * .what = creates a Coverage fixture with sensible defaults
 * .why = eliminates manual construction in tests
 */
export const createCoverageFixture = (
  overrides: Partial<{
    hash: string;
    goalSlug: string;
    coveredAt: string;
  }> = {},
): Coverage => {
  const now = new Date().toISOString();

  return new Coverage({
    hash: overrides.hash ?? 'abc123',
    goalSlug: overrides.goalSlug ?? 'test-goal',
    coveredAt: overrides.coveredAt ?? now,
  });
};
