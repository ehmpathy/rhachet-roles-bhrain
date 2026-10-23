import * as fs from 'fs/promises';
import { UnexpectedCodePathError } from 'helpful-errors';

import { asReadsByGroup } from '@src/domain.operations/review/asReadsByGroup';
import { BOUND_OF_CONCURRENT_DESCRIPTORS } from '@src/domain.operations/review/BOUND_OF_CONCURRENT_DESCRIPTORS';
import { isErrorOfArtifactReadFault } from '@src/domain.operations/review/isErrorOfArtifactReadFault';
import { asPathAbsoluteFromCwd } from '@src/utils/asPathAbsoluteFromCwd';
import { isErrorOfAbsence } from '@src/utils/fs/isErrorOfAbsence';
import { getAllResultsInBoundedPool } from '@src/utils/getAllResultsInBoundedPool';

/**
 * .what = how many file bodies may be read at one time
 * .why = the subject is the descriptor + threadpool transient, never the
 *        heap. `stepReview` retains all four content arrays at once — rules,
 *        targets, refs, conversation are alive together when the prompt
 *        compiles — so the peak heap is set by retention, and no concurrency
 *        bound lowers it. a wave here frees no payload, since the caller
 *        holds every byte regardless
 *
 * .note = not borrowed from a neighbour. `getAllReviewRunMeters` pours at 8
 *         because each prompt it reads is discarded once its chars are
 *         counted, bounded on heap; that mechanism is absent here. what
 *         remains reachable is exactly `getAllTargetsTouchedAt`'s subject —
 *         the descriptors a fan holds open and the libuv threadpool queue it
 *         floods — so the same subject earns the same number, 64
 *         (rule.prefer.most-common-denominator)
 *
 * .note = the descriptor limit is a process limit (`ulimit -n`), so it is
 *         not reachable in a hermetic test at any honest corpus size. what
 *         is observable, and clamped beside this, is that the wave preserves
 *         every file's content and order
 *
 * .note = the heap half of this hazard stays open, named rather than
 *         implied: the peak drops only with a fold that counts and discards
 *         as it goes, never a cap on concurrent reads. deferred as fulcrum
 *         F6, caught as a dream beside it
 */
const BOUND_OF_CONCURRENT_READS = BOUND_OF_CONCURRENT_DESCRIPTORS;

/**
 * .what = reads SEVERAL named lists of file bodies, in ONE bounded pour, and hands each
 *         list back under the name it was asked for — each in the order asked
 *
 * .why = groups, not one list — so the bound is a property of this call, never
 *        a caller's restraint. `stepReview` needs four content lists (rules,
 *        refs, targets, conversation); a shape with four separate calls could
 *        fan out to 4x the descriptor bound with no clamp catching it across
 *        the four. one pour cannot be fanned that way, since there is no
 *        second call to fan it with (`rule.require.fewer-paths-via-idempotency`
 *        — shape the operation so the hazard cannot be expressed)
 *
 * .note = the pour's peak is clamped one layer down —
 *         `getAllResultsInBoundedPool.test [case1]` asserts `inflightPeak === bound`.
 *         what remains is arity — exactly one pour — enforced by the type: the
 *         single-list export does not exist, so a caller cannot write a
 *         multi-call shape at all
 *
 * .note = one communicator owes the bound's justification once, where a reader
 *         looks for it, rather than at each call site
 *         (rule.prefer.most-common-denominator)
 *
 * .note = every read failure throws, absence included. these files were
 *         enumerated moments earlier by the same command, so a file that will
 *         not open is a server fault, never a caller fault — a bare catch
 *         would hand the prompt an empty rule or target and review naught,
 *         confidently (rule.forbid.failhide). `getOneFileText` grades absence
 *         to null on purpose; that is a different contract, for artifacts
 *         that legitimately may be gone
 *
 * .note = an absolute path is read as-is. `path.join(cwd, abs)` concatenates
 *         rather than resets, which yields a doubled path that can never exist
 */
export const getAllFileContentsByGroup = async <TGroup extends string>(input: {
  cwd: string;
  /** the named lists to read — one entry per group, each a list of paths */
  groups: Record<TGroup, string[]>;
}): Promise<Record<TGroup, Array<{ path: string; content: string }>>> => {
  // .note = the group order is fixed HERE and read by both halves below, so the
  //         flatten and the split cannot walk the lists in different orders
  // .note = the `as` is the documented exception `rule.forbid.as-cast` permits:
  //         `Object.keys` is typed `(o: object) => string[]` on purpose, so TS
  //         cannot soundly narrow it. `input.groups` is a `Record<TGroup, …>`, so
  //         its keys provably are `TGroup`
  const names = Object.keys(input.groups) as TGroup[];

  const paths = names.flatMap((name) => input.groups[name]);

  const reads = await getAllResultsInBoundedPool({
    items: paths,
    bound: BOUND_OF_CONCURRENT_READS,
    map: async (one) => ({
      path: one,
      content: await getOneFileContent({ cwd: input.cwd, path: one }),
    }),
  });

  return asReadsByGroup({ names, groups: input.groups, reads });
};

/**
 * .what = reads one file's utf-8 body, relative to cwd unless already absolute
 * .why = the per-file boundary, so the path rule and the failure grade sit in exactly
 *        one place rather than at each of the four call sites
 */
const getOneFileContent = async (input: {
  cwd: string;
  path: string;
}): Promise<string> => {
  const full = asPathAbsoluteFromCwd({ path: input.path, cwd: input.cwd });

  try {
    return await fs.readFile(full, 'utf-8');
  } catch (error) {
    // only a fault of the read itself takes the wrap — absence, or a read fault of the
    // file. every other throw (a code defect, an engine fault) surfaces as itself, so it
    // is never dressed as a read fault. both gates read the errno by SHAPE, never by
    // `instanceof Error`, so a fault from another module realm still takes the wrap
    if (!isErrorOfAbsence({ error }) && !isErrorOfArtifactReadFault({ error }))
      throw error;

    // .note = UnexpectedCodePathError maps to exit 1, distinct from BadRequestError
    //         (exit 2): a file we just enumerated is a server fault, never the caller's
    throw new UnexpectedCodePathError(`failed to read file: ${input.path}`, {
      file: input.path,
      fullPath: full,
      error: String(error),
    });
  }
};
