import * as fs from 'fs/promises';
import * as path from 'path';

import { RouteStoneGuardReviewPeerMeter } from '@src/domain.objects/Driver/RouteStoneGuardReviewPeerMeter';

/**
 * .what = reads all review peer meters for a stone from reviewPeerMeters.jsonl
 * .why = enables budget state lookup for all reviewers of a specific stone
 *
 * .note = reviewPeerMeters.jsonl is append-only with last-entry-wins per (stone, slug)
 */
export const getAllRouteStoneGuardReviewPeerMeters = async (input: {
  route: string;
  stone: string;
}): Promise<RouteStoneGuardReviewPeerMeter[]> => {
  const metersPath = path.join(input.route, '.route', 'reviewPeerMeters.jsonl');

  // check if file found
  const fileFound = await fs
    .access(metersPath)
    .then(() => true)
    .catch(() => false);
  if (!fileFound) return [];

  // read and parse all entries
  const content = await fs.readFile(metersPath, 'utf-8');
  const allMeters = content
    .split('\n')
    .filter(Boolean)
    .map((line) => new RouteStoneGuardReviewPeerMeter(JSON.parse(line)));

  // filter to this stone, last entry wins per slug
  const latestBySlug = new Map<string, RouteStoneGuardReviewPeerMeter>();
  for (const meter of allMeters) {
    if (meter.stone === input.stone) {
      latestBySlug.set(meter.reviewer.slug, meter);
    }
  }

  return Array.from(latestBySlug.values());
};
