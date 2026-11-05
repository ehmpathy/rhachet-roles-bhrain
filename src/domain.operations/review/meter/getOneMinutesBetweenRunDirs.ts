import * as path from 'path';

import { asLogDirMintedAt } from '@src/domain.operations/review/asLogDirMintedAt';
import { getOneMinutesElapsed } from '@src/domain.operations/review/meter/getOneMinutesElapsed';

/**
 * .what = the minutes from one run's mint to a later run's, read off their log dir names
 *         — null where either name carries no readable stamp
 * .why = the gap parts a `lapsed` pair from a `missed` one. an unreadable stamp reads as
 *        the epoch (`asLogDirMintedAt`), which would turn a gap of minutes into one of
 *        decades and grade every such pair `lapsed`; so the epoch reads as unknown here,
 *        never as a gap (rule.forbid.failhide)
 */
export const getOneMinutesBetweenRunDirs = (input: {
  since: string;
  until: string;
}): number | null => {
  const since = asLogDirMintedAt({ name: path.basename(input.since) });
  const until = asLogDirMintedAt({ name: path.basename(input.until) });
  if (since.getTime() === 0 || until.getTime() === 0) return null;
  return getOneMinutesElapsed({ since, until });
};
