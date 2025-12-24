import { BadRequestError } from 'helpful-errors';

import { ReviewerReflectManifestOperation } from '@src/domain.objects/ManifestOperation';
import {
  ReviewerReflectManifest,
  type ReviewerReflectManifestEntry,
} from '@src/domain.objects/ReflectManifest';

/**
 * .what = parses manifest.json content to ReflectManifest
 * .why = validates and types manifest from brain output
 */
export const parseManifestOperations = (input: {
  content: string;
}): ReviewerReflectManifest => {
  // parse JSON
  let parsed: unknown;
  try {
    parsed = JSON.parse(input.content);
  } catch (error) {
    throw new BadRequestError('manifest.json is not valid JSON', {
      error: error instanceof Error ? error.message : String(error),
    });
  }

  // validate structure
  if (!parsed || typeof parsed !== 'object')
    throw new BadRequestError('manifest.json must be an object');

  const manifest = parsed as Record<string, unknown>;

  // validate timestamp
  if (typeof manifest.timestamp !== 'string')
    throw new BadRequestError('manifest.json must have timestamp string');

  // validate pureRules array
  if (!Array.isArray(manifest.pureRules))
    throw new BadRequestError('manifest.json must have pureRules array');

  // validate each entry
  const pureRules: ReviewerReflectManifestEntry[] = manifest.pureRules.map(
    (entry: unknown, index: number) => {
      if (!entry || typeof entry !== 'object')
        throw new BadRequestError(`pureRules[${index}] must be an object`);

      const e = entry as Record<string, unknown>;

      // validate path
      if (typeof e.path !== 'string')
        throw new BadRequestError(`pureRules[${index}].path must be a string`);

      // validate operation
      if (!isValidOperation(e.operation))
        throw new BadRequestError(
          `pureRules[${index}].operation must be OMIT, SET_CREATE, SET_UPDATE, or SET_APPEND`,
          { operation: e.operation },
        );

      // validate syncPath for non-OMIT operations
      if (e.operation !== 'OMIT' && typeof e.syncPath !== 'string')
        throw new BadRequestError(
          `pureRules[${index}].syncPath required for ${e.operation} operation`,
        );

      // validate reason for OMIT
      if (e.operation === 'OMIT' && typeof e.reason !== 'string')
        throw new BadRequestError(
          `pureRules[${index}].reason required for OMIT operation`,
        );

      return {
        path: e.path,
        operation: e.operation as ReviewerReflectManifestOperation,
        syncPath: e.syncPath as string | undefined,
        existingPath: e.existingPath as string | undefined,
        reason: e.reason as string | undefined,
      };
    },
  );

  return new ReviewerReflectManifest({
    timestamp: manifest.timestamp as string,
    pureRules,
  });
};

/**
 * .what = validates operation is a known ManifestOperation
 * .why = ensures type safety for manifest entries
 */
const isValidOperation = (operation: unknown): boolean => {
  return (
    operation === ReviewerReflectManifestOperation.OMIT ||
    operation === ReviewerReflectManifestOperation.SET_CREATE ||
    operation === ReviewerReflectManifestOperation.SET_UPDATE ||
    operation === ReviewerReflectManifestOperation.SET_APPEND
  );
};
