import { createHash } from 'crypto';

import { Ask } from '@src/domain.objects/Achiever/Ask';

/**
 * .what = creates an Ask fixture with sensible defaults
 * .why = eliminates manual hash computation in tests
 */
export const createAskFixture = (
  overrides: Partial<{
    content: string;
    receivedAt: string;
  }> = {},
): Ask => {
  const content = overrides.content ?? 'test ask content';
  const hash = createHash('sha256').update(content).digest('hex');
  const now = new Date().toISOString();

  return new Ask({
    hash,
    content,
    receivedAt: overrides.receivedAt ?? now,
  });
};
