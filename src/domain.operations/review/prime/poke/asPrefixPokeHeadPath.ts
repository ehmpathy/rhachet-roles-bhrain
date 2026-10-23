import * as crypto from 'crypto';
import * as path from 'path';

/**
 * .what = where the review's pokes leave the heads they ride on
 * .why = a poke's head must reach the brain as a brief, and a brief is a file. it sits under
 *        `.agent/.cache/`, beside the watermarks, never in a run's own log dir, which is that
 *        run's record
 */
export const DIR_OF_PREFIX_POKES = path.join(
  '.agent',
  '.cache',
  'repo=bhrain',
  'role=reviewer',
  'skill=review',
  'pokes',
);

/**
 * .what = where a poke writes the head it rides on — one file per HEAD, under its reviewer
 * .why = two lanes of one reviewer may prime two heads at once. a path keyed by the reviewer
 *        alone is shared by both, so one could overwrite the other's head between the write
 *        and the ask that reads it back — and pin a replica for a prefix it does not prime.
 *        keyed by the head's digest, two heads never share a file, and two pokes of one head
 *        write the same bytes
 *
 * .note = the reviewer slug comes from outside (a guard's output path), so it is reduced to
 *         one safe path segment; a traversal would plant the head at an arbitrary path
 *
 * .note = the digest names the file; the pin itself derives from the brief's TEXT, so the
 *         path costs the pin naught
 */
export const asPrefixPokeHeadPath = (input: {
  cwd: string;
  reviewer: string;
  head: string;
}): string =>
  path.join(
    input.cwd,
    DIR_OF_PREFIX_POKES,
    `reviewer=${input.reviewer.replace(/[^a-z0-9._-]/gi, '-')}`,
    `poke.prompt.head.${crypto.createHash('sha256').update(input.head).digest('hex').slice(0, 16)}.md`,
  );
