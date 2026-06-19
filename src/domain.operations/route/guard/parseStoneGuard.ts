import * as fs from 'fs/promises';
import { BadRequestError } from 'helpful-errors';
import { type IsoDuration, toMilliseconds } from 'iso-time';
import * as path from 'path';

import type {
  RouteStoneGuardReviewPeer,
  RouteStoneGuardReviewSelf,
  RouteStoneGuardReviewsStructured,
} from '@src/domain.objects/Driver/RouteStoneGuard';
import { RouteStoneGuard } from '@src/domain.objects/Driver/RouteStoneGuard';

/**
 * .what = parses a guard file into a RouteStoneGuard object
 * .why = enables guard configuration to be read and validated
 */
export const parseStoneGuard = async (input: {
  path: string;
}): Promise<RouteStoneGuard> => {
  // read file content
  const content = await fs.readFile(input.path, 'utf-8');

  // get directory for @path references
  const guardDir = path.dirname(input.path);

  // parse simple yaml format
  const parsed = await parseSimpleYaml(content, guardDir);

  // construct guard with defaults
  return new RouteStoneGuard({
    path: input.path,
    artifacts: parsed.artifacts ?? [],
    reviews: parsed.reviews ?? { self: [], peer: [] },
    judges: parsed.judges ?? [],
    protect: parsed.protect ?? [],
  });
};

/**
 * .what = ensures all peer review slugs are unique via .N suffix for collisions
 * .why = downstream code can use slug as stable key without collision
 * .note = if slug is already unique, leaves it as-is; adds suffix only when collision detected
 */
const standardizePeerReviewSlugs = (input: {
  peers: RouteStoneGuardReviewPeer[];
}): RouteStoneGuardReviewPeer[] => {
  // count occurrences of each slug
  const slugCounts = new Map<string, number>();
  for (const peer of input.peers) {
    slugCounts.set(peer.slug, (slugCounts.get(peer.slug) ?? 0) + 1);
  }

  // track which slugs have collisions and their current index
  const slugIndices = new Map<string, number>();

  // process each peer, add suffix only for collisions
  return input.peers.map((peer) => {
    const count = slugCounts.get(peer.slug) ?? 1;

    // if unique, leave as-is
    if (count === 1) return peer;

    // collision detected: add .N suffix (1-indexed)
    const index = (slugIndices.get(peer.slug) ?? 0) + 1;
    slugIndices.set(peer.slug, index);

    return {
      ...peer,
      slug: `${peer.slug}.${index}`,
    };
  });
};

/**
 * .what = parses simple yaml with list values
 * .why = handles guard file format without external yaml dependency
 */
