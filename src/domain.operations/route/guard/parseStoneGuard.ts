import * as fs from 'fs/promises';
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
    reviews: parsed.reviews ?? [],
    judges: parsed.judges ?? [],
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
  reviews?: RouteStoneGuardReviewPeer[] | RouteStoneGuardReviewsStructured;
  judges?: string[];
}> => {
  const result: {
    artifacts?: string[];
    reviews?: RouteStoneGuardReviewPeer[] | RouteStoneGuardReviewsStructured;
    judges?: string[];
  } = {};

  const lines = content.split('\n');
  let currentKey: 'artifacts' | 'reviews' | 'judges' | null = null;
  let currentSubKey: 'self' | 'peer' | null = null;
  let structuredReviews: RouteStoneGuardReviewsStructured | null = null;
  let flatReviews: string[] | null = null;
  let currentSelfReview: Partial<RouteStoneGuardReviewSelf> | null = null;
  let inMultilineSay = false;
  let multilineSayContent: string[] = [];

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

      if (currentKey === 'artifacts') {
        result.artifacts?.push(value);
      } else if (currentKey === 'judges') {
        result.judges?.push(value);
      } else if (currentKey === 'reviews') {
        if (currentSubKey === 'peer') {
          structuredReviews?.peer.push(value);
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
          } catch {
            throw new Error(
              `failed to expand @path reference: ${refPath} (full path: ${fullPath})`,
            );
          }
          if (currentSelfReview.slug && currentSelfReview.say) {
            structuredReviews?.self.push(
              currentSelfReview as RouteStoneGuardReviewSelf,
            );
            currentSelfReview = null;
          }
        } else {
          // inline say value
          currentSelfReview.say = sayValue.replace(/^"/, '').replace(/"$/, '');
          if (currentSelfReview.slug && currentSelfReview.say) {
            structuredReviews?.self.push(
              currentSelfReview as RouteStoneGuardReviewSelf,
            );
            currentSelfReview = null;
          }
        }
      }
    }
  }

  // handle any final multiline content
  if (inMultilineSay && currentSelfReview) {
    currentSelfReview.say = multilineSayContent.join('\n').trim();
    if (currentSelfReview.slug && currentSelfReview.say && structuredReviews) {
      structuredReviews.self.push(
        currentSelfReview as RouteStoneGuardReviewSelf,
      );
    }
  }

  // set reviews based on what was parsed
  if (structuredReviews) {
    result.reviews = structuredReviews;
  } else if (flatReviews) {
    result.reviews = flatReviews;
  }

  return result;
};
