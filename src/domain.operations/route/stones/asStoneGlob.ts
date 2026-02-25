import { BadRequestError } from 'helpful-errors';

import type { RouteStone } from '@src/domain.objects/Driver/RouteStone';

/**
 * .what = converts raw user input into a proper stone glob pattern
 * .why = enables natural word input without glob syntax knowledge
 *
 * .note = @all is an alias for * (avoids shell expansion issues)
 *         if pattern has no glob chars (* or ?), wraps with *...*
 *         if pattern already has glob chars, passes through as-is
 */
export const asStoneGlob = (input: {
  pattern: string;
}): { glob: string; raw: string } => {
  // handle @all alias for * (avoids shell glob expansion)
  if (input.pattern === '@all') return { glob: '*', raw: '@all' };

  const hasGlobChars =
    input.pattern.includes('*') || input.pattern.includes('?');
  if (hasGlobChars) return { glob: input.pattern, raw: input.pattern };
  return { glob: `*${input.pattern}*`, raw: input.pattern };
};

/**
 * .what = matches a stone name against a stone glob pattern
 * .why = enables filter of stones by glob
 */
export const isStoneInGlob = (input: {
  name: string;
  glob: string;
}): boolean => {
  // convert glob pattern to regex
  const regexStr = input.glob
    .replace(/\./g, '\\.')
    .replace(/\*/g, '.*')
    .replace(/\?/g, '.');
  const regex = new RegExp(`^${regexStr}$`);
  return regex.test(input.name);
};

/**
 * .what = finds exactly one stone by pattern
 * .why = enables flexible stone lookup with failfast for ambiguous patterns
 *
 * .note = uses asStoneGlob for pattern expansion (auto-wrap if no glob chars)
 *         throws BadRequestError if multiple stones match
 */
export const findOneStoneByPattern = (input: {
  stones: RouteStone[];
  pattern: string;
}): RouteStone | null => {
  // expand pattern via asStoneGlob (auto-wrap if no glob chars)
  const { glob } = asStoneGlob({ pattern: input.pattern });

  // find all stones that match
  const matched = input.stones.filter((s) =>
    isStoneInGlob({ name: s.name, glob }),
  );

  // failfast if more than one match
  if (matched.length > 1) {
    throw new BadRequestError(
      `pattern "${input.pattern}" matched ${matched.length} stones; be more specific`,
      { pattern: input.pattern, matched: matched.map((s) => s.name) },
    );
  }

  return matched[0] ?? null;
};