const parseSimpleYaml = async (
  content: string,
  guardDir: string,
): Promise<{
  artifacts?: string[];
  reviews?: RouteStoneGuardReviewsStructured;
  judges?: string[];
  protect?: string[];
}> => {
  const result: {
    artifacts?: string[];
    reviews?: RouteStoneGuardReviewsStructured;
    judges?: string[];
    protect?: string[];
  } = {};

  const lines = content.split('\n');
  let currentKey: 'artifacts' | 'reviews' | 'judges' | 'protect' | null = null;
  let currentSubKey: 'self' | 'peer' | null = null;
  let structuredReviews: RouteStoneGuardReviewsStructured | null = null;
  let flatReviews: string[] | null = null;
  let currentSelfReview: Partial<RouteStoneGuardReviewSelf> | null = null;
  let currentPeerReview: Partial<RouteStoneGuardReviewPeer> | null = null;
  let inMultilineSay = false;
  let multilineSayContent: string[] = [];

  /**
   * .what = finalizes and stores the current peer review if complete
   * .why = enables structured peer reviews with slug, run, budget, level, timeout
   * .note = budget defaults to Infinity (unlimited) for backwards compat
   */
  const finalizePeerReview = () => {
    if (
      currentPeerReview?.slug &&
      currentPeerReview?.run &&
      structuredReviews
    ) {
      structuredReviews.peer = structuredReviews.peer ?? [];
      structuredReviews.peer.push({
        slug: currentPeerReview.slug,
        run: currentPeerReview.run,
        budget: currentPeerReview.budget ?? Infinity,
        level: currentPeerReview.level ?? 1,
        timeout: currentPeerReview.timeout,
      });
    }
    currentPeerReview = null;
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line?.trim() ?? '';
    const indent = (line?.match(/^(\s*)/)?.[1] ?? '').length;

    // handle multiline say content
    if (inMultilineSay) {
      // check if we're still in the multiline block (indented content)
      if (indent >= 6 || trimmed === '') {
        multilineSayContent.push(line?.slice(6) ?? '');
        continue;
      } else {
        // end of multiline, save the content
        if (currentSelfReview) {
          currentSelfReview.say = multilineSayContent.join('\n').trim();
          if (
            currentSelfReview.slug &&
            currentSelfReview.say &&
            structuredReviews
          ) {
            structuredReviews.self = structuredReviews.self ?? [];
            structuredReviews.self.push(
              currentSelfReview as RouteStoneGuardReviewSelf,
            );
          }
        }
        inMultilineSay = false;
        multilineSayContent = [];
        currentSelfReview = null;
      }
    }

    // skip empty lines and comments
    if (!trimmed || trimmed.startsWith('#')) continue;

    // check for key declaration
    if (trimmed === 'artifacts:') {
      currentKey = 'artifacts';
      currentSubKey = null;
      result.artifacts = [];
      continue;
    }
    if (trimmed === 'reviews:') {
      currentKey = 'reviews';
      currentSubKey = null;
      continue;
    }
    if (trimmed === 'judges:') {
      currentKey = 'judges';
      currentSubKey = null;
      result.judges = [];
      continue;
    }
    if (trimmed === 'protect:') {
      currentKey = 'protect';
      currentSubKey = null;
      result.protect = [];
      continue;
    }

    // check for reviews sub-keys (structured format)
    if (currentKey === 'reviews') {
      if (trimmed === 'self:') {
        if (!structuredReviews) {
          structuredReviews = { self: [], peer: [] };
        }
        currentSubKey = 'self';
        continue;
      }
      if (trimmed === 'peer:') {
        if (!structuredReviews) {
          structuredReviews = { self: [], peer: [] };
        }
        currentSubKey = 'peer';
        continue;
      }
    }

    // check for list item
    if (trimmed.startsWith('- ') && currentKey) {
      const value = trimmed.slice(2).trim();

      // strip outer quotes (yaml string delimiters)
      const unquoted = value.replace(/^["'](.*)["']$/, '$1');

      if (currentKey === 'artifacts') {
        result.artifacts?.push(unquoted);
      } else if (currentKey === 'judges') {
        result.judges?.push(value);
      } else if (currentKey === 'protect') {
        result.protect?.push(value);
      } else if (currentKey === 'reviews') {
        if (currentSubKey === 'peer') {
          // check for start of structured peer review (- slug: ...)
          if (value.startsWith('slug:')) {
            // finalize any prior peer review in progress
            finalizePeerReview();
            currentPeerReview = {
              slug: value.slice(5).trim(),
            };
          } else if (structuredReviews) {
            // legacy string format under peer: section - convert to structured
            structuredReviews.peer = structuredReviews.peer ?? [];
            structuredReviews.peer.push({
              slug:
                value.split(/\s+/)[0] ??
                `peer-${structuredReviews.peer.length + 1}`,
              run: value,
              budget: Infinity,
              level: 1,
            });
          }
        } else if (currentSubKey === 'self') {
          // start of a new self review object (- slug: ...)
          if (value.startsWith('slug:')) {
            currentSelfReview = {
              slug: value.slice(5).trim(),
            };
          }
        } else {
          // flat reviews array (backwards compat)
          if (!flatReviews) {
            flatReviews = [];
          }
          flatReviews.push(value);
        }
      }
      continue;
    }

    // handle self review object properties
    if (currentSubKey === 'self' && currentSelfReview) {
      if (trimmed.startsWith('slug:')) {
        currentSelfReview.slug = trimmed.slice(5).trim();
      } else if (trimmed.startsWith('say:')) {
        const sayValue = trimmed.slice(4).trim();
        if (sayValue === '|') {
          // multiline say
          inMultilineSay = true;
          multilineSayContent = [];
        } else if (sayValue.startsWith('"@') || sayValue.startsWith('@')) {
          // @path reference - expand it
          const refPath = sayValue.replace(/^"?@/, '').replace(/"$/, '');
          const fullPath = path.join(guardDir, refPath);
          try {
            currentSelfReview.say = await fs.readFile(fullPath, 'utf-8');
          } catch (error) {
            throw new BadRequestError(
              `failed to expand @path reference: ${refPath}`,
              {
                refPath,
                fullPath,
                cause: error instanceof Error ? error : undefined,
              },
            );
          }
          if (
            currentSelfReview.slug &&
            currentSelfReview.say &&
            structuredReviews
          ) {
            structuredReviews.self = structuredReviews.self ?? [];
            structuredReviews.self.push(
              currentSelfReview as RouteStoneGuardReviewSelf,
            );
            currentSelfReview = null;
          }
        } else {
          // inline say value
          currentSelfReview.say = sayValue.replace(/^"/, '').replace(/"$/, '');
          if (
            currentSelfReview.slug &&
            currentSelfReview.say &&
            structuredReviews
          ) {
            structuredReviews.self = structuredReviews.self ?? [];
            structuredReviews.self.push(
              currentSelfReview as RouteStoneGuardReviewSelf,
            );
            currentSelfReview = null;
          }
        }
      }
    }

    // handle peer review object properties
    if (currentSubKey === 'peer' && currentPeerReview) {
      if (trimmed.startsWith('slug:')) {
        currentPeerReview.slug = trimmed.slice(5).trim();
      } else if (trimmed.startsWith('run:')) {
        currentPeerReview.run = trimmed.slice(4).trim();
      } else if (trimmed.startsWith('budget:')) {
        currentPeerReview.budget = parseInt(trimmed.slice(7).trim(), 10);
      } else if (trimmed.startsWith('level:')) {
        currentPeerReview.level = parseInt(trimmed.slice(6).trim(), 10);
      } else if (trimmed.startsWith('timeout:')) {
        // strip quotes from timeout value (yaml string delimiters)
        const rawTimeout = trimmed.slice(8).trim();
        const timeout = rawTimeout.replace(
          /^["'](.*)["']$/,
          '$1',
        ) as IsoDuration;

        // validate timeout is valid IsoDuration with positive value
        try {
          const ms = toMilliseconds(timeout);
          if (ms <= 0) {
            throw new BadRequestError(`timeout must be positive: ${timeout}`, {
              timeout,
              ms,
            });
          }
        } catch (error) {
          if (error instanceof BadRequestError) throw error;
          throw new BadRequestError(`invalid timeout format: ${timeout}`, {
            timeout,
            cause: error instanceof Error ? error : undefined,
          });
        }

        currentPeerReview.timeout = timeout;
      }
    }
  }

  // finalize any pending peer review
  finalizePeerReview();

  // handle any final multiline content
  if (inMultilineSay && currentSelfReview) {
    currentSelfReview.say = multilineSayContent.join('\n').trim();
    if (currentSelfReview.slug && currentSelfReview.say && structuredReviews) {
      structuredReviews.self = structuredReviews.self ?? [];
      structuredReviews.self.push(
        currentSelfReview as RouteStoneGuardReviewSelf,
      );
    }
  }

  // set reviews based on what was parsed
  // convert flat reviews (legacy string format) to structured format at parse time
  // .why = eliminates parallel code paths; single format everywhere downstream
  if (structuredReviews) {
    result.reviews = structuredReviews;
  } else if (flatReviews) {
    // flat reviews: each string becomes a structured review with defaults
    result.reviews = {
      self: [],
      peer: flatReviews.map((cmd, index) => ({
        slug: cmd.split(/\s+/)[0] ?? `peer-${index + 1}`,
        run: cmd,
        budget: Infinity,
        level: 1,
      })),
    };
  }

  // standardize peer review slugs to guarantee uniqueness
  // .why = downstream code can use slug as stable key without collision
  if (result.reviews?.peer) {
    result.reviews.peer = standardizePeerReviewSlugs({
      peers: result.reviews.peer,
    });
  }

  return result;
};
