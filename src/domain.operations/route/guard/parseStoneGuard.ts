import * as fs from 'fs/promises';

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

  // parse simple yaml format
  const parsed = parseSimpleYaml(content);

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
const parseSimpleYaml = (
  content: string,
): {
  artifacts?: string[];
  reviews?: string[];
  judges?: string[];
} => {
  const result: {
    artifacts?: string[];
    reviews?: string[];
    judges?: string[];
  } = {};

  const lines = content.split('\n');
  let currentKey: 'artifacts' | 'reviews' | 'judges' | null = null;

  for (const line of lines) {
    const trimmed = line.trim();

    // skip empty lines and comments
    if (!trimmed || trimmed.startsWith('#')) continue;

    // check for key declaration
    if (trimmed === 'artifacts:') {
      currentKey = 'artifacts';
      result.artifacts = [];
      continue;
    }
    if (trimmed === 'reviews:') {
      currentKey = 'reviews';
      result.reviews = [];
      continue;
    }
    if (trimmed === 'judges:') {
      currentKey = 'judges';
      result.judges = [];
      continue;
    }

    // check for list item
    if (trimmed.startsWith('- ') && currentKey) {
      const value = trimmed.slice(2).trim();
      result[currentKey]?.push(value);
    }
  }

  return result;
};
